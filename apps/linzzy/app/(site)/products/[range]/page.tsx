import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import DialogEnhancer from "@/components/products/DialogEnhancer";
import ProductCard from "@/components/products/ProductCard";
import ProductDialog, { productAnchor } from "@/components/products/ProductDialog";
import pc from "@/components/products/products.module.css";
import s from "@/components/range/range.module.css";
import ArticleCard from "@/components/tips/ArticleCard";
import tc from "@/components/tips/tips.module.css";
import { ARTICLES } from "@/content/articles";
import { getLinzzyProducts, inRange } from "@/lib/products";
import { isRangeSlug, RANGE_SLUGS, RANGES } from "@/lib/ranges";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

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
    openGraph: { title: `${r.seo.title} | Linzzy`, description: r.seo.description, url: `/products/${range}`, images: [{ url: r.image.src }] },
  };
}

/** Towel and liner lengths in the Feminine Care packs (Lexta's pack contents), as a scale. */
const LENGTHS = [
  { mm: 155, name: "Panty Liners", note: "Light days" },
  { mm: 260, name: "Cool Mint (mixed pack)", note: "260 mm and 290 mm towels" },
  { mm: 290, name: "Heavy Flow", note: "Heavier-flow days" },
  { mm: 330, name: "Extra Long", note: "Extended coverage" },
];
/** Diaper sizes Lexta has confirmed (products.md); others are still to come. */
const SIZES = [
  { size: "M", name: "Medium", weight: "6 to 9 kg", count: "42 pieces" },
  { size: "L", name: "Large", weight: "9 to 13 kg", count: "40 pieces" },
];

/**
 * One product range: the shared layout of both Linzzy ranges, with the range's own mood (bold for Feminine Care,
 * soft for Baby Care). Products come from Product Management (Linzzy brand, grouped by category); each opens in a
 * product window on this page.
 */
