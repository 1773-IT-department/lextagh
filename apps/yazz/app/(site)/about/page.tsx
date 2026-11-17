import type { Metadata } from "next";
import Link from "next/link";
import s from "@/components/about/about.module.css";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { BRAND } from "@/content/brand";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";
import { contact, lexta, tel } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "About Us",
  description: "Yazz® is a trademark brand of Lexta Ghana Limited, created to provide dependable, quality-driven products that support the everyday needs of individuals, families and households.",
  alternates: { canonical: "/about" },
};

/** About Us: the prototype's About page with Lexta's brand content. Questions and answers are on /faqs. */
export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "About Us" }]} />
      <section className={s.hero} aria-labelledby="about-title">
        <div className={s.heroText}>
          <p className="yz-eyebrow">About Yazz®</p>
          <h1 id="about-title" className={s.heroTitle}>Trusted Quality for Everyday <em>Living.</em></h1>
          <p className={s.heroBody}>{BRAND.about[0]}</p>
          <a href="#story" className="yz-btn yz-btn--red">Our Story <Icon name="arrow" size={17} /></a>
        </div>
        <div className={s.heroPic}>
          <Photo image={null} needed="factory photo: Lexta personnel at work in Yazz outfits" icon="people" />
        </div>
      </section>

      <section id="story" className={`yz-pad ${s.who}`} aria-labelledby="who-title">
        <div className={s.whoPic}><Photo image={null} needed="Yazz production line or quality team photo" icon="sparkle" /></div>
        <div className={s.whoText}>
          <p className="yz-eyebrow">Who we are</p>
          <h2 id="who-title" className={s.blueTitle}>A Growing Ghanaian Brand</h2>
          <p>{BRAND.about[1]}</p>
          <p>{BRAND.trademarkLine} Our promise is grounded in quality, reliability, value, innovation, consumer care and accessibility. We listen, learn and improve to support families across generations.</p>
        </div>
      </section>

      <section className={`yz-pad ${s.promise}`} aria-labelledby="promise-title">
        <p className="yz-eyebrow" style={{ textAlign: "center" }}>Our promise</p>
        <h2 id="promise-title" className="yz-h2" style={{ textAlign: "center", marginTop: 10 }}>The Yazz® Promise</h2>
        {BRAND.promiseIntro.map((p) => <p key={p} className={s.center}>{p}</p>)}
        <div className={s.promiseGrid}>
          {BRAND.promise.map((p) => (
            <div key={p.title} className={s.promiseCard} style={{ background: p.bg }}>
              <span style={{ color: p.tone }}><Icon name={p.icon} size={30} /></span>
              <h3 style={{ color: p.tone }}>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.lexta} aria-labelledby="lexta-title">
        <div>
          <p className="yz-eyebrow">Our roots</p>
          <h2 id="lexta-title" className="yz-h2" style={{ marginTop: 10 }}>{BRAND.lexta.title}</h2>
          {BRAND.lexta.body.map((p) => <p key={p} className={s.para}>{p}</p>)}
          <a href={lexta.home} target="_blank" rel="noopener" className="yz-textlink" style={{ marginTop: 18 }}>Visit Lexta Ghana Limited <Icon name="arrow" size={15} /></a>
        </div>
        <div className={s.lextaNote} aria-hidden="true">
          <p className="yz-script">From Ghana,<br />beyond borders. <span>♥</span></p>
          <span className="yz-flagbars"><i /><i /><i /></span>
        </div>
      </section>

      <section className={`yz-pad ${s.oneBrand}`} aria-labelledby="one-title">
        <div>
          <p className="yz-eyebrow">One brand.</p>
          <h2 id="one-title" className={s.blueTitle}>Everyday Possibilities.</h2>
          <p className={s.para}>From feminine care and baby essentials to oral care, home care and tissues, Yazz brings practical care into the moments that matter.</p>
          <Link href="/products" className="yz-btn yz-btn--red" style={{ marginTop: 22 }}>Explore Products <Icon name="arrow" size={17} /></Link>
        </div>
        <div className={s.rangeTiles}>
          {RANGE_SLUGS.map((slug) => {
            const r = RANGES[slug];
            return (
              <Link key={slug} href={`/products/${slug}`} className={s.rangeTile} style={{ background: r.tone.soft, color: r.tone.accent }}>
                <Icon name={r.icon} size={26} />
                <strong>{r.name} <Icon name="arrow" size={16} /></strong>
                <span>{r.tagline}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={`yz-pad ${s.vm}`} aria-label="Vision and mission">
        <div className={s.vmPic}><Photo image={{ src: "/images/full-range.webp", alt: "The Yazz range of everyday essentials" }} needed="" /></div>
        <div className={s.vmCard} style={{ background: "#FCECEE" }}>
          <span style={{ color: "#ED1B2E" }}><Icon name="eye" size={30} /></span>
          <h2 style={{ color: "#ED1B2E" }}>Our Vision</h2>
          <p>{BRAND.vision}</p>
        </div>
        <div className={s.vmCard} style={{ background: "#EAF2FD" }}>
          <span style={{ color: "#0B4FA5" }}><Icon name="target" size={30} /></span>
          <h2 style={{ color: "#0B4FA5" }}>Our Mission</h2>
          <p>{BRAND.mission}</p>
        </div>
      </section>

      <section className={`yz-pad ${s.generations}`} aria-labelledby="gen-title">
        <div>
          <p className="yz-eyebrow">Generations of trust</p>
          <h2 id="gen-title" className={s.blueTitle}>{BRAND.generations.title}</h2>
          {BRAND.generations.lines.map((l) => <p key={l} className={s.line}>{l}</p>)}
          {BRAND.generations.body.map((p) => <p key={p} className={s.para}>{p}</p>)}
          <p className={`yz-script ${s.sign}`}>{BRAND.generations.sign}</p>
        </div>
        <div className={s.genPic}><Photo image={null} needed="family photo with Yazz products at home" icon="people" /></div>
      </section>

      <section className={`yz-pad ${s.markWrap}`} aria-labelledby="mark-title">
        <div className={s.mark}>
          <div className={s.markLogo} aria-hidden="true"><span className="yz-logo"><span style={{ fontSize: 46 }}>Yazz</span></span><span className={s.reg}>®</span></div>
          <div>
            <p className="yz-eyebrow">Genuine Yazz®</p>
            <h2 id="mark-title" className={s.blueTitle}>{BRAND.mark.title}</h2>
            {BRAND.mark.body.map((p) => <p key={p} className={s.para}>{p}</p>)}
            <p className={s.whistle}>
              <Icon name="shield" size={18} /> {BRAND.mark.whistle.replace(" +233 50 996 7400 or support@yazzproducts.com.", "")}{" "}
              <a href={tel(contact.consumerReports)}>{contact.consumerReports}</a> or <a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a>.
            </p>
            <details className={s.notice}>
              <summary>Trademark notice</summary>
              <p>{BRAND.trademarkNotice}</p>
              <p>{BRAND.copyright}</p>
            </details>
          </div>
        </div>
      </section>

      <section className={`yz-pad ${s.impact}`} aria-labelledby="impact-title">
        <div className={s.impactBox}>
          <div>
            <p className="yz-eyebrow">Lexta CSR</p>
            <h2 id="impact-title" className={s.blueTitle}>Community Impact</h2>
            {/* The six Yazz initiatives, named as in Lexta's CSR content (docs/content/yazz/csr.md). */}
            <p className={s.para}>Empowered Periods, Dignity Project. Cervical Cancer Awareness. Forest Project, Powered by Lexta. Clean Hands, Green Land. The &ldquo;Safe Bottoms&rdquo; Initiative. The &ldquo;Bright Smiles&rdquo; School Tour.</p>
          </div>
          <a href={lexta.csr} target="_blank" rel="noopener" className="yz-btn yz-btn--red">Our Impact at Lexta <Icon name="arrow" size={17} /></a>
        </div>
      </section>

      <section className={`yz-pad ${s.faqLink}`} aria-labelledby="faq-card-title">
        <div className={s.faqCard}>
          <div>
            <p className="yz-eyebrow">Help centre</p>
            <h2 id="faq-card-title">Questions &amp; Answers</h2>
            <p>Frequently asked period and product questions.</p>
          </div>
          <Link href="/faqs" className="yz-btn yz-btn--red">Read the FAQs <Icon name="arrow" size={17} /></Link>
        </div>
      </section>

      <section className={s.red} aria-labelledby="red-title">
        <h2 id="red-title">Caring Brand<br /><em>for Caring Families.</em></h2>
        <p>Yazz® Trusted Quality for Everyday Living.</p>
        <div className={s.redActions}>
          <Link href="/products" className="yz-btn yz-btn--white">Explore Products <Icon name="arrow" size={17} /></Link>
          <Link href="/contact#where-to-buy" className="yz-btn yz-btn--ghost-light"><Icon name="pin" size={17} /> Where to Buy</Link>
        </div>
      </section>

    </>
  );
}
