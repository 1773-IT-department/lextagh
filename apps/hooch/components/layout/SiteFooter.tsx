import Link from "next/link";
import { MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import { BRAND } from "@/content/brand";
import { NAV } from "@/lib/nav";
import { getHoochProducts } from "@/lib/products";
import { contact, lexta, socials, tel } from "@/lib/site";
import s from "./footer.module.css";

/**
 * Footer: Lexta's sign-off on a sunny band (milk wave on top), then the link columns. Links go to this site's pages and
 * to the Lexta site for community programmes, careers and the legal pages (brand sites have no CSR pages, by contract).
 */
export default async function SiteFooter() {
  const { products } = await getHoochProducts();
  const ext = { target: "_blank", rel: "noopener" } as const;
  return (
    <footer className={s.footer}>
      <div className={s.band}>
        <MilkWave color="var(--hc-sun)" style={{ position: "absolute", top: -63, left: 0 }} />
        <div className="hc-wrap">
          <p className={s.bandLine}>
            Good Nutrition, <span className={s.bandPill}>Brighter</span> Tomorrow.
          </p>
          <p className={s.bandSub}>{BRAND.footerLine}</p>
        </div>
      </div>

      <div className={`hc-wrap ${s.cols}`}>
        <div className={s.about}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hooch-logo.webp" alt="Hooch" width={151} height={69} className={s.logo} loading="lazy" />
          <p>Hooch® is a brand of Lexta Ghana Limited.</p>
          <p className={s.line}><Icon name="phone" size={16} /> <a href={tel(contact.phones[0])}>{contact.phones[0]}</a></p>
          <p className={s.line}><Icon name="mail" size={16} /> <a href={`mailto:${contact.enquiriesEmail}`}>{contact.enquiriesEmail}</a></p>
        </div>
        <nav aria-label="Explore">
          <h2 className={s.head}>Explore</h2>
          <ul>{NAV.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Our cereals">
          <h2 className={s.head}>Our cereals</h2>
          <ul>
            {products.map((p) => <li key={p.slug}><Link href={`/products/${p.slug}`}>{p.name}</Link></li>)}
            <li><Link href="/recipes">Breakfast Ideas &amp; Recipes</Link></li>
            <li><Link href="/contact#where-to-buy">Where to Buy</Link></li>
          </ul>
        </nav>
        <nav aria-label="Lexta Ghana">
          <h2 className={s.head}>The Lexta family</h2>
          <ul>
            <li><a href={lexta.csr} {...ext}>Community programmes <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.careers} {...ext}>Careers <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.home} {...ext}>Lexta Ghana Limited <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.privacy} {...ext}>Privacy Policy <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.terms} {...ext}>Terms &amp; Conditions <Icon name="arrow" size={13} /></a></li>
          </ul>
        </nav>
        <div>
          <h2 className={s.head}>Follow Hooch®</h2>
          <ul className={s.social}>
            {socials.map((x) => (
              <li key={x.icon}>
                {x.href ? (
                  <a href={x.href} {...ext} aria-label={x.label} title={x.label}><Icon name={x.icon} size={18} /></a>
                ) : (
                  <span role="img" aria-label={`${x.label} [PLACEHOLDER: link from Lexta]`} title={`${x.label}: link to come`}><Icon name={x.icon} size={18} /></span>
                )}
              </li>
            ))}
          </ul>
          <p className={s.placeholder}>[PLACEHOLDER: Hooch Facebook, Instagram and TikTok links from Lexta]</p>
        </div>
      </div>

      <div className={`hc-wrap ${s.bottom}`}>
        <span>© 2026 Lexta Ghana Limited. All rights reserved.</span>
        <span>{BRAND.promise}</span>
      </div>
    </footer>
  );
}
