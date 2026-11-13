/**
 * The Yazz product ranges: one shared page layout (/products/[range]) filled with each range's words and colours.
 *
 * Lexta's website content ("yazz website content.docx", Google Drive, Yazz Tab Content) names five ranges: Oral Care,
 * Home & Tissue, Feminine Care, Baby Care and Home Care. They all use the same range page template, so the site stays
 * at 6 pages. The landing copy, features, how to use and good to know points come from that document; the big
 * headlines and script notes keep the wording of Desmond's Claude Design prototype.
 */
export const RANGE_SLUGS = ["feminine-care", "oral-care", "home-tissue", "baby-care", "home-care"] as const;
export type RangeSlug = (typeof RANGE_SLUGS)[number];

export const isRangeSlug = (v: string): v is RangeSlug => (RANGE_SLUGS as readonly string[]).includes(v);

export type RangeInfo = {
  slug: RangeSlug;
  name: string;
  /** Under the name on cards and menus. */
  tagline: string;
  icon: string;
  /** Colours: accent (eyebrows, chips), deep (headings on the tint), tint (hero), soft (cards), rgb for overlays. */
  tone: { accent: string; deep: string; tint: string; soft: string; rgb: string };
  /** A photo from the prototype (public/images), or null for a branded placeholder block. */
  image: { src: string; alt: string } | null;
  /** What photo is still needed (CONTENT-NEEDED.md), shown in the placeholder block. */
  imageNeeded: string;
  hero: { title: string[]; script: string[]; body: string; note: string[] };
  features: { icon: string; title: string; body: string }[];
  rangeTitle: string;
  rangeBody: string;
  /** A numbered how to panel. */
  guide?: { eyebrow: string; title: string; note: string[]; items: { title: string; body: string }[] };
  /** "Good to know" points. */
  habits?: { title: string; items: { title: string; body: string }[] };
  trade: { title: string; body: string; script: string[] };
  /** Tips & Articles topic for "Read more" links. */
  tipsTopic: string;
  seo: { title: string; description: string };
};

