// CRM types, labels and the website intake helper. Hand written from supabase/migrations/0006_crm.sql.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "./client";

type Timestamps = { created_at: string; updated_at: string };

export type CrmOrgKind =
  | "distributor" | "retailer" | "supermarket_chain" | "pharmacy" | "institution" | "partner" | "media" | "supplier" | "other";
export type CrmLeadSource =
  | "website_contact_form" | "website_partner_form" | "website_newsletter" | "complaint_escalation" | "field_visit"
  | "phone" | "email" | "walk_in" | "referral" | "event" | "other";
export type CrmStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type CrmChannel = "phone" | "whatsapp" | "sms" | "email" | "in_person";
export type CrmActivityType = "note" | "call" | "email" | "meeting" | "visit" | "status_change";
export type CrmRecordKind = "lead" | "contact" | "organisation";

type Option<T extends string> = { value: T; label: string };

export const CRM_ORG_KINDS: readonly Option<CrmOrgKind>[] = [
  { value: "distributor", label: "Distributor" },
  { value: "retailer", label: "Retailer" },
  { value: "supermarket_chain", label: "Supermarket chain" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "institution", label: "Institution" },
  { value: "partner", label: "Partner" },
  { value: "media", label: "Media" },
  { value: "supplier", label: "Supplier" },
  { value: "other", label: "Other" },
] as const;

export const CRM_SOURCES: readonly Option<CrmLeadSource>[] = [
  { value: "website_contact_form", label: "Website contact form" },
  { value: "website_partner_form", label: "Website partner form" },
  { value: "website_newsletter", label: "Website newsletter" },
  { value: "complaint_escalation", label: "Complaint escalation" },
  { value: "field_visit", label: "Field visit" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "walk_in", label: "Walk in" },
  { value: "referral", label: "Referral" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

/** Pipeline order. Won and lost are the closed stages. */
export const CRM_STAGES: readonly Option<CrmStage>[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export const CRM_CHANNELS: readonly Option<CrmChannel>[] = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "in_person", label: "In person" },
] as const;

/** Activity types people can log. status_change is written by the database only. */
export const CRM_ACTIVITY_TYPES: readonly Option<CrmActivityType>[] = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "visit", label: "Visit" },
  { value: "status_change", label: "Stage change" },
] as const;

const labelOf = <T extends string>(list: readonly Option<T>[], value: string | null | undefined, fallback = "") =>
  list.find((o) => o.value === value)?.label ?? fallback;

export const crmOrgKindLabel = (v: string | null | undefined) => labelOf(CRM_ORG_KINDS, v, "Other");
export const crmSourceLabel = (v: string | null | undefined) => labelOf(CRM_SOURCES, v, "Other");
export const crmStageLabel = (v: string | null | undefined) => labelOf(CRM_STAGES, v, "New");
export const crmChannelLabel = (v: string | null | undefined) => labelOf(CRM_CHANNELS, v);
export const crmActivityLabel = (v: string | null | undefined) => labelOf(CRM_ACTIVITY_TYPES, v, "Note");
export const isClosedStage = (stage: CrmStage) => stage === "won" || stage === "lost";

type Authors = { created_by: string | null; updated_by: string | null };

export type CrmOrganisation = Timestamps & Authors & {
  id: string;
  name: string;
  kind: CrmOrgKind;
  region_id: string | null;
  town: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  stockist_id: string | null;
  notes: string | null;
  owner_id: string | null;
};

export type CrmOrganisationBrand = Timestamps & { id: string; organisation_id: string; brand_id: string };

export type CrmContact = Timestamps & Authors & {
  id: string;
  full_name: string | null;
  organisation_id: string | null;
  job_title: string | null;
  phone: string | null;
  /** Digits of the phone number with +233 written as 0, used to match duplicates. Set by the database. */
  phone_key: string | null;
  email: string | null;
  preferred_channel: CrmChannel | null;
  consent_marketing: boolean;
  consent_at: string | null;
  consent_source: string | null;
  notes: string | null;
  owner_id: string | null;
};

