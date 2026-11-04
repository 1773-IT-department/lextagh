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
    key: "General enquiry", tag: "GE", desc: "Anything that does not fit the other routes.", email: "support@lextagh.com",
    formTitle: "General enquiry", formNote: "Tell us what you need and we will point it to the right desk.",
    extraLabel: "Company or organisation", extraPlaceholder: "Optional",
    messagePlaceholder: "How can we help?",
  },
  {
    key: "Distribution", tag: "DS", desc: "Become a distributor or discuss trade terms and coverage.", email: "sales@lextagh.com",
    formTitle: "Distribution enquiry", formNote: "Include your trading location and the brands you are interested in.",
    extraLabel: "Business name", extraPlaceholder: "Registered trading name",
    messagePlaceholder: "Where do you trade, what volumes do you handle, and which brands interest you?",
  },
  {
    key: "Bulk orders", tag: "BQ", desc: "Institutional, hospitality or wholesale quantities.", email: "sales@lextagh.com",
    formTitle: "Bulk order request", formNote: "Give us quantities and delivery timing and we will quote.",
    extraLabel: "Products and quantities", extraPlaceholder: "e.g. 500 cartons Softcare 2-ply",
    messagePlaceholder: "Products, quantities, delivery location and when you need them.",
  },
  {
    key: "Consumer care", tag: "CC", desc: "A question or concern about a product you bought.", email: "support@lextagh.com",
    formTitle: "Consumer care", formNote: "The batch code on the pack helps us trace it quickly.",
    extraLabel: "Product and batch code", extraPlaceholder: "e.g. Yazz Ultra, batch 2026-04-18",
    messagePlaceholder: "What happened, where you bought it, and what you would like us to do.",
  },
  {
    key: "Media", tag: "PR", desc: "Interviews, brand assets and campaign detail.", email: "support@lextagh.com",
    formTitle: "Media enquiry", formNote: "We aim to respond to press within two working days.",
    extraLabel: "Publication or outlet", extraPlaceholder: "Where you are writing for",
    messagePlaceholder: "What you are working on, what you need from us, and your deadline.",
  },
  {
    key: "Careers", tag: "HR", desc: "Applications and questions about an open role.", email: "support@lextagh.com",
    formTitle: "Careers enquiry", formNote: "To apply for a specific role, use the form on the Careers page.",
    extraLabel: "Role reference", extraPlaceholder: "e.g. LX-QA-051",
    messagePlaceholder: "Which role you are asking about and your question.",
  },
];

export const regions = ["Greater Accra", "Ashanti", "Western", "Eastern", "Central", "Volta", "Northern", "Outside Ghana"];

export const faqs = [
  { q: "How do I become a Lexta distributor?", a: "Write to sales@lextagh.com with your business name, trading location, current product lines and the volumes you handle. Our regional sales manager for your area will contact you to discuss coverage, credit and merchandising support. Appointments are made on territory need, so we will be straight with you about whether your area is already covered." },
  { q: "Where can I buy your products?", a: "Yazz, Linzzy, Crox and Softcare are stocked in supermarkets, pharmacies, open markets and general trade outlets across Ghana, and through selected distributors in Liberia. If you cannot find a product near you, send us your location and we will tell you the nearest stockist." },
  { q: "I have a concern about a product I bought. What should I do?", a: "Contact consumer care on support@lextagh.com or +233 (0) 302 235 296 with the product name, the batch code printed on the pack, where you bought it and the date. The batch code lets our quality team trace the exact production run, and we will come back to you with what we find." },
  { q: "Do you supply institutions, hotels and hospitals directly?", a: "Yes. Institutional and hospitality volumes are handled by our key accounts team. Send your requirement and delivery schedule to sales@lextagh.com for a quotation, including whether you need scheduled recurring deliveries." },
  { q: "Can I visit the factory?", a: "Visits are possible by appointment. Because our lines run to hygiene and safety standards, factory access needs prior clearance and protective equipment we provide on site. Write to support@lextagh.com at least a week ahead with your preferred date and the size of your group." },
  { q: "How do I apply for a job?", a: "All current openings are listed on our Careers page with full briefs and reference numbers. Apply through the role itself, or send a general application if nothing open fits. We keep general applications on file and go back to them first when a role opens." },
];
