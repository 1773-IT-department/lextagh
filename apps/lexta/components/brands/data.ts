/**
 * Our Brands product content, exactly as in the approved prototype.
 *
 * Static for now. Item 20 (Product Management) can replace these arrays with rows from Supabase:
 * the page only needs a list of ProductCard per brand.
 * Remote image URLs are the ones the prototype uses (existing brand sites and retailer listings).
 */

import type { CSSProperties } from "react";

export type ProductImage = { src: string; alt: string };

/** How the pack shots sit in the 230px media box of a card. */
export type ProductMedia =
  | { kind: "single"; image: ProductImage; /** prototype one-off inline style for this image */ imgStyle?: CSSProperties; imgSize?: { width: number; height: number } }
  | { kind: "grid"; columns: 2 | 3; images: ProductImage[] }
  | { kind: "photo"; placeholder: string; src: string; alt: string; w: number; h: number; /** prototype slot size override */ size?: { width: number; height: number } };

export type ProductCard = {
  name: string;
  description: string;
  media: ProductMedia;
  /** Optional before/after strip (Yazz washing powder). */
  beforeAfter?: { before: ProductImage; after: ProductImage };
};

export const yazzProducts: ProductCard[] = [
  {
    name: "Sanitary pads and panty liners",
    description: "Winged, high absorbency pads engineered for security and comfort through a full day. Available across regular, heavy flow and extra long formats, with panty liners for everyday freshness.",
    media: { kind: "single", image: { src: "https://yazzproducts.com/wp-content/uploads/2026/07/Yazz-sanitary-pad-Extra-Long.png", alt: "Yazz sanitary pads" } },
  },
  {
    name: "Toothpaste",
    description: "The new Yazz range comes in three variants: Charcoal, Herbal and Fluoride. Formulated with calcium carbonate, fluoride and sodium to strengthen enamel and guard against plaque, cavities, bleeding gums and bad breath. The Herbal variant carries a blend of herbs that soothes the gums.",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-charcoal-Toothpaste-e1787744429757.jpg", alt: "Yazz Charcoal toothpaste" },
        { src: "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-herbal-Toothpaste-e1787744479191.jpg", alt: "Yazz Herbal toothpaste" },
        { src: "https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-Flouride-Toothpaste-e1787744539801.jpg", alt: "Yazz Fluoride toothpaste" },
      ],
    },
  },
  {
    name: "Toothbrushes",
    description: "Designed to pair with the range, built to last longer than the month you bought them for.",
    media: { kind: "photo", placeholder: "Yazz toothbrush pack shot", src: "/pasted-1788770223184-0-mtqzltnh-58d1.png", alt: "Yazz toothbrush packs", w: 1080, h: 1080 },
  },
  {
    name: "Washing powder",
    description: "Active enzymes formulated to lift the toughest stains, with perfumed blue speckles that leave clothes smelling fresh. Clinically tested to be gentle on hands. Tough on stains, kind on fabric.",
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
    name: "Baby wipes",
    description: "Alcohol free, gently scented wipes that clean and care for delicate skin, leaving it fresh and smooth. Available in three variants.",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-yellow.jpg", alt: "Yazz baby wipes" },
        { src: "https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/70195_1_1.jpg", alt: "Yazz baby wipes, 80 pieces" },
        { src: "https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-green.jpg", alt: "Yazz baby wipes" },
      ],
    },
  },
  {
    name: "Baby diapers",
    description: "Absorbent, secure and comfortable, for the long nights and the longer days.",
    media: { kind: "single", image: { src: "https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/7018.png", alt: "Yazz baby diapers, large" } },
  },
  {
    name: "Tissue and kitchen towels",
    description: "Pocket tissues, toilet rolls, and Mama Yazz, our two ply kitchen towel, named for the number of jobs it ends up doing in a Ghanaian kitchen.",
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
    name: "Sanitary napkins",
    description: "A full portfolio including Cool Mint, Heavy Flow and Extra Long, each with clinical anti leak barriers and structured absorption designed for a specific need rather than an average one.",
    media: { kind: "single", image: { src: "https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Your-trusted-partner-copy.jpg.jpeg", alt: "Linzzy sanitary napkins" } },
  },
  {
    name: "Baby wipes",
    description: "Ultra mild, fragrance free wipes in 80 piece packs, formulated for sensitive skin and built to hold up to the job.",
    media: {
      kind: "single",
      image: { src: "/pasted-1788770820092-0-mtqzymab-4cn2.png", alt: "Linzzy baby wipes" },
      imgSize: { width: 447, height: 447 },
      // Fixed size the prototype editor left on this image.
      imgStyle: { maxWidth: "100%", height: 199, display: "block", objectFit: "cover", width: 245, aspectRatio: "447 / 447" },
    },
  },
  {
    name: "Baby care",
    description: "A growing range of everyday essentials for the youngest members of the household.",
    media: { kind: "single", image: { src: "https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Baby-Diaper-copy.jpg-1.jpeg", alt: "Linzzy baby care" } },
  },
];

export const hoochProducts: ProductCard[] = [
  {
    name: "Super Crunchy Corn Flakes",
    description: "Traditional, crisp, sun ripened corn flakes toasted for a crunch that survives the milk, fortified with essential vitamins.",
    media: { kind: "single", image: { src: "https://www.chopboxonline.com/wp-content/uploads/2022/08/NewBookImages-53-1.png", alt: "Hooch Super Crunchy Corn Flakes, 375g" } },
  },
  {
    name: "Frosted Flakes",
    description: "A measured balance of sweetness and high energy grain, low in fat, made for active mornings and small people with strong opinions.",
    // The prototype editor left a fixed 390 x 248 size on this photo slot; kept so the card looks as approved.
    media: { kind: "photo", placeholder: "Hooch Frosted Flakes pack shot", src: "/pasted-1788770879108-0-mtqzzvrf-xf3v.png", alt: "Hooch Frosted Flakes pack", w: 1080, h: 1080, size: { width: 390, height: 248 } },
  },
  {
    name: "Choco Flakes",
    description: "The same fortified grain base, finished with cocoa. Available in 375g.",
    media: { kind: "single", image: { src: "https://www.chopboxonline.com/wp-content/uploads/2022/08/18-7.png", alt: "Hooch Choco Flakes, 375g" } },
  },
];
