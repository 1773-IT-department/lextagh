import "server-only";
import type { AppRole, Brand, CrmStaff } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

export const COMPLAINT_ROLES: AppRole[] = ["admin", "management", "customer_care", "sales_rep", "marketing"];

type BrandOption = Pick<Brand, "id" | "slug" | "name" | "is_corporate">;

export type ComplaintAccess = {
  userId: string;
  role: AppRole | null;
  canView: boolean;
  /** Admin and customer care: create, edit, change status, upload files. */
  works: boolean;
  /** Admin and management: assign and reassign owners. */
  reassigns: boolean;
  /** Customer care: take an unassigned case. */
  takesUnassigned: boolean;
  isAdmin: boolean;
  /** Sales reps and marketing only see complaints of their brands. */
  brandLimited: boolean;
  /** Every active brand, corporate Lexta included. */
  allBrands: BrandOption[];
  /** Brands whose complaints this person sees. */
  visibleBrands: BrandOption[];
  /** Everyone in the CRM and complaints, for names on the timeline. */
  staff: CrmStaff[];
};

/**
 * Who the signed in person is for complaints, worked out on the server. The database enforces the same rules with
 * Row Level Security and triggers (0007_complaints.sql); this only shapes the screens.
 */
export async function getComplaintAccess(): Promise<ComplaintAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && COMPLAINT_ROLES.includes(role);
  const works = role === "admin" || role === "customer_care";
  const reassigns = role === "admin" || role === "management";
  const brandLimited = role === "sales_rep" || role === "marketing";
  const base = {
    userId: user.id, role, canView, works, reassigns, takesUnassigned: role === "customer_care", isAdmin: role === "admin", brandLimited,
  };
  if (!canView) return { ...base, works: false, reassigns: false, takesUnassigned: false, allBrands: [], visibleBrands: [], staff: [] };

  const supabase = await createClient();
  const [brandsRes, staffRes, linksRes] = await Promise.all([
    supabase.from("brands").select("id, slug, name, is_corporate").eq("is_active", true).order("is_corporate", { ascending: false }).order("name"),
    supabase.rpc("crm_staff"),
    brandLimited ? supabase.from("profile_brands").select("brand_id").eq("profile_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  if (brandsRes.error) throw new Error("Could not load brands");
  if (staffRes.error) throw new Error("Could not load the team list");
  if (linksRes.error) throw new Error("Could not load brand access");
  const allBrands = (brandsRes.data ?? []) as BrandOption[];
  const mine = new Set((linksRes.data ?? []).map((l: { brand_id: string }) => l.brand_id));
  return {
    ...base,
    allBrands,
    visibleBrands: brandLimited ? allBrands.filter((b) => mine.has(b.id)) : allBrands,
    staff: (staffRes.data ?? []) as CrmStaff[],
  };
}

export const NO_COMPLAINT_ACCESS = "Your role does not include complaints. Ask your Lexta administrator if you need it.";

/** People who can own a complaint: active admin and customer care. */
export function ownerCandidates(access: ComplaintAccess) {
  return access.staff.filter((s) => s.is_active && (s.role === "admin" || s.role === "customer_care"));
}

export function staffName(access: ComplaintAccess, id: string | null | undefined): string {
  if (!id) return "";
  return access.staff.find((s) => s.id === id)?.display_name ?? "Former team member";
}

/** Same rule as public.crm_phone_key: digits only, drop every leading zero, then a leading 233, then leading zeros again. */
export function phoneKey(value: string): string {
  return value.replace(/[^0-9]/g, "").replace(/^0+/, "").replace(/^233/, "").replace(/^0+/, "");
}

export const CASE_NUMBER = /^LX-?\d{4}(-\d{0,6})?$/i;
