/**
 * The Linzzy catalogue as Lexta wrote it ("Linzzy Website Content.docx", Google Drive, Linzzy Tab Content, 3. Products
 * Page; docs/content/linzzy/products.md), structured for Product Management.
 *
 * The site always shows the products in the database (lib/products.ts); this list is:
 *   1. what the site shows if the database cannot be reached,
 *   2. the product page extras (headline, recommended use, skin sensitivity, "Linzzy Says") a database row with the
 *      same slug borrows, and
 *   3. the data entry sheet for Product Management. The database still holds the 3 Linzzy products seeded from the
 *      Lexta prototype (0004); staff (or a data migration, see CONTENT-NEEDED.md) bring it up to this list.
 * Pack contents are as written by Lexta. SKU codes are still to come. Pack shots come from the original
 * linzzyproducts.com (public/images/original), as allowed for gaps; every one is listed in CONTENT-NEEDED.md.
 * Not used, because Lexta's content says they must be verified first: "0% alcohol and parabens" on the wipes packs, and
 * the original site's diaper claims and Small and Extra Large sizes.
 */
import type { LinzzyProduct } from "../lib/products";

let n = 100;
const sku = (variant: string | null, pack: string) => ({ code: `TBC-LINZZY-${++n}`, variant, pack });

const TOWEL_SENSITIVITY_CHECK = "Individuals with known sensitivities to adhesives, fragrances or other materials should review the product's ingredient and material information before use.";

