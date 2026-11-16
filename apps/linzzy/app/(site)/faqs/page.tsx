import type { Metadata } from "next";
import { FAQ } from "@/components/linzzy/faq-data";
import FaqsClient from "@/components/linzzy/pages/FaqsClient";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers on Linzzy sanitary towels, panty liners, baby diapers and baby wipes, where to buy Linzzy and who makes it.",
  alternates: { canonical: "/faqs" },
  openGraph: { title: "FAQs | Linzzy", url: "/faqs" },
};

/** FAQs (Linzzy FAQs.dc.html), with FAQPage structured data for search engines. */
export default function FaqsPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((g) => g.items).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <FaqsClient />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
