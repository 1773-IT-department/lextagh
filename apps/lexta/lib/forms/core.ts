// Website forms into the Lexta Business System (scoreboard item 19).
//
// Plain server code with no Next.js imports, so the local harness test (supabase/tests/local/forms) runs the very
// same functions (the parts every site shares are in packages/forms). The server actions in app/actions/forms.ts are
// thin wrappers around handleContact, handlePartner and handleNewsletter.
//
// The hidden honeypot field is checked here: a filled one gets a thank you with a reference shaped like a real one,
// and nothing goes to the database. Every other submission goes through the database's own intake functions with
// the publishable key only:
//   Contact Us (all reasons but Consumer care)  public.submit_website_enquiry('contact', ...)   CRM lead + contact
//   Contact Us, Consumer care                   public.submit_complaint(...)                    complaints tracker (LX case)
//   Partner With Us                             public.submit_website_enquiry('partner', ...)   CRM lead + contact + organisation
//   Newsletter (Home and News)                  public.submit_website_enquiry('newsletter', ...) CRM contact with consent
import {
  submitComplaint,
  submitWebsiteEnquiry,
  type ComplaintFormPayload,
  type ContactFormPayload,
  type PartnerFormPayload,
} from "@lexta/db";
import {
  batchCodeFrom,
  checkEmailPhone,
  checkMax,
  checkName,
  EMAIL_RE,
  fakeReference,
  formsConfigured,
  fromResult,
  invalid,
  LIMITS,
  MSG_TOO_LONG,
  payloadTooLarge,
  read,
  safely,
  tooLarge,
  trapped,
  unavailable,
  type Fields,
} from "@lexta/forms/core";
import { reasons as contactReasons } from "../../components/contact/data";

// The parts every site shares live in packages/forms; these stay exported from here as before.
export {
  batchCodeFrom,
  fakeReference,
  formsConfigured,
  HONEYPOT_FIELD,
  initialFormState,
  LIMITS,
  MSG_CHECK_FIELDS,
  MSG_RATE_LIMITED,
  MSG_TOO_LONG,
  msgGeneric,
  msgUnavailable,
  PAYLOAD_MAX_BYTES,
  payloadTooLarge,
  type FormState,
} from "@lexta/forms/core";
import type { FormState } from "@lexta/forms/core";

const BRAND = "lexta";

/** Where visitors can write instead: sales for trade (distribution, bulk orders, partners), support for the rest. */
export const SALES_EMAIL = "marketing@lextagh.com";
export const SUPPORT_EMAIL = "marketing@lextagh.com";

/** Labels the Contact Us form shows, to the reason slugs the database accepts. */
export const CONTACT_REASONS: Record<string, NonNullable<ContactFormPayload["reason"]>> = {
  "General enquiry": "general",
  Distribution: "distribution",
  "Bulk orders": "bulk_orders",
  "Consumer care": "consumer_care",
  Media: "media",
  Careers: "careers",
};

/** Region labels on the Contact Us form, to region slugs in public.regions (0005_stockists.sql). */
export const REGION_SLUGS: Record<string, string> = {
  "Greater Accra": "greater-accra",
  Ashanti: "ashanti",
  Western: "western",
  Eastern: "eastern",
  Central: "central",
  Volta: "volta",
  Northern: "northern",
  "Outside Ghana": "outside-ghana",
};

/** Partner With Us routes, to the partner_type values the database accepts. */
export const PARTNER_TYPES: Record<string, NonNullable<PartnerFormPayload["partner_type"]>> = {
  Distributor: "distributor",
  Retail: "retail",
  Institutional: "institutional",
  "Private label": "private_label",
  CSR: "csr",
  Suppliers: "supplier",
};

/** Contact Us reason label to the address shown when the form cannot send (the page's own routing emails). */
export function contactFallbackEmail(reasonLabel: string): string {
  return contactReasons.find((r) => r.key === reasonLabel)?.email ?? SUPPORT_EMAIL;
}

// Contact Us ---------------------------------------------------------------------------------

const CONTACT_FIELDS = ["reason", "name", "email", "phone", "detail", "region", "message"];
/** Reasons whose extra field is a company, business or outlet name: it goes to the CRM as the organisation. */
const ORG_DETAIL_REASONS = new Set(["general", "distribution", "media"]);

