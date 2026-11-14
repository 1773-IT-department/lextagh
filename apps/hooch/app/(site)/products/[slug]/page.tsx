import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard, RecipeCard } from "@/components/cards/Cards";
import { Floaters, MilkWave, VideoSlot } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import FoodStage from "@/components/three/FoodStage";
import { ALLERGEN_NOTE, CATALOGUE } from "@/content/catalogue";
import { RECIPES } from "@/content/recipes";
import { getHoochProducts } from "@/lib/products";

type Params = Promise<{ slug: string }>;

/** Both catalogue cereals are built ahead; a product staff add later renders on first visit. */
export function generateStaticParams() {
  return CATALOGUE.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getHoochProducts();
  const p = products.find((x) => x.slug === slug);
  if (!p) return { title: "Product not found" };
  return { title: p.name, description: p.short, alternates: { canonical: `/products/${p.slug}` }, openGraph: p.images[0] ? { images: [{ url: p.images[0].src, alt: p.images[0].alt }] } : undefined };
}

/**
 * One cereal: a live 3D bowl of it, Lexta's description, key benefits, how to enjoy, nutrition and ingredients (as
 * Lexta wrote them; the approved panel is still to come), packs and codes, its product film slot, recipes that use it
 * and Where to Buy (the stockist finder with the product chosen).
 */
export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { products } = await getHoochProducts();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const frosted = p.flavour === "frosted";
  const recipes = RECIPES.filter((r) => (p.recipes ?? []).includes(r.slug) || r.cereals.includes(p.slug));
  const others = products.filter((x) => x.slug !== p.slug);
  const poster = p.images[0] ?? { src: frosted ? "/images/hooch/frosted-flakes-bowl.webp" : "/images/hooch/cornflakes-bowl.webp", alt: p.name };
  const steps = (p.usage ?? "").split(/(?<=\.)\s+/).filter(Boolean);

  return (
    <>
      <section className={s.hero} data-tone={frosted ? "sky" : undefined} aria-labelledby="p-title">
        <Floaters count={10} seed={frosted ? 21 : 13} />
        <div className={`hc-wrap ${s.heroInner}`}>
          <nav className={s.crumbs} aria-label="Breadcrumb"><Link href="/products">Our Products</Link> <Icon name="chevron-right" size={14} /> <span aria-current="page">{p.name}</span></nav>
          <div className={s.split}>
            <div>
              <h1 id="p-title" className={s.heroTitle}>{p.name}</h1>
              {p.tagline && <p className={s.big} style={{ marginTop: 12, color: frosted ? "var(--hc-sky-deep)" : "var(--hc-red-deep)" }}>{p.tagline}</p>}
              <p className={s.heroLead}>{p.short}</p>
              <div className={s.facts}>
                {p.skus.map((k) => <span key={k.code} className={s.fact}><Icon name="box" size={16} /> {k.pack}</span>)}
                {p.category && <span className={s.fact}><Icon name="bowl" size={16} /> {p.category}</span>}
              </div>
              <div className={s.actions}>
                <Link href={`/contact?product=${p.slug}#where-to-buy`} className="hc-btn hc-btn--red"><Icon name="pin" size={18} /> Where to Buy</Link>
                {recipes[0] && <Link href={`/recipes/${recipes[0].slug}`} className="hc-btn">Try {recipes[0].name}</Link>}
              </div>
            </div>
            <div className={s.splitStage}>
              <FoodStage
                priority
                config={{ vessel: "bowl", flake: p.flavour, milk: true, toppings: frosted ? ["strawberry"] : ["banana"] }}
                poster={poster}
                label={`A 3D bowl of ${p.name} with milk${frosted ? " and strawberries" : " and banana slices"}. Tap the bowl for a crunch.`}
              />
            </div>
          </div>
        </div>
        <MilkWave style={{ marginTop: 20 }} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-label="About this cereal">
        <div className={s.grid2}>
          <div data-reveal="">
            <p className="hc-lead" style={{ fontSize: 19 }}>{p.long}</p>
            {p.features.length > 0 && (
              <div className={s.panel} data-tone={frosted ? "sky" : "sun"} style={{ marginTop: 28 }}>
                <h2>Key benefits</h2>
                <ul className={s.ticks}>{p.features.map((f) => <li key={f}><span className={s.tick}><Icon name="star" size={14} /></span> {f}</li>)}</ul>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {steps.length > 0 && (
              <div className={s.panel} data-reveal="">
                <h2>How to enjoy</h2>
                <ol className={s.steps}>{steps.map((t) => <li key={t}>{t}</li>)}</ol>
              </div>
            )}
            <div className={s.panel} data-tone="red" data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
              <h2>Nutrition &amp; ingredients</h2>
              {p.ingredients && <p>{p.ingredients}</p>}
              <p><strong>Allergens:</strong> {ALLERGEN_NOTE}</p>
              <p className={s.note}>For detailed ingredient lists, allergens and nutritional values, consumers should refer to the approved product packaging.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`hc-wrap ${s.section}`} aria-labelledby="film-title">
        <div className={s.grid2} style={{ alignItems: "center" }}>
          <div data-reveal="">
            <p className="hc-eyebrow">Watch</p>
            <h2 id="film-title" className="hc-h2" style={{ marginTop: 12 }}>See the Crunch</h2>
            {p.skus.length > 0 && (
              <table className={s.skuTable}>
                <thead><tr><th scope="col">Pack</th><th scope="col">Product code</th></tr></thead>
                <tbody>{p.skus.map((k) => <tr key={k.code}><td>{k.pack}</td><td>{k.code.startsWith("TBC-") ? `${k.code} [PLACEHOLDER: product code from Lexta]` : k.code}</td></tr>)}</tbody>
              </table>
            )}
          </div>
          <div data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <VideoSlot needed={`${p.name} product video from Lexta`} poster={poster} />
          </div>
        </div>
      </section>

      {recipes.length > 0 && (
        <section className={`hc-wrap ${s.section}`} aria-labelledby="r-title">
          <h2 id="r-title" className="hc-h2">Breakfast Ideas with {p.name}</h2>
          <div className={`${s.grid4} ${s.mt}`}>{recipes.map((r, i) => <RecipeCard key={r.slug} r={r} i={i} />)}</div>
        </section>
      )}

      {others.length > 0 && (
        <section className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-labelledby="o-title">
          <h2 id="o-title" className="hc-h2">One Hooch® Family</h2>
          <div className={`${s.grid2} ${s.mt}`}>{others.map((o, i) => <ProductCard key={o.slug} p={o} i={i} />)}</div>
        </section>
      )}
    </>
  );
}
