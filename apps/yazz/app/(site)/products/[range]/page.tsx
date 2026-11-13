import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import DialogEnhancer from "@/components/products/DialogEnhancer";
import ProductCard from "@/components/products/ProductCard";
import ProductDialog, { productAnchor } from "@/components/products/ProductDialog";
import pc from "@/components/products/products.module.css";
import ArticleCard from "@/components/tips/ArticleCard";
import tc from "@/components/tips/tips.module.css";
import { ARTICLES, sortedArticles } from "@/content/articles";
import { getYazzProducts, inRange } from "@/lib/products";
import { isRangeSlug, RANGE_SLUGS, RANGES } from "@/lib/ranges";
import s from "@/components/range/range.module.css";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return RANGE_SLUGS.map((range) => ({ range }));
}

export async function generateMetadata({ params }: { params: Promise<{ range: string }> }): Promise<Metadata> {
  const { range } = await params;
  if (!isRangeSlug(range)) return {};
  const r = RANGES[range];
  return {
    title: r.seo.title,
    description: r.seo.description,
    alternates: { canonical: `/products/${range}` },
    openGraph: { title: `${r.seo.title} | Yazz®`, description: r.seo.description, url: `/products/${range}`, images: r.image ? [{ url: r.image.src }] : undefined },
  };
}

/**
 * One product range: the shared layout of the prototype's Feminine Care, Oral Care and Home & Tissue pages, used for
 * all five Yazz ranges. Products come from Product Management (Yazz brand, grouped by category); each opens in a
 * product window on this page.
 */
