/**
 * Breakfast Ideas & Recipes, Lexta's words ("Hooch Foods website content.docx", Breakfast Ideas & Recipes tab;
 * docs/content/hooch/recipes.md). The four recipes of the six tab draft are the recipe cards; the creative uses ("Beyond
 * the Bowl") come from the same document. Each recipe shows a real food photo from Lexta's own Hooch artwork; where none matches
 * the recipe yet, the photo carries a clearly marked placeholder (CONTENT-NEEDED.md).
 *
 * Lexta asks that people can share a recipe "for publishing as an article after approval by admin": a moderated
 * upload and publishing flow is a new feature outside the contract, so "Share Your Hooch® Recipe" sends a message to
 * the Hooch team through the contact form (a CRM lead) instead. Logged in CONTENT-NEEDED.md.
 */
export type Recipe = {
  slug: string;
  name: string;
  /** Lexta's strapline under the name (the short draft recipes have none). */
  strap?: string;
  /** Lexta's method, as written. */
  method: string;
  /** Preparation time; left out where Lexta gives none (a placeholder shows instead). */
  minutes?: number;
  /** Servings, only marked as still needed: Lexta gives no servings for any recipe yet. */
  servingsNeeded?: string;
  /**
   * Breakfast, snack or dessert, for the filter chips ("Recipe grid: Breakfast / Snacks / Desserts",
   * docs/content/hooch/website-copy.md:24). Lexta files the four main recipes under Breakfast Ideas & Recipes; only the
   * After-School Crunch is a snack in Lexta's own words ("A Little Crunch for Snack Time"). The two desserts come from
   * Lexta's short draft (website-copy.md:74-75) and wait for Lexta to confirm them (CONTENT-NEEDED.md).
   */
  moment: "Breakfast" | "Snack" | "Dessert";
  /** Which cereal it uses (product slugs); empty where Lexta's method names none. */
  cereals: string[];
  /** What goes in, read from Lexta's method (no quantities: Lexta gives none). */
  youNeed: string[];
  image: { src: string; alt: string; position?: string };
  /** Set while the photo only stands in for the recipe's own photo (still to come from Lexta). */
  photoNeeded?: string;
  /** Card colour. */
  tone: "sun" | "red" | "sky" | "gold";
};

export const RECIPES_INTRO = {
  eyebrow: "Breakfast Ideas & Recipes",
  title: "Make Every Morning a Hooch® Moment!",
  body: "Breakfast doesn't have to be complicated to be enjoyable. Discover simple ways to add colour, variety and excitement to your Hooch® breakfast.",
};

export const RECIPES: Recipe[] = [
  {
    slug: "classic-hooch-bowl",
    name: "The Classic Hooch® Bowl",
    strap: "Simple. Crunchy. Delicious.",
    method: "Pour your Hooch® Cornflakes into a bowl, add milk and enjoy. Include sliced banana for a naturally sweet addition.",
    minutes: 3,
    moment: "Breakfast",
    cereals: ["cornflakes"],
    youNeed: ["Hooch® Cornflakes", "Milk", "Sliced banana"],
    image: { src: "/images/hooch/photo-bowl-hands.webp", alt: "Hands holding a red bowl of golden Hooch cornflakes in milk on a red checked tablecloth" },
    tone: "sun",
  },
  {
    slug: "frosted-fruit-delight",
    name: "The Frosted Fruit Delight",
    strap: "A Sweet Start with a Fruity Twist.",
    method: "Add Hooch® Frosted Flakes to a bowl and top with fresh strawberries, banana or other seasonal fruit. Serve with milk.",
    minutes: 5,
    moment: "Breakfast",
    cereals: ["frosted-flakes"],
    youNeed: ["Hooch® Frosted Flakes", "Fresh strawberries", "Banana or other seasonal fruit", "Milk"],
    image: { src: "/images/hooch/photo-bowl-berries.webp", alt: "A bowl heaped with crunchy golden flakes and fresh strawberries" },
    tone: "red",
  },
  {
    slug: "yoghurt-crunch",
    name: "Hooch® Yoghurt Crunch",
    strap: "Crunch Meets Creamy Goodness.",
    method: "Layer plain yoghurt, fresh fruit and Hooch® Cornflakes in a glass. Serve immediately to enjoy the crunchy texture.",
    minutes: 5,
    moment: "Breakfast",
    cereals: ["cornflakes"],
    youNeed: ["Plain yoghurt", "Fresh fruit", "Hooch® Cornflakes"],
    image: { src: "/images/hooch/photo-bowl-berries.webp", alt: "Crunchy golden flakes with fresh strawberries", position: "70% 50%" },
    photoNeeded: "photo of Hooch® Yoghurt Crunch from Lexta",
    tone: "sky",
  },
  {
    slug: "after-school-crunch",
    name: "The Hooch® After-School Crunch",
    strap: "A Little Crunch for Snack Time.",
    method: "Serve a small portion of Hooch® alongside sliced fruit for an easy snack after school or during a family break.",
    minutes: 3,
    moment: "Snack",
    cereals: ["cornflakes", "frosted-flakes"],
    youNeed: ["A small portion of Hooch®", "Sliced fruit"],
    image: { src: "/images/hooch/photo-family.webp", alt: "A family at the table with bowls of Hooch cornflakes, a box of Hooch Cornflakes and a bowl of fruit", position: "55% 70%" },
    photoNeeded: "photo of The Hooch® After-School Crunch from Lexta",
    tone: "gold",
  },
  {
    // Lexta's short draft (docs/content/hooch/website-copy.md:74), method as written; to be confirmed by Lexta.
    slug: "celebration-fruit-cups",
    name: "Celebration Fruit Cups",
    method: "Arrange diced fruit and yoghurt in small cups, topping with cereal immediately before serving.",
    servingsNeeded: "servings for Celebration Fruit Cups",
    moment: "Dessert",
    // Lexta's method says "cereal" without naming one, so no product is linked.
    cereals: [],
    youNeed: ["Diced fruit", "Yoghurt", "Cereal"],
    image: { src: "/images/hooch/photo-bowl-berries.webp", alt: "Crunchy golden flakes with fresh strawberries", position: "30% 50%" },
    photoNeeded: "photo of Celebration Fruit Cups from Lexta",
    tone: "red",
  },
  {
    // Lexta's short draft (docs/content/hooch/website-copy.md:75), method as written; to be confirmed by Lexta.
    slug: "crunchy-dessert-topper",
    name: "Crunchy Dessert Topper",
    method: "Sprinkle a small amount of cereal over a chilled fruit dessert just before serving.",
    servingsNeeded: "servings for Crunchy Dessert Topper",
    moment: "Dessert",
    // Lexta's method says "cereal" without naming one, so no product is linked.
    cereals: [],
    youNeed: ["A small amount of cereal", "A chilled fruit dessert"],
    image: { src: "/images/hooch/cornflakes-bowl.webp", alt: "A bowl of golden Hooch cornflakes" },
    photoNeeded: "photo of Crunchy Dessert Topper from Lexta",
    tone: "sky",
  },
];