const CONTACT_MESSAGES: Fields = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number, for example +233 24 123 4567.",
  detail: "Please check this field.",
  region: "Please choose a region from the list.",
  message: "Please write your message.",
};

export type ContactRoute =
  | { kind: "enquiry"; payload: ContactFormPayload }
  | { kind: "complaint"; payload: ComplaintFormPayload };

/** Validates the Contact Us form and builds what goes to the database. Exported for the harness test. */
export function buildContact(fd: FormData): { values: Fields; errors: Fields; route?: ContactRoute } {
  const v = read(fd, CONTACT_FIELDS);
  const errors: Fields = {};
  const reason = CONTACT_REASONS[v.reason] ?? "general";
  const region = v.region ? REGION_SLUGS[v.region] : undefined;
  const detailIsOrg = ORG_DETAIL_REASONS.has(reason);

  checkName(v, "name", errors);
  checkEmailPhone(v, errors);
  if (v.region && !region) errors.region = CONTACT_MESSAGES.region;
  checkMax(v, "detail", detailIsOrg ? LIMITS.organisation : LIMITS.detail, "This field", errors);
  if (!v.message) errors.message = CONTACT_MESSAGES.message;
  else checkMax(v, "message", LIMITS.message, "Your message", errors);

  const common = { brand: BRAND, name: v.name, email: v.email || undefined, phone: v.phone || undefined };

  if (reason === "consumer_care") {
    // submit_complaint has a batch_number field but no region or free text product field (its product field only
    // takes a published product slug of the brand). So the batch code goes to batch_number, and the product and
    // batch line and the region go at the top of the complaint text, so the care team sees everything typed.
    // Category "other" until the team triages it.
    const lines = [
      v.detail && `Product and batch code: ${v.detail}`,
      v.region && `Region: ${v.region}`,
    ].filter(Boolean);
    const message = lines.length ? `${lines.join("\n")}\n\n${v.message}` : v.message;
    if (!errors.message && message.length > LIMITS.message) errors.message = MSG_TOO_LONG;
    if (Object.keys(errors).length) return { values: v, errors };
    const batch = v.detail ? batchCodeFrom(v.detail) : undefined;
    return { values: v, errors, route: { kind: "complaint", payload: { ...common, category: "other", message, batch_number: batch } } };
  }

  if (Object.keys(errors).length) return { values: v, errors };
  const payload: ContactFormPayload = {
    ...common,
    reason,
    message: v.message,
    region,
    organisation_name: detailIsOrg ? v.detail || undefined : undefined,
    detail: detailIsOrg ? undefined : v.detail || undefined,
  };
  return { values: v, errors, route: { kind: "enquiry", payload } };
}

export async function handleContact(fd: FormData): Promise<FormState> {
  const reasonLabel = String(fd.get("reason") ?? "");
  if (trapped(fd)) {
    const ref = fakeReference(CONTACT_REASONS[reasonLabel] === "consumer_care" ? "complaint" : "contact");
    return { status: "success", reference: ref, message: CONTACT_REASONS[reasonLabel] === "consumer_care" ? complaintThanks(ref) : contactThanks(ref), values: {} };
  }
  const { values, errors, route } = buildContact(fd);
  if (!route) return invalid(values, errors);
  const email = contactFallbackEmail(reasonLabel);
  if (!formsConfigured()) return unavailable(values, email);
  if (payloadTooLarge(route.payload)) return tooLarge(values);

  if (route.kind === "complaint") {
    const result = await safely(() => submitComplaint(route.payload));
    return fromResult(result, values, { name: "name", email: "email", phone: "phone", message: "message", batch_number: "detail" }, CONTACT_MESSAGES,
      complaintThanks, email);
  }
  const result = await safely(() => submitWebsiteEnquiry({ form: "contact", payload: route.payload }));
  return fromResult(result, values,
    { name: "name", email: "email", phone: "phone", message: "message", organisation_name: "detail", detail: "detail", region: "region" },
    CONTACT_MESSAGES, contactThanks, email);
}

const contactThanks = (ref: string) => `Thank you. Your message has reached our team and your reference is ${ref}.`;
const complaintThanks = (ref: string) => `Thank you. Your case number is ${ref}; our consumer care team will contact you.`;

