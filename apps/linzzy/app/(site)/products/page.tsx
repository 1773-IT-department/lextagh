import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import ProductCard from "@/components/products/ProductCard";
import { productAnchor } from "@/components/products/ProductDialog";
import pc from "@/components/products/products.module.css";
import s from "@/components/range/overview.module.css";
import { BRAND } from "@/content/brand";
import { getLinzzyProducts, inRange } from "@/lib/products";
import { RANGE_SLUGS, RANGES } from "@/lib/ranges";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: "Linzzy Feminine Care and Baby Care: Heavy Flow, Cool Mint and Extra Long sanitary towels, Panty Liners, Baby Diapers and Baby Wipes, from Lexta Ghana Limited.",
  alternates: { canonical: "/products" },
};

/** Products: the two Linzzy collections, with every product from Product Management. */
export default async function ProductsPage() {
  const { products } = await getLinzzyProducts();
  return (
    <>
      <section className={s.hero} aria-labelledby="products-title">
        <div className={`lz-wrap ${s.heroGrid}`}>
          <div>
            <span className="lz-sticker">Linzzy Products</span>
            <h1 id="products-title" className={s.title}>Our Collection. <span>Your Choice.</span> Your Comfort.</h1>
            <p className={s.body}>{BRAND.welcome[0]}</p>
          </div>
          <div className={s.heroPic}>
            <div className={`${s.heroBlob} lz-blob`}>
              <Photo image={{ src: "/images/nursery/diaper-bag.webp", alt: "Linzzy Baby Wipes and Baby Diapers with a packed diaper bag, baby clothes and a soft toy" }} needed="" eager position="45% center" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.heroPack} src="/images/original/pad-cool-mint.webp" alt="" width={238} height={175} />
          </div>
        </div>
      </section>

      <nav className={`lz-wrap ${s.tiles}`} aria-label="Product ranges">
        {RANGE_SLUGS.map((slug) => {
          const r = RANGES[slug];
          return (
            <Link key={slug} href={`/products/${slug}`} className={s.tile} data-mood={r.mood}>
              <span className={s.tileIcon}><Icon name={r.icon} size={28} /></span>
              <span className={s.tileText}>
                <strong>{r.name}</strong>
                <span>{r.tagline}</span>
              </span>
              <span className={s.tilePacks} aria-hidden="true">
                {r.stickers.slice(0, 2).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.src} src={p.src} alt="" loading="lazy" />
                ))}
              </span>
              <Icon name="arrow" size={26} className={s.tileArrow} />
            </Link>
          );
        })}
      </nav>

      {RANGE_SLUGS.map((slug) => {
        const r = RANGES[slug];
        const list = inRange(products, slug);
        return (
          <section key={slug} className={s.band} data-mood={r.mood} aria-labelledby={`band-${slug}`}>
            <div className="lz-wrap">
              <div className={s.bandHead}>
                <div>
                  <p className="lz-eyebrow" style={{ color: r.tone.deep }}>{r.eyebrow}</p>
                  <h2 id={`band-${slug}`} className="lz-h2" style={{ marginTop: 12 }}>{r.title}</h2>
                  <p className="lz-lead" style={{ marginTop: 14, maxWidth: 680 }}>{r.intro[0]}</p>
                </div>
                <Link href={`/products/${slug}`} className={`lz-btn ${r.mood === "bold" ? "lz-btn--ink" : "lz-btn--mint"}`}>Explore {r.name} <Icon name="arrow" size={18} /></Link>
              </div>
              {list.length > 0 ? (
                <div className={pc.grid}>
                  {list.map((p) => <ProductCard key={p.slug} product={p} detailsHref={`/products/${slug}#${productAnchor(p.slug)}`} />)}
                </div>
              ) : (
                <p className={s.empty}>The {r.name} range is being added. In the meantime, <Link href="/contact#where-to-buy">find a stockist</Link> or <Link href="/contact?topic=question#message">ask us</Link>.</p>
              )}
            </div>
          </section>
        );
      })}

      <section className={`lz-wrap ${s.ctaWrap}`} aria-labelledby="stock-title">
        <div className={s.cta}>
          <div>
            <h2 id="stock-title">Distributors and Business Enquiries</h2>
            <p>Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries.</p>
          </div>
          <div className={s.ctaActions}>
            <Link href="/contact#trade" className="lz-btn lz-btn--mint">Trade enquiry <Icon name="arrow" size={18} /></Link>
            <Link href="/contact#where-to-buy" className="lz-btn"><Icon name="pin" size={18} /> Find a stockist</Link>
          </div>
        </div>
      </section>
    </>
  );
}
