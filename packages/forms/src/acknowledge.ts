// Sends the acknowledgement emails of a website form (P1, packages/mail). Server only. Off, and instant, unless
// RESEND_API_KEY and MAIL_FROM are set. Never throws: the sites call it with Next.js after(), once the visitor already
// has their reference.
//
// Newsletter sign ups (P4): the email carries the subscriber's unsubscribe link, <Lexta site>/unsubscribe?token=...
// The token comes from public.newsletter_unsubscribe_token (0028), asked for with a request signed with the
// CHAT_INTAKE_SECRET every website already shares with the database, under its own "newsletter-token:" prefix. Without
// the secret (or on any trouble) the email says to reply with "unsubscribe" instead.
import { createHmac } from "node:crypto";
import { newsletterUnsubscribeToken } from "@lexta/db";
import { mailSettings, sendAcknowledgement, type Acknowledgement } from "@lexta/mail";

export type { Acknowledgement } from "@lexta/mail";

/** The signed request for a subscriber's unsubscribe token. */
export function signNewsletterTokenRequest(secret: string, email: string, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const clean = email.trim().toLowerCase();
  const signature = createHmac("sha256", secret).update(`newsletter-token:${clean}.${issuedAt}`).digest("hex");
  return { email: clean, issuedAt, signature };
}

/** <Lexta site>/unsubscribe?token=... for a subscribed email, or undefined. */
export async function newsletterUnsubscribeUrl(email: string, lextaSiteUrl: string): Promise<string | undefined> {
  const secret = process.env.CHAT_INTAKE_SECRET ?? "";
  if (secret.length < 32 || !/^https?:\/\//.test(lextaSiteUrl)) return undefined;
  try {
    const token = await newsletterUnsubscribeToken(signNewsletterTokenRequest(secret, email));
    return token ? `${lextaSiteUrl.replace(/\/+$/, "")}/unsubscribe?token=${token}` : undefined;
  } catch {
    return undefined;
  }
}

export async function acknowledge(ack: Acknowledgement): Promise<void> {
  try {
    if (!mailSettings()) return;
    let full = ack;
    if (ack.kind === "newsletter" && ack.email && ack.lextaSiteUrl && !ack.unsubscribeUrl) {
      full = { ...ack, unsubscribeUrl: await newsletterUnsubscribeUrl(ack.email, ack.lextaSiteUrl) };
    }
    const r = await sendAcknowledgement(full);
    if (!r.team.ok && r.team.reason === "error") console.warn(`[mail] the ${ack.form} copy for the team was not sent`);
  } catch {
    console.warn("[mail] acknowledgement failed");
  }
}
