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
    media: { kind: "single", image: { src: "/assets/original/web/yazz-yazz-sanitary-pad-extra-long.webp", alt: "Yazz sanitary pads" } },
  },
  {
    slug: "toothpaste",
    name: "Toothpaste",
    description: "The Yazz range comes in five variants: Whitening, Total Care, Herbal, Fluoride and Charcoal. Made for whiter, brighter and healthier smiles, with everyday protection against plaque, cavities and bad breath. The Herbal variant carries a unique blend of herbs.",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "/assets/original/web/yazz-new-yazz-charcoal-toothpaste-e1787744429757.webp", alt: "Yazz Charcoal toothpaste" },
        { src: "/assets/original/web/yazz-new-yazz-herbal-toothpaste-e1787744479191.webp", alt: "Yazz Herbal toothpaste" },
        { src: "/assets/original/web/yazz-new-yazz-flouride-toothpaste-e1787744539801.webp", alt: "Yazz Fluoride toothpaste" },
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
        { src: "/assets/original/web/yazz-edsfdc2w4aau3pt.webp", alt: "Yazz washing powder" },
        { src: "/assets/original/web/lexta-yazz-washing-powder1.webp", alt: "Yazz washing powder pack" },
      ],
    },
    beforeAfter: {
      before: { src: "/assets/original/web/yazz-dirty-yazz-cloth.webp", alt: "Cloth before washing" },
      after: { src: "/assets/original/web/yazz-clean-yazz-cloth.webp", alt: "Cloth after washing" },
    },
  },
  {
    slug: "baby-wipes",
    name: "Baby wipes",
    description: "Alcohol free wipes that gently cleanse and care for delicate skin, leaving it soft and nourished. Available in Lavender, Castor Oil and Aloe Vera.",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "/assets/original/web/yazz-yazz-baby-wipes-new-yellow.webp", alt: "Yazz baby wipes" },
        { src: "/assets/original/web/yazz-yazz-baby-wipes-new1.webp", alt: "Yazz baby wipes, 80 pieces" },
        { src: "/assets/original/web/yazz-yazz-baby-wipes-new-green.webp", alt: "Yazz baby wipes" },
      ],
    },
  },
  {
    slug: "baby-diapers",
    name: "Baby diapers",
    description: "Regular diapers and pull up pants with elastic waists, cottony softness and up to 12 hours leakage protection.",
    media: { kind: "single", image: { src: "/assets/original/web/yazz-baby-diapers.webp", alt: "Yazz baby diapers, large" } },
  },
  {
    slug: "tissue",
    name: "Tissue and kitchen towels",
    description: "Mama Yazz jumbo tissue, kitchen towels, toilet rolls and tissue napkins for everyday household routines. Pocket Tissue is coming soon.",
    media: {
      kind: "grid", columns: 2, images: [
        { src: "/assets/original/web/yazz-unnamed-1.webp", alt: "Yazz tissue" },
        { src: "/assets/original/web/yazz-mama-yazz-kitchen-towel2.webp", alt: "Mama Yazz kitchen towel" },
      ],
    },
  },
];

export const linzzyProducts: ProductCard[] = [
  {
    slug: "sanitary-napkins",
    name: "Sanitary towels",
    description: "Cool Mint, Heavy Flow and Extra Long sanitary towels built around the Absorb, Lock and Breathe positioning, plus Linzzy Panty Liners for light everyday protection.",
    media: { kind: "single", image: { src: "/assets/original/web/lexta-linzzy-your-trusted-partner-copy.webp", alt: "Linzzy sanitary towels" } },
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
    media: { kind: "single", image: { src: "/assets/original/web/lexta-linzzy-baby-diaper-copy.webp", alt: "Linzzy baby care" } },
  },
];

export const hoochProducts: ProductCard[] = [
  // Lexta's two Drive cereals (as migration 0017 writes them), shown only when Product Management can't be read. The
  // pictures are shared pack shots made from Lexta's own Hooch artwork, shipped by this site too (public/images/hooch).
  {
    slug: "cornflakes",
    name: "Hooch® Cornflakes",
    description: "Start your morning with the golden crunch of Hooch® Cornflakes. With its enjoyable crispy texture and convenient individual portions, it's an easy breakfast option for the whole family. Each 500g product contains 10 smaller packs of 50g, allowing family members to prepare their own cereal portions with less measuring.",
    media: { kind: "single", image: { src: "/images/hooch/cornflakes-bowl.webp", alt: "A box of Hooch® Cornflakes, 500g, with fresh strawberries" } },
  },
  {
    slug: "frosted-flakes",
    name: "Hooch® Frosted Flakes",
    description: "Add a little sweetness to your breakfast routine with Hooch® Frosted Flakes. Combining a crispy texture with a sweet frosted finish, it's a delightful choice for families who enjoy a sweeter cereal. Each 375g product contains 10 smaller packs of 37.5g, conveniently portioned for everyday breakfast preparation.",
    media: { kind: "single", image: { src: "/images/hooch/frosted-flakes-bowl.webp", alt: "A box of Hooch® Frosted Flakes with fresh strawberries" } },
  },
];