export const RANGES: Record<RangeSlug, RangeInfo> = {
  "feminine-care": {
    slug: "feminine-care",
    name: "Feminine Care",
    tagline: "Sanitary pads & panty liners",
    icon: "female",
    tone: { accent: "#EC1B7B", deep: "#C2477F", tint: "#FADCEB", soft: "#FDF1F7", rgb: "236,27,123" },
    image: { src: "/images/feminine-care.webp", alt: "A smiling young woman holding a pack of Yazz sanitary pads, with Yazz panty liners on the table" },
    imageNeeded: "Yazz sanitary pads and panty liners pack shots",
    hero: {
      title: ["Comfort.", "Protection."],
      script: ["Confidence,", "every day."],
      body: "Every flow is different. Explore Yazz sanitary pads and panty liners, compare the options on their approved packaging and learn practical period-care habits.",
      note: ["Comfort.", "Confidence.", "Protection."],
    },
    features: [
      { icon: "check", title: "Soft Flexible Wings", body: "Maximum side protection, specially designed to protect your panties." },
      { icon: "shield", title: "Wide Adhesive", body: "A wide adhesive on the back holds the pad firmly in place." },
      { icon: "air", title: "Ultra-Thin & Soft", body: "A soft dry web cover for a natural feeling, with round edges for comfort." },
      { icon: "drop", title: "Wider Coverage", body: "A wider pad for maximum coverage against leakage." },
    ],
    rangeTitle: "Care for Every You",
    rangeBody: "Sanitary pads in normal and heavy flow lengths, and panty liners for every day.",
    guide: {
      eyebrow: "How to use",
      title: "Using your Yazz® pad",
      note: ["Simple protection.", "Everyday confidence."],
      items: [
        { title: "Wash your hands", body: "Wash and dry your hands, then remove the pad from its individual wrapper." },
        { title: "Position it", body: "Peel away the protective backing and place the pad securely in the centre of your underwear." },
        { title: "Fold the wings", body: "If your pad has wings, fold them around the sides of your underwear to help keep it in place." },
        { title: "Change and bin", body: "Change regularly. Wrap the used pad and place it in a waste bin. Never flush it." },
      ],
    },
    habits: {
      title: "Feeling fresh every day",
      items: [
        { title: "Change regularly", body: "Change according to your flow, comfort needs and product directions." },
        { title: "Wash your hands", body: "Before and after changing your sanitary pad." },
        { title: "Carry your essentials", body: "An extra pad with you makes unexpected situations easier to manage." },
        { title: "Dispose responsibly", body: "Wrap used pads and place them in a waste bin. Do not flush them." },
      ],
    },
    trade: { title: "Stocking for a shop or school?", body: "Order Yazz pads and liners in bulk for your shop, school or organisation.", script: ["More", "Comfort.", "More Smiles."] },
    tipsTopic: "Feminine Care",
    seo: {
      title: "Feminine Care: Yazz sanitary pads and panty liners",
      description: "Yazz sanitary pads and panty liners: soft flexible wings, ultra-thin comfort and wider coverage. See the range and where to buy near you.",
    },
  },
  "oral-care": {
    slug: "oral-care",
    name: "Oral Care",
    tagline: "Toothpaste & toothbrushes",
    icon: "tooth",
    tone: { accent: "#0B4FA5", deep: "#4A7BB5", tint: "#DCEEFC", soft: "#F3F8FD", rgb: "11,79,165" },
    image: { src: "/images/oral-care.webp", alt: "A smiling man brushing his teeth, with Yazz Fresh Mint toothpaste on the counter" },
    imageNeeded: "Yazz toothpaste and toothbrush pack shots",
    hero: {
      title: ["Healthy Smiles."],
      script: ["Brighter days,", "every morning."],
      body: "Make good oral hygiene part of every day. Explore Yazz toothbrushes and toothpaste options and discover simple brushing habits for the whole family.",
      note: ["Your best", "smiles."],
    },
    features: [
      { icon: "shield", title: "Removes Plaque", body: "A unique bristle that helps remove plaque and protects enamel." },
      { icon: "leaf", title: "Gentle on Gums", body: "Effectively cleans between the teeth with easy cleaning and massage." },
      { icon: "sparkle", title: "Tongue Cleaner", body: "An innovative tongue cleaner designed to gently clean the tongue." },
      { icon: "air", title: "Fresh Breath", body: "Toothpaste for natural fresh breath, clean and healthy teeth." },
    ],
    rangeTitle: "A Smile for Everyone",
    rangeBody: "Toothpaste in Herbal, Whitening, Fluoride, Charcoal and Total Care, and toothbrushes for the whole family.",
    guide: {
      eyebrow: "Tips for a healthy smile",
      title: "Two minutes, twice a day",
      note: ["Fresh start.", "Every day."],
      items: [
        { title: "Brush twice a day", body: "With Yazz fluoride toothpaste, morning and night." },
        { title: "Brush the right way", body: "Hold the brush with your elbow raised to shoulder level and brush in a circular, up and down motion." },
        { title: "After every meal", body: "Rinse your mouth, and do not eat sweet sticky food between meals." },
        { title: "Every 3 months", body: "Change your toothbrush, and visit the dentist regularly for check-ups." },
      ],
    },
    trade: { title: "Stocking for a shop or clinic?", body: "Order Yazz toothpaste and toothbrushes in bulk for your shop or clinic.", script: ["Fresher", "Breath.", "More Smiles."] },
    tipsTopic: "Oral Care",
    seo: {
      title: "Oral Care: Yazz toothpaste and toothbrushes",
      description: "Yazz toothpaste in Herbal, Whitening, Fluoride, Charcoal and Total Care, and toothbrushes with tongue cleaners. See the range and where to buy.",
    },
  },
  "home-tissue": {
    slug: "home-tissue",
    name: "Home & Tissue",
    tagline: "Mama Yazz, napkins & toilet rolls",
    icon: "tissue",
    tone: { accent: "#B05C10", deep: "#8A4A10", tint: "#FCEEDB", soft: "#FDF7EF", rgb: "176,92,16" },
    image: { src: "/images/home-tissue.webp", alt: "A smiling woman pulling a tissue from a box of Yazz facial tissues, with Yazz kitchen towel and toilet tissue" },
    imageNeeded: "Yazz tissue range pack shots",
    hero: {
      title: ["Everyday Softness."],
      script: ["Thoughtful Care."],
      body: "Care for the little moments at home. Discover Mama Yazz, tissue napkins and toilet rolls for everyday household routines. Pocket Tissue is coming soon.",
      note: ["Made for", "Every Home."],
    },
    features: [
      { icon: "box", title: "Individually Wrapped", body: "A practical and hygienic single roll for family bathrooms and guests." },
      { icon: "home", title: "Mama Yazz Jumbo", body: "Big on care: a jumbo size made for busy family households." },
      { icon: "tissue", title: "150-Sheet Napkins", body: "From family meals to everyday clean-ups, a handy roll for the dining area." },
      { icon: "leaf", title: "Pocket Tissue, Soon", body: "Extra soft, 3-ply and made from 100% virgin-plus material." },
    ],
    rangeTitle: "Our Home & Tissue Range",
    rangeBody: "From individual toilet rolls to convenient pocket tissues, Yazz® brings practical care to the moments that matter.",
    trade: { title: "Complete Home Care. All in One Brand.", body: "Order Yazz tissue and napkins in bulk for your shop, office or hotel.", script: ["More Care", "for Your Home"] },
    tipsTopic: "Home & Tissue",
    seo: {
      title: "Home & Tissue: Mama Yazz, napkins and toilet tissue",
      description: "Yazz individual wrap toilet tissue, tissue napkins, Mama Yazz jumbo tissue and pocket tissue (coming soon). See the range and where to buy.",
    },
  },
  "baby-care": {
    slug: "baby-care",
    name: "Baby Care",
    tagline: "Diapers & baby wipes",
    icon: "baby",
    tone: { accent: "#15803D", deep: "#126E36", tint: "#E3F4E8", soft: "#F2FAF4", rgb: "21,128,61" },
    image: null,
    imageNeeded: "Yazz diapers, pull up pants and baby wipes pack shots",
    hero: {
      title: ["Everyday Care."],
      script: ["For growing", "families."],
      body: "Explore Yazz diapers and baby wipes, with practical guidance on changing routines, fit and safe product handling.",
      note: ["Caring brand", "for caring", "families."],
    },
    features: [
      { icon: "clock", title: "12 Hours Protection", body: "Up to 12 hours leakage protection in diapers and pull up pants." },
      { icon: "drop", title: "Super Absorbent", body: "Cottony soft diapers with an elastic waist for a secure fit." },
      { icon: "leaf", title: "Alcohol Free Wipes", body: "Gentle, multi-purpose cleansing that leaves skin soft and nourished." },
      { icon: "heart", title: "Three Wipe Variants", body: "Lavender, Castor Oil and Aloe Vera, for everyday care." },
    ],
    rangeTitle: "Our Baby Care Range",
    rangeBody: "Taped diapers and pull up pants in every size, and baby wipes in three variants.",
    guide: {
      eyebrow: "How to use",
      title: "Putting on a Yazz® diaper",
      note: ["Clean, dry,", "comfortable."],
      items: [
        { title: "Back tapes behind", body: "Place baby on the diaper with the two back tapes at the back." },
        { title: "Fasten to fit", body: "Attach the two back tapes on the refastenable area to fit your baby." },
        { title: "Leg bands out", body: "Pull the elastic leg bands towards the side to prevent leakage." },
        { title: "Check and change", body: "Pull up the tape to check whether the diaper is wet. Never flush a diaper." },
      ],
    },
    habits: {
      title: "Good to know",
      items: [
        { title: "Clean hands", body: "Wash your hands before changing your baby's diaper." },
        { title: "Clean and dry", body: "Make sure your baby is clean and dry before putting on a fresh diaper." },
        { title: "Bin it straight away", body: "Throw away used diapers immediately. Do not flush diapers or wipes." },
        { title: "Bags out of reach", body: "Plastic bags are dangerous for children; keep them out of reach." },
      ],
    },
    trade: { title: "Stocking for a shop or pharmacy?", body: "Order Yazz diapers and baby wipes in bulk for your shop or pharmacy.", script: ["Happy", "Babies.", "More Smiles."] },
    tipsTopic: "Baby Care",
    seo: {
      title: "Baby Care: Yazz diapers, pull up pants and baby wipes",
      description: "Yazz diapers and pull up pants with up to 12 hours leakage protection, and alcohol free baby wipes. See sizes and where to buy.",
    },
  },
  "home-care": {
    slug: "home-care",
    name: "Home Care",
    tagline: "Washing powder & detergent",
    icon: "laundry",
    tone: { accent: "#6D3FC0", deep: "#55309A", tint: "#ECE6FA", soft: "#F6F3FD", rgb: "109,63,192" },
    image: null,
    imageNeeded: "Yazz Activ washing powder pack shots (200g, 500g, 2kg, 5kg)",
    hero: {
      title: ["Brighter."],
      script: ["Fresher.", "Stain free."],
      body: "Make everyday laundry care simpler with Yazz detergent products and clear instructions for use, storage and responsible disposal.",
      note: ["Fresher", "Cleaner", "Brighter"],
    },
    features: [
      { icon: "sparkle", title: "Activ With Enzymes", body: "Yazz Activ detergent with enzymes removes stubborn stains." },
      { icon: "air", title: "Brighter & Fresher", body: "Specially formulated for brighter, fresher clothes all the time." },
      { icon: "check", title: "For Everyday Fabrics", body: "Suitable for cotton, linen, polyester and mixtures of those fabrics." },
      { icon: "box", title: "Four Pack Sizes", body: "200g, 500g, 2kg and 5kg, for every household." },
    ],
    rangeTitle: "Our Home Care Range",
    rangeBody: "Yazz Activ detergent with enzymes, newly improved for brighter and fresher clothes.",
    guide: {
      eyebrow: "How to use",
      title: "Washing with Yazz® Activ",
      note: ["Stay bright,", "fresher and", "stain free."],
      items: [
        { title: "Sort first", body: "Separate coloured clothes from white and wash them in different basins." },
        { title: "Dissolve", body: "Dissolve Yazz Activ detergent with enzymes in water." },
        { title: "Soak", body: "Soak clothes for 15 to 20 minutes before washing; longer for heavy dirt." },
        { title: "Check the pack", body: "Wash by quantity of clothes against weight. Check the pack for directions at all times." },
      ],
    },
    habits: {
      title: "Precautions",
      items: [
        { title: "Not for silk or wool", body: "Use for cotton, linen, polyester and mixtures of those fabrics." },
        { title: "Store safely", body: "Keep the product in a dry place and out of reach of children." },
        { title: "Eyes and skin", body: "In case of eye contact, flush with plenty of water. If skin irritation occurs, stop use and seek medical help." },
        { title: "If swallowed", body: "Drink plenty of clean water or milk and seek medical assistance." },
      ],
    },
    trade: { title: "Stocking for a shop or laundry?", body: "Order Yazz Activ detergent in bulk for your shop, laundry or institution.", script: ["Fresher", "Cleaner", "Brighter"] },
    tipsTopic: "Home Care",
    seo: {
      title: "Home Care: Yazz Activ washing powder with enzymes",
      description: "Yazz Activ detergent with enzymes removes stubborn stains for brighter, fresher clothes. In 200g, 500g, 2kg and 5kg packs. See where to buy.",
    },
  },
};

