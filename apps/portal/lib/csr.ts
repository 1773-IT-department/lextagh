import "server-only";
import type { AppRole, Brand, CsrProgramme, Region } from "@lexta/db";
import { cleanSearch, UUID } from "./crm";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

/** Same as public.csr_role() in 0013_csr_tracker.sql. */
export const CSR_ROLES: AppRole[] = ["admin", "management", "marketing"];
export const CSR_BASE = "/systems/csr";

type BrandOption = Pick<Brand, "id" | "slug" | "name">;

export type CsrAccess = {
  userId: string;
  role: AppRole | null;
  canView: boolean;
  /** Admin and marketing log and change activities (marketing: programmes with no brand or of their brands). */
  canWrite: boolean;
  isAdmin: boolean;
  /** Every programme, active first by sort order (switched off ones are kept for names and filters). */
  programmes: CsrProgramme[];
  /** Programmes this person may log activities for (active ones only), the same rule as csr_may_write_programme. */
  writableProgrammeIds: Set<string>;
  /** Marketing: the brands this person works on (profile_brands). */
  myBrandIds: Set<string>;
  regions: Pick<Region, "id" | "name">[];
  /** Active brands, for choosing. */
  brands: BrandOption[];
  /** Every brand this person may read, switched off ones included, for names. */
  allBrands: (BrandOption & { is_active: boolean })[];
};

export const NO_CSR_ACCESS = "Your role does not include CSR activities. Ask your Lexta administrator if you need it.";

/**
 * Who the signed in person is for the CSR tracker, worked out on the server. The database enforces the same rules with
 * Row Level Security, column grants and triggers (0013_csr_tracker.sql); this only shapes the screens.
 */
export async function getCsrAccess(): Promise<CsrAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && CSR_ROLES.includes(role);
  const isAdmin = role === "admin";
  const canWrite = role === "admin" || role === "marketing";
  const base = { userId: user.id, role, canView, canWrite, isAdmin };
  if (!canView) {
    return { ...base, canWrite: false, isAdmin: false, programmes: [], writableProgrammeIds: new Set(), myBrandIds: new Set(), regions: [], brands: [], allBrands: [] };
  }

  const supabase = await createClient();
  const [programmesRes, regionsRes, brandsRes, linksRes] = await Promise.all([
    supabase.from("csr_programmes").select("id, name, brand_id, description, is_active, sort_order, needs_review")
      .order("is_active", { ascending: false }).order("sort_order").order("name"),
    supabase.from("regions").select("id, name").order("sort_order").order("name"),
    supabase.from("brands").select("id, slug, name, is_active").order("is_corporate", { ascending: false }).order("name"),
    role === "marketing" ? supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (programmesRes.error) throw new Error("Could not load CSR programmes");
  if (regionsRes.error) throw new Error("Could not load regions");
  if (brandsRes.error) throw new Error("Could not load brands");
  if (linksRes.error) throw new Error("Could not load brand access");
  const programmes = (programmesRes.data ?? []) as CsrProgramme[];
  const allBrands = (brandsRes.data ?? []) as CsrAccess["allBrands"];
  const myBrands = new Set(((linksRes.data ?? []) as { brand_id: string }[]).map((l) => l.brand_id));
  const writableProgrammeIds = new Set(
    programmes
      .filter((p) => p.is_active && canWrite && (isAdmin || p.brand_id === null || myBrands.has(p.brand_id)))
      .map((p) => p.id),
  );
  return {
    ...base,
    programmes,
    writableProgrammeIds,
    myBrandIds: myBrands,
    regions: (regionsRes.data ?? []) as CsrAccess["regions"],
    brands: allBrands.filter((b) => b.is_active).map(({ id, slug, name }) => ({ id, slug, name })),
    allBrands,
  };
}

/** May this person change an activity of this programme (whether or not the programme is still active)? */
export function canEditProgrammeActivity(access: CsrAccess, programmeId: string): boolean {
  if (!access.canWrite) return false;
  if (access.isAdmin) return true;
  const p = access.programmes.find((x) => x.id === programmeId);
  if (!p) return false;
  return p.brand_id === null || access.myBrandIds.has(p.brand_id);
}

export const brandName = (access: CsrAccess, id: string | null) => (id ? access.allBrands.find((b) => b.id === id)?.name ?? "" : "");

// Filters (list and totals share them) --------------------------------------------------------------------------

export type CsrFilters = { q: string; programme: string; region: string; status: string; from: string; to: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const validDate = (v: string | undefined) => (v && DATE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? v : "");
const uuidOr = (v: string | undefined) => (v && UUID.test(v) ? v : "");

export function parseCsrFilters(params: Record<string, string | undefined>): CsrFilters {
  return {
    q: cleanSearch(params.q, 80),
    programme: uuidOr(params.programme),
    region: uuidOr(params.region),
    status: params.status === "done" || params.status === "planned" ? params.status : "",
    from: validDate(params.from),
    to: validDate(params.to),
  };
}

export function csrFilterQuery(f: Partial<CsrFilters> & { page?: string }): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && !(k === "page" && v === "1")) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Formats a calendar day (YYYY-MM-DD) without moving it across time zones. */
export function formatDay(value: string | null | undefined): string {
  if (!value || !DATE.test(value)) return "";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export const formatCount = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString("en-GB");

/** Turns a database error from a CSR change into words a person can act on. Unknown errors are logged. */
export function csrDbError(error: { code?: string; message?: string }, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "42501") {
    if (msg.includes("that programme")) return "You cannot log activities for that programme. Marketing logs activities of programmes with no brand or of the brands they work on.";
    if (msg.includes("change this activity")) return "You cannot change this activity.";
    return "You do not have permission to do this. Reload the page and try again.";
  }
  if (error.code === "23505") return "There is already a programme with that name.";
  if (error.code === "23503") return "This programme has activities, so it cannot be deleted. Switch it off instead.";
  if (error.code === "23514" || error.code === "22023" || error.code === "23502") {
    if (msg.includes("active programme")) return "Choose an active programme.";
    if (msg.includes("region")) return "Choose a region.";
    if (msg.includes("planned, not done")) return "An activity in the future is planned, not done. Change the status or the date.";
    if (msg.includes("at most 20 photos")) return "An activity has at most 20 photos.";
    if (msg.includes("missing or different")) return "The photo could not be checked. Please add it again.";
    return "Some details are missing or in the wrong format. Please check and try again.";
  }
  if (error.code === "22P02" || error.code === "22008") return "One of the fields is in the wrong format.";
  console.error(`[csr] ${context} failed`, error);
  return "We could not save this. Please try again. If it keeps happening, tell the IT team.";
}
