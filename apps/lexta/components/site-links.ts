/** Shared navigation data for the Lexta site header, mobile drawer and footer. */

export type NavLink = { label: string; href: string };

/** Desktop header links: Lexta's top bar order, News before CSR (docs/content/lexta/website-copy.md:61). */
export const headerLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Brands", href: "/our-brands" },
  { label: "People & Culture", href: "/people-and-culture" },
  { label: "News", href: "/news" },
  { label: "CSR", href: "/corporate-social-responsibility" },
  { label: "Careers", href: "/careers" },
];

/** Mobile drawer links, in the header order (adds FAQs, says "Our Brands"). */
export const mobileLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Our Brands", href: "/our-brands" },
  { label: "People & Culture", href: "/people-and-culture" },
  { label: "News", href: "/news" },
  { label: "CSR", href: "/corporate-social-responsibility" },
  { label: "Careers", href: "/careers" },
  { label: "FAQs", href: "/faqs" },
];

export const footerQuickLinks: NavLink[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Our Brands", href: "/our-brands" },
  { label: "News", href: "/news" },
  { label: "CSR", href: "/corporate-social-responsibility" },
  { label: "Careers", href: "/careers" },
];

export const footerSupportLinks: NavLink[] = [
  { label: "Contact Us", href: "/contact-us" },
  { label: "FAQs", href: "/faqs" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

/** Lexta Business System (portal) for staff. Set NEXT_PUBLIC_PORTAL_URL per environment. */
export const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || "https://lexta-portal.vercel.app";

/** Normalise a path so "/about-us", "/about-us/" and "/about-us.html" compare equal. */
export function normPath(p: string): string {
  let s = p.split("?")[0].split("#")[0].replace(/\/+$/, "");
  s = s.replace(/^.*\//, "").replace(/\.html$/i, "");
  if (s === "index") s = "";
  return s.toLowerCase();
}

export function isCurrent(href: string, pathname: string | null): boolean {
  // Pages under a section (an article at /news/<slug>) mark that section as current.
  if (href !== "/" && pathname?.startsWith(`${href}/`)) return true;
  return normPath(href) === normPath(pathname || "/");
}

/**
 * The three brand websites (Our Brands "Visit" buttons, the footer's Lexta family links). NEXT_PUBLIC_YAZZ_SITE_URL,
 * NEXT_PUBLIC_LINZZY_SITE_URL and NEXT_PUBLIC_HOOCH_SITE_URL, else each brand's Vercel preview. Desmond sets the real
 * domains at go-live; never a real Lexta domain here.
 */
export const yazzSiteUrl = (process.env.NEXT_PUBLIC_YAZZ_SITE_URL || "https://lexta-yazz-1773-hr-consultancy-and-marketing.vercel.app").replace(/\/+$/, "");
export const linzzySiteUrl = (process.env.NEXT_PUBLIC_LINZZY_SITE_URL || "https://lexta-linzzy.vercel.app").replace(/\/+$/, "");
export const hoochSiteUrl = (process.env.NEXT_PUBLIC_HOOCH_SITE_URL || "https://lexta-hooch.vercel.app").replace(/\/+$/, "");

/** The footer's Lexta family column: the three brand sites. */
export const footerFamilyLinks: NavLink[] = [
  { label: "Yazz", href: `${yazzSiteUrl}/` },
  { label: "Linzzy", href: `${linzzySiteUrl}/` },
  { label: "Hooch", href: `${hoochSiteUrl}/` },
];
