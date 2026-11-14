import { NextResponse, type NextRequest } from "next/server";
import { orderStatusLabel } from "@lexta/db";
import { filterArgs, parseOrderFilters } from "@/lib/order-filters";
import { getOrdersAccess } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** One CSV cell. Text a spreadsheet would run as a formula gets a leading apostrophe. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=@\t\r]/.test(s) || /^[+-](?![0-9 ()]*$)/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type Row = {
  reference: string; submitted_at: string; status: string; status_changed_at: string; organisation_name: string | null;
  delivery_region: string | null; delivery_address: string | null; distributor_notes: string | null; brand_name: string | null;
  product_name: string; sku_code: string; variant: string | null; pack_size: string; quantity: number;
};

/**
 * The inbox as CSV, one row per order line, with the same filters as the screen. Order staff only; the database
 * limits the rows to the orders of their brands. Internal notes are never exported. No prices: there are none.
 */
export async function GET(req: NextRequest) {
  const access = await getOrdersAccess();
  if (!access.isStaff) return new NextResponse("Your role does not include the orders inbox.", { status: 403 });
  const f = parseOrderFilters(Object.fromEntries(req.nextUrl.searchParams));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("distributor_order_export", filterArgs(f));
  if (error) {
    console.error("[orders] export failed", error);
    return new NextResponse("The export could not be made. Please try again.", { status: 500 });
  }
  const head = ["Order", "Submitted", "Status", "Status since", "Distributor", "Delivery region", "Delivery address", "Distributor notes",
    "Brand", "Product", "SKU", "Variant", "Pack size", "Packs"];
  const lines = [head.map(cell).join(",")];
  for (const r of (data ?? []) as Row[]) {
    lines.push([
      r.reference, r.submitted_at, orderStatusLabel(r.status), r.status_changed_at, r.organisation_name, r.delivery_region, r.delivery_address,
      r.distributor_notes, r.brand_name, r.product_name, r.sku_code, r.variant, r.pack_size, r.quantity,
    ].map(cell).join(","));
  }
  const day = new Date().toISOString().slice(0, 10);
  // A byte order mark so Excel reads names with accents correctly.
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lexta-orders-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
