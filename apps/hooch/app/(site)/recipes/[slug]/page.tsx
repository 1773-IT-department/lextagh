import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Floaters, MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import NeedList from "@/components/recipes/NeedList";
import RealPhoto from "@/components/fun/RealPhoto";
import { RECIPES, recipeBySlug, SHARE_RECIPE } from "@/content/recipes";
import { getHoochProducts } from "@/lib/products";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = recipeBySlug((await params).slug);
  if (!r) return { title: "Recipe not found" };
  return { title: r.name, description: `${r.strap} ${r.method}`, alternates: { canonical: `/recipes/${r.slug}` }, openGraph: { images: [{ url: r.image.src, alt: r.image.alt }] } };
}

/** One recipe: its food photo (tilts, and crunches when tapped), what you need (a tick list), Lexta's method, the cereal it uses and the next idea. */
export default async function RecipePage({ params }: { params: Params }) {
  const r = recipeBySlug((await params).slug);
  if (!r) notFound();
  const { products } = await getHoochProducts();
  const uses = products.filter((p) => r.cereals.includes(p.slug));
  const next = RECIPES[(RECIPES.indexOf(r) + 1) % RECIPES.length];
  const tone = r.tone === "sky" ? "sky" : r.tone === "red" ? "red" : undefined;
  return (
    <>
      <section className={s.hero} data-tone={tone} aria-labelledby="r-title">
        <Floaters count={8} seed={r.minutes * 7} />
        <div className={`hc-wrap ${s.heroInner}`}>
          <nav className={s.crumbs} aria-label="Breadcrumb"><Link href="/recipes">Breakfast Ideas &amp; Recipes</Link> <Icon name="chevron-right" size={14} /> <span aria-current="page">{r.name}</span></nav>
          <div className={s.split}>
            <div>
              <h1 id="r-title" className={s.heroTitle}>{r.name}</h1>
              <p className={s.big} style={{ marginTop: 12, color: "var(--hc-red-deep)" }}>{r.strap}</p>
              <div className={s.facts}>
                <span className={s.fact}><Icon name="clock" size={16} /> Preparation: approximately {r.minutes} minutes</span>
                <span className={s.fact}><Icon name="spoon" size={16} /> {r.moment}</span>
              </div>
            </div>
            <div className={s.splitStage}>
              <RealPhoto priority ratio="1 / 1" src={r.image.src} alt={r.image.alt} position={r.image.position} placeholder={r.photoNeeded} />
            </div>
          </div>
        </div>
        <MilkWave style={{ marginTop: 20 }} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-label="How to make it">
        <div className={s.grid2}>
          <div className={s.panel} data-tone="sun" data-reveal="">
            <h2>You need</h2>
            <NeedList items={r.youNeed} />
          </div>
          <div className={s.panel} data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <h2>How to make it</h2>
            <p className={s.method}>{r.method}</p>
            {uses.length > 0 && (
              <div className={s.actions}>
                {uses.map((p) => <Link key={p.slug} href={`/products/${p.slug}`} className="hc-btn hc-btn--sm">{p.name} <Icon name="arrow" size={16} /></Link>)}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-label="More ideas">
        <div className={s.grid2}>
          <Link href={`/recipes/${next.slug}`} className={`${s.next} hc-wobble`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.image.src} alt="" loading="lazy" />
            <span><small>Next idea</small><strong>{next.name}</strong></span>
          </Link>
          <div className={s.panel} data-tone="red">
            <h2>{SHARE_RECIPE.title}</h2>
            <p>{SHARE_RECIPE.body}</p>
            <div className={s.actions}><Link href="/contact?topic=recipe#message" className="hc-btn hc-btn--red">{SHARE_RECIPE.cta} <Icon name="arrow" size={18} /></Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
