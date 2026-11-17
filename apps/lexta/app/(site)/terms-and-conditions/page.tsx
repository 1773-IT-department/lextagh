import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

// Title and description from terms-and-conditions.html.
const title = "Terms & Conditions | Lexta Ghana";
const description = "Terms of use for the Lexta Ghana website.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * Standard website terms for a Ghanaian consumer-goods company, written by 1773 without company specific facts
 * (Desmond, 16 November 2026). Supply terms, liability limits and other specifics are [PLACEHOLDER: ...] notes.
 * Lexta's legal review is required before go-live.
 */
const sections: LegalSection[] = [
  { heading: "1. These terms", paras: [
    "These terms apply to your use of this website, run by Lexta Ghana Limited, Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra. By using the site you accept them. If you do not accept them, please do not use the site.",
  ] },
  { heading: "2. Using this website", paras: [
    "You may view and print pages of this site for your own information. You may not copy, republish or use our content, images, brand names or logos for any commercial purpose without our written permission, or use the site in a way that breaks the law or harms the site or other users.",
  ] },
  { heading: "3. Product information", paras: [
    "We aim to describe our products accurately. Packaging, formulations and pack sizes may change, and colours may look different on screen. Always read the product pack for ingredients, directions and warnings before use.",
  ] },
  { heading: "4. No online sales", paras: [
    "This website does not sell products. Enquiries, quote requests and applications sent through the site are not orders and do not create a contract. Where to Buy shows stockists; prices and availability are set by the retailer.",
  ] },
  { heading: "5. Trade, partner and supplier applications", paras: [
    "Sending an application through this site does not appoint you as a distributor, wholesaler, supplier or partner, and does not oblige us to trade with you. Any appointment or supply is agreed separately in writing.",
    "[PLACEHOLDER: Lexta's terms of supply for trade customers, or a reference to where they are set out]",
  ] },
  { heading: "6. Your submissions", paras: [
    "When you send us a message, complaint, proposal or application, you confirm that the information is accurate and that you are entitled to share it, including any file you attach. We handle personal information as described in our Privacy Policy.",
  ] },
  { heading: "7. Links to other websites", paras: [
    "This site may link to other websites, including our brand websites and social media pages. We are not responsible for the content of websites we do not control.",
  ] },
  { heading: "8. Liability", paras: [
    "We work to keep this website accurate and available, but we cannot promise that it will always be free of errors or interruptions. Nothing in these terms limits any liability that cannot be limited under the laws of Ghana.",
    "[PLACEHOLDER: any limit of Lexta's liability, as confirmed by Lexta's legal adviser]",
  ] },
  { heading: "9. Intellectual property", paras: [
    "Yazz, Linzzy, Hooch and Lexta, and the content, images and logos on this site, belong to Lexta Ghana Limited or are used with permission.",
  ] },
  { heading: "10. Governing law", paras: [
    "These terms are governed by the laws of the Republic of Ghana. [PLACEHOLDER: dispute resolution and jurisdiction wording, as confirmed by Lexta's legal adviser]",
  ] },
  { heading: "11. Changes to these terms", paras: [
    "We may update these terms from time to time. The date at the top of this page shows when they were last changed.",
  ] },
];

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms & Conditions"
      intro="The terms on which you use the Lexta Ghana website. [PLACEHOLDER: Lexta legal review before go-live]"
      updated="[PLACEHOLDER: date Lexta approves these terms]"
      sections={sections}
    />
  );
}
