// The parts of the website forms every site shares (Lexta and the brand sites): the form state, the honeypot, field
// checks, size limits and how the database's answer becomes what the visitor reads. Each site keeps its own forms
// (fields, wording, routing) in its lib/forms/core.ts and sends them through the same intake functions of the Lexta
// Business System, public.submit_website_enquiry and public.submit_complaint (packages/db), with its brand slug.
//
// Plain server code with no Next.js imports, so the local harness tests (supabase/tests/local/forms and yazz) run it.
import type { ComplaintResult, EnquiryResult } from "@lexta/db";

export type FormState = {
  status: "idle" | "success" | "error";
  /** Text for the visitor: the thank you (with reference) or what went wrong. */
  message?: string;
  /** Reference or case number the database gave back. */
  reference?: string;
  /** Inline message per form field name. */
  fieldErrors?: Record<string, string>;
  /** What the visitor typed, sent back on error so the form keeps it. Empty on success so the form clears. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Name of the hidden spam trap field on every form. People never see or fill it. */
export const HONEYPOT_FIELD = "website";

export const msgUnavailable = (email: string) => `This form is not available right now, please email ${email}`;
export const MSG_RATE_LIMITED = "Too many messages, please try again in an hour.";
export const msgGeneric = (email: string) => `Sorry, your message could not be sent. Please try again in a few minutes, or email ${email}.`;
export const MSG_TOO_LONG = "Your message is too long, please shorten it.";
export const MSG_CHECK_FIELDS = "Please check the highlighted fields.";

/** Field limits, the same as the database intake functions. */
export const LIMITS = { name: 120, email: 254, phone: 24, message: 3000, organisation: 160, detail: 300, location: 120, years: 20, batch: 60, volume: 200, place: 200 };

/**
 * The intake functions refuse a payload over 8000 bytes (octet_length of the jsonb as text, which adds a space after
 * every ":" and ","). Multi byte text (accents, emoji) can pass the character limits and still be too big, so the
 * encoded size is checked first, with that spacing allowed for.
 */
export const PAYLOAD_MAX_BYTES = 8000;
export function payloadTooLarge(payload: object): boolean {
  const json = JSON.stringify(payload);
  return new TextEncoder().encode(json).length + 2 * Object.keys(payload).length > PAYLOAD_MAX_BYTES;
}

const randomHex = (n: number) => {
  const bytes = new Uint8Array(Math.ceil(n / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, n).toUpperCase();
};

/**
 * What a caught bot sees: a thank you with a reference shaped exactly like a real one for that form (ENQ-, PTN-,
 * NWS- and ten hex characters; LX-YYYY-NNNN for a complaint). Nothing is sent to the database.
 */
export function fakeReference(kind: "contact" | "complaint" | "partner" | "newsletter"): string {
  if (kind === "complaint") {
    const n = new Uint16Array(1);
    crypto.getRandomValues(n);
    return `LX-${new Date().getUTCFullYear()}-${String(1 + (n[0] % 9999)).padStart(4, "0")}`;
  }
  return `${{ contact: "ENQ", partner: "PTN", newsletter: "NWS" }[kind]}-${randomHex(10)}`;
}

/** The hidden trap field was filled in (any length counts): only bots do that. */
export const trapped = (fd: FormData) => {
  const v = fd.get(HONEYPOT_FIELD);
  return typeof v === "string" && v.trim() !== "";
};

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/;

export type Fields = Record<string, string>;

/** The named fields of a submitted form, trimmed, with Windows line ends made plain. The honeypot is never read. */
export function read(fd: FormData, names: string[]): Fields {
  const out: Fields = {};
  for (const n of names) {
    if (n === HONEYPOT_FIELD) continue;
    const v = fd.get(n);
    out[n] = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
  }
  return out;
}

/** Supabase settings present? Without them the forms explain how to reach the team instead of failing. */
export function formsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export const tooLong = (label: string, max: number) => `${label} can be at most ${max} characters.`;

export function checkName(v: Fields, field: string, errors: Fields, label = "your name") {
  if (!v[field]) errors[field] = `Please enter ${label}.`;
  else if (v[field].length > LIMITS.name) errors[field] = tooLong("Your name", LIMITS.name);
}

export function checkEmailPhone(v: Fields, errors: Fields) {
  if (v.email.length > LIMITS.email || (v.email && !EMAIL_RE.test(v.email))) errors.email = "Please enter a valid email address.";
  if (v.phone && (v.phone.length > LIMITS.phone || !PHONE_RE.test(v.phone))) {
    errors.phone = "Please enter a valid phone number, for example +233 24 123 4567.";
  }
  if (!v.email && !v.phone) errors.email = "Please give an email address or a phone number so we can reply.";
}

export function checkMax(v: Fields, field: string, max: number, label: string, errors: Fields) {
  if (v[field].length > max) errors[field] = tooLong(label, max);
}

export function invalid(values: Fields, fieldErrors: Fields): FormState {
  return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors, values: values };
}

/** Turns what the database said into what the visitor sees. Never shows database details. */
export function fromResult(
  result: EnquiryResult | ComplaintResult,
  values: Fields,
  fieldMap: Record<string, string>,
  messages: Fields,
  success: (ref: string) => string,
  fallbackEmail: string,
): FormState {
  if (result.ok) {
    const ref = "reference" in result ? result.reference : result.caseNumber;
    return { status: "success", reference: ref, message: success(ref), values: {} };
  }
  const kept = values;
  if (result.reason === "rate_limited") return { status: "error", message: MSG_RATE_LIMITED, values: kept };
  if (result.reason === "invalid" && result.field && fieldMap[result.field]) {
    const field = fieldMap[result.field];
    return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { [field]: messages[field] ?? "Please check this field." }, values: kept };
  }
  return { status: "error", message: msgGeneric(fallbackEmail), values: kept };
}

export async function safely<T>(run: () => Promise<T>): Promise<T | { ok: false; reason: "error" }> {
  try {
    return await run();
  } catch {
    // Network or configuration trouble: the visitor gets the generic message, never the details.
    return { ok: false, reason: "error" };
  }
}

export const unavailable = (values: Fields, email: string): FormState => ({ status: "error", message: msgUnavailable(email), values: values });
export const tooLarge = (values: Fields): FormState => ({ status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { message: MSG_TOO_LONG }, values });

/**
 * The batch code inside a free text "Product and batch code" field, e.g. "Yazz Ultra, batch 2026-04-18" gives
 * "2026-04-18". With no "batch" word, a short field is taken whole (people often type only the code).
 */
export function batchCodeFrom(detail: string): string | undefined {
  const m = /\b(?:batch|lot)\b(?:\s*(?:code|no\.?|number))?\s*[:#.]?\s*([A-Za-z0-9][A-Za-z0-9\-/.]*)/i.exec(detail);
  const code = (m?.[1] ?? (/\d/.test(detail) && !/\s/.test(detail) ? detail : undefined))?.replace(/[.\-/]+$/, "");
  return code && code.length <= LIMITS.batch ? code : undefined;
}
