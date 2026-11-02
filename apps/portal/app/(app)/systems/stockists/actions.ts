"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifySites } from "@/lib/revalidate-sites";
import { checkCsv, checkStockist, duplicateKey, type ImportReport } from "@/lib/stockist-input";
import { getStockistAccess } from "@/lib/stockists";
import { createClient } from "@/lib/supabase/server";

export type StockistFormState = { error?: string; message?: string; fieldErrors?: Record<string, string> };
export type ActionResult = { error?: string };
export type ImportState = ImportReport & { imported?: number; checked?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NO_PERMISSION = "You do not have permission to change this stockist. It carries a brand you do not work on.";
const READ_ONLY = "Your role can view stockists but not change them.";

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

async function afterChange(reason: string, stockistId?: string) {
  revalidatePath("/systems/stockists");
  if (stockistId) revalidatePath(`/systems/stockists/${stockistId}`);
  await notifySites(reason, ["stockists"]);
}

function dbError(error: { code?: string; message: string }, context: string): string {
  if (error.code === "42501") return NO_PERMISSION;
  if (error.code === "23505") return "This shop is already in the system with the same name, region, town and address.";
  if (error.code === "23514" || error.code === "22P02" || error.code === "22003") return "One of the fields is too long or in the wrong format. Please check and try again.";
  if (error.code === "23503") return "The region or a brand no longer exists. Reload the page and try again.";
  console.error(`[stockists] ${context} failed`, error);
  return "We could not save the stockist. Please try again.";
}

/** Create or update a stockist with the brands it carries, in one database call (save_stockist). */
export async function saveStockist(_prev: StockistFormState, form: FormData): Promise<StockistFormState> {
  const access = await getStockistAccess();
  if (!access.canCreate) return { error: READ_ONLY };

  const id = text(form, "id");
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This stockist could not be found." };
  const brandsOnly = !isNew && form.get("mode") === "brands";

  const myIds = new Set(access.myBrands.map((b) => b.id));
  const ticked = form.getAll("brand_ids").map(String).filter((b) => UUID.test(b));
  if (ticked.some((b) => !myIds.has(b))) return { error: "You can only add brands you work on." };

  const supabase = await createClient();

  // Brands other people manage stay exactly as they are; this person only changes their own.
  let kept: string[] = [];
  if (!isNew) {
    const { data: current, error } = await supabase.from("stockist_brands").select("brand_id").eq("stockist_id", id);
    if (error) return { error: dbError(error, "load brands") };
    kept = (current ?? []).map((l) => l.brand_id as string).filter((b) => !myIds.has(b));
  }
  const brandIds = [...new Set([...kept, ...ticked])];
  if (brandIds.length === 0) {
    return { error: "Tick at least one brand the shop carries.", fieldErrors: { brands: "Tick at least one brand." } };
  }

  let details: Record<string, unknown> | null = null;
  if (!brandsOnly) {
    const checked = checkStockist(
      {
        name: text(form, "name"), outlet_type: text(form, "outlet_type"), region: text(form, "region_id"), town: text(form, "town"),
        address: text(form, "address"), phone: text(form, "phone"), latitude: text(form, "latitude"), longitude: text(form, "longitude"),
        opening_hours: text(form, "opening_hours"), notes: text(form, "notes"),
      },
      access.regions,
    );
    if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };
    details = checked.details;
  }

  const { data: savedId, error } = await supabase.rpc("save_stockist", {
    target_id: isNew ? null : id,
    details,
    brand_ids: brandIds,
  });
  if (error || typeof savedId !== "string") {
    if (error?.code === "23505") {
      return { error: dbError(error, "save"), fieldErrors: { name: "Already listed in this town at this address." } };
    }
    return { error: error ? dbError(error, "save") : "We could not save the stockist. Please try again." };
  }

  await afterChange(isNew ? "stockist created" : "stockist updated", savedId);
  if (isNew) redirect(`/systems/stockists/${savedId}?created=1`);
  return { message: "Saved. Where to Buy on the websites will show the change shortly." };
}

