"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FIELD_NOTES_MAX, FIELD_PHOTOS_BUCKET } from "@lexta/db";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { UUID } from "@/lib/crm";
import { FIELD_BASE, fieldDbError, getFieldAccess } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

function afterChange(id?: string) {
  revalidatePath(FIELD_BASE, "layout");
  if (id) revalidatePath(`${FIELD_BASE}/visits/${id}`);
}

/** Changes a visit's outcome and notes (the rep for 24 hours, admin any time; the database decides). */
export async function updateVisit(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getFieldAccess();
  if (!access.canView) return { error: "Your role does not include field sales." };
  const id = String(form.get("id") ?? "");
  const outcome = String(form.get("outcome_id") ?? "");
  const notes = String(form.get("notes") ?? "").replace(/\r\n/g, "\n").trim();
  if (!UUID.test(id)) return { error: "This visit could not be found." };
  if (!access.outcomes.some((o) => o.id === outcome && o.is_active)) return { error: "Choose an outcome.", fieldErrors: { outcome_id: "Choose an outcome." } };
  if (notes.length > FIELD_NOTES_MAX) return { error: `Notes can be up to ${FIELD_NOTES_MAX} characters.`, fieldErrors: { notes: `At most ${FIELD_NOTES_MAX} characters.` } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_field_visit", { target_id: id, details: { outcome_id: outcome, notes } });
  if (error) return { error: fieldDbError(error, "update") };
  afterChange(id);
  return { message: "Saved." };
}

/** Deletes a visit with its photos (admin only). */
export async function deleteVisit(id: string): Promise<void> {
  const access = await getFieldAccess();
  if (!access.isAdmin || !UUID.test(id)) redirect(`${FIELD_BASE}/visits/${id}?error=delete`);
  const supabase = await createClient();
  // Files first: the bucket only lets admins remove them, and the records go with the visit.
  const { data: photos } = await supabase.from("field_visit_photos").select("storage_path").eq("visit_id", id);
  const paths = (photos ?? []).map((p) => p.storage_path as string);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(FIELD_PHOTOS_BUCKET).remove(paths);
    if (storageError) redirect(`${FIELD_BASE}/visits/${id}?error=delete`);
  }
  const { error } = await supabase.rpc("delete_field_visit", { target_id: id });
  if (error) {
    if (error.code !== "42501") console.error("[field-sales] delete failed", error);
    redirect(`${FIELD_BASE}/visits/${id}?error=delete`);
  }
  afterChange();
  redirect(`${FIELD_BASE}?deleted=1`);
}

/** Removes one photo (admin only). */
export async function deleteVisitPhoto(visitId: string, photoId: string): Promise<{ error?: string }> {
  const access = await getFieldAccess();
  if (!access.isAdmin) return { error: "Only admin removes photos." };
  if (!UUID.test(visitId) || !UUID.test(photoId)) return { error: "This photo could not be found." };
  const supabase = await createClient();
  const { data: photo } = await supabase.from("field_visit_photos").select("storage_path").eq("id", photoId).eq("visit_id", visitId).maybeSingle();
  if (!photo) return { error: "This photo could not be found." };
  const { error: storageError } = await supabase.storage.from(FIELD_PHOTOS_BUCKET).remove([photo.storage_path as string]);
  if (storageError) return { error: "The photo could not be removed. Please try again." };
  const { error } = await supabase.from("field_visit_photos").delete().eq("id", photoId);
  if (error) return { error: "The photo was removed but its record stayed. Please try again." };
  afterChange(visitId);
  return {};
}

// Outcomes (admin) -------------------------------------------------------------------------------------------------

const SLUG = /^[a-z0-9]+(_[a-z0-9]+)*$/;
const slugOf = (label: string) => label.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40).replace(/_+$/, "");

function outcomeError(error: { code?: string; message?: string }): string {
  if (error.code === "23505") return "There is already an outcome with that name.";
  if (error.code === "23503") return "Visits use this outcome, so it cannot be deleted. Switch it off instead.";
  if (error.code === "42501") return "Only admin changes the outcome list.";
  if (error.code === "23514") return "Names are 1 to 60 characters.";
  console.error("[field-sales] outcome change failed", error);
  return "We could not save this. Please try again.";
}

export async function saveOutcome(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getFieldAccess();
  if (!access.isAdmin) return { error: "Only admin changes the outcome list." };
  const id = String(form.get("id") ?? "");
  const label = String(form.get("label") ?? "").replace(/\s+/g, " ").trim();
  const sort = Number.parseInt(String(form.get("sort_order") ?? "0"), 10);
  if (!label || label.length > 60) return { error: "Give the outcome a name of up to 60 characters.", fieldErrors: { label: "1 to 60 characters." } };
  if (!Number.isInteger(sort) || Math.abs(sort) > 100000) return { error: "The order is a whole number.", fieldErrors: { sort_order: "A whole number." } };
  const supabase = await createClient();
  if (id) {
    if (!UUID.test(id)) return { error: "This outcome could not be found." };
    const { data, error } = await supabase.from("field_visit_outcomes").update({ label, sort_order: sort }).eq("id", id).select("id");
    if (error) return { error: outcomeError(error) };
    if (!data?.length) return { error: "This outcome could not be found." };
  } else {
    const slug = slugOf(label);
    if (!SLUG.test(slug)) return { error: "Use letters or numbers in the name.", fieldErrors: { label: "Use letters or numbers." } };
    const { error } = await supabase.from("field_visit_outcomes").insert({ slug, label, sort_order: sort });
    if (error) return { error: outcomeError(error) };
  }
  afterChange();
  return { message: id ? "Outcome saved." : "Outcome added." };
}

export async function setOutcomeActive(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getFieldAccess();
  if (!access.isAdmin) return { error: "Only admin changes the outcome list." };
  const id = String(form.get("id") ?? "");
  const active = String(form.get("active") ?? "") === "1";
  if (!UUID.test(id)) return { error: "This outcome could not be found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("field_visit_outcomes").update({ is_active: active }).eq("id", id).select("id");
  if (error) return { error: outcomeError(error) };
  if (!data?.length) return { error: "This outcome could not be found." };
  afterChange();
  return { message: active ? "Switched on." : "Switched off. Reps no longer see it." };
}

export async function deleteOutcome(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getFieldAccess();
  if (!access.isAdmin) return { error: "Only admin changes the outcome list." };
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "This outcome could not be found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("field_visit_outcomes").delete().eq("id", id).select("id");
  if (error) return { error: outcomeError(error) };
  if (!data?.length) return { error: "This outcome could not be found." };
  afterChange();
  return { message: "Outcome deleted." };
}
