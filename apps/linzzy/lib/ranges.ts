/**
 * The Linzzy product ranges: one shared page layout (/products/[range]) filled with each range's words, photos and mood.
 *
 * Lexta's "Linzzy Website Content.docx" (Google Drive, Linzzy Tab Content) gives the Products page "two principal
 * sections: Feminine Care and Baby Care". Both use the same range template, so the site stays at 6 pages. Every line
 * of copy here is Lexta's (products.md, website-copy.md and the six quick tips); only short interface labels are ours.
 *
 * Two moods inside one Gen Z system: Feminine Care is bold and empowering (berry and plum on lilac), Baby Care is soft
 * and reassuring (mint on cream). The mood is a data attribute the CSS reads (data-mood="bold" | "soft").
 */
export const RANGE_SLUGS = ["feminine-care", "baby-care"] as const;
export type RangeSlug = (typeof RANGE_SLUGS)[number];

export const isRangeSlug = (v: string): v is RangeSlug => (RANGE_SLUGS as readonly string[]).includes(v);

export type Photo = { src: string; alt: string };

export type RangeInfo = {
  slug: RangeSlug;
  name: string;
  /** Under the name on cards and menus. */
  tagline: string;
  icon: string;
  mood: "bold" | "soft";
  /** accent: buttons and stickers; deep: headings on the tint (AA on tint and white); tint: hero; soft: cards. */
  tone: { accent: string; deep: string; tint: string; soft: string };
  image: Photo;
  /** Pack shots for the sticker collage on the hero. */
  stickers: Photo[];
  eyebrow: string;
  title: string;
  /** Lexta's one-line sign-off, set as a tilted sticker. */
  sticker: string;
  intro: string[];
  /** The home page card. */
  home: { title: string; lines: string[]; sign: string; cta: string };
  features: { icon: string; title: string; body: string }[];
  rangeTitle: string;
  rangeBody: string;
  /** A numbered how to panel. */
  guide: { eyebrow: string; title: string; items: string[]; warning?: string };
  /** "Good to know" cards, and an optional link to the rest of them on Tips & Advice. */
  habits: { title: string; items: { title: string; body: string }[]; more?: { href: string; label: string } };
  /** Tips & Advice category for the "Read more" links. */
  tipsCategory: "feminine-care" | "baby-care";
  seo: { title: string; description: string };
};

