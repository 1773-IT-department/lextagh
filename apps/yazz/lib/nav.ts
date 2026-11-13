/** The site's navigation: only the six pages, plus the Lexta site for CSR, careers and legal pages. */
import { RANGES, RANGE_SLUGS } from "./ranges";

export type NavLink = { label: string; href: string; icon?: string; external?: boolean };

export const productLinks: NavLink[] = [
  { label: "All Products", href: "/products", icon: "store" },
  ...RANGE_SLUGS.map((s) => ({ label: RANGES[s].name, href: `/products/${s}`, icon: RANGES[s].icon })),
];

export const tipsLinks: NavLink[] = [
  { label: "All Tips & Advice", href: "/tips", icon: "book" },
  { label: "Tips Just 4 You", href: "/tips?category=just-4-you", icon: "heart" },
  { label: "Just 4 Parents", href: "/tips?category=just-4-parents", icon: "people" },
  { label: "Care Tips", href: "/tips?category=care-tips", icon: "leaf" },
];
