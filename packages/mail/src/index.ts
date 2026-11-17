// Acknowledgement emails from the website forms (Drive requests P1, approved by Desmond 17 November 2026).
//
// Lexta's Drive: "All forms must create an acknowledgement, send to a designated monitored inbox and retain a ticket in
// the shared thread"; "all emails will have instructions on how to navigate them". After a successful submission the
// sites send two plain text emails with the reference in the subject, so replies thread:
//   to the sender        the reference, what happens next and how to reply (replies go to the routing inbox)
//   to the routing inbox a copy of what was sent (replies go to the sender), so the team keeps the thread
//
// OFF BY DEFAULT. Nothing is sent unless RESEND_API_KEY and MAIL_FROM are both set; without them every call returns
// { ok: false, reason: "off" } at once, and the forms behave exactly as before. Desmond turns it on at go-live with a
// verified sending domain (docs/go-live/go-live-plan.md). MAIL_REDIRECT_TO sends every email to one test inbox instead,
// for checking routing on a preview without writing to Lexta's real inboxes.
//
// Provider agnostic: messages are built here as plain data; only sendMail knows the provider (Resend's HTTP API, plain
// fetch, no SDK). Swapping provider means changing sendMail only. Nothing here ever throws: a failed send is logged
// (status only, never the addresses or the message) and the form goes on.
// Plain code with no Node or Next.js imports, so the harness tests run it with a stubbed fetch.

