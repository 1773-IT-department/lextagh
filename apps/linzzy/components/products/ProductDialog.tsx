import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { articleBySlug } from "@/content/articles";
import type { LinzzyProduct } from "@/lib/products";
import { RANGES } from "@/lib/ranges";
import { askHref, whereToBuyHref } from "./ProductCard";
import s from "./products.module.css";

export const productAnchor = (slug: string) => `product-${slug}`;

/**
 * Product detail, as a window over the range page (product detail is a section or modal on that page, not a new
 * page). It is the page section #product-<slug>, shown when it is the target of the address, so it opens from a link
 * and works without JavaScript; DialogEnhancer adds Escape, focus handling and the scroll lock.
 * Sections follow Lexta's product page: description, pack contents, features, recommended use, how to use, and the
 * expandable "Usage, Ingredients & Skin Sensitivity" panel Lexta recommends for every product, then related articles.
 */
export default function ProductDialog({ product, closeHref }: { product: LinzzyProduct; closeHref: string }) {
  const range = RANGES[product.range];
  const id = productAnchor(product.slug);
  const reads = (product.reads ?? []).map(articleBySlug).filter((a) => !!a);
  return (
    <section id={id} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} data-product-dialog="">
      <a href={closeHref} className={s.scrim} aria-hidden="true" tabIndex={-1} />
      <div className={s.window} data-mood={range.mood} style={{ ["--tone" as string]: range.tone.accent, ["--deep" as string]: range.tone.deep, ["--soft" as string]: range.tone.tint }}>
        <a href={closeHref} className={s.close} aria-label="Close product details" data-dialog-close="">
          <Icon name="close" size={22} />
        </a>
        <div className={s.detailGrid}>
          <div className={s.gallery}>
            <div className={s.galleryMain}>
              <span className={s.cardBlob} />
              <Photo image={product.images[0] ?? null} needed={`${product.name} pack shot`} icon={range.icon} fit="contain" className={s.cardImg} />
            </div>
            {product.says && <p className={s.says}><span>Linzzy Says</span> {product.says}</p>}
          </div>
          <div className={s.detailText}>
            <div className={s.tags}>
              <span className={s.tag}>{range.name}</span>
              {product.comingSoon && <span className={s.tag} data-coming-soon="">Coming soon</span>}
            </div>
            <h2 id={`${id}-title`} className={s.detailTitle}>{product.name}</h2>
            {product.headline && <p className={s.headline}>{product.headline}</p>}
            <p className={s.detailLong}>{product.long}</p>

            {product.skus.length > 0 && (
              <>
                <h3 className={s.detailHead}>Pack contents</h3>
                <table className={s.skus}>
                  <thead><tr><th scope="col">Variant</th><th scope="col">Pack</th></tr></thead>
                  <tbody>
                    {product.skus.map((k) => (
                      <tr key={k.code}><td>{k.variant ?? product.name}</td><td>{k.pack}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {product.features.length > 0 && (
              <>
                <h3 className={s.detailHead}>Key features</h3>
                <ul className={s.features}>
                  {product.features.map((f) => <li key={f}><Icon name="check" size={17} /> {f}</li>)}
                </ul>
              </>
            )}

            {product.recommended && (
              <>
                <h3 className={s.detailHead}>Recommended use</h3>
                <p className={s.small}>{product.recommended}</p>
              </>
            )}

            {(product.usage || product.ingredients || product.sensitivity) && (
              <details className={s.more}>
                <summary>Usage, Ingredients &amp; Skin Sensitivity <Icon name="chevron-down" size={18} /></summary>
                {product.usage && (<><h3 className={s.detailHead}>How to use</h3><p className={s.small}>{product.usage}</p></>)}
                {product.ingredients && (<><h3 className={s.detailHead}>Ingredients</h3><p className={s.small}>{product.ingredients}</p></>)}
                {product.sensitivity && (<><h3 className={s.detailHead}>Skin sensitivity &amp; allergy precautions</h3><p className={s.small}>{product.sensitivity}</p></>)}
              </details>
            )}

            {reads.length > 0 && (
              <>
                <h3 className={s.detailHead}>Tips &amp; Advice</h3>
                <ul className={s.reads}>
                  {reads.map((a) => <li key={a.slug}><Link href={`/tips/${a.slug}`}><Icon name="book" size={16} /> {a.title}</Link></li>)}
                </ul>
              </>
            )}

            <div className={s.detailActions}>
              {!product.comingSoon && <Link href={whereToBuyHref(product)} className="lz-btn lz-btn--berry"><Icon name="pin" size={18} /> Where to buy</Link>}
              <Link href={askHref(product)} className="lz-btn"><Icon name="chat" size={18} /> Ask about this product</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
