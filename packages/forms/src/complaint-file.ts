// The optional photo or document on the website complaint forms (Drive requests X3; supabase/migrations/0027).
//
// Plain server code with no Next.js imports, so the local harness tests run the very same functions. The website
// never holds a service role key. The server checks the file (JPG, PNG or PDF by its first bytes, at most 5 MB) and
// signs a ticket request with CHAT_INTAKE_SECRET, the secret every website already shares with the database for live
// chat (private.chat_intake_secret). The signed text has its own prefix and names the exact type and size:
//   complaint-file:<new uuid>.<unix seconds>.<visitor IP hash>.<mime type>.<size in bytes>
// and the IP hash is an HMAC of "complaint-ip:<visitor>", so no chat signature or token can pass as an upload ticket.
// The database answers with the one path the upload may use; Storage only takes a file of that size and type there.
//
// Two ways in, same checks:
//   with JavaScript     the browser asks for a ticket (requestComplaintUpload, through a server action, sending the
//                       name, size, type and first bytes), uploads straight to Storage with the publishable key (so a
//                       5 MB file never passes through the site's own request limit), then sends the form with
//                       attachment_path and attachment_name.
//   without JavaScript  the file arrives in the form post and complaintAttachmentFrom uploads it from the server.
// Either way public.submit_complaint claims the file with the new complaint.
import { createHmac, randomUUID } from "node:crypto";
import {
  beginComplaintFileUpload,
  COMPLAINT_FILES_BUCKET,
  COMPLAINT_WEBSITE_FILE_MAX_BYTES,
  COMPLAINT_WEBSITE_FILE_TYPES,
  isComplaintUploadPath,
  uploadComplaintWebsiteFile,
  type ComplaintFileTicketRequest,
  type ComplaintWebsiteFileType,
} from "@lexta/db";
import { visitorKey } from "@lexta/chat/visitor";
import { ATTACHMENT_FIELD, ATTACHMENT_MESSAGES, ATTACHMENT_NAME_FIELD, ATTACHMENT_PATH_FIELD } from "./attachment-text";
import { formsConfigured, type Fields } from "./core";

export { ATTACHMENT_FIELD, ATTACHMENT_MESSAGES, ATTACHMENT_NAME_FIELD, ATTACHMENT_PATH_FIELD } from "./attachment-text";

type Ext = keyof typeof COMPLAINT_WEBSITE_FILE_TYPES;

/** The type a file name promises: .jpg, .jpeg, .png or .pdf. */
export function attachmentExtension(name: string): Ext | null {
  const ext = /\.([A-Za-z]{3,4})$/.exec(name ?? "")?.[1]?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png" || ext === "pdf") return ext;
  return null;
}

/** Do the first bytes match the type? JPG FF D8 FF, PNG 89 50 4E 47 0D 0A 1A 0A, PDF "%PDF-". */
export function looksLikeAttachment(ext: Ext, head: Uint8Array): boolean {
  const starts = (sig: number[]) => sig.every((b, i) => head[i] === b);
  if (ext === "jpg") return starts([0xff, 0xd8, 0xff]);
  if (ext === "png") return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return starts([0x25, 0x50, 0x44, 0x46, 0x2d]);
}

/** Checks name, size and first bytes. Returns the type to store the file with, or the message for the visitor. */
export function checkAttachment(name: string, size: number, head: Uint8Array): { mime: ComplaintWebsiteFileType } | { error: string } {
  const ext = attachmentExtension(name);
  if (!ext) return { error: ATTACHMENT_MESSAGES.type };
  if (!Number.isInteger(size) || size < 1 || size > COMPLAINT_WEBSITE_FILE_MAX_BYTES) return { error: ATTACHMENT_MESSAGES.size };
  if (!looksLikeAttachment(ext, head)) return { error: ATTACHMENT_MESSAGES.content };
  return { mime: COMPLAINT_WEBSITE_FILE_TYPES[ext] };
}

/** The shared secret, or null when the site has none (then adding a file is not available). */
const intakeSecret = () => {
  const s = process.env.CHAT_INTAKE_SECRET ?? "";
  return s.length >= 32 ? s : null;
};

/** The signed ticket request. visitor is visitorKey() of the visitor's address; it is hashed here, never sent. */
export function signComplaintFileRequest(secret: string, visitor: string, mimeType: ComplaintWebsiteFileType, sizeBytes: number,
  fileName: string, now = Date.now()): ComplaintFileTicketRequest {
  const nonce = randomUUID();
  const issuedAt = Math.floor(now / 1000);
  const ipHash = createHmac("sha256", secret).update(`complaint-ip:${visitor}`).digest("hex");
  const signature = createHmac("sha256", secret)
    .update(`complaint-file:${nonce}.${issuedAt}.${ipHash}.${mimeType}.${sizeBytes}`).digest("hex");
  return { nonce, issuedAt, ipHash, mimeType, sizeBytes, signature, fileName: fileName.slice(0, 200) };
}

type Ticket = { ok: true; path: string } | { ok: false; message: string };

