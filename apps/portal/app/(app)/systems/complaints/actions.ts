"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  COMPLAINT_FILE_MAX_BYTES, COMPLAINT_FILE_TYPES, COMPLAINT_FILES_BUCKET, nextComplaintStatuses, type ComplaintStatus,
} from "@lexta/db";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { checkComplaint, checkStatusChange } from "@/lib/complaint-input";
import { getComplaintAccess } from "@/lib/complaints";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BASE = "/systems/complaints";
const READ_ONLY = "Your role can read complaints and add notes, but only admin and customer care change them.";

const fields = (form: FormData) => {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
};

/** Turns a database error into words a person can act on. Unknown errors are logged, never shown raw. */
function dbError(error: { code?: string; message: string }, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "42501") {
    if (msg.includes("assign complaints to other people")) return "Only admin and management can assign complaints to other people.";
    if (msg.includes("contact not found")) return "That customer is not available to you. Pick another one.";
    if (msg.includes("organisation not found")) return "That organisation is not available to you. Pick another one.";
    return "You do not have permission to make this change. The complaint may have changed or been removed. Reload the page.";
  }
  if (error.code === "23514") {
    if (msg.includes("owner must be")) return "The owner must be an active admin or customer care person.";
    if (msg.includes("cannot move from")) return "The complaint cannot move to that status from where it is now. Reload the page.";
    if (msg.includes("reason to reopen")) return "Say why the complaint is being reopened.";
    if (msg.includes("reopen the complaint")) return "This complaint is closed. Reopen it before changing it.";
    if (msg.includes("product is not one")) return "That product belongs to another brand. Pick one of this brand's products.";
    if (msg.includes("SKU is not one")) return "That pack size belongs to another product.";
    if (msg.includes("product before the pack size")) return "Choose the product before the pack size.";
    if (msg.includes("purchase date")) return "The purchase date cannot be in the future.";
    return "One of the fields is too long, missing or in the wrong format. Please check and try again.";
  }
  if (error.code === "22023") {
    if (msg.includes("phone number or an email")) return "Enter a phone number or an email address for the customer.";
    return "Some details are missing. Please check the form.";
  }
  if (error.code === "22P02" || error.code === "22007" || error.code === "22008") return "One of the fields is in the wrong format.";
  if (error.code === "23503") return "Something you picked no longer exists. Reload the page and try again.";
  console.error(`[complaints] ${context} failed`, error);
  return "We could not save this. Please try again. If it keeps happening, tell the IT team.";
}

function afterChange(id?: string) {
  revalidatePath(BASE, "layout");
  if (id) revalidatePath(`${BASE}/${id}`);
}

export async function saveComplaint(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getComplaintAccess();
  if (!access.canView) return { error: "Your role does not include complaints." };
  if (!access.works) return { error: READ_ONLY };
  const raw = fields(form);
  const id = raw.id ?? "";
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This complaint could not be found." };
  const checked = checkComplaint(raw, { isNew, brandIds: new Set(access.allBrands.map((b) => b.id)) });
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };

  const details: Record<string, unknown> = { ...checked.details };
  if (isNew) {
    const owner = raw.owner_id ?? "";
    if (owner === "me") details.owner_id = access.userId;
    else if (owner === "" || owner === "none") details.owner_id = null;
    else if (access.reassigns && UUID.test(owner)) details.owner_id = owner;
    else return { error: "Only admin and management can assign complaints to other people.", fieldErrors: { owner_id: "Choose yourself or nobody." } };
  }

  const supabase = await createClient();
  const { data: savedId, error } = await supabase.rpc("save_complaint", { target_id: isNew ? null : id, details });
  if (error || typeof savedId !== "string") {
    return { error: error ? dbError(error, "save") : "We could not save the complaint. Please try again." };
  }
  afterChange(savedId);
  if (isNew) redirect(`${BASE}/${savedId}?created=1`);
  return { message: "Saved." };
}

export async function setComplaintStatus(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getComplaintAccess();
  if (!access.works) return { error: READ_ONLY };
  const raw = fields(form);
  const id = raw.id ?? "";
  if (!UUID.test(id)) return { error: "This complaint could not be found." };
  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase.from("complaints")
    .select("status, resolution_summary, root_cause").eq("id", id).maybeSingle();
  if (loadError) return { error: dbError(loadError, "load status") };
  if (!current) return { error: "This complaint could not be found." };
  if (!nextComplaintStatuses(current.status as ComplaintStatus).includes(raw.status as ComplaintStatus)) {
    return { error: "Choose one of the statuses offered.", fieldErrors: { status: "Choose a status." } };
  }
  const checked = checkStatusChange(raw, current as { resolution_summary: string | null; root_cause: string | null });
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };
  const { error } = await supabase.rpc("set_complaint_status", {
    target_id: id,
    new_status: checked.details.status,
    note: checked.details.note,
    resolution_summary: checked.details.resolution_summary,
    root_cause: checked.details.root_cause,
  });
  if (error) return { error: dbError(error, "status") };
  afterChange(id);
  return { message: "Status updated." };
}

