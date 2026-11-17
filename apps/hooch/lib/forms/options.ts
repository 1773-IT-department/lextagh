// The choices the Hooch forms offer, shared by the forms (browser) and lib/forms/core.ts (server). No imports, so the
// browser bundle never pulls in server code.

/** The consumer form's topics. "problem" becomes a complaint; the others a CRM lead. */
export const TOPICS = [
  { value: "question", label: "Product question", hint: "Have a question about Hooch® products?" },
  { value: "problem", label: "Report a problem with a product", hint: "" },
  { value: "feedback", label: "Share your breakfast experience", hint: "Want to share your breakfast experience?" },
  { value: "recipe", label: "Share a Hooch® recipe idea", hint: "Share your favourite Hooch® breakfast combination with us for a chance to inspire other families." },
  { value: "partnership", label: "Partnership opportunity", hint: "" },
  { value: "stockist", label: "My shop does not stock Hooch®", hint: "" },
  { value: "other", label: "Something else", hint: "" },
] as const;
export type Topic = (typeof TOPICS)[number]["value"];
export const isTopic = (v: string | undefined): v is Topic => TOPICS.some((t) => t.value === v);
export const topicLabel = (v: string) => TOPICS.find((t) => t.value === v)?.label ?? "Something else";

/** Who is asking, to the partner_type values the database accepts. */
export const TRADE_ROUTES = [
  { value: "distributor", label: "Distributor or wholesaler", partner: "distributor" },
  { value: "retail", label: "Retailer or modern trade", partner: "retail" },
  { value: "institutional", label: "Other business or organisation", partner: "institutional" },
] as const;

/** Neutral size bands only: Lexta has given no trade unit or order terms. */
export const VOLUMES = ["Small", "Medium", "Large", "Very large", "Not sure yet"];


/** The cereals a trade enquiry can name (the trade form's "Cereals you are interested in"). */
export const CEREALS = [
  { value: "cornflakes", label: "Hooch® Cornflakes" },
  { value: "frosted-flakes", label: "Hooch® Frosted Flakes" },
];