/**
 * Which range a product belongs to, from Product Management's free text category (and its name as a last hint).
 *   Personal care, Feminine care          -> Feminine Care
 *   Oral care                             -> Oral Care
 *   Tissue and kitchen towels, Tissue     -> Home & Tissue
 *   Baby care                             -> Baby Care
 *   Cleaning, Home care, Laundry          -> Home Care
 * Anything else falls back on words in the category or name, then Home & Tissue.
 */
const CATEGORY_RANGE: Record<string, RangeSlug> = {
  "personal care": "feminine-care",
  "feminine care": "feminine-care",
  "feminine hygiene": "feminine-care",
  "oral care": "oral-care",
  "tissue and kitchen towels": "home-tissue",
  tissue: "home-tissue",
  tissues: "home-tissue",
  "home & tissue": "home-tissue",
  "home and tissue": "home-tissue",
  "baby care": "baby-care",
  cleaning: "home-care",
  laundry: "home-care",
  "home care": "home-care",
};

export function rangeOf(category: string | null | undefined, name = ""): RangeSlug {
  const c = (category ?? "").trim().toLowerCase();
  if (CATEGORY_RANGE[c]) return CATEGORY_RANGE[c];
  const words = `${c} ${name.toLowerCase()}`;
  if (/\b(pad|pads|liner|liners|sanitary|feminine|period)\b/.test(words)) return "feminine-care";
  if (/\b(tooth|teeth|oral|dental|mouth)/.test(words)) return "oral-care";
  if (/\b(baby|diaper|diapers|nappy|wipes)\b/.test(words)) return "baby-care";
  if (/\b(washing|detergent|laundry|soap)\b/.test(words)) return "home-care";
  return "home-tissue";
}
