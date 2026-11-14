/**
 * Where to Buy (Home page): the region list for the picker, read from the database.
 * The stockists of a region come from /api/stockists when the visitor asks, so the Home page stays small
 * however many shops staff add. Both reads use the publishable key and are cached under the "stockists" tag,
 * which the portal clears through /api/revalidate after every stockist save.
 */
import { getRegions } from "@lexta/db";
import type { RegionOption } from "./StockistFinder";

/** The prototype's order: the busiest regions first, Greater Accra selected. Other regions follow. */
const PROTOTYPE_ORDER = [
  "greater-accra", "ashanti", "western", "central", "eastern", "volta", "northern", "upper-east", "upper-west", "bono",
];

/** The approved prototype list, used when the database cannot be reached. */
export const FALLBACK_REGIONS: RegionOption[] = [
  { slug: "greater-accra", name: "Greater Accra" }, { slug: "ashanti", name: "Ashanti" }, { slug: "western", name: "Western" },
  { slug: "central", name: "Central" }, { slug: "eastern", name: "Eastern" }, { slug: "volta", name: "Volta" },
  { slug: "northern", name: "Northern" }, { slug: "upper-east", name: "Upper East" }, { slug: "upper-west", name: "Upper West" },
  { slug: "bono", name: "Bono" }, { slug: "liberia-monrovia", name: "Liberia (Monrovia)" },
];

/** Every region, in the prototype's order, then the other Ghana regions, then outside Ghana (Liberia). */
export async function getWhereToBuyRegions(): Promise<RegionOption[]> {
  try {
    const regions = await getRegions();
    if (regions.length === 0) throw new Error("the regions list is empty");
    const rank = (slug: string, isInGhana: boolean, k: number) => {
      const p = PROTOTYPE_ORDER.indexOf(slug);
      if (!isInGhana) return 2000 + k;
      return p >= 0 ? p : 1000 + k;
    };
    return regions
      .map((r, k) => ({ r, key: rank(r.slug, r.isInGhana, k) }))
      .sort((a, b) => a.key - b.key)
      .map(({ r }) => ({ slug: r.slug, name: r.name }));
  } catch (error) {
    console.warn(`[where-to-buy] showing the static region list: ${error instanceof Error ? error.message : String(error)}`);
    return FALLBACK_REGIONS;
  }
}
