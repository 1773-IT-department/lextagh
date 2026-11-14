"use server";

// Server actions behind the Hooch forms. The work happens in lib/forms/core.ts (validation, mapping to the database's
// intake functions, friendly errors); these only hand the submitted form over. Publishable key only.
import type { FormState } from "@lexta/forms/core";
import { handleConsumer, handleNewsletter, handleTrade } from "@/lib/forms/core";
import { getHoochProducts } from "@/lib/products";
import { CEREALS } from "@/lib/forms/options";

const cerealNames = Object.fromEntries(CEREALS.map((c) => [c.value, c.label]));

export async function submitConsumerForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const { products } = await getHoochProducts();
  return handleConsumer(formData, Object.fromEntries(products.map((p) => [p.slug, p.name])));
}

export async function submitTradeForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleTrade(formData, cerealNames);
}

export async function submitNewsletterForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleNewsletter(formData);
}
