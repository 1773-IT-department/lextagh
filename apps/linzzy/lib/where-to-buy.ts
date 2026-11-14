/**
 * Where to Buy for the Linzzy site, read the same way as the Lexta site's (apps/lexta/components/home/where-to-buy.ts
 * and app/api/stockists/route.ts): getRegions and getStockists in packages/db, with the publishable key (Row Level
 * Security only returns active stockists and their public columns), cached under the "stockists" tag and cleared by
 * /api/revalidate when staff save a stockist. The one difference: only stockists linked to the Linzzy brand
 * (public.stockist_brands, brand slug "linzzy") are shown.
 */
import { getRegions, getStockists, type PublicStockist } from "@lexta/db";
import { BRAND_SLUG } from "./products";

export type RegionOption = { slug: string; name: string };

/** One shop as the page and /api/stockists hand it to the browser. */
export type StockistItem = {
  id: string;
  name: string;
  outletType: string;
  outletLabel: string;
  town: string;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  region: string;
  regionSlug: string;
  position: { lat: number; lng: number } | null;
};

/** "All regions" in the picker. */
export const ALL_REGIONS = "all";

/** The busiest regions first, Greater Accra on top, as on the Lexta site. Other Ghana regions follow, then abroad. */
const ORDER = ["greater-accra", "ashanti", "western", "central", "eastern", "volta", "northern", "upper-east", "upper-west", "bono"];

/** Used when the database cannot be reached. */
export const FALLBACK_REGIONS: RegionOption[] = [
  { slug: "greater-accra", name: "Greater Accra" }, { slug: "ashanti", name: "Ashanti" }, { slug: "western", name: "Western" },
  { slug: "central", name: "Central" }, { slug: "eastern", name: "Eastern" }, { slug: "volta", name: "Volta" },
  { slug: "northern", name: "Northern" }, { slug: "upper-east", name: "Upper East" }, { slug: "upper-west", name: "Upper West" },
  { slug: "bono", name: "Bono" },
];

export async function getWhereToBuyRegions(): Promise<{ regions: RegionOption[]; live: boolean }> {
  try {
    const regions = await getRegions();
    if (regions.length === 0) throw new Error("the regions list is empty");
    const rank = (slug: string, isInGhana: boolean, k: number) => {
      const p = ORDER.indexOf(slug);
      if (!isInGhana) return 2000 + k;
      return p >= 0 ? p : 1000 + k;
    };
    return {
      regions: regions
        .map((r, k) => ({ r, key: rank(r.slug, r.isInGhana, k) }))
        .sort((a, b) => a.key - b.key)
        .map(({ r }) => ({ slug: r.slug, name: r.name })),
      live: true,
    };
  } catch (error) {
    console.warn(`[where-to-buy] showing the static region list: ${error instanceof Error ? error.message : String(error)}`);
    return { regions: FALLBACK_REGIONS, live: false };
  }
}

export function toItem(s: PublicStockist): StockistItem {
  return {
    id: s.id, name: s.name, outletType: s.outletType, outletLabel: s.outletLabel, town: s.town, address: s.address, phone: s.phone,
    openingHours: s.openingHours, region: s.region.name, regionSlug: s.region.slug, position: s.position,
  };
}

/** Active stockists that carry Linzzy, in one region or (region "all" or empty) everywhere. Throws when unreachable. */
export async function getLinzzyStockists(region?: string): Promise<StockistItem[]> {
  const list = await getStockists({ brandSlug: BRAND_SLUG, region: region && region !== ALL_REGIONS ? region : undefined });
  return list.map(toItem);
}
