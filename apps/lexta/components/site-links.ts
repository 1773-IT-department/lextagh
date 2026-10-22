/** Shared navigation data for the Lexta site header, mobile drawer and footer. */

export type NavLink = { label: string; href: string };

/** Desktop header links, in prototype order. */
export const headerLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Brands", href: "/our-brands" },
  { label: "People & Culture", href: "/people-and-culture" },
  { label: "CSR", href: "/corporate-social-responsibility" },
  { label: "News", href: "/news" },
  { label: "Careers", href: "/careers" },
];

/** Mobile drawer links, in prototype order (adds FAQs, says "Our Brands"). */
export const mobileLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Our Brands", href: "/our-brands" },
  { label: "People & Culture", href: "/people-and-culture" },
  { label: "CSR", href: "/corporate-social-responsibility" },
  { label: "News", href: "/news" },
  { label: "Careers", href: "/careers" },
  { label: "FAQs", href: "/faqs" },
];

export const footerQuickLinks: NavLink[] = [
  { label: "About Us", href: "/about-us" },
  { label: "Our Brands", href: "/our-brands" },
  { label: "CSR", href: "/corporate-social-responsibility" },
  { label: "News", href: "/news" },
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
  return normPath(href) === normPath(pathname || "/");
}
