"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkActivity, checkContact, checkLead, checkOrganisation } from "@/lib/crm-input";
import { canPickNewLeadStage, getCrmAccess, leadBrandChoices, UUID } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export type CrmFormState = { error?: string; message?: string; fieldErrors?: Record<string, string> };

type Kind = "lead" | "contact" | "organisation";
const PATHS: Record<Kind, string> = { lead: "/systems/crm/leads", contact: "/systems/crm/contacts", organisation: "/systems/crm/organisations" };
const NOUN: Record<Kind, string> = { lead: "lead", contact: "contact", organisation: "organisation" };

const READ_ONLY = "Your role can add new records and activities but cannot change existing ones.";

const fields = (form: FormData) => {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
};

/** Turns a database error into words a person can act on. Unknown errors are logged, never shown raw. */
function dbError(error: { code?: string; message: string }, kind: Kind, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "42501") {
    if (msg.includes("take the lead first")) return "Assign the lead to yourself before changing its brand.";
    if (msg.includes("brands you work on")) return "You can only use brands you work on.";
    if (msg.includes("assign records to other people") || msg.includes("reassign owners")) return "Only admin and management can assign records to other people.";
    if (msg.includes("organisation not found")) return "That organisation is not available to you. Pick another one.";
    if (msg.includes("contact not found")) return "That contact is not available to you. Pick another one.";
    if (msg.includes("remove a brand")) return "You can only remove brands you work on.";
    if (msg.includes("cannot remove a link")) return "This record is linked to an organisation you cannot see. You can keep that link or pick another organisation, but not remove it.";
    if (msg.includes("row-level security") && kind === "organisation") {
      return "You cannot change the brands of this organisation. Ask its owner or a manager.";
    }
    return `You do not have permission to change this ${NOUN[kind]}. It may have been reassigned or removed. Reload the page.`;
  }
  if (error.code === "23514" && msg.includes("owner must be")) return "The owner must be a team member who uses the CRM.";
  if (error.code === "23514" || error.code === "22P02" || error.code === "22007" || error.code === "22008") {
    return "One of the fields is too long or in the wrong format. Please check and try again.";
  }
  if (error.code === "23503") {
    return context === "delete"
      ? `This ${NOUN[kind]} still has leads or other records linked to it. Move or delete those first.`
      : "Something you picked no longer exists. Reload the page and try again.";
  }
  console.error(`[crm] ${kind} ${context} failed`, error);
  return `We could not save the ${NOUN[kind]}. Please try again. If it keeps happening, tell the IT team.`;
}

function ownerFrom(raw: string, userId: string, manages: boolean): string | null | "invalid" {
  if (!raw || raw === "none") return null;
  if (raw === "me") return userId;
  if (!UUID.test(raw)) return "invalid";
  if (!manages && raw !== userId) return "invalid";
  return raw;
}

function afterChange(kind: Kind, id?: string) {
  revalidatePath("/systems/crm", "layout");
  if (id) revalidatePath(`${PATHS[kind]}/${id}`);
}

// Leads -----------------------------------------------------------------------------------------

export async function saveLead(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  if (!access.canView) return { error: "Your role does not include the CRM." };
  const raw = fields(form);
  const id = raw.id ?? "";
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This lead could not be found." };
  if (!isNew && !access.canEdit) return { error: READ_ONLY };

  const brandIds = new Set(leadBrandChoices(access).map((b) => b.id));
  // A brand the lead already has stays valid even if this person could not pick it.
  if (raw.current_brand_id && UUID.test(raw.current_brand_id)) brandIds.add(raw.current_brand_id);
  const checked = checkLead(raw, { isNew, brandIds });
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };

  const details: Record<string, unknown> = { ...checked.details };
  if (isNew) {
    const owner = ownerFrom(raw.owner_id ?? "", access.userId, access.manages);
    if (owner === "invalid") return { error: "Only admin and management can assign leads to other people.", fieldErrors: { owner_id: "Choose yourself or nobody." } };
    details.owner_id = owner;
    // Customer care adds new leads only; the database refuses any other stage from them too.
    if (!canPickNewLeadStage(access)) {
      details.stage = "new";
      details.lost_reason = null;
    }
  }

  const supabase = await createClient();
  const { data: savedId, error } = await supabase.rpc("save_crm_lead", { target_id: isNew ? null : id, details });
  if (error || typeof savedId !== "string") {
    return { error: error ? dbError(error, "lead", "save") : "We could not save the lead. Please try again." };
  }
  afterChange("lead", savedId);
  if (isNew) redirect(`/systems/crm/leads/${savedId}?created=1`);
  return { message: "Saved." };
}

