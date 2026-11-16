import type { TextLink } from "../LinkedText";

/* Copy and routing taken from contact-us.html (REASONS and FAQS in its page script). */

export type Reason = {
  key: string;
  tag: string;
  desc: string;
  email: string;
  formTitle: string;
  formNote: string;
  extraLabel: string;
  extraPlaceholder: string;
  messagePlaceholder: string;
};

export const reasons: Reason[] = [
  {
    key: "General enquiry", tag: "GE", desc: "Anything that does not fit the other routes.", email: "marketing@lextagh.com",
    formTitle: "General enquiry", formNote: "Tell us what you need and we will point it to the right desk.",
    extraLabel: "Company or organisation", extraPlaceholder: "Optional",
    messagePlaceholder: "How can we help?",
  },
  {
    key: "Distribution", tag: "DS", desc: "Distributor, wholesaler or modern trade enquiries and coverage.", email: "marketing@lextagh.com",
    formTitle: "Distribution enquiry", formNote: "Include your trading location and the brands you are interested in.",
    extraLabel: "Business name", extraPlaceholder: "Registered trading name",
    messagePlaceholder: "Where do you trade, what volumes do you handle, and which brands interest you?",
  },
  {
    key: "Bulk orders", tag: "BQ", desc: "Institutional, hospitality or wholesale quantities.", email: "marketing@lextagh.com",
    formTitle: "Bulk order request", formNote: "Give us quantities and delivery timing so the team can prepare a quote.",
    extraLabel: "Products and quantities", extraPlaceholder: "e.g. 500 cartons Mama Yazz tissue",
    messagePlaceholder: "Products, quantities, delivery location and when you need them.",
  },
  {
    key: "Consumer care", tag: "CC", desc: "A question or concern about a product you bought.", email: "support@lextagh.com",
    formTitle: "Consumer care", formNote: "The batch code on the pack helps us trace it quickly.",
    extraLabel: "Product and batch code", extraPlaceholder: "e.g. Yazz Minty pads, batch 2026-04-18",
    messagePlaceholder: "What happened, where you bought it, and what you would like us to do.",
  },
  {
    key: "Media", tag: "PR", desc: "Interviews, brand assets and campaign detail.", email: "marketing@lextagh.com",
    formTitle: "Media enquiry", formNote: "Media enquiries go to our corporate affairs team.",
    extraLabel: "Publication or outlet", extraPlaceholder: "Where you are writing for",
    messagePlaceholder: "What you are working on, what you need from us, and your deadline.",
  },
  {
    key: "Careers", tag: "HR", desc: "Applications and questions about an open role.", email: "hr@lextagh.com",
    formTitle: "Careers enquiry", formNote: "To apply for a specific role, use the form on the Careers page.",
    extraLabel: "Role reference", extraPlaceholder: "e.g. LX-QA-051",
    messagePlaceholder: "Which role you are asking about and your question.",
  },
];

/** Ghana's 16 regions, then Outside Ghana. Each label maps to a region slug in lib/forms/core.ts (REGION_SLUGS). */
export const regions = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti",
  "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North", "Outside Ghana",
];

export const faqs: { q: string; a: string; links?: TextLink[] }[] = [
  { q: "How do I become a Lexta distributor?", a: "Write to marketing@lextagh.com, or use the Partner With Us form, with your business name, partnership type (distributor, wholesaler or modern trade), region and contact details, the product lines you carry and the volumes you handle. Your enquiry goes to the trade desk, which reviews coverage in your area. [PLACEHOLDER: distributor appointment process and terms]" },
  { q: "Where can I buy your products?", a: "Yazz, Linzzy and Hooch are stocked in supermarkets, pharmacies, open markets and general trade outlets across Ghana, and in Liberia through our subsidiary in Monrovia. If you cannot find a product near you, use the stockist finder on our Home page or send us your location." },
  { q: "I have a concern about a product I bought. What should I do?", a: "Contact consumer care on support@lextagh.com or the Consumer Reports line, +233 (0) 509 967 400, with the product name, the batch code printed on the pack, where you bought it and the date. Your report goes to our consumer care team, and the batch code helps our quality team trace the product." },
  { q: "Do you supply institutions, hotels and hospitals directly?", a: "Send your requirement and delivery schedule to marketing@lextagh.com for a quotation, including whether you need recurring deliveries. [PLACEHOLDER: how Lexta handles institutional and hospitality supply]" },
  { q: "Can I visit Lexta?", a: "Visits to Lexta Square are by appointment. Write to marketing@lextagh.com with your preferred date and the size of your group. [PLACEHOLDER: visitor and site tour policy]" },
  { q: "How do I apply for a job?", a: "All current openings are listed on our Careers page with full briefs and reference numbers. Apply through the role itself, or send a general application if nothing open fits. With your consent, general applications are kept on file for future roles.", links: [{ phrase: "Careers page", href: "/careers" }] },
];
