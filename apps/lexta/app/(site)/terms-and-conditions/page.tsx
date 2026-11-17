import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

// Title from terms-and-conditions.html.
const title = "Terms & Conditions | Lexta Ghana";
const description = "Terms & Conditions of Lexta Ghana Limited.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * The Terms of Use Lexta publishes today on lextagh.com (https://lextagh.com/terms-conditions/), carried over word for
 * word (docs/content/lexta/original-site/lextagh-com.md). Light edits only: "the https://www.lextagh.com website"
 * reads "the Lexta Ghana Ltd. website", the doubled full stop after "Ltd." and the closing line's stray full stop
 * are fixed. Lexta's legal adviser still has to review it and give the approval date before go-live.
 */
const sections: LegalSection[] = [
  { heading: "Service Details", paras: [
    "Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.",
    "By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.",
  ] },
  { heading: "Intellectual Property", paras: [
    "The Service and its original content, features and functionality are and will remain the exclusive property of Lexta Ghana Ltd. and its licensors.",
  ] },
  { heading: "Links To Other Web Sites", paras: [
    "Our Service may contain links to third-party web sites or services that are not owned or controlled by Lexta Ghana Ltd.",
    "Lexta Ghana Ltd. has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Lexta Ghana Ltd. shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.",
    "We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.",
  ] },
  { heading: "Termination", paras: [
    "We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.",
    "All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.",
  ] },
  { heading: "Disclaimer", paras: [
    "Your use of the Service is at your sole risk. The Service is provided on an “AS IS” and “AS AVAILABLE” basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.",
  ] },
  { heading: "Governing Law", paras: [
    "These Terms shall be governed and construed in accordance with the laws of Ghana without regard to its conflict of law provisions.",
    "Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.",
  ] },
  { heading: "Changes", paras: [
    "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 15 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.",
    "By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.",
  ] },
  { heading: "Contact Us", paras: [
    "If you have any questions about these Terms, please contact us on our “Contact Us” page.",
  ] },
];

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms & Conditions"
      intro="Please read these Terms of Use (“Terms”, “Terms of Use”) carefully before using the Lexta Ghana Ltd. website (the “Service”) operated by Lexta Ghana Ltd. (“us”, “we”, or “our”)."
      updated="[PLACEHOLDER: date Lexta legal approves these terms (text carried over from lextagh.com, for Lexta legal to review)]"
      sections={sections}
    />
  );
}
