import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

// Title and description from privacy-policy.html.
const title = "Privacy Policy | Lexta Ghana";
const description = "How Lexta Ghana collects, uses and protects personal information.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * Standard privacy notice for a Ghanaian consumer-goods company, written by 1773 without company specific facts
 * (Desmond, 16 November 2026). Retention periods, response times and other specifics are [PLACEHOLDER: ...] notes.
 * Lexta's legal review is required before go-live.
 */
const sections: LegalSection[] = [
  { heading: "1. Who we are", paras: [
    "Lexta Ghana Limited is a Ghanaian consumer-goods company and the company behind Yazz, Linzzy and Hooch. Our head office is at Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra. We are responsible, as data controller, for the personal information described in this policy.",
    "[PLACEHOLDER: Lexta's registration details with the Data Protection Commission, if any]",
  ] },
  { heading: "2. Information we collect", paras: [
    "We collect the information you choose to give us when you contact us, send an enquiry or a product complaint, apply to become a partner or supplier, submit a CSR proposal, apply for a job, subscribe to news or use live chat. This can include your name, contact details, organisation, region, the content of your message and any file you attach, such as a CV or a photo of a product.",
    "We collect only what we need for the purpose you contact us for, and we ask for your consent where the law requires it.",
    "When you browse this website, limited technical information may be collected so the site works properly and stays secure. [PLACEHOLDER: analytics or other tracking tools used on the site, if any]",
  ] },
  { heading: "3. How we use it", paras: [
    "We use your information to answer your enquiry or complaint, to consider partner, supplier and CSR applications, to run recruitment, to send news you have asked for, and to meet our legal obligations. We do not sell your personal information.",
  ] },
  { heading: "4. Lawful basis", paras: [
    "We handle personal information in line with the Data Protection Act, 2012 (Act 843) of Ghana. Depending on the case, we rely on your consent, on steps needed to enter into or perform a contract with you, on a legal obligation, or on our legitimate interests in running our business, where those interests are not outweighed by your rights.",
  ] },
  { heading: "5. Who we share it with", paras: [
    "We share personal information only where it is needed: within Lexta Ghana Limited and its brands, with service providers who host or support our systems and who must keep it confidential, with professional advisers, and with regulators, courts or law enforcement where the law requires it.",
    "[PLACEHOLDER: any other recipients, and whether information is transferred outside Ghana]",
  ] },
  { heading: "6. How long we keep it", paras: [
    "We keep personal information only for as long as we need it for the purpose it was collected for, or as long as the law requires.",
    "[PLACEHOLDER: retention periods for enquiries, complaints, chat conversations, job applications and CVs, partner applications and newsletter subscriptions]",
  ] },
  { heading: "7. Keeping information secure", paras: [
    "We use reasonable technical and organisational measures to protect personal information against loss, misuse and unauthorised access. Access is limited to the staff who need it for their work, and job applications and CVs are restricted to the people involved in recruitment.",
  ] },
  { heading: "8. Your rights", paras: [
    "Under the Data Protection Act, 2012 (Act 843), you may ask whether we hold personal information about you and for a copy of it, ask us to correct or delete it, object to certain uses of it, and withdraw your consent to news by email at any time using the unsubscribe link or by writing to us.",
    "To make a request, email marketing@lextagh.com. [PLACEHOLDER: how and within what time Lexta responds to data requests, and the contact for data protection questions]",
  ] },
  { heading: "9. Cookies", paras: [
    "This website uses the cookies and similar storage it needs to work, for example to keep a live chat conversation open while you browse. [PLACEHOLDER: any analytics or other cookies used, and how visitors can control them]",
  ] },
  { heading: "10. Changes to this policy", paras: [
    "We may update this policy from time to time. The date at the top of this page shows when it was last changed.",
  ] },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      kicker="Privacy"
      title="Privacy Policy"
      intro="How Lexta Ghana Limited collects, uses and protects personal information across this website, its forms and live chat. [PLACEHOLDER: Lexta legal review before go-live]"
      updated="[PLACEHOLDER: date Lexta approves this policy]"
      sections={sections}
    />
  );
}
