"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { COMPLAINT_CATEGORIES, CHAT_LIMITS } from "@lexta/db";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { getChatAccess } from "@/lib/chat";
import { UUID } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

const BASE = "/systems/chat";
const NO_ACCESS = "Your role does not include the live chat inbox.";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/;

/** Turns a database error into words a person can act on. Unknown errors are logged, never shown raw. */
function dbError(error: { code?: string; message?: string }, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "55000" && msg.includes("closed")) return "This chat is closed. Reopen it to reply, or add an internal note.";
  if (error.code === "PT409") return msg.includes("complaint") ? "A complaint was already logged from this chat." : "A lead was already made from this chat.";
  if (error.code === "42501") return "You do not have permission to make this change, or the chat changed. Reload the page.";
  if (error.code === "22023" && msg.includes("phone number or an email")) {
    return "A complaint needs a way to reach the customer. Add their email or phone under Visitor first.";
  }
  if (error.code === "23514") {
    if (msg.includes("assigned")) return "A chat can only be assigned to an active admin, management or customer care person.";
    return "One of the fields is too long, missing or in the wrong format. Please check and try again.";
  }
  console.error(`[chat] ${context} failed`, error);
  return "We could not save this. Please try again. If it keeps happening, tell the IT team.";
}

const idOf = (form: FormData) => {
  const id = String(form.get("id") ?? "");
  return UUID.test(id) ? id : null;
};

function afterChange(id: string) {
  revalidatePath(BASE);
  revalidatePath(`${BASE}/${id}`);
}

/** A reply the visitor sees, or an internal note only staff see. */
export async function sendReply(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getChatAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = idOf(form);
  if (!id) return { error: "This chat could not be found." };
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const internal = form.get("internal") === "yes";
  if (!body) return { error: "Please check the highlighted field.", fieldErrors: { body: internal ? "Write the note first." : "Write a reply first." } };
  if (body.length > CHAT_LIMITS.message) return { error: "Please check the highlighted field.", fieldErrors: { body: `At most ${CHAT_LIMITS.message} characters.` } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("chat_reply", { target_id: id, body, internal });
  if (error) return { error: dbError(error, "reply") };
  afterChange(id);
  return { message: internal ? "Note added. The visitor does not see it." : "Sent." };
}

export async function setChatStatus(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getChatAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = idOf(form);
  const status = String(form.get("status") ?? "");
  if (!id) return { error: "This chat could not be found." };
  if (!["open", "closed"].includes(status)) return { error: "Choose close or reopen." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("chat_set_status", { target_id: id, new_status: status });
  if (error) return { error: dbError(error, "status") };
  afterChange(id);
  return { message: status === "closed" ? "Chat closed." : "Chat reopened." };
}

export async function assignChat(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getChatAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = idOf(form);
  if (!id) return { error: "This chat could not be found." };
  const raw = String(form.get("assignee") ?? "");
  const assignee = raw === "me" ? access.userId : raw === "none" || raw === "" ? null : raw;
  if (assignee && !UUID.test(assignee)) return { error: "Choose someone from the list." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("chat_assign", { target_id: id, new_assignee: assignee });
  if (error) return { error: dbError(error, "assign") };
  afterChange(id);
  return { message: assignee === access.userId ? "Assigned to you." : assignee ? "Assigned." : "Nobody is assigned now." };
}

export async function saveVisitor(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getChatAccess();
  if (!access.canView) return { error: NO_ACCESS };
  const id = idOf(form);
  if (!id) return { error: "This chat could not be found." };
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (!name || name.length > CHAT_LIMITS.name) fieldErrors.name = `Enter a name (up to ${CHAT_LIMITS.name} characters).`;
  if (email && (email.length > CHAT_LIMITS.email || !EMAIL_RE.test(email))) fieldErrors.email = "Enter a valid email address, or leave it empty.";
  if (phone && !PHONE_RE.test(phone)) fieldErrors.phone = "Enter a valid phone number, for example +233 24 123 4567, or leave it empty.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.rpc("chat_save_visitor", { target_id: id, new_name: name, new_email: email, new_phone: phone });
  if (error) return { error: dbError(error, "visitor") };
  afterChange(id);
  return { message: "Visitor details saved." };
}

export async function makeLead(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getChatAccess();
  if (!access.canMakeLead) return { error: "Your role cannot create CRM leads." };
  const id = idOf(form);
  if (!id) return { error: "This chat could not be found." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("chat_create_lead", { target_id: id });
  if (error) return { error: dbError(error, "make lead") };
  afterChange(id);
  revalidatePath("/systems/crm", "layout");
  // Only a lead id the database gave back (a uuid) goes into the address.
  const leadId = typeof data === "string" && UUID.test(data) ? data : "";
  redirect(`${BASE}/${id}?made=lead${leadId ? `&lead=${leadId}` : ""}`);
}

export async function makeComplaint(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getChatAccess();
  if (!access.canMakeComplaint) return { error: "Your role cannot log complaints." };
  const id = idOf(form);
  if (!id) return { error: "This chat could not be found." };
  const category = String(form.get("category") ?? "");
  if (!COMPLAINT_CATEGORIES.some((c) => c.value === category)) {
    return { error: "Please check the highlighted field.", fieldErrors: { category: "Choose what the complaint is about." } };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("chat_create_complaint", { target_id: id, category });
  if (error) return { error: dbError(error, "make complaint") };
  afterChange(id);
  revalidatePath("/systems/complaints", "layout");
  redirect(`${BASE}/${id}?made=complaint`);
}

/** Admin only: removes the conversation and its messages for good. */
export async function deleteChat(id: string): Promise<void> {
  const access = await getChatAccess();
  if (!access.isAdmin || !UUID.test(id)) redirect(`${BASE}/${id}?error=delete`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("chat_delete", { target_id: id });
  if (error) {
    if (error.code !== "42501") console.error("[chat] delete failed", error);
    redirect(`${BASE}/${id}?error=delete`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}