export const RANGES: Record<RangeSlug, RangeInfo> = {
  "feminine-care": {
    slug: "feminine-care",
    name: "Feminine Care",
    tagline: "Sanitary towels & panty liners",
    icon: "female",
    mood: "bold",
    tone: { accent: "#C2185B", deep: "#5B1A7A", tint: "#EFE6FF", soft: "#F8F3FF" },
    image: { src: "/images/original/banner-on-the-go.webp", alt: "A confident young woman walking with her bag beside packs of Linzzy sanitary towels" },
    stickers: [
      { src: "/images/original/pad-heavy-flow.webp", alt: "Linzzy Heavy Flow sanitary towels pack" },
      { src: "/images/original/pad-cool-mint.webp", alt: "Linzzy Cool Mint sanitary towels pack" },
      { src: "/images/original/pad-extra-long.webp", alt: "Linzzy Extra Long sanitary towels pack" },
    ],
    eyebrow: "Linzzy Feminine Care",
    title: "Comfort Through Every Cycle",
    sticker: "Your flow. Your comfort. Your choice.",
    intro: [
      "Your period is personal, and your choice of sanitary protection should reflect your individual needs.",
      "Discover the Linzzy Feminine Care Collection, featuring sanitary towels and panty liners developed for different menstrual flows, coverage preferences and everyday routines.",
    ],
    home: {
      title: "Confidence Through Every Cycle",
      lines: [
        "Every woman's menstrual experience is unique.",
        "From lighter days to heavier flows, Linzzy offers sanitary towels and panty liners designed with different lengths and protection needs in mind.",
        "Discover Linzzy Cool Mint, Heavy Flow, Extra Long Sanitary Towels and Panty Liners.",
      ],
      sign: "Your flow. Your comfort. Your choice.",
      cta: "Discover Feminine Care",
    },
    features: [
      { icon: "drop", title: "Absorb, Lock and Breathe", body: "Featuring the brand's Absorb, Lock and Breathe design." },
      { icon: "ruler", title: "Different lengths", body: "155 mm liners and 260 mm, 290 mm and 330 mm towels, for different coverage preferences." },
      { icon: "sparkle", title: "Cool Mint variant", body: "A cooling-style option for those who prefer it and tolerate its cooling sensation." },
      { icon: "heart", title: "Comfort-focused design", body: "Developed for different menstrual flows, coverage preferences and everyday routines." },
    ],
    rangeTitle: "Our Collection. Your Choice. Your Comfort.",
    rangeBody: "Heavy Flow, Cool Mint and Extra Long sanitary towels, and Panty Liners for light days.",
    guide: {
      eyebrow: "How to use",
      title: "Your towel, step by step",
      items: [
        "Remove the individual wrapper and peel away the adhesive backing.",
        "Centre the towel inside clean underwear, secure the adhesive and make sure it sits comfortably.",
        "Change regularly: a general guide is every 4 to 6 hours, or sooner if saturated, depending on your flow and product instructions.",
        "Wrap used sanitary towels securely and place them in an appropriate waste bin. Never flush them.",
      ],
      warning: "Discontinue use if itching, burning, redness or irritation develops.",
    },
    habits: {
      title: "Linzzy Tips Just for You",
      items: [
        { title: "Know Your Flow", body: "Choose sanitary protection according to your bleeding pattern, preferred fit and absorbency needs. Check the product label before use." },
        { title: "Freshness Starts with Good Habits", body: "Change sanitary towels approximately every 4 to 6 hours or sooner when needed. Change panty liners whenever damp or soiled." },
        { title: "Comfort Comes First", body: "Stop using any menstrual product that causes irritation. Fragrance or cooling sensations do not necessarily mean better hygiene." },
      ],
      // Three of Lexta's six quick tips; all six are on Tips & Advice.
      more: { href: "/tips#quick-tips", label: "All six quick tips" },
    },
    tipsCategory: "feminine-care",
    seo: {
      title: "Feminine Care",
      description: "Linzzy Heavy Flow, Cool Mint and Extra Long sanitary towels and Panty Liners: pack contents, how to use, skin sensitivity advice and where to buy.",
    },
  },
  "baby-care": {
    slug: "baby-care",
    name: "Baby Care",
    tagline: "Baby diapers & baby wipes",
    icon: "baby",
    mood: "soft",
    tone: { accent: "#0E7A5B", deep: "#0B5A44", tint: "#DDF7EC", soft: "#F1FBF6" },
    image: { src: "/images/nursery/joyful-baby.webp", alt: "A smiling baby lying on a soft blanket next to packs of Linzzy Baby Diapers" },
    stickers: [
      { src: "/images/original/baby-diapers.webp", alt: "Linzzy Baby Diapers pack, size L" },
      { src: "/images/original/baby-wipes.webp", alt: "Linzzy Baby Wipes in yellow, pink and blue packs" },
    ],
    eyebrow: "Linzzy Baby Care",
    title: "Little Beginnings Deserve Loving Care",
    sticker: "Little Moments. Loving Care. Brighter Beginnings.",
    intro: [
      "From your baby's earliest days to the exciting stages of growth, Linzzy Baby Care supports the everyday hygiene routines of parents and caregivers.",
      "Explore our baby diapers and wipes, created for families who value comfort, cleanliness and convenient care.",
    ],
    home: {
      title: "Little Beginnings, Loving Protection",
      lines: [
        "Your baby's world is filled with first smiles, little movements, playful discoveries and beautiful milestones.",
        "Linzzy Baby Diapers and Baby Wipes are designed to support the daily care routines that keep little ones clean and comfortable.",
        "From diaper changes at home to family outings, Linzzy is part of your everyday care essentials.",
      ],
      sign: "Little Moments. Loving Care. Brighter Beginnings.",
      cta: "Discover Baby Care",
    },
    features: [
      { icon: "baby", title: "Flexible Comfort design", body: "Diapers that fit comfortably and allow natural movement." },
      { icon: "people", title: "Unisex diaper range", body: "Different sizes for growing babies, in a disposable diaper format." },
      { icon: "box", title: "80 wipes per pack", body: "Convenient resealable packaging, portable for diaper bags and travel." },
      { icon: "flower", title: "Different variants", body: "Pink (Rose Perfume), Blue (Lavender Perfume) and Yellow wipes packs." },
    ],
    rangeTitle: "Diapers and Wipes for Every Little Move",
    rangeBody: "Linzzy Baby Diapers and Linzzy Baby Wipes, for families who value comfort, cleanliness and convenient care.",
    guide: {
      eyebrow: "How to use",
      title: "A diaper change, step by step",
      items: [
        "Place your baby on a clean, safe changing surface.",
        "Remove the soiled diaper and gently clean the diaper area.",
        "Allow the skin to dry.",
        "Position a fresh Linzzy diaper comfortably.",
        "Fasten securely without making it too tight.",
        "Dispose of the used diaper responsibly and wash your hands.",
      ],
      warning: "Never leave your baby unattended during a diaper change.",
    },
    habits: {
      title: "Gentle care, good habits",
      items: [
        { title: "Check the fit", body: "Check diaper fit regularly, particularly during periods of rapid growth." },
        { title: "Change promptly", body: "Check the diaper area regularly and change wet or soiled diapers promptly." },
        { title: "Store wipes well", body: "Store wipes in a cool, dry place, away from direct sunlight and excessive heat, and keep the package securely closed." },
        { title: "Never flush wipes", body: "Used baby wipes should be placed in an appropriate waste bin. Never flush them down the toilet." },
      ],
    },
    tipsCategory: "baby-care",
    seo: {
      title: "Baby Care",
      description: "Linzzy Baby Diapers and Baby Wipes: sizes, pack contents, how to use, skin sensitivity advice and where to buy.",
    },
  },
};

/**
 * Product Management category to range. The Linzzy products seeded from the Lexta prototype (0004) use "Personal care"
 * and "Baby care"; anything else is sorted by its words.
 */
const CATEGORY_RANGE: Record<string, RangeSlug> = {
  "personal care": "feminine-care",
  "feminine care": "feminine-care",
  "sanitary pads": "feminine-care",
  "panty liner": "feminine-care",
  "baby care": "baby-care",
  "baby diapers": "baby-care",
  "baby wipes": "baby-care",
};

export function rangeOf(category: string | null | undefined, name = ""): RangeSlug {
  const c = (category ?? "").trim().toLowerCase();
  if (CATEGORY_RANGE[c]) return CATEGORY_RANGE[c];
  const words = `${c} ${name.toLowerCase()}`;
  if (/\b(pad|pads|liner|liners|sanitary|towel|towels|napkin|napkins|feminine|period)\b/.test(words)) return "feminine-care";
  return "baby-care";
}
