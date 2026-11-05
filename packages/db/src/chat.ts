// Live chat (scoreboard item 22): types, labels and the website calls. Hand written from
// supabase/migrations/0009_live_chat.sql.
//
// The website never touches the chat tables. Its server calls three database functions with the publishable key and
// a signature only that server can make (see apps/lexta/lib/chat/server.ts): chat_start, chat_send and chat_read.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "./client";

type Timestamps = { created_at: string; updated_at: string };
type Option<T extends string> = { value: T; label: string };

export type ChatStatus = "open" | "waiting" | "closed";
export type ChatSender = "visitor" | "staff";

/** open: the visitor wrote last and waits for a reply. waiting: staff replied. closed: staff closed it. */
export const CHAT_STATUSES: readonly Option<ChatStatus>[] = [
  { value: "open", label: "Open" },
  { value: "waiting", label: "Waiting for visitor" },
  { value: "closed", label: "Closed" },
] as const;

export const chatStatusLabel = (v: string | null | undefined) => CHAT_STATUSES.find((s) => s.value === v)?.label ?? "Open";

/** What staff read about a conversation. The token hash is never readable, so never select "*". */
export type ChatConversation = Timestamps & {
  id: string;
  /** LC-7F3A09C2 */
  reference: string;
  brand_id: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string | null;
  start_page: string | null;
  status: ChatStatus;
  assigned_to: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_visitor_message_at: string | null;
  last_staff_message_at: string | null;
  staff_read_at: string | null;
  activity_at: string;
  visitor_message_count: number;
  closed_at: string | null;
  closed_by: string | null;
  lead_id: string | null;
  complaint_id: string | null;
  updated_by: string | null;
};

export const CHAT_CONVERSATION_COLUMNS =
  "id, reference, brand_id, visitor_name, visitor_email, visitor_phone, start_page, status, assigned_to, last_message_at, " +
  "last_message_preview, last_visitor_message_at, last_staff_message_at, staff_read_at, activity_at, visitor_message_count, " +
  "closed_at, closed_by, lead_id, complaint_id, created_at, updated_at, updated_by";

export type ChatMessage = Timestamps & {
  id: string;
  seq: number;
  conversation_id: string;
  sender: ChatSender;
  author_id: string | null;
  /** Staff only notes, never shown to the visitor. */
  is_internal: boolean;
  body: string;
};

/** A visitor message newer than the last time anyone on the team opened the conversation. */
export const isChatUnread = (c: Pick<ChatConversation, "last_visitor_message_at" | "staff_read_at">) =>
  !!c.last_visitor_message_at && (!c.staff_read_at || c.last_visitor_message_at > c.staff_read_at);

/** One person who answers the chat (from public.chat_staff()). */
export type ChatStaff = { id: string; display_name: string; role: string; is_active: boolean };

/** Limits the database enforces, repeated here for the forms. */
export const CHAT_LIMITS = { name: 80, email: 254, phone: 24, message: 2000, page: 300 } as const;

// Website calls -----------------------------------------------------------------------------------------------

/** A signed request from the website server: see signChatRequest in apps/lexta/lib/chat/server.ts. */
export type ChatSignedRequest = {
  /** A new uuid; for a start or a send it becomes the conversation's or message's id. */
  nonce: string;
  /** Unix seconds when the server signed it; the database accepts 5 minutes. */
  issuedAt: number;
  /** HMAC SHA-256 (hex) of the visitor's address with the shared secret: the raw address never leaves the server. */
  ipHash: string;
  /** HMAC SHA-256 (hex) of "chat.<nonce>.<issuedAt>.<ipHash>" with the shared secret. */
  signature: string;
};

export type ChatStartPayload = {
  /** Hidden field people never fill in. Anything in it marks a bot. */
  honeypot?: string;
  /** Site brand slug; the database defaults to lexta. */
  brand?: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  /** Path the chat was started on. */
  page?: string;
};

/** A message as the visitor sees it: staff replies carry a first name only, internal notes never come back. */
export type ChatVisitorMessage = {
  id: string;
  seq: number;
  sender: ChatSender;
  body: string;
  created_at: string;
  staff_name: string | null;
};

export type ChatFailure =
  | { ok: false; reason: "invalid"; field: string | null }
  | { ok: false; reason: "rate_limited"; message: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "error" };

export type ChatStartResult = { ok: true; conversationId: string; token: string; reference: string } | ChatFailure;
export type ChatSendResult = { ok: true; id: string; seq: number; createdAt: string } | ChatFailure;
export type ChatReadResult = { ok: true; reference: string; status: ChatStatus; messages: ChatVisitorMessage[] } | ChatFailure;

function failure(error: { code?: string; message?: string }): ChatFailure {
  if (error.code === "PT429") return { ok: false, reason: "rate_limited", message: error.message ?? "" };
  if (error.code === "PT403") return { ok: false, reason: "not_found" };
  if (error.code === "55000") return { ok: false, reason: "not_configured" };
  if (error.code === "22023") {
    const field = /^(?:invalid field|field too long): (\w+)/.exec(error.message ?? "")?.[1] ?? null;
    return { ok: false, reason: "invalid", field };
  }
  return { ok: false, reason: "error" };
}

const signed = (r: ChatSignedRequest) => ({ nonce: r.nonce, issued_at: r.issuedAt, ip_hash: r.ipHash, signature: r.signature });

/** Website server only. Starts a conversation; the token comes back once and is all the visitor needs to carry on. */
export async function chatStart(request: ChatSignedRequest, payload: ChatStartPayload, client?: SupabaseClient): Promise<ChatStartResult> {
  const supabase = client ?? createPublicClient();
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""));
  const { data, error } = await supabase.rpc("chat_start", { ...signed(request), payload: clean });
  if (error) return failure(error);
  const d = data as { conversation_id?: string; token?: string; reference?: string } | null;
  if (!d?.conversation_id || !d.token || !d.reference) return { ok: false, reason: "error" };
  return { ok: true, conversationId: d.conversation_id, token: d.token, reference: d.reference };
}

/** Website server only. Sends a visitor message to their own conversation. */
export async function chatSend(
  request: ChatSignedRequest, conversationId: string, token: string, body: string, client?: SupabaseClient,
): Promise<ChatSendResult> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.rpc("chat_send", { ...signed(request), conversation_id: conversationId, token, body });
  if (error) return failure(error);
  const d = data as { id?: string; seq?: number; created_at?: string } | null;
  if (!d?.id) return { ok: false, reason: "error" };
  return { ok: true, id: d.id, seq: Number(d.seq ?? 0), createdAt: d.created_at ?? "" };
}

/** Website server only. Reads the visitor's own conversation after a message number (0 for everything). */
export async function chatRead(
  request: ChatSignedRequest, conversationId: string, token: string, afterSeq = 0, client?: SupabaseClient,
): Promise<ChatReadResult> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.rpc("chat_read", { ...signed(request), conversation_id: conversationId, token, after_seq: afterSeq });
  if (error) return failure(error);
  const d = data as { reference?: string; status?: ChatStatus; messages?: ChatVisitorMessage[] } | null;
  if (!d?.reference) return { ok: false, reason: "error" };
  return { ok: true, reference: d.reference, status: d.status ?? "open", messages: Array.isArray(d.messages) ? d.messages : [] };
}
