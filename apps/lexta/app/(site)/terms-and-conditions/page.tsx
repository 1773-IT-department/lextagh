import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

// Title and description from terms-and-conditions.html.
const title = "Terms & Conditions | Lexta Ghana";
const description = "Terms of use for the Lexta Ghana website and terms of supply for trade customers.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/** Terms copied word for word from terms-and-conditions.html. Lexta must approve the text before go-live. */
const sections: LegalSection[] = [
  { heading: "1. These terms", paras: [
    "By using this website or placing an order with Lexta Ghana Limited you accept these terms. Where a signed trading agreement, distribution agreement or contract of supply exists between us, that agreement takes precedence over anything on this page.",
  ] },
  { heading: "2. Using this website", paras: [
    "You may view, download and print material from this site for your own business use in dealing with us. You may not copy, republish or use our content, images, brand names or logos for any other commercial purpose without our written permission.",
  ] },
  { heading: "3. Product information", paras: [
    "We describe our products as accurately as we can. Packaging, formulations and specifications may change as we improve our lines, and colours may differ on screen. Always read the pack for ingredients, directions and warnings before use.",
  ] },
  { heading: "4. Orders and pricing", paras: [
    "Prices quoted on this site or in correspondence are indicative and exclusive of VAT and levies unless stated otherwise. An order becomes binding only when we confirm it in writing. Quoted prices hold for 30 days unless the quotation says otherwise.",
  ] },
  { heading: "5. Payment", paras: [
    "Opening orders are supplied on a pro-forma basis. Credit terms are available to approved partners after review and are set out in your trading agreement. Overdue accounts may be placed on hold and interest may be charged at the rate stated in that agreement.",
  ] },
  { heading: "6. Delivery, risk and title", paras: [
    "Delivery dates are estimates given in good faith. Risk in the goods passes to you on delivery to your nominated address or on collection from our warehouse. Title stays with Lexta Ghana Limited until we have received payment in full.",
  ] },
  { heading: "7. Returns and claims", paras: [
    "Claims for shortage, damage in transit or incorrect supply must reach us in writing within seven days of delivery, with the batch codes and supporting photographs. Goods returned by agreement must be unopened, in original packaging and within date.",
  ] },
  { heading: "8. Partner and supplier applications", paras: [
    "Submitting an application through this site does not create an appointment, an exclusive territory or any obligation on us to trade. Appointments take effect only through a written agreement signed by an authorised officer of Lexta Ghana Limited.",
  ] },
  { heading: "9. Liability", paras: [
    "Nothing here limits our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited under Ghanaian law. Subject to that, our liability for any claim is limited to the invoice value of the goods concerned, and we are not liable for loss of profit or other indirect loss.",
  ] },
  { heading: "10. Intellectual property", paras: [
    "Yazz, Linzzy, Hooch and the other marks shown on this site are the property of Lexta Ghana Limited. Trade partners may use them only as agreed for the promotion and resale of genuine Lexta products.",
  ] },
  { heading: "11. Governing law", paras: [
    "These terms are governed by the laws of the Republic of Ghana, and the courts of Ghana have exclusive jurisdiction over any dispute. We will always try to resolve matters commercially first.",
  ] },
];

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms & Conditions"
      intro="The terms on which you use the Lexta Ghana website and on which we supply goods to trade, institutional and private-label customers."
      updated="1 September 2026"
      sections={sections}
    />
  );
}
