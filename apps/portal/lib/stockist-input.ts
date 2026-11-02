import { OUTLET_TYPES, type OutletType } from "@lexta/db";

/**
 * Checking stockist data from the portal form and from CSV imports.
 * Same limits as the checks in supabase/migrations/0005_stockists.sql, so people get a clear message
 * instead of a database error.
 */

export const CSV_HEADER = ["name", "outlet_type", "region", "town", "address", "phone", "latitude", "longitude", "brands"] as const;
export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 1_000_000;

const PHONE = /^\+?[0-9][0-9 ()-]{5,22}$/;

export type StockistDetails = {
  name: string;
  outlet_type: OutletType;
  region_id: string;
  town: string;
  address: string | null;
  phone: string | null;
  latitude: string | null;
  longitude: string | null;
  opening_hours: string | null;
  notes: string | null;
};

export type RawStockist = {
  name: string;
  outlet_type: string;
  region: string;
  town: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  opening_hours?: string;
  notes?: string;
};

type Lookup = { id: string; slug: string; name: string };

const squash = (v: string) => v.replace(/\s+/g, " ").trim();
/** Lowercase letters and digits only, for forgiving matches ("Greater Accra Region" = "greater-accra"). */
const key = (v: string) => v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

export function matchOutletType(value: string): OutletType | null {
  const k = key(value);
  if (!k) return null;
  const direct = OUTLET_TYPES.find((o) => key(o.value) === k || key(o.label) === k);
  if (direct) return direct.value;
  const aliases: Record<string, OutletType> = {
    market: "open_market",
    openmarket: "open_market",
    generaltrade: "general_trade",
    neighbourhoodshop: "general_trade",
    neighborhoodshop: "general_trade",
    shop: "general_trade",
    provisionshop: "general_trade",
    kiosk: "general_trade",
    chemist: "pharmacy",
    chemicalshop: "pharmacy",
    mart: "supermarket",
    wholesaler: "distributor",
  };
  return aliases[k] ?? null;
}

export function matchRegion<T extends Lookup>(value: string, regions: T[]): T | null {
  const k = key(value).replace(/region$/, "");
  if (!k) return null;
  return (
    regions.find((r) => r.id === value.trim() || key(r.slug) === k || key(r.name) === k) ??
    // "Liberia" or "Monrovia" alone still finds "Liberia (Monrovia)".
    (k === "liberia" || k === "monrovia" ? regions.find((r) => r.slug === "liberia-monrovia") ?? null : null)
  );
}

export function matchBrand<T extends Lookup>(value: string, brands: T[]): T | null {
  const k = key(value);
  return k ? brands.find((b) => key(b.slug) === k || key(b.name) === k) ?? null : null;
}

function parseCoordinate(value: string, limit: number): number | null | "bad" {
  const v = value.trim();
  if (v === "") return null;
  if (!/^-?\d{1,3}(\.\d+)?$/.test(v)) return "bad";
  const n = Number(v);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return "bad";
  return Math.round(n * 1e6) / 1e6;
}

/** Checks one stockist. Returns field errors keyed by field name, or the clean details. */
export function checkStockist(raw: RawStockist, regions: Lookup[]): { details?: StockistDetails; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = squash(raw.name);
  const town = squash(raw.town);
  const address = squash(raw.address);
  const phone = squash(raw.phone);
  const hours = squash(raw.opening_hours ?? "");
  const notes = (raw.notes ?? "").trim();

  if (!name) errors.name = "Enter the shop name.";
  else if (name.length > 160) errors.name = "Keep the name under 160 characters.";

  const outlet = matchOutletType(raw.outlet_type);
  if (!outlet) errors.outlet_type = raw.outlet_type.trim()
    ? `"${raw.outlet_type.trim().slice(0, 40)}" is not a known outlet type. Use supermarket, pharmacy, open market, general trade, distributor or other.`
    : "Choose the outlet type.";

  const region = matchRegion(raw.region, regions);
  if (!region) errors.region = raw.region.trim() ? `"${raw.region.trim().slice(0, 40)}" is not a known region.` : "Choose the region.";

  if (!town) errors.town = "Enter the town.";
  else if (town.length > 80) errors.town = "Keep the town under 80 characters.";
  if (address.length > 300) errors.address = "Keep the address under 300 characters.";
  if (phone && !PHONE.test(phone)) errors.phone = "Use digits, spaces and an optional + at the start, for example +233 20 123 4567.";
  if (hours.length > 200) errors.opening_hours = "Keep opening hours under 200 characters.";
  if (notes.length > 2000) errors.notes = "Keep notes under 2000 characters.";

  const lat = parseCoordinate(raw.latitude, 90);
  const lng = parseCoordinate(raw.longitude, 180);
  if (lat === "bad") errors.latitude = "Latitude must be a number between -90 and 90, for example 5.6037.";
  if (lng === "bad") errors.longitude = "Longitude must be a number between -180 and 180, for example -0.1870.";
  if (lat !== "bad" && lng !== "bad" && (lat === null) !== (lng === null)) {
    errors[lat === null ? "latitude" : "longitude"] = "Enter both latitude and longitude, or leave both empty.";
  }

  if (Object.keys(errors).length || !outlet || !region || lat === "bad" || lng === "bad") return { errors };
  return {
    errors,
    details: {
      name,
      outlet_type: outlet,
      region_id: region.id,
      town,
      address: address || null,
      phone: phone || null,
      latitude: lat === null ? null : String(lat),
      longitude: lng === null ? null : String(lng),
      opening_hours: hours || null,
      notes: notes || null,
    },
  };
}

