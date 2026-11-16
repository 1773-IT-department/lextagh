"use server";

import { revalidatePath } from "next/cache";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { ownDbMessage } from "@/lib/db-errors";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { callAdminUsers, isMissingFunction, needsBrands, ROLE_ORDER, USERS_BASE } from "@/lib/users";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[0-9][0-9 ()-]{5,22}$/;
const line = (form: FormData, key: string) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim();

async function isAdmin() {
  const { profile } = await requireSession();
  return !!profile && profile.is_active && profile.role === "admin";
}

function readCommon(form: FormData) {
  const fe: Record<string, string> = {};
  const fullName = line(form, "full_name");
  const phone = line(form, "phone");
  const role = String(form.get("role") ?? "");
  const brands = form.getAll("brands").map(String).filter((b) => /^[a-z0-9-]{1,40}$/.test(b));
  const organisation = String(form.get("organisation_id") ?? "");
  if (fullName.length > 120) fe.full_name = "At most 120 characters.";
  if (phone && !PHONE.test(phone)) fe.phone = "Enter a phone number like +233 24 123 4567.";
  if (!ROLE_ORDER.includes(role as (typeof ROLE_ORDER)[number])) fe.role = "Choose a role.";
  if (needsBrands(role) && role !== "distributor" && brands.length === 0) fe.brands = "Choose at least one brand.";
  if (role === "distributor" && organisation && !UUID.test(organisation)) fe.organisation_id = "Choose the distributor again.";
  return { fe, fullName, phone, role, brands: needsBrands(role) ? brands : [], organisation: role === "distributor" && organisation ? organisation : null };
}

/** Invites a new person: the admin-users function sends the email and creates the login with its role and brands. */
export async function inviteUser(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  if (!(await isAdmin())) return { error: "Only an admin can manage logins." };
  const email = line(form, "email").toLowerCase();
  const c = readCommon(form);
  if (!EMAIL.test(email)) c.fe.email = "Enter a valid email address.";
  if (Object.keys(c.fe).length) return { error: "Please check the highlighted fields.", fieldErrors: c.fe };
  const r = await callAdminUsers({
    action: "invite", email, full_name: c.fullName || null, phone: c.phone || null, role: c.role, brands: c.brands,
    organisation_id: c.organisation,
  });
  revalidatePath(USERS_BASE);
  return r.ok ? { message: r.message } : { error: r.error };
}

/** Saves a login's name, phone, role, brands, distributor and whether it is switched on. */
export async function saveUser(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  if (!(await isAdmin())) return { error: "Only an admin can manage logins." };
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "This login could not be found." };
  const c = readCommon(form);
  const active = form.get("is_active") === "on";
  const wasActive = form.get("was_active") === "true";
  if (Object.keys(c.fe).length) return { error: "Please check the highlighted fields.", fieldErrors: c.fe };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_user", {
    target: id, new_full_name: c.fullName || null, new_phone: c.phone || null, new_role: c.role, new_brands: c.brands,
    new_active: active, new_organisation: c.organisation,
  });
  if (error) {
    if (isMissingFunction(error)) return { error: "Users and access needs its database update (0019) before changes can be saved." };
    return { error: ownDbMessage(error) ?? "That did not save. Please try again." };
  }
  // Keep sign in in step with the saved switch every time (it is idempotent), so a stale form can never leave a login
  // blocked or open. Only a change the person made is worth a warning when the function is not there yet.
  let note = "";
  const r = await callAdminUsers({ action: "sync_access", user_id: id });
  if (!r.ok && (active !== wasActive || !("notDeployed" in r && r.notDeployed))) {
    note = ` ${active ? "The login is switched on" : "The login is switched off"} here, but ${r.error.charAt(0).toLowerCase()}${r.error.slice(1)}`;
  }
  revalidatePath(USERS_BASE);
  revalidatePath(`${USERS_BASE}/${id}`);
  return { message: `Saved.${note}` };
}

/** Resends the invite or sends a password reset email. */
export async function emailUser(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  if (!(await isAdmin())) return { error: "Only an admin can manage logins." };
  const id = String(form.get("id") ?? "");
  const kind = String(form.get("kind") ?? "");
  if (!UUID.test(id)) return { error: "This login could not be found." };
  if (kind !== "resend_invite" && kind !== "reset_password") return { error: "Unknown request." };
  const r = await callAdminUsers({ action: kind, user_id: id });
  revalidatePath(`${USERS_BASE}/${id}`);
  return r.ok ? { message: r.message } : { error: r.error };
}
