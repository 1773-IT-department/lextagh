import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

// Title from privacy-policy.html.
const title = "Privacy Policy | Lexta Ghana";
const description = "Privacy Policy of Lexta Ghana Limited.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * Lexta has not supplied its privacy policy. The text 1773 wrote earlier was removed in the strict source sweep
 * (Desmond: only content from Lexta's Drive and lextagh.com). What remains is the privacy rule in Lexta's Drive
 * document ("Developer navigation and content rules"); the policy itself comes from Lexta's legal adviser.
 */
const sections: LegalSection[] = [
  { heading: "Privacy", paras: [
    "Minimise personal information, obtain specific consent, restrict file attachments and publish privacy/retention notices.",
  ] },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      kicker="Privacy"
      title="Privacy Policy"
      intro="[PLACEHOLDER: Lexta privacy policy text, for Lexta legal to supply]"
      updated="[PLACEHOLDER: date Lexta approves this policy]"
      sections={sections}
    />
  );
}
