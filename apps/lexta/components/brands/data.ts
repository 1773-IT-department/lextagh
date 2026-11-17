/**
 * Our Brands product cards, in Lexta's Drive wording.
 *
 * The page reads the products live from Product Management (see ./live.ts). These arrays are a copy of what it shows
 * (the published products of migrations 0016, 0017 and 0021 to 0024, same names, descriptions, order and pictures),
 * kept so that:
 *  - the fallback, when the database cannot be reached, shows the same Drive wording as the live page;
 *  - they act as layout hints matched by slug: a local pack shot for a product the database has no picture for that
 *    this site can show, and the before/after strip of Yazz washing powder.
 * Every picture is a file this site ships (public/images and public/assets). Update these when products change.
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
    slug: "sanitary-pads",
    name: "Yazz sanitary pads",
    description: "Soft flexible wings provide maximum side protection. Wide adhesive on the back, holds the pad firmly in place. Wider pad for maximum coverage against leakage.",
    media: { kind: "single", image: { src: "/assets/original/web/yazz-yazz-sanitary-pad-extra-long.webp", alt: "Yazz sanitary pads" } },
  },
  {
    slug: "panty-liners",
    name: "Yazz panty liners",
    description: "New & Improved thick panty liner. 24 hrs protection.",
    media: { kind: "photo", placeholder: "Yazz panty liners pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "baby-diapers",
    name: "Yazz baby diapers",
    description: "Elastic waist. Up to 12 hours leakage protection. Cottony soft. Super absorbent.",
    media: { kind: "single", image: { src: "/images/yazz/baby-diapers-large.webp", alt: "Yazz baby diapers, large" } },
  },
  {
    slug: "baby-pull-up-pants",
    name: "Yazz pull up pants",
    description: "360 elastic waist. Up to 12 hours leakage protection. Soft and drying skin climate. Super absorbent.",
    media: { kind: "photo", placeholder: "Yazz pull up pants pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "baby-wipes",
    name: "Yazz baby wipes",
    description: "Aloe Vera: Soothe. Hydrate and protect. Super soft for sensitive skin. Care for delicate skin with Aloe Vera-enriched wipes that gently cleanse while helping soothe and hydrate. Castor Oil: Deep Moisture, Soft skin and gentle clean. Gently cleanse while helping lock in moisture with castor oil-enriched wipes, designed to leave skin feeling soft, smooth and comfortably hydrated for everyday use. Lavender: [PLACEHOLDER: Lavender wipes description; Lexta's text repeats the Aloe Vera copy].",
    media: {
      kind: "grid", columns: 3, images: [
        { src: "/images/yazz/baby-wipes-yellow.webp", alt: "Yazz baby wipes" },
        { src: "/images/yazz/baby-wipes-pack.webp", alt: "Yazz baby wipes, 80 pieces" },
        { src: "/images/yazz/baby-wipes-green.webp", alt: "Yazz baby wipes" },
      ],
    },
  },
  {
    slug: "toothpaste-herbal",
    name: "Yazz Herbal toothpaste",
    description: "For natural fresh breath, clean and healthy teeth. Protection against unpleasant sensations from hot and cold foods and drinks.",
    media: { kind: "single", image: { src: "/assets/original/web/yazz-new-yazz-herbal-toothpaste-e1787744479191.webp", alt: "Yazz Herbal toothpaste" } },
  },
  {
    slug: "toothpaste-whitening",
    name: "Yazz Whitening toothpaste",
    description: "For a whiter, brighter and healthier smile. Has a special polishing agent that provides additional stain removal effectively. Polishes off stains that have lodged onto the teeth from foodstuffs. Cool and refreshing mint fragrance makes your mouth smell good at all times.",
    media: { kind: "photo", placeholder: "Yazz Whitening toothpaste pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "toothpaste-fluoride",
    name: "Yazz Fluoride toothpaste",
    description: "Long lasting protection, for brilliant white teeth.",
    media: { kind: "single", image: { src: "/assets/original/web/yazz-new-yazz-flouride-toothpaste-e1787744539801.webp", alt: "Yazz Fluoride toothpaste" } },
  },
  {
    slug: "toothpaste-charcoal",
    name: "Yazz Charcoal toothpaste",
    description: "With activated charcoal particles, helps to cleanse your mouth and removes deep stains and discolouration. The highly absorbent activated charcoal particles penetrate and draw out stubborn stains, trap colour particles, fight bad breath and whiten teeth enamel.",
    media: { kind: "single", image: { src: "/assets/original/web/yazz-new-yazz-charcoal-toothpaste-e1787744429757.webp", alt: "Yazz Charcoal toothpaste" } },
  },
  {
    slug: "toothpaste-total-care",
    name: "Yazz Total Care toothpaste",
    description: "Everyday protection and care for your teeth.",
    media: { kind: "photo", placeholder: "Yazz Total Care toothpaste pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "toothbrushes",
    name: "Yazz toothbrushes",
    description: "Yazz toothbrushes' unique bristles are more effective in helping remove plaque and teeth stains. Innovative tongue cleaner designed to gently clean the tongue. Made with a flexible rubber handle specially designed for easy grip and convenient brushing. Dentist recommendation: change your toothbrush at least once every three months.",
    media: { kind: "photo", placeholder: "Yazz toothbrush pack shot", src: "/pasted-1788770223184-0-mtqzltnh-58d1.png", alt: "Yazz toothbrush packs", w: 1080, h: 1080 },
  },
  {
    slug: "washing-powder",
    name: "Yazz Activ washing powder",
    description: "The newly improved Yazz Activ detergent with Enzymes has been specially formulated to give you brighter and fresher clothes all the time, free from every stain. Stay bright, fresher and stain-free with Yazz Activ detergent with Enzymes.",
    media: {
      kind: "grid", columns: 2, images: [
        { src: "/images/yazz/washing-powder-pack.webp", alt: "Yazz washing powder" },
        { src: "/images/yazz/washing-powder-banner.webp", alt: "Yazz washing powder pack" },
      ],
    },
    beforeAfter: {
      before: { src: "/images/yazz/washing-dirty-cloth.webp", alt: "Cloth before washing" },
      after: { src: "/images/yazz/washing-clean-cloth.webp", alt: "Cloth after washing" },
    },
  },
  {
    slug: "mama-yazz-jumbo-tissue",
    name: "Mama Yazz jumbo tissue",
    description: "Meet Mama Yazz®, the jumbo-size tissue option created with busy households in mind. Its larger format offers a practical choice for families and spaces where tissue is used frequently, helping make everyday care more convenient.",
    media: { kind: "photo", placeholder: "Mama Yazz jumbo tissue pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "toilet-tissue-individual-wrap",
    name: "Yazz individual wrap luxury toilet tissue",
    description: "Experience everyday comfort with Yazz® Individual Wrap Luxury Toilet Tissue. Conveniently packaged as a single roll, it offers a practical and hygienic solution for personal use, family bathrooms and guest facilities.",
    media: { kind: "photo", placeholder: "Yazz individual wrap luxury toilet tissue pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "tissue-napkin",
    name: "Yazz tissue napkin",
    description: "From family meals to everyday clean-ups, Yazz® Tissue Napkin offers convenience when you need it. With 150 sheets in a roll, it is a handy addition to dining areas, kitchens and everyday household routines.",
    media: { kind: "photo", placeholder: "Yazz tissue napkin pack shot", alt: "", w: 1080, h: 1080 },
  },
  {
    slug: "individual-tissue",
    name: "Yazz individual tissue",
    description: "Yazz® Individual Tissue brings practical personal hygiene into your daily routine. Its single-roll format makes it an easy choice for home bathrooms, workplaces and other everyday spaces.",
    media: { kind: "photo", placeholder: "Yazz individual tissue pack shot", alt: "", w: 1080, h: 1080 },
  },
];

export const linzzyProducts: ProductCard[] = [
  {
    slug: "heavy-flow-sanitary-towels",
    name: "Linzzy Heavy Flow Sanitary Towels",
    description: "Some menstrual days require additional protection. Linzzy Heavy Flow Sanitary Towels are designed for women who prefer higher absorbency during heavier menstrual flow. Featuring the brand's Absorb, Lock and Breathe design positioning, this variant offers a practical option for managing heavier days while supporting everyday comfort.",
    media: { kind: "single", image: { src: "/images/linzzy/pad-heavy-flow.webp", alt: "Linzzy Heavy Flow sanitary towels pack: 12 towels of 290 mm plus 2 free panty liners" } },
  },
  {
    slug: "cool-mint-sanitary-towels",
    name: "Linzzy Cool Mint Sanitary Towels",
    description: "Every woman has different preferences when it comes to menstrual care. Linzzy Cool Mint Sanitary Towels provide a cooling-style option within the feminine care collection. The pack combines sanitary towels of different lengths, allowing consumers to choose according to their flow and coverage preferences.",
    media: { kind: "single", image: { src: "/images/linzzy/pad-cool-mint.webp", alt: "Linzzy Cool Mint sanitary towels pack: 6 towels of 260 mm, 6 of 290 mm and 3 panty liners" } },
  },
  {
    slug: "extra-long-sanitary-towels",
    name: "Linzzy Extra Long Sanitary Towels",
    description: "Whether you're resting, travelling or managing a busy day, choosing a sanitary towel with suitable coverage can make a difference. Linzzy Extra Long Sanitary Towels offer an extended-length option for consumers who prefer additional coverage.",
    media: { kind: "single", image: { src: "/images/linzzy/pad-extra-long.webp", alt: "Linzzy Extra Long sanitary towels pack: 9 towels of 330 mm, 2 of 290 mm and 2 free panty liners" } },
  },
  {
    slug: "panty-liners",
    name: "Linzzy Panty Liners",
    description: "Sometimes, the smallest essentials make everyday routines more convenient. Linzzy Panty Liners offer a compact option for managing light spotting or small amounts of moisture. Designed for light protection rather than regular menstrual flow, these liners can be incorporated into personal care routines according to individual preference.",
    media: { kind: "single", image: { src: "/images/linzzy/panty-liner.webp", alt: "Linzzy Panty Liner pack: 30 liners of 155 mm" } },
  },
  {
    slug: "baby-diapers",
    name: "Linzzy Baby Diapers",
    description: "Every baby has a world to discover. From stretching little legs to learning how to crawl, babies need diapers that fit comfortably and allow natural movement. Linzzy Baby Diapers feature a flexible-comfort design intended to support everyday diapering needs.",
    media: { kind: "single", image: { src: "/images/linzzy/baby-diapers.webp", alt: "Linzzy Baby Diapers pack, size L, 40 pieces, with a mother and baby on the pack" } },
  },
  {
    slug: "baby-wipes",
    name: "Linzzy Baby Wipes",
    description: "Little hands, tiny feet and unexpected messes are all part of raising a baby. Linzzy Baby Wipes offer a convenient cleaning option for everyday care routines at home or on the go. Available in different variants, Linzzy Baby Wipes provide parents with options to suit their preferences.",
    media: { kind: "single", image: { src: "/images/linzzy/baby-wipes.webp", alt: "Linzzy Baby Wipes packs in yellow, pink and blue, 80 wipes each" } },
  },
];

export const hoochProducts: ProductCard[] = [
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
