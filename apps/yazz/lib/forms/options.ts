// The choices the Yazz forms offer, shared by the forms (browser) and lib/forms/core.ts (server). No imports, so the
// browser bundle never pulls in server code.

/** The consumer form's topics. "problem" becomes a complaint; the others a CRM lead. */
export const TOPICS = [
  { value: "question", label: "Product question", hint: "Ask us anything about a Yazz product." },
  { value: "problem", label: "Report a problem with a product", hint: "A pack that did not meet our standard. You will get a case number." },
  { value: "feedback", label: "Feedback or product review", hint: "Tell us what you think of Yazz." },
  { value: "stockist", label: "My shop does not stock Yazz", hint: "Tell us the shop's name and town." },
  { value: "other", label: "Something else", hint: "Any other question for the Yazz team." },
] as const;
export type Topic = (typeof TOPICS)[number]["value"];
export const isTopic = (v: string | undefined): v is Topic => TOPICS.some((t) => t.value === v);
export const topicLabel = (v: string) => TOPICS.find((t) => t.value === v)?.label ?? "Something else";

/** Who is asking, to the partner_type values the database accepts. */
export const TRADE_ROUTES = [
  { value: "distributor", label: "Distributor or wholesaler", partner: "distributor" },
  { value: "retail", label: "Shop, supermarket or pharmacy", partner: "retail" },
  { value: "institutional", label: "School, clinic, hotel or office", partner: "institutional" },
] as const;

export const VOLUMES = ["Under 10 cartons a month", "10 to 50 cartons a month", "50 to 200 cartons a month", "Over 200 cartons a month", "Not sure yet"];

