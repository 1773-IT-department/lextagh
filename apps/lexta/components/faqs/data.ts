/**
 * FAQ groups in faqs.html order (its GROUPS list). Answers come only from Lexta's Drive content and lextagh.com
 * (docs/content/lexta/PLACEHOLDERS.md). Questions whose answer Lexta has not supplied were removed in the strict
 * source sweep (samples, minimum order, credit terms, delivery times, own brand manufacturing, application time,
 * interns, recruitment fees); a fact still missing from a kept answer is a [PLACEHOLDER: ...] note.
 * `links` turns a phrase of the answer into a link to the page it names (the wording is unchanged).
 */

import type { TextLink } from "../LinkedText";

export type FaqGroup = { kicker: string; title: string; items: { q: string; a: string; links?: TextLink[] }[] };

export const faqGroups: FaqGroup[] = [
  { kicker: "Products", title: "Our products", items: [
    { q: "Where can I buy Lexta products?", a: "Use the stockist finder on our Home page to find one near you.", links: [{ phrase: "stockist finder", href: "/#where-to-buy" }] },
    { q: "Are your products made in Ghana?", a: "Lexta Ghana Limited was established in 2002 as a proudly Ghanaian-owned company. [PLACEHOLDER: where each product line is made, and whether any lines are imported]" },
    { q: "How do I report a product quality issue?", a: "Complaints & product reviews: support@lextagh.com. Consumer Reports: +233 (0) 509 967 400. Please include the product, batch and store." },
  ] },
  { kicker: "Partnership", title: "Partnering with Lexta", items: [
    { q: "How do I become a distributor?", a: "For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details on the Partner With Us page. [PLACEHOLDER: documents Lexta requires from distributors]", links: [{ phrase: "Partner With Us page", href: "/partner-with-us#apply" }] },
    { q: "Can NGOs or schools partner on CSR work?", a: "Explore initiatives by brand, submit a partnership proposal or request information about a programme.", links: [{ phrase: "Explore initiatives by brand", href: "/corporate-social-responsibility" }, { phrase: "submit a partnership proposal", href: "/partner-with-us#apply" }] },
  ] },
  { kicker: "Working here", title: "Careers and people", items: [
    { q: "How do I apply for a role?", a: "To enquire about careers, use the Careers form.", links: [{ phrase: "Careers form", href: "/careers#general" }] },
  ] },
];
