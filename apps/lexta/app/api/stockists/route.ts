import { getStockists } from "@lexta/db";

export const runtime = "nodejs";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Where to Buy: the active stockists of one region, with the brands each carries.
 * GET /api/stockists?region=greater-accra
 * Reads with the publishable key (Row Level Security returns only active stockists and their public columns),
 * cached under the "stockists" tag for up to an hour and cleared by /api/revalidate when staff save a stockist.
 */
export async function GET(request: Request) {
  const region = new URL(request.url).searchParams.get("region")?.trim().toLowerCase() ?? "";
  if (!SLUG.test(region) || region.length > 60) {
    return Response.json({ ok: false, error: "Choose a region" }, { status: 400 });
  }
  try {
    const stockists = await getStockists({ region });
    return Response.json(
      {
        ok: true,
        stockists: stockists.map((s) => ({
          id: s.id, name: s.name, outletLabel: s.outletLabel, town: s.town, address: s.address, phone: s.phone,
          openingHours: s.openingHours, brands: s.brands.map((b) => b.name),
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.warn(`[stockists] could not load region ${region}: ${error instanceof Error ? error.message : String(error)}`);
    return Response.json({ ok: false, error: "Stockists are not available right now" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
