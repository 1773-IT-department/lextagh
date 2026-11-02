import "server-only";
import type { AppRole, Brand, CrmStaff, Region } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

export const CRM_ROLES: AppRole[] = ["admin", "management", "sales_rep", "marketing", "customer_care"];

type BrandOption = Pick<Brand, "id" | "slug" | "name" | "is_corporate">;

export type CrmAccess = {
  userId: string;
  role: AppRole | null;
  canView: boolean;
  /** Admin and management: edit everything and reassign owners. */
  manages: boolean;
  /** Sales reps and marketing: work records of their brands, unbranded records and their own. */
  works: boolean;
  isAdmin: boolean;
  /** May edit existing records (customer care only creates). */
  canEdit: boolean;
  /** May create organisations (customer care may not). */
  canCreateOrg: boolean;
  /** Every active brand, corporate Lexta included (leads may be about Lexta itself). */
  allBrands: BrandOption[];
  /** Brands this person may put on a lead or organisation. */
  myBrandIds: Set<string>;
  staff: CrmStaff[];
  regions: Pick<Region, "id" | "slug" | "name" | "is_in_ghana">[];
};

/**
 * Who the signed in person is for the CRM, worked out on the server.
 * The database enforces the same rules with Row Level Security and triggers (0006_crm.sql); this only shapes the screens.
 */
export async function getCrmAccess(): Promise<CrmAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && CRM_ROLES.includes(role);
  const manages = role === "admin" || role === "management";
  const works = role === "sales_rep" || role === "marketing";
  const base = {
    userId: user.id, role, canView, manages, works, isAdmin: role === "admin",
    canEdit: manages || works, canCreateOrg: manages || works,
  };
  if (!canView) return { ...base, canEdit: false, canCreateOrg: false, allBrands: [], myBrandIds: new Set(), staff: [], regions: [] };

  const supabase = await createClient();
  const [brandsRes, regionsRes, staffRes, linksRes] = await Promise.all([
    supabase.from("brands").select("id, slug, name, is_corporate").eq("is_active", true).order("is_corporate", { ascending: false }).order("name"),
    supabase.from("regions").select("id, slug, name, is_in_ghana").order("sort_order").order("name"),
    supabase.rpc("crm_staff"),
    manages ? Promise.resolve({ data: [], error: null }) : supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id),
  ]);
  if (brandsRes.error) throw new Error("Could not load brands");
  if (regionsRes.error) throw new Error("Could not load regions");
  if (staffRes.error) throw new Error("Could not load the team list");
  if (linksRes.error) throw new Error("Could not load brand access");
  const allBrands = (brandsRes.data ?? []) as BrandOption[];
  const myBrandIds = manages
    ? new Set(allBrands.map((b) => b.id))
    : new Set((linksRes.data ?? []).map((l: { brand_id: string }) => l.brand_id));
  return {
    ...base,
    allBrands,
    myBrandIds,
    staff: (staffRes.data ?? []) as CrmStaff[],
    regions: (regionsRes.data ?? []) as CrmAccess["regions"],
  };
}

export const NO_CRM_ACCESS = "Your role does not include the CRM. Ask your Lexta administrator if you need it.";

/** Same rules as the lead policies and check_crm_record in 0006_crm.sql, for showing the right controls. */
export function leadPermissions(access: CrmAccess, lead: { owner_id: string | null; brand_id: string | null }) {
  const own = lead.owner_id === access.userId;
  const canEdit = access.manages || access.works;
  return {
    canEdit,
    canChangeStage: canEdit,
    /** On a lead they do not own, sales and marketing cannot change the brand (take it first). */
    canChangeBrand: access.manages || (access.works && own),
    canAssignToMe: access.works && lead.owner_id === null,
    canReassign: access.manages,
    canDelete: access.isAdmin,
  };
}

export function staffName(access: CrmAccess, id: string | null | undefined): string {
  if (!id) return "";
  return access.staff.find((s) => s.id === id)?.display_name ?? "Former team member";
}

/** Brands this person may pick for a lead: their own (all for managers; customer care may pick any). */
export function leadBrandChoices(access: CrmAccess) {
  if (access.manages || access.role === "customer_care") return access.allBrands;
  return access.allBrands.filter((b) => access.myBrandIds.has(b.id));
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Characters that are safe inside a PostgREST filter value. */
export const cleanSearch = (v: string | undefined, max: number) =>
  (v ?? "").replace(/[^\p{L}\p{N}@.+ '-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);

export const PAGE_SIZE = 50;

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Accra" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });
}

/** Today in Ghana (UTC, no daylight saving) as YYYY-MM-DD. */
export const todayIso = () => new Date().toISOString().slice(0, 10);
