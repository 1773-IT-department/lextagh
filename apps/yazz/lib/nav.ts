/** The site's navigation: only the six pages, plus the Lexta site for CSR, careers and legal pages. */
import { RANGES, RANGE_SLUGS, type RangeSlug } from "./ranges";

export type NavLink = { label: string; href: string; icon?: string; external?: boolean; children?: NavLink[] };

const product = (range: string, slug: string) => `/products/${range}#product-${slug}`;

/**
 * Second level links under each range, after Lexta's Products mega menu (docs/content/yazz/website-copy.md:20 and the
 * dropdown content at :47-53), kept to two or three per range: product windows on the range page, then the range's tips
 * (the same tips as the range page's tips button, RANGES[...].tipsCta).
 */
const RANGE_SUBLINKS: Record<RangeSlug, NavLink[]> = {
  "feminine-care": [
    { label: "Sanitary Pads", href: product("feminine-care", "sanitary-pads") },
    { label: "Panty Liners", href: product("feminine-care", "panty-liners") },
    { label: "Tips Just 4 You", href: RANGES["feminine-care"].tipsCta.href },
  ],
  "oral-care": [
    { label: "Toothbrushes", href: product("oral-care", "toothbrushes") },
    { label: "Toothpaste", href: "/products/oral-care#range" },
    { label: "Oral Hygiene Tips", href: RANGES["oral-care"].tipsCta.href },
  ],
  "home-tissue": [
    { label: "Mama Yazz", href: product("home-tissue", "mama-yazz-jumbo-tissue") },
    { label: "Toilet Roll", href: product("home-tissue", "toilet-tissue-individual-wrap") },
    { label: "Home Tips", href: RANGES["home-tissue"].tipsCta.href },
  ],
  "baby-care": [
    { label: "Diapers", href: product("baby-care", "baby-diapers") },
    { label: "Wipes", href: product("baby-care", "baby-wipes") },
    { label: "Baby Care Tips", href: RANGES["baby-care"].tipsCta.href },
  ],
  "home-care": [
    { label: "Washing Powder", href: product("home-care", "washing-powder") },
    { label: "Home-Care Tips", href: RANGES["home-care"].tipsCta.href },
  ],
};

export const productLinks: NavLink[] = [
  { label: "All Products", href: "/products", icon: "store" },
  ...RANGE_SLUGS.map((s) => ({ label: RANGES[s].name, href: `/products/${s}`, icon: RANGES[s].icon, children: RANGE_SUBLINKS[s] })),
];

export const tipsLinks: NavLink[] = [
  { label: "All Tips & Advice", href: "/tips", icon: "book" },
  { label: "Tips Just 4 You", href: "/tips?category=just-4-you", icon: "heart" },
  { label: "Just 4 Parents", href: "/tips?category=just-4-parents", icon: "people" },
  { label: "Care Tips", href: "/tips?category=care-tips", icon: "leaf" },
];
