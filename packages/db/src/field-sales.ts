// Field sales (item 24) types, limits and helpers. Hand written from supabase/migrations/0011_field_sales.sql.
// No imports, so browser components can load it without the Supabase client.

export const FIELD_PHOTOS_BUCKET = "field-visit-photos";
/** The bucket's limit. Phones shrink photos before upload, so real uploads are far smaller. */
export const FIELD_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const FIELD_PHOTO_MAX_PER_VISIT = 10;
/** A rep may change their own visit for this long after making it (public.field_visit_can_edit). */
export const FIELD_EDIT_HOURS = 24;
export const FIELD_NOTES_MAX = 2000;
export const FIELD_FACINGS_MAX = 999;

export type FieldPhotoType = "image/jpeg" | "image/png" | "image/webp";
export const FIELD_PHOTO_TYPES: Readonly<Record<FieldPhotoType, "jpg" | "png" | "webp">> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * What the first bytes of a file say it is: JPEG (FF D8 FF), PNG (89 50 4E 47 0D 0A 1A 0A) or WebP (RIFF....WEBP).
 * Needs the first 12 bytes. Null for anything else, whatever its name or declared type.
 */
export function sniffFieldPhoto(head: Uint8Array): { mime: FieldPhotoType; ext: "jpg" | "png" | "webp" } | null {
  const starts = (sig: number[], at = 0) => sig.every((b, i) => head[at + i] === b);
  if (starts([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp" };
  return null;
}

export type LocationStatus = "captured" | "denied" | "unavailable";
export const LOCATION_LABELS: Readonly<Record<LocationStatus, string>> = {
  captured: "Location captured",
  denied: "Location not shared (refused on the phone)",
  unavailable: "Location not available",
};

/** A plain OpenStreetMap link to a point. No map API key needed. */
export const mapLink = (lat: number | string, lng: number | string) =>
  `https://www.openstreetmap.org/?mlat=${Number(lat)}&mlon=${Number(lng)}#map=18/${Number(lat)}/${Number(lng)}`;

export type FieldVisitOutcome = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

/** A shop the person may visit, from public.field_sales_shops(). */
export type FieldShop = {
  id: string;
  name: string;
  outlet_type: string;
  town: string;
  address: string | null;
  region_id: string;
  region_name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  is_active: boolean;
  distance_m: number | null;
  brand_ids: string[];
  crm_organisation_name: string | null;
  my_last_visit_at: string | null;
};

/** One row of public.field_visit_list(). */
export type FieldVisitRow = {
  id: string;
  visited_at: string;
  rep_id: string | null;
  rep_name: string | null;
  stockist_id: string | null;
  shop_name: string;
  new_shop: boolean;
  shop_is_active: boolean | null;
  region_id: string | null;
  region_name: string | null;
  town: string | null;
  brand_ids: string[];
  outcome_id: string;
  outcome_label: string;
  notes: string | null;
  location_status: LocationStatus;
  latitude: number | string | null;
  longitude: number | string | null;
  accuracy_m: number | null;
  distance_from_shop_m: number | null;
  photo_count: number;
  stock_count: number;
  on_shelf_count: number;
  crm_logged: boolean;
  created_at: string;
  total_count: number;
};

export type FieldStockCheck = {
  id: string;
  visit_id: string;
  sku_id: string | null;
  brand_id: string;
  product_name_snapshot: string;
  sku_code_snapshot: string;
  variant_snapshot: string | null;
  pack_size_snapshot: string;
  on_shelf: boolean;
  facings: number | null;
};

export type FieldVisitPhoto = {
  id: string;
  visit_id: string;
  storage_path: string;
  mime_type: FieldPhotoType;
  size_bytes: number;
  created_at: string;
  created_by: string | null;
};

/** What the phone sends to save a visit (POST /systems/field-sales/visits). */
export type FieldVisitPayload = {
  nonce: string;
  stockist_id?: string;
  new_shop?: { name: string; outlet_type: string; region_id: string; town: string; address?: string; phone?: string; brand_ids: string[] };
  location: { status: LocationStatus; latitude?: number; longitude?: number; accuracy?: number };
  outcome_id: string;
  notes?: string;
  stock?: { sku_id: string; on_shelf: boolean; facings?: number | null }[];
  log_to_crm?: boolean;
};

/** "about 40 m" or "about 1.2 km". */
export function formatDistance(m: number | null | undefined): string {
  if (m === null || m === undefined) return "";
  if (m < 1000) return `about ${Math.max(1, Math.round(m / 10) * 10)} m`;
  return `about ${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}