export default async function RangePage({ params }: { params: Promise<{ range: string }> }) {
  const { range } = await params;
  if (!isRangeSlug(range)) notFound();
  const r = RANGES[range];
  const { products } = await getYazzProducts();
  const list = inRange(products, range);
  const reads = sortedArticles(ARTICLES.filter((a) => a.range === range)).slice(0, 3);
  const tone = { ["--tone" as string]: r.tone.accent, ["--deep" as string]: r.tone.deep, ["--tint" as string]: r.tone.tint, ["--soft" as string]: r.tone.soft };

  return (
    <div style={tone}>
      <section className={s.hero} aria-labelledby="range-title">
        <div className={s.heroText}>
          <p className="yz-eyebrow" style={{ color: r.tone.deep }}>{r.name}</p>
          <h1 id="range-title" className={s.heroTitle}>
            {r.hero.title.map((t) => <span key={t} className={s.heroLine}>{t}</span>)}
            {r.hero.script.map((t) => <span key={t} className={`yz-script ${s.heroScript}`}>{t}</span>)}
          </h1>
          <p className={s.heroBody}>{r.hero.body}</p>
          <div className={s.heroActions}>
            <a href="#range" className="yz-btn yz-btn--red">See the range <Icon name="arrow" size={17} /></a>
            <Link href="/contact#where-to-buy" className={`yz-btn ${s.outlineTone}`}><Icon name="pin" size={17} /> Where to Buy</Link>
          </div>
        </div>
        <div className={s.heroPic}>
          <Photo image={r.image} needed={r.imageNeeded} icon={r.icon} eager position="center 25%" />
        </div>
        <p className={`yz-script ${s.note}`} aria-hidden="true">
          {r.hero.note.map((n) => <span key={n}>{n}</span>)}
          <span className={s.heart}>♥</span>
        </p>
      </section>

      <section className={`yz-pad ${s.features}`} aria-label={`Why ${r.name}`}>
        {r.features.map((f) => (
          <div key={f.title} className={s.feature}>
            <span className={s.featureIcon}><Icon name={f.icon} size={20} /></span>
            <h2 className={s.featureTitle}>{f.title}</h2>
            <p className={s.featureBody}>{f.body}</p>
          </div>
        ))}
      </section>

      <section id="range" className={`yz-pad ${s.range}`} aria-labelledby="range-list">
        <div className={s.rangeHead}>
          <div>
            <p className="yz-eyebrow" style={{ color: r.tone.accent }}>The range</p>
            <h2 id="range-list" className="yz-h2" style={{ marginTop: 10 }}>{r.rangeTitle}</h2>
            <p className="yz-lead" style={{ marginTop: 12, maxWidth: 560 }}>{r.rangeBody}</p>
          </div>
          <Link href="/contact#where-to-buy" className="yz-textlink">Where to buy <Icon name="arrow" size={15} /></Link>
        </div>
        {list.length > 0 ? (
          <div className={pc.grid} style={{ marginTop: 28 }}>
            {list.map((p) => <ProductCard key={p.slug} product={p} detailsHref={`#${productAnchor(p.slug)}`} />)}
          </div>
        ) : (
          <div className={s.empty}>
            <Icon name="box" size={28} />
            <p>The {r.name} range is being added. In the meantime, <Link href="/contact#where-to-buy">find a stockist</Link> or <Link href="/contact?topic=question#message">ask us</Link>.</p>
          </div>
        )}
      </section>

      {r.guide && (
        <section className={`yz-pad ${s.guideWrap}`} aria-labelledby="guide-title">
          <div className={s.guide}>
            <div className={s.guideMain}>
              <p className="yz-eyebrow" style={{ color: r.tone.accent }}>{r.guide.eyebrow}</p>
              <h2 id="guide-title" className={s.guideTitle}>{r.guide.title}</h2>
              <ol className={s.steps}>
                {r.guide.items.map((g) => (
                  <li key={g.title} className={s.step}>
                    <strong>{g.title}</strong>
                    <span>{g.body}</span>
                  </li>
                ))}
              </ol>
              <Link href="/contact?topic=question#message" className="yz-btn yz-btn--red" style={{ marginTop: 22 }}>
                Ask our care team <Icon name="arrow" size={17} />
              </Link>
            </div>
            <div className={s.guideSide}>
              {r.image && <Photo image={{ ...r.image, alt: "" }} needed="" position="center 25%" />}
              <p aria-hidden="true" className={`yz-script ${s.guideNote}`}>
                {r.guide.note.map((n) => <span key={n}>{n}</span>)}
                <span className={s.heart}>♡ ♥</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {r.habits && (
        <section className={`yz-pad ${s.habits}`} aria-labelledby="habits-title">
          <p className="yz-eyebrow" style={{ color: r.tone.accent }}>Good to know</p>
          <h2 id="habits-title" className="yz-h2" style={{ marginTop: 10 }}>{r.habits.title}</h2>
          <div className={s.habitGrid}>
            {r.habits.items.map((h) => (
              <div key={h.title} className={s.habit}>
                <h3>{h.title}</h3>
                <p>{h.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {reads.length > 0 && (
        <section className={`yz-pad ${s.reads}`} aria-labelledby="reads-title">
          <div className={s.rangeHead}>
            <h2 id="reads-title" className={s.readsTitle}>Tips &amp; Articles</h2>
            <Link href="/tips" className="yz-textlink">View all articles <Icon name="arrow" size={15} /></Link>
          </div>
          <div className={tc.grid3} style={{ marginTop: 18 }}>
            {reads.map((a) => <ArticleCard key={a.slug} article={a} small />)}
          </div>
        </section>
      )}

      <section className={`yz-pad ${s.ctaWrap}`} aria-labelledby="trade-title">
        <div className={s.cta}>
          <p className={`yz-script ${s.ctaScript}`} aria-hidden="true">
            {r.trade.script.map((t) => <span key={t}>{t}</span>)}
            <span className={s.heart}>♥</span>
          </p>
          <div>
            <h2 id="trade-title" className={s.ctaTitle}>{r.trade.title}</h2>
            <p className={s.ctaBody}>{r.trade.body}</p>
            <div className={s.heroActions}>
              <Link href="/contact#trade" className="yz-btn yz-btn--red">Trade enquiry <Icon name="arrow" size={17} /></Link>
              <Link href="/contact#where-to-buy" className="yz-btn yz-btn--ghost-light"><Icon name="pin" size={17} /> Find a stockist</Link>
            </div>
          </div>
        </div>
      </section>

      <nav className={`yz-pad ${s.others}`} aria-label="Other ranges">
        <span>More from Yazz:</span>
        {RANGE_SLUGS.filter((x) => x !== range).map((x) => (
          <Link key={x} href={`/products/${x}`} className="yz-chip"><Icon name={RANGES[x].icon} size={16} style={{ marginRight: 6, color: RANGES[x].tone.accent }} /> {RANGES[x].name}</Link>
        ))}
      </nav>

      {list.map((p) => <ProductDialog key={p.slug} product={p} closeHref="#range" />)}
      <DialogEnhancer closeHash="range" />
    </div>
  );
}
