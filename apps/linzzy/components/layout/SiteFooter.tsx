import Link from "next/link";
import Icon from "@/components/Icon";
import { BRAND } from "@/content/brand";
import { productLinks } from "@/lib/nav";
import { contact, lexta, socials, tel } from "@/lib/site";
import s from "./footer.module.css";

/**
 * Footer: Lexta's sign-off as a big statement band, then the link columns. Links go only to this site's pages, and to
 * the Lexta site for CSR, careers and the legal pages (brand sites have no CSR or careers pages, by contract).
 */
export default function SiteFooter() {
  const ext = { target: "_blank", rel: "noopener" } as const;
  return (
    <footer className={s.footer}>
      <div className={s.band}>
        <div className="lz-wrap">
          <p className={s.bandLine}>
            Gentle Care <span className={s.bandPill}>for Bright</span> Beginnings.
          </p>
          <p className={s.bandSub}>{BRAND.commitment}</p>
        </div>
      </div>

      <div className={`lz-wrap ${s.cols}`}>
        <div className={s.about}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/original/linzzy-logo.webp" alt="Linzzy" width={480} height={387} className={s.logo} loading="lazy" />
          <p>{BRAND.brandOf}</p>
          <p className={s.line}><Icon name="phone" size={16} /> <a href={tel(contact.phones[0])}>{contact.phones[0]}</a></p>
          <p className={s.line}><Icon name="mail" size={16} /> <a href={`mailto:${contact.enquiriesEmail}`}>{contact.enquiriesEmail}</a></p>
        </div>
        <nav aria-label="Explore">
          <h2 className={s.head}>Explore</h2>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/tips">Tips &amp; Advice</Link></li>
            <li><Link href="/faqs">FAQs</Link></li>
            <li><Link href="/contact">Contact &amp; Where to Buy</Link></li>
          </ul>
        </nav>
        <nav aria-label="Products">
          <h2 className={s.head}>Products</h2>
          <ul>{productLinks.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Lexta Ghana">
          <h2 className={s.head}>The Lexta family</h2>
          <ul>
            <li><a href={lexta.csr} {...ext}>Community Impact (CSR) <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.careers} {...ext}>Careers <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.home} {...ext}>Lexta Ghana Limited <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.privacy} {...ext}>Privacy Policy <Icon name="arrow" size={13} /></a></li>
            <li><a href={lexta.terms} {...ext}>Terms &amp; Conditions <Icon name="arrow" size={13} /></a></li>
          </ul>
        </nav>
        <div>
          <h2 className={s.head}>Follow {contact.handle}</h2>
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
          {socials.some((x) => !x.href) && (
            <p className={s.placeholder}>[PLACEHOLDER: {socials.filter((x) => !x.href).map((x) => x.label.replace(/^Linzzy on /, "")).join(" and ")} links from Lexta]</p>
          )}
        </div>
      </div>

      <div className={`lz-wrap ${s.bottom}`}>
        <span>{BRAND.copyright}</span>
        <span>Feminine Care | Maternal Care | Baby Care</span>
      </div>
    </footer>
  );
}