async function ticketFor(mime: ComplaintWebsiteFileType, size: number, name: string, ip: string): Promise<Ticket> {
  const secret = intakeSecret();
  if (!formsConfigured() || !secret) return { ok: false, message: ATTACHMENT_MESSAGES.unavailable };
  const visitor = visitorKey(ip);
  if (!visitor) {
    console.warn("[complaint-file] no visitor address; upload refused");
    return { ok: false, message: ATTACHMENT_MESSAGES.upload };
  }
  try {
    const r = await beginComplaintFileUpload(signComplaintFileRequest(secret, visitor, mime, size, name));
    if (r.ok) return r;
    if (r.reason === "rate_limited") return { ok: false, message: ATTACHMENT_MESSAGES.limited };
    if (r.reason === "not_configured") return { ok: false, message: ATTACHMENT_MESSAGES.unavailable };
    return { ok: false, message: ATTACHMENT_MESSAGES.upload };
  } catch {
    return { ok: false, message: ATTACHMENT_MESSAGES.upload };
  }
}

/** What the browser sends to ask for a ticket. head: the file's first 16 bytes, base64. */
export type ComplaintUploadRequest = { name: string; size: number; head: string };
export type ComplaintUploadTicket =
  | { ok: true; path: string; uploadUrl: string; apiKey: string; contentType: ComplaintWebsiteFileType }
  | { ok: false; message: string };

/**
 * The JavaScript path: checks what the browser says about the file and gets a ticket. Returns where to upload (this
 * project's Storage URL for the path) and the publishable key, both public values. The browser's claim about the
 * bytes is only a courtesy check: Storage itself takes only the signed size and type, and submit_complaint checks
 * the stored file again.
 */
export async function requestComplaintUpload(input: unknown, ctx: { ip: string }): Promise<ComplaintUploadTicket> {
  const req = (input ?? {}) as Partial<ComplaintUploadRequest>;
  const name = typeof req.name === "string" ? req.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200) : "";
  const size = typeof req.size === "number" ? req.size : -1;
  let head = new Uint8Array();
  try { head = new Uint8Array(Buffer.from(typeof req.head === "string" ? req.head.slice(0, 64) : "", "base64")); } catch { /* stays empty */ }
  const checked = checkAttachment(name, size, head);
  if ("error" in checked) return { ok: false, message: checked.error };
  const ticket = await ticketFor(checked.mime, size, name, ctx.ip);
  if (!ticket.ok) return ticket;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const path = ticket.path.split("/").map(encodeURIComponent).join("/");
  return {
    ok: true,
    path: ticket.path,
    uploadUrl: `${base}/storage/v1/object/${COMPLAINT_FILES_BUCKET}/${path}`,
    apiKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    contentType: checked.mime,
  };
}

const fileFrom = (fd: FormData): File | null => {
  const v = fd.get(ATTACHMENT_FIELD);
  return v && typeof v === "object" && "size" in v && (v as File).size > 0 ? (v as File) : null;
};
const textFrom = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
};

export type AttachmentOutcome =
  | { kind: "none" }
  | { kind: "ready"; path: string; name: string }
  | { kind: "error"; message: string };

/**
 * The file part of a submitted complaint form. A file in the post (no JavaScript) is checked and uploaded from here;
 * otherwise a path the browser uploaded to is passed on. Nothing at all: no attachment, which is fine.
 */
export async function complaintAttachmentFrom(fd: FormData, ctx: { ip?: string } = {}): Promise<AttachmentOutcome> {
  const file = fileFrom(fd);
  if (file) {
    const name = file.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const checked = checkAttachment(name, file.size, head);
    if ("error" in checked) return { kind: "error", message: checked.error };
    const ticket = await ticketFor(checked.mime, file.size, name, ctx.ip ?? "");
    if (!ticket.ok) return { kind: "error", message: ticket.message };
    try {
      const up = await uploadComplaintWebsiteFile(ticket.path, await file.arrayBuffer(), checked.mime);
      if (!up.ok) return { kind: "error", message: ATTACHMENT_MESSAGES.upload };
    } catch {
      return { kind: "error", message: ATTACHMENT_MESSAGES.upload };
    }
    return { kind: "ready", path: ticket.path, name };
  }
  const path = textFrom(fd, ATTACHMENT_PATH_FIELD);
  if (!path) return { kind: "none" };
  if (!isComplaintUploadPath(path)) return { kind: "error", message: ATTACHMENT_MESSAGES.upload };
  const name = textFrom(fd, ATTACHMENT_NAME_FIELD).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
  return { kind: "ready", path, name: name || path.split("/")[1] };
}

/**
 * Adds the file to what the form keeps on an error, so the visitor does not have to choose it again: the form shows
 * "attached" with hidden fields. dropFile: the file was the problem, so it is not kept.
 */
export function keepAttachment(values: Fields, outcome: AttachmentOutcome, dropFile = false): Fields {
  if (outcome.kind !== "ready" || dropFile) return { ...values, [ATTACHMENT_PATH_FIELD]: "", [ATTACHMENT_NAME_FIELD]: "" };
  return { ...values, [ATTACHMENT_PATH_FIELD]: outcome.path, [ATTACHMENT_NAME_FIELD]: outcome.name };
}

/** The attachment fields a form post carried (a path the browser uploaded to), to keep on an error before any upload. */
export function attachmentValues(fd: FormData): Fields {
  const path = textFrom(fd, ATTACHMENT_PATH_FIELD);
  if (!path || !isComplaintUploadPath(path)) return {};
  return { [ATTACHMENT_PATH_FIELD]: path, [ATTACHMENT_NAME_FIELD]: textFrom(fd, ATTACHMENT_NAME_FIELD).slice(0, 200) };
}
