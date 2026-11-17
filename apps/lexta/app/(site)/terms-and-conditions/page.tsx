import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

// Title from terms-and-conditions.html.
const title = "Terms & Conditions | Lexta Ghana";
const description = "Terms & Conditions of Lexta Ghana Limited.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * Lexta has not supplied its terms. The text 1773 wrote earlier was removed in the strict source sweep (Desmond:
 * only content from Lexta's Drive and lextagh.com); the terms come from Lexta's legal adviser.
 */
export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms & Conditions"
      intro="[PLACEHOLDER: Lexta terms and conditions text, for Lexta legal to supply]"
      updated="[PLACEHOLDER: date Lexta approves these terms]"
      sections={[]}
    />
  );
}
