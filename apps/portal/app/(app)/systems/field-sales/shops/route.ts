import { NextResponse, type NextRequest } from "next/server";
import { fieldApiAccess, SESSION_ENDED } from "@/lib/field-sales";
import { cleanSearch } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const coord = (v: string | null, max: number) => {
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null;
};

/**
 * Shops the signed in person may visit, nearest first when the phone sent its position. Row Level Security and
 * public.field_may_visit_stockist decide which shops come back (a sales rep gets the shops of their brands).
 */
export async function GET(req: NextRequest) {
  const access = await fieldApiAccess();
  if (!access) return NextResponse.json({ error: SESSION_ENDED, retry: false }, { status: 401 });
  if (!access.canView) return NextResponse.json({ error: "Your role does not include field sales." }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const lat = coord(sp.get("lat"), 90);
  const lng = coord(sp.get("lng"), 180);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("field_sales_shops", {
    p_lat: lat !== null && lng !== null ? lat : null,
    p_lng: lat !== null && lng !== null ? lng : null,
    p_q: cleanSearch(sp.get("q") ?? "", 80) || null,
    p_limit: 40,
  });
  if (error) {
    console.error("[field-sales] shops failed", error);
    return NextResponse.json({ error: "The shops could not be loaded. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ shops: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
