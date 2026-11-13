/**
 * The Yazz catalogue as Lexta wrote it ("yazz website content.docx", Google Drive, Yazz Tab Content, Tab 3 Products),
 * structured for Product Management.
 *
 * The site always shows the products in the database (lib/products.ts); this list is only:
 *   1. what the site shows if the database cannot be reached, and
 *   2. the data entry sheet for Product Management. The database still holds the 8 products seeded from the Lexta
 *      prototype (0004); staff (or a data migration, see CONTENT-NEEDED.md) bring it up to this list.
 * Pack contents are as written by Lexta. SKU codes and some pack counts are still to come (marked placeholders).
 * Gaps only (never Lexta's wording) are filled from Yazz's original website, yazzproducts.com: the pack shots in
 * public/images/original and two pack sizes. Each one is listed in docs/content/yazz/ORIGINAL-SITE.md.
 * `comingSoon` products are shown with a Coming soon badge and no Where to buy link, and are added to the database
 * list when the database has no row for them (lib/products.ts).
 */
import type { YazzProduct } from "../lib/products";

const QUALITY = ["Certified ISO 9001:2000", "Passed strict quality inspection"];
const IRRITATION =
  "In the highly unlikely event of irritation, please discontinue use and report it on +233 50 996 7400 (WhatsApp) or support@yazzproducts.com.";
const SUFFOCATION = "Warning: to avoid danger of suffocation, keep the product away from infants and children.";
const PAD_SIZES = "Pad lengths: normal flow 270mm, heavy flow 290mm and heavy flow 330mm.";
const PAD_FEATURES = [
  "Soft flexible wings provide maximum side protection",
  "Wide adhesive on the back holds the pad firmly in place",
  "Ultra-thin",
  "Soft dry web cover for a natural feeling",
  "Round edges give you comfort",
  "Wider pad for maximum coverage against leakage",
  "Specially designed wings protect your panties",
  "Convenient resealable pack",
  ...QUALITY,
];
const WIPES_WARNING =
  "Keep out of reach of children. Avoid contact with the eyes; if this occurs, rinse well with plenty of water. Do not flush down the toilet. Dispose of with normal household waste.";
const DIAPER_USE =
  "How to use: place baby on the diaper with the two back tapes at the back. Attach the two back tapes on the refastenable area to fit your baby. Pull the elastic leg bands towards the side to prevent leakage. Pull up the tape to check whether the diaper is wet. Do not flush.";
const DIAPER_CAUTION =
  "Caution: wash your hands before changing your baby's diaper. Make sure your baby is clean and dry before putting on a fresh diaper. Change used diapers to keep the baby comfortable and throw them away immediately. Plastic bags are dangerous for children and must be kept out of reach.";
const PASTE_USE =
  "Brush your teeth twice daily. As with other toothpastes, if irritation occurs discontinue use and report it on WhatsApp +233 50 996 7400 or support@yazzproducts.com.";
const PACK = "[PLACEHOLDER: pack size from Lexta]";

let n = 100;
const sku = (variant: string | null, pack: string) => ({ code: `TBC-YAZZ-${++n}`, variant, pack });

