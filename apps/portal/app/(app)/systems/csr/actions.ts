"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CSR_NOTES_MAX, CSR_PARTNERS_MAX, CSR_PEOPLE_MAX, CSR_PHOTOS_BUCKET, CSR_PLACE_MAX, CSR_PROGRAMME_DESCRIPTION_MAX,
  CSR_PROGRAMME_NAME_MAX,
} from "@lexta/db";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { UUID } from "@/lib/crm";
import { canEditProgrammeActivity, CSR_BASE, csrDbError, getCsrAccess, validDate } from "@/lib/csr";
import { createClient } from "@/lib/supabase/server";

function afterChange(id?: string) {
  revalidatePath(CSR_BASE, "layout");
  if (id) revalidatePath(`${CSR_BASE}/${id}`);
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").replace(/\r\n/g, "\n").trim();
const oneLine = (form: FormData, key: string) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim();

// Activities ------------------------------------------------------------------------------------------------------

/** Logs a new activity or changes one (admin any; marketing those of programmes with no brand or of their brands). */
export async function saveActivity(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCsrAccess();
  if (!access.canWrite) return { error: "Only admin and marketing log CSR activities." };
  const id = String(form.get("id") ?? "");
  const isNew = !id;
  if (!isNew && !UUID.test(id)) return { error: "This activity could not be found." };

  const programme = String(form.get("programme_id") ?? "");
  const date = validDate(String(form.get("activity_date") ?? ""));
  const status = String(form.get("status") ?? "");
  const region = String(form.get("region_id") ?? "");
  const place = oneLine(form, "place");
  const peopleRaw = String(form.get("people_reached") ?? "").replace(/[\s,]/g, "");
  const people = peopleRaw === "" ? 0 : Number(peopleRaw);
  const partners = oneLine(form, "partners");
  const notes = text(form, "notes");

  const fe: Record<string, string> = {};
  const original = String(form.get("original_programme_id") ?? "");
  const programmeOk = access.writableProgrammeIds.has(programme)
    || (!isNew && programme === original && canEditProgrammeActivity(access, programme));
  if (!programmeOk) fe.programme_id = "Choose a programme.";
  if (!date) fe.activity_date = "Enter the date.";
  if (status !== "done" && status !== "planned") fe.status = "Choose done or planned.";
  if (!access.regions.some((r) => r.id === region)) fe.region_id = "Choose a region.";
  if (!place) fe.place = "Enter the town or place.";
  else if (place.length > CSR_PLACE_MAX) fe.place = `At most ${CSR_PLACE_MAX} characters.`;
  if (!/^\d+$/.test(peopleRaw || "0") || !Number.isInteger(people) || people < 0 || people > CSR_PEOPLE_MAX) {
    fe.people_reached = "A whole number, 0 or more.";
  }
  if (partners.length > CSR_PARTNERS_MAX) fe.partners = `At most ${CSR_PARTNERS_MAX} characters.`;
  if (notes.length > CSR_NOTES_MAX) fe.notes = `At most ${CSR_NOTES_MAX} characters.`;
  if (date && status === "done" && date > new Date(Date.now() + 86400000).toISOString().slice(0, 10)) {
    fe.status = "An activity in the future is planned, not done.";
  }
  if (Object.keys(fe).length) return { error: "Please check the highlighted fields.", fieldErrors: fe };

  const row = {
    programme_id: programme, activity_date: date, status, region_id: region, place, people_reached: people,
    partners: partners || null, notes: notes || null,
  };
  const supabase = await createClient();
  let savedId = id;
  if (isNew) {
    const { data, error } = await supabase.from("csr_activities").insert(row).select("id").single();
    if (error || !data) return { error: error ? csrDbError(error, "create") : "We could not save this. Please try again." };
    savedId = data.id as string;
  } else {
    const { data, error } = await supabase.from("csr_activities").update(row).eq("id", id).select("id");
    if (error) return { error: csrDbError(error, "update") };
    if (!data?.length) return { error: "You cannot change this activity, or it was deleted. Reload the page." };
  }
  afterChange(savedId);
  if (isNew) redirect(`${CSR_BASE}/${savedId}?created=1`);
  return { message: "Saved." };
}

/** Deletes an activity with its photos (admin only). */
export async function deleteActivity(id: string): Promise<void> {
  const access = await getCsrAccess();
  if (!access.isAdmin || !UUID.test(id)) redirect(`${CSR_BASE}/${id}?error=delete`);
  const supabase = await createClient();
  // Files first: the records go with the activity.
  const { data: photos } = await supabase.from("csr_activity_photos").select("storage_path").eq("activity_id", id);
  const paths = (photos ?? []).map((p) => p.storage_path as string);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(CSR_PHOTOS_BUCKET).remove(paths);
    if (storageError) redirect(`${CSR_BASE}/${id}?error=delete`);
  }
  const { error } = await supabase.rpc("delete_csr_activity", { target_id: id });
  if (error) {
    if (error.code !== "42501") console.error("[csr] delete failed", error);
    redirect(`${CSR_BASE}/${id}?error=delete`);
  }
  afterChange();
  redirect(`${CSR_BASE}?deleted=1`);
}

