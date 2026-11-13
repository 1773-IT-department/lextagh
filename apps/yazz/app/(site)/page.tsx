import type { Metadata } from "next";
import Link from "next/link";
import HeroSlider, { type Slide } from "@/components/home/HeroSlider";
import s from "@/components/home/home.module.css";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import ProductCard from "@/components/products/ProductCard";
import ArticleCard from "@/components/tips/ArticleCard";
import tc from "@/components/tips/tips.module.css";
import { sortedArticles, ARTICLES } from "@/content/articles";
import { BRAND } from "@/content/brand";
import { productAnchor } from "@/components/products/ProductDialog";
import { getYazzProducts } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Yazz® | Trusted Quality. Made for Everyday Living." },
  description: "Yazz®, a trademark brand of Lexta Ghana Limited. Feminine care, baby care, oral care, home care and tissues: practical care for the moments that matter. Find Yazz near you.",
  alternates: { canonical: "/" },
};

const SLIDES: Slide[] = [
  {
    eyebrow: "CARING BRAND FOR CARING FAMILIES",
    title: ["Trusted", "Made for"],
    accent: ["Quality.", "Everyday Living."],
    body: BRAND.intro,
    ctas: [
      { label: "Explore Products", href: "/products", kind: "red" },
      { label: "Tips Just 4 You", href: "/tips?category=just-4-you", kind: "ghost" },
    ],
    image: { src: "/images/feminine-wide.webp", alt: "A smiling young woman holding a pack of Yazz sanitary pads, with the Yazz feminine care range beside her" },
    position: "12% center",
    note: true,
  },
  {
    eyebrow: "FEMININE CARE",
    title: ["Feel", "Feel"],
    accent: ["Confident,", "You."],
    body: "Every flow is different. Explore Yazz sanitary pads and panty liners, and learn practical period-care habits.",
    ctas: [{ label: "Find Your Yazz", href: "/products/feminine-care", kind: "red" }, { label: "Tips Just 4 You", href: "/tips?category=just-4-you", kind: "ghost" }],
    image: { src: "/images/feminine-care.webp", alt: "A young woman smiling and holding a pack of Yazz sanitary pads" },
    position: "center 30%",
  },
  {
    eyebrow: "ORAL CARE",
    title: ["Healthy", "Brighter"],
    accent: ["Smiles,", "Days."],
    body: "Make good oral hygiene part of every day, with Yazz toothbrushes and toothpaste for the whole family.",
    ctas: [{ label: "Explore Oral Care", href: "/products/oral-care", kind: "red" }, { label: "Oral Hygiene Tips", href: "/tips/tips-for-a-healthy-smile", kind: "ghost" }],
    image: { src: "/images/oral-care.webp", alt: "A man brushing his teeth with Yazz toothpaste on the counter" },
    position: "center 30%",
  },
];

const TRUST = [
  { icon: "shield", title: "Quality Products", sub: "You Can Trust" },
  { icon: "heart", title: "Caring Brand", sub: "For Caring Families" },
  { icon: "leaf", title: "Everyday Care", sub: "For Every Home" },
  { icon: "people", title: "Proudly Ghanaian", sub: "From Lexta Ghana Limited" },
];

const BANDS = [
  { slug: "feminine-care", cta: "Explore Feminine Care", side: "right" },
  { slug: "oral-care", cta: "Explore Oral Care", side: "left" },
  { slug: "home-tissue", cta: "Explore Tissue Products", side: "right" },
] as const;

