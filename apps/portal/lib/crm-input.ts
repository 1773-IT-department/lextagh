import { CRM_ACTIVITY_TYPES, CRM_CHANNELS, CRM_ORG_KINDS, CRM_SOURCES, CRM_STAGES } from "@lexta/db";

/**
 * Checking CRM form data in the portal, with the same limits as supabase/migrations/0006_crm.sql,
 * so people get a clear message instead of a database error.
 */

/** Sent instead of an id to keep a link the editor cannot see or pick. */
export const KEEP = "keep";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PHONE = /^\+?[0-9][0-9 ()-]{5,22}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Estimated volume is a quantity, never a price.
const MONEY = /(gh[s¢₵]|₵|\bcedis?\b|\$|€|£|\bprice\b|\bpesewas?\b)/i;

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

export type LeadDetails = {
  title: string;
  description: string | null;
  contact_id: string | null;
  organisation_id: string | null;
  brand_id: string | null;
  source: string;
  next_action: string | null;
  next_action_date: string | null;
  estimated_monthly_volume: string | null;
  stage?: string;
  lost_reason?: string | null;
  owner_id?: string | null;
};

export function checkLead(raw: Raw, opts: { isNew: boolean; brandIds: Set<string> }): Checked<LeadDetails> {
  const errors: Record<string, string> = {};
  const title = squash(raw.title);
  if (!title) errors.title = "Give the lead a short title.";
  maxLen(errors, "title", title, 160, "The title");
  const description = longText(raw.description);
  maxLen(errors, "description", description, 5000, "The description");
  const contact = raw.contact_id || "";
  const org = raw.organisation_id || "";
  // "keep" leaves an existing link as it is (the linked record is not in this person's list).
  if (contact && contact !== KEEP && !UUID.test(contact)) errors.contact_id = "Choose a contact from the list.";
  if (org && org !== KEEP && !UUID.test(org)) errors.organisation_id = "Choose an organisation from the list.";
  if (opts.isNew && (contact === KEEP || org === KEEP)) errors.contact_id = "Choose a contact from the list.";
  if (!contact && !org) errors.contact_id = "Choose a contact, an organisation, or both.";
  const brand = raw.brand_id || "";
  if (brand && !opts.brandIds.has(brand)) errors.brand_id = "Choose one of your brands, or no brand.";
  if (!CRM_SOURCES.some((s) => s.value === raw.source)) errors.source = "Choose where the lead came from.";
  const nextAction = opt(raw.next_action);
  maxLen(errors, "next_action", nextAction, 300, "The next action");
  const nextDate = raw.next_action_date || "";
  if (nextDate && !validDate(nextDate)) errors.next_action_date = "Pick a date.";
  const volume = opt(raw.estimated_monthly_volume);
  maxLen(errors, "estimated_monthly_volume", volume, 200, "The estimated volume");
  if (volume && MONEY.test(volume)) errors.estimated_monthly_volume = "Write a quantity (for example 200 cartons a month), not a price.";

  const details: LeadDetails = {
    title,
    description,
    contact_id: contact || null,
    organisation_id: org || null,
    brand_id: brand || null,
    source: raw.source,
    next_action: nextAction,
    next_action_date: nextDate || null,
    estimated_monthly_volume: volume,
  };
  if (opts.isNew) {
    const stage = raw.stage || "new";
    if (!CRM_STAGES.some((s) => s.value === stage)) errors.stage = "Choose a stage.";
    const lostReason = opt(raw.lost_reason);
    if (stage === "lost" && !lostReason) errors.lost_reason = "Say why the lead was lost.";
    maxLen(errors, "lost_reason", lostReason, 500, "The reason");
    details.stage = stage;
    details.lost_reason = stage === "lost" ? lostReason : null;
  }
  return Object.keys(errors).length ? { details: null, errors } : { details, errors };
}

export type ContactDetails = {
  full_name: string | null;
  organisation_id: string | null;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  preferred_channel: string | null;
  consent_marketing: boolean;
  consent_source: string | null;
  notes: string | null;
};

