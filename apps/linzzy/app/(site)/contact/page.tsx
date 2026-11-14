import type { Metadata } from "next";
import Link from "next/link";
import ConsumerForm, { type ProductGroup } from "@/components/contact/ConsumerForm";
import s from "@/components/contact/contact.module.css";
import TradeForm from "@/components/contact/TradeForm";
import WhereToBuy from "@/components/contact/WhereToBuy";
import Icon from "@/components/Icon";
import { BRAND } from "@/content/brand";
import { isTopic } from "@/lib/forms/options";
import { getLinzzyProducts } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";
import { contact, socials, tel, whatsapp } from "@/lib/site";
import { ALL_REGIONS, getLinzzyStockists, getWhereToBuyRegions, type StockistItem } from "@/lib/where-to-buy";

export const metadata: Metadata = {
  title: "Contact & Where to Buy",
  description: "Find a shop that stocks Linzzy near you, contact Linzzy consumer care, or send a distributor and business enquiry to the Linzzy team at Lexta Ghana Limited.",
  alternates: { canonical: "/contact" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().toLowerCase() : "");

/**
 * Contact & Where to Buy, with Lexta's Contact Us copy. Stockist finder (Linzzy stockists, Leaflet map), consumer form
 * (CRM lead, or a complaint for a product problem), distributor and business enquiry (CRM lead), contact details and
 * social links. Reads ?region=, ?product= and ?topic= so links from product pages arrive with their choices made.
 */
export default async function ContactPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [{ regions }, { products: all }] = await Promise.all([getWhereToBuyRegions(), getLinzzyProducts()]);
  // Coming soon items are not in the shops yet, so they are not offered here.
  const products = all.filter((p) => !p.comingSoon);
  const regionParam = one(sp.region);
  const regionFromUrl = regionParam === ALL_REGIONS || regions.some((r) => r.slug === regionParam);
  const region = regionFromUrl ? regionParam : ALL_REGIONS;
  let stockists: StockistItem[] | null;
  try { stockists = await getLinzzyStockists(region); } catch { stockists = null; }
  const productSlug = one(sp.product);
  const product = products.find((p) => p.slug === productSlug) ?? null;
  const topicParam = one(sp.topic);
  const topic = isTopic(topicParam) ? topicParam : "question";
  const groups: ProductGroup[] = RANGE_SLUGS.map((r) => ({ label: RANGES[r].name, options: products.filter((p) => p.range === r).map((p) => ({ slug: p.slug, name: p.name })) }))
    .filter((g) => g.options.length);

  // Lexta's "How Can We Help You?" routes.
  const ways = [
    { icon: "box", tone: "lilac", title: "Product Information", body: "Have questions about our sanitary towels, panty liners, baby diapers or baby wipes? Contact us for information about product options, packaging, sizing and recommended usage.", action: "Ask a question", href: "/contact?topic=question#message" },
    { icon: "shield", tone: "berry", title: "Consumer Feedback and Complaints", body: "Your experience helps us improve. If you have a concern about a Linzzy product, please contact our customer support team directly.", action: "Report a problem", href: "/contact?topic=problem#message" },
    { icon: "truck", tone: "mint", title: "Distributors and Business Enquiries", body: "Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries.", action: "Trade enquiry", href: "#trade" },
    { icon: "people", tone: "butter", title: "CSR and Community Partnerships", body: "Would you like to collaborate with Linzzy on hygiene education, community development or family care initiatives? We welcome relevant proposals for consideration.", action: "Send a proposal by email", href: `mailto:${contact.partnershipsEmail}` },
    { icon: "sparkle", tone: "lilac", title: "Media and Brand Collaborations", body: "For brand partnerships, media enquiries, educational campaigns and promotional collaborations, please contact our team.", action: "Send a message", href: "/contact?topic=partnership#message" },
  ];

  return (
    <>
      <section className={s.hero} aria-labelledby="contact-title">
        <div className={`lz-wrap ${s.heroInner}`}>
          <p className="lz-eyebrow" style={{ color: "var(--lz-mint)" }}>{BRAND.contact.eyebrow}</p>
          <h1 id="contact-title" className={s.heroTitle}>{BRAND.contact.title}</h1>
          {BRAND.contact.body.map((p) => <p key={p} className={s.heroBody}>{p}</p>)}
          <div className={s.heroActions}>
            <a href="#where-to-buy" className="lz-btn lz-btn--mint"><Icon name="pin" size={18} /> Find a Stockist</a>
            <a href="#message" className="lz-btn">Send Us a Message <Icon name="arrow" size={18} /></a>
          </div>
          <span className={`lz-sticker ${s.heroSticker}`} aria-hidden="true">{BRAND.contact.sticker}</span>
        </div>
      </section>

      <section className={`lz-wrap ${s.ways}`} aria-labelledby="ways-title">
        <h2 id="ways-title" className="lz-h2">How Can We Help You?</h2>
        <div className={s.wayGrid}>
          {ways.map((w) => (
            <div key={w.title} className={s.way} data-tone={w.tone}>
              <span className={s.wayIcon}><Icon name={w.icon} size={24} /></span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
              <a href={w.href} className={s.wayLink}>{w.action} <Icon name="arrow" size={16} /></a>
            </div>
          ))}
        </div>
      </section>

      <section id="where-to-buy" className={`lz-wrap ${s.wtb}`} aria-labelledby="wtb-title">
        <p className="lz-eyebrow">Where to buy</p>
        <h2 id="wtb-title" className="lz-h2" style={{ marginTop: 12 }}>Find Linzzy Near You</h2>
        <p className="lz-lead" style={{ marginTop: 14, maxWidth: 640 }}>Choose your region, search by town or shop, then tap a shop to see it on the map.</p>
        <WhereToBuy regions={regions} initialRegion={region} initial={stockists} regionFromUrl={regionFromUrl} product={product ? { slug: product.slug, name: product.name } : null} />
      </section>

      <section id="message" className={`lz-wrap ${s.formRow}`} aria-label="Send us a message">
        <div className={s.formCard}>
          <p className="lz-eyebrow">Send us a message</p>
          <h2 id="message-title" className={s.formTitle}>Send Us a Message</h2>
          <p className={s.formIntro}>Complete the contact form and select the subject that best describes your enquiry.</p>
          <ConsumerForm regions={regions} products={groups} initialTopic={topic} initialProduct={product?.slug ?? ""} initialRegion={regionFromUrl && region !== ALL_REGIONS ? region : ""} />
        </div>
        <aside className={s.sideCol} aria-label="Contact details">
          <div className={s.checklist}>
            <h2>Reporting a concern?</h2>
            <p>Where relevant, kindly provide:</p>
            <ul>{BRAND.contact.complaintChecklist.map((c) => <li key={c}><Icon name="check" size={17} /> {c}</li>)}</ul>
            <p>Our team will review your submission and advise on the appropriate next steps.</p>
          </div>
          <div className={s.office}>
            <h2>Get in Touch</h2>
            <p><strong>Linzzy Products</strong><br />A brand of {contact.company}<br />{contact.addressLines.join(", ")}</p>
            <ul>
              <li><Icon name="phone" size={17} /> <span>{contact.phones.map((p, i) => <span key={p}>{i > 0 && " / "}<a href={tel(p)}>{p}</a></span>)}</span></li>
              <li><Icon name="whatsapp" size={17} /> <span>WhatsApp Customer Care: <a href={whatsapp(contact.whatsappCare)} target="_blank" rel="noopener">{contact.whatsappCare}</a></span></li>
              <li><Icon name="shield" size={17} /> <span>Consumer Reports: <a href={tel(contact.consumerReports)}>{contact.consumerReports}</a></span></li>
              <li><Icon name="mail" size={17} /> <span>Enquiries: <a href={`mailto:${contact.enquiriesEmail}`}>{contact.enquiriesEmail}</a></span></li>
              <li><Icon name="mail" size={17} /> <span>Complaints &amp; product reviews: <a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a></span></li>
              <li><Icon name="mail" size={17} /> <span>Partnerships &amp; sponsorships: <a href={`mailto:${contact.partnershipsEmail}`}>{contact.partnershipsEmail}</a></span></li>
              <li><Icon name="clock" size={17} /> <span>{contact.officeHours}</span></li>
            </ul>
          </div>
          <div id="social" className={s.socialCard}>
            <h2>Connect With Our Community</h2>
            <p>{BRAND.contact.social}</p>
            <ul>
              {socials.map((x) => (
                <li key={x.icon}>
                  {x.href ? (
                    <a href={x.href} target="_blank" rel="noopener"><Icon name={x.icon} size={18} /> {x.label}</a>
                  ) : (
                    <span><Icon name={x.icon} size={18} /> {x.label} <em>[PLACEHOLDER: link from Lexta]</em></span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section id="trade" className={`lz-wrap ${s.tradeWrap}`} aria-labelledby="trade-title">
        <div className={s.trade}>
          <div className={s.tradeIntro}>
            <p className="lz-eyebrow" style={{ color: "var(--lz-mint)" }}>Distributors and business enquiries</p>
            <h2 id="trade-title">Stock Linzzy in Your Shop or Region</h2>
            <p>Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries.</p>
            <p className={s.tradeMail}><Icon name="mail" size={17} /> <a href={`mailto:${contact.tradeEmail}`}>{contact.tradeEmail}</a></p>
          </div>
          <TradeForm regions={regions} />
        </div>
      </section>

      <section className={`lz-wrap ${s.quick}`} aria-labelledby="quick-title">
        <div>
          <h2 id="quick-title" className="lz-h2">Before You Write</h2>
          <p className="lz-lead" style={{ marginTop: 14 }}>Many questions about our products, periods, baby care and where to buy Linzzy are answered in our FAQs.</p>
        </div>
        <div className={s.quickLinks}>
          <Link href="/faqs" className={s.quickLink}><Icon name="chat" size={22} /> Questions &amp; answers <Icon name="arrow" size={18} /></Link>
          <Link href="/tips" className={s.quickLink}><Icon name="book" size={22} /> Tips &amp; Advice <Icon name="arrow" size={18} /></Link>
          <Link href="/products" className={s.quickLink}><Icon name="box" size={22} /> All Linzzy products <Icon name="arrow" size={18} /></Link>
        </div>
      </section>
    </>
  );
}
