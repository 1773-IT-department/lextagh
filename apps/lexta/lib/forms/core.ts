// Website forms into the Lexta Business System (scoreboard item 19).
//
// Plain server code with no Next.js imports, so the local harness test (supabase/tests/local/forms) runs the very
// same functions. The server actions in app/actions/forms.ts are thin wrappers around handleContact, handlePartner
// and handleNewsletter.
//
// Every submission goes through the database's own intake functions with the publishable key only:
//   Contact Us (all reasons but Consumer care)  public.submit_website_enquiry('contact', ...)   CRM lead + contact
//   Contact Us, Consumer care                   public.submit_complaint(...)                    complaints tracker (LX case)
//   Partner With Us                             public.submit_website_enquiry('partner', ...)   CRM lead + contact + organisation
//   Newsletter (Home and News)                  public.submit_website_enquiry('newsletter', ...) CRM contact with consent
import {
  submitComplaint,
  submitWebsiteEnquiry,
  type ComplaintFormPayload,
  type ComplaintResult,
  type ContactFormPayload,
  type EnquiryResult,
  type PartnerFormPayload,
} from "@lexta/db";

export type FormState = {
  status: "idle" | "success" | "error";
  /** Text for the visitor: the thank you (with reference) or what went wrong. */
  message?: string;
  /** Reference or LX case number the database gave back. */
  reference?: string;
  /** Inline message per form field name. */
  fieldErrors?: Record<string, string>;
  /** What the visitor typed, sent back on error so the form keeps it. Empty on success so the form clears. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** Name of the hidden spam trap field on every form. People never see or fill it. */
export const HONEYPOT_FIELD = "website";
const BRAND = "lexta";

export const MSG_UNAVAILABLE = "This form is not available right now, please email sales@lextagh.com";
export const MSG_RATE_LIMITED = "Too many messages, please try again in an hour.";
export const MSG_GENERIC = "Sorry, your message could not be sent. Please try again in a few minutes, or email sales@lextagh.com.";
export const MSG_CHECK_FIELDS = "Please check the highlighted fields.";

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

/** Field limits, the same as the database intake functions. */
export const LIMITS = { name: 120, email: 254, phone: 24, message: 3000, organisation: 160, detail: 300, location: 120, years: 20 };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/;

type Fields = Record<string, string>;

function read(fd: FormData, names: string[]): Fields {
  const out: Fields = {};
  for (const n of names) {
    const v = fd.get(n);
    out[n] = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
  }
  return out;
}

/** Supabase settings present? Without them the forms explain how to reach Lexta instead of failing. */
export function formsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const tooLong = (label: string, max: number) => `${label} can be at most ${max} characters.`;

function checkName(v: Fields, field: string, errors: Fields, label = "your name") {
  if (!v[field]) errors[field] = `Please enter ${label}.`;
  else if (v[field].length > LIMITS.name) errors[field] = tooLong("Your name", LIMITS.name);
}

function checkEmailPhone(v: Fields, errors: Fields) {
  if (v.email.length > LIMITS.email || (v.email && !EMAIL_RE.test(v.email))) errors.email = "Please enter a valid email address.";
  if (v.phone && (v.phone.length > LIMITS.phone || !PHONE_RE.test(v.phone))) {
    errors.phone = "Please enter a valid phone number, for example +233 24 123 4567.";
  }
  if (!v.email && !v.phone) errors.email = "Please give an email address or a phone number so we can reply.";
}

function checkMax(v: Fields, field: string, max: number, label: string, errors: Fields) {
  if (v[field].length > max) errors[field] = tooLong(label, max);
}

function invalid(values: Fields, fieldErrors: Fields): FormState {
  return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors, values: withoutTrap(values) };
}

function withoutTrap(values: Fields): Fields {
  const { [HONEYPOT_FIELD]: _trap, ...rest } = values;
  return rest;
}

/** Turns what the database said into what the visitor sees. Never shows database details. */
function fromResult(
  result: EnquiryResult | ComplaintResult,
  values: Fields,
  fieldMap: Record<string, string>,
  messages: Fields,
  success: (ref: string) => string,
): FormState {
  if (result.ok) {
    const ref = "reference" in result ? result.reference : result.caseNumber;
    return { status: "success", reference: ref, message: success(ref), values: {} };
  }
  const kept = withoutTrap(values);
  if (result.reason === "rate_limited") return { status: "error", message: MSG_RATE_LIMITED, values: kept };
  if (result.reason === "invalid" && result.field && fieldMap[result.field]) {
    const field = fieldMap[result.field];
    return { status: "error", message: MSG_CHECK_FIELDS, fieldErrors: { [field]: messages[field] ?? "Please check this field." }, values: kept };
  }
  return { status: "error", message: MSG_GENERIC, values: kept };
}

