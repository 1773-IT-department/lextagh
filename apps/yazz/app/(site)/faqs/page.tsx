import type { Metadata } from "next";
import Link from "next/link";
import Faq from "@/components/faqs/Faq";
import s from "@/components/faqs/faqs.module.css";
import Icon from "@/components/Icon";
import { FAQ_GROUPS } from "@/content/faqs";
import { contact, whatsapp } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers on periods and puberty, Yazz® products, where to buy Yazz and trade, from the Yazz team at Lexta Ghana Limited.",
  alternates: { canonical: "/faqs" },
  openGraph: { title: "FAQs | Yazz®", url: "/faqs" },
};

/**
 * FAQs: the prototype's Yazz FAQs page. Hero, topic chips and search, the grouped accordion (answers from Lexta's
 * content, content/faqs.ts; anything Lexta must still confirm is a marked placeholder) and the help cards.
 * Each answer is a <details> element, so the accordion works by keyboard and without JavaScript.
 */
export default function FaqsPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items).filter((i) => !i.a.startsWith("[PLACEHOLDER")).map((i) => ({
      "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  return (
    <>
      <section className={s.hero} aria-labelledby="faqs-title">
        <p className="yz-eyebrow" style={{ color: "#FF8A95" }}>Help centre</p>
        <h1 id="faqs-title" className={s.heroTitle}>How can we help?</h1>
        <p className={s.heroBody}>Answers on periods and puberty, our products, where to buy Yazz® and trade.</p>
      </section>

      <div className={`yz-pad ${s.faqWrap}`}>
        <Faq groups={FAQ_GROUPS} />
        <aside className={s.faqSide} aria-label="More help">
          <div className={s.help}>
            <span style={{ color: "#ED1B2E" }}><Icon name="chat" size={26} /></span>
            <h2>Still have a question? Contact us</h2>
            <p>Our consumer care team is here to listen, serve and support.</p>
            <Link href="/contact" className="yz-btn yz-btn--red yz-btn--sm" style={{ width: "100%" }}>Contact us <Icon name="arrow" size={15} /></Link>
            <a href={whatsapp(contact.whatsappCare)} className="yz-btn yz-btn--outline yz-btn--sm" style={{ width: "100%", marginTop: 10 }} target="_blank" rel="noopener">
              <Icon name="whatsapp" size={16} /> WhatsApp {contact.whatsappCare}
            </a>
          </div>
          <div className={s.bulk}>
            <h2>Buying in bulk?</h2>
            <p>Distributors, wholesalers, shops and institutions can send our trade team an enquiry.</p>
            <Link href="/contact#trade" className="yz-textlink">Trade enquiry <Icon name="arrow" size={15} /></Link>
          </div>
        </aside>
      </div>

      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