export function checkContact(raw: Raw): Checked<ContactDetails> {
  const errors: Record<string, string> = {};
  const fullName = opt(raw.full_name);
  maxLen(errors, "full_name", fullName, 120, "The name");
  const email = opt(raw.email)?.toLowerCase() ?? null;
  if (email && (!EMAIL.test(email) || email.length > 254)) errors.email = "Enter an email address like name@example.com.";
  const phone = opt(raw.phone);
  if (phone && !PHONE.test(phone)) errors.phone = "Enter a phone number with digits only, for example +233 20 123 4567.";
  if (!fullName && !email && !phone) errors.full_name = "Enter at least a name, a phone number or an email address.";
  const org = raw.organisation_id || "";
  if (org && org !== KEEP && !UUID.test(org)) errors.organisation_id = "Choose an organisation from the list.";
  const jobTitle = opt(raw.job_title);
  maxLen(errors, "job_title", jobTitle, 120, "The job title");
  const channel = raw.preferred_channel || "";
  if (channel && !CRM_CHANNELS.some((c) => c.value === channel)) errors.preferred_channel = "Choose a channel.";
  const consent = raw.consent_marketing === "on" || raw.consent_marketing === "true";
  const consentSource = opt(raw.consent_source);
  if (consent && !consentSource) errors.consent_source = "Say how they agreed, for example on a call on 3 November.";
  maxLen(errors, "consent_source", consentSource, 160, "This");
  const notes = longText(raw.notes);
  maxLen(errors, "notes", notes, 4000, "Notes");
  const details: ContactDetails = {
    full_name: fullName,
    organisation_id: org || null,
    job_title: jobTitle,
    phone,
    email,
    preferred_channel: channel || null,
    consent_marketing: consent,
    consent_source: consent ? consentSource : null,
    notes,
  };
  return Object.keys(errors).length ? { details: null, errors } : { details, errors };
}

export type OrganisationDetails = {
  name: string;
  kind: string;
  region_id: string | null;
  town: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  stockist_id: string | null;
  notes: string | null;
};

export function checkOrganisation(raw: Raw, regionIds: Set<string>): Checked<OrganisationDetails> {
  const errors: Record<string, string> = {};
  const name = squash(raw.name);
  if (!name) errors.name = "Enter the organisation's name.";
  maxLen(errors, "name", name, 160, "The name");
  const kind = raw.kind || "other";
  if (!CRM_ORG_KINDS.some((k) => k.value === kind)) errors.kind = "Choose a kind.";
  const region = raw.region_id || "";
  if (region && !regionIds.has(region)) errors.region_id = "Choose a region from the list.";
  const town = opt(raw.town);
  maxLen(errors, "town", town, 120, "The town");
  const address = opt(raw.address);
  maxLen(errors, "address", address, 300, "The address");
  const phone = opt(raw.phone);
  if (phone && !PHONE.test(phone)) errors.phone = "Enter a phone number with digits only, for example +233 30 123 4567.";
  const email = opt(raw.email)?.toLowerCase() ?? null;
  if (email && (!EMAIL.test(email) || email.length > 254)) errors.email = "Enter an email address like info@example.com.";
  let website = opt(raw.website);
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website && (!/^https?:\/\/[^\s]+$/i.test(website) || website.length > 300)) errors.website = "Enter a web address like https://example.com.";
  const stockist = raw.stockist_id || "";
  if (stockist && !UUID.test(stockist)) errors.stockist_id = "Choose a stockist from the list.";
  const notes = longText(raw.notes);
  maxLen(errors, "notes", notes, 4000, "Notes");
  const details: OrganisationDetails = {
    name, kind, region_id: region || null, town, address, phone, email, website, stockist_id: stockist || null, notes,
  };
  return Object.keys(errors).length ? { details: null, errors } : { details, errors };
}

export type ActivityDetails = { type: string; body: string; occurred_at: string | null };

/** occurredAt comes from a datetime-local field, read as Ghana time (UTC). */
export function checkActivity(raw: Raw): Checked<ActivityDetails> {
  const errors: Record<string, string> = {};
  const type = raw.type || "note";
  if (!CRM_ACTIVITY_TYPES.some((t) => t.value === type) || type === "status_change") errors.type = "Choose what kind of activity this was.";
  const body = longText(raw.body);
  if (!body) errors.body = "Write what happened.";
  maxLen(errors, "body", body, 4000, "This");
  let occurredAt: string | null = null;
  if (raw.occurred_at) {
    const d = new Date(`${raw.occurred_at}:00Z`);
    if (Number.isNaN(d.getTime())) errors.occurred_at = "Pick a date and time.";
    else if (d.getTime() > Date.now() + 24 * 3600 * 1000) errors.occurred_at = "This is in the future. Use the next action for plans.";
    else occurredAt = d.toISOString();
  }
  return Object.keys(errors).length ? { details: null, errors } : { details: { type, body: body ?? "", occurred_at: occurredAt }, errors };
}
