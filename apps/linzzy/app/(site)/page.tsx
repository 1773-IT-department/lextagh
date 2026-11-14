import type { Metadata } from "next";
import Link from "next/link";
import s from "@/components/home/home.module.css";
import Icon from "@/components/Icon";
import Marquee from "@/components/Marquee";
import Photo from "@/components/Photo";
import ProductCard from "@/components/products/ProductCard";
import { productAnchor } from "@/components/products/ProductDialog";
import ArticleCard from "@/components/tips/ArticleCard";
import tc from "@/components/tips/tips.module.css";
import { ARTICLES } from "@/content/articles";
import { BRAND } from "@/content/brand";
import { getLinzzyProducts } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";
import { lexta } from "@/lib/site";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Linzzy | Gentle Care for Bright Beginnings" },
  description: "Linzzy, a feminine, maternal and baby care brand of Lexta Ghana Limited. Sanitary towels, panty liners, baby diapers and baby wipes for everyday cleanliness, comfort and confidence.",
  alternates: { canonical: "/" },
};

/** Lexta's taglines for the ticker strip. */
const TICKER = [
  "Gentle Care for Bright Beginnings",
  "Your flow. Your comfort. Your choice.",
  "Absorb. Lock. Breathe.",
  "Little Moments. Loving Care. Brighter Beginnings.",
  "Everyday care, made simple.",
  "Your Comfort. Your Confidence. Your Everyday Care.",
];