export default async function RangePage({ params }: { params: Promise<{ range: string }> }) {
  const { range } = await params;
  if (!isRangeSlug(range)) notFound();
  const r = RANGES[range];
  const { products } = await getLinzzyProducts();
  const list = inRange(products, range);
  const reads = ARTICLES.filter((a) => a.category === r.tipsCategory).slice(0, 3);
  const other = RANGES[RANGE_SLUGS.find((x) => x !== range)!];
  const tone = { ["--tone" as string]: r.tone.accent, ["--deep" as string]: r.tone.deep, ["--tint" as string]: r.tone.tint, ["--soft" as string]: r.tone.soft };

  return (
    <div style={tone} data-mood={r.mood} className={s.page}>
      <section className={s.hero} aria-labelledby="range-title">
        <div className={`lz-wrap ${s.heroGrid}`}>
          <div className={s.heroText}>
            <span className={`lz-sticker ${r.mood === "bold" ? "lz-sticker--berry" : "lz-sticker--mint"}`}>{r.eyebrow}</span>
            <h1 id="range-title" className={s.heroTitle}>{r.title}</h1>
            {r.intro.map((p) => <p key={p} className={s.heroBody}>{p}</p>)}
            <div className={s.heroActions}>
              <a href="#range" className={`lz-btn ${r.mood === "bold" ? "lz-btn--berry" : "lz-btn--ink"}`}>See the range <Icon name="arrow" size={18} /></a>
              <Link href="/contact#where-to-buy" className="lz-btn"><Icon name="pin" size={18} /> Where to Buy</Link>
            </div>
          </div>
          <div className={s.heroPic}>
            <div className={`${s.heroBlob} lz-blob`}>
              <Photo image={r.image} needed="" eager position={range === "feminine-care" ? "76% center" : "30% center"} />
            </div>
            {r.stickers.slice(0, 2).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.src} src={p.src} alt="" className={`${s.heroPack} ${i ? s.heroPackB : s.heroPackA}`} />
            ))}
            <span className={`lz-sticker ${r.mood === "bold" ? "" : "lz-sticker--lilac"} ${s.heroSticker}`} aria-hidden="true">{r.sticker}</span>
          </div>
        </div>
      </section>

      <section className={`lz-wrap ${s.features}`} aria-label={`Why Linzzy ${r.name}`}>
        {r.features.map((f) => (
          <div key={f.title} className={s.feature}>
            <span className={s.featureIcon}><Icon name={f.icon} size={24} /></span>
            <h2 className={s.featureTitle}>{f.title}</h2>
            <p className={s.featureBody}>{f.body}</p>
          </div>
        ))}
      </section>

      <section id="range" className={`lz-wrap ${s.range}`} aria-labelledby="range-list">
        <div className={s.rangeHead}>
          <div>
            <p className="lz-eyebrow" style={{ color: r.tone.deep }}>The range</p>
            <h2 id="range-list" className="lz-h2" style={{ marginTop: 12 }}>{r.rangeTitle}</h2>
            <p className="lz-lead" style={{ marginTop: 14, maxWidth: 620 }}>{r.rangeBody}</p>
          </div>
          <Link href="/contact#where-to-buy" className="lz-textlink">Where to buy <Icon name="arrow" size={17} /></Link>
        </div>
        {list.length > 0 ? (
          <div className={pc.grid}>
            {list.map((p) => <ProductCard key={p.slug} product={p} detailsHref={`#${productAnchor(p.slug)}`} />)}
          </div>
        ) : (
          <div className={s.empty}>
            <Icon name="box" size={28} />
            <p>The {r.name} range is being added. In the meantime, <Link href="/contact#where-to-buy">find a stockist</Link> or <Link href="/contact?topic=question#message">ask us</Link>.</p>
          </div>
        )}
      </section>

      {range === "feminine-care" ? (
        <section className={`lz-wrap ${s.scaleWrap}`} aria-labelledby="scale-title">
          <div className={s.scale}>
            <div>
              <p className="lz-eyebrow" style={{ color: "var(--lz-mint)" }}>Know your flow</p>
              <h2 id="scale-title" className={s.scaleTitle}>Lengths in the collection</h2>
              <p className={s.scaleNote}>Remember that a longer towel is not automatically more absorbent. Always check the absorbency and product information on the packaging.</p>
            </div>
            <ul className={s.bars}>
              {LENGTHS.map((l) => (
                <li key={l.mm} style={{ ["--w" as string]: `${Math.round((l.mm / 330) * 100)}%` }}>
                  <span className={s.bar}><strong>{l.mm} mm</strong></span>
                  <span className={s.barLabel}>{l.name} <small>{l.note}</small></span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className={`lz-wrap ${s.scaleWrap}`} aria-labelledby="sizes-title">
          <div className={s.scale}>
            <div>
              <p className="lz-eyebrow" style={{ color: "var(--lz-mint)" }}>Diaper sizes</p>
              <h2 id="sizes-title" className={s.scaleTitle}>The right fit supports every little move</h2>
              <p className={s.scaleNote}>Weight ranges on diaper packaging are generally a better starting point than age alone. Always refer to the size information printed on the product packaging.</p>
            </div>
            <ul className={s.sizes}>
              {SIZES.map((z) => (
                <li key={z.size}>
                  <span className={s.sizeLetter}>{z.size}</span>
                  <span><strong>{z.name}</strong><br />{z.weight}<br /><small>{z.count}</small></span>
                </li>
              ))}
              <li className={s.sizeMore}><span>[PLACEHOLDER: other diaper sizes, confirmed against current packaging]</span></li>
            </ul>
          </div>
        </section>
      )}

      <section className={`lz-wrap ${s.guideWrap}`} aria-labelledby="guide-title">
        <div className={s.guide}>
          <div className={s.guideMain}>
            <p className="lz-eyebrow" style={{ color: r.tone.deep }}>{r.guide.eyebrow}</p>
            <h2 id="guide-title" className={s.guideTitle}>{r.guide.title}</h2>
            <ol className={s.steps}>
              {r.guide.items.map((g) => <li key={g} className={s.step}><span>{g}</span></li>)}
            </ol>
            {r.guide.warning && <p className={s.warning}><Icon name="shield" size={20} /> {r.guide.warning}</p>}
            <Link href="/contact?topic=question#message" className="lz-btn lz-btn--berry" style={{ marginTop: 24 }}>Ask our care team <Icon name="arrow" size={18} /></Link>
          </div>
          <div className={`${s.guidePic} lz-blob`}>
            <Photo
              image={range === "feminine-care"
                ? { src: "/images/original/mother-daughter.webp", alt: "A mother handing her smiling daughter a pack of Linzzy sanitary towels" }
                : { src: "/images/nursery/mum-changing.webp", alt: "A smiling mother changing her baby's diaper on a changing table" }}
              needed="" position="center 30%"
            />
          </div>
        </div>
      </section>

      <section className={`lz-wrap ${s.habits}`} aria-labelledby="habits-title">
        <p className="lz-eyebrow" style={{ color: r.tone.deep }}>Good to know</p>
        <h2 id="habits-title" className="lz-h2" style={{ marginTop: 12 }}>{r.habits.title}</h2>
        <div className={s.habitGrid}>
          {r.habits.items.map((h, i) => (
            <div key={h.title} className={s.habit}>
              <span className={s.habitNum}>{String(i + 1).padStart(2, "0")}</span>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </div>
          ))}
        </div>
        {r.habits.more && (
          <Link href={r.habits.more.href} className="lz-textlink" style={{ marginTop: 28 }}>{r.habits.more.label} <Icon name="arrow" size={17} /></Link>
        )}
      </section>

      {reads.length > 0 && (
        <section className={`lz-wrap ${s.reads}`} aria-labelledby="reads-title">
          <div className={s.rangeHead}>
            <h2 id="reads-title" className="lz-h2">Tips &amp; Advice</h2>
            <Link href={`/tips?category=${r.tipsCategory}`} className="lz-textlink">All {r.name} articles <Icon name="arrow" size={17} /></Link>
          </div>
          <div className={tc.grid3}>{reads.map((a) => <ArticleCard key={a.slug} article={a} small />)}</div>
        </section>
      )}

      <section className={`lz-wrap ${s.ctaWrap}`} aria-labelledby="trade-title">
        <div className={s.cta}>
          <div>
            <h2 id="trade-title" className={s.ctaTitle}>Distributors and Business Enquiries</h2>
            <p className={s.ctaBody}>Interested in distributing or stocking Linzzy products? Contact our team to discuss product availability, distribution opportunities and commercial enquiries.</p>
          </div>
          <div className={s.ctaActions}>
            <Link href="/contact#trade" className="lz-btn lz-btn--mint">Trade enquiry <Icon name="arrow" size={18} /></Link>
            <Link href="/contact#where-to-buy" className="lz-btn"><Icon name="pin" size={18} /> Find a stockist</Link>
          </div>
        </div>
      </section>

      <nav className={`lz-wrap ${s.others}`} aria-label="Other ranges">
        <Link href={`/products/${other.slug}`} className={s.otherLink} data-mood={other.mood}>
          <span>More from Linzzy</span>
          <strong>{other.name} <Icon name="arrow" size={26} /></strong>
        </Link>
      </nav>

      {list.map((p) => <ProductDialog key={p.slug} product={p} closeHref="#range" />)}
      <DialogEnhancer closeHash="range" />
    </div>
  );
}
