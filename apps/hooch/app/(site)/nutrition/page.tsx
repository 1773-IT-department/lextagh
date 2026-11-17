import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/cards/Cards";
import Faq from "@/components/faqs/Faq";
import { Floaters, MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import { ARTICLES } from "@/content/articles";
import { BRAND } from "@/content/brand";
import { ALLERGEN_NOTE, VITAMINS } from "@/content/catalogue";
import { FAQ_GROUPS } from "@/content/faqs";
import { getHoochProducts } from "@/lib/products";
import Breadcrumbs from "@/components/pages/Breadcrumbs";

export const metadata: Metadata = {
  title: "Nutrition & Family Tips",
  description: "Good Habits Today. Brighter Tomorrows. Our Nutrition & Family Tips hub shares practical, easy-to-understand guidance for households.",
  alternates: { canonical: "/nutrition" },
};

/** Nutrition & Family Tips: Lexta's hub copy, the four articles, the Hooch® Nutrition Promise and the product FAQs. */
export default async function NutritionPage() {
  const { products } = await getHoochProducts();
  const n = BRAND.nutrition;
  return (
    <>
      <section className={s.hero} data-tone="sky" aria-labelledby="n-title">
        <Floaters count={10} seed={27} />
        <div className={`hc-wrap ${s.heroInner}`}>
          <Breadcrumbs page="Nutrition & Tips" />
          <p className="hc-sticker" style={{ background: "#fff" }}>{n.eyebrow}</p>
          <h1 id="n-title" className={s.heroTitle}>{n.title}</h1>
          {n.body.map((p) => <p key={p} className={s.heroLead}>{p}</p>)}
        </div>
        <MilkWave style={{ marginTop: 30 }} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-label="Articles" style={{ paddingTop: 30 }}>
        <div className={s.grid4}>{ARTICLES.map((a, i) => <ArticleCard key={a.slug} a={a} i={i} />)}</div>
      </section>

      <section className={`hc-wrap ${s.section}`} aria-labelledby="promise-title">
        <div className={s.grid2}>
          <div className={s.panel} data-tone="sun" data-reveal="">
            <h2 id="promise-title">{n.promiseTitle}</h2>
            {n.promise.map((p) => <p key={p}>{p}</p>)}
          </div>
          <div className={s.panel} data-tone="red" data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <h2>Nutrition &amp; ingredients</h2>
            <p>Enriched with vitamins. {VITAMINS}</p>
            <p><strong>Allergens:</strong> {ALLERGEN_NOTE}</p>
            <div className={s.actions}>
              {products.map((p) => <Link key={p.slug} href={`/products/${p.slug}`} className="hc-btn hc-btn--sm">{p.name} <Icon name="arrow" size={16} /></Link>)}
            </div>
          </div>
        </div>
      </section>

      <section id="faqs" className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-labelledby="faq-title">
        <p className="hc-eyebrow">FAQs</p>
        <h2 id="faq-title" className="hc-h2" style={{ marginTop: 12, marginBottom: 24 }}>Product FAQs</h2>
        <Faq groups={FAQ_GROUPS} />
        <p className="hc-lead" style={{ marginTop: 24 }}><Link href="/recipes#beyond-title" className="hc-textlink">Beyond the Bowl: Get Creative with Hooch®!</Link></p>
      </section>
    </>
  );
}
