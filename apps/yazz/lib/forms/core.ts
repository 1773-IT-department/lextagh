// Yazz website forms into the Lexta Business System: the same intake functions and the same shared helpers
// (packages/forms) as the Lexta site's forms (apps/lexta/lib/forms/core.ts), with brand "yazz".
//
// Plain server code with no Next.js imports, so the local harness test (supabase/tests/local/yazz) runs the very same
// functions. The server actions in app/actions/forms.ts are thin wrappers around these.
//
// A filled honeypot gets a thank you with a reference shaped like a real one, and nothing goes to the database.
// Everything else goes through the database's own intake functions with the publishable key only:
//   Consumer form, "Report a problem with a product"   public.submit_complaint(...)                     complaints tracker (case number)
//   Consumer form, every other topic                   public.submit_website_enquiry('contact', ...)    CRM lead (website_contact_form)
//   Trade and distributor enquiry                      public.submit_website_enquiry('partner', ...)    CRM lead + organisation (website_partner_form)
//   Newsletter                                         public.submit_website_enquiry('newsletter', ...) CRM contact with consent
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
  type FormState,
} from "@lexta/forms/core";
import { contact } from "../site";
import { isTopic, topicLabel, TRADE_ROUTES, VOLUMES, type Topic } from "./options";

export { isTopic, TOPICS, TRADE_ROUTES, VOLUMES, type Topic } from "./options";

export { initialFormState, type FormState } from "@lexta/forms/core";

export const BRAND = "yazz";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** "greater-accra" to "Greater Accra" for the complaint text. */
const regionName = (slug: string) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// Consumer form ------------------------------------------------------------------------------------------------

const CONSUMER_FIELDS = ["topic", "name", "email", "phone", "region", "product", "batch", "purchase_place", "purchase_date", "message"];

const CONSUMER_MESSAGES: Fields = {
  name: "Please enter your name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number, for example +233 24 123 4567.",
  region: "Please choose a region from the list.",
  product: "Please choose the product from the list.",
  batch: "Please check the batch code.",
  purchase_place: "Please check where you bought it.",
  purchase_date: "Please give the date you bought it (not in the future).",
  message: "Please write your message.",
};

export type ConsumerRoute =
  | { kind: "enquiry"; payload: ContactFormPayload }
  | { kind: "complaint"; payload: ComplaintFormPayload; productName?: string };

/**
 * Validates the consumer form and builds what goes to the database. productNames: slug to name of the products the
 * form offered (to word the message when the product is not sent as a link). Exported for the harness test.
 */
export function buildConsumer(fd: FormData, productNames: Record<string, string> = {}): { values: Fields; errors: Fields; route?: ConsumerRoute } {
  const v = read(fd, CONSUMER_FIELDS);
  const errors: Fields = {};
  const topic: Topic = isTopic(v.topic) ? v.topic : "question";
  v.topic = topic;

  checkName(v, "name", errors);
  checkEmailPhone(v, errors);
  if (v.region && (!SLUG.test(v.region) || v.region.length > 60)) errors.region = CONSUMER_MESSAGES.region;
  if (v.product && (!SLUG.test(v.product) || v.product.length > 120)) errors.product = CONSUMER_MESSAGES.product;
  if (!v.message) errors.message = CONSUMER_MESSAGES.message;
  else checkMax(v, "message", LIMITS.message, "Your message", errors);

  const common = { brand: BRAND, name: v.name, email: v.email || undefined, phone: v.phone || undefined };
  const productName = v.product ? productNames[v.product] ?? v.product : "";

  if (topic === "problem") {
    checkMax(v, "batch", LIMITS.batch, "The batch code", errors);
    checkMax(v, "purchase_place", LIMITS.place, "Where you bought it", errors);
    if (v.purchase_date && (!DATE.test(v.purchase_date) || v.purchase_date > new Date().toISOString().slice(0, 10))) {
      errors.purchase_date = CONSUMER_MESSAGES.purchase_date;
    }
    // submit_complaint has no region field: the region goes at the top of the complaint text with the product, so
    // the care team sees everything typed. Category "other" until the team triages it, as on the Lexta site.
    const lines = [productName && `Product: ${productName}`, v.region && `Region: ${regionName(v.region)}`].filter(Boolean);
    const message = lines.length ? `${lines.join("\n")}\n\n${v.message}` : v.message;
    if (!errors.message && message.length > LIMITS.message) errors.message = MSG_TOO_LONG;
    if (Object.keys(errors).length) return { values: v, errors };
    return {
      values: v,
      errors,
      route: {
        kind: "complaint",
        productName,
        payload: {
          ...common,
          category: "other",
          message,
          product: v.product || undefined,
          batch_number: v.batch ? batchCodeFrom(v.batch) ?? v.batch : undefined,
          purchase_place: v.purchase_place || undefined,
          purchase_date: v.purchase_date || undefined,
        },
      },
    };
  }

  const detail = [`Topic: ${topicLabel(topic)}`, productName && `Product: ${productName}`].filter(Boolean).join("; ");
  if (detail.length > LIMITS.detail) errors.product = CONSUMER_MESSAGES.product;
  if (Object.keys(errors).length) return { values: v, errors };
  return {
    values: v,
    errors,
    route: { kind: "enquiry", payload: { ...common, reason: "general", message: v.message, region: v.region || undefined, detail } },
  };
}

