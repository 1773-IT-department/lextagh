import type { Metadata } from "next";
import Link from "next/link";
import Faq from "@/components/faqs/Faq";
import s from "@/components/faqs/faqs.module.css";
import Icon from "@/components/Icon";
import { FAQ_GROUPS } from "@/content/faqs";
import { contact, whatsapp } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers on Linzzy sanitary towels, panty liners, baby diapers and baby wipes, where to buy Linzzy and who makes it.",
  alternates: { canonical: "/faqs" },
  openGraph: { title: "FAQs | Linzzy", url: "/faqs" },
};

/**
 * FAQs: hero, topic chips and search, the grouped accordion (answers in Lexta's own words, content/faqs.ts) and the
 * help cards. Each answer is a <details> element, so the accordion works by keyboard and without JavaScript.
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
        <div className="lz-wrap">
          <span className="lz-sticker">FAQs</span>
          <h1 id="faqs-title" className={s.heroTitle}>Got a question? <span>Let&apos;s explore it together.</span></h1>
          <p className={s.heroBody}>Answers on our sanitary towels, panty liners, baby diapers and baby wipes, and where to buy Linzzy.</p>
        </div>
      </section>

      <div className={`lz-wrap ${s.faqWrap}`}>
        <Faq groups={FAQ_GROUPS} />
        <aside className={s.faqSide} aria-label="More help">
          <div className={s.help}>
            <span className={s.helpIcon}><Icon name="chat" size={26} /></span>
            <h2>Still have a question?</h2>
            <p>Every question matters. Our team is ready to hear from you.</p>
            <Link href="/contact#message" className="lz-btn lz-btn--berry lz-btn--sm" style={{ width: "100%" }}>Contact us <Icon name="arrow" size={16} /></Link>
            <a href={whatsapp(contact.whatsappCare)} className="lz-btn lz-btn--sm" style={{ width: "100%", marginTop: 12 }} target="_blank" rel="noopener">
              <Icon name="whatsapp" size={17} /> WhatsApp {contact.whatsappCare}
            </a>
          </div>
          <div className={s.bulk}>
            <h2>Distributing or stocking Linzzy?</h2>
            <p>Contact our team to discuss product availability, distribution opportunities and commercial enquiries.</p>
            <Link href="/contact#trade" className="lz-textlink">Trade enquiry <Icon name="arrow" size={16} /></Link>
          </div>
        </aside>
      </div>

      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
