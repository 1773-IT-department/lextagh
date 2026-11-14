import { NextResponse, type NextRequest } from "next/server";
import { FIELD_FACINGS_MAX, FIELD_NOTES_MAX, OUTLET_TYPES, type FieldVisitPayload } from "@lexta/db";
import { UUID } from "@/lib/crm";
import { FIELD_BASE, fieldApiAccess, fieldDbError, SESSION_ENDED, type FieldAccess } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const PHONE = /^\+?[0-9][0-9 ()-]{5,22}$/;
type Fail = { error: string; field?: string };

const str = (v: unknown, max: number): string | null => {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const t = v.replace(/\r\n/g, "\n").trim();
  return t.length > max ? null : t;
};

/** Checks what the phone sent and turns it into the details public.save_field_visit takes. */
function check(body: unknown, access: FieldAccess): { nonce: string; details: Record<string, unknown> } | Fail {
  if (!body || typeof body !== "object") return { error: "The visit could not be read. Reload the page and try again." };
  const b = body as Partial<FieldVisitPayload> & Record<string, unknown>;
  if (typeof b.nonce !== "string" || !UUID.test(b.nonce)) return { error: "The visit could not be read. Reload the page and try again." };
  if (typeof b.outcome_id !== "string" || !UUID.test(b.outcome_id) || !access.outcomes.some((o) => o.id === b.outcome_id && o.is_active)) {
    return { error: "Choose an outcome.", field: "outcome" };
  }
  const notes = b.notes === undefined || b.notes === "" ? "" : str(b.notes, FIELD_NOTES_MAX);
  if (notes === null) return { error: `Notes can be up to ${FIELD_NOTES_MAX} characters.`, field: "notes" };

  const loc = b.location;
  let location: Record<string, unknown>;
  if (!loc || typeof loc !== "object" || !["captured", "denied", "unavailable"].includes(String(loc.status))) {
    return { error: "The location could not be read. Try again." };
  }
  if (loc.status === "captured") {
    const { latitude, longitude, accuracy } = loc;
    if (typeof latitude !== "number" || typeof longitude !== "number" || typeof accuracy !== "number"
      || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(accuracy)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0) {
      return { error: "The location could not be read. Try capturing it again." };
    }
    location = { status: "captured", latitude, longitude, accuracy: Math.min(100000, accuracy) };
  } else {
    location = { status: loc.status };
  }

  const details: Record<string, unknown> = { outcome_id: b.outcome_id, notes, location, log_to_crm: b.log_to_crm !== false };

  if (b.new_shop) {
    if (!access.canAddShop) return { error: "Your role cannot add new shops. Pick a listed shop." };
    const s = b.new_shop as Record<string, unknown>;
    const name = str(s.name, 160);
    const town = str(s.town, 80);
    const address = s.address ? str(s.address, 300) : "";
    const phone = s.phone ? str(s.phone, 30) : "";
    if (!name) return { error: "Enter the shop's name.", field: "shop_name" };
    if (!OUTLET_TYPES.some((o) => o.value === s.outlet_type)) return { error: "Choose the type of shop.", field: "outlet_type" };
    if (typeof s.region_id !== "string" || !access.regions.some((r) => r.id === s.region_id)) return { error: "Choose the region.", field: "region_id" };
    if (!town) return { error: "Enter the town.", field: "town" };
    if (address === null) return { error: "The address can be up to 300 characters.", field: "address" };
    if (phone === null || (phone && !PHONE.test(phone))) return { error: "Enter a phone number like 024 123 4567.", field: "phone" };
    const brandIds = Array.isArray(s.brand_ids) ? s.brand_ids.filter((x): x is string => typeof x === "string") : [];
    if (!brandIds.length) return { error: "Choose at least one brand the shop sells.", field: "brands" };
    if (brandIds.some((id) => !access.myBrandIds.has(id))) return { error: "Choose only brands you work on.", field: "brands" };
    details.new_shop = { name, outlet_type: s.outlet_type, region_id: s.region_id, town, address, phone, brand_ids: [...new Set(brandIds)] };
  } else {
    if (typeof b.stockist_id !== "string" || !UUID.test(b.stockist_id)) return { error: "Choose a shop or add a new one.", field: "shop" };
    details.stockist_id = b.stockist_id;
  }

  if (b.stock !== undefined) {
    if (!Array.isArray(b.stock) || b.stock.length > 300) return { error: "The stock check could not be read." };
    const seen = new Set<string>();
    const stock = [];
    for (const line of b.stock as unknown[]) {
      const l = line as Record<string, unknown>;
      if (!l || typeof l.sku_id !== "string" || !UUID.test(l.sku_id) || typeof l.on_shelf !== "boolean" || seen.has(l.sku_id)) {
        return { error: "The stock check could not be read." };
      }
      seen.add(l.sku_id);
      let facings: number | null = null;
      if (l.facings !== undefined && l.facings !== null && l.facings !== "") {
        if (typeof l.facings !== "number" || !Number.isInteger(l.facings) || l.facings < 0 || l.facings > FIELD_FACINGS_MAX) {
          return { error: `Facings are whole numbers up to ${FIELD_FACINGS_MAX}.`, field: "stock" };
        }
        facings = l.on_shelf ? l.facings : null;
      }
      stock.push({ sku_id: l.sku_id, on_shelf: l.on_shelf, facings });
    }
    details.stock = stock;
  }
  return { nonce: b.nonce, details };
}

/**
 * Saves a visit from the phone. The nonce the phone made becomes the visit id, so sending the same visit again (after
 * a dropped connection) returns the visit already saved instead of saving it twice, also while the first save is still
 * running (public.save_field_visit waits on a lock per nonce). Answers JSON:
 * 200 {id, created, crm_logged} or 4xx/5xx {error, field?}. The phone retries on 5xx and network errors only.
 */
export async function POST(req: NextRequest) {
  const access = await fieldApiAccess();
  if (!access) return NextResponse.json({ error: SESSION_ENDED, retry: false }, { status: 401 });
  if (!access.canView) return NextResponse.json({ error: "Your role does not include field sales." }, { status: 403 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "The visit could not be read. Reload the page and try again." }, { status: 400 });
  }
  const checked = check(body, access);
  if ("error" in checked) return NextResponse.json(checked, { status: 422 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_field_visit", { nonce: checked.nonce, details: checked.details });
  if (error) {
    const status = ["42501", "23505", "23514", "22023", "23502", "22P02", "23503"].includes(error.code ?? "") ? 422 : 500;
    return NextResponse.json({ error: fieldDbError(error, "save") }, { status });
  }
  const saved = data as { id: string; created: boolean; crm_logged: boolean };
  revalidatePath(FIELD_BASE, "layout");
  return NextResponse.json({ id: saved.id, created: saved.created, crm_logged: saved.crm_logged }, { headers: { "Cache-Control": "no-store" } });
}
