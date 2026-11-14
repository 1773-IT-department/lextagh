"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ORDER_MAX_LINES, ORDER_MAX_QUANTITY, ORDER_STATUSES, type OrderDetailsPayload } from "@lexta/db";
import type { CrmFormState } from "@/app/(app)/systems/crm/actions";
import { UUID } from "@/lib/crm";
import { getOrdersAccess, ORDERS_BASE } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

const NO_ACCESS = "Your role does not include distributor ordering.";

/** Turns a database error into words a person can act on. Unknown errors are logged, never shown raw. */
function dbError(error: { code?: string; message: string }, context: string): string {
  const msg = error.message ?? "";
  if (error.code === "42501") return "You do not have permission to make this change, or the order changed. Reload the page.";
  if (error.code === "23514" || error.code === "22023") {
    if (msg.includes("add at least one product")) return "Add at least one product before submitting.";
    if (msg.includes("delivery region")) return "Choose a delivery region or enter a delivery address.";
    if (msg.includes("no longer available")) return "A product on this order is no longer available. Remove it and submit again.";
    if (msg.includes("not available to order")) return "One of the products is not available to your account. Reload the catalogue and try again.";
    if (msg.includes("reason for cancelling")) return "Give the reason for cancelling. The distributor sees it.";
    if (msg.includes("cannot move from")) return "The order cannot move to that status from where it is now. Reload the page.";
    if (msg.includes("only a draft")) return "Only a draft can be changed.";
    if (msg.includes("only a distributor login")) return "Only a distributor login can be linked to an organisation.";
    if (msg.includes("whole number") || msg.includes("at most")) return "Quantities are whole packs, at most 100000 a line.";
    return "One of the fields is too long, missing or in the wrong format. Please check and try again.";
  }
  if (error.code === "23505") return "That login is already linked. Unlink it first.";
  if (error.code === "22P02") return "One of the fields is in the wrong format.";
  console.error(`[orders] ${context} failed`, error);
  return "We could not save this. Please try again. If it keeps happening, tell the IT team.";
}

function afterChange(path?: string) {
  revalidatePath(ORDERS_BASE, "layout");
  if (path) revalidatePath(path);
}

const text = (form: FormData, key: string, max: number) => {
  const v = String(form.get(key) ?? "").replace(/\r\n/g, "\n").trim();
  return { value: v || null, tooLong: v.length > max };
};

// Distributor: save a draft or submit ---------------------------------------------------------------------------

export async function saveOrder(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getOrdersAccess();
  if (!access.isDistributor || !access.account) return { error: "Only a linked distributor login can place orders." };
  const id = String(form.get("id") ?? "");
  if (id && !UUID.test(id)) return { error: "This order could not be found." };
  const submit = String(form.get("intent") ?? "") === "submit";

  let lines: OrderDetailsPayload["lines"];
  try {
    const raw = JSON.parse(String(form.get("lines") ?? "[]")) as unknown;
    if (!Array.isArray(raw)) throw new Error("lines");
    lines = raw.map((l) => ({ sku_id: String((l as { sku_id: unknown }).sku_id), quantity: Number((l as { quantity: unknown }).quantity) }));
  } catch {
    return { error: "The order could not be read. Reload the page and try again." };
  }
  lines = lines.filter((l) => l.quantity > 0);
  if (lines.some((l) => !UUID.test(l.sku_id) || !Number.isInteger(l.quantity) || l.quantity > ORDER_MAX_QUANTITY)) {
    return { error: "Quantities are whole packs, at most 100000 a line." };
  }
  if (lines.length > ORDER_MAX_LINES) return { error: `An order has at most ${ORDER_MAX_LINES} lines.` };

  const region = String(form.get("delivery_region_id") ?? "");
  if (region && !UUID.test(region)) return { error: "Choose a delivery region from the list.", fieldErrors: { delivery_region_id: "Choose from the list." } };
  const address = text(form, "delivery_address", 300);
  const notes = text(form, "distributor_notes", 2000);
  const fieldErrors: Record<string, string> = {};
  if (address.tooLong) fieldErrors.delivery_address = "At most 300 characters.";
  if (notes.tooLong) fieldErrors.distributor_notes = "At most 2000 characters.";
  if (submit) {
    if (!lines.length) return { error: "Add at least one product before submitting." };
    if (!region && !address.value) {
      fieldErrors.delivery_region_id = "Choose a delivery region or enter an address.";
      fieldErrors.delivery_address = "Choose a delivery region or enter an address.";
    }
  }
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const details: OrderDetailsPayload = { delivery_region_id: region || null, delivery_address: address.value, distributor_notes: notes.value, lines };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_distributor_order", { target_id: id || null, details, submit });
  if (error || !data) return { error: error ? dbError(error, submit ? "submit order" : "save order") : "We could not save the order." };
  const savedId = data as string;
  if (submit) {
    // [PLACEHOLDER: notify sales by email when an order is submitted] Email is not set up yet; staff see new orders
    // in the inbox (status Submitted). Hook the notification in here once Lexta's email sending is ready.
  }
  afterChange(`${ORDERS_BASE}/${savedId}`);
  redirect(`${ORDERS_BASE}/${savedId}?${submit ? "submitted" : "saved"}=1`);
}

