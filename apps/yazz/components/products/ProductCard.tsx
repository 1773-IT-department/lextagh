import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import type { YazzProduct } from "@/lib/products";
import { RANGES } from "@/lib/ranges";
import s from "./products.module.css";

/** Where to Buy for one product: the Contact & Where to Buy page, product noted (the region is remembered there). */
export const whereToBuyHref = (p: YazzProduct) => `/contact?product=${encodeURIComponent(p.slug)}#where-to-buy`;
/** "Ask about this product": the consumer form with the product chosen. */
export const askHref = (p: YazzProduct) => `/contact?topic=question&product=${encodeURIComponent(p.slug)}#message`;

/** A product card: picture, range, name, what it is, pack options and the two actions (no prices, no cart). */
export default function ProductCard({ product, detailsHref, compact = false }: { product: YazzProduct; detailsHref: string; compact?: boolean }) {
  const range = RANGES[product.range];
  // A window on this page opens through a plain link, so the address target (and :target) changes as a browser link
  // would; next/link would only push the history entry.
  const Detail = detailsHref.startsWith("#") ? "a" : Link;
  const packs = product.skus.length;
  return (
    <article className={s.card} style={{ ["--tone" as string]: range.tone.accent, ["--soft" as string]: range.tone.soft }}>
      <Detail href={detailsHref} className={s.cardPic} tabIndex={-1} aria-hidden="true">
        <Photo
          image={product.images[0] ?? null}
          needed={`${product.name} pack shot`}
          icon={range.icon}
          fit="contain"
          style={{ padding: product.images[0] ? 14 : undefined }}
        />
      </Detail>
      <div className={s.cardBody}>
        <span className={s.tag}>{range.name}</span>
        {product.comingSoon && <span className={s.tag} data-coming-soon="">Coming soon</span>}
        <h3 className={s.cardTitle}><Detail href={detailsHref}>{product.name}</Detail></h3>
        {!compact && <p className={s.cardText}>{product.short}</p>}
        {packs > 0 && !compact && (
          <p className={s.meta}>
            <Icon name="ruler" size={15} /> {packs === 1 ? product.skus[0].pack : `${packs} pack options`}
          </p>
        )}
        <div className={s.cardActions}>
          <Detail href={detailsHref} className="yz-btn yz-btn--navy yz-btn--sm">View details <Icon name="arrow" size={15} /></Detail>
          {!compact && !product.comingSoon && <Link href={whereToBuyHref(product)} className={s.buyLink}><Icon name="pin" size={15} /> Where to buy</Link>}
        </div>
      </div>
    </article>
  );
}
