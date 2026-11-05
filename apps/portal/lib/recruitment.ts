import "server-only";
import type { AppRole, RecruitmentStaff } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

/** Who works recruitment. Same as public.recruitment_staff_role() in 0008_recruitment.sql. */
export const RECRUITMENT_ROLES: AppRole[] = ["admin", "management", "hr"];

export type RecruitmentAccess = {
  userId: string;
  role: AppRole | null;
  /** Admin, management and hr: read and manage every role and application. */
  canView: boolean;
  /** Admin only: delete applications and remove any CV. */
  isAdmin: boolean;
  /** Everyone who can own applications, for names and the assign list. */
  staff: RecruitmentStaff[];
};

/**
 * Who the signed in person is for recruitment, worked out on the server. The database enforces the same rules with
 * Row Level Security, column grants and triggers; this only shapes the screens.
 */
export async function getRecruitmentAccess(): Promise<RecruitmentAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && RECRUITMENT_ROLES.includes(role);
  const base = { userId: user.id, role, canView, isAdmin: role === "admin" };
  if (!canView) return { ...base, staff: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recruitment_staff");
  if (error) throw new Error("Could not load the team list");
  return { ...base, staff: (data ?? []) as RecruitmentStaff[] };
}

export const NO_RECRUITMENT_ACCESS = "Your role does not include recruitment. Ask your Lexta administrator if you need it.";

/** People who can own an application: active admin, management and hr. */
export const ownerCandidates = (access: RecruitmentAccess) => access.staff.filter((s) => s.is_active);

export function staffName(access: RecruitmentAccess, id: string | null | undefined): string {
  if (!id) return "";
  return access.staff.find((s) => s.id === id)?.display_name ?? "Former team member";
}

export const fileSize = (bytes: number | null | undefined) =>
  !bytes ? "" : bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