/** Deactivate (hide from the websites) or reactivate. */
export async function setStockistActive(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const access = await getStockistAccess();
  if (!access.canCreate) return { error: READ_ONLY };
  const id = text(form, "id");
  const active = form.get("active") === "true";
  if (!UUID.test(id)) return { error: "This stockist could not be found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("stockists").update({ is_active: active }).eq("id", id).select("id");
  if (error || !data?.length) {
    if (error) console.error("[stockists] activate failed", error);
    return { error: !error ? NO_PERMISSION : active ? "The stockist could not be reactivated. Please try again." : "The stockist could not be deactivated. Please try again." };
  }
  await afterChange(active ? "stockist reactivated" : "stockist deactivated", id);
  return {};
}

export async function deleteStockist(stockistId: string): Promise<void> {
  const access = await getStockistAccess();
  if (!access.canCreate || !UUID.test(stockistId)) redirect(`/systems/stockists/${stockistId}?error=delete`);
  const supabase = await createClient();
  // Brand links and notes are removed with it by the database (on delete cascade), so nothing is left behind.
  const { data, error } = await supabase.from("stockists").delete().eq("id", stockistId).select("id");
  if (error || !data?.length) {
    if (error) console.error("[stockists] delete failed", error);
    redirect(`/systems/stockists/${stockistId}?error=delete`);
  }
  await afterChange("stockist deleted");
  redirect("/systems/stockists?deleted=1");
}

// CSV import -----------------------------------------------------------------------------

async function loadExistingKeys(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Set<string> | null> {
  const keys = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("stockists").select("name, region_id, town, address").order("id").range(from, from + 999);
    if (error) return null;
    for (const r of data ?? []) keys.add(duplicateKey(r as { name: string; region_id: string; town: string; address: string | null }));
    if (!data || data.length < 1000) break;
  }
  return keys;
}

async function checkImportText(csv: string) {
  const access = await getStockistAccess();
  if (!access.canCreate) return { access, report: { rows: [], valid: 0, invalid: 0, error: READ_ONLY } as ImportReport };
  const supabase = await createClient();
  const existingKeys = await loadExistingKeys(supabase);
  if (!existingKeys) return { access, supabase, report: { rows: [], valid: 0, invalid: 0, error: "We could not load the current stockists to check for duplicates. Please try again." } };
  const report = checkCsv(csv, { regions: access.regions, allBrands: access.allBrands, linkable: access.myBrands, existingKeys });
  return { access, supabase, report };
}

/** Checks every row and reports problems, without saving anything. */
export async function checkImport(_prev: ImportState, form: FormData): Promise<ImportState> {
  const { report } = await checkImportText(text(form, "csv"));
  return { ...report, checked: true };
}

/** Checks again on the server, then adds every valid row in one all or nothing database call. */
export async function runImport(_prev: ImportState, form: FormData): Promise<ImportState> {
  const { report, supabase } = await checkImportText(text(form, "csv"));
  if (report.error || !supabase) return { ...report, checked: true };
  const valid = report.rows.filter((r) => r.errors.length === 0 && r.details);
  if (!valid.length) return { ...report, checked: true, error: "No row is ready to import. Fix the rows marked below and check again." };

  const items = valid.map((r) => ({ line: r.line, details: r.details, brand_ids: r.brandIds }));
  const { data, error } = await supabase.rpc("import_stockists", { items });
  if (error) {
    const row = /^row (\d+):/.exec(error.message)?.[1];
    const reason = dbError(error, "import");
    return {
      ...report,
      checked: true,
      error: `Nothing was imported. ${row ? `Row ${row}: ` : ""}${reason}`,
    };
  }
  await afterChange(`${data ?? valid.length} stockists imported`);
  return { ...report, checked: true, imported: typeof data === "number" ? data : valid.length };
}
