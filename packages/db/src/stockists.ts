import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "./client";
import { outletTypeLabel, type OutletType } from "./types";

/** Cache tag the websites use for stockist data; the revalidate route clears it. */
export const STOCKISTS_CACHE_TAG = "stockists";

/** What a website may show about a stockist. Staff notes and who changed it are never included. */
export type PublicStockist = {
  id: string;
  name: string;
  outletType: OutletType;
  outletLabel: string;
  town: string;
  address: string | null;
  phone: string | null;
  /** Map position, or null when staff have not set one. */
  position: { lat: number; lng: number } | null;
  openingHours: string | null;
  region: { slug: string; name: string; isInGhana: boolean };
  brands: { slug: string; name: string }[];
};

export type StockistFilter = {
  /** Only stockists that carry this brand, for example "yazz". */
  brandSlug?: string;
  /** Only stockists in this region, for example "greater-accra". */
  region?: string;
};

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PAGE = 1000;

// Public columns only: anon cannot read created_by, updated_by or the notes table, so never select "*".
const COLUMNS =
  "id, name, outlet_type, town, address, phone, latitude, longitude, opening_hours, " +
  "region:regions!inner(slug, name, is_in_ghana, sort_order), stockist_brands(brand:brands(slug, name))";

type Row = {
  id: string;
  name: string;
  outlet_type: OutletType;
  town: string;
  address: string | null;
  phone: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  opening_hours: string | null;
  region: { slug: string; name: string; is_in_ghana: boolean; sort_order: number } | { slug: string; name: string; is_in_ghana: boolean; sort_order: number }[];
  stockist_brands: { brand: { slug: string; name: string } | { slug: string; name: string }[] | null }[] | null;
};

const one = <T>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined);

/**
 * Active stockists for Where to Buy, sorted by region, town and name.
 * For the websites: uses the publishable key, so Row Level Security only returns active stockists and
 * the brands they carry. Requests are cached under the "stockists" tag, so a portal save refreshes pages.
 * An unknown or malformed brand or region gives an empty list rather than an error.
 */
export async function getStockists(filter: StockistFilter = {}, client?: SupabaseClient): Promise<PublicStockist[]> {
  const brandSlug = filter.brandSlug?.trim().toLowerCase();
  const region = filter.region?.trim().toLowerCase();
  if ((brandSlug && !SLUG.test(brandSlug)) || (region && !SLUG.test(region))) return [];

  const supabase = client ?? createPublicClient({ cacheTags: [STOCKISTS_CACHE_TAG], revalidateSeconds: 3600 });
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from("stockists").select(COLUMNS).eq("is_active", true).order("id").range(from, from + PAGE - 1);
    if (region) query = query.eq("region.slug", region);
    const { data, error } = await query;
    if (error) throw new Error(`Could not load stockists: ${error.message}`);
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE) break;
  }

  const result: (PublicStockist & { sortRegion: number })[] = [];
  for (const r of rows) {
    const reg = one(r.region);
    if (!reg) continue;
    const brands = (r.stockist_brands ?? [])
      .map((l) => one(l.brand))
      .filter((b): b is { slug: string; name: string } => !!b)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (brandSlug && !brands.some((b) => b.slug === brandSlug)) continue;
    const lat = r.latitude === null ? null : Number(r.latitude);
    const lng = r.longitude === null ? null : Number(r.longitude);
    result.push({
      id: r.id,
      name: r.name,
      outletType: r.outlet_type,
      outletLabel: outletTypeLabel(r.outlet_type),
      town: r.town,
      address: r.address,
      phone: r.phone,
      position: lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      openingHours: r.opening_hours,
      region: { slug: reg.slug, name: reg.name, isInGhana: reg.is_in_ghana },
      brands,
      sortRegion: reg.sort_order,
    });
  }
  return result
    .sort((a, b) => a.sortRegion - b.sortRegion || a.town.localeCompare(b.town) || a.name.localeCompare(b.name))
    .map(({ sortRegion: _sortRegion, ...s }) => s);
}

/** A region as the websites show it in Where to Buy. */
export type PublicRegion = { slug: string; name: string; isInGhana: boolean };

/**
 * Every region for the Where to Buy picker, in the order staff set (Ghana first, then outside Ghana).
 * Uses the publishable key and is cached under the "stockists" tag like the stockists themselves.
 */
export async function getRegions(client?: SupabaseClient): Promise<PublicRegion[]> {
  const supabase = client ?? createPublicClient({ cacheTags: [STOCKISTS_CACHE_TAG], revalidateSeconds: 3600 });
  const { data, error } = await supabase.from("regions").select("slug, name, is_in_ghana, sort_order").order("sort_order").order("name");
  if (error) throw new Error(`Could not load regions: ${error.message}`);
  type RegionRow = { slug: string; name: string; is_in_ghana: boolean; sort_order: number };
  return ((data ?? []) as RegionRow[])
    .sort((a, b) => Number(b.is_in_ghana) - Number(a.is_in_ghana) || a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((r) => ({ slug: r.slug, name: r.name, isInGhana: r.is_in_ghana }));
}
