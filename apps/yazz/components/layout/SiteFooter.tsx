import Link from "next/link";
import Icon from "@/components/Icon";
import { BRAND } from "@/content/brand";
import { productLinks } from "@/lib/nav";
import { contact, lexta, socials, tel } from "@/lib/site";
import s from "./footer.module.css";

/**
 * Footer of the prototype's About, News and Contact pages: the navy "More Products. More Smiles." band, then the link
 * columns. Links go only to this site's pages, and to the Lexta site for CSR, careers and the legal pages
 * (brand sites have no CSR or careers pages, by contract).
 */
export default function SiteFooter() {
  const ext = { target: "_blank", rel: "noopener" } as const;
  return (
    <footer className={s.footer}>
      <div className={s.band}>
        <p className={`yz-script ${s.bandScript}`}>More<br />Products.<br />More Smiles.</p>
        <div className={s.bandLogo}>
          <span className="yz-logo"><span style={{ fontSize: 42 }}>Yazz</span></span>
          <p className="yz-script">Caring brand for caring families.</p>
        </div>
      </div>

      <div className={s.cols}>
        <div className={s.about}>
          <span className="yz-logo"><span style={{ fontSize: 30 }}>Yazz</span></span>
          <p>Yazz® is a trademark brand of Lexta Ghana Limited.</p>
          <p className={s.phone}>
            <Icon name="phone" size={15} /> <a href={tel(contact.phones[0])}>{contact.phones[0]}</a>
          </p>
          <p className={s.phone}>
            <Icon name="mail" size={15} /> <a href={`mailto:${contact.enquiriesEmail}`}>{contact.enquiriesEmail}</a>
          </p>
        </div>
        <nav aria-label="Explore">
          <h2 className={s.head}>Explore</h2>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/tips">Tips &amp; Articles</Link></li>
            <li><Link href="/faqs">FAQs</Link></li>
            <li><Link href="/contact">Contact &amp; Where to Buy</Link></li>
          </ul>
        </nav>
        <nav aria-label="Products">
          <h2 className={s.head}>Products</h2>
          <ul>{productLinks.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Lexta Ghana">
          <h2 className={s.head}>Lexta Ghana</h2>
          <ul>
            <li><a href={lexta.csr} {...ext}>Community Impact (CSR) <Icon name="arrow" size={12} /></a></li>
            <li><a href={lexta.careers} {...ext}>Careers <Icon name="arrow" size={12} /></a></li>
            <li><a href={lexta.home} {...ext}>Lexta Ghana Limited <Icon name="arrow" size={12} /></a></li>
            <li><a href={lexta.privacy} {...ext}>Privacy Policy <Icon name="arrow" size={12} /></a></li>
            <li><a href={lexta.terms} {...ext}>Terms &amp; Conditions <Icon name="arrow" size={12} /></a></li>
          </ul>
        </nav>
        <div>
          <h2 className={s.head}>Follow Us</h2>
          <ul className={s.social}>
            {socials.map((x) => (
              <li key={x.icon}>
                {x.href ? (
                  <a href={x.href} {...ext} aria-label={x.label} title={x.label}><Icon name={x.icon} size={16} /></a>
                ) : (
                  <span role="img" aria-label={`${x.label} [PLACEHOLDER: link from Lexta]`} title={`${x.label}: link to come`}><Icon name={x.icon} size={16} /></span>
                )}
              </li>
            ))}
          </ul>
          {socials.some((x) => !x.href) && <p className={s.placeholder}>[PLACEHOLDER: Yazz Facebook, Instagram, TikTok and YouTube links from Lexta]</p>}
          <p className={s.ghana}><span className="yz-flag" aria-hidden="true"><i /><i /><i /></span> Proudly Ghanaian</p>
        </div>
      </div>

      <div className={s.bottom}>
        <span>{BRAND.copyright}</span>
        <span>Yazz® A Trademark of Lexta Ghana Limited</span>
        <span className={s.values}>Quality Products | Healthier Families | A Brighter Future</span>
      </div>
    </footer>
  );
}