// Partner With Us ------------------------------------------------------------------------------

const PARTNER_FIELDS = ["route", "contact_name", "business_name", "email", "phone", "trading_location", "years_trading", "message"];

const PARTNER_MESSAGES: Fields = {
  contact_name: "Please enter your name.",
  business_name: "Please enter your business name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number, for example +233 24 123 4567.",
  trading_location: "Please check your trading location.",
  years_trading: "Please check the years trading.",
  message: "Please check your message.",
};

export function buildPartner(fd: FormData): { values: Fields; errors: Fields; payload?: PartnerFormPayload } {
  const v = read(fd, PARTNER_FIELDS);
  const errors: Fields = {};
  checkName(v, "contact_name", errors);
  if (!v.business_name) errors.business_name = PARTNER_MESSAGES.business_name;
  else checkMax(v, "business_name", LIMITS.organisation, "Business name", errors);
  checkEmailPhone(v, errors);
  checkMax(v, "trading_location", LIMITS.location, "Trading location", errors);
  checkMax(v, "years_trading", LIMITS.years, "Years trading", errors);
  checkMax(v, "message", LIMITS.message, "Your message", errors);
  if (Object.keys(errors).length) return { values: v, errors };
  return {
    values: v,
    errors,
    payload: {
      brand: BRAND,
      name: v.contact_name,
      organisation_name: v.business_name,
      email: v.email || undefined,
      phone: v.phone || undefined,
      partner_type: PARTNER_TYPES[v.route] ?? "distributor",
      location: v.trading_location || undefined,
      years_trading: v.years_trading || undefined,
      message: v.message || undefined,
    },
  };
}

const partnerThanks = (ref: string) => `Thank you. Your application has reached our trade desk and your reference is ${ref}.`;

export async function handlePartner(fd: FormData): Promise<FormState> {
  if (trapped(fd)) {
    const ref = fakeReference("partner");
    return { status: "success", reference: ref, message: partnerThanks(ref), values: {} };
  }
  const { values, errors, payload } = buildPartner(fd);
  if (!payload) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values, SALES_EMAIL);
  if (payloadTooLarge(payload)) return tooLarge(values);
  const result = await safely(() => submitWebsiteEnquiry({ form: "partner", payload }));
  return fromResult(result, values,
    { name: "contact_name", organisation_name: "business_name", email: "email", phone: "phone", location: "trading_location", years_trading: "years_trading", message: "message" },
    PARTNER_MESSAGES, partnerThanks, SALES_EMAIL);
}

// Newsletter ---------------------------------------------------------------------------------

const NEWSLETTER_FIELDS = ["email", "consent"];
const NEWSLETTER_MESSAGES: Fields = {
  email: "Please enter a valid email address.",
  consent: "Please tick the box to agree to receive our emails.",
};

export function buildNewsletter(fd: FormData) {
  const v = read(fd, NEWSLETTER_FIELDS);
  const errors: Fields = {};
  if (!v.email || v.email.length > LIMITS.email || !EMAIL_RE.test(v.email)) errors.email = NEWSLETTER_MESSAGES.email;
  // Consent only counts when the visitor ticked the box themselves.
  if (v.consent !== "yes") errors.consent = NEWSLETTER_MESSAGES.consent;
  if (Object.keys(errors).length) return { values: v, errors };
  return {
    values: v,
    errors,
    payload: { brand: BRAND, email: v.email, consent_marketing: true as const },
  };
}

const newsletterThanks = (ref: string) => `Thank you, you are subscribed. Your reference is ${ref}.`;

export async function handleNewsletter(fd: FormData): Promise<FormState> {
  if (trapped(fd)) {
    const ref = fakeReference("newsletter");
    return { status: "success", reference: ref, message: newsletterThanks(ref), values: {} };
  }
  const { values, errors, payload } = buildNewsletter(fd);
  if (!payload) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values, SUPPORT_EMAIL);
  const result = await safely(() => submitWebsiteEnquiry({ form: "newsletter", payload }));
  return fromResult(result, values, { email: "email", consent_marketing: "consent" }, NEWSLETTER_MESSAGES, newsletterThanks, SUPPORT_EMAIL);
}
