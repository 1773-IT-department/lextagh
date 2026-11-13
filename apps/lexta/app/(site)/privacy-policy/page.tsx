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
 * Policy text copied word for word from privacy-policy.html. Only changes: "Olusegu" spelt "Olusegun" (approved),
 * and the two em dash pairs in sections 2 and 3 replaced (house rule: no em dashes). Lexta must approve the text.
 */
const sections: LegalSection[] = [
  { heading: "1. Who we are", paras: [
    "Lexta Ghana Limited is a manufacturer and distributor of home care, personal care and food products, registered in Ghana with its head office at Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra. We are the data controller for the information described in this policy.",
  ] },
  { heading: "2. Information we collect", paras: [
    "We collect the details you give us directly: your name, business name, email address, telephone number, trading location and any information you include in an enquiry, trade application, CSR proposal, supplier submission or job application.",
    "We also collect limited technical information when you browse this site (pages viewed, approximate location derived from your IP address, and device or browser type) so that we can keep the site working and understand which content is useful.",
  ] },
  { heading: "3. How we use it", paras: [
    "We use your information to answer enquiries, assess trade and supplier applications, run recruitment, fulfil and support orders, meet legal and tax obligations, and, where you have asked for it, to send product and trade updates. We do not sell personal data to anyone.",
  ] },
  { heading: "4. Lawful basis", paras: [
    "We process personal data under the Data Protection Act, 2012 (Act 843) of Ghana. Depending on the case, our basis is your consent, the performance of a contract with you, compliance with a legal obligation, or our legitimate interest in operating and improving the business.",
  ] },
  { heading: "5. Who we share it with", paras: [
    "We share information only where it is needed: with our appointed distributors and logistics partners to deliver goods, with professional advisers, banks and auditors, with service providers who host or maintain our systems under confidentiality terms, and with regulators or law enforcement where the law requires it.",
  ] },
  { heading: "6. How long we keep it", paras: [
    "Enquiries are kept for 24 months. Unsuccessful job applications are kept for 6 months unless you ask us to remove them sooner. Trade, supplier and financial records are kept for the period required by Ghanaian tax and company law, normally six years.",
  ] },
  { heading: "7. Keeping information secure", paras: [
    "Access to personal data is limited to staff who need it for their role. Systems are password protected, business records are held on managed accounts, and paper files are kept in locked storage at our offices. We review these controls regularly.",
  ] },
  { heading: "8. Your rights", paras: [
    "You may ask for a copy of the personal data we hold about you, ask us to correct it, ask us to delete it where we have no continuing obligation to keep it, or withdraw consent to marketing at any time. Email marketing@lextagh.com and we will respond within 30 days.",
  ] },
  { heading: "9. Cookies", paras: [
    "This site uses only the cookies needed to make pages load and remember your preferences during a visit, plus basic analytics. You can block or delete cookies in your browser settings; core pages will still work.",
  ] },
  { heading: "10. Changes to this policy", paras: [
    "We update this policy when our practices or the law change. The date at the top of this page shows the current version, and material changes will be flagged on the site.",
  ] },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      kicker="Privacy"
      title="Privacy Policy"
      intro="How Lexta Ghana Limited collects, uses and protects personal information across our website, trade applications and consumer care channels."
      updated="1 September 2026"
      sections={sections}
    />
  );
}