export default async function HomePage() {
  const { products } = await getYazzProducts();
  // Highlights: the first product of each range, in Product Management's order, then the rest, up to 8.
  const firsts = RANGE_SLUGS.map((r) => products.find((p) => p.range === r)).filter((p) => !!p);
  const featured = [...firsts, ...products.filter((p) => !firsts.includes(p))].slice(0, 8);
  const blog = sortedArticles(ARTICLES).slice(0, 4);

  return (
    <>
      <HeroSlider slides={SLIDES} />

      <section className={s.trust} aria-label="The Yazz promise in short">
        {TRUST.map((t) => (
          <div key={t.title} className={s.trustItem}>
            <Icon name={t.icon} size={30} />
            <div><strong>{t.title}</strong><span>{t.sub}</span></div>
          </div>
        ))}
      </section>

      <section className={`yz-pad ${s.cats}`} aria-labelledby="cats-title">
        <div className={s.catsIntro}>
          <h2 id="cats-title" className={s.catsTitle}>Explore Our Product Categories</h2>
          <p>From feminine care and baby essentials to oral care, home care and tissues.</p>
          <Link href="/products" className="yz-btn yz-btn--navy">Explore Products <Icon name="arrow" size={17} /></Link>
        </div>
        <div className={s.catGrid}>
          {RANGE_SLUGS.map((slug) => {
            const r = RANGES[slug];
            return (
              <Link key={slug} href={`/products/${slug}`} className={s.cat} style={{ ["--rgb" as string]: r.tone.rgb, ["--soft" as string]: r.tone.tint }}>
                <Photo image={r.image} needed={r.imageNeeded} icon={r.icon} position="center 25%" />
                <span className={s.catLabel}>
                  <span><strong>{r.name}</strong><small>{r.tagline}</small></span>
                  <span className={s.catArrow} style={{ color: r.tone.accent }}><Icon name="arrow" size={16} /></span>
                </span>
              </Link>
            );
          })}
          <Link href="/products" className={s.cat} style={{ ["--rgb" as string]: "21,128,61" }}>
            <Photo image={{ src: "/images/full-range.webp", alt: "The full Yazz range: pads, liners, wipes, tissue and toothpaste" }} needed="" />
            <span className={s.catLabel}>
              <span><strong>All Products</strong><small>View our full range</small></span>
              <span className={s.catArrow} style={{ color: "#15803D" }}><Icon name="arrow" size={16} /></span>
            </span>
          </Link>
        </div>
      </section>

      {BANDS.map((b) => {
        const r = RANGES[b.slug];
        return (
          <section key={b.slug} className={s.band} data-side={b.side} style={{ ["--tint" as string]: r.tone.tint, ["--tone" as string]: r.tone.accent, ["--deep" as string]: r.tone.deep }} aria-labelledby={`band-${b.slug}`}>
            <div className={s.bandPic}><Photo image={r.image} needed={r.imageNeeded} icon={r.icon} position="center 25%" /></div>
            <div className={s.bandText}>
              <p className="yz-eyebrow" style={{ color: r.tone.deep }}>{r.name}</p>
              <h2 id={`band-${b.slug}`} className={s.bandTitle}>{r.hero.title.join(" ")}<br /><span className="yz-script">{r.hero.script.join(" ")}</span></h2>
              <p className={s.bandBody}>{r.hero.body}</p>
              <Link href={`/products/${b.slug}`} className="yz-btn yz-btn--red">{b.cta} <Icon name="arrow" size={17} /></Link>
            </div>
          </section>
        );
      })}

      {featured.length > 0 && (
        <section className={s.featured} aria-labelledby="featured-title">
          <div className={s.featuredHead}>
            <div>
              <h2 id="featured-title" className={s.featuredTitle}>Featured Products</h2>
              <p>Practical care for everyday living, from every Yazz range.</p>
            </div>
            <Link href="/products" className="yz-textlink">View all products <Icon name="arrow" size={15} /></Link>
          </div>
          <div className={s.featuredRow} tabIndex={0} aria-label="Featured products, scroll sideways for more">
            {featured.map((p) => (
              <div key={p.slug} className={s.featuredItem}>
                <ProductCard product={p} detailsHref={`/products/${p.range}#${productAnchor(p.slug)}`} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={`yz-pad ${s.promise}`} aria-labelledby="promise-title">
        <p className="yz-eyebrow" style={{ textAlign: "center" }}>The Yazz® Promise</p>
        <h2 id="promise-title" className="yz-h2" style={{ textAlign: "center", marginTop: 10 }}>Quality You Can Count On</h2>
        <p className="yz-lead" style={{ textAlign: "center", maxWidth: 640, margin: "12px auto 0" }}>{BRAND.promiseIntro[0]}</p>
        <div className={s.promiseGrid}>
          {BRAND.promise.map((p) => (
            <div key={p.title} className={s.promiseCard} style={{ background: p.bg, color: p.tone }}>
              <Icon name={p.icon} size={26} />
              <strong>{p.title}</strong>
              <span>{p.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={s.brand} aria-labelledby="brand-title">
        <div className={s.brandPic}>
          <Photo image={{ src: "/images/full-range.webp", alt: "Yazz pads, liners, wipes, tissue and toothpaste together" }} needed="" />
        </div>
        <div className={s.brandText}>
          <p className="yz-eyebrow" style={{ color: "#4A7BB5" }}>Our brand</p>
          <h2 id="brand-title" className={s.brandTitle}>Proudly From Lexta Ghana Limited</h2>
          <p>{BRAND.about[0]}</p>
          <Link href="/about" className="yz-btn yz-btn--navy yz-btn--sm" style={{ marginTop: 18 }}>Our Story <Icon name="arrow" size={15} /></Link>
        </div>
        <div className={s.brandNote} aria-hidden="true">
          <p className="yz-script">Proudly<br />Ghanaian <span style={{ color: "#ED1B2E", fontSize: 16 }}>♥</span></p>
          <span className="yz-flagbars"><i /><i /><i /></span>
        </div>
      </section>

      <section className={`yz-pad ${s.blog}`} aria-labelledby="blog-title">
        <div>
          <h2 id="blog-title" className={s.featuredTitle}>Tips &amp; Articles</h2>
          <p className={s.blogIntro}>Helpful ideas for everyday living, created around the real questions families ask.</p>
          <Link href="/tips" className="yz-textlink" style={{ marginTop: 14 }}>View all articles <Icon name="arrow" size={15} /></Link>
        </div>
        <div className={tc.grid4}>{blog.map((a) => <ArticleCard key={a.slug} article={a} small />)}</div>
      </section>
    </>
  );
}