export const CATALOGUE: LinzzyProduct[] = [
  // Feminine care ---------------------------------------------------------------------------------------------
  {
    slug: "heavy-flow-sanitary-towels", name: "Linzzy Heavy Flow Sanitary Towels", range: "feminine-care", category: "Feminine care",
    headline: "Extra Care for Your Heavier Days",
    short: "Higher-absorbency towels for heavier days: 12 towels of 290 mm, plus 2 complimentary panty liners.",
    long: "Some menstrual days require additional protection. Linzzy Heavy Flow Sanitary Towels are designed for women who prefer higher absorbency during heavier menstrual flow. Featuring the brand's Absorb, Lock and Breathe design positioning, this variant offers a practical option for managing heavier days while supporting everyday comfort.",
    features: ["Higher-absorbency menstrual protection", "290 mm towel length", "Designed for heavier-flow days", "Includes complimentary panty liners", "Comfort-focused design"],
    skus: [sku("Heavy Flow", "12 Heavy Flow Sanitary Towels, 290 mm + 2 Complimentary Panty Liners, 155 mm")],
    recommended: "Heavier menstrual flow, subject to individual absorbency needs.",
    usage: "Remove the individual wrapper, peel away the adhesive backing and position the towel securely inside clean underwear. Change regularly and whenever saturated.",
    sensitivity: `Discontinue use if itching, burning, redness or irritation develops. ${TOWEL_SENSITIVITY_CHECK}`,
    ingredients: null,
    says: "Your heavier days deserve thoughtful care.",
    images: [{ src: "/images/original/pad-heavy-flow.webp", alt: "Linzzy Heavy Flow sanitary towels pack: 12 towels of 290 mm plus 2 free panty liners" }],
    reads: ["know-your-flow", "period-hygiene-101"],
  },
  {
    slug: "cool-mint-sanitary-towels", name: "Linzzy Cool Mint Sanitary Towels", range: "feminine-care", category: "Feminine care",
    headline: "A Refreshing Choice for Your Period Routine",
    short: "A cooling-style option in a mixed-length pack: 260 mm and 290 mm towels, plus 3 panty liners.",
    long: "Every woman has different preferences when it comes to menstrual care. Linzzy Cool Mint Sanitary Towels provide a cooling-style option within the feminine care collection. The pack combines sanitary towels of different lengths, allowing consumers to choose according to their flow and coverage preferences.",
    features: ["Cool Mint variant", "Two sanitary towel lengths", "Panty liners included", "Absorb, Lock and Breathe design positioning", "Convenient mixed-length pack"],
    skus: [sku("Cool Mint", "6 Sanitary Towels, 260 mm + 6 Sanitary Towels, 290 mm + 3 Panty Liners, 155 mm")],
    recommended: "Menstrual care for consumers who prefer this variant and tolerate its cooling sensation.",
    usage: "Position the towel securely inside clean underwear and change regularly according to your menstrual flow.",
    sensitivity: "Cooling ingredients or sensations may cause discomfort in sensitive individuals. Stop use immediately if irritation, burning or an uncomfortable cooling sensation occurs. Do not use on already irritated or broken skin.",
    ingredients: null,
    says: "A little freshness, a little more confidence.",
    images: [{ src: "/images/original/pad-cool-mint.webp", alt: "Linzzy Cool Mint sanitary towels pack: 6 towels of 260 mm, 6 of 290 mm and 3 panty liners" }],
    reads: ["know-your-flow", "period-care-in-warm-weather"],
  },
  {
    slug: "extra-long-sanitary-towels", name: "Linzzy Extra Long Sanitary Towels", range: "feminine-care", category: "Feminine care",
    headline: "Extended Coverage for the Moments That Matter",
    short: "Extended 330 mm coverage for rest, travel and busy days, with 290 mm towels and 2 complimentary panty liners.",
    long: "Whether you're resting, travelling or managing a busy day, choosing a sanitary towel with suitable coverage can make a difference. Linzzy Extra Long Sanitary Towels offer an extended-length option for consumers who prefer additional coverage.",
    features: ["Extended 330 mm coverage", "Additional 290 mm towels", "Complimentary panty liners", "Designed for consumers who prefer longer towels", "Comfort-focused design"],
    skus: [sku("Extra Long", "9 Extra Long Sanitary Towels, 330 mm + 2 Sanitary Towels, 290 mm + 2 Complimentary Panty Liners, 155 mm")],
    recommended: "Menstrual care when extended coverage is preferred, including rest and overnight routines. Change as needed and do not rely on a single towel for prolonged periods.",
    usage: "Centre the towel inside clean underwear, secure the adhesive and ensure the product sits comfortably.",
    sensitivity: "Stop use if discomfort, irritation or skin reactions occur. Check the product materials if you have known sensitivities.",
    ingredients: null,
    says: "More coverage for greater peace of mind.",
    images: [{ src: "/images/original/pad-extra-long.webp", alt: "Linzzy Extra Long sanitary towels pack: 9 towels of 330 mm, 2 of 290 mm and 2 free panty liners" }],
    reads: ["long-days-busy-schedules", "know-your-flow"],
  },
  {
    slug: "panty-liners", name: "Linzzy Panty Liners", range: "feminine-care", category: "Feminine care",
    headline: "Little Essentials for Everyday Care",
    short: "A compact 155 mm liner for light spotting or small amounts of moisture, 30 in a pack.",
    long: "Sometimes, the smallest essentials make everyday routines more convenient. Linzzy Panty Liners offer a compact option for managing light spotting or small amounts of moisture. Designed for light protection rather than regular menstrual flow, these liners can be incorporated into personal care routines according to individual preference.",
    features: ["Compact 155 mm design", "30 liners per pack", "Suitable for light spotting and small amounts of moisture", "Convenient everyday care option"],
    skus: [sku("Panty Liners", "30 Panty Liners, 155 mm")],
    recommended: "Light spotting or occasional everyday moisture management. Not intended to replace sanitary towels during moderate or heavy menstrual bleeding.",
    usage: "Attach the liner securely inside clean underwear. Replace when damp or soiled.",
    sensitivity: "Prolonged moisture exposure or sensitivity to product materials may cause irritation. Change liners when needed and discontinue use if discomfort occurs.",
    ingredients: null,
    says: "Everyday care, made simple.",
    images: [{ src: "/images/original/panty-liner.webp", alt: "Linzzy Panty Liner pack: 30 liners of 155 mm" }],
    reads: ["panty-liners-explained"],
  },
  // Baby care -------------------------------------------------------------------------------------------------
  {
    slug: "baby-diapers", name: "Linzzy Baby Diapers", range: "baby-care", category: "Baby care",
    headline: "Made for Little Moves and Everyday Comfort",
    short: "Unisex disposable diapers with a flexible-comfort design, in sizes for growing babies.",
    long: "Every baby has a world to discover. From stretching little legs to learning how to crawl, babies need diapers that fit comfortably and allow natural movement. Linzzy Baby Diapers feature a flexible-comfort design intended to support everyday diapering needs.",
    features: ["Flexible Comfort design", "Unisex diaper range", "Different sizes for growing babies", "Disposable diaper format", "Designed for everyday baby care"],
    skus: [
      sku("Medium (M)", "42 pieces, 6 to 9 kg"),
      sku("Large (L)", "40 pieces, 9 to 13 kg"),
      sku("Other sizes", "[PLACEHOLDER: other sizes and pack quantities, confirmed against current packaging]"),
    ],
    usage: "Place your baby on a clean, safe changing surface. Remove the soiled diaper and gently clean the diaper area. Allow the skin to dry. Position a fresh Linzzy diaper comfortably. Fasten securely without making it too tight. Dispose of the used diaper responsibly and wash your hands.",
    sensitivity: "A baby's skin can react to moisture, friction or certain product materials. Check the diaper area regularly and change wet or soiled diapers promptly. Discontinue use if a suspected product-related reaction develops. Consult a healthcare professional for persistent or worsening irritation. Never leave your baby unattended during a diaper change.",
    ingredients: null,
    says: "Little moves, loving care, brighter beginnings.",
    images: [
      { src: "/images/original/baby-diapers.webp", alt: "Linzzy Baby Diapers pack, size L, 40 pieces, with a mother and baby on the pack" },
    ],
    reads: ["is-your-baby-wearing-the-right-diaper-size", "diaper-changing-made-easier"],
  },
  {
    slug: "baby-wipes", name: "Linzzy Baby Wipes", range: "baby-care", category: "Baby care",
    headline: "A Fresh Touch for Everyday Baby Care",
    short: "80 wipes in a resealable pack, in Pink (Rose Perfume), Blue (Lavender Perfume) and Yellow.",
    long: "Little hands, tiny feet and unexpected messes are all part of raising a baby. Linzzy Baby Wipes offer a convenient cleaning option for everyday care routines at home or on the go. Available in different variants, Linzzy Baby Wipes provide parents with options to suit their preferences.",
    features: ["Convenient resealable packaging", "80 wipes per pack", "Different product variants", "Suitable for everyday external cleaning, subject to label directions", "Portable for diaper bags and travel"],
    skus: [
      sku("Pink Pack, Rose Perfume", "80 wipes"),
      sku("Blue Pack, Lavender Perfume", "80 wipes"),
      sku("Yellow Pack", "80 wipes"),
    ],
    usage: "Open the resealable lid. Remove a wipe with clean hands. Gently clean the intended external skin area. Use additional wipes when necessary to avoid spreading dirt. Close the packaging securely after use. Dispose of used wipes in an appropriate waste bin.",
    sensitivity: "Some babies may be sensitive to fragrances, preservatives or other ingredients in wipes. Always review the product's ingredient information. For babies with sensitive or irritated skin, plain water and a soft cloth may be preferable. Discontinue use if redness, itching or irritation occurs. Avoid contact with eyes, mouth and broken skin. Never flush wipes down the toilet.",
    ingredients: "[PLACEHOLDER: complete ingredient list for each wipes variant, from Lexta]",
    says: "A gentle touch for life's little messes.",
    images: [{ src: "/images/original/baby-wipes.webp", alt: "Linzzy Baby Wipes packs in yellow, pink and blue, 80 wipes each" }],
    reads: ["baby-wipes-101", "the-perfect-diaper-bag"],
  },
];
