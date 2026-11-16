/**
 * FAQ groups in faqs.html order (its GROUPS list). Answers follow Lexta's Drive content and lextagh.com; facts Lexta
 * has not confirmed (trade terms, timings, policies) are [PLACEHOLDER: ...] notes.
 * `links` turns a phrase of the answer into a link to the page it names (the wording is unchanged).
 */

import type { TextLink } from "../LinkedText";

export type FaqGroup = { kicker: string; title: string; items: { q: string; a: string; links?: TextLink[] }[] };

export const faqGroups: FaqGroup[] = [
  { kicker: "Products", title: "Our products", items: [
    { q: "Where can I buy Lexta products?", a: "Yazz, Linzzy and Hooch are stocked in supermarkets, pharmacies, open markets and wholesale outlets across Ghana, and in Liberia through our subsidiary in Monrovia. Use the stockist finder on our Home page to find one near you.", links: [{ phrase: "stockist finder", href: "/#where-to-buy" }] },
    { q: "Are your products made in Ghana?", a: "Lexta Ghana Limited is a proudly Ghanaian company, established in Accra in 2002. [PLACEHOLDER: where each product line is made, and whether any lines are imported]" },
    { q: "How do I report a product quality issue?", a: "Email support@lextagh.com or call the Consumer Reports line on +233 (0) 509 967 400 with the batch code printed on the pack, where you bought it and the date. Your report goes to our consumer care team." },
    { q: "Do you offer product samples?", a: "Trade partners and institutional buyers can ask about samples as part of an enquiry through the Partner With Us form. [PLACEHOLDER: Lexta sample policy]", links: [{ phrase: "Partner With Us form", href: "/partner-with-us#apply" }] },
  ] },
  { kicker: "Buying", title: "Trade and bulk orders", items: [
    { q: "What is the minimum order for bulk supply?", a: "[PLACEHOLDER: minimum order quantities for distributors and bulk buyers]. The trade desk confirms figures with your quote." },
    { q: "Do you offer credit terms?", a: "[PLACEHOLDER: credit terms and opening order terms for trade partners]" },
    { q: "How long does delivery take?", a: "[PLACEHOLDER: delivery lead times by region]" },
    { q: "Can you manufacture under our own brand?", a: "[PLACEHOLDER: whether Lexta offers private label or contract manufacturing, and for which lines]" },
  ] },
  { kicker: "Partnership", title: "Partnering with Lexta", items: [
    { q: "How do I become a distributor?", a: "Apply through the Partner With Us page. Select your partnership type (distributor, wholesaler or modern trade) and share your region and contact details. [PLACEHOLDER: documents Lexta requires from distributors]", links: [{ phrase: "Partner With Us page", href: "/partner-with-us#apply" }] },
    { q: "How long does an application take?", a: "Your application goes to the trade desk, which reviews coverage in your area. [PLACEHOLDER: how long a distributor application takes]" },
    { q: "Can NGOs or schools partner on CSR work?", a: "Yes. Registered NGOs, schools, health facilities and community groups can propose a partnership on our hygiene, sanitation and school health programmes. Apply under the CSR route with your organisation, region, the initiative and a short proposal.", links: [{ phrase: "hygiene, sanitation and school health programmes", href: "/corporate-social-responsibility" }, { phrase: "CSR route", href: "/partner-with-us#apply" }] },
  ] },
  { kicker: "Working here", title: "Careers and people", items: [
    { q: "How do I apply for a role?", a: "Open roles are listed on the Careers page with an apply link on each. If nothing fits, send a general application and, with your consent, it is kept on file for future roles.", links: [{ phrase: "Careers page", href: "/careers" }] },
    { q: "Do you take interns or national service personnel?", a: "[PLACEHOLDER: whether Lexta takes interns and national service personnel, and in which areas]. To be considered, send a general application.", links: [{ phrase: "general application", href: "/careers#general" }] },
    { q: "Does Lexta ever charge for recruitment?", a: "Never. We do not charge candidates at any stage. Treat any request for payment as fraudulent and report it to hr@lextagh.com." },
  ] },
];
