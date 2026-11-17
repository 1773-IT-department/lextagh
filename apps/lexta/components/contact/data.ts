import type { TextLink } from "../LinkedText";

/*
 * Reasons and FAQs in contact-us.html's order. Copy only from Lexta's Drive routing and lextagh.com. "Bulk orders" and
 * "Media" had no Lexta source and were removed from the form; lib/forms/core.ts still maps them (old links, tests).
 */

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
    key: "General enquiry", tag: "GE", desc: "Contact Lexta Ghana for all inquiries.", email: "marketing@lextagh.com",
    formTitle: "General enquiry", formNote: "Please use our FAQs below to find answers to some of the questions you may have.",
    extraLabel: "Company or organisation", extraPlaceholder: "Optional",
    messagePlaceholder: "How can we help?",
  },
  {
    key: "Distribution", tag: "DS", desc: "Distributor / wholesale / modern trade.", email: "marketing@lextagh.com",
    formTitle: "Distribution enquiry", formNote: "For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details.",
    extraLabel: "Business name", extraPlaceholder: "Registered trading name",
    messagePlaceholder: "Where do you trade, what volumes do you handle, and which brands interest you?",
  },
  {
    key: "Consumer care", tag: "CC", desc: "Complaints & product reviews.", email: "support@lextagh.com",
    formTitle: "Consumer care", formNote: "Please include the product, batch and store.",
    extraLabel: "Product and batch code", extraPlaceholder: "e.g. Yazz Minty pads, batch 2026-04-18",
    messagePlaceholder: "What happened, where you bought it, and what you would like us to do.",
  },
  {
    key: "Careers", tag: "HR", desc: "Job applications (recruitment).", email: "hr@lextagh.com",
    formTitle: "Careers enquiry", formNote: "To enquire about careers, use the Careers form.",
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
  { q: "How do I become a Lexta distributor?", a: "For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details on the Partner With Us form. [PLACEHOLDER: distributor appointment process and terms]", links: [{ phrase: "Partner With Us form", href: "/partner-with-us#apply" }] },
  { q: "Where can I buy your products?", a: "Use the stockist finder on our Home page to find one near you.", links: [{ phrase: "stockist finder", href: "/#where-to-buy" }] },
  { q: "I have a concern about a product I bought. What should I do?", a: "Complaints & product reviews: support@lextagh.com. Consumer Reports: +233 (0) 509 967 400. Please include the product, batch and store." },
  { q: "How do I apply for a job?", a: "To enquire about careers, use the Careers form.", links: [{ phrase: "Careers form", href: "/careers#general" }] },
];
