// Careers page application form (scoreboard item 21).
//
// Plain server code with no Next.js imports, so the local harness test (supabase/tests/local/recruitment) runs the
// very same function. The server action submitApplicationForm in app/actions/forms.ts is a thin wrapper around it.
//
// The CV always comes to this server in the multipart form post (with or without JavaScript); browsers never write
// to Storage themselves. Here the file's size, type and first bytes are checked, then the server signs a request
// for a one time upload ticket with RECRUITMENT_INTAKE_SECRET (shared only with the database; never sent to the
// browser): HMAC SHA-256 over "<new uuid>.<unix seconds>.<visitor IP hash>". The IP hash is an HMAC of the visitor's
// address (IPv6 grouped by /64) with the same secret, so the raw address is never stored. The database checks the signature and the per
// visitor limits and answers with the path the upload may use; the server uploads there with the publishable key and
// the content type it worked out, and public.submit_job_application claims the upload and returns the LX-APP
// reference. A filled honeypot gets a thank you with a reference shaped like a real one, and nothing is uploaded or
// saved.
import { createHmac, randomUUID } from "node:crypto";
import {
  JOB_CV_MAX_BYTES,
  JOB_CV_TYPES,
  isJobCvUploadPath,
  jobCvExtension,
  looksLikeCv,
  submitJobApplication,
  uploadJobCv,
  type JobApplicationPayload,
} from "@lexta/db";
import { formsConfigured, HONEYPOT_FIELD, msgUnavailable, payloadTooLarge, type FormState } from "./core";

export const CAREERS_EMAIL = "support@lextagh.com";

export const APPLICATION_LIMITS = { name: 120, email: 254, phone: 24, interest: 120, message: 3000, opening: 20, cvName: 200 };

export const MSG_APPLICATION_RATE_LIMITED = "You have sent several applications today. Please try again tomorrow, or email " + CAREERS_EMAIL + ".";
export const MSG_UPLOAD_RATE_LIMITED = "Too many CVs have been sent from your connection. Please try again later, or email " + CAREERS_EMAIL + ".";
export const MSG_ROLE_CLOSED = "This role is no longer taking applications. Switch to a general application and we will keep it on file.";
export const MSG_CHECK_FIELDS = "Please check the highlighted fields.";
export const msgGeneric = (email: string) => `Sorry, your application could not be sent. Please try again in a few minutes, or email ${email}.`;

export const CV_MESSAGES = {
  missing: "Please attach your CV (PDF or Word, up to 4 MB).",
  type: "Your CV must be a PDF or Word file (.pdf, .doc or .docx).",
  size: "Your CV must be 4 MB or smaller.",
  content: "This file does not look like a PDF or Word document. Please choose your CV again.",
  upload: "Your CV could not be uploaded. Please try again with a PDF or Word file up to 4 MB.",
};

const MESSAGES: Record<string, string> = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number, for example +233 24 123 4567.",
  interest: "Please choose the area you are interested in.",
  message: "Your message can be at most 3000 characters.",
  consent: "Please tick the box so we can keep your details for this and future roles.",
  opening: MSG_ROLE_CLOSED,
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/;
const REF_RE = /^LX-[A-Z]{2,5}-[0-9]{2,5}$/;

type Fields = Record<string, string>;

const text = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
};

/**
 * The role applied for. With JavaScript it is the hidden "opening" field ("Apply for this role"); without JavaScript
 * the form shows a role list instead ("opening_choice", inside <noscript>, so it is only sent when scripts are off),
 * and that choice wins, an empty choice meaning a general application.
 */
const openingFrom = (fd: FormData) => {
  const choice = fd.get("opening_choice");
  const raw = typeof choice === "string" ? choice : fd.get("opening");
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
};

const fileFrom = (fd: FormData): File | null => {
  const v = fd.get("cv");
  return v && typeof v === "object" && "size" in v && (v as File).size > 0 ? (v as File) : null;
};

/** Random LX-APP-<year>-NNNN, what a caught bot sees. */
export function fakeApplicationReference(): string {
  const n = new Uint16Array(1);
  crypto.getRandomValues(n);
  return `LX-APP-${new Date().getUTCFullYear()}-${String(1 + (n[0] % 9999)).padStart(4, "0")}`;
}

export const applicationThanks = (ref: string) =>
  `Thank you. Your application has reached our HR team and your reference is ${ref}. We will be in touch by email.`;

/** Checks a chosen CV file: type by extension, size, and that its first bytes match the type. */
export async function checkCvFile(file: File): Promise<string | null> {
  const ext = jobCvExtension(file.name);
  if (!ext) return CV_MESSAGES.type;
  if (file.size > JOB_CV_MAX_BYTES) return CV_MESSAGES.size;
  if (file.size < 8) return CV_MESSAGES.content;
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return looksLikeCv(ext, head) ? null : CV_MESSAGES.content;
}