export type CrmLead = Timestamps & Authors & {
  id: string;
  title: string;
  description: string | null;
  contact_id: string | null;
  organisation_id: string | null;
  brand_id: string | null;
  source: CrmLeadSource;
  stage: CrmStage;
  lost_reason: string | null;
  owner_id: string | null;
  next_action: string | null;
  next_action_date: string | null;
  /** Free text, never a price. */
  estimated_monthly_volume: string | null;
  /** Reference the website gave the visitor, for leads that came in through submit_website_enquiry. */
  intake_reference: string | null;
  /** Organisation name a website visitor typed. The intake never links an existing organisation; staff do. */
  submitted_organisation_name: string | null;
  closed_at: string | null;
};

export type CrmActivity = Timestamps & {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  organisation_id: string | null;
  type: CrmActivityType;
  body: string;
  occurred_at: string;
  created_by: string | null;
};

/** One person who can own CRM records (from public.crm_staff()). */
export type CrmStaff = { id: string; display_name: string; role: string; is_active: boolean };

/** A contact or organisation name to show, falling back to email or phone. */
export function crmContactName(c: Pick<CrmContact, "full_name" | "email" | "phone"> | null | undefined): string {
  if (!c) return "";
  return c.full_name || c.email || c.phone || "Unnamed contact";
}

// Website intake (wired to the website forms in item 19) -------------------------------------------------

type Common = {
  /** Hidden field that people never fill in. Send it as the form has it; anything in it marks a bot. */
  honeypot?: string;
  /** Brand slug of the site or the brand picked: lexta, yazz, linzzy or hooch. */
  brand?: string;
  consent_marketing?: boolean;
};

export type ContactFormPayload = Common & {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  reason?: "general" | "distribution" | "bulk_orders" | "consumer_care" | "media" | "careers";
  organisation_name?: string;
  /** The contact form's extra field: products and quantities, batch code, publication or role reference. */
  detail?: string;
  /** Region slug (for example "ashanti"), or "outside-ghana". */
  region?: string;
};

export type PartnerFormPayload = Common & {
  name: string;
  organisation_name: string;
  email?: string;
  phone?: string;
  partner_type?: "distributor" | "retail" | "institutional" | "private_label" | "csr" | "supplier";
  location?: string;
  region?: string;
  years_trading?: string;
  estimated_monthly_volume?: string;
  job_title?: string;
  organisation_website?: string;
  message?: string;
};

export type NewsletterPayload = Common & { email: string; name?: string; consent_marketing: true };

export type EnquiryForm =
  | { form: "contact"; payload: ContactFormPayload }
  | { form: "partner"; payload: PartnerFormPayload }
  | { form: "newsletter"; payload: NewsletterPayload };

export type EnquiryResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "invalid"; field: string | null }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "error" };

/**
 * Sends a website form to the CRM through public.submit_website_enquiry. Visitors never read CRM data: the only
 * thing that comes back is a reference to show them. Leave out empty fields rather than sending "".
 */
export async function submitWebsiteEnquiry(input: EnquiryForm, client?: SupabaseClient): Promise<EnquiryResult> {
  const supabase = client ?? createPublicClient();
  const payload = Object.fromEntries(Object.entries(input.payload).filter(([, v]) => v !== undefined && v !== ""));
  const { data, error } = await supabase.rpc("submit_website_enquiry", { form: input.form, payload });
  if (!error && typeof data === "string") return { ok: true, reference: data };
  if (error?.code === "PT429") return { ok: false, reason: "rate_limited" };
  if (error?.code === "22023") {
    const field = /^(?:invalid field|field too long): (\w+)/.exec(error.message)?.[1] ?? null;
    return { ok: false, reason: "invalid", field };
  }
  return { ok: false, reason: "error" };
}