export async function setLeadStage(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  if (!access.canEdit) return { error: READ_ONLY };
  const id = String(form.get("id") ?? "");
  const stage = String(form.get("stage") ?? "");
  const reason = String(form.get("lost_reason") ?? "").replace(/\s+/g, " ").trim();
  if (!UUID.test(id)) return { error: "This lead could not be found." };
  if (!["new", "contacted", "qualified", "proposal", "won", "lost"].includes(stage)) return { error: "Choose a stage.", fieldErrors: { stage: "Choose a stage." } };
  if (stage === "lost" && !reason) return { error: "Say why the lead was lost.", fieldErrors: { lost_reason: "Say why the lead was lost." } };
  if (reason.length > 500) return { error: "The reason can be at most 500 characters.", fieldErrors: { lost_reason: "At most 500 characters." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_crm_lead_stage", { target_id: id, new_stage: stage, reason: stage === "lost" ? reason : null });
  if (error) return { error: dbError(error, "lead", "stage") };
  afterChange("lead", id);
  return { message: "Stage updated." };
}

/** Assign to me, reassign (admin and management) or clear the owner. */
export async function setOwner(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  const kind = String(form.get("kind") ?? "") as Kind;
  const id = String(form.get("id") ?? "");
  if (!access.canView || !(kind in PATHS) || !UUID.test(id)) return { error: "This record could not be found." };
  // Who may change owners, checked here as well as in the database, so each person gets the right message.
  if (access.role === "customer_care") return { error: "Customer care cannot assign or reassign records. Ask a manager." };
  if (!access.manages && !access.works) return { error: "Your role cannot assign records." };
  const owner = ownerFrom(String(form.get("owner") ?? ""), access.userId, access.manages);
  if (owner === "invalid") return { error: "Only admin and management can assign records to other people." };
  if (!access.manages) {
    if (kind !== "lead") return { error: "Only admin and management can change who owns contacts and organisations." };
    if (owner !== access.userId) return { error: "Only admin and management can reassign or unassign a lead." };
  }
  const supabase = await createClient();
  // set_crm_owner raises when nothing changed hands, so a refused change always reaches the person.
  const { error } = await supabase.rpc("set_crm_owner", { kind, target_id: id, new_owner: owner });
  if (error) {
    if (error.code === "42501" && kind === "lead" && owner === access.userId) {
      return { error: "Someone else took this lead first, or it is no longer available to you. Reload the page." };
    }
    return { error: dbError(error, kind, "owner") };
  }
  afterChange(kind, id);
  return { message: owner === access.userId ? "Assigned to you." : owner ? "Owner changed." : "Owner cleared." };
}

// Contacts ---------------------------------------------------------------------------------------

export async function saveContact(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  if (!access.canView) return { error: "Your role does not include the CRM." };
  const raw = fields(form);
  const id = raw.id ?? "";
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This contact could not be found." };
  if (!isNew && !access.canEdit) return { error: READ_ONLY };
  const checked = checkContact(raw);
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };
  const details: Record<string, unknown> = { ...checked.details };
  if (isNew) {
    const owner = ownerFrom(raw.owner_id ?? "", access.userId, access.manages);
    if (owner === "invalid") return { error: "Only admin and management can assign contacts to other people.", fieldErrors: { owner_id: "Choose yourself or nobody." } };
    details.owner_id = owner;
  }
  const supabase = await createClient();
  const { data: savedId, error } = await supabase.rpc("save_crm_contact", { target_id: isNew ? null : id, details });
  if (error || typeof savedId !== "string") {
    return { error: error ? dbError(error, "contact", "save") : "We could not save the contact. Please try again." };
  }
  afterChange("contact", savedId);
  if (isNew) {
    const next = raw.then === "lead" ? `/systems/crm/leads/new?contact=${savedId}` : `/systems/crm/contacts/${savedId}?created=1`;
    redirect(next);
  }
  return { message: "Saved." };
}

// Organisations ----------------------------------------------------------------------------------

export async function saveOrganisation(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  if (!access.canCreateOrg) return { error: "Your role cannot add or change organisations." };
  const raw = fields(form);
  const id = raw.id ?? "";
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This organisation could not be found." };
  const checked = checkOrganisation(raw, new Set(access.regions.map((r) => r.id)));
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };

  // Brands: this person ticks or unticks their own; brands other people work on stay as they are.
  const productBrandIds = new Set(access.allBrands.filter((b) => !b.is_corporate).map((b) => b.id));
  const ticked = form.getAll("brand_ids").map(String).filter((b) => productBrandIds.has(b));
  if (ticked.some((b) => !access.myBrandIds.has(b))) return { error: "You can only add brands you work on." };
  const supabase = await createClient();
  let kept: string[] = [];
  if (!isNew) {
    const { data: current, error } = await supabase.from("crm_organisation_brands").select("brand_id").eq("organisation_id", id);
    if (error) return { error: dbError(error, "organisation", "load brands") };
    kept = (current ?? []).map((l) => l.brand_id as string).filter((b) => !access.myBrandIds.has(b));
  }
  const brandIds = [...new Set([...kept, ...ticked])];

  const details: Record<string, unknown> = { ...checked.details };
  if (isNew) {
    const owner = ownerFrom(raw.owner_id ?? "", access.userId, access.manages);
    if (owner === "invalid") return { error: "Only admin and management can assign organisations to other people.", fieldErrors: { owner_id: "Choose yourself or nobody." } };
    details.owner_id = owner;
  }
  const { data: savedId, error } = await supabase.rpc("save_crm_organisation", { target_id: isNew ? null : id, details, brand_ids: brandIds });
  if (error || typeof savedId !== "string") {
    return { error: error ? dbError(error, "organisation", "save") : "We could not save the organisation. Please try again." };
  }
  afterChange("organisation", savedId);
  if (isNew) redirect(`/systems/crm/organisations/${savedId}?created=1`);
  return { message: "Saved." };
}

