/**
 * Our Brands product content, exactly as in the approved prototype.
 *
 * The page now reads the products live from Product Management (see ./live.ts). These arrays stay as:
 *  - the fallback when the database cannot be reached, so the page never breaks;
 *  - layout hints for the seeded products, matched by slug: the local pack shots the database has no image for yet,
 *    the before/after strip, and the one-off image sizes the prototype editor left behind.
 * Remote image URLs are the ones the prototype uses (existing brand sites and retailer listings).
 */

import type { CSSProperties } from "react";

export type ProductImage = { src: string; alt: string };

/** How the pack shots sit in the 230px media box of a card. */
export type ProductMedia =
  | { kind: "single"; image: ProductImage; /** prototype one-off inline style for this image */ imgStyle?: CSSProperties; imgSize?: { width: number; height: number } }
  | { kind: "grid"; columns: 2 | 3; images: ProductImage[] }
  | { kind: "photo"; placeholder: string; /** without it the card shows the empty photo slot */ src?: string; alt: string; w: number; h: number; /** prototype slot size override */ size?: { width: number; height: number } };

export type ProductCard = {
  /** Product slug in Product Management (for the Tissue card, the slug of its first product). */
  slug: string;
  name: string;
  description: string;
  media: ProductMedia;
  /** Optional before/after strip (Yazz washing powder). */
  beforeAfter?: { before: ProductImage; after: ProductImage };
};

export const yazzProducts: ProductCard[] = [
  {
    slug: "sanitary-pads-and-panty-liners",
    name: "Sanitary pads and panty liners",
    description: "Ultra-thin pads with soft flexible wings and wide adhesive for side protection and comfort. Available in Green, Pink (Heavy Flow), Minty, Extra Long and Extra Long Minty, with panty liners for everyday freshness.",
    media: { kind: "single", image: { src: "https://yazzproducts.com/wp-content/uploads/2026/07/Yazz-sanitary-pad-Extra-Long.png", alt: "Yazz sanitary pads" } },
  },
  {
    slug: "toothpaste",
    name: "Toothpaste",
    description: "The Yazz range comes in five variants: Whitening, Total Care, Herbal, Fluoride and Charcoal. Made for whiter, brighter and healthier smiles, with everyday protection against plaque, cavities and bad breath. The Herbal variant carries a unique blend of herbs.",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-charcoal-Toothpaste-e1787744429757.jpg", alt: "Yazz Charcoal toothpaste" },
        { src: "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-herbal-Toothpaste-e1787744479191.jpg", alt: "Yazz Herbal toothpaste" },
        { src: "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-Flouride-Toothpaste-e1787744539801.jpg", alt: "Yazz Fluoride toothpaste" },
      ],
    },
  },
  {
    slug: "toothbrushes",
    name: "Toothbrushes",
    description: "Princess, Duke, Duchess, Monarch, Kids and Double (His & Hers), with medium bristles, a tongue cleaner and a flexible rubber handle for easy grip.",
    media: { kind: "photo", placeholder: "Yazz toothbrush pack shot", src: "/pasted-1788770223184-0-mtqzltnh-58d1.png", alt: "Yazz toothbrush packs", w: 1080, h: 1080 },
  },
  {
    slug: "washing-powder",
    name: "Washing powder",
    description: "Yazz Activ Detergent with Enzymes, specially formulated to give you brighter and fresher clothes, free from every stain. Available in 200g, 500g, 2kg and 5kg packs.",
    media: {
      kind: "grid", columns: 2, images: [
        { src: "https://yazzproducts.com/wp-content/uploads/2026/07/EDSfdc2W4AAu3PT.jpg", alt: "Yazz washing powder" },
        { src: "https://lextagh.com/wp-content/uploads/2026/06/Yazz-Washing-powder1.jpg", alt: "Yazz washing powder pack" },
      ],
    },
    beforeAfter: {
      before: { src: "https://yazzproducts.com/wp-content/uploads/2026/06/dirty-yazz-cloth.png", alt: "Cloth before washing" },
      after: { src: "https://yazzproducts.com/wp-content/uploads/2026/06/clean-yazz-cloth.png", alt: "Cloth after washing" },
    },
  },
  {
    slug: "baby-wipes",
    name: "Baby wipes",
    description: "Alcohol free wipes that gently cleanse and care for delicate skin, leaving it soft and nourished. Available in Lavender, Castor Oil and Aloe Vera.",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-yellow.jpg", alt: "Yazz baby wipes" },
        { src: "https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/70195_1_1.jpg", alt: "Yazz baby wipes, 80 pieces" },
        { src: "https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-green.jpg", alt: "Yazz baby wipes" },
      ],
    },
  },
  {
    slug: "baby-diapers",
    name: "Baby diapers",
    description: "Regular diapers and pull up pants with elastic waists, cottony softness and up to 12 hours leakage protection.",
    media: { kind: "single", image: { src: "https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/7018.png", alt: "Yazz baby diapers, large" } },
  },
  {
    slug: "tissue",
    name: "Tissue and kitchen towels",
    description: "Mama Yazz jumbo tissue, kitchen towels, toilet rolls and tissue napkins for everyday household routines. Pocket Tissue is coming soon.",
    media: {
      kind: "grid", columns: 2, images: [
        { src: "https://yazzproducts.com/wp-content/uploads/2026/07/unnamed-1.png", alt: "Yazz tissue" },
        { src: "https://yazzproducts.com/wp-content/uploads/2026/07/Mama-Yazz-Kitchen-Towel2.png", alt: "Mama Yazz kitchen towel" },
      ],
    },
  },
];

