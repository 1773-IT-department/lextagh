import { COMPLAINT_CATEGORIES, COMPLAINT_CHANNELS, COMPLAINT_SEVERITIES, HIGH_FLOOR_CATEGORIES, type ComplaintCategory } from "@lexta/db";

/**
 * Checking complaint form data in the portal, with the same limits as supabase/migrations/0007_complaints.sql,
 * so people get a clear message instead of a database error.
 */

/** Sent instead of an id to keep a link the editor cannot see or pick. */
export const KEEP = "keep";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PHONE = /^\+?[0-9][0-9 ()-]{5,22}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Raw = Record<string, string>;
type Checked<T> = { details: T | null; errors: Record<string, string> };

const squash = (v: string | undefined) => (v ?? "").replace(/[ \t]+/g, " ").trim();
const opt = (v: string | undefined) => squash(v) || null;
const longText = (v: string | undefined) => (v ?? "").replace(/\r\n/g, "\n").trim() || null;

function maxLen(errors: Record<string, string>, field: string, value: string | null, max: number, label: string) {
  if (value && value.length > max) errors[field] = `${label} can be at most ${max} characters.`;
}

function validDate(v: string): boolean {
  if (!DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const idOrKeep = (v: string, allowKeep: boolean) => v === "" || UUID.test(v) || (allowKeep && v === KEEP);

export type ComplaintDetails = {
  brand_id: string;
  product_id: string | null;
  sku_id: string | null;
  batch_number: string | null;
  stockist_id: string | null;
  purchase_place: string | null;
  purchase_date: string | null;
  category: string;
  severity: string;
  channel: string;
  description: string;
  organisation_id: string | null;
  contact_id?: string | null;
  new_contact?: { full_name: string | null; phone: string | null; email: string | null } | null;
};

export function checkComplaint(raw: Raw, opts: { isNew: boolean; brandIds: Set<string> }): Checked<ComplaintDetails> {
  const errors: Record<string, string> = {};
  const brand = raw.brand_id ?? "";
  if (!opts.brandIds.has(brand)) errors.brand_id = "Choose the brand the complaint is about.";
  const product = raw.product_id ?? "";
  const sku = raw.sku_id ?? "";
  if (!idOrKeep(product, !opts.isNew)) errors.product_id = "Choose a product from the list.";
  if (!idOrKeep(sku, !opts.isNew)) errors.sku_id = "Choose a pack size from the list.";
  if (sku && !product) errors.sku_id = "Choose the product first.";
  const batch = opt(raw.batch_number);
  maxLen(errors, "batch_number", batch, 60, "The batch number");
  const stockist = raw.stockist_id ?? "";
  if (stockist && !UUID.test(stockist)) errors.stockist_id = "Choose a stockist from the list.";
  const place = opt(raw.purchase_place);
  maxLen(errors, "purchase_place", place, 200, "Where it was bought");
  const date = raw.purchase_date ?? "";
  if (date && !validDate(date)) errors.purchase_date = "Pick a date.";
  else if (date && date > new Date().toISOString().slice(0, 10)) errors.purchase_date = "The purchase date cannot be in the future.";
  else if (date && date < "2000-01-01") errors.purchase_date = "Pick a date after 2000.";
  const category = raw.category ?? "";
  if (!COMPLAINT_CATEGORIES.some((c) => c.value === category)) errors.category = "Choose what the complaint is about.";
  let severity = raw.severity || "normal";
  if (!COMPLAINT_SEVERITIES.some((s) => s.value === severity)) errors.severity = "Choose a severity.";
  // Same floor as the database: a health or safety concern or a foreign object is at least high.
  if (HIGH_FLOOR_CATEGORIES.includes(category as ComplaintCategory) && (severity === "low" || severity === "normal")) severity = "high";
  const channel = raw.channel ?? "";
  if (!COMPLAINT_CHANNELS.some((c) => c.value === channel)) errors.channel = "Choose how the complaint came in.";
  const description = longText(raw.description);
  if (!description) errors.description = "Write what the customer told you.";
  maxLen(errors, "description", description, 5000, "The description");
  const org = raw.organisation_id ?? "";
  if (!idOrKeep(org, !opts.isNew)) errors.organisation_id = "Choose an organisation from the list.";

  const details: ComplaintDetails = {
    brand_id: brand,
    product_id: product || null,
    sku_id: sku || null,
    batch_number: batch,
    stockist_id: stockist || null,
    purchase_place: place,
    purchase_date: date || null,
    category,
    severity,
    channel,
    description: description ?? "",
    organisation_id: org || null,
  };

  if (opts.isNew) {
    const contact = raw.contact_id ?? "";
    if (contact) {
      if (!UUID.test(contact)) errors.contact_id = "Choose the customer again.";
      details.contact_id = contact;
    } else {
      const name = opt(raw.contact_name);
      maxLen(errors, "contact_name", name, 120, "The name");
      const phone = opt(raw.contact_phone);
      if (phone && !PHONE.test(phone)) errors.contact_phone = "Enter a phone number with digits only, for example 024 123 4567.";
      const email = opt(raw.contact_email)?.toLowerCase() ?? null;
      if (email && (!EMAIL.test(email) || email.length > 254)) errors.contact_email = "Enter an email address like name@example.com.";
      if (!phone && !email) errors.contact_phone = "Enter a phone number or an email address so we can reply.";
      details.new_contact = { full_name: name, phone, email };
    }
  }
  return Object.keys(errors).length ? { details: null, errors } : { details, errors };
}

export type StatusChange = { status: string; note: string | null; resolution_summary: string | null; root_cause: string | null };

export function checkStatusChange(raw: Raw, current: { resolution_summary: string | null; root_cause: string | null }): Checked<StatusChange> {
  const errors: Record<string, string> = {};
  const status = raw.status ?? "";
  const note = longText(raw.note);
  maxLen(errors, "note", note, 1000, "The note");
  const summary = longText(raw.resolution_summary);
  maxLen(errors, "resolution_summary", summary, 3000, "The resolution summary");
  const cause = longText(raw.root_cause);
  maxLen(errors, "root_cause", cause, 2000, "The root cause");
  if (status === "reopened" && !note) errors.note = "Say why the complaint is being reopened.";
  if ((status === "resolved" || status === "closed") && !summary && !current.resolution_summary) {
    errors.resolution_summary = "Write how the complaint was resolved.";
  }
  if (status === "resolved" && !cause && !current.root_cause) errors.root_cause = "Write the root cause.";
  return Object.keys(errors).length
    ? { details: null, errors }
    : { details: { status, note, resolution_summary: summary, root_cause: cause }, errors };
}