/** Removes one photo: admin any, or the person who added it while they may change the activity. */
export async function deleteCsrPhoto(activityId: string, photoId: string): Promise<{ error?: string }> {
  const access = await getCsrAccess();
  if (!access.canWrite) return { error: "You cannot remove photos." };
  if (!UUID.test(activityId) || !UUID.test(photoId)) return { error: "This photo could not be found." };
  const supabase = await createClient();
  const { data: photo } = await supabase.from("csr_activity_photos").select("storage_path, created_by")
    .eq("id", photoId).eq("activity_id", activityId).maybeSingle();
  if (!photo) return { error: "This photo could not be found." };
  if (!access.isAdmin && photo.created_by !== access.userId) return { error: "Only admin or the person who added it removes a photo." };
  const { data: removed, error: storageError } = await supabase.storage.from(CSR_PHOTOS_BUCKET).remove([photo.storage_path as string]);
  if (storageError) return { error: "The photo could not be removed. Please try again." };
  if (!removed?.length) return { error: "You cannot remove this photo." };
  const { error } = await supabase.from("csr_activity_photos").delete().eq("id", photoId);
  if (error) return { error: "The photo was removed but its record stayed. Please try again." };
  afterChange(activityId);
  return {};
}

// Programmes (admin) -------------------------------------------------------------------------------------------------

const ADMIN_ONLY = "Only admin changes the programme list.";

/** Adds or changes a programme. Saving also marks a programme seeded from the website as checked. */
export async function saveProgramme(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCsrAccess();
  if (!access.isAdmin) return { error: ADMIN_ONLY };
  const id = String(form.get("id") ?? "");
  const name = oneLine(form, "name");
  const brand = String(form.get("brand_id") ?? "");
  const description = text(form, "description");
  const sort = Number.parseInt(String(form.get("sort_order") ?? "0"), 10);
  const fe: Record<string, string> = {};
  if (!name || name.length > CSR_PROGRAMME_NAME_MAX) fe.name = `1 to ${CSR_PROGRAMME_NAME_MAX} characters.`;
  if (brand && !access.brands.some((b) => b.id === brand)) fe.brand_id = "Choose a brand from the list.";
  if (description.length > CSR_PROGRAMME_DESCRIPTION_MAX) fe.description = `At most ${CSR_PROGRAMME_DESCRIPTION_MAX} characters.`;
  if (!Number.isInteger(sort) || Math.abs(sort) > 100000) fe.sort_order = "A whole number.";
  if (Object.keys(fe).length) return { error: "Please check the highlighted fields.", fieldErrors: fe };
  const row = { name, brand_id: brand || null, description: description || null, sort_order: sort, needs_review: false };
  const supabase = await createClient();
  if (id) {
    if (!UUID.test(id)) return { error: "This programme could not be found." };
    const { data, error } = await supabase.from("csr_programmes").update(row).eq("id", id).select("id");
    if (error) return { error: csrDbError(error, "programme update") };
    if (!data?.length) return { error: "This programme could not be found." };
  } else {
    const { error } = await supabase.from("csr_programmes").insert(row);
    if (error) return { error: csrDbError(error, "programme create") };
  }
  afterChange();
  return { message: id ? "Programme saved." : "Programme added." };
}

export async function setProgrammeActive(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCsrAccess();
  if (!access.isAdmin) return { error: ADMIN_ONLY };
  const id = String(form.get("id") ?? "");
  const active = String(form.get("active") ?? "") === "1";
  if (!UUID.test(id)) return { error: "This programme could not be found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("csr_programmes").update({ is_active: active }).eq("id", id).select("id");
  if (error) return { error: csrDbError(error, "programme switch") };
  if (!data?.length) return { error: "This programme could not be found." };
  afterChange();
  return { message: active ? "Switched on." : "Switched off. It is no longer offered for new activities; its activities stay." };
}

export async function deleteProgramme(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCsrAccess();
  if (!access.isAdmin) return { error: ADMIN_ONLY };
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "This programme could not be found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("csr_programmes").delete().eq("id", id).select("id");
  if (error) return { error: csrDbError(error, "programme delete") };
  if (!data?.length) return { error: "This programme could not be found." };
  afterChange();
  return { message: "Programme deleted." };
}