// Activities and deletes ---------------------------------------------------------------------------

export async function addActivity(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getCrmAccess();
  if (!access.canView) return { error: "Your role does not include the CRM." };
  const kind = String(form.get("kind") ?? "") as Kind;
  const id = String(form.get("id") ?? "");
  if (!(kind in PATHS) || !UUID.test(id)) return { error: "This record could not be found." };
  const checked = checkActivity(fields(form));
  if (!checked.details) return { error: "Please check the highlighted fields.", fieldErrors: checked.errors };
  const parent = kind === "lead" ? { lead_id: id } : kind === "contact" ? { contact_id: id } : { organisation_id: id };
  const supabase = await createClient();
  const row: Record<string, unknown> = { ...parent, type: checked.details.type, body: checked.details.body };
  if (checked.details.occurred_at) row.occurred_at = checked.details.occurred_at;
  // A refused insert raises (Row Level Security), so it always reaches the person.
  const { error } = await supabase.from("crm_activities").insert(row);
  if (error) return { error: error.code === "42501" ? `You cannot add activities to this ${NOUN[kind]}.` : dbError(error, kind, "activity") };
  afterChange(kind, id);
  return { message: "Added to the timeline." };
}

export async function deleteRecord(kind: Kind, id: string): Promise<void> {
  const access = await getCrmAccess();
  if (!access.isAdmin || !(kind in PATHS) || !UUID.test(id)) redirect(`${PATHS[kind] ?? "/systems/crm"}/${id}?error=delete`);
  const supabase = await createClient();
  // delete_crm_record raises when no row was deleted.
  const { error } = await supabase.rpc("delete_crm_record", { kind, target_id: id });
  if (error) {
    if (error.code !== "42501" && error.code !== "23503") console.error("[crm] delete failed", error);
    redirect(`${PATHS[kind]}/${id}?error=${error.code === "23503" ? "linked" : "delete"}`);
  }
  afterChange(kind);
  redirect(`${PATHS[kind]}?deleted=1`);
}