const consumerThanks = (ref: string) => `Thank you. Your message has reached the Yazz team and your reference is ${ref}.`;
const complaintThanks = (ref: string) => `Thank you. Your case number is ${ref}; our consumer care team will contact you.`;

export async function handleConsumer(fd: FormData, productNames: Record<string, string> = {}): Promise<FormState> {
  if (trapped(fd)) {
    const problem = fd.get("topic") === "problem";
    const ref = fakeReference(problem ? "complaint" : "contact");
    return { status: "success", reference: ref, message: problem ? complaintThanks(ref) : consumerThanks(ref), values: {} };
  }
  const { values, errors, route } = buildConsumer(fd, productNames);
  if (!route) return invalid(values, errors);
  const email = contact.supportEmail;
  if (!formsConfigured()) return unavailable(values, email);
  if (payloadTooLarge(route.payload)) return tooLarge(values);

  if (route.kind === "complaint") {
    let result = await safely(() => submitComplaint(route.payload));
    // A product the database does not know as a published Yazz product (for example one shown while the database was
    // unreachable) must not lose the complaint: send it again with the product named in the text instead.
    if (!result.ok && result.reason === "invalid" && result.field === "product" && route.payload.product) {
      const { product: _product, ...rest } = route.payload;
      const message = route.productName && !rest.message.startsWith("Product:") ? `Product: ${route.productName}\n${rest.message}` : rest.message;
      result = await safely(() => submitComplaint({ ...rest, message: message.slice(0, LIMITS.message) }));
    }
    return fromResult(result, values,
      { name: "name", email: "email", phone: "phone", message: "message", batch_number: "batch", purchase_place: "purchase_place", purchase_date: "purchase_date", product: "product" },
      CONSUMER_MESSAGES, complaintThanks, email);
  }
  const result = await safely(() => submitWebsiteEnquiry({ form: "contact", payload: route.payload }));
  return fromResult(result, values,
    { name: "name", email: "email", phone: "phone", message: "message", region: "region", detail: "product" },
    CONSUMER_MESSAGES, consumerThanks, email);
}

// Trade and distributor enquiry ----------------------------------------------------------------------------------

const TRADE_FIELDS = ["route", "contact_name", "business_name", "email", "phone", "region", "trading_location", "years_trading", "volume", "message"];

const TRADE_MESSAGES: Fields = {
  contact_name: "Please enter your name.",
  business_name: "Please enter your business name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number, for example +233 24 123 4567.",
  region: "Please choose a region from the list.",
  trading_location: "Please check your town or trading location.",
  years_trading: "Please check the years trading.",
  volume: "Please choose an expected volume from the list.",
  message: "Please check your message.",
};

