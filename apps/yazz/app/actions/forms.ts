"use server";

// Server actions behind the Yazz forms. The work happens in lib/forms/core.ts (validation, mapping to the database's
// intake functions, friendly errors); these only hand the submitted form over. Publishable key only.
import type { FormState } from "@lexta/forms/core";
import { handleConsumer, handleNewsletter, handleTrade } from "@/lib/forms/core";
import { getYazzProducts } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";

const rangeNames = Object.fromEntries(RANGE_SLUGS.map((r) => [r, RANGES[r].name]));

export async function submitConsumerForm(_prev: FormState, formData: FormData): Promise<FormState> {
  const { products } = await getYazzProducts();
  return handleConsumer(formData, Object.fromEntries(products.map((p) => [p.slug, p.name])));
}

export async function submitTradeForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleTrade(formData, rangeNames);
}

export async function submitNewsletterForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleNewsletter(formData);
}