// Status moves (distributor: submit or cancel; staff: confirm, dispatch, deliver, cancel) --------------------------

export async function setOrderStatus(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getOrdersAccess();
  if (!access.isDistributor && !access.isStaff) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  const note = text(form, "note", 1000);
  if (!UUID.test(id)) return { error: "This order could not be found." };
  if (!ORDER_STATUSES.some((s) => s.value === status)) return { error: "Choose what happens next." };
  if (note.tooLong) return { error: "At most 1000 characters.", fieldErrors: { note: "At most 1000 characters." } };
  if (access.isStaff && status === "cancelled" && !note.value) {
    return { error: "Give the reason for cancelling. The distributor sees it.", fieldErrors: { note: "Give the reason for cancelling." } };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_distributor_order_status", { target_id: id, new_status: status, note: note.value });
  if (error) return { error: dbError(error, "status") };
  if (status === "submitted") {
    // [PLACEHOLDER: notify sales by email when an order is submitted] See saveOrder.
  }
  afterChange(`${ORDERS_BASE}/${id}`);
  const done: Record<string, string> = {
    submitted: "Order submitted. Lexta will confirm it.", cancelled: "Order cancelled.", confirmed: "Order confirmed.",
    dispatched: "Marked as dispatched.", delivered: "Marked as delivered.",
  };
  return { message: done[status] ?? "Status updated." };
}

// Staff: internal notes --------------------------------------------------------------------------------------------

export async function addStaffNote(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getOrdersAccess();
  if (!access.isStaff) return { error: NO_ACCESS };
  const id = String(form.get("id") ?? "");
  const body = text(form, "body", 2000);
  if (!UUID.test(id)) return { error: "This order could not be found." };
  if (!body.value) return { error: "Write the note.", fieldErrors: { body: "Write the note." } };
  if (body.tooLong) return { error: "At most 2000 characters.", fieldErrors: { body: "At most 2000 characters." } };
  const supabase = await createClient();
  const { error } = await supabase.from("distributor_order_staff_notes").insert({ order_id: id, body: body.value });
  if (error) return { error: error.code === "42501" ? "You cannot add notes to this order." : dbError(error, "note") };
  afterChange(`${ORDERS_BASE}/${id}`);
  return { message: "Note added. Only Lexta staff see it." };
}

/** Admin only: the order with its lines, history and internal notes. */
export async function deleteOrder(id: string): Promise<void> {
  const access = await getOrdersAccess();
  if (!access.isAdmin || !UUID.test(id)) redirect(`${ORDERS_BASE}/${id}?error=delete`);
  const supabase = await createClient();
  const { data, error } = await supabase.from("distributor_orders").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    if (error) console.error("[orders] delete failed", error);
    redirect(`${ORDERS_BASE}/${id}?error=delete`);
  }
  afterChange();
  redirect(`${ORDERS_BASE}?deleted=1`);
}

// Staff: link distributor logins to organisations ------------------------------------------------------------------

export async function linkDistributor(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getOrdersAccess();
  if (!access.isStaff) return { error: NO_ACCESS };
  const profile = String(form.get("profile_id") ?? "");
  const org = String(form.get("organisation_id") ?? "");
  if (!UUID.test(profile)) return { error: "Choose the distributor login." };
  if (!UUID.test(org)) return { error: "Choose the organisation.", fieldErrors: { organisation_id: "Choose the organisation." } };
  const supabase = await createClient();
  const { error } = await supabase.from("distributor_accounts").insert({ profile_id: profile, organisation_id: org });
  if (error) {
    return { error: error.code === "42501" ? "You can only link to an organisation you can see in the CRM." : dbError(error, "link") };
  }
  afterChange(`${ORDERS_BASE}/distributors`);
  return { message: "Linked. The distributor sees the catalogue of that organisation's brands the next time they open the portal." };
}

export async function unlinkDistributor(_prev: CrmFormState, form: FormData): Promise<CrmFormState> {
  const access = await getOrdersAccess();
  if (!access.isStaff) return { error: NO_ACCESS };
  const profile = String(form.get("profile_id") ?? "");
  if (!UUID.test(profile)) return { error: "Choose the distributor login." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("distributor_accounts").delete().eq("profile_id", profile).select("id");
  if (error) return { error: dbError(error, "unlink") };
  if (!data?.length) return { error: "You can only unlink logins of organisations you can see in the CRM." };
  afterChange(`${ORDERS_BASE}/distributors`);
  return { message: "Unlinked. The login no longer sees any orders." };
}
