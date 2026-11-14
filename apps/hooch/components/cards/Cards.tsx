import Link from "next/link";
import Icon from "@/components/Icon";
import type { Article } from "@/content/articles";
import type { Recipe } from "@/content/recipes";
import type { HoochProduct } from "@/lib/products";
import s from "./cards.module.css";

/** A cereal card: the Hooch box pack shot bobbing on a sunny or red disc, name, Lexta's tagline and the pack. */
export function ProductCard({ p, i = 0, big = false }: { p: HoochProduct; i?: number; big?: boolean }) {
  const img = p.images[0];
  return (
    <Link href={`/products/${p.slug}`} className={`hc-wobble ${s.product} ${big ? s.big : ""}`} data-flavour={p.flavour} data-reveal="" style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
      <span className={s.productDisc} aria-hidden="true" />
      <span className={s.productImg}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
        ) : (
          <span className="hc-ph"><Icon name="bowl" size={42} /> [PLACEHOLDER: picture of {p.name}]</span>
        )}
      </span>
      <span className={s.productBody}>
        {p.portions && <span className={`hc-sticker ${p.flavour === "frosted" ? "hc-sticker--sky" : ""} ${s.productSticker}`}>{p.portions}</span>}
        <span className={s.productName}>{p.name}</span>
        {p.tagline && <span className={s.productTag}>{p.tagline}</span>}
        <span className={s.productShort}>{p.short}</span>
        <span className={s.productGo}>Take a closer look <Icon name="arrow" size={18} /></span>
      </span>
    </Link>
  );
}

/** A recipe card: the food photo on a coloured plate, minutes and moment chips, Lexta's strapline. */
export function RecipeCard({ r, i = 0 }: { r: Recipe; i?: number }) {
  return (
    <Link href={`/recipes/${r.slug}`} className={`hc-wobble ${s.recipe}`} data-tone={r.tone} data-reveal="" style={{ "--d": `${i * 0.07}s` } as React.CSSProperties}>
      <span className={s.recipeImg}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.image.src} alt={r.image.alt} loading="lazy" decoding="async" style={{ objectPosition: r.image.position }} />
        {r.photoNeeded && <span className={s.recipePh}>[PLACEHOLDER: {r.photoNeeded}]</span>}
      </span>
      <span className={s.recipeChips}>
        <span className={s.chip}><Icon name="clock" size={14} /> About {r.minutes} min</span>
        <span className={s.chip}>{r.moment}</span>
      </span>
      <span className={s.recipeName}>{r.name}</span>
      <span className={s.recipeStrap}>{r.strap}</span>
      <span className={s.recipeGo} aria-hidden="true"><Icon name="arrow" size={20} /></span>
    </Link>
  );
}

/** A Nutrition & Family Tips teaser. */
export function ArticleCard({ a, i = 0 }: { a: Article; i?: number }) {
  return (
    <Link href={`/nutrition/${a.slug}`} className={`hc-wobble ${s.article}`} data-tone={a.tone} data-reveal="" style={{ "--d": `${i * 0.07}s` } as React.CSSProperties}>
      <span className={s.articleIcon}><Icon name={a.icon} size={26} /></span>
      <span className={s.articleTitle}>{a.title}</span>
      <span className={s.articleText}>{a.summary}</span>
      <span className={s.articleGo}>Read More <Icon name="arrow" size={16} /></span>
    </Link>
  );
}