async function safely<T>(run: () => Promise<T>): Promise<T | { ok: false; reason: "error" }> {
  try {
    return await run();
  } catch {
    // Network or configuration trouble: the visitor gets the generic message, never the details.
    return { ok: false, reason: "error" };
  }
}

const unavailable = (values: Fields): FormState => ({ status: "error", message: MSG_UNAVAILABLE, values: withoutTrap(values) });

// Contact Us ---------------------------------------------------------------------------------

const CONTACT_FIELDS = ["reason", "name", "email", "phone", "detail", "region", "message", HONEYPOT_FIELD];
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

  const common = { honeypot: v[HONEYPOT_FIELD] || undefined, brand: BRAND, name: v.name, email: v.email || undefined, phone: v.phone || undefined };

  if (reason === "consumer_care") {
    // submit_complaint has no region or free text product field: both go at the top of the complaint text, so the
    // care team sees everything the visitor typed. Category "other" until the team triages it.
    const lines = [
      v.detail && `Product and batch code: ${v.detail}`,
      v.region && `Region: ${v.region}`,
    ].filter(Boolean);
    const message = lines.length ? `${lines.join("\n")}\n\n${v.message}` : v.message;
    if (!errors.message && message.length > LIMITS.message) errors.message = "Your message is too long, please shorten it.";
    if (Object.keys(errors).length) return { values: v, errors };
    return { values: v, errors, route: { kind: "complaint", payload: { ...common, category: "other", message } } };
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
  const { values, errors, route } = buildContact(fd);
  if (!route) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values);

  if (route.kind === "complaint") {
    const result = await safely(() => submitComplaint(route.payload));
    return fromResult(result, values, { name: "name", email: "email", phone: "phone", message: "message" }, CONTACT_MESSAGES,
      (ref) => `Thank you. Your case number is ${ref}; our consumer care team will contact you.`);
  }
  const result = await safely(() => submitWebsiteEnquiry({ form: "contact", payload: route.payload }));
  return fromResult(result, values,
    { name: "name", email: "email", phone: "phone", message: "message", organisation_name: "detail", detail: "detail", region: "region" },
    CONTACT_MESSAGES,
    (ref) => `Thank you. Your message has reached our team and your reference is ${ref}.`);
}

// Partner With Us ------------------------------------------------------------------------------

const PARTNER_FIELDS = ["route", "contact_name", "business_name", "email", "phone", "trading_location", "years_trading", "message", HONEYPOT_FIELD];

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
      honeypot: v[HONEYPOT_FIELD] || undefined,
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

export async function handlePartner(fd: FormData): Promise<FormState> {
  const { values, errors, payload } = buildPartner(fd);
  if (!payload) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values);
  const result = await safely(() => submitWebsiteEnquiry({ form: "partner", payload }));
  return fromResult(result, values,
    { name: "contact_name", organisation_name: "business_name", email: "email", phone: "phone", location: "trading_location", years_trading: "years_trading", message: "message" },
    PARTNER_MESSAGES,
    (ref) => `Thank you. Your application has reached our trade desk and your reference is ${ref}.`);
}

// Newsletter ---------------------------------------------------------------------------------

const NEWSLETTER_FIELDS = ["email", "consent", HONEYPOT_FIELD];
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
    payload: { honeypot: v[HONEYPOT_FIELD] || undefined, brand: BRAND, email: v.email, consent_marketing: true as const },
  };
}

export async function handleNewsletter(fd: FormData): Promise<FormState> {
  const { values, errors, payload } = buildNewsletter(fd);
  if (!payload) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values);
  const result = await safely(() => submitWebsiteEnquiry({ form: "newsletter", payload }));
  return fromResult(result, values, { email: "email", consent_marketing: "consent" }, NEWSLETTER_MESSAGES,
    (ref) => `Thank you, you are subscribed. Your reference is ${ref}.`);
}