/** Assign to me (customer care, unassigned cases) or assign to anyone (admin and management). */
export async function setComplaintOwner(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getComplaintAccess();
  const id = String(form.get("id") ?? "");
  const raw = String(form.get("owner") ?? "");
  if (!access.canView || !UUID.test(id)) return { error: "This complaint could not be found." };
  if (!access.reassigns && !access.takesUnassigned) return { error: "Your role cannot assign complaints." };
  let owner: string | null;
  if (raw === "me") owner = access.userId;
  else if (raw === "none") owner = null;
  else if (UUID.test(raw)) owner = raw;
  else return { error: "Choose who should own the complaint." };
  if (!access.reassigns && owner !== access.userId) return { error: "Only admin and management can assign complaints to other people." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_complaint_owner", { target_id: id, new_owner: owner });
  if (error) {
    if (error.code === "42501" && !access.reassigns) return { error: "Someone else took this complaint first. Reload the page." };
    return { error: dbError(error, "owner") };
  }
  afterChange(id);
  return { message: owner === access.userId ? "Assigned to you." : owner ? "Owner changed." : "Owner cleared." };
}

export async function addComplaintEvent(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getComplaintAccess();
  if (!access.canView) return { error: "Your role does not include complaints." };
  const id = String(form.get("id") ?? "");
  const type = String(form.get("type") ?? "note");
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!UUID.test(id)) return { error: "This complaint could not be found." };
  if (!["note", "call", "email"].includes(type)) return { error: "Choose note, call or email.", fieldErrors: { type: "Choose a type." } };
  if (!body) return { error: "Write what happened.", fieldErrors: { body: "Write what happened." } };
  if (body.length > 4000) return { error: "At most 4000 characters.", fieldErrors: { body: "At most 4000 characters." } };
  const supabase = await createClient();
  // A refused insert raises (Row Level Security), so it always reaches the person.
  const { error } = await supabase.from("complaint_events").insert({ complaint_id: id, type, body });
  if (error) return { error: error.code === "42501" ? "You cannot add to this complaint's timeline." : dbError(error, "event") };
  afterChange(id);
  return { message: "Added to the timeline." };
}

export type FileResult = { error?: string };

/** Records a file the browser has just uploaded to the complaint-files bucket. */
export async function addComplaintFile(complaintId: string, storagePath: string, fileName: string, mimeType: string, size: number): Promise<FileResult> {
  const access = await getComplaintAccess();
  if (!access.works) return { error: "Only admin and customer care add files." };
  if (!UUID.test(complaintId)) return { error: "This complaint could not be found." };
  const parts = storagePath.split("/");
  if (parts.length !== 2 || parts[0] !== complaintId || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(parts[1])) {
    return { error: "The upload went to the wrong folder. Please try again." };
  }
  if (!(COMPLAINT_FILE_TYPES as readonly string[]).includes(mimeType)) return { error: "Use a photo (JPG, PNG, WebP, HEIC) or a PDF." };
  if (!Number.isInteger(size) || size < 1 || size > COMPLAINT_FILE_MAX_BYTES) return { error: "Files can be up to 10 MB." };
  const name = fileName.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200) || parts[1];
  const supabase = await createClient();
  const { error } = await supabase.from("complaint_files").insert({
    complaint_id: complaintId, storage_path: storagePath, file_name: name, mime_type: mimeType, size_bytes: size,
  });
  if (error) {
    console.error("[complaints] file record failed", error);
    return { error: "The file was uploaded but could not be added to the complaint. Please try again or tell the IT team." };
  }
  afterChange(complaintId);
  return {};
}

export async function deleteComplaintFile(complaintId: string, fileId: string): Promise<FileResult> {
  const access = await getComplaintAccess();
  if (!access.isAdmin) return { error: "Only admin removes files." };
  if (!UUID.test(complaintId) || !UUID.test(fileId)) return { error: "This file could not be found." };
  const supabase = await createClient();
  const { data: file, error: loadError } = await supabase.from("complaint_files").select("id, storage_path")
    .eq("id", fileId).eq("complaint_id", complaintId).maybeSingle();
  if (loadError || !file) return { error: "This file could not be found." };
  const { error: storageError } = await supabase.storage.from(COMPLAINT_FILES_BUCKET).remove([file.storage_path as string]);
  if (storageError) return { error: "The file could not be removed. Please try again." };
  const { error } = await supabase.from("complaint_files").delete().eq("id", fileId);
  if (error) return { error: "The file was removed but its record stayed. Please try again." };
  afterChange(complaintId);
  return {};
}

export async function deleteComplaint(id: string): Promise<void> {
  const access = await getComplaintAccess();
  if (!access.isAdmin || !UUID.test(id)) redirect(`${BASE}/${id}?error=delete`);
  const supabase = await createClient();
  // Files first: the bucket only lets admins remove them, and the records go with the complaint.
  const { data: files } = await supabase.from("complaint_files").select("storage_path").eq("complaint_id", id);
  const paths = (files ?? []).map((f) => f.storage_path as string);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(COMPLAINT_FILES_BUCKET).remove(paths);
    if (storageError) redirect(`${BASE}/${id}?error=delete`);
  }
  const { error } = await supabase.rpc("delete_complaint", { target_id: id });
  if (error) {
    if (error.code !== "42501") console.error("[complaints] delete failed", error);
    redirect(`${BASE}/${id}?error=delete`);
  }
  afterChange();
  redirect(`${BASE}?deleted=1`);
}
