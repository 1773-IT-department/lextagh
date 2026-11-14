import type { Metadata } from "next";
import Link from "next/link";
import ConsumerForm, { type ProductGroup } from "@/components/contact/ConsumerForm";
import s from "@/components/contact/contact.module.css";
import TradeForm from "@/components/contact/TradeForm";
import WhereToBuy from "@/components/contact/WhereToBuy";
import { Floaters, MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import { BRAND } from "@/content/brand";
import { isTopic } from "@/lib/forms/options";
import { getHoochProducts } from "@/lib/products";
import { contact, socials, tel, whatsapp } from "@/lib/site";
import { ALL_REGIONS, getHoochStockists, getWhereToBuyRegions, type StockistItem } from "@/lib/where-to-buy";

export const metadata: Metadata = {
  title: "Contact & Where to Buy",
  description: "Find a shop that stocks Hooch® near you, ask a question, share your breakfast experience, or send a distributor and business enquiry to the Hooch® team at Lexta Ghana Limited.",
  alternates: { canonical: "/contact" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().toLowerCase() : "");

/**
 * Contact & Where to Buy, with Lexta's Contact Us copy. Stockist finder (Hooch stockists, Leaflet map), consumer form
 * (CRM lead, or a complaint for a product problem), distributor and business enquiry (CRM lead), contact details and
 * social links. Reads ?region=, ?product= and ?topic= so links from product pages arrive with their choices made.
 */
export default async function ContactPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [{ regions }, { products: all }] = await Promise.all([getWhereToBuyRegions(), getHoochProducts()]);
  const products = all;
  const regionParam = one(sp.region);
  const regionFromUrl = regionParam === ALL_REGIONS || regions.some((r) => r.slug === regionParam);
  const region = regionFromUrl ? regionParam : ALL_REGIONS;
  let stockists: StockistItem[] | null;
  try { stockists = await getHoochStockists(region); } catch { stockists = null; }
  const productSlug = one(sp.product);
  const product = products.find((p) => p.slug === productSlug) ?? null;
  const topicParam = one(sp.topic);
  const topic = isTopic(topicParam) ? topicParam : "question";
  const groups: ProductGroup[] = [{ label: "Hooch® cereals", options: products.map((p) => ({ slug: p.slug, name: p.name })) }];

  // Lexta's Contact Us routes: a product question, feedback, a distribution enquiry or a partnership opportunity.
  const ways = [
    { icon: "bowl", tone: "lilac", title: "Product Questions", body: "Have a question about Hooch® products? Ask about our cereals, packs, ingredients and how to enjoy them.", action: "Ask a question", href: "/contact?topic=question#message" },
    { icon: "heart", tone: "mint", title: "Share Your Breakfast Experience", body: "At Hooch®, we value the families and consumers who make us part of their daily routines.", action: "Share your experience", href: "/contact?topic=feedback#message" },
    { icon: "shield", tone: "berry", title: "Complaints & Product Reviews", body: "A concern about a Hooch® product? Tell us and our consumer care team will contact you.", action: "Report a problem", href: "/contact?topic=problem#message" },
    { icon: "truck", tone: "butter", title: "Distribution Enquiries", body: "Interested in stocking or distributing Hooch®? Talk to our team about availability and distribution.", action: "Trade enquiry", href: "#trade" },
    { icon: "handshake", tone: "lilac", title: "Partnerships & Sponsorships", body: "Partnership, sponsorship and community opportunities with Hooch®.", action: "Send a proposal", href: "/contact?topic=partnership#message" },
  ];

  return (
    <>
      <section className={s.hero} aria-labelledby="contact-title">
        <Floaters count={10} seed={31} />
        <div className={`hc-wrap ${s.heroInner}`}>
          <p className="hc-sticker" style={{ background: "#fff" }}>{BRAND.contact.eyebrow}</p>
          <h1 id="contact-title" className={s.heroTitle}>{BRAND.contact.title}</h1>
          {BRAND.contact.body.map((p) => <p key={p} className={s.heroBody}>{p}</p>)}
          <div className={s.heroActions}>
            <a href="#where-to-buy" className="hc-btn hc-btn--red"><Icon name="pin" size={18} /> Find a Stockist</a>
            <a href="#message" className="hc-btn">Send Us a Message <Icon name="arrow" size={18} /></a>
          </div>
        </div>
        <MilkWave style={{ marginTop: 30 }} />
      </section>

      <section className={`hc-wrap ${s.ways}`} aria-labelledby="ways-title">
        <h2 id="ways-title" className="hc-h2">How Can We Help You?</h2>
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

      <section id="where-to-buy" className={`hc-wrap ${s.wtb}`} aria-labelledby="wtb-title">
        <p className="hc-eyebrow">Where to buy</p>
        <h2 id="wtb-title" className="hc-h2" style={{ marginTop: 12 }}>Find Hooch® Near You</h2>
        <p className="hc-lead" style={{ marginTop: 14, maxWidth: 640 }}>Choose your region, search by town or shop, then tap a shop to see it on the map.</p>
        <WhereToBuy regions={regions} initialRegion={region} initial={stockists} regionFromUrl={regionFromUrl} product={product ? { slug: product.slug, name: product.name } : null} />
      </section>

      <section id="message" className={`hc-wrap ${s.formRow}`} aria-label="Send us a message">
        <div className={s.formCard}>
          <p className="hc-eyebrow">Send us a message</p>
          <h2 id="message-title" className={s.formTitle}>Send Us a Message</h2>
          <p className={s.formIntro}>Whether it&apos;s a product question, feedback, distribution enquiry or partnership opportunity, we&apos;re here to listen.</p>
          <ConsumerForm regions={regions} products={groups} initialTopic={topic} initialProduct={product?.slug ?? ""} initialRegion={regionFromUrl && region !== ALL_REGIONS ? region : ""} />
        </div>
        <aside className={s.sideCol} aria-label="Contact details">
          <div className={s.checklist}>
            <h2>Reporting a concern?</h2>
            <p>Where you can, include the product name, pack size, batch number, and where and when you bought it. Our team will review your submission and advise on the next steps.</p>
          </div>
          <div className={s.office}>
            <h2>Get in Touch</h2>
            <p><strong>Hooch® Foods</strong><br />A brand of {contact.company}<br />{contact.addressLines.join(", ")}</p>
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
            <h2>Stay Connected</h2>
            <p>Follow the Lexta Ghana Limited channel on WhatsApp.</p>
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

      <section id="trade" className={`hc-wrap ${s.tradeWrap}`} aria-labelledby="trade-title">
        <div className={s.trade}>
          <div className={s.tradeIntro}>
            <p className="hc-eyebrow" style={{ color: "var(--hc-sun)" }}>Distributors and business enquiries</p>
            <h2 id="trade-title">Stock Hooch® in Your Shop or Region</h2>
            <p>Interested in stocking or distributing Hooch® Cornflakes and Hooch® Frosted Flakes? Contact our team to discuss product availability and distribution opportunities.</p>
            <p className={s.tradeMail}><Icon name="mail" size={17} /> <a href={`mailto:${contact.tradeEmail}`}>{contact.tradeEmail}</a></p>
          </div>
          <TradeForm regions={regions} />
        </div>
      </section>

      <section className={`hc-wrap ${s.quick}`} aria-labelledby="quick-title">
        <div>
          <h2 id="quick-title" className="hc-h2">Before You Write</h2>
          <p className="hc-lead" style={{ marginTop: 14 }}>Questions about our cereals, recipes and family breakfast tips may already be answered here.</p>
        </div>
        <div className={s.quickLinks}>
          <Link href="/nutrition#faqs" className={s.quickLink}><Icon name="chat" size={22} /> Product FAQs <Icon name="arrow" size={18} /></Link>
          <Link href="/recipes" className={s.quickLink}><Icon name="spoon" size={22} /> Breakfast Ideas &amp; Recipes <Icon name="arrow" size={18} /></Link>
          <Link href="/products" className={s.quickLink}><Icon name="bowl" size={22} /> Our Products <Icon name="arrow" size={18} /></Link>
        </div>
      </section>
    </>
  );
}
