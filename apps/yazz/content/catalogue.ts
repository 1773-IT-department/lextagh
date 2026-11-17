/**
 * The Yazz catalogue as Lexta wrote it ("yazz website content.docx", Google Drive, Yazz Tab Content, Tab 3 Products),
 * structured for Product Management.
 *
 * The site always shows the products in the database (lib/products.ts); this list is only:
 *   1. what the site shows if the database cannot be reached, and
 *   2. the data entry sheet for Product Management. Migration supabase/migrations/0021_yazz_products_from_drive.sql
 *      writes this same list (words, SKU codes, pack sizes and pack shots) into the database, replacing the 8 rows
 *      seeded from the Lexta prototype (0004). Keep the two in step: a change here needs the same change there.
 * Pack contents are as written by Lexta. SKU codes and some pack counts are still to come (marked placeholders).
 * Gaps only (never Lexta's wording) are filled from Yazz's original website, yazzproducts.com: the pack shots in
 * public/images/original and two pack sizes. Each one is listed in docs/content/yazz/ORIGINAL-SITE.md.
 * `comingSoon` products are shown with a Coming soon badge and no Where to buy link, and are added to the database
 * list when the database has no row for them (lib/products.ts).
 */
import type { YazzProduct } from "../lib/products";

const QUALITY = ["[PLACEHOLDER: confirm current ISO certification and year]", "The product has passed strict quality inspection"];
// Every sentence below quotes docs/content/yazz/products.md (Lexta's Drive), with only casing and list joins adapted.
const IRRITATION =
  "In the highly unlikely event of irritation, please discontinue use and share a report to +233 50 996 7400 or via email support@yazzproducts.com.";
const LINER_IRRITATION =
  "In the highly unlikely event of irritation, please discontinue use and share a report to WhatsApp +233 50 996 7400 or via email support@yazzproducts.com.";
const SUFFOCATION = "Warning: To avoid danger of suffocation, keep product away from infants and children.";
const PAD_SIZES = "Normal flow: 270mm. Heavy flow: 290mm. Heavy flow: 330mm.";
const PAD_FEATURES = [
  "Soft flexible wings provide maximum side protection",
  "Wide adhesive on the back, holds the pad firmly in place",
  "Ultra-thin",
  "Convenient & resealable pack, soft dry web cover for natural feeling",
  "Round edge gives you comfort",
  "Wider pad for maximum coverage against leakage",
  "Specially designed wings ensure protection of your panties",
  ...QUALITY,
];
const WIPES_WARNING =
  "Keep out of reach of children. Avoid contact with the eye; if this occurs, rinse well with plenty of water. Do not flush down toilet. Dispose of with normal household waste.";
const DIAPER_USE =
  "How to use Yazz baby diaper: 1. Place baby on diaper with the two back tapes at the backside. 2. Attach the two back tapes on the refastenable area to fit your baby. 3. Pull the elastic leg bands towards the side to prevent leakage. 4. Pull up the tape and you can check whether the diaper is wet.";
const DIAPER_CAUTION =
  "Caution: Wash your hands before changing your baby's diapers. Make sure your baby is clean and dry before putting on a fresh diaper. Change used diapers to keep the baby comfortable. Always throw away used diapers immediately to avoid bacteria. Plastic bags are dangerous for children and must be kept out of reach or at a safe distance.";
const PASTE_USE =
  "As with other toothpastes, if irritation occurs discontinue use and share a report to WhatsApp +233 50 996 7400 or via email support@yazzproducts.com.";
const PACK = "[PLACEHOLDER: pack size from Lexta]";

let n = 100;
const sku = (variant: string | null, pack: string) => ({ code: `TBC-YAZZ-${++n}`, variant, pack });

