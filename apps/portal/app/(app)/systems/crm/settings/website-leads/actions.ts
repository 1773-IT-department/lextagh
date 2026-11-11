"use server";

import { revalidatePath } from "next/cache";
import { getCrmAccess, UUID } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";
import type { CrmFormState } from "../../actions";

const PATH = "/systems/crm/settings/website-leads";

/**
 * Saves the default website lead manager and one manager per brand ("" means nobody for the default and "use the
 * default" for a brand). Only admins; the database checks again (save_crm_website_lead_managers, 0012).
 */
export async function saveWebsiteLeadManagers(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  if (!access.isAdmin) return { error: "Only admins can choose who manages website leads." };

  const raw = String(form.get("default_manager") ?? "");
  if (raw !== "" && !UUID.test(raw)) return { error: "Please choose a person from the list.", fieldErrors: { default_manager: "Choose a person from the list." } };
  const defaultManager = raw === "" ? null : raw;

  const brandIds = new Set(access.allBrands.map((b) => b.id));
  const brandManagers: Record<string, string | null> = {};
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("brand:") || typeof value !== "string") continue;
    const brandId = key.slice("brand:".length);
    if (!brandIds.has(brandId)) continue;
    if (value !== "" && !UUID.test(value)) {
      fieldErrors[key] = "Choose a person from the list.";
      continue;
    }
    brandManagers[brandId] = value === "" ? null : value;
  }
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_crm_website_lead_managers", {
    default_manager: defaultManager,
    brand_managers: brandManagers,
  });
  if (error) {
    if (error.code === "42501") return { error: "Only admins can choose who manages website leads." };
    if (error.code === "23514") {
      return { error: "One of the people you picked can no longer manage these leads (they may have been switched off, changed role or lost access to the brand). Reload the page and choose again." };
    }
    if (error.code === "22023") return { error: "Something you picked no longer exists. Reload the page and try again." };
    console.error("[crm] website lead managers save failed", error);
    return { error: "We could not save the managers. Please try again. If it keeps happening, tell the IT team." };
  }
  revalidatePath(PATH);
  return { message: "Saved. New website leads now go to the people you chose." };
}