export const SHARE_RECIPE = {
  title: "Have a Hooch® Breakfast Idea?",
  body: "Share your favourite Hooch® breakfast combination with us for a chance to inspire other families.",
  cta: "Share Your Hooch® Recipe",
};

/** "Beyond the Bowl: Get Creative with Hooch®!" (products.md), Lexta's creative kitchen questions. */
export const BEYOND = {
  title: "Beyond the Bowl: Get Creative with Hooch®!",
  intro: "Who says Hooch® is only for breakfast? From crunchy snacks to creative desserts and homemade treats, there are many delicious ways to enjoy Hooch® Cornflakes and Hooch® Frosted Flakes. Explore our frequently asked questions for inspiration in the kitchen!",
  items: [
    { q: "Can I use Hooch® Cornflakes for baking?", a: "Absolutely! Hooch® Cornflakes can add a crunchy texture to homemade cookies, cereal bars and other baked treats. Try lightly crushing the flakes and mixing them into your favorite baking recipes.", icon: "cookie" },
    { q: "Can I make cookies with Hooch® Frosted Flakes?", a: "Yes! The sweet frosted flavor makes Hooch® Frosted Flakes a fun addition to cookies and dessert recipes. Fold them into cookie dough or use crushed flakes as a topping. Remember to adjust other sweet ingredients to suit your taste.", icon: "sparkle" },
    { q: "Can I use Hooch® Cornflakes as a crunchy coating for food?", a: "Yes. Crush Hooch® Cornflakes and use them as a coating for oven-baked chicken, fish or vegetables. Season to your preference and cook thoroughly using appropriate food-safety temperatures.", icon: "flame" },
    { q: "Can I make homemade cereal bars with Hooch®?", a: "Certainly! Combine Hooch® Cornflakes with a suitable binding mixture, press into a lined tray and chill or bake according to your chosen recipe. Cut into portions for a convenient homemade snack.", icon: "box" },
    { q: "Which Hooch® product is better for savoury recipes?", a: "Hooch® Cornflakes are generally the more versatile option for savoury cooking because of their classic flavor. Hooch® Frosted Flakes are better suited to recipes where a sweeter taste is desired.", icon: "bowl" },
    { q: "Can I use Hooch® as a topping for yoghurt or ice cream?", a: "Of course! Sprinkle Hooch® Cornflakes or Frosted Flakes over yoghurt, fruit bowls or ice cream just before serving for extra crunch.", icon: "drop" },
    { q: "Can children help prepare Hooch® recipes?", a: "Yes! Children can help with age-appropriate tasks such as pouring cereal, mixing cool ingredients and decorating treats. An adult should supervise activities involving ovens, hot surfaces or sharp utensils.", icon: "people" },
    { q: "How can I keep Hooch® crunchy when using it in recipes?", a: "Add the cereal shortly before serving when making yoghurt bowls, fruit desserts or other moist dishes. Store unused cereal in its original packaging, properly sealed, in a cool, dry place.", icon: "shield" },
  ],
};

export const recipeBySlug = (slug: string) => RECIPES.find((r) => r.slug === slug);