export default async function HomePage() {
  const { products: all } = await getLinzzyProducts();
  const products = all.filter((p) => !p.comingSoon);
  // Highlights: the first product of each range, in Product Management's order, then the rest, up to 4.
  const firsts = RANGE_SLUGS.map((r) => products.find((p) => p.range === r)).filter((p) => !!p);
  const featured = [...firsts, ...products.filter((p) => !firsts.includes(p))].slice(0, 4);
  const reads = [ARTICLES.find((a) => a.slug === "know-your-flow"), ARTICLES.find((a) => a.slug === "the-perfect-diaper-bag"), ARTICLES.find((a) => a.slug === "beyond-the-pad")].filter((a) => !!a);
  const fem = RANGES["feminine-care"];
  const baby = RANGES["baby-care"];

  return (
    <>
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={`lz-wrap ${s.heroGrid}`}>
          <div className={s.heroText}>
            <span className="lz-sticker lz-sticker--mint">{BRAND.hero.eyebrow}</span>
            <h1 id="hero-title" className={s.heroTitle}>
              Gentle Care <span className={s.heroPill}>for Bright</span> Beginnings
            </h1>
            <p className={s.heroSub}>{BRAND.hero.sub}</p>
            <p className={s.heroBody}>{BRAND.hero.body.join(" ")}</p>
            <div className={s.heroActions}>
              <Link href="/products" className="lz-btn lz-btn--berry">Explore Our Products <Icon name="arrow" size={18} /></Link>
              <Link href="/contact#where-to-buy" className="lz-btn"><Icon name="pin" size={18} /> Where to Buy</Link>
            </div>
          </div>
          <div className={s.collage}>
            <div className={`${s.blobBig} lz-blob`}>
              <Photo image={{ src: "/images/original/banner-on-the-go.webp", alt: "A confident young woman walking with her bag beside packs of Linzzy sanitary towels" }} needed="" eager position="78% center" />
            </div>
            <div className={`${s.blobSmall} lz-blob`}>
              <Photo image={{ src: "/images/nursery/mum-changing.webp", alt: "A smiling mother changing her laughing baby's diaper, with Linzzy Baby Diapers and Baby Wipes nearby" }} needed="" eager position="70% center" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={`${s.pack} ${s.packA}`} src="/images/original/pad-heavy-flow.webp" alt="" width={242} height={179} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={`${s.pack} ${s.packB}`} src="/images/original/baby-diapers.webp" alt="" width={379} height={445} />
            <span className={`lz-sticker ${s.stickA}`} aria-hidden="true">{fem.sticker}</span>
            <span className={`lz-sticker lz-sticker--lilac ${s.stickB}`} aria-hidden="true">Little Moments. Loving Care.</span>
            <Icon name="star" size={44} className={s.starA} strokeWidth={2.2} />
            <Icon name="sparkle" size={38} className={s.starB} strokeWidth={2.2} />
          </div>
        </div>
      </section>

      <Marquee items={TICKER} label="Linzzy taglines" />

      <section className={`lz-wrap lz-section ${s.grows}`} aria-labelledby="grows-title">
        <div className={s.growsHead}>
          <h2 id="grows-title" className="lz-h2">{BRAND.grows.title}</h2>
          <div className={s.growsIntro}>
            {BRAND.welcome.map((p) => <p key={p} className="lz-lead">{p}</p>)}
            <p className="lz-lead"><strong>{BRAND.grows.body[0]}</strong> {BRAND.grows.body[1]} {BRAND.grows.body[2]}</p>
          </div>
        </div>
        <div className={s.journeys}>
          {[fem, baby].map((r) => (
            <article key={r.slug} className={s.journey} data-mood={r.mood} aria-labelledby={`journey-${r.slug}`}>
              <div className={`${s.journeyPic} lz-blob`}>
                <Photo
                  image={r.slug === "feminine-care"
                    ? { src: "/images/original/flow-focus-grow.webp", alt: "A young woman in a confident yoga pose next to a stack of Linzzy sanitary towel packs" }
                    : { src: "/images/nursery/joyful-baby.webp", alt: "A smiling baby on a soft blanket beside Linzzy Baby Diapers" }}
                  needed="" position={r.slug === "feminine-care" ? "center 30%" : "30% center"}
                />
              </div>
              <div className={s.journeyText}>
                <p className={s.journeyEyebrow}><Icon name={r.icon} size={20} /> {r.name}</p>
                <h3 id={`journey-${r.slug}`} className={s.journeyTitle}>{r.home.title}</h3>
                {r.home.lines.map((l) => <p key={l}>{l}</p>)}
                <p className={`lz-sticker ${r.mood === "bold" ? "lz-sticker--berry" : "lz-sticker--mint"} ${s.journeySign}`}>{r.home.sign}</p>
                <Link href={`/products/${r.slug}`} className={`lz-btn ${r.mood === "bold" ? "lz-btn--ink" : "lz-btn--mint"}`}>{r.home.cta} <Icon name="arrow" size={18} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className={s.featured} aria-labelledby="featured-title">
          <div className="lz-wrap">
            <div className={s.sectionHead}>
              <div>
                <p className="lz-eyebrow">Featured products</p>
                <h2 id="featured-title" className="lz-h2" style={{ marginTop: 12 }}>Your Comfort, Their Care</h2>
              </div>
              <Link href="/products" className="lz-textlink">View all products <Icon name="arrow" size={17} /></Link>
            </div>
            <div className={s.featuredGrid} style={{ ["--cols" as string]: featured.length, ["--cols-md" as string]: Math.min(featured.length, 2) }}>
              {featured.map((p) => <ProductCard key={p.slug} product={p} detailsHref={`/products/${p.range}#${productAnchor(p.slug)}`} />)}
            </div>
          </div>
        </section>
      )}

      <section className={`lz-wrap lz-section ${s.why}`} aria-labelledby="why-title">
        <h2 id="why-title" className="lz-h2" style={{ textAlign: "center" }}>{BRAND.why.title}</h2>
        <div className={s.whyGrid}>
          {BRAND.why.items.map((w) => (
            <div key={w.title} className={s.whyCard}>
              <span className={s.whyIcon}><Icon name={w.icon} size={26} /></span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.tips} aria-labelledby="tips-title">
        <div className="lz-wrap">
          <div className={s.sectionHead}>
            <div>
              <p className="lz-eyebrow">Tips &amp; Advice</p>
              <h2 id="tips-title" className="lz-h2" style={{ marginTop: 12 }}>Care Beyond the Product</h2>
              <p className="lz-lead" style={{ marginTop: 14, maxWidth: 640 }}>{BRAND.tips.body.join(" ")}</p>
            </div>
            <Link href="/tips" className="lz-btn lz-btn--lilac">Explore Tips &amp; Advice <Icon name="arrow" size={18} /></Link>
          </div>
          <div className={tc.grid3}>{reads.map((a) => <ArticleCard key={a.slug} article={a} small />)}</div>
        </div>
      </section>

      <section className={s.corner} aria-labelledby="corner-title">
        <div className={`lz-wrap ${s.cornerGrid}`}>
          <div className={`${s.cornerPic} lz-blob`}>
            <Photo image={{ src: "/images/nursery/dad-playtime.webp", alt: "A father playing with his laughing baby on a play mat, with Linzzy Baby Diapers and Baby Wipes" }} needed="" position="35% center" />
          </div>
          <div className={s.cornerText}>
            <span className="lz-sticker lz-sticker--mint">{BRAND.parentCorner.title}</span>
            <h2 id="corner-title" className={s.cornerTitle}>{BRAND.parentCorner.tagline}</h2>
            {BRAND.parentCorner.body.map((p) => <p key={p}>{p}</p>)}
            <Link href="/tips#parent-corner" className="lz-btn lz-btn--mint" style={{ marginTop: 26 }}>Read Parent Corner <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className={`lz-wrap lz-section ${s.duo}`} aria-label="Community and contact">
        <div className={s.duoCard} data-tone="butter">
          <Icon name="leaf" size={34} />
          <h2>{BRAND.beyond.title}</h2>
          {BRAND.beyond.body.map((p) => <p key={p}>{p}</p>)}
          <a href={lexta.csr} target="_blank" rel="noopener" className="lz-btn lz-btn--ink">Explore Our Community Initiatives <Icon name="arrow" size={18} /></a>
        </div>
        <div className={s.duoCard} data-tone="lilac">
          <Icon name="chat" size={34} />
          <h2>{BRAND.connected.title}</h2>
          {BRAND.connected.body.map((p) => <p key={p}>{p}</p>)}
          <Link href="/contact" className="lz-btn lz-btn--berry">Contact Linzzy <Icon name="arrow" size={18} /></Link>
        </div>
      </section>
    </>
  );
}