/** The shared secret, or null when the site has none (then the form says it is not available). */
const intakeSecret = () => {
  const s = process.env.RECRUITMENT_INTAKE_SECRET ?? "";
  return s.length >= 32 ? s : null;
};

/** Expands an IPv6 address to its 8 groups of four hex digits, or null when it is not one. */
function ipv6Groups(ip: string): string[] | null {
  if (!/^[0-9a-f:.]+$/i.test(ip) || !ip.includes(":")) return null;
  let text = ip.toLowerCase();
  // A dotted IPv4 tail (::ffff:1.2.3.4) becomes two groups.
  const tail = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (tail) {
    const b = tail.slice(1).map(Number);
    if (b.some((x) => x > 255)) return null;
    text = text.slice(0, tail.index) + ((b[0] << 8) | b[1]).toString(16) + ":" + ((b[2] << 8) | b[3]).toString(16);
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => g.padStart(4, "0"));
}

/**
 * The visitor key the upload limits count by: an IPv4 address as it is, an IPv6 address by its /64 network (one
 * household or phone usually holds a whole /64), an IPv4 address written as IPv6 (::ffff:1.2.3.4) as IPv4. Null when
 * there is no usable address, and then no upload is made: everyone without an address must not share one limit.
 */
export function visitorKey(raw: string): string | null {
  let ip = (raw ?? "").trim().replace(/^\[|\](:\d+)?$/g, "").replace(/%.*$/, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip.split(".").every((x) => Number(x) <= 255) ? `v4:${ip}` : null;
  const groups = ipv6Groups(ip);
  if (!groups) return null;
  if (groups.slice(0, 5).every((g) => g === "0000") && groups[5] === "ffff") {
    const n = parseInt(groups[6] + groups[7], 16);
    ip = [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
    return `v4:${ip}`;
  }
  return `v6:${groups.slice(0, 4).join(":")}::/64`;
}

/**
 * The signed ticket request for one upload. visitor is visitorKey() of the visitor's address; it is hashed with the
 * secret here and never sent anywhere.
 */
export function signTicketRequest(secret: string, visitor: string, fileName: string, now = Date.now()) {
  const nonce = randomUUID();
  const issuedAt = Math.floor(now / 1000);
  const ipHash = createHmac("sha256", secret).update(`ip:${visitor}`).digest("hex");
  const signature = createHmac("sha256", secret).update(`${nonce}.${issuedAt}.${ipHash}`).digest("hex");
  return { nonce, issuedAt, ipHash, signature, fileName };
}

/** Validates the application form. Exported for the harness test. */
export async function buildApplication(fd: FormData): Promise<{ values: Fields; errors: Fields; file: File | null }> {
  const v: Fields = {
    opening: openingFrom(fd),
    name: text(fd, "name"),
    email: text(fd, "email"),
    phone: text(fd, "phone"),
    interest: text(fd, "interest"),
    message: text(fd, "message"),
    consent: text(fd, "consent"),
    cv_path: text(fd, "cv_path"),
    cv_name: text(fd, "cv_name").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, APPLICATION_LIMITS.cvName),
  };
  const errors: Fields = {};
  const file = fileFrom(fd);

  if (v.opening && !REF_RE.test(v.opening)) errors.opening = MSG_ROLE_CLOSED;
  if (!v.name) errors.name = MESSAGES.name;
  else if (v.name.length > APPLICATION_LIMITS.name) errors.name = `Your name can be at most ${APPLICATION_LIMITS.name} characters.`;
  if (!v.email || v.email.length > APPLICATION_LIMITS.email || !EMAIL_RE.test(v.email)) errors.email = MESSAGES.email;
  if (v.phone && (v.phone.length > APPLICATION_LIMITS.phone || !PHONE_RE.test(v.phone))) errors.phone = MESSAGES.phone;
  // A role application has no area of interest (without JavaScript the form still sends the select).
  if (v.opening) v.interest = "";
  else if (!v.interest) errors.interest = MESSAGES.interest;
  else if (v.interest.length > APPLICATION_LIMITS.interest) errors.interest = MESSAGES.interest;
  if (v.message.length > APPLICATION_LIMITS.message) errors.message = MESSAGES.message;
  if (v.consent !== "yes") errors.consent = MESSAGES.consent;

  if (file) {
    const problem = await checkCvFile(file);
    if (problem) errors.cv = problem;
    // A new file replaces anything uploaded earlier.
    v.cv_path = "";
    v.cv_name = file.name.slice(0, APPLICATION_LIMITS.cvName);
  } else if (v.cv_path) {
    if (!isJobCvUploadPath(v.cv_path)) {
      errors.cv = CV_MESSAGES.missing;
      v.cv_path = "";
      v.cv_name = "";
    }
  } else {
    errors.cv = CV_MESSAGES.missing;
  }
  return { values: v, errors, file };
}

/** What the visitor keeps on an error: everything typed, and an uploaded CV unless the CV was the problem. */
const keep = (v: Fields, cvOk: boolean): Fields => (cvOk ? v : { ...v, cv_path: "", cv_name: "" });

/** The application form's server work. Never shows database details. ip: the visitor's address (see signTicketRequest). */
export async function handleApplication(fd: FormData, ctx: { ip: string } = { ip: "" }): Promise<FormState> {
  const trap = fd.get(HONEYPOT_FIELD);
  if (typeof trap === "string" && trap.trim() !== "") {
    const ref = fakeApplicationReference();
    return { status: "success", reference: ref, message: applicationThanks(ref), values: {} };
  }

  const { values, errors, file } = await buildApplication(fd);
  if (Object.keys(errors).length) {
    return { status: "error", message: errors.opening && Object.keys(errors).length === 1 ? MSG_ROLE_CLOSED : MSG_CHECK_FIELDS, fieldErrors: errors, values: keep(values, !errors.cv) };
  }
  const secret = intakeSecret();
  if (!formsConfigured() || !secret) return { status: "error", message: msgUnavailable(CAREERS_EMAIL), values: keep(values, false) };

  const payload: JobApplicationPayload = {
    opening: values.opening || undefined,
    name: values.name,
    email: values.email,
    phone: values.phone || undefined,
    interest: values.interest || undefined,
    message: values.message || undefined,
    cv_path: values.cv_path,
    cv_name: values.cv_name || undefined,
    consent: true,
  };
  if (payloadTooLarge({ ...payload, cv_path: "incoming/00000000-0000-0000-0000-000000000000/" + "x".repeat(100) })) {
    return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { message: "Your message is too long, please shorten it." }, values: keep(values, !!values.cv_path) };
  }

  try {
    if (file) {
      const ext = jobCvExtension(file.name);
      if (!ext) return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { cv: CV_MESSAGES.type }, values: keep(values, false) };
      const visitor = visitorKey(ctx.ip);
      if (!visitor) {
        console.warn("[careers] no visitor address on an application with a CV; upload refused");
        return { status: "error", message: msgGeneric(CAREERS_EMAIL), values: keep(values, false) };
      }
      const bytes = await file.arrayBuffer();
      // Stored with the type that matches the checked bytes, whatever the browser called the file.
      const up = await uploadJobCv(signTicketRequest(secret, visitor, file.name), bytes, JOB_CV_TYPES[ext]);
      if (!up.ok) {
        if (up.reason === "rejected") return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { cv: CV_MESSAGES.upload }, values: keep(values, false) };
        if (up.reason === "rate_limited") return { status: "error", message: MSG_UPLOAD_RATE_LIMITED, values: keep(values, false) };
        if (up.reason === "not_configured") return { status: "error", message: msgUnavailable(CAREERS_EMAIL), values: keep(values, false) };
        return { status: "error", message: msgGeneric(CAREERS_EMAIL), values: keep(values, false) };
      }
      payload.cv_path = up.path;
      values.cv_path = up.path;
    }

    const result = await submitJobApplication(payload);
    if (result.ok) return { status: "success", reference: result.reference, message: applicationThanks(result.reference), values: {} };
    if (result.reason === "rate_limited") return { status: "error", message: MSG_APPLICATION_RATE_LIMITED, values: keep(values, true) };
    if (result.reason === "invalid") {
      const field = result.field ?? "";
      if (field === "opening") return { status: "error", message: MSG_ROLE_CLOSED, fieldErrors: { opening: MSG_ROLE_CLOSED }, values: keep(values, true) };
      if (field.startsWith("cv_")) {
        const msg = field === "cv_size" ? CV_MESSAGES.size : field === "cv_type" ? CV_MESSAGES.type : CV_MESSAGES.upload;
        return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { cv: msg }, values: keep(values, false) };
      }
      if (MESSAGES[field]) return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { [field]: MESSAGES[field] }, values: keep(values, true) };
    }
    return { status: "error", message: msgGeneric(CAREERS_EMAIL), values: keep(values, true) };
  } catch {
    // Network or configuration trouble: the visitor gets the generic message, never the details.
    return { status: "error", message: msgGeneric(CAREERS_EMAIL), values: keep(values, !!values.cv_path) };
  }
}