export const CATALOGUE: YazzProduct[] = [
  // Feminine care ---------------------------------------------------------------------------------------------
  {
    slug: "sanitary-pads", name: "Yazz sanitary pads", range: "feminine-care", category: "Feminine care",
    short: "Soft flexible wings provide maximum side protection. Ultra-thin.",
    long: "Soft flexible wings provide maximum side protection. Wide adhesive on the back, holds the pad firmly in place. Wider pad for maximum coverage against leakage.",
    features: PAD_FEATURES,
    usage: `${PAD_SIZES} ${IRRITATION} ${SUFFOCATION}`,
    ingredients: "Developed with Pearl cotton sheet for your comfort.",
    skus: [
      sku("Extra Long Minty", "9 extra long pads + 2 normal flow pads"),
      sku("Extra Long, free panty liner and disposable bag", "9 extra long pads + 2 normal flow pads"),
      sku("Minty", "6 normal flow pads + 6 heavy flow pads"),
      sku("Green, free panty liner", "6 normal flow pads + 6 heavy flow pads"),
      sku("Pink (Heavy), free panty liner", "6 normal flow pads + 6 heavy flow pads"),
    ],
    images: [
      { src: "/images/original/sanitary-pad-extra-long.webp", alt: "Yazz Extra Long sanitary pad pack, free panty liner and disposable bag" },
      { src: "/images/original/sanitary-pad-minty.webp", alt: "Yazz Minty sanitary pad pack, 6 normal flow and 6 heavy flow pads" },
      { src: "/images/original/sanitary-pad-heavy-flow.webp", alt: "Yazz Heavy Flow sanitary pad pack in pink" },
      { src: "/images/original/sanitary-pad-green.webp", alt: "Yazz sanitary pad pack in green, 6 normal flow and 6 heavy flow pads" },
      { src: "/images/original/sanitary-pad-extra-long-minty.webp", alt: "Yazz Minty Extra Long sanitary pad pack, 9 extra long and 2 normal flow pads" },
    ],
  },
  {
    slug: "panty-liners", name: "Yazz panty liners", range: "feminine-care", category: "Feminine care",
    short: "New & Improved thick panty liner. 24 hrs protection.",
    long: "New & Improved thick panty liner. 24 hrs protection.",
    features: ["24 hrs protection", "New & Improved thick panty liner", "180mm; 150mm", ...QUALITY],
    usage: `${LINER_IRRITATION} ${SUFFOCATION}`,
    ingredients: null,
    skus: [sku("Regular (yellow pack)", PACK), sku("Pink", "24 minty liners"), sku("Extra long and thick, minty (pink)", "24 minty liners")],
    images: [
      { src: "/images/original/panty-liner.webp", alt: "Yazz panty liner pack in yellow" },
    ],
  },
  // Baby care ------------------------------------------------------------------------------------------------
  {
    slug: "baby-diapers", name: "Yazz baby diapers", range: "baby-care", category: "Baby care",
    short: "Elastic waist. Up to 12 hours leakage protection. Cottony soft. Super absorbent.",
    long: "Elastic waist. Up to 12 hours leakage protection. Cottony soft. Super absorbent.",
    features: ["Elastic waist", "Up to 12 hours leakage protection", "Cottony soft", "Super absorbent"],
    usage: `${DIAPER_USE} Warning: Do not flush. ${DIAPER_CAUTION}`,
    ingredients: null,
    skus: [sku("Small, 3 to 6kg", "15 pieces"), sku("Medium, 6 to 9kg", "12 pieces"), sku("Large, [PLACEHOLDER: weight range]", "11 pieces"), sku("Extra large, 13kg and above", "8 pieces")],
    images: [
      { src: "/images/original/baby-diapers.webp", alt: "Yazz baby diapers, medium and large packs" },
      { src: "/images/original/baby-diapers-super-absorbency.webp", alt: "Yazz baby diapers pack, super absorbency, size L" },
    ],
  },
  {
    slug: "baby-pull-up-pants", name: "Yazz pull up pants", range: "baby-care", category: "Baby care",
    short: "360 elastic waist. Up to 12 hours leakage protection.",
    long: "360 elastic waist. Up to 12 hours leakage protection. Soft and drying skin climate. Super absorbent.",
    features: ["360 elastic waist", "Up to 12 hours leakage protection", "Soft and drying skin climate", "Super absorbent"],
    usage: `${DIAPER_CAUTION} ${DIAPER_USE} Warning: Do not flush in the WC.`,
    ingredients: null,
    skus: [
      sku("Small, 4 to 8kg", "54 pieces"), sku("Medium, 6 to 11kg", "52 pieces"), sku("Large, 9 to 14kg", "50 pieces"),
      sku("Extra large, 12 to 17kg", "48 pieces"), sku("Extra extra large, 15kg", "46 pieces"),
    ],
    images: [],
  },
  {
    slug: "baby-wipes", name: "Yazz baby wipes", range: "baby-care", category: "Baby care",
    short: "Multi-Purpose cleaning. Alcohol Free.",
    long: "Aloe Vera: Soothe. Hydrate and protect. Super soft for sensitive skin. Care for delicate skin with Aloe Vera-enriched wipes that gently cleanse while helping soothe and hydrate. Castor Oil: Deep Moisture, Soft skin and gentle clean. Gently cleanse while helping lock in moisture with castor oil-enriched wipes, designed to leave skin feeling soft, smooth and comfortably hydrated for everyday use. Lavender: [PLACEHOLDER: Lavender wipes description; Lexta's text repeats the Aloe Vera copy].",
    features: ["Multi-purpose cleaning", "Alcohol free", "Leaves skin soft and nourished", "Gentle, effective cleansing", "Suitable for everyday use"],
    usage: WIPES_WARNING,
    ingredients:
      "Lavender: benzalkonium chloride, methylchloroisothiazolinone, methylisothiazolinone, PEG-75 lanolin, fragrance, PEG-40, hydrogenated lavender extract, propylene glycol, water. Castor Oil and Aloe Vera: benzalkonium chloride, methylchloroisothiazolinone, methylisothiazolinone, PEG-75 lanolin, fragrance, PEG-40, hydrogenated castor oil, propylene glycol, water.",
    skus: [sku("Lavender", "80 pieces"), sku("Castor Oil", "80 pieces"), sku("Castor Oil", "40 pieces"), sku("Aloe Vera", "80 pieces"), sku("Aloe Vera", "40 pieces")],
    images: [],
  },
  // Oral care ------------------------------------------------------------------------------------------------
  {
    slug: "toothpaste-herbal", name: "Yazz Herbal toothpaste", range: "oral-care", category: "Oral care",
    short: "For natural fresh breath, clean and healthy teeth.",
    long: "For natural fresh breath, clean and healthy teeth. Protection against unpleasant sensations from hot and cold foods and drinks.",
    features: [
      "Helps in reducing the pain of the teeth", "Helps promote proper hygiene in the mouth, makes the gums strong and prevents cavity formation",
      "Helps to reduce all the bad and foul smell from the mouth", "Gently breaks up stains to get teeth whiter",
      "Helps prevent the build up of deposits which can attract stains", "Helps maintain strong teeth, healthy gums and clean fresh breath",
    ],
    usage: PASTE_USE,
    ingredients: "Sorbitol, silica, water, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, titanium dioxide, sodium saccharin, honeysuckle, sodium fluoride, CI 74260.",
    skus: [sku(null, "150g")],
    images: [
      { src: "/images/original/toothpaste-herbal.webp", alt: "Yazz Herbal toothpaste tube and box" },
    ],
  },
  {
    slug: "toothpaste-whitening", name: "Yazz Whitening toothpaste", range: "oral-care", category: "Oral care",
    short: "For a whiter, brighter and healthier smile.",
    long: "For a whiter, brighter and healthier smile. Has a special polishing agent that provides additional stain removal effectively. Polishes off stains that have lodged onto the teeth from foodstuffs. Cool and refreshing mint fragrance makes your mouth smell good at all times.",
    features: ["Gently breaks up stains to get teeth whiter", "Helps prevent the build up of deposits which can attract stains", "Helps maintain strong teeth, healthy gums and clean fresh breath"],
    usage: PASTE_USE,
    ingredients: "Calcium carbonate, aqua, sorbitol, glycerin, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, hydroxyethylcellulose, flavour, sodium saccharin, calcium phosphate, sodium pyrophosphate, sodium phytate, methylparaben.",
    skus: [sku(null, "150g")],
    images: [
      { src: "/images/original/toothpaste-whitening.webp", alt: "Yazz Whitening toothpaste tube and box" },
    ],
  },
  {
    slug: "toothpaste-fluoride", name: "Yazz Fluoride toothpaste", range: "oral-care", category: "Oral care",
    short: "Long lasting protection, for brilliant white teeth.",
    long: "Long lasting protection, for brilliant white teeth.",
    features: ["Long lasting protection", "For brilliant white teeth"],
    usage: `It is recommended you brush your teeth twice daily with Yazz fluoride toothpaste. ${PASTE_USE}`,
    ingredients: "Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, cellulose gum, aroma, sodium fluoride, sodium benzoate, CI 77891, CI 16255.",
    skus: [sku(null, "150g")],
    images: [
      { src: "/images/original/toothpaste-fluoride.webp", alt: "Yazz Fluoride toothpaste tube and box, 150g" },
    ],
  },
  {
    slug: "toothpaste-charcoal", name: "Yazz Charcoal toothpaste", range: "oral-care", category: "Oral care",
    short: "Deep clean, removes stain and whitens teeth.",
    long: "With activated charcoal particles, helps to cleanse your mouth and removes deep stains and discolouration. The highly absorbent activated charcoal particles penetrate and draw out stubborn stains, trap colour particles, fight bad breath and whiten teeth enamel.",
    features: ["Deep clean", "Removes stain", "Whitens teeth", "Fights bad breath"],
    usage: PASTE_USE,
    ingredients: "Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, sodium saccharin, charcoal powder, mica, CI 77266, xanthan gum, methylparaben, sodium fluoride.",
    skus: [sku(null, "150g"), sku(null, "50g")],
    images: [
      { src: "/images/original/toothpaste-charcoal.webp", alt: "Yazz Charcoal toothpaste tube, 150g" },
    ],
  },
  {
    slug: "toothpaste-total-care", name: "Yazz Total Care toothpaste", range: "oral-care", category: "Oral care",
    short: "Everyday protection and care for your teeth.",
    long: "Everyday protection and care for your teeth.",
    features: [
      "Cares for your teeth and refreshes your breath; protects against cavities, foul smell, yellow teeth, plaque, bleeding and swollen gums",
      "Helps loosen up gums and teeth, cleans tartar and stains", "Stimulates gums and provides a pleasantly refreshing taste",
    ],
    usage: PASTE_USE,
    ingredients: "Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, sodium saccharin, mica, pigment, triclosan, methylparaben, sodium fluoride.",
    skus: [sku(null, PACK)],
    images: [
      { src: "/images/original/toothpaste-total-care.webp", alt: "Yazz Total Care toothpaste tube and box" },
    ],
  },
  {
    slug: "toothbrushes", name: "Yazz toothbrushes", range: "oral-care", category: "Oral care",
    short: "Yazz brushes: Your best smiles.",
    long: "Yazz toothbrushes' unique bristles are more effective in helping remove plaque and teeth stains. Innovative tongue cleaner designed to gently clean the tongue. Made with a flexible rubber handle specially designed for easy grip and convenient brushing. Dentist recommendation: change your toothbrush at least once every three months.",
    features: ["Easy cleaning and massage", "Removes plaque, protects enamel", "Gentle on gums, effectively cleans between the teeth"],
    usage: "Tips for a healthy smile: Visit the dentist regularly for check-ups. Brush twice a day. Rinse your mouth after every meal. Do not eat sweet sticky food between meals. Change the brush every 3 months. Follow the correct brushing technique: hold the brush with the elbow raised up to shoulder level, and brush in a circular, up and down motion.",
    ingredients: null,
    skus: [
      sku("Princess, medium bristle", PACK), sku("Monarch, medium bristle with tongue cleaner", PACK), sku("Duchess, medium bristle with tongue cleaner", PACK),
      sku("Duke, medium bristle with tongue cleaner", PACK), sku("Kids, medium bristle with tongue cleaner", PACK),
      sku("Double (his & hers), medium bristle with tongue cleaner", PACK), sku("Hanger (Princess, Duchess, Duke, Monarch)", PACK),
    ],
    images: [
      { src: "/images/original/toothbrush-princess.webp", alt: "Yazz Princess toothbrush display box and pack" },
      { src: "/images/original/toothbrush-monarch.webp", alt: "Yazz Monarch toothbrush display box and pack" },
      { src: "/images/original/toothbrush-duke.webp", alt: "Yazz Duke toothbrush display box and pack" },
    ],
  },
  {
    slug: "dental-floss", name: "Yazz dental floss", comingSoon: true, range: "oral-care", category: "Oral care",
    short: "Yazz Dental Floss: coming soon.",
    long: "Yazz Dental Floss: coming soon.",
    features: [], usage: null, ingredients: null, skus: [], images: [],
  },
  // Home care ------------------------------------------------------------------------------------------------
  {
    slug: "washing-powder", name: "Yazz Activ washing powder", range: "home-care", category: "Home care",
    short: "Yazz Activ detergent with enzymes: removes stubborn stains.",
    long: "The newly improved Yazz Activ detergent with Enzymes has been specially formulated to give you brighter and fresher clothes all the time, free from every stain. Stay bright, fresher and stain-free with Yazz Activ detergent with Enzymes.",
    features: ["Detergent with enzymes", "Removes stubborn stains", "Brighter and fresher clothes", "Suitable for cotton, linen, polyester and mixtures of those fabrics"],
    usage:
      "Dissolve Yazz Activ detergent with Enzymes in water and soak clothes for 15 to 20 minutes before washing. For heavy dirt or more clothes, soak for a longer period and use more Yazz Activ detergent accordingly. Wash by quantity of clothes against weight, or against the quantity of Yazz Activ. Check pack for direction at all times. Don't use for silk or wool clothes. Separate coloured clothes from white and wash them in different basins. Keep the product in a dry place and out of reach of children. In case of eye contact, flush with plenty of water. If swallowed, drink plenty of clean water or milk and seek medical assistance. In case of irritation on skin, discontinue use and seek medical assistance.",
    ingredients: "LAS, phosphate, enzymes, optical brightener, sodium sulphate, SCMC, perfume, sodium carbonate.",
    skus: [sku(null, "200g"), sku(null, "500g"), sku(null, "2kg"), sku(null, "5kg")],
    images: [
      { src: "/images/original/washing-powder.webp", alt: "The Yazz Activ washing powder range: box, tub and sachets" },
    ],
  },
  // Home & tissue --------------------------------------------------------------------------------------------
  {
    slug: "mama-yazz-jumbo-tissue", name: "Mama Yazz jumbo tissue", range: "home-tissue", category: "Tissue",
    short: "Big on Care. Made for Family Needs.",
    long: "Meet Mama Yazz®, the jumbo-size tissue option created with busy households in mind. Its larger format offers a practical choice for families and spaces where tissue is used frequently, helping make everyday care more convenient.",
    features: ["Jumbo-size format", "Family-focused convenience", "Practical for frequent household use"],
    usage: null, ingredients: null, skus: [sku("Jumbo size", PACK)], images: [
      { src: "/images/original/mama-yazz-1.webp", alt: "Two rolls of Mama Yazz" },
      { src: "/images/original/mama-yazz-2.webp", alt: "Two rolls of Mama Yazz, red pack" },
    ],
  },
  {
    slug: "toilet-tissue-individual-wrap", name: "Yazz individual wrap luxury toilet tissue", range: "home-tissue", category: "Tissue",
    short: "A Little Luxury in Everyday Care.",
    long: "Experience everyday comfort with Yazz® Individual Wrap Luxury Toilet Tissue. Conveniently packaged as a single roll, it offers a practical and hygienic solution for personal use, family bathrooms and guest facilities.",
    features: ["Individually wrapped", "Convenient storage", "Everyday bathroom essential"],
    usage: null, ingredients: null, skus: [sku("Single roll", PACK)], images: [
      { src: "/images/original/luxury-toilet-tissue.webp", alt: "Yazz Luxury Toilet Tissue rolls, individually wrapped" },
    ],
  },
  {
    slug: "tissue-napkin", name: "Yazz tissue napkin", range: "home-tissue", category: "Tissue",
    short: "Every Sheet, a Touch of Care.",
    long: "From family meals to everyday clean-ups, Yazz® Tissue Napkin offers convenience when you need it. With 150 sheets in a roll, it is a handy addition to dining areas, kitchens and everyday household routines.",
    features: ["150 sheets per roll", "Convenient single-roll format", "Suitable for everyday household use"],
    usage: null, ingredients: null, skus: [sku(null, "1 roll, 150 sheets")], images: [
      { src: "/images/original/tissue-napkin-blue.webp", alt: "Yazz Tissue Napkins pack in blue" },
      { src: "/images/original/tissue-napkin-green.webp", alt: "Yazz Tissue Napkins pack in green" },
      { src: "/images/original/tissue-napkin-purple.webp", alt: "Yazz Tissue Napkins pack in purple" },
    ],
  },
  {
    slug: "individual-tissue", name: "Yazz individual tissue", range: "home-tissue", category: "Tissue",
    short: "Simple Care. Everyday Convenience.",
    long: "Yazz® Individual Tissue brings practical personal hygiene into your daily routine. Its single-roll format makes it an easy choice for home bathrooms, workplaces and other everyday spaces.",
    features: ["Single-roll convenience", "Easy to store", "Suitable for everyday personal hygiene"],
    usage: null, ingredients: null, skus: [sku("Single roll", PACK)], images: [],
  },
  {
    slug: "pocket-tissue", name: "Yazz pocket tissue", comingSoon: true, range: "home-tissue", category: "Tissue",
    short: "Softness That Goes Wherever You Go.",
    long: "Stay prepared for life's little moments with Yazz® Pocket Tissue. Designed for convenient personal care, these white, embossed handkerchief tissues offer an extra-soft feel in a portable format. Made with 100% virgin-plus material and featuring a 3-ply structure, Yazz® Pocket Tissue is a handy everyday companion for school, work, travel and life on the move.",
    features: ["Extra soft", "White embossed tissue", "3-ply", "100% virgin-plus material", "Portable convenience"],
    usage: null, ingredients: null, skus: [], images: [],
  },
];
