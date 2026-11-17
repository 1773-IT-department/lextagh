/**
 * The Yazz product ranges: one shared page layout (/products/[range]) filled with each range's words and colours.
 *
 * Lexta's website content ("yazz website content.docx", Google Drive, Yazz Tab Content) names five ranges: Oral Care,
 * Home & Tissue, Feminine Care, Baby Care and Home Care. They all use the same range page template, so the site stays
 * at 6 pages. Every line of copy here quotes or very lightly adapts Lexta's Drive content (docs/content/yazz/): the
 * landing copy, products.md and the Tips Just 4 You pages. Nothing is kept from the prototype's own wording.
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
  /** A photo from the prototype (public/images) or the original site (public/images/original), or null for a placeholder block. */
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
  /** Tips & Advice topic for "Read more" links. */
  tipsTopic: string;
  /** The hero's third button: Lexta's tips button for the range (website-copy.md, product landing copy), to its tips. */
  tipsCta: { label: string; href: string };
  /** The range's CSR link (docs/content/yazz/products.md "CSR link" lines): its SDG and Lexta initiative. Shown as a
   *  one line strip that links out to the Lexta CSR page (brand sites have no CSR page, by contract). */
  csr: { sdg: string; initiative: string };
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
      title: ["Comfort.", "Confidence."],
      script: ["Protection.", "Period."],
      body: "Every flow is different. Explore Yazz sanitary pads and panty liners, compare the options on their approved packaging and learn practical period-care habits.",
      note: ["Comfort.", "Confidence.", "Protection."],
    },
    features: [
      { icon: "check", title: "Soft Flexible Wings", body: "Specially designed wings ensure protection of your panties." },
      { icon: "shield", title: "Wide Adhesive", body: "Wide adhesive on the back, holds the pad firmly in place." },
      { icon: "air", title: "Ultra-Thin", body: "Convenient & resealable pack, soft dry web cover for natural feeling." },
      { icon: "drop", title: "Wider Pad", body: "Wider pad for maximum coverage against leakage." },
    ],
    rangeTitle: "Every Flow Is Different",
    rangeBody: "Sanitary Pads (Green, Pink/Heavy Flow, Minty, Extra Long, Extra Long Minty); Panty Liners (Regular, Minty/Extra Long).",
    guide: {
      eyebrow: "How to use",
      title: "Using your Yazz® pad",
      note: ["Simple protection.", "Everyday confidence."],
      items: [
        { title: "Wash and dry your hands", body: "Remove the pad from its individual wrapper." },
        { title: "Peel away the protective backing", body: "Position the pad securely in the centre of your underwear." },
        { title: "If your pad has wings", body: "Fold them around the sides of your underwear to help keep the pad in place." },
        { title: "Change your pad regularly", body: "Wrap the used pad securely before placing it in an appropriate waste bin. Never flush sanitary pads down the toilet." },
      ],
    },
    habits: {
      title: "Feeling fresh every day",
      items: [
        { title: "Change regularly", body: "Change it according to your flow, comfort needs and product directions." },
        { title: "Wash your hands", body: "Wash your hands before and after changing your sanitary pad." },
        { title: "Carry your essentials", body: "Keeping an extra pad with you can make unexpected situations easier to manage." },
        { title: "Dispose responsibly", body: "Wrap used sanitary pads and place them in an appropriate waste bin. Do not flush them." },
      ],
    },
    trade: { title: "Stockist Enquiry", body: "Contact Yazz Products for all inquiries.", script: ["Own Your", "Confidence."] },
    tipsTopic: "Feminine Care",
    tipsCta: { label: "Tips Just 4 You", href: "/tips?category=just-4-you" },
    csr: { sdg: "SDG 5: Gender Equality", initiative: "The \"Empowered Periods\" Campaign/Tours" },
    seo: {
      title: "Feminine Care: Yazz sanitary pads and panty liners",
      description: "Every flow is different. Explore Yazz sanitary pads and panty liners, compare the options on their approved packaging and learn practical period-care habits.",
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
      title: ["Make good oral hygiene"],
      script: ["part of every day."],
      body: "Make good oral hygiene part of every day. Explore Yazz toothbrushes and toothpaste options and discover simple brushing habits for the whole family.",
      note: ["Your best", "smiles."],
    },
    features: [
      { icon: "shield", title: "Removes Plaque", body: "Removes plaque, protects enamel." },
      { icon: "leaf", title: "Gentle on Gums", body: "Gentle on gums, effectively cleans between the teeth." },
      { icon: "sparkle", title: "Tongue Cleaner", body: "Innovative tongue cleaner designed to gently clean the tongue." },
      { icon: "air", title: "Fresh Breath", body: "For natural fresh breath, clean and healthy teeth." },
    ],
    rangeTitle: "Our Oral Care Range",
    rangeBody: "Toothbrushes (Princess, Duke, Duchess, Monarch, Hanger, Double/His & Hers); Toothpaste (Whitening, Total Care, Herbal, Fluoride, Charcoal).",
    guide: {
      eyebrow: "Oral Hygiene Tips & Advice",
      title: "Tips for a Healthy Smile",
      note: ["Brush twice", "a day."],
      items: [
        { title: "Brush twice a day", body: "It is recommended you brush your teeth twice daily with Yazz fluoride toothpaste." },
        { title: "Correct brushing technique", body: "Hold the brush with the elbow raised up to shoulder level, and brush in a circular, up and down motion." },
        { title: "Rinse your mouth after every meal", body: "Do not eat sweet sticky food between meals." },
        { title: "Change the brush every 3 months", body: "Visit the dentist regularly for check-ups." },
      ],
    },
    trade: { title: "Stockist Enquiry", body: "Contact Yazz Products for all inquiries.", script: ["Your", "Best", "Smiles."] },
    tipsTopic: "Oral Care",
    tipsCta: { label: "Oral Hygiene Tips", href: "/tips/tips-for-a-healthy-smile" },
    csr: { sdg: "SDG 3: Good Health", initiative: "The \"Bright Smiles\" School Tour" },
    seo: {
      title: "Oral Care: Yazz toothpaste and toothbrushes",
      description: "Make good oral hygiene part of every day. Explore Yazz toothbrushes and toothpaste options and discover simple brushing habits for the whole family.",
    },
  },
  "home-tissue": {
    slug: "home-tissue",
    name: "Home & Tissue",
    tagline: "Mama Yazz, kitchen towel, toilet roll",
    icon: "tissue",
    tone: { accent: "#B05C10", deep: "#8A4A10", tint: "#FCEEDB", soft: "#FDF7EF", rgb: "176,92,16" },
    image: { src: "/images/home-tissue.webp", alt: "A smiling woman pulling a tissue from a box of Yazz facial tissues, with Yazz kitchen towel and toilet tissue" },
    imageNeeded: "Yazz tissue range pack shots",
    hero: {
      title: ["Everyday Softness."],
      script: ["Thoughtful Care."],
      body: "Care for the little moments at home. Discover Mama Yazz, kitchen towels and toilet rolls for everyday household routines. Pocket Tissue is coming soon.",
      note: ["Made for", "Every Home."],
    },
    features: [
      { icon: "box", title: "Individually Wrapped", body: "A practical and hygienic solution for personal use, family bathrooms and guest facilities." },
      { icon: "home", title: "Mama Yazz Jumbo", body: "Big on Care. Made for Family Needs." },
      { icon: "tissue", title: "150 Sheets per Roll", body: "From family meals to everyday clean-ups, Yazz® Tissue Napkin offers convenience when you need it." },
      { icon: "leaf", title: "Pocket Tissue (Coming Soon)", body: "Extra soft; 3-ply; 100% virgin-plus material." },
    ],
    rangeTitle: "Our Home & Tissue Range",
    rangeBody: "Our range of tissue products is designed to support personal hygiene, family care and daily household needs. From individual toilet rolls to convenient pocket tissues, Yazz® brings practical care to the moments that matter.",
    trade: { title: "Stockist Enquiry", body: "Contact Yazz Products for all inquiries.", script: ["Every Sheet,", "a Touch of Care."] },
    tipsTopic: "Home & Tissue",
    tipsCta: { label: "Read Home Tips", href: "/tips?category=care-tips" },
    csr: { sdg: "SDG 15: Life on Land", initiative: "The \"Yazz Forest\" Project" },
    seo: {
      title: "Home & Tissue: Mama Yazz, napkins and toilet tissue",
      description: "Care for the little moments at home. Discover Mama Yazz, kitchen towels and toilet rolls for everyday household routines. Pocket Tissue is coming soon.",
    },
  },
  "baby-care": {
    slug: "baby-care",
    name: "Baby Care",
    tagline: "Diapers & baby wipes",
    icon: "baby",
    tone: { accent: "#15803D", deep: "#126E36", tint: "#E3F4E8", soft: "#F2FAF4", rgb: "21,128,61" },
    // Pack shot from Yazz's original website (docs/content/yazz/ORIGINAL-SITE.md) until Lexta sends a range photo.
    image: { src: "/images/original/baby-diapers.webp", alt: "Yazz baby diapers, medium and large packs" },
    imageNeeded: "Yazz diapers, pull up pants and baby wipes pack shots",
    hero: {
      title: ["Everyday Care."],
      script: ["For growing", "families."],
      body: "Explore Yazz diapers and baby wipes, with practical guidance on changing routines, fit and safe product handling.",
      note: ["Caring brand", "for caring", "families."],
    },
    features: [
      { icon: "clock", title: "Leakage Protection", body: "Up to 12 hours leakage protection." },
      { icon: "drop", title: "Super Absorbent", body: "Elastic waist. Cottony soft. Super absorbent." },
      { icon: "leaf", title: "Alcohol Free", body: "Multi-Purpose cleaning. Leaves skin soft and nourished." },
      { icon: "heart", title: "Wipes", body: "Lavender, Castor Oil, Aloe Vera." },
    ],
    rangeTitle: "Our Baby Care Range",
    rangeBody: "Diapers (Regular, Pull-Ups); Wipes (Lavender, Castor Oil, Aloe Vera).",
    guide: {
      eyebrow: "How to use",
      title: "How to Use Yazz Baby Diaper",
      note: ["Cottony soft.", "Super", "absorbent."],
      items: [
        { title: "Place baby on diaper", body: "With the two back tapes at the backside." },
        { title: "Attach the two back tapes", body: "On the refastenable area to fit your baby." },
        { title: "Pull the elastic leg bands", body: "Towards the side to prevent leakage." },
        { title: "Pull up the tape", body: "And you can check whether the diaper is wet. Warning: Do not flush." },
      ],
    },
    habits: {
      title: "Caution",
      items: [
        { title: "Wash your hands", body: "Before changing your baby's diapers." },
        { title: "Clean and dry", body: "Make sure your baby is clean and dry before putting on a fresh diaper." },
        { title: "Used diapers", body: "Always throw away used diapers immediately to avoid bacteria. Do not flush." },
        { title: "Plastic bags", body: "Plastic bags are dangerous for children and must be kept out of reach or at a safe distance." },
      ],
    },
    trade: { title: "Stockist Enquiry", body: "Contact Yazz Products for all inquiries.", script: ["Soothe.", "Hydrate.", "Protect."] },
    tipsTopic: "Baby Care",
    tipsCta: { label: "Parenting Guides", href: "/tips/diaper-changing-routines" },
    csr: { sdg: "SDG 6: Clean Water & Sanitation", initiative: "The \"Safe Bottoms\" Initiative" },
    seo: {
      title: "Baby Care: Yazz diapers, pull up pants and baby wipes",
      description: "Everyday care for growing families. Explore Yazz diapers and baby wipes, with practical guidance on changing routines, fit and safe product handling.",
    },
  },
  "home-care": {
    slug: "home-care",
    name: "Home Care",
    tagline: "Washing Powder / Detergent",
    icon: "laundry",
    tone: { accent: "#6D3FC0", deep: "#55309A", tint: "#ECE6FA", soft: "#F6F3FD", rgb: "109,63,192" },
    // Pack shot from Yazz's original website (docs/content/yazz/ORIGINAL-SITE.md) until Lexta sends a range photo.
    image: { src: "/images/original/washing-powder.webp", alt: "The Yazz Activ washing powder range: box, tub and sachets" },
    imageNeeded: "Yazz Activ washing powder pack shots (200g, 500g, 2kg, 5kg)",
    hero: {
      title: ["Brighter."],
      script: ["Fresher.", "Stain free."],
      body: "Make everyday laundry care simpler with Yazz detergent products and clear instructions for use, storage and responsible disposal.",
      note: ["Removes", "stubborn", "stains."],
    },
    features: [
      { icon: "sparkle", title: "Activ With Enzymes", body: "Yazz Activ detergent with enzymes: removes stubborn stains." },
      { icon: "air", title: "Brighter & Fresher", body: "Specially formulated to give you brighter and fresher clothes all the time." },
      { icon: "check", title: "Fabrics", body: "Suitable for cotton, linen, polyester and mixtures of those fabrics." },
      { icon: "box", title: "Pack Sizes", body: "500g / 200g / 5kg / 2kg." },
    ],
    rangeTitle: "Our Home Care Range",
    rangeBody: "The newly improved Yazz Activ detergent with Enzymes has been specially formulated to give you brighter and fresher clothes all the time, free from every stain.",
    guide: {
      eyebrow: "How to use",
      title: "Check Pack for Direction",
      note: ["Stay bright,", "fresher and", "stain free."],
      items: [
        { title: "Separate", body: "Separate coloured clothes from white and wash them in different basins." },
        { title: "Dissolve", body: "Dissolve Yazz Activ detergent with enzymes in water." },
        { title: "Soak", body: "Soak clothes for 15 to 20 minutes before washing. For heavy dirt or more clothes, soak for a longer period." },
        { title: "Check pack for direction", body: "Wash by quantity of clothes against weight, or against the quantity of Yazz Activ." },
      ],
    },
    habits: {
      title: "Precautions",
      items: [
        { title: "Not for silk or wool", body: "Don't use for silk or wool clothes." },
        { title: "Dry place", body: "Keep the product in a dry place and out of reach of children." },
        { title: "Eye contact", body: "In case of eye contact, flush with plenty of water. In case of irritation on skin, discontinue use and seek medical assistance." },
        { title: "If swallowed", body: "Drink plenty of clean water or milk and seek medical assistance." },
      ],
    },
    trade: { title: "Stockist Enquiry", body: "Contact Yazz Products for all inquiries.", script: ["Brighter", "and Fresher", "Clothes."] },
    tipsTopic: "Home Care",
    tipsCta: { label: "Home-Care Advice", href: "/tips/laundry-care-with-yazz-activ" },
    csr: { sdg: "SDG 12: Responsible Consumption", initiative: "\"Clean Hands, Green Land\"" },
    seo: {
      title: "Home Care: Yazz Activ washing powder with enzymes",
      description: "Make everyday laundry care simpler with Yazz detergent products and clear instructions for use, storage and responsible disposal.",
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
