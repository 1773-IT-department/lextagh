/** The site's navigation: only the six pages, plus the Lexta site for CSR, careers and legal pages. */
import { RANGES, RANGE_SLUGS } from "./ranges";

export type NavLink = { label: string; href: string; icon?: string; external?: boolean };

export const productLinks: NavLink[] = [
  { label: "All Products", href: "/products", icon: "store" },
  ...RANGE_SLUGS.map((s) => ({ label: RANGES[s].name, href: `/products/${s}`, icon: RANGES[s].icon })),
];

export const tipsLinks: NavLink[] = [
  { label: "All Tips & Advice", href: "/tips", icon: "book" },
  { label: "Feminine Care & Wellness", href: "/tips?category=feminine-care", icon: "female" },
  { label: "Baby Diapers & Wipes", href: "/tips?category=baby-care", icon: "baby" },
  { label: "Linzzy Parent Corner", href: "/tips#parent-corner", icon: "people" },
];
