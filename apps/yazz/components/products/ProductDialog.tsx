import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import type { YazzProduct } from "@/lib/products";
import { RANGES } from "@/lib/ranges";
import { askHref, whereToBuyHref } from "./ProductCard";
import s from "./products.module.css";

export const productAnchor = (slug: string) => `product-${slug}`;

/**
 * Product detail, as a window over the range page (the contract's "product detail is a section or modal on this page,
 * not a new page"). It is the page section #product-<slug>, shown when it is the target of the address, so it opens
 * from a link and works without JavaScript; DialogEnhancer adds Escape, focus handling and the scroll lock.
 */
export default function ProductDialog({ product, closeHref }: { product: YazzProduct; closeHref: string }) {
  const range = RANGES[product.range];
  const id = productAnchor(product.slug);
  return (
    <section id={id} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} data-product-dialog="">
      <a href={closeHref} className={s.scrim} aria-hidden="true" tabIndex={-1} />
      <div className={s.window} style={{ ["--tone" as string]: range.tone.accent, ["--soft" as string]: range.tone.soft }}>
        <a href={closeHref} className={s.close} aria-label="Close product details" data-dialog-close="">
          <Icon name="close" size={22} />
        </a>
        <div className={s.detailGrid}>
          <div className={s.gallery}>
            <div className={s.galleryMain}>
              <Photo image={product.images[0] ?? null} needed={`${product.name} pack shot`} icon={range.icon} fit="contain" style={{ padding: product.images[0] ? 18 : undefined }} />
            </div>
            {product.images.length > 1 && (
              <ul className={s.thumbs}>
                {product.images.slice(1, 5).map((im) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <li key={im.src}><img src={im.src} alt={im.alt} loading="lazy" /></li>
                ))}
              </ul>
            )}
          </div>
          <div className={s.detailText}>
            <span className={s.tag}>{range.name}</span>
            {product.comingSoon && <span className={s.tag} data-coming-soon="">Coming soon</span>}
            <h2 id={`${id}-title`} className={s.detailTitle}>{product.name}</h2>
            <p className={s.detailLong}>{product.long}</p>

            {product.features.length > 0 && (
              <>
                <h3 className={s.detailHead}>Features</h3>
                <ul className={s.features}>
                  {product.features.map((f) => <li key={f}><Icon name="check" size={16} /> {f}</li>)}
                </ul>
              </>
            )}

            {product.skus.length > 0 && (
              <>
                <h3 className={s.detailHead}>Variants and pack sizes</h3>
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

            {product.usage && (
              <>
                <h3 className={s.detailHead}>How to use and safety</h3>
                <p className={s.small}>{product.usage}</p>
              </>
            )}
            {product.ingredients && (
              <>
                <h3 className={s.detailHead}>Ingredients</h3>
                <p className={s.small}>{product.ingredients}</p>
              </>
            )}

            <div className={s.detailActions}>
              {!product.comingSoon && <Link href={whereToBuyHref(product)} className="yz-btn yz-btn--red"><Icon name="pin" size={17} /> Where to buy</Link>}
              <Link href={askHref(product)} className="yz-btn yz-btn--outline"><Icon name="chat" size={17} /> Ask about this product</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
