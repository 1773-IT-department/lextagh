"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { JOB_APPLICATION_STAGES, JOB_CVS_BUCKET, JOB_OPENING_STATUSES } from "@lexta/db";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { UUID } from "@/lib/crm";
import { getRecruitmentAccess } from "@/lib/recruitment";
import { checkRole, ghanaToday } from "@/lib/recruitment-input";
import { notifySites } from "@/lib/revalidate-sites";
import { createClient } from "@/lib/supabase/server";

const BASE = "/systems/recruitment";
const NO_ACCESS = "Your role does not include recruitment.";

const fields = (form: FormData) => {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
};

/** Turns a database error into words a person can act on. Unknown errors are logged, never shown raw. */
function dbError(error: { code?: string; message: string }, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "23505") return "Another role already uses that reference. Choose a different one.";
  if (error.code === "23503") return "This role has applications, so it cannot be deleted. Close it instead.";
  if (error.code === "42501") return "You do not have permission to make this change, or the record changed. Reload the page.";
  if (error.code === "23514") {
    if (msg.includes("closing date")) return "An open role needs a closing date today or later (or none).";
    if (msg.includes("owner must be")) return "The owner must be an active admin, management or HR person.";
    return "One of the fields is too long, missing or in the wrong format. Please check and try again.";
  }
  if (error.code === "22P02" || error.code === "22007" || error.code === "22008") return "One of the fields is in the wrong format.";
  console.error(`[recruitment] ${context} failed`, error);
  return "We could not save this. Please try again. If it keeps happening, tell the IT team.";
}

function afterChange(path?: string) {
  revalidatePath(BASE, "layout");
  if (path) revalidatePath(path);
}

/** The Careers page lists open roles: tell the websites after every role change. */
const tellSites = (reason: string) => notifySites(reason, ["jobs"]);

// Roles ------------------------------------------------------------------------------------------------

export async function saveRole(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const raw = fields(form);
  const id = raw.id ?? "";
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This role could not be found." };
  const supabase = await createClient();

  let current: { status: string; closes_at: string | null } | undefined;
  if (!isNew) {
    const { data, error } = await supabase.from("job_openings").select("status, closes_at").eq("id", id).maybeSingle();
    if (error) return { error: dbError(error, "load role") };
    if (!data) return { error: "This role could not be found. It may have been deleted." };
    current = data as typeof current;
  }
  const checked = checkRole(raw, current);
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };

  let savedId = id;
  if (isNew) {
    const { data, error } = await supabase.from("job_openings").insert(checked.details).select("id").single();
    if (error || !data) return error?.code === "23505"
      ? { error: "Please check the highlighted fields.", fieldErrors: { reference: "Another role already uses that reference." } }
      : { error: error ? dbError(error, "create role") : "We could not save the role." };
    savedId = data.id as string;
  } else {
    const { data, error } = await supabase.from("job_openings").update(checked.details).eq("id", id).select("id");
    if (error) return error.code === "23505"
      ? { error: "Please check the highlighted fields.", fieldErrors: { reference: "Another role already uses that reference." } }
      : { error: dbError(error, "save role") };
    if (!data?.length) return { error: "You do not have permission to change this role, or it was deleted. Reload the page." };
  }
  await tellSites(isNew ? "job opening created" : "job opening saved");
  afterChange(`${BASE}/roles/${savedId}`);
  if (isNew) redirect(`${BASE}/roles/${savedId}?created=1`);
  return { message: checked.details.status === "open" ? "Saved. The role shows on the Careers page." : "Saved." };
}

/** Open (today, keeping a future closing date), close, or back to draft. */
export async function setRoleStatus(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!UUID.test(id)) return { error: "This role could not be found." };
  if (!JOB_OPENING_STATUSES.some((s) => s.value === status)) return { error: "Choose open, closed or draft." };
  const supabase = await createClient();
  const { data: role, error: loadError } = await supabase.from("job_openings").select("status, opens_at, closes_at").eq("id", id).maybeSingle();
  if (loadError) return { error: dbError(loadError, "load role") };
  if (!role) return { error: "This role could not be found. It may have been deleted." };
  if (role.status === status) return { message: "No change." };
  const change: Record<string, unknown> = { status };
  if (status === "open") {
    if (role.closes_at && (role.closes_at as string) < ghanaToday()) {
      return { error: "The closing date has passed. Set a new closing date (or none) in the details below, then open the role." };
    }
    if (!role.opens_at || (role.opens_at as string) > ghanaToday()) change.opens_at = ghanaToday();
  }
  const { data, error } = await supabase.from("job_openings").update(change).eq("id", id).select("id");
  if (error) return { error: dbError(error, "role status") };
  if (!data?.length) return { error: "You do not have permission to change this role. Reload the page." };
  await tellSites(`job opening ${status}`);
  afterChange(`${BASE}/roles/${id}`);
  return { message: status === "open" ? "The role is open and shows on the Careers page." : status === "closed" ? "The role is closed and no longer shows on the Careers page." : "The role is back to draft." };
}

export async function deleteRole(id: string): Promise<void> {
  const access = await getRecruitmentAccess();
  if (!access.canView || !UUID.test(id)) redirect(`${BASE}/roles/${id}?error=delete`);
  const supabase = await createClient();
  const { data, error } = await supabase.from("job_openings").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    if (error && error.code !== "23503" && error.code !== "42501") console.error("[recruitment] delete role failed", error);
    redirect(`${BASE}/roles/${id}?error=${error?.code === "23503" ? "has-applications" : "delete"}`);
  }
  await tellSites("job opening deleted");
  afterChange();
  redirect(`${BASE}/roles?deleted=1`);
}

