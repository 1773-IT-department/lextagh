"use server";

// The /unsubscribe page's button (P4). Plain form post, so it works without JavaScript; the answer is a redirect back
// to the page with the result. Publishable key only.
import { redirect } from "next/navigation";
import { newsletterUnsubscribe } from "@lexta/db";
import { formsConfigured } from "@/lib/forms/core";

export async function unsubscribeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();
  let result: "done" | "invalid" | "error" = "error";
  if (formsConfigured()) {
    try {
      const r = await newsletterUnsubscribe(token);
      result = r.ok ? "done" : r.reason === "invalid" ? "invalid" : "error";
    } catch {
      result = "error";
    }
  }
  redirect(`/unsubscribe?result=${result}`);
}