export function buildTrade(fd: FormData, rangeNames: Record<string, string> = {}): { values: Fields; errors: Fields; payload?: PartnerFormPayload } {
  const v = read(fd, TRADE_FIELDS);
  const ranges = fd.getAll("ranges").map(String).filter((r) => rangeNames[r]);
  v.ranges = ranges.join(",");
  const errors: Fields = {};
  const route = TRADE_ROUTES.find((r) => r.value === v.route) ?? TRADE_ROUTES[0];
  v.route = route.value;
  checkName(v, "contact_name", errors);
  if (!v.business_name) errors.business_name = TRADE_MESSAGES.business_name;
  else checkMax(v, "business_name", LIMITS.organisation, "Business name", errors);
  checkEmailPhone(v, errors);
  if (v.region && (!SLUG.test(v.region) || v.region.length > 60)) errors.region = TRADE_MESSAGES.region;
  checkMax(v, "trading_location", LIMITS.location, "Town or trading location", errors);
  checkMax(v, "years_trading", LIMITS.years, "Years trading", errors);
  if (v.volume && !VOLUMES.includes(v.volume)) errors.volume = TRADE_MESSAGES.volume;
  const interest = ranges.length ? `Yazz ranges of interest: ${ranges.map((r) => rangeNames[r]).join(", ")}` : "";
  const message = [interest, v.message].filter(Boolean).join("\n\n");
  if (message.length > LIMITS.message) errors.message = MSG_TOO_LONG;
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
      partner_type: route.partner,
      region: v.region || undefined,
      location: v.trading_location || undefined,
      years_trading: v.years_trading || undefined,
      estimated_monthly_volume: v.volume || undefined,
      message: message || undefined,
    },
  };
}

const tradeThanks = (ref: string) => `Thank you. Your enquiry has reached the Yazz trade team and your reference is ${ref}.`;

export async function handleTrade(fd: FormData, rangeNames: Record<string, string> = {}): Promise<FormState> {
  if (trapped(fd)) {
    const ref = fakeReference("partner");
    return { status: "success", reference: ref, message: tradeThanks(ref), values: {} };
  }
  const { values, errors, payload } = buildTrade(fd, rangeNames);
  if (!payload) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values, contact.tradeEmail);
  if (payloadTooLarge(payload)) return tooLarge(values);
  const result = await safely(() => submitWebsiteEnquiry({ form: "partner", payload }));
  return fromResult(result, values,
    { name: "contact_name", organisation_name: "business_name", email: "email", phone: "phone", region: "region", location: "trading_location", years_trading: "years_trading", estimated_monthly_volume: "volume", message: "message" },
    TRADE_MESSAGES, tradeThanks, contact.tradeEmail);
}

// Newsletter -----------------------------------------------------------------------------------------------------

const NEWSLETTER_MESSAGES: Fields = {
  email: "Please enter a valid email address.",
  consent: "Please tick the box to agree to receive our emails.",
};

export function buildNewsletter(fd: FormData) {
  const v = read(fd, ["email", "consent"]);
  const errors: Fields = {};
  if (!v.email || v.email.length > LIMITS.email || !EMAIL_RE.test(v.email)) errors.email = NEWSLETTER_MESSAGES.email;
  // Consent only counts when the visitor ticked the box themselves.
  if (v.consent !== "yes") errors.consent = NEWSLETTER_MESSAGES.consent;
  if (Object.keys(errors).length) return { values: v, errors };
  return { values: v, errors, payload: { brand: BRAND, email: v.email, consent_marketing: true as const } };
}

const newsletterThanks = (ref: string) => `Thank you, you are subscribed to Yazz news. Your reference is ${ref}.`;

export async function handleNewsletter(fd: FormData): Promise<FormState> {
  if (trapped(fd)) {
    const ref = fakeReference("newsletter");
    return { status: "success", reference: ref, message: newsletterThanks(ref), values: {} };
  }
  const { values, errors, payload } = buildNewsletter(fd);
  if (!payload) return invalid(values, errors);
  if (!formsConfigured()) return unavailable(values, contact.supportEmail);
  const result = await safely(() => submitWebsiteEnquiry({ form: "newsletter", payload }));
  return fromResult(result, values, { email: "email", consent_marketing: "consent" }, NEWSLETTER_MESSAGES, newsletterThanks, contact.supportEmail);
}