// Applications --------------------------------------------------------------------------------------------

export async function setApplicationStage(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const stage = String(form.get("stage") ?? "");
  const note = String(form.get("note") ?? "").replace(/\r\n/g, "\n").trim();
  if (!UUID.test(id)) return { error: "This application could not be found." };
  if (!JOB_APPLICATION_STAGES.some((s) => s.value === stage)) return { error: "Choose a stage.", fieldErrors: { stage: "Choose a stage." } };
  if (note.length > 4000) return { error: "At most 4000 characters.", fieldErrors: { note: "At most 4000 characters." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_job_application_stage", { target_id: id, new_stage: stage, note: note || null });
  if (error) return { error: error.code === "42501" ? "The stage did not change. It may already be at that stage, or you lack permission. Reload the page." : dbError(error, "stage") };
  afterChange(`${BASE}/applications/${id}`);
  return { message: "Stage updated." };
}

export async function setApplicationOwner(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const raw = String(form.get("owner") ?? "");
  if (!UUID.test(id)) return { error: "This application could not be found." };
  const owner = raw === "me" ? access.userId : raw === "none" ? null : UUID.test(raw) ? raw : undefined;
  if (owner === undefined) return { error: "Choose who should own the application." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_job_application_owner", { target_id: id, new_owner: owner });
  if (error) return { error: dbError(error, "owner") };
  afterChange(`${BASE}/applications/${id}`);
  return { message: owner === access.userId ? "Assigned to you." : owner ? "Owner changed." : "Owner cleared." };
}

export async function saveStaffNotes(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const notes = String(form.get("staff_notes") ?? "").replace(/\r\n/g, "\n").trim();
  if (!UUID.test(id)) return { error: "This application could not be found." };
  if (notes.length > 4000) return { error: "At most 4000 characters.", fieldErrors: { staff_notes: "At most 4000 characters." } };
  const supabase = await createClient();
  const { data, error } = await supabase.from("job_applications").update({ staff_notes: notes || null }).eq("id", id).select("id");
  if (error) return { error: dbError(error, "staff notes") };
  if (!data?.length) return { error: "You do not have permission to change this application. Reload the page." };
  afterChange(`${BASE}/applications/${id}`);
  return { message: "Notes saved." };
}

export async function addApplicationNote(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const note = String(form.get("note") ?? "").replace(/\r\n/g, "\n").trim();
  if (!UUID.test(id)) return { error: "This application could not be found." };
  if (!note) return { error: "Write the note.", fieldErrors: { note: "Write the note." } };
  if (note.length > 4000) return { error: "At most 4000 characters.", fieldErrors: { note: "At most 4000 characters." } };
  const supabase = await createClient();
  const { error } = await supabase.from("job_application_events").insert({ application_id: id, type: "note", note });
  if (error) return { error: error.code === "42501" ? "You cannot add to this application's history." : dbError(error, "note") };
  afterChange(`${BASE}/applications/${id}`);
  return { message: "Note added." };
}

/** Admin only: removes the CV first (only admins may remove a claimed CV), then the application and its history. */
export async function deleteApplication(id: string): Promise<void> {
  const access = await getRecruitmentAccess();
  if (!access.isAdmin || !UUID.test(id)) redirect(`${BASE}/applications/${id}?error=delete`);
  const supabase = await createClient();
  const { data: app } = await supabase.from("job_applications").select("cv_path").eq("id", id).maybeSingle();
  if (!app) redirect(`${BASE}/applications/${id}?error=delete`);
  if (app.cv_path) {
    const { error: storageError } = await supabase.storage.from(JOB_CVS_BUCKET).remove([app.cv_path as string]);
    if (storageError) redirect(`${BASE}/applications/${id}?error=delete`);
  }
  const { data, error } = await supabase.from("job_applications").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    if (error) console.error("[recruitment] delete application failed", error);
    redirect(`${BASE}/applications/${id}?error=delete`);
  }
  afterChange();
  redirect(`${BASE}?deleted=1`);
}

/**
 * Removes CV uploads no application claimed within an hour (visitors who gave up, refused applications). The
 * database lists them (public.unclaimed_job_cvs, one hour grace period by default) and its storage policy only lets
 * recruitment staff remove unclaimed ones.
 */
export async function cleanUnclaimedUploads(_prev: CrmFormState, _form: FormData): Promise<CrmFormState> {
  const access = await getRecruitmentAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unclaimed_job_cvs");
  if (error) return { error: dbError(error, "list unclaimed uploads") };
  const names = ((data ?? []) as { name: string }[]).map((r) => r.name);
  if (!names.length) return { message: "Nothing to clean up." };
  const { data: removed, error: removeError } = await supabase.storage.from(JOB_CVS_BUCKET).remove(names);
  if (removeError) {
    console.error("[recruitment] cleanup failed", removeError);
    return { error: "The uploads could not be removed. Please try again." };
  }
  afterChange();
  const n = removed?.length ?? 0;
  return { message: n === 1 ? "Removed 1 unclaimed upload." : `Removed ${n} unclaimed uploads.` };
}
