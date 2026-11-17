// The choices the Linzzy forms offer, shared by the forms (browser) and lib/forms/core.ts (server). No imports, so the
// browser bundle never pulls in server code.

/** The consumer form's topics. "problem" becomes a complaint; the others a CRM lead. Hints quote Lexta's Contact page (Drive); a topic Lexta wrote no line for has none. */
export const TOPICS = [
  { value: "question", label: "Product information", hint: "Have questions about our sanitary towels, panty liners, baby diapers or baby wipes?" },
  { value: "problem", label: "Report a problem with a product", hint: "If you have a concern about a Linzzy product, please contact our customer support team directly." },
  { value: "feedback", label: "Feedback or product review", hint: "Your experience helps us improve." },
  { value: "partnership", label: "Partnership, media or collaboration", hint: "For brand partnerships, media enquiries, educational campaigns and promotional collaborations, please contact our team." },
  { value: "stockist", label: "My shop does not stock Linzzy", hint: "" },
  { value: "other", label: "Something else", hint: "" },
] as const;
export type Topic = (typeof TOPICS)[number]["value"];
export const isTopic = (v: string | undefined): v is Topic => TOPICS.some((t) => t.value === v);
export const topicLabel = (v: string) => TOPICS.find((t) => t.value === v)?.label ?? "Something else";

/**
 * Who is asking, to the partner_type values the database accepts. Labels follow Lexta's own trade segments (Lexta
 * master copy: "Distributor / Wholesaler / Modern Trade"; original linzzyproducts.com form: Wholesaler, Modern Trade,
 * Supermarket, Other).
 */
export const TRADE_ROUTES = [
  { value: "distributor", label: "Distributor or wholesaler", partner: "distributor" },
  { value: "retail", label: "Modern trade or supermarket", partner: "retail" },
  { value: "institutional", label: "Other business", partner: "institutional" },
] as const;

/**
 * Expected monthly volume. Lexta has not given volume bands for Linzzy trade enquiries, so the invented carton bands were
 * removed: one marked placeholder option until Lexta's sales team gives the bands (docs/content/linzzy/PLACEHOLDERS.md).
 */
export const VOLUME_PLACEHOLDER = "[PLACEHOLDER: monthly volume bands, from Lexta's sales team]";
export const VOLUMES = [VOLUME_PLACEHOLDER, "Not sure yet"];