export const CATALOGUE: YazzProduct[] = [
  // Feminine care ---------------------------------------------------------------------------------------------
  {
    slug: "sanitary-pads", name: "Yazz sanitary pads", range: "feminine-care", category: "Feminine care",
    short: "Ultra-thin pads with soft flexible wings and a wide adhesive back, in normal and heavy flow lengths.",
    long: "Yazz sanitary pads are ultra-thin, with soft flexible wings for maximum side protection and a wide adhesive on the back that holds the pad firmly in place. A soft dry web cover gives a natural feeling, round edges give you comfort and a wider pad gives maximum coverage against leakage.",
    features: PAD_FEATURES,
    usage: `${PAD_SIZES} ${IRRITATION} ${SUFFOCATION}`,
    ingredients: "Developed with a pearl cotton sheet for your comfort.",
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
    short: "New and improved thick panty liners with 24 hours protection.",
    long: "New and improved thick Yazz panty liners give 24 hours protection, in the regular liner (yellow pack), the pink panty liner and the extra long and thick minty liner.",
    features: ["24 hours protection", "New and improved thick panty liner", "Lengths of 150mm and 180mm", ...QUALITY],
    usage: `${IRRITATION} ${SUFFOCATION}`,
    ingredients: null,
    skus: [sku("Regular (yellow pack)", PACK), sku("Pink", PACK), sku("Extra long and thick, minty (pink)", "24 minty liners")],
    images: [
      { src: "/images/original/panty-liner.webp", alt: "Yazz panty liner pack in yellow" },
    ],
  },
  // Baby care ------------------------------------------------------------------------------------------------
  {
    slug: "baby-diapers", name: "Yazz baby diapers", range: "baby-care", category: "Baby care",
    short: "Cottony soft, super absorbent taped diapers with an elastic waist and up to 12 hours leakage protection.",
    long: "Yazz baby diapers are cottony soft and super absorbent, with an elastic waist and up to 12 hours leakage protection.",
    features: ["Elastic waist", "Up to 12 hours leakage protection", "Cottony soft", "Super absorbent"],
    usage: `${DIAPER_USE} ${DIAPER_CAUTION}`,
    ingredients: null,
    skus: [sku("Small, 3 to 6kg", "15 pieces"), sku("Medium, 6 to 9kg", "12 pieces"), sku("Large", "11 pieces"), sku("Extra large, over 13kg", "8 pieces")],
    images: [
      { src: "/images/original/baby-diapers.webp", alt: "Yazz baby diapers, medium and large packs" },
      { src: "/images/original/baby-diapers-super-absorbency.webp", alt: "Yazz baby diapers pack, super absorbency, size L" },
    ],
  },
  {
    slug: "baby-pull-up-pants", name: "Yazz pull up pants", range: "baby-care", category: "Baby care",
    short: "Pull up diapers with a 360 elastic waist and up to 12 hours leakage protection.",
    long: "Yazz pull up pants have a 360 elastic waist, a soft and dry skin climate and up to 12 hours leakage protection.",
    features: ["360 elastic waist", "Up to 12 hours leakage protection", "Soft and dry skin climate", "Super absorbent"],
    usage: `${DIAPER_CAUTION} Do not flush in the WC.`,
    ingredients: null,
    skus: [
      sku("Small, 4 to 8kg", "54 pieces"), sku("Medium, 6 to 11kg", "52 pieces"), sku("Large, 9 to 14kg", "50 pieces"),
      sku("Extra large, 12 to 17kg", "48 pieces"), sku("Extra extra large, 15kg and over", "46 pieces"),
    ],
    images: [],
  },
  {
    slug: "baby-wipes", name: "Yazz baby wipes", range: "baby-care", category: "Baby care",
    short: "Alcohol free, multi-purpose baby wipes in Lavender, Castor Oil and Aloe Vera.",
    long: "Gentle, alcohol free wipes for delicate skin. Aloe Vera: super soft for sensitive skin, gently cleanses while helping soothe and hydrate. Castor Oil: deep moisture, soft skin and a gentle clean that helps protect skin from dryness. Lavender: gentle, effective cleansing that leaves skin fresh, soft and comforted.",
    features: ["Multi-purpose cleaning", "Alcohol free", "Leaves skin soft and nourished", "Gentle, effective cleansing", "Suitable for everyday use"],
    usage: WIPES_WARNING,
    ingredients:
      "Lavender: benzalkonium chloride, methyichloroisthiazolinone, methylisothiazolinone, PEG-75 lanolin, fragrance, PEG-40, hydrogenated lavender extract, propylene glycol, water. Castor Oil and Aloe Vera: benzalkonium chloride, methyichloroisthiazolinone, methylisothiazolinone, PEG-75 lanolin, fragrance, PEG-40, hydrogenated castor oil, propylene glycol, water.",
    skus: [sku("Lavender", "80 pieces"), sku("Castor Oil", "80 pieces"), sku("Castor Oil", "40 pieces"), sku("Aloe Vera", "80 pieces"), sku("Aloe Vera", "40 pieces")],
    images: [],
  },
  // Oral care ------------------------------------------------------------------------------------------------
  {
    slug: "toothpaste-herbal", name: "Yazz Herbal toothpaste", range: "oral-care", category: "Oral care",
    short: "For natural fresh breath, clean and healthy teeth, with a unique blend of herbs.",
    long: "For natural fresh breath, clean and healthy teeth, with protection against unpleasant sensations from hot and cold foods and drinks. The unique blend of herbs helps promote proper hygiene in the mouth, makes the gums strong and helps prevent cavities.",
    features: ["Helps reduce tooth pain", "Makes the gums strong and helps prevent cavities", "Helps reduce bad breath", "Gently breaks up stains to get teeth whiter", "Helps maintain strong teeth and healthy gums"],
    usage: PASTE_USE,
    ingredients: "Sorbitol, silica, water, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, titanium dioxide, sodium saccharin, honeysuckle, sodium fluoride, CI 74260.",
    skus: [sku(null, "150g")],
    images: [
      { src: "/images/original/toothpaste-herbal.webp", alt: "Yazz Herbal toothpaste tube and box" },
    ],
  },
  {
    slug: "toothpaste-whitening", name: "Yazz Whitening toothpaste", range: "oral-care", category: "Oral care",
    short: "For a whiter, brighter and healthier smile, with a special polishing agent.",
    long: "Yazz Whitening toothpaste has a special polishing agent that removes stains lodged on the teeth from food, with a cool, refreshing mint fragrance that keeps your mouth smelling good.",
    features: ["Special polishing agent for extra stain removal", "Cool, refreshing mint", "Helps prevent deposits that attract stains", "Helps maintain strong teeth and healthy gums"],
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
    long: "Long lasting protection, for brilliant white teeth. Brush twice daily with Yazz Fluoride toothpaste.",
    features: ["Long lasting protection", "For brilliant white teeth"],
    usage: PASTE_USE,
    ingredients: "Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, cellulose gum, aroma, sodium fluoride, sodium benzoate, CI 77891, CI 16255.",
    skus: [sku(null, "150g")],
    images: [
      { src: "/images/original/toothpaste-fluoride.webp", alt: "Yazz Fluoride toothpaste tube and box, 150g" },
    ],
  },
  {
    slug: "toothpaste-charcoal", name: "Yazz Charcoal toothpaste", range: "oral-care", category: "Oral care",
    short: "Deep clean: removes stains and whitens teeth with activated charcoal.",
    long: "Activated charcoal particles help cleanse your mouth and remove deep stains and discolouration. The highly absorbent particles draw out stubborn stains, trap colour particles, fight bad breath and whiten tooth enamel.",
    features: ["Deep clean", "Removes stains", "Whitens teeth", "Fights bad breath"],
    usage: PASTE_USE,
    ingredients: "Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, sodium saccharin, charcoal powder, mica, CI 77266, lanthanide gum, methylparaben, sodium fluoride.",
    skus: [sku(null, "150g"), sku(null, "50g")],
    images: [
      { src: "/images/original/toothpaste-charcoal.webp", alt: "Yazz Charcoal toothpaste tube, 150g" },
    ],
  },
  {
    slug: "toothpaste-total-care", name: "Yazz Total Care toothpaste", range: "oral-care", category: "Oral care",
    short: "Everyday protection and care for your teeth.",
    long: "Cares for your teeth and refreshes your breath, protecting against cavities, foul smell, yellow teeth, plaque and bleeding or swollen gums. Cleans tartar and stains, stimulates the gums and leaves a pleasantly refreshing taste.",
    features: ["Protects against cavities and plaque", "Refreshes your breath", "Cleans tartar and stains", "Stimulates the gums"],
    usage: PASTE_USE,
    ingredients: "Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, sodium saccharin, mica, pigment, triclosan, methylparaben, sodium fluoride.",
    skus: [sku(null, PACK)],
    images: [
      { src: "/images/original/toothpaste-total-care.webp", alt: "Yazz Total Care toothpaste tube and box" },
    ],
  },
  {
    slug: "toothbrushes", name: "Yazz toothbrushes", range: "oral-care", category: "Oral care",
    short: "Your best smiles: a unique bristle that helps remove plaque, with a tongue cleaner and a flexible rubber grip.",
    long: "Yazz toothbrushes have a unique bristle that is more effective in helping remove plaque and stains, an innovative tongue cleaner designed to gently clean the tongue and a flexible rubber handle for an easy grip. Dentist recommendation: change your toothbrush at least once every three months.",
    features: ["Easy cleaning and massage", "Removes plaque, protects enamel", "Gentle on gums, cleans between the teeth", "Flexible rubber handle for an easy grip"],
    usage: "Brush twice a day. Hold the brush with your elbow raised to shoulder level and brush in a circular, up and down motion. Change the brush every 3 months and visit the dentist regularly.",
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
    short: "Coming soon: Yazz dental floss.",
    long: "Yazz dental floss is coming soon to the Yazz oral care range.",
    features: [], usage: null, ingredients: null, skus: [], images: [],
  },
  // Home care ------------------------------------------------------------------------------------------------
  {
    slug: "washing-powder", name: "Yazz Activ washing powder", range: "home-care", category: "Home care",
    short: "Yazz Activ detergent with enzymes removes stubborn stains, for brighter and fresher clothes.",
    long: "The newly improved Yazz Activ detergent with enzymes has been specially formulated to give you brighter and fresher clothes all the time, free from every stain. Stay bright, fresher and stain free.",
    features: ["Detergent with enzymes", "Removes stubborn stains", "Brighter and fresher clothes", "Suitable for cotton, linen, polyester and mixtures"],
    usage:
      "Dissolve Yazz Activ detergent in water and soak clothes for 15 to 20 minutes before washing. For heavy dirt or more clothes, soak longer and use more detergent. Separate coloured clothes from white. Do not use for silk or wool. Keep in a dry place, out of reach of children. In case of eye contact, flush with plenty of water. If swallowed, drink plenty of clean water or milk and seek medical assistance. Check the pack for directions at all times.",
    ingredients: "LAS, phosphate, enzymes, optical brightener, sodium sulphate, SCMC, perfume, sodium carbonate.",
    skus: [sku(null, "200g"), sku(null, "500g"), sku(null, "2kg"), sku(null, "5kg")],
    images: [
      { src: "/images/original/washing-powder.webp", alt: "The Yazz Activ washing powder range: box, tub and sachets" },
    ],
  },
  // Home & tissue --------------------------------------------------------------------------------------------
  {
    slug: "mama-yazz-jumbo-tissue", name: "Mama Yazz jumbo tissue", range: "home-tissue", category: "Tissue",
    short: "Big on care. Made for family needs: a jumbo size tissue for busy households.",
    long: "Meet Mama Yazz®, the jumbo size tissue created with busy households in mind. Its larger format offers a practical choice for families and spaces where tissue is used frequently.",
    features: ["Jumbo size format", "Family focused convenience", "Practical for frequent household use"],
    usage: null, ingredients: null, skus: [sku("Jumbo size", PACK)], images: [
      { src: "/images/original/mama-yazz-1.webp", alt: "Two rolls of Mama Yazz kitchen towel" },
      { src: "/images/original/mama-yazz-2.webp", alt: "Two rolls of Mama Yazz kitchen towel, red pack" },
    ],
  },
  {
    slug: "toilet-tissue-individual-wrap", name: "Yazz individual wrap luxury toilet tissue", range: "home-tissue", category: "Tissue",
    short: "A little luxury in everyday care, individually wrapped.",
    long: "Experience everyday comfort with Yazz® Individual Wrap Luxury Toilet Tissue. Packaged as a single roll, it is a practical and hygienic solution for personal use, family bathrooms and guest facilities.",
    features: ["Individually wrapped", "Convenient storage", "Everyday bathroom essential"],
    usage: null, ingredients: null, skus: [sku("Single roll", PACK)], images: [
      { src: "/images/original/luxury-toilet-tissue.webp", alt: "Yazz Luxury Toilet Tissue rolls, individually wrapped" },
    ],
  },
  {
    slug: "tissue-napkin", name: "Yazz tissue napkin", range: "home-tissue", category: "Tissue",
    short: "Every sheet, a touch of care: 150 sheets per roll.",
    long: "From family meals to everyday clean-ups, Yazz® Tissue Napkin offers convenience when you need it. With 150 sheets in a roll, it is a handy addition to dining areas, kitchens and everyday household routines.",
    features: ["150 sheets per roll", "Convenient single roll format", "Suitable for everyday household use"],
    usage: null, ingredients: null, skus: [sku(null, "1 roll, 150 sheets")], images: [
      { src: "/images/original/tissue-napkin-blue.webp", alt: "Yazz Tissue Napkins pack in blue" },
      { src: "/images/original/tissue-napkin-green.webp", alt: "Yazz Tissue Napkins pack in green" },
      { src: "/images/original/tissue-napkin-purple.webp", alt: "Yazz Tissue Napkins pack in purple" },
    ],
  },
  {
    slug: "individual-tissue", name: "Yazz individual tissue", range: "home-tissue", category: "Tissue",
    short: "Simple care. Everyday convenience.",
    long: "Yazz® Individual Tissue brings practical personal hygiene into your daily routine. Its single roll format makes it an easy choice for home bathrooms, workplaces and other everyday spaces.",
    features: ["Single roll convenience", "Easy to store", "Suitable for everyday personal hygiene"],
    usage: null, ingredients: null, skus: [sku("Single roll", PACK)], images: [],
  },
  {
    slug: "pocket-tissue", name: "Yazz pocket tissue", comingSoon: true, range: "home-tissue", category: "Tissue",
    short: "Coming soon: extra soft, 3-ply pocket tissue. Softness that goes wherever you go.",
    long: "Stay prepared for life's little moments with Yazz® Pocket Tissue. White, embossed handkerchief tissues with an extra soft feel in a portable format, made with 100% virgin-plus material and a 3-ply structure: a handy companion for school, work and travel.",
    features: ["Extra soft", "White embossed tissue", "3-ply", "100% virgin-plus material", "Portable convenience"],
    usage: null, ingredients: null, skus: [], images: [],
  },
];
