"use server";

// Server actions behind the website forms. The work happens in lib/forms/core.ts (validation, mapping to the
// database's intake functions, friendly errors); these only hand the submitted form over. Publishable key only.
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
