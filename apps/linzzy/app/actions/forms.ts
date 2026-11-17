"use server";

// Server actions behind the Linzzy forms. The work happens in lib/forms/core.ts (validation, mapping to the database's
// intake functions, friendly errors); these only hand the submitted form over. Publishable key only.
import { headers } from "next/headers";
import type { FormState } from "@lexta/forms/core";
import { requestComplaintUpload, type ComplaintUploadRequest, type ComplaintUploadTicket } from "@lexta/forms/complaint-file";
import { handleConsumer, handleNewsletter, handleTrade } from "@/lib/forms/core";
import { getLinzzyProducts } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";

const rangeNames = Object.fromEntries(RANGE_SLUGS.map((r) => [r, RANGES[r].name]));

export async function submitConsumerForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const { products } = await getLinzzyProducts();
  return handleConsumer(formData, Object.fromEntries(products.map((p) => [p.slug, p.name])), { ip: await visitorIp() });
}

export async function submitTradeForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleTrade(formData, rangeNames);
}

export async function submitNewsletterForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleNewsletter(formData);
}

/** The visitor's address: x-real-ip, which Vercel sets to the connecting client, else the first x-forwarded-for value. */
async function visitorIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

/** "Report a problem" with a photo or document: a one time upload ticket for the browser (see packages/forms). */
export async function startComplaintUpload(req: ComplaintUploadRequest): Promise<ComplaintUploadTicket> {
  return requestComplaintUpload(req, { ip: await visitorIp() });
}
