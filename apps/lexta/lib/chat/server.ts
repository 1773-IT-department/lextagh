// Live chat, the website server's side (scoreboard item 22).
//
// Plain server code with no Next.js imports, so the local harness test (supabase/tests/local/live-chat) runs the very
// same function. The route handler app/api/chat/route.ts is a thin wrapper around handleChat.
//
// The browser talks only to this server (POST /api/chat); it never calls Supabase for the chat. This server signs
// every call with CHAT_INTAKE_SECRET (shared only with the database; never sent to the browser): HMAC SHA-256 over
// "chat.<new uuid>.<unix seconds>.<visitor IP hash>". The IP hash is an HMAC of the visitor key (IPv4 address, or
// IPv6 /64) with the same secret, so the raw address never leaves this server. The database checks the signature,
// the token and the limits (supabase/migrations/0009_live_chat.sql). Publishable key only.
// A filled honeypot gets a reply shaped like a real start, and nothing reaches the database.
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { CHAT_LIMITS, chatRead, chatSend, chatStart, type ChatFailure, type ChatSignedRequest, type ChatVisitorMessage } from "@lexta/db";
import { visitorKey } from "../visitor";
import { CHAT_SUPPORT_EMAIL } from "./hours";

/** Name of the hidden spam trap field on the start form. People never see or fill it. */
export const CHAT_HONEYPOT_FIELD = "website";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN_RE = /^[0-9a-f]{64}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/;

export const CHAT_MESSAGES = {
  unavailable: `Chat is not available right now. Please email ${CHAT_SUPPORT_EMAIL}.`,
  generic: `Sorry, that did not go through. Please try again in a moment, or email ${CHAT_SUPPORT_EMAIL}.`,
  ended: "This chat has ended. You can start a new one.",
  tooFast: "You are sending messages very quickly. Please wait a moment and try again.",
  full: `This chat has reached its length limit. Please start a new chat, or email ${CHAT_SUPPORT_EMAIL}.`,
  busy: `Chat is very busy right now. Please try again in a few minutes, or email ${CHAT_SUPPORT_EMAIL}.`,
  limited: `Too many chats or messages from your connection. Please try again later, or email ${CHAT_SUPPORT_EMAIL}.`,
  check: "Please check the highlighted fields.",
} as const;

export const CHAT_FIELD_MESSAGES: Record<string, string> = {
  name: `Please enter your name (up to ${CHAT_LIMITS.name} characters).`,
  email: "Please enter a valid email address, or leave it empty.",
  phone: "Please enter a valid phone number, for example +233 24 123 4567, or leave it empty.",
  message: `Please write a message (up to ${CHAT_LIMITS.message} characters).`,
};

export type ChatApiResponse =
  | { ok: true; conversationId: string; token: string; reference: string }
  | { ok: true; id: string; seq: number; createdAt: string }
  | { ok: true; reference: string; status: string; messages: ChatVisitorMessage[] }
  | { ok: false; code: "invalid" | "rate_limited" | "not_found" | "unavailable" | "error"; message: string; fieldErrors?: Record<string, string> };

type Result = { status: number; body: ChatApiResponse };

/** The shared secret, or null when the site has none (then chat says it is not available). */
const chatSecret = () => {
  const s = process.env.CHAT_INTAKE_SECRET ?? "";
  return s.length >= 32 ? s : null;
};
const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

/** The signed request for one chat call. visitor is visitorKey() of the visitor's address; it is hashed here. */
export function signChatRequest(secret: string, visitor: string, nonce: string = randomUUID(), now = Date.now()): ChatSignedRequest {
  const issuedAt = Math.floor(now / 1000);
  const ipHash = createHmac("sha256", secret).update(`chat-ip:${visitor}`).digest("hex");
  const signature = createHmac("sha256", secret).update(`chat.${nonce}.${issuedAt}.${ipHash}`).digest("hex");
  return { nonce, issuedAt, ipHash, signature };
}

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

const err = (status: number, code: Extract<ChatApiResponse, { ok: false }>["code"], message: string, fieldErrors?: Record<string, string>): Result =>
  ({ status, body: { ok: false, code, message, ...(fieldErrors ? { fieldErrors } : {}) } });

function fromFailure(f: ChatFailure): Result {
  switch (f.reason) {
    case "invalid": {
      const field = f.field ?? "";
      if (CHAT_FIELD_MESSAGES[field]) return err(400, "invalid", CHAT_MESSAGES.check, { [field]: CHAT_FIELD_MESSAGES[field] });
      return err(400, "invalid", CHAT_MESSAGES.generic);
    }
    case "rate_limited": {
      const m = f.message;
      const text = /message limit/.test(m) ? CHAT_MESSAGES.full : /wait a moment/.test(m) ? CHAT_MESSAGES.tooFast : /busy/.test(m) ? CHAT_MESSAGES.busy : CHAT_MESSAGES.limited;
      return err(429, "rate_limited", text);
    }
    case "not_found":
      return err(404, "not_found", CHAT_MESSAGES.ended);
    case "not_configured":
      return err(503, "unavailable", CHAT_MESSAGES.unavailable);
    default:
      return err(502, "error", CHAT_MESSAGES.generic);
  }
}