export type MailMessage = {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type MailSettings = {
  apiKey: string;
  /** e.g. "Lexta Ghana <no-reply@mail.example.com>": an address on the domain verified with the provider. */
  from: string;
  /** Test only: every email goes here instead of its real recipients. */
  redirectTo?: string;
};

export type MailResult = { ok: true; id: string | null } | { ok: false; reason: "off" | "invalid" | "error" };

type Env = Record<string, string | undefined>;

const EMAIL_RE = /^[^@\s<>,;"]+@[^@\s<>,;"]+\.[^@\s<>,;"]+$/;
export const isEmail = (v: unknown): v is string => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);

/** The mail settings, or null when sending is off (RESEND_API_KEY or MAIL_FROM missing). */
export function mailSettings(env: Env = process.env): MailSettings | null {
  const apiKey = (env.RESEND_API_KEY ?? "").trim();
  const from = (env.MAIL_FROM ?? "").trim();
  if (!apiKey || !from) return null;
  const redirectTo = (env.MAIL_REDIRECT_TO ?? "").trim();
  return { apiKey, from, ...(isEmail(redirectTo) ? { redirectTo } : {}) };
}

export const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 8000;

export type SendOptions = {
  /** Defaults to mailSettings() from the environment. Pass null to force off. */
  settings?: MailSettings | null;
  /** Defaults to the global fetch; tests pass a stub. */
  fetch?: typeof fetch;
};

/** One line, no control characters: what goes in a subject or header. */
const oneLine = (s: string, max = 200) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Sends one message through the provider. Never throws. */
export async function sendMail(message: MailMessage, options: SendOptions = {}): Promise<MailResult> {
  try {
    const settings = options.settings === undefined ? mailSettings() : options.settings;
    if (!settings) return { ok: false, reason: "off" };
    const to = settings.redirectTo ? [settings.redirectTo] : message.to.filter(isEmail);
    if (!to.length || !message.subject || !message.text) return { ok: false, reason: "invalid" };
    const subject = settings.redirectTo ? `[TEST to ${message.to.join(", ")}] ${message.subject}` : message.subject;
    const body: Record<string, unknown> = { from: settings.from, to, subject: oneLine(subject, 300), text: message.text };
    if (message.replyTo && isEmail(message.replyTo)) body.reply_to = message.replyTo;
    if (message.headers && Object.keys(message.headers).length) {
      body.headers = Object.fromEntries(Object.entries(message.headers).map(([k, v]) => [k, oneLine(v, 1000)]));
    }
    const doFetch = options.fetch ?? fetch;
    const res = await doFetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${settings.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[mail] the provider refused an email (HTTP ${res.status})`);
      return { ok: false, reason: "error" };
    }
    let id: string | null = null;
    try { id = ((await res.json()) as { id?: string })?.id ?? null; } catch { /* no body */ }
    return { ok: true, id };
  } catch (e) {
    console.warn(`[mail] an email could not be sent (${e instanceof Error ? e.name : "error"})`);
    return { ok: false, reason: "error" };
  }
}

// Acknowledgements ----------------------------------------------------------------------------------------------

export type AcknowledgementKind = "enquiry" | "complaint" | "partner" | "application" | "newsletter";

export type Acknowledgement = {
  kind: AcknowledgementKind;
  /** The site as visitors know it: "Lexta Ghana", "Yazz", "Linzzy" or "Hooch". */
  site: string;
  /** The form, as the team knows it: "Contact Us", "Partner With Us", "Careers", "Newsletter", "Trade enquiry"... */
  form: string;
  /** The reference or case number the database gave back. */
  reference: string;
  /** The monitored inbox for this form (the routing address in the site's config). */
  routeTo: string;
  name?: string;
  email?: string;
  phone?: string;
  /** What was sent, label and value, for the team's copy (empty values are left out). */
  details?: [string, string | undefined][];
  /** Newsletter: the one click unsubscribe page for this subscriber. */
  unsubscribeUrl?: string;
};

const NOUN: Record<AcknowledgementKind, string> = {
  enquiry: "message",
  complaint: "report",
  partner: "enquiry",
  application: "application",
  newsletter: "newsletter sign up",
};

const NEXT_STEPS: Record<AcknowledgementKind, string[]> = {
  enquiry: [
    "Our team will read your message and reply by email or phone.",
    "We aim to reply within [PLACEHOLDER: reply time for website enquiries, for example 1 working day].",
  ],
  complaint: [
    "Our consumer care team has opened a case with this number and will contact you.",
    "We aim to contact you within [PLACEHOLDER: first response time for complaints].",
  ],
  partner: [
    "Our trade team will review your enquiry and contact you.",
    "We aim to reply within [PLACEHOLDER: reply time for trade and partnership enquiries].",
  ],
  application: [
    "Our HR team will review your application and CV.",
    "If your experience matches a role, we will contact you by email. [PLACEHOLDER: how long applicants should wait for news]",
  ],
  newsletter: [
    "You will receive our news and updates by email.",
  ],
};

/** "[LX-2026-0012] Yazz: your report": the reference first, so every reply stays in one thread. */
export const acknowledgementSubject = (ack: Acknowledgement) =>
  oneLine(`[${ack.reference}] ${ack.site}: ${ack.kind === "newsletter" ? "newsletter sign up" : `your ${NOUN[ack.kind]}`}`);

/** The email to the person who sent the form, or null when they gave no email address. */
export function senderEmail(ack: Acknowledgement): MailMessage | null {
  if (!isEmail(ack.email) || !isEmail(ack.routeTo)) return null;
  const hello = ack.name ? `Hello ${oneLine(ack.name, 120)},` : "Hello,";
  const lines = [
    hello,
    "",
    ack.kind === "newsletter"
      ? `Thank you for signing up for ${ack.site} news.`
      : `Thank you for contacting ${ack.site}. We have received your ${NOUN[ack.kind]}.`,
    "",
    `Your reference: ${ack.reference}`,
    "",
    "What happens next",
    ...NEXT_STEPS[ack.kind].map((l) => `* ${l}`),
    "",
    "How to reply",
  ];
  if (ack.kind === "newsletter") {
    lines.push(
      "* You do not need to reply to this email.",
      ack.unsubscribeUrl
        ? `* To stop our emails at any time, open this link: ${ack.unsubscribeUrl}`
        : "* To stop our emails at any time, reply with the word unsubscribe.",
      `* Questions? Reply to this email and keep ${ack.reference} in the subject.`,
    );
  } else {
    lines.push(
      "* Reply to this email to add anything, for example a photo, a receipt or a better time to call.",
      `* Keep ${ack.reference} in the subject so your reply joins the same thread.`,
      `* Please do not send passwords, bank or card details by email.`,
    );
  }
  lines.push("", `${ack.site} team`, ack.routeTo, "", "This email was sent because this address was given on our website form.");
  const headers: Record<string, string> = {};
  if (ack.unsubscribeUrl) headers["List-Unsubscribe"] = `<${ack.unsubscribeUrl}>`;
  return { to: [ack.email], subject: acknowledgementSubject(ack), text: lines.join("\n"), replyTo: ack.routeTo, headers };
}

/** The copy for the routing inbox: what was sent, and how to answer. */
export function teamEmail(ack: Acknowledgement, portalUrl?: string): MailMessage | null {
  if (!isEmail(ack.routeTo)) return null;
  const details = (ack.details ?? []).filter((d): d is [string, string] => typeof d[1] === "string" && d[1].trim() !== "");
  const lines = [
    `New ${ack.form} from the ${ack.site} website.`,
    "",
    `Reference: ${ack.reference}`,
    `Name: ${ack.name ? oneLine(ack.name, 120) : "Not given"}`,
    `Email: ${isEmail(ack.email) ? ack.email : "Not given"}`,
    `Phone: ${ack.phone ? oneLine(ack.phone, 40) : "Not given"}`,
    ...details.map(([label, value]) => (value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`)),
    "",
    "How to handle it",
    isEmail(ack.email)
      ? `* Reply to this email to answer the sender directly. Keep ${ack.reference} in the subject so the thread stays together.`
      : "* The sender gave no email address: call them on the number above.",
    `* The record is in the Lexta Business System${portalUrl ? ` (${portalUrl.replace(/\/+$/, "")})` : ""}: search for ${ack.reference}.`,
    isEmail(ack.email) ? "* The sender has been sent an acknowledgement with this reference." : "",
  ].filter((l, i, all) => l !== "" || all[i - 1] !== "");
  return {
    to: [ack.routeTo],
    subject: acknowledgementSubject(ack),
    text: lines.join("\n").trim(),
    ...(isEmail(ack.email) ? { replyTo: ack.email } : {}),
  };
}

export type AcknowledgementResult = { sender: MailResult; team: MailResult };

/**
 * Sends the acknowledgement and the team copy. Off (and instant) without RESEND_API_KEY and MAIL_FROM. Never throws;
 * never blocks a form: call it after the submission has been saved (the sites use Next.js after()).
 */
export async function sendAcknowledgement(ack: Acknowledgement, options: SendOptions & { portalUrl?: string } = {}): Promise<AcknowledgementResult> {
  const off: MailResult = { ok: false, reason: "off" };
  try {
    const settings = options.settings === undefined ? mailSettings() : options.settings;
    if (!settings) return { sender: off, team: off };
    const opts = { ...options, settings };
    const portal = options.portalUrl ?? process.env.NEXT_PUBLIC_PORTAL_URL;
    const toSender = senderEmail(ack);
    const toTeam = teamEmail(ack, portal);
    const [sender, team] = await Promise.all([
      toSender ? sendMail(toSender, opts) : Promise.resolve<MailResult>({ ok: false, reason: "invalid" }),
      toTeam ? sendMail(toTeam, opts) : Promise.resolve<MailResult>({ ok: false, reason: "invalid" }),
    ]);
    return { sender, team };
  } catch {
    return { sender: { ok: false, reason: "error" }, team: { ok: false, reason: "error" } };
  }
}
