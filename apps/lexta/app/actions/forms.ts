"use server";

// Server actions behind the website forms. The work happens in lib/forms/core.ts (validation, mapping to the
// database's intake functions, friendly errors); these only hand the submitted form over. Publishable key only.
import { headers } from "next/headers";
import { after } from "next/server";
import { acknowledge, type Acknowledgement } from "@lexta/forms/acknowledge";
import { handleApplication } from "@/lib/forms/careers";
import { handleContact, handleNewsletter, handlePartner, type FormState } from "@/lib/forms/core";

/**
 * Acknowledgement emails (P1): sent after the response, so the visitor never waits for them and a failed send never
 * touches the form. Off unless RESEND_API_KEY and MAIL_FROM are set (packages/mail).
 */
const notify = (ack: Acknowledgement) => after(() => acknowledge(ack));

export async function submitContactForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleContact(formData, { notify });
}

export async function submitPartnerForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handlePartner(formData, { notify });
}

export async function submitNewsletterForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleNewsletter(formData, { notify });
}

/**
 * The Careers application, CV included. The visitor's address: x-real-ip, which Vercel sets to the connecting
 * client, else the first x-forwarded-for value. Without either, a CV upload is refused (see handleApplication).
 */
export async function submitApplicationForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  return handleApplication(formData, { ip, notify });
}
