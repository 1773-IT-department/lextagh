// Complaints types, labels, targets and the website intake helper. Hand written from
// supabase/migrations/0007_complaints.sql.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "./client";

type Timestamps = { created_at: string; updated_at: string };
type Option<T extends string> = { value: T; label: string };

export type ComplaintCategory =
  | "product_quality" | "packaging" | "foreign_object" | "health_safety" | "availability" | "pricing_in_shop"
  | "staff_service" | "delivery" | "other";
export type ComplaintSeverity = "low" | "normal" | "high" | "critical";
export type ComplaintChannel =
  | "website" | "phone" | "email" | "walk_in" | "social_media" | "field_visit" | "distributor" | "other";
export type ComplaintStatus =
  | "new" | "acknowledged" | "investigating" | "awaiting_customer" | "resolved" | "closed" | "reopened";
export type ComplaintEventType = "note" | "call" | "email" | "status_change" | "owner_change" | "attachment_added";

export const COMPLAINT_CATEGORIES: readonly Option<ComplaintCategory>[] = [
  { value: "product_quality", label: "Product quality" },
  { value: "packaging", label: "Packaging" },
  { value: "foreign_object", label: "Foreign object" },
  { value: "health_safety", label: "Health or safety concern" },
  { value: "availability", label: "Availability" },
  { value: "pricing_in_shop", label: "Pricing in shop" },
  { value: "staff_service", label: "Staff or service" },
  { value: "delivery", label: "Delivery" },
  { value: "other", label: "Other" },
] as const;

export const COMPLAINT_SEVERITIES: readonly Option<ComplaintSeverity>[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export const COMPLAINT_CHANNELS: readonly Option<ComplaintChannel>[] = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "walk_in", label: "Walk in" },
  { value: "social_media", label: "Social media" },
  { value: "field_visit", label: "Field visit" },
  { value: "distributor", label: "Distributor" },
  { value: "other", label: "Other" },
] as const;

/** In working order. New, acknowledged, investigating, awaiting customer and reopened are open. */
export const COMPLAINT_STATUSES: readonly Option<ComplaintStatus>[] = [
  { value: "new", label: "New" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "investigating", label: "Investigating" },
  { value: "awaiting_customer", label: "Awaiting customer" },
  { value: "reopened", label: "Reopened" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export const OPEN_COMPLAINT_STATUSES: readonly ComplaintStatus[] = ["new", "acknowledged", "investigating", "awaiting_customer", "reopened"];

export const COMPLAINT_EVENT_TYPES: readonly Option<ComplaintEventType>[] = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "status_change", label: "Status" },
  { value: "owner_change", label: "Owner" },
  { value: "attachment_added", label: "File" },
] as const;

/** Response and resolution targets in hours from when the complaint was received (same as the database). */
export const COMPLAINT_TARGET_HOURS: Record<ComplaintSeverity, { response: number; resolution: number }> = {
  critical: { response: 4, resolution: 48 },
  high: { response: 24, resolution: 120 },
  normal: { response: 48, resolution: 240 },
  low: { response: 72, resolution: 360 },
};

/** Which statuses a complaint may move to next (same rules as check_complaint in 0007_complaints.sql). */
export function nextComplaintStatuses(status: ComplaintStatus): ComplaintStatus[] {
  if (status === "closed") return ["reopened"];
  if (status === "resolved") return ["closed", "reopened"];
  return (["acknowledged", "investigating", "awaiting_customer", "resolved", "closed"] as ComplaintStatus[]).filter((s) => s !== status);
}

const labelOf = <T extends string>(list: readonly Option<T>[], value: string | null | undefined, fallback = "") =>
  list.find((o) => o.value === value)?.label ?? fallback;

export const complaintCategoryLabel = (v: string | null | undefined) => labelOf(COMPLAINT_CATEGORIES, v, "Other");
export const complaintSeverityLabel = (v: string | null | undefined) => labelOf(COMPLAINT_SEVERITIES, v, "Normal");
export const complaintChannelLabel = (v: string | null | undefined) => labelOf(COMPLAINT_CHANNELS, v, "Other");
export const complaintStatusLabel = (v: string | null | undefined) => labelOf(COMPLAINT_STATUSES, v, "New");
export const complaintEventLabel = (v: string | null | undefined) => labelOf(COMPLAINT_EVENT_TYPES, v, "Note");
export const isOpenComplaint = (status: ComplaintStatus) => OPEN_COMPLAINT_STATUSES.includes(status);

