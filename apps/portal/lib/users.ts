import "server-only";
import type { AppRole } from "@lexta/db";
import { createClient } from "./supabase/server";
import { supabaseEnv } from "./supabase/env";

// Users and access (admin only). The list and changes go through the 0019 database functions (admin_users_list,
// admin_update_user); sending emails and blocking sign in go through the admin-users Edge Function, which holds the
// service role key inside Supabase. The portal only ever sends the signed in admin's own access token.

export const USERS_BASE = "/systems/users";

export const ROLE_ORDER: AppRole[] = ["admin", "management", "sales_rep", "distributor", "customer_care", "hr", "marketing"];

/** Roles that work on chosen brands. Admin and management see every brand. */
export const needsBrands = (role: string | null | undefined) => !!role && role !== "admin" && role !== "management";

export type UserStatus = "active" | "invited" | "never_signed_in" | "no_role" | "deactivated";

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  never_signed_in: "Never signed in",
  no_role: "No role yet",
  deactivated: "Switched off",
};

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole | null;
  is_active: boolean;
  status: UserStatus;
  brand_slugs: string[];
  organisation_id: string | null;
  organisation_name: string | null;
  invited_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
};

export type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  target_email: string;
  action: string;
  details: Record<string, unknown>;
};

export const AUDIT_LABELS: Record<string, string> = {
  invited: "Invited",
  invite_resent: "Invite sent again",
  password_reset_sent: "Password reset email sent",
  role_changed: "Role changed",
  brands_changed: "Brands changed",
  details_changed: "Name or phone changed",
  deactivated: "Switched off",
  reactivated: "Switched on",
  distributor_linked: "Linked to a distributor",
  distributor_unlinked: "Unlinked from a distributor",
  removed: "Removed",
};

/** Is the 0019 database update in place? (Its functions are missing until it is applied.) */
export const isMissingFunction = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "PGRST202" || e.code === "42883" || /could not find the function|does not exist/i.test(e.message ?? ""));

export async function listUsers(): Promise<{ rows: UserRow[]; missing: boolean; failed: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_users_list");
  if (error) return { rows: [], missing: isMissingFunction(error), failed: !isMissingFunction(error) };
  return { rows: (data ?? []) as UserRow[], missing: false, failed: false };
}

export type FunctionResult = { ok: true; message: string; userId?: string } | { ok: false; error: string; notDeployed?: boolean };

/** Calls the admin-users Edge Function as the signed in admin. */
export async function callAdminUsers(body: Record<string, unknown>): Promise<FunctionResult> {
  const env = supabaseEnv();
  if (!env) return { ok: false, error: "The Business System is not connected to its database." };
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, error: "Please sign in again." };
  try {
    const res = await fetch(`${env.url.replace(/\/+$/, "")}/functions/v1/admin-users`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}`, apikey: env.key },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.status === 404) {
      return { ok: false, notDeployed: true, error: "Sending emails from here is not switched on yet: the admin-users function still has to be deployed in Supabase." };
    }
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (json && json.ok === true && typeof json.message === "string") {
      return { ok: true, message: json.message, ...(typeof json.userId === "string" ? { userId: json.userId } : {}) };
    }
    if (json && json.ok === false && typeof json.error === "string") return { ok: false, error: json.error };
    console.error("[users] admin-users answered", res.status);
    return { ok: false, error: "That did not go through. Please try again." };
  } catch {
    return { ok: false, error: "That did not go through. Please try again." };
  }
}

/** Is the admin-users function deployed? (A ping; 404 means not yet.) */
export async function functionReady(): Promise<boolean> {
  const r = await callAdminUsers({ action: "ping" });
  return r.ok || !("notDeployed" in r && r.notDeployed);
}

export function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" }).format(new Date(iso));
}
