/**
 * The Hooch catalogue as Lexta wrote it ("Hooch Foods website content.docx", Google Drive, Hooch Tab Content, Our
 * Products tab; docs/content/hooch/products.md), structured for Product Management.
 *
 * This list is the authority for Hooch product wording before migration 0017 (lib/products.ts, mergeHoochProducts):
 *   1. while the database still holds the rows seeded from the Lexta prototype (0004), a row with the same slug shows
 *      these words and only its SKU codes, photos, published state and order come from the database,
 *   2. a product of this list the database lacks is shown from here, so both cereals always show,
 *   3. it is what the site shows if the database cannot be reached, and
 *   4. it is the data entry sheet for Product Management. Migration 0017 (written, not applied: Desmond decides) writes
 *      these two products and unpublishes the prototype rows "Super Crunchy Corn Flakes" and "Choco Flakes".
 * After 0017 Product Management alone decides what shows and how it reads; these entries then only add the extras the
 * database has no column for (tagline, portions, which 3D box, recipe ideas).
 *
 * Pack sizes are Lexta's Drive figures (Cornflakes 500g, Frosted Flakes 375g). The Lexta PDF also mentions a 375g
 * Cornflakes and the Lexta site shows a Choco Flakes card: both unconfirmed, see CONTENT-NEEDED.md. SKU codes are still to
 * come. Pictures are pack shots of the real Hooch boxes made from Lexta's own Hooch artwork (Desmond,
 * 14 November 2026: realistic, with the actual product, until Lexta sends their images), shared files in public/images/hooch, also shipped with the Lexta site and
 * the portal (packages/db SHARED_IMAGE_PATH).
 */
import type { HoochProduct } from "../lib/products";

/** Lexta's nutrition line, the same for both cereals. Exact figures must match the approved packaging. */
const VITAMINS = "Vitamins: Vit E, Thiamine B1, Riboflavin B2, Niacin B3, Pantothenic Acid B5, Vit B6, Vit B12, Folic Acid.";

export const CATALOGUE: HoochProduct[] = [
  {
    slug: "cornflakes",
    name: "Hooch® Cornflakes",
    category: "Breakfast cereal",
    flavour: "classic",
    tagline: "Super Classic Crunchy. Everyday Goodness.",
    portions: "10 x 50g individual packs",
    short: "The golden crunch of Hooch® Cornflakes: 500g, in 10 convenient packs of 50g.",
    long: "Start your morning with the golden crunch of Hooch® Cornflakes. With its enjoyable crispy texture and convenient individual portions, it's an easy breakfast option for the whole family. Each 500g product contains 10 smaller packs of 50g, allowing family members to prepare their own cereal portions with less measuring.",
    features: ["Convenient individual portions", "Quick and simple to prepare", "Enjoyable crunchy texture", "Easy to combine with milk and fruit", "Practical for family breakfast planning"],
    usage: "Pour one individual pack into a bowl, add your preferred milk and enjoy. Add fruit or other toppings for variety.",
    ingredients: `Enriched with vitamins. Corn grits 92%, sugar, salt, acidity regulator: sodium phosphates, malt extract powder from barley. ${VITAMINS}`,
    skus: [{ code: "TBC-HOOCH-101", variant: null, pack: "500g: 10 x 50g individual packs" }],
    images: [{ src: "/images/hooch/cornflakes-bowl.webp", alt: "A box of Hooch® Cornflakes, 500g, with fresh strawberries" }],
    recipes: ["classic-hooch-bowl", "yoghurt-crunch", "after-school-crunch"],
  },
  {
    slug: "frosted-flakes",
    name: "Hooch® Frosted Flakes",
    category: "Breakfast cereal",
    flavour: "frosted",
    tagline: "Sweet Crunch. Happy Mornings.",
    portions: "10 x 37.5g individual packs",
    short: "A sweet frosted finish on a crispy flake: 375g, in 10 convenient packs of 37.5g.",
    long: "Add a little sweetness to your breakfast routine with Hooch® Frosted Flakes. Combining a crispy texture with a sweet frosted finish, it's a delightful choice for families who enjoy a sweeter cereal. Each 375g product contains 10 smaller packs of 37.5g, conveniently portioned for everyday breakfast preparation.",
    features: ["Sweet frosted taste", "Crispy, enjoyable texture", "Convenient individual packs", "Quick preparation for busy mornings", "Enjoyable as cereal or a snack"],
    usage: "Pour one pack into a bowl, add milk and serve. Pair with fresh fruit to create a more varied breakfast.",
    // Lexta's document gives "sugar 23" without a unit; the unit is left for Lexta to confirm (CONTENT-NEEDED.md).
    ingredients: `Enriched with vitamins. Corn grits 75%, sugar [PLACEHOLDER: confirm the sugar figure and unit, given as "23"], salt, acidity regulator: sodium phosphates, malt extract powder from barley. ${VITAMINS}`,
    skus: [{ code: "TBC-HOOCH-102", variant: null, pack: "375g: 10 x 37.5g individual packs" }],
    images: [{ src: "/images/hooch/frosted-flakes-bowl.webp", alt: "A box of Hooch® Frosted Flakes with fresh strawberries" }],
    recipes: ["frosted-fruit-delight", "after-school-crunch"],
  },
];

/** Lexta's family planning guide (products.md): one pack per person per breakfast. */
export const FAMILY_GUIDE = {
  title: "How Much Hooch® Is Enough for the Family?",
  intro: "Each product provides 10 pre-portioned cereal packs. The number of packs your household uses depends on individual appetites and nutritional needs.",
  rows: [
    { people: 2, perBreakfast: "2 packs per breakfast", lasts: "5 breakfasts" },
    { people: 4, perBreakfast: "4 packs per breakfast", lasts: "2 breakfasts, with 2 packs remaining" },
    { people: 5, perBreakfast: "5 packs per breakfast", lasts: "2 breakfasts" },
  ],
  note: "Illustrative planning guide only, assuming one individual pack per person per breakfast. One pack may not meet everyone's nutritional or energy needs.",
};

/** Lexta: nutrition and allergen details "will be worked on and shared separately". */
export const ALLERGEN_NOTE = "Contains barley (malt extract). [PLACEHOLDER: approved Hooch nutrition panel and allergen notice from Lexta]";
