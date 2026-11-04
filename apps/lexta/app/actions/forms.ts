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
 * The Careers application, CV included. The visitor's address is the first x-forwarded-for value, which Vercel sets
 * to the connecting client (good enough for per visitor upload limits; a visitor behind a shared network shares them).
 */
export async function submitApplicationForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return handleApplication(formData, { ip });
}
