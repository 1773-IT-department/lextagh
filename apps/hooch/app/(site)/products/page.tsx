import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/cards/Cards";
import { Floaters, MilkWave, VideoSlot } from "@/components/fun/Decor";
import { filmFor } from "@/content/videos";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import { BRAND } from "@/content/brand";
import { FAMILY_GUIDE } from "@/content/catalogue";
import { FAQ_GROUPS } from "@/content/faqs";
import { getHoochProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Our Products",
  description: "Two Delicious Choices. One Hooch® Family. With two delicious cereal options and 10 convenient individual packs per product, there's a Hooch® breakfast moment for everyone.",
  alternates: { canonical: "/products" },
};

/** Our Products: both cereals from Product Management, the product films (placeholders until Lexta sends them) and Lexta's family guide. */
export default async function ProductsPage() {
  const { products } = await getHoochProducts();
  return (
    <>
      <section className={s.hero} aria-labelledby="products-title">
        <Floaters count={12} seed={9} />
        <div className={`hc-wrap ${s.heroInner}`}>
          <p className="hc-sticker" style={{ background: "#fff" }}>Our Products</p>
          <h1 id="products-title" className={s.heroTitle}>{BRAND.productsTitle}</h1>
          <p className={s.heroLead}>{BRAND.twoChoices}</p>
        </div>
        <MilkWave style={{ marginTop: 30 }} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-label="Hooch cereals" style={{ paddingTop: 40 }}>
        <div className={s.grid2}>{products.map((p, i) => <ProductCard key={p.slug} p={p} i={i} big />)}</div>
      </section>

      <section className={`hc-wrap ${s.section}`} aria-labelledby="films-title">
        <p className="hc-eyebrow">Watch</p>
        <h2 id="films-title" className="hc-h2" style={{ marginTop: 12 }}>Product Videos</h2>
        <div className={`${s.grid2} ${s.mt}`}>
          {products.map((p) => (
            <VideoSlot key={p.slug} needed={`${p.name} product video from Lexta`} poster={p.images[0] ?? { src: "/images/hooch/cornflakes-bowl.webp", alt: p.name }} film={filmFor(p.slug)} />
          ))}
        </div>
      </section>

      <section className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-labelledby="guide-title">
        <div className={s.grid2}>
          <div className={s.panel} data-tone="sun" data-reveal="">
            <h2 id="guide-title">{FAMILY_GUIDE.title}</h2>
            <p>{FAMILY_GUIDE.intro}</p>
            <table className={s.skuTable}>
              <thead><tr><th scope="col">Family members</th><th scope="col">One pack each</th><th scope="col">How long one product lasts</th></tr></thead>
              <tbody>{FAMILY_GUIDE.rows.map((r) => <tr key={r.people}><th scope="row">{r.people}</th><td>{r.perBreakfast}</td><td>{r.lasts}</td></tr>)}</tbody>
            </table>
            <p className={s.note}>{FAMILY_GUIDE.note}</p>
          </div>
          <div className={s.panel} data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <h2>Product FAQs</h2>
            <ul className={s.ticks}>{FAQ_GROUPS.flatMap((g) => g.items).map((f) => <li key={f.q}><span className={s.tick}><Icon name="chat" size={14} /></span> {f.q}</li>)}</ul>
            <div className={s.actions}>
              <Link href="/nutrition#faqs" className="hc-btn hc-btn--red">See the Answers <Icon name="arrow" size={18} /></Link>
              <Link href="/contact#where-to-buy" className="hc-btn"><Icon name="pin" size={18} /> Where to Buy</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
