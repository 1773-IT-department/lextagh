/**
 * Product FAQs, Lexta's wording ("Hooch Foods website content.docx", Our Products tab, Product FAQs;
 * docs/content/hooch/products.md). Shown on Nutrition & Family Tips. The kitchen questions ("Beyond the Bowl") are on
 * the Recipes page (content/recipes.ts).
 */
export type FaqGroup = { id: string; name: string; icon: string; items: { q: string; a: string; link?: { href: string; label: string } }[] };

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "cereals",
    name: "Our cereals",
    icon: "bowl",
    items: [
      { q: "Can I eat Hooch® without milk?", a: "Yes. Hooch® cereals can also be enjoyed as a crunchy snack.", link: { href: "/recipes/after-school-crunch", label: "See the After-School Crunch" } },
      { q: "Can children enjoy Hooch®?", a: "Hooch® may be included in age-appropriate diets. Parents should consider the child's age, dietary needs, allergies and the product's nutrition label." },
      { q: "How should I store my Hooch®?", a: "Keep the product in a cool, dry place and follow the storage instructions on the packaging." },
      { q: "What is the difference between Cornflakes and Frosted Flakes?", a: "Hooch® Cornflakes offers a classic cereal taste, while Frosted Flakes provides a sweeter, frosted alternative.", link: { href: "/products", label: "Meet both cereals" } },
    ],
  },
];
