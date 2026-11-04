// Careers page application form (scoreboard item 21).
//
// Plain server code with no Next.js imports, so the local harness test (supabase/tests/local/recruitment) runs the
// very same function. The server action submitApplicationForm in app/actions/forms.ts is a thin wrapper around it.
//
// The CV reaches the private job-cvs bucket in one of two ways, both with the publishable key only:
//   with JavaScript      the browser uploads it straight to incoming/<uuid>/ first (so large files never pass
//                        through the website's server), then posts the form with cv_path and cv_name;
//   without JavaScript   the file comes in the multipart form post and is uploaded here.
// Then public.submit_job_application claims the upload and returns the LX-APP reference. A filled honeypot gets a
// thank you with a reference shaped like a real one, and nothing is uploaded or saved.
import {
  JOB_CV_MAX_BYTES,
  isJobCvUploadPath,
  jobCvExtension,
  looksLikeCv,
  submitJobApplication,
  uploadJobCv,
  type JobApplicationPayload,
} from "@lexta/db";
import { formsConfigured, HONEYPOT_FIELD, msgUnavailable, payloadTooLarge, type FormState } from "./core";

/** Where applicants can write instead when the form cannot send (the address the Careers page shows). */
export const CAREERS_EMAIL = "support@lextagh.com";

export const APPLICATION_LIMITS = { name: 120, email: 254, phone: 24, interest: 120, message: 3000, opening: 20, cvName: 200 };

export const MSG_APPLICATION_RATE_LIMITED = "You have sent several applications today. Please try again tomorrow, or email " + CAREERS_EMAIL + ".";
export const MSG_ROLE_CLOSED = "This role is no longer taking applications. Switch to a general application and we will keep it on file.";
export const MSG_CHECK_FIELDS = "Please check the highlighted fields.";
export const msgGeneric = (email: string) => `Sorry, your application could not be sent. Please try again in a few minutes, or email ${email}.`;

export const CV_MESSAGES = {
  missing: "Please attach your CV (PDF or Word, up to 5 MB).",
  type: "Your CV must be a PDF or Word file (.pdf, .doc or .docx).",
  size: "Your CV must be 5 MB or smaller.",
  content: "This file does not look like a PDF or Word document. Please choose your CV again.",
  upload: "Your CV could not be uploaded. Please try again with a PDF or Word file up to 5 MB.",
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
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return looksLikeCv(ext, head) ? null : CV_MESSAGES.content;
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
  if (!v.opening && !v.interest) errors.interest = MESSAGES.interest;
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

/** The application form's server work. Never shows database details. */
export async function handleApplication(fd: FormData): Promise<FormState> {
  const trap = fd.get(HONEYPOT_FIELD);
  if (typeof trap === "string" && trap.trim() !== "") {
    const ref = fakeApplicationReference();
    return { status: "success", reference: ref, message: applicationThanks(ref), values: {} };
  }

  const { values, errors, file } = await buildApplication(fd);
  if (Object.keys(errors).length) {
    return { status: "error", message: errors.opening && Object.keys(errors).length === 1 ? MSG_ROLE_CLOSED : MSG_CHECK_FIELDS, fieldErrors: errors, values: keep(values, !errors.cv) };
  }
  if (!formsConfigured()) return { status: "error", message: msgUnavailable(CAREERS_EMAIL), values: keep(values, false) };

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
      const up = await uploadJobCv(file, file.name);
      if (!up.ok) {
        if (up.reason === "rejected") return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { cv: CV_MESSAGES.upload }, values: keep(values, false) };
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
