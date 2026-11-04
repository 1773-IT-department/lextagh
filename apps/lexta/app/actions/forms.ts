"use server";

// Server actions behind the website forms. The work happens in lib/forms/core.ts (validation, mapping to the
// database's intake functions, friendly errors); these only hand the submitted form over. Publishable key only.
import { headers } from "next/headers";
import { handleApplication } from "@/lib/forms/careers";
import { handleContact, handleNewsletter, handlePartner, type FormState } from "@/lib/forms/core";

export async function submitContactForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleContact(formData);
}

export async function submitPartnerForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handlePartner(formData);
}

export async function submitNewsletterForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleNewsletter(formData);
}

/**
 * The Careers application, CV included. The visitor's address: x-real-ip, which Vercel sets to the connecting
 * client, else the first x-forwarded-for value. Without either, a CV upload is refused (see handleApplication).
 */
export async function submitApplicationForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  return handleApplication(formData, { ip });
}
