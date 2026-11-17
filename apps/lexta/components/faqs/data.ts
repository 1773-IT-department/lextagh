/**
 * FAQ groups in faqs.html order (its GROUPS list). Neither Lexta's Drive content nor lextagh.com has FAQs, so the
 * questions stay and every answer is a placeholder until Lexta supplies its own (Desmond, 17 November 2026;
 * docs/content/lexta/PLACEHOLDERS.md). Questions whose answer Lexta has not supplied were removed in the strict
 * source sweep (samples, minimum order, credit terms, delivery times, own brand manufacturing, application time,
 * interns, recruitment fees). `links` (optional) turns a phrase of an answer into a
 * link to the page it names, for when Lexta's answers arrive.
 */

import type { TextLink } from "../LinkedText";

export type FaqGroup = { kicker: string; title: string; items: { q: string; a: string; links?: TextLink[] }[] };

export const faqGroups: FaqGroup[] = [
  { kicker: "Products", title: "Our products", items: [
    { q: "Where can I buy Lexta products?", a: "[PLACEHOLDER: Lexta's answer on where customers can buy Lexta products]" },
    { q: "Are your products made in Ghana?", a: "[PLACEHOLDER: Lexta's answer on where Lexta products are made]" },
    { q: "How do I report a product quality issue?", a: "[PLACEHOLDER: Lexta's answer on how to report a product quality issue]" },
  ] },
  { kicker: "Partnership", title: "Partnering with Lexta", items: [
    { q: "How do I become a distributor?", a: "[PLACEHOLDER: Lexta's answer on how to become a Lexta distributor]" },
    { q: "Can NGOs or schools partner on CSR work?", a: "[PLACEHOLDER: Lexta's answer on how NGOs and schools can partner on CSR work]" },
  ] },
  { kicker: "Working here", title: "Careers and people", items: [
    { q: "How do I apply for a role?", a: "[PLACEHOLDER: Lexta's answer on how to apply for a role at Lexta]" },
  ] },
];
