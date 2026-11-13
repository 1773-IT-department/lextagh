/**
 * FAQ groups, copied word for word from faqs.html (its GROUPS list), in prototype order.
 * `links` turns a phrase of the answer into a link to the page it names (the wording is unchanged).
 */

import type { TextLink } from "../LinkedText";

export type FaqGroup = { kicker: string; title: string; items: { q: string; a: string; links?: TextLink[] }[] };

export const faqGroups: FaqGroup[] = [
  { kicker: "Products", title: "Our products", items: [
    { q: "Where can I buy Lexta products?", a: "Yazz, Linzzy, Hooch and the rest of the range are stocked in supermarkets, pharmacies, open markets and wholesale outlets across all 16 regions of Ghana, and through our subsidiary in Monrovia, Liberia." },
    { q: "Are your products made in Ghana?", a: "Yes. We manufacture at our own plants in Accra and Tema. A small number of specialist lines are imported to complete a category, and these are labelled accordingly." },
    { q: "How do I report a product quality issue?", a: "Email support@lextagh.com or call +233 (0) 501 619 588 with the batch code printed on the pack. Quality assurance investigates every report and comes back with findings." },
    { q: "Do you offer product samples?", a: "Samples go to trade partners, institutional buyers and private-label clients as part of an active enquiry. Request one through the Partner With Us form.", links: [{ phrase: "Partner With Us form", href: "/partner-with-us#apply" }] },
  ] },
  { kicker: "Buying", title: "Trade and bulk orders", items: [
    { q: "What is the minimum order for bulk supply?", a: "Minimums are set per category and per route. Distributors commit to an agreed opening order; institutional buyers are quoted against the schedule they need. The trade desk confirms figures with your quote." },
    { q: "Do you offer credit terms?", a: "Credit is available to appointed distributors after a performance review, typically once a trading history is established. Opening orders are on a pro-forma basis." },
    { q: "How long does delivery take?", a: "Orders from stock leave the Tema warehouse within 48 hours for Greater Accra and within three to five working days for other regions. Contract schedules are agreed up front." },
    { q: "Can you manufacture under our own brand?", a: "Yes, we run contract manufacturing for tissue and hygiene lines. Bring a specification or reference sample, artwork and a committed minimum order quantity." },
  ] },
  { kicker: "Partnership", title: "Partnering with Lexta", items: [
    { q: "How do I become a distributor?", a: "Apply through the Partner With Us page. You will need business registration, two trade references, warehouse and vehicle details, and the territory you intend to cover.", links: [{ phrase: "Partner With Us page", href: "/partner-with-us#apply" }] },
    { q: "How long does an application take?", a: "The trade desk responds within 48 hours of a complete application. Territory review and reference checks take one to two weeks, then a signed trading agreement follows." },
    { q: "Can NGOs or schools partner on CSR work?", a: "Yes. We co-fund and supply hygiene, sanitation and school health programmes with registered NGOs, schools, health facilities and community groups. Apply under the CSR route.", links: [{ phrase: "hygiene, sanitation and school health programmes", href: "/corporate-social-responsibility" }, { phrase: "CSR route", href: "/partner-with-us#apply" }] },
  ] },
  { kicker: "Working here", title: "Careers and people", items: [
    { q: "How do I apply for a role?", a: "Open roles are listed on the Careers page with an apply link on each. If nothing fits, send a general application and we keep it on file for six months.", links: [{ phrase: "Careers page", href: "/careers" }] },
    { q: "Do you take interns or national service personnel?", a: "Yes, across production, quality, sales and finance. Applications open ahead of each intake, so send a general application to be notified.", links: [{ phrase: "general application", href: "/careers#general" }] },
    { q: "Does Lexta ever charge for recruitment?", a: "Never. We do not charge candidates at any stage. Treat any request for payment as fraudulent and report it to hr@lextagh.com." },
  ] },
];
