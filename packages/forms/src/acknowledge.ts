// Sends the acknowledgement emails of a website form (P1, packages/mail). Server only. Off, and instant, unless
// RESEND_API_KEY and MAIL_FROM are set. Never throws: the sites call it with Next.js after(), once the visitor already
// has their reference.
import { mailSettings, sendAcknowledgement, type Acknowledgement } from "@lexta/mail";

export type { Acknowledgement } from "@lexta/mail";

export async function acknowledge(ack: Acknowledgement): Promise<void> {
  try {
    if (!mailSettings()) return;
    const r = await sendAcknowledgement(ack);
    if (!r.team.ok && r.team.reason === "error") console.warn(`[mail] the ${ack.form} copy for the team was not sent`);
  } catch {
    console.warn("[mail] acknowledgement failed");
  }
}
