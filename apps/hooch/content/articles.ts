/**
 * Nutrition & Family Tips: Lexta's four article teasers ("Hooch Foods website content.docx", Nutrition & Family Tips
 * tab; docs/content/hooch/articles). Lexta supplied only the summaries, so each article page shows the summary and a
 * clearly marked placeholder for the full text. Lexta's note: "Read More" opens the article, with a link to the next one.
 */
export type Article = { slug: string; title: string; summary: string; icon: string; tone: "sun" | "red" | "sky" | "gold" };

export const ARTICLES: Article[] = [
  {
    slug: "what-makes-a-balanced-breakfast",
    title: "What Makes a Balanced Breakfast?",
    summary: "A balanced breakfast can include foods from different groups, such as whole grains, fruit, dairy or alternatives, and protein-rich foods. Learn simple ways to create a varied morning meal using foods available to your family.",
    icon: "bowl",
    tone: "sun",
  },
  {
    slug: "teaching-children-healthy-breakfast-habits",
    title: "Teaching Children Healthy Breakfast Habits",
    summary: "Small routines can make a difference. Discover how involving children in age-appropriate breakfast preparation, offering variety and creating positive mealtime experiences can support good eating habits.",
    icon: "people",
    tone: "red",
  },
  {
    slug: "understanding-food-labels-and-portions",
    title: "Understanding Food Labels and Portions",
    summary: "What do serving sizes, ingredients and nutrition information mean? Learn how to read packaged-food labels and understand the role of portions when planning meals for different household members.",
    icon: "list",
    tone: "sky",
  },
  {
    slug: "making-family-breakfast-time-easier",
    title: "Making Family Breakfast Time Easier",
    summary: "Busy mornings don't have to mean skipping breakfast. Explore simple preparation tips, planning ideas and ways to make shared mealtimes more enjoyable.",
    icon: "clock",
    tone: "gold",
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);