export const linzzyProducts: ProductCard[] = [
  {
    slug: "sanitary-napkins",
    name: "Sanitary towels",
    description: "Cool Mint, Heavy Flow and Extra Long sanitary towels built around the Absorb, Lock and Breathe positioning, plus Linzzy Panty Liners for light everyday protection.",
    media: { kind: "single", image: { src: "https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Your-trusted-partner-copy.jpg.jpeg", alt: "Linzzy sanitary towels" } },
  },
  {
    slug: "baby-wipes",
    name: "Baby wipes",
    description: "80 wipes per resealable pack, in Pink (Rose Perfume), Blue (Lavender Perfume) and Yellow, for everyday care at home or on the go.",
    media: {
      kind: "single",
      image: { src: "/pasted-1788770820092-0-mtqzymab-4cn2.png", alt: "Linzzy baby wipes" },
      imgSize: { width: 447, height: 447 },
      // Fixed size the prototype editor left on this image.
      imgStyle: { maxWidth: "100%", height: 199, display: "block", objectFit: "cover", width: 245, aspectRatio: "447 / 447" },
    },
  },
  {
    slug: "baby-care",
    name: "Baby care",
    description: "Linzzy Baby Diapers with a flexible comfort design, in sizes for growing babies, made for little moves and everyday comfort.",
    media: { kind: "single", image: { src: "https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Baby-Diaper-copy.jpg-1.jpeg", alt: "Linzzy baby care" } },
  },
];

export const hoochProducts: ProductCard[] = [
  {
    slug: "super-crunchy-corn-flakes",
    name: "Super Crunchy Corn Flakes",
    description: "Super classic crunchy, everyday goodness. 10 individual packs of 50g in every 500g product, enriched with vitamins.",
    media: { kind: "single", image: { src: "https://www.chopboxonline.com/wp-content/uploads/2022/08/NewBookImages-53-1.png", alt: "Hooch Super Crunchy Corn Flakes, 375g" } },
  },
  {
    slug: "frosted-flakes",
    name: "Frosted Flakes",
    description: "Sweet crunch, happy mornings. A crispy texture with a sweet frosted finish, in 10 individual packs of 37.5g in every 375g product.",
    // The prototype editor left a fixed 390 x 248 size on this photo slot; kept so the card looks as approved.
    media: { kind: "photo", placeholder: "Hooch Frosted Flakes pack shot", src: "/pasted-1788770879108-0-mtqzzvrf-xf3v.png", alt: "Hooch Frosted Flakes pack", w: 1080, h: 1080, size: { width: 390, height: 248 } },
  },
  {
    slug: "choco-flakes",
    name: "Choco Flakes",
    description: "The same fortified grain base, finished with cocoa. Available in 375g.",
    media: { kind: "single", image: { src: "https://www.chopboxonline.com/wp-content/uploads/2022/08/18-7.png", alt: "Hooch Choco Flakes, 375g" } },
  },
];
