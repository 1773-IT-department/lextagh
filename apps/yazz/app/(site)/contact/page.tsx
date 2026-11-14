import type { Metadata } from "next";
import Link from "next/link";
import ConsumerForm, { type ProductGroup } from "@/components/contact/ConsumerForm";
import s from "@/components/contact/contact.module.css";
import TradeForm from "@/components/contact/TradeForm";
import WhereToBuy from "@/components/contact/WhereToBuy";
import Icon from "@/components/Icon";
import { BRAND } from "@/content/brand";
import { isTopic } from "@/lib/forms/options";
import { getYazzProducts } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";
import { contact, socials, tel, whatsapp } from "@/lib/site";
import { ALL_REGIONS, getWhereToBuyRegions, getYazzStockists, type StockistItem } from "@/lib/where-to-buy";

export const metadata: Metadata = {
  title: "Contact & Where to Buy",
  description: "Find a shop that stocks Yazz® near you, contact Yazz consumer care, or send a trade and distributor enquiry to the Yazz team at Lexta Ghana Limited.",
  alternates: { canonical: "/contact" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().toLowerCase() : "");

/**
 * Contact & Where to Buy: the prototype's Contact Us page. Stockist finder (Yazz stockists, Leaflet map), consumer
 * form (CRM lead, or a complaint for a product problem), trade and distributor enquiry (CRM lead), contact details and
 * social links. Reads ?region=, ?product= and ?topic= so links from product pages arrive with their choices made.
 */
export default async function ContactPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [{ regions }, { products: all }] = await Promise.all([getWhereToBuyRegions(), getYazzProducts()]);
  // Coming soon items are not in the shops yet, so they are not offered here.
  const products = all.filter((p) => !p.comingSoon);
  const regionParam = one(sp.region);
  const regionFromUrl = regionParam === ALL_REGIONS || regions.some((r) => r.slug === regionParam);
  const region = regionFromUrl ? regionParam : ALL_REGIONS;
  let stockists: StockistItem[] | null;
  try { stockists = await getYazzStockists(region); } catch { stockists = null; }
  const productSlug = one(sp.product);
  const product = products.find((p) => p.slug === productSlug) ?? null;
  const topicParam = one(sp.topic);
  const topic = isTopic(topicParam) ? topicParam : "question";
  const groups: ProductGroup[] = RANGE_SLUGS.map((r) => ({ label: RANGES[r].name, options: products.filter((p) => p.range === r).map((p) => ({ slug: p.slug, name: p.name })) }))
    .filter((g) => g.options.length);

  const channels = [
    { icon: "phone", tone: "#ED1B2E", title: "Consumer Care", body: "Product questions, feedback or a pack that did not meet our standard.", action: contact.whatsappCare, href: whatsapp(contact.whatsappCare), label: "WhatsApp" },
    { icon: "truck", tone: "#0B4FA5", title: "Trade & Bulk Orders", body: "Distributors, wholesalers, shops and institutions: send us a trade enquiry.", action: "Trade enquiry", href: "#trade" },
    { icon: "pin", tone: "#15803D", title: "Find a Stockist", body: "Shops and distributors that stock Yazz, on the map.", action: "Open the locator", href: "#where-to-buy" },
    { icon: "mail", tone: "#EC1B7B", title: "Partnerships", body: "Partnerships and sponsorships with the Yazz team.", action: contact.partnershipsEmail, href: `mailto:${contact.partnershipsEmail}` },
  ];

  return (
    <>
      <section className={s.hero} aria-labelledby="contact-title">
        <p className="yz-eyebrow" style={{ color: "#FF8A95" }}>Get in touch</p>
        <h1 id="contact-title" className={s.heroTitle}>Talk to Yazz, or Find Us on a Shelf Near You</h1>
        <p className={s.heroBody}>{BRAND.consumerSupport}</p>
        <div className={s.heroActions}>
          <a href="#where-to-buy" className="yz-btn yz-btn--red">Find a Stockist <Icon name="pin" size={17} /></a>
          <a href="#message" className="yz-btn yz-btn--ghost-light">Send a Message</a>
        </div>
      </section>

      <section className={`yz-pad ${s.channels}`} aria-label="Ways to reach Yazz">
        {channels.map((c) => (
          <div key={c.title} className={s.channel}>
            <span style={{ color: c.tone }}><Icon name={c.icon} size={24} /></span>
            <h2>{c.title}</h2>
            <p>{c.body}</p>
            <a href={c.href} style={{ color: c.tone }} {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
              {c.label ? `${c.label} ${c.action}` : c.action} <Icon name="arrow" size={15} />
            </a>
          </div>
        ))}
      </section>

      <section id="where-to-buy" className={`yz-pad ${s.wtb}`} aria-labelledby="wtb-title">
        <p className="yz-eyebrow">Where to buy</p>
        <h2 id="wtb-title" className="yz-h2" style={{ marginTop: 10 }}>Find Yazz Near You</h2>
        <p className="yz-lead" style={{ marginTop: 12, maxWidth: 640 }}>Choose your region, search by town or shop, then tap a shop to see it on the map.</p>
        <WhereToBuy regions={regions} initialRegion={region} initial={stockists} regionFromUrl={regionFromUrl} product={product ? { slug: product.slug, name: product.name } : null} />
      </section>

      <section id="message" className={`yz-pad ${s.formRow}`} aria-label="Send us a message">
        <div className={s.formCard}>
          <p className="yz-eyebrow">Send us a message</p>
          <h2 id="message-title" className={s.formTitle}>How Can We Help?</h2>
          <p className={s.formIntro}>Tell us the product, batch information, purchase location and what happened. Your enquiry is handled by our consumer care team.</p>
          <ConsumerForm regions={regions} products={groups} initialTopic={topic} initialProduct={product?.slug ?? ""} initialRegion={regionFromUrl && region !== ALL_REGIONS ? region : ""} />
        </div>
        <aside className={s.sideCol} aria-label="Contact details">
          <div className={s.partnerCard}>
            <Icon name="truck" size={26} />
            <h2>Become a Yazz Partner</h2>
            <p>Distributor, wholesaler, shop or institution? Tell us your region and volumes and our trade team will come back to you.</p>
            <a href="#trade" className="yz-btn yz-btn--red">Trade enquiry <Icon name="arrow" size={16} /></a>
          </div>
          <div className={s.office}>
            <h2>Contact Yazz</h2>
            <p>{contact.company}<br />{contact.addressLines.join(", ")}</p>
            <ul>
              <li><Icon name="phone" size={16} /> <span>{contact.phones.map((p, i) => <span key={p}>{i > 0 && " / "}<a href={tel(p)}>{p}</a></span>)}</span></li>
              <li><Icon name="whatsapp" size={16} /> <span>WhatsApp care: <a href={whatsapp(contact.whatsappCare)} target="_blank" rel="noopener">{contact.whatsappCare}</a></span></li>
              <li><Icon name="shield" size={16} /> <span>Consumer reports: <a href={tel(contact.consumerReports)}>{contact.consumerReports}</a></span></li>
              <li><Icon name="mail" size={16} /> <span>Enquiries: <a href={`mailto:${contact.enquiriesEmail}`}>{contact.enquiriesEmail}</a></span></li>
              <li><Icon name="mail" size={16} /> <span>Complaints &amp; reviews: <a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a></span></li>
              <li><Icon name="mail" size={16} /> <span>Partnerships: <a href={`mailto:${contact.partnershipsEmail}`}>{contact.partnershipsEmail}</a></span></li>
              <li><Icon name="clock" size={16} /> <span>{contact.officeHours}</span></li>
            </ul>
          </div>
          <div id="social" className={s.socialCard}>
            <h2>Follow Yazz</h2>
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

      <section id="trade" className={`yz-pad ${s.tradeWrap}`} aria-labelledby="trade-title">
        <div className={s.trade}>
          <div className={s.tradeIntro}>
            <p className="yz-eyebrow" style={{ color: "#FF8A95" }}>Trade &amp; distribution</p>
            <h2 id="trade-title">Stock Yazz in Your Shop or Region</h2>
            <p>Distributors, wholesalers, shops, supermarkets, pharmacies and institutions: tell us about your business and what you would like to stock. Our trade team will come back to you with terms.</p>
            <p className={`yz-script ${s.tradeScript}`} aria-hidden="true">More Products.<br />More Smiles. <span>♥</span></p>
          </div>
          <TradeForm regions={regions} />
        </div>
      </section>

      <section className={`yz-pad ${s.quick}`} aria-labelledby="quick-title">
        <div>
          <p className="yz-eyebrow">Quick answers</p>
          <h2 id="quick-title" className="yz-h2" style={{ marginTop: 10 }}>Before You Write</h2>
          <p className="yz-lead" style={{ marginTop: 12 }}>Many questions about periods, our products and where to buy Yazz are answered in our FAQs.</p>
        </div>
        <div className={s.quickLinks}>
          <Link href="/faqs" className={s.quickLink}><Icon name="chat" size={20} /> Questions &amp; answers <Icon name="arrow" size={16} /></Link>
          <Link href="/tips?category=just-4-you" className={s.quickLink}><Icon name="heart" size={20} /> Tips Just 4 You <Icon name="arrow" size={16} /></Link>
          <Link href="/products" className={s.quickLink}><Icon name="box" size={20} /> All Yazz products <Icon name="arrow" size={16} /></Link>
        </div>
      </section>
    </>
  );
}
