import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import ProductCard from "@/components/products/ProductCard";
import { productAnchor } from "@/components/products/ProductDialog";
import pc from "@/components/products/products.module.css";
import s from "@/components/range/overview.module.css";
import { getYazzProducts, inRange } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: "Explore every Yazz® range: feminine care, oral care, home & tissue, baby care and home care. Everyday essentials from Lexta Ghana Limited.",
  alternates: { canonical: "/products" },
};

const BADGES = [
  { icon: "shield", title: "Quality", sub: "Products", tint: "#EAF2FD", tone: "#0B4FA5" },
  { icon: "check", title: "Reliable", sub: "Everyday use", tint: "#FDECF4", tone: "#EC1B7B" },
  { icon: "heart", title: "Value for", sub: "Your Family", tint: "#E8F5EC", tone: "#15803D" },
  { icon: "pin", title: "Available", sub: "Across Ghana", tint: "#FDF3E7", tone: "#B05C10" },
];

/** Products: the overview of the Yazz ranges (the prototype's Products page), with every product from the database. */
export default async function ProductsPage() {
  const { products } = await getYazzProducts();
  return (
    <>
      <section className={s.hero} aria-labelledby="products-title">
        <div>
          <p className="yz-eyebrow" style={{ color: "#4A7BB5" }}>Our products</p>
          <h1 id="products-title" className={s.title}>Everyday Essentials <span className="yz-script">for a Brighter You.</span></h1>
          <p className={s.body}>From feminine care and baby essentials to oral care, home care and tissues, Yazz brings practical care into the moments that matter.</p>
          <ul className={s.badges}>
            {BADGES.map((b) => (
              <li key={b.title}>
                <span style={{ background: b.tint, color: b.tone }}><Icon name={b.icon} size={18} /></span>
                <strong>{b.title}</strong> {b.sub}
              </li>
            ))}
          </ul>
        </div>
        <div className={s.heroPic}>
          <Photo image={{ src: "/images/full-range.webp", alt: "The Yazz range: sanitary pads, panty liners, wipes, bathroom tissue and toothpaste" }} needed="" eager />
          <p className={`yz-script ${s.note}`} aria-hidden="true">Same Quality.<br />More Smiles. <span>♥</span></p>
        </div>
      </section>

      <nav className={`yz-pad ${s.tiles}`} aria-label="Product ranges">
        {RANGE_SLUGS.map((slug) => {
          const r = RANGES[slug];
          return (
            <Link key={slug} href={`/products/${slug}`} className={s.tile} style={{ background: r.tone.tint, color: r.tone.accent }}>
              <Icon name={r.icon} size={22} />
              <strong>{r.name}</strong>
              <span>{r.tagline}</span>
              <Icon name="arrow" size={18} className={s.tileArrow} />
            </Link>
          );
        })}
      </nav>

      <section className={`yz-pad ${s.all}`} aria-labelledby="all-title">
        <p className="yz-eyebrow" style={{ color: "#EC1B7B" }}>All products</p>
        <h2 id="all-title" className="yz-h2" style={{ marginTop: 10 }}>Our Complete Range</h2>
        <p className="yz-lead" style={{ marginTop: 12, maxWidth: 560 }}>Everything you need, all in one place. Open a product for its pack sizes, how to use it and where to buy it.</p>
        <div className={pc.grid} style={{ marginTop: 26 }}>
          {products.map((p) => <ProductCard key={p.slug} product={p} detailsHref={`/products/${p.range}#${productAnchor(p.slug)}`} />)}
        </div>
      </section>

      <div className={`yz-pad ${s.bands}`}>
        {RANGE_SLUGS.map((slug) => {
          const r = RANGES[slug];
          const list = inRange(products, slug);
          return (
            <section key={slug} className={s.band} style={{ ["--tint" as string]: r.tone.tint, ["--tone" as string]: r.tone.accent, ["--soft" as string]: r.tone.soft }} aria-labelledby={`band-${slug}`}>
              <div className={s.bandPic}><Photo image={r.image} needed={r.imageNeeded} icon={r.icon} position="center 25%" /></div>
              <div className={s.bandText}>
                <p className="yz-eyebrow" style={{ color: r.tone.deep }}>{r.name}</p>
                <h2 id={`band-${slug}`} className={s.bandTitle}>{r.hero.title.join(" ")} {r.hero.script.join(" ")}</h2>
                <p>{r.hero.body}</p>
                <Link href={`/products/${slug}`} className="yz-btn yz-btn--navy yz-btn--sm">Explore {r.name} <Icon name="arrow" size={15} /></Link>
              </div>
              {list.length > 0 && (
                <ul className={s.bandList}>
                  {list.slice(0, 5).map((p) => (
                    <li key={p.slug}>
                      <span><Icon name={r.icon} size={16} /></span>
                      <Link href={`/products/${slug}#${productAnchor(p.slug)}`}>{p.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section className={`yz-pad ${s.ctaWrap}`} aria-labelledby="stock-title">
        <div className={s.cta}>
          <p className="yz-script" aria-hidden="true">More<br />Products.<br />More Smiles. <span style={{ color: "#ED1B2E", fontSize: 16 }}>♥</span></p>
          <div>
            <h2 id="stock-title">Ready to Stock Up?</h2>
            <p>Distributors, wholesalers, shops and institutions: tell us what you need and our trade team will come back to you.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
              <Link href="/contact#trade" className="yz-btn yz-btn--red">Trade enquiry <Icon name="arrow" size={16} /></Link>
              <Link href="/contact#where-to-buy" className="yz-btn yz-btn--ghost-light"><Icon name="pin" size={16} /> Find a stockist</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