/** Overdue: still open and past the resolution target, or not yet answered and past the response target. */
export function isComplaintOverdue(
  c: Pick<Complaint, "status" | "response_due_at" | "resolution_due_at" | "first_response_at">,
  now: Date = new Date(),
): boolean {
  if (!isOpenComplaint(c.status)) return false;
  const t = now.getTime();
  return new Date(c.resolution_due_at).getTime() < t || (!c.first_response_at && new Date(c.response_due_at).getTime() < t);
}

type Authors = { created_by: string | null; updated_by: string | null };

export type Complaint = Timestamps & Authors & {
  id: string;
  /** LX-<year>-0001, set by the database. */
  case_number: string;
  brand_id: string;
  product_id: string | null;
  sku_id: string | null;
  batch_number: string | null;
  stockist_id: string | null;
  purchase_place: string | null;
  purchase_date: string | null;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  channel: ComplaintChannel;
  description: string;
  contact_id: string;
  organisation_id: string | null;
  status: ComplaintStatus;
  owner_id: string | null;
  /** Set by the database from the severity. */
  response_due_at: string;
  resolution_due_at: string;
  first_response_at: string | null;
  resolution_summary: string | null;
  root_cause: string | null;
  resolved_at: string | null;
  closed_at: string | null;
};

export type ComplaintEvent = Timestamps & {
  id: string;
  complaint_id: string;
  type: ComplaintEventType;
  body: string;
  occurred_at: string;
  created_by: string | null;
};

export type ComplaintFile = Timestamps & {
  id: string;
  complaint_id: string;
  /** <complaint id>/<file name> in the private complaint-files bucket. */
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_by: string | null;
};

export const COMPLAINT_FILES_BUCKET = "complaint-files";
export const COMPLAINT_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"] as const;
export const COMPLAINT_FILE_MAX_BYTES = 10 * 1024 * 1024;

// Website intake (wired to the website complaint form in item 19) ------------------------------------------

export type ComplaintFormPayload = {
  /** Hidden field that people never fill in. Send it as the form has it; anything in it marks a bot. */
  honeypot?: string;
  /** Brand slug: lexta, yazz, linzzy or hooch. Leave out for the corporate Lexta brand. */
  brand?: string;
  name: string;
  email?: string;
  phone?: string;
  category: ComplaintCategory;
  /** The complaint itself, up to 3000 characters. */
  message: string;
  /** Slug of a published product of that brand. */
  product?: string;
  /** SKU code of an active SKU of that product (needs product). */
  sku?: string;
  batch_number?: string;
  /** Where it was bought, as the customer says it. */
  purchase_place?: string;
  /** YYYY-MM-DD, not in the future. */
  purchase_date?: string;
};

export type ComplaintResult =
  | { ok: true; caseNumber: string }
  | { ok: false; reason: "invalid"; field: string | null }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "error" };

/**
 * Logs a website complaint through public.submit_complaint. Visitors never read complaint data: the only thing that
 * comes back is the case number to show them. Leave out empty fields rather than sending "". No files for now.
 */
export async function submitComplaint(payload: ComplaintFormPayload, client?: SupabaseClient): Promise<ComplaintResult> {
  const supabase = client ?? createPublicClient();
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""));
  const { data, error } = await supabase.rpc("submit_complaint", { payload: clean });
  if (!error && typeof data === "string") return { ok: true, caseNumber: data };
  if (error?.code === "PT429") return { ok: false, reason: "rate_limited" };
  if (error?.code === "22023") {
    const field = /^(?:invalid field|field too long): (\w+)/.exec(error.message)?.[1] ?? null;
    return { ok: false, reason: "invalid", field };
  }
  return { ok: false, reason: "error" };
}