/** Checks the start form. Exported for the harness test. */
export function checkStart(body: Record<string, unknown>) {
  const v = {
    name: str(body.name),
    email: str(body.email).toLowerCase(),
    phone: str(body.phone),
    message: str(body.message),
    page: str(body.page),
  };
  const errors: Record<string, string> = {};
  if (!v.name || v.name.length > CHAT_LIMITS.name) errors.name = CHAT_FIELD_MESSAGES.name;
  if (v.email && (v.email.length > CHAT_LIMITS.email || !EMAIL_RE.test(v.email))) errors.email = CHAT_FIELD_MESSAGES.email;
  if (v.phone && (v.phone.length > CHAT_LIMITS.phone || !PHONE_RE.test(v.phone))) errors.phone = CHAT_FIELD_MESSAGES.phone;
  if (!v.message || v.message.length > CHAT_LIMITS.message) errors.message = CHAT_FIELD_MESSAGES.message;
  // Only a plain path is kept (no query string, which could carry personal details).
  v.page = /^\/[^\s?#]{0,299}$/.test(v.page) ? v.page : "";
  return { values: v, errors };
}

/**
 * One chat call from the widget. body: { action: "start", id (a new uuid per start), name, email?, phone?, message,
 * page?, website? (honeypot) }
 * or { action: "send", conversationId, token, id (a new uuid per message, so a retry never saves twice), body }
 * or { action: "read", conversationId, token, after }. ip: the visitor's address. Never shows database details.
 */
export async function handleChat(raw: unknown, ctx: { ip: string }): Promise<Result> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return err(400, "invalid", CHAT_MESSAGES.generic);
  const body = raw as Record<string, unknown>;
  const action = body.action;
  if (action !== "start" && action !== "send" && action !== "read") return err(400, "invalid", CHAT_MESSAGES.generic);

  let start: ReturnType<typeof checkStart> | null = null;
  if (action === "start") {
    // A bot filled the hidden field: answer like a success, send nothing on.
    const trap = body[CHAT_HONEYPOT_FIELD];
    if (typeof trap === "string" && trap.trim() !== "") {
      return { status: 200, body: { ok: true, conversationId: randomUUID(), token: randomBytes(32).toString("hex"),
        reference: `LC-${randomBytes(4).toString("hex").toUpperCase()}` } };
    }
    start = checkStart(body);
    if (Object.keys(start.errors).length) return err(400, "invalid", CHAT_MESSAGES.check, start.errors);
  }

  const conversationId = str(body.conversationId);
  const token = str(body.token);
  if (action !== "start" && (!UUID_RE.test(conversationId) || !TOKEN_RE.test(token))) return err(404, "not_found", CHAT_MESSAGES.ended);
  let message = "";
  // The widget sends a new uuid with each start and each message and sends the same one again when it retries, so
  // a retry after a lost answer never saves twice (the database recognises the nonce).
  let nonce = str(body.id);
  if (!UUID_RE.test(nonce)) nonce = randomUUID();
  if (action === "send") {
    message = str(body.body);
    if (!message || message.length > CHAT_LIMITS.message) return err(400, "invalid", CHAT_MESSAGES.check, { message: CHAT_FIELD_MESSAGES.message });
  }
  const after = Number.isSafeInteger(body.after) && (body.after as number) > 0 ? (body.after as number) : 0;

  const secret = chatSecret();
  if (!secret || !configured()) return err(503, "unavailable", CHAT_MESSAGES.unavailable);
  const visitor = visitorKey(ctx.ip);
  // Shared addresses (mobile CGNAT, offices) share one set of limits; see 0009_live_chat.sql.
  if (!visitor) {
    // Everyone without an address must not share one limit, so nothing goes through without one.
    console.warn("[chat] no visitor address; chat call refused");
    return err(503, "unavailable", CHAT_MESSAGES.unavailable);
  }

  try {
    if (action === "start" && start) {
      const v = start.values;
      const r = await chatStart(signChatRequest(secret, visitor, nonce), {
        brand: "lexta", name: v.name, email: v.email || undefined, phone: v.phone || undefined, message: v.message, page: v.page || undefined,
      });
      if (!r.ok) return fromFailure(r);
      return { status: 200, body: { ok: true, conversationId: r.conversationId, token: r.token, reference: r.reference } };
    }
    if (action === "send") {
      const r = await chatSend(signChatRequest(secret, visitor, nonce), conversationId, token, message);
      if (!r.ok) return fromFailure(r);
      return { status: 200, body: { ok: true, id: r.id, seq: r.seq, createdAt: r.createdAt } };
    }
    const r = await chatRead(signChatRequest(secret, visitor), conversationId, token, after);
    if (!r.ok) return fromFailure(r);
    return { status: 200, body: { ok: true, reference: r.reference, status: r.status, messages: r.messages } };
  } catch {
    // Network or configuration trouble: the visitor gets the generic message, never the details.
    return err(502, "error", CHAT_MESSAGES.generic);
  }
}
