import { NextResponse, type NextRequest } from "next/server";
import { LOCATION_LABELS, mapLink, type FieldVisitRow } from "@lexta/db";
import { formatDateTime } from "@/lib/crm";
import { brandNames, fieldFilterArgs, getFieldAccess, parseFieldFilters } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** One CSV cell. Text a spreadsheet would run as a formula gets a leading apostrophe. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=@\t\r]/.test(s) || /^[+-](?![0-9 ().]*$)/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Visits as CSV, one row per visit, with the same filters as the screen (at most 5000 rows). Field sales roles only;
 * the database limits a sales rep to their own visits.
 */
export async function GET(req: NextRequest) {
  const access = await getFieldAccess();
  if (!access.canView) return new NextResponse("Your role does not include field sales.", { status: 403 });
  const f = parseFieldFilters(Object.fromEntries(req.nextUrl.searchParams));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("field_visit_list", { ...fieldFilterArgs(f), p_limit: 5000, p_offset: 0 });
  if (error) {
    console.error("[field-sales] export failed", error);
    return new NextResponse("The export could not be made. Please try again.", { status: 500 });
  }
  const head = ["Visited (Ghana time)", "Rep", "Shop", "New shop", "Town", "Region", "Brands", "Outcome", "Notes", "Location",
    "Latitude", "Longitude", "Accuracy (m)", "Distance from shop (m)", "Map link", "Photos", "SKUs checked", "SKUs on shelf", "On CRM timeline"];
  const lines = [head.map(cell).join(",")];
  for (const r of (data ?? []) as FieldVisitRow[]) {
    const hasPoint = r.latitude !== null && r.longitude !== null;
    lines.push([
      formatDateTime(r.visited_at), r.rep_name ?? "Former team member", r.shop_name,
      r.new_shop ? (r.shop_is_active ? "Yes, confirmed" : "Yes, to confirm") : "No",
      r.town, r.region_name, brandNames(access, r.brand_ids), r.outcome_label, r.notes, LOCATION_LABELS[r.location_status],
      r.latitude, r.longitude, r.accuracy_m, r.distance_from_shop_m, hasPoint ? mapLink(r.latitude!, r.longitude!) : "",
      r.photo_count, r.stock_count, r.on_shelf_count, r.crm_logged ? "Yes" : "No",
    ].map(cell).join(","));
  }
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lexta-field-visits-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