/** The key the database uses to spot the same shop listed twice (see stockists_unique_outlet_idx). */
export function duplicateKey(d: { name: string; region_id: string; town: string; address: string | null }): string {
  return [d.name.trim().toLowerCase(), d.region_id, d.town.trim().toLowerCase(), (d.address ?? "").trim().toLowerCase()].join("|");
}

/** Reads CSV text (commas, double quotes, "" inside quotes, CRLF or LF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export type ImportRow = {
  line: number;
  name: string;
  errors: string[];
  details?: StockistDetails;
  brandIds?: string[];
};

export type ImportReport = {
  error?: string;
  rows: ImportRow[];
  valid: number;
  invalid: number;
};

/**
 * Checks a whole CSV. Every row gets its own list of problems; rows without problems can be imported.
 * linkable: the brands this person may add. existingKeys: duplicateKey() of stockists already saved.
 */
export function checkCsv(
  text: string,
  ctx: { regions: Lookup[]; allBrands: Lookup[]; linkable: Lookup[]; existingKeys: Set<string> },
): ImportReport {
  const empty = { rows: [], valid: 0, invalid: 0 };
  if (!text.trim()) return { ...empty, error: "Paste the CSV text or choose a CSV file first." };
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) return { ...empty, error: "The file is larger than 1 MB. Split it into smaller files." };

  const table = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (!table.length) return { ...empty, error: "The CSV has no rows." };
  const header = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const missing = CSV_HEADER.filter((h) => !header.includes(h));
  if (missing.length) {
    return { ...empty, error: `The first line must be the header ${CSV_HEADER.join(",")}. Missing: ${missing.join(", ")}.` };
  }
  const body = table.slice(1);
  if (!body.length) return { ...empty, error: "The CSV has a header but no shops." };
  if (body.length > MAX_IMPORT_ROWS) return { ...empty, error: `Import at most ${MAX_IMPORT_ROWS} shops at a time. This file has ${body.length}.` };

  const col = (r: string[], name: string) => r[header.indexOf(name)] ?? "";
  const linkable = new Set(ctx.linkable.map((b) => b.id));
  const seen = new Map<string, number>();

  // Row numbers count the header as row 1, like a spreadsheet; blank lines are skipped in the count.
  const rows: ImportRow[] = body.map((r, index) => {
    const line = index + 2;
    const errors: string[] = [];
    if (r.length > header.length) errors.push(`Has ${r.length} columns but the header has ${header.length}. Put text that contains commas in double quotes.`);
    const { details, errors: fieldErrors } = checkStockist(
      {
        name: col(r, "name"), outlet_type: col(r, "outlet_type"), region: col(r, "region"), town: col(r, "town"),
        address: col(r, "address"), phone: col(r, "phone"), latitude: col(r, "latitude"), longitude: col(r, "longitude"),
        opening_hours: header.includes("opening_hours") ? col(r, "opening_hours") : "",
      },
      ctx.regions,
    );
    errors.push(...Object.values(fieldErrors));

    const brandIds: string[] = [];
    const names = col(r, "brands").split(/[;|,/]/).map((b) => b.trim()).filter(Boolean);
    if (!names.length) errors.push("List at least one brand the shop carries, for example Yazz; Hooch.");
    for (const n of names) {
      const brand = matchBrand(n, ctx.allBrands);
      if (!brand) errors.push(`"${n.slice(0, 40)}" is not a known brand. Use Yazz, Linzzy or Hooch.`);
      else if (!linkable.has(brand.id)) errors.push(`You do not have access to ${brand.name}. Ask your Lexta administrator or remove it from this row.`);
      else if (!brandIds.includes(brand.id)) brandIds.push(brand.id);
    }

    if (details) {
      const k = duplicateKey(details);
      if (ctx.existingKeys.has(k)) errors.push("This shop is already in the system (same name, region, town and address).");
      else if (seen.has(k)) errors.push(`Same shop as row ${seen.get(k)} of this file.`);
      else seen.set(k, line);
    }
    const name = squash(col(r, "name")) || "(no name)";
    return errors.length ? { line, name, errors } : { line, name, errors, details, brandIds };
  });

  const valid = rows.filter((r) => r.errors.length === 0).length;
  return { rows, valid, invalid: rows.length - valid };
}
