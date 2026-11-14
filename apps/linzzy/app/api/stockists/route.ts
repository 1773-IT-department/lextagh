import { getRegions } from "@lexta/db";
import { ALL_REGIONS, getLinzzyStockists } from "@/lib/where-to-buy";

export const runtime = "nodejs";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Where to Buy: the active stockists that carry Linzzy, in one region or everywhere.
 * GET /api/stockists?region=greater-accra   (or region=all)
 * The same route as the Lexta site's, filtered to the Linzzy brand: publishable key (Row Level Security returns only
 * active stockists and their public columns), cached under the "stockists" tag for up to an hour and cleared by
 * /api/revalidate when staff save a stockist. The region must be one of the regions in the database (made up names are
 * refused with 400 and never cause a stockists read).
 */
export async function GET(request: Request) {
  const noStore = { "cache-control": "no-store" };
  const region = new URL(request.url).searchParams.get("region")?.trim().toLowerCase() || ALL_REGIONS;
  if (!SLUG.test(region) || region.length > 60) return Response.json({ ok: false, error: "Choose a region" }, { status: 400, headers: noStore });
  try {
    if (region !== ALL_REGIONS) {
      const regions = await getRegions();
      if (!regions.some((r) => r.slug === region)) return Response.json({ ok: false, error: "Choose a region" }, { status: 400, headers: noStore });
    }
    const stockists = await getLinzzyStockists(region);
    return Response.json({ ok: true, stockists }, { headers: noStore });
  } catch (error) {
    console.warn(`[stockists] could not load region ${region}: ${error instanceof Error ? error.message : String(error)}`);
    return Response.json({ ok: false, error: "Stockists are not available right now" }, { status: 503, headers: noStore });
  }
}
