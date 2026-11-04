import { articles, type Article } from "./articles";

export * from "./articles";
export * from "./boilerplate";
export * from "./categories";

/** The fields a News card shows (all the News grid sends to the browser). */
export type CardArticle = Pick<Article, "slug" | "title" | "category" | "date" | "excerpt" | "image">;
export const toCard = ({ slug, title, category, date, excerpt, image }: Article): CardArticle => ({ slug, title, category, date, excerpt, image });

export const articleHref = (a: Pick<Article, "slug">) => `/news/${a.slug}`;

/** The story in the News page hero. */
export const featuredArticle: Article = articles.find((a) => a.featured) ?? articles[0];

/** Cards in the News grid: every story except the featured one, in file order. */
export const gridArticles: Article[] = articles.filter((a) => a !== featuredArticle);

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

const byNewest = (a: Article, b: Article) => b.isoDate.localeCompare(a.isoDate);

/** Three stories to read next: same category first (newest first), then the newest of the rest. */
export function relatedArticles(current: Article, count = 3): Article[] {
  const others = articles.filter((a) => a.slug !== current.slug);
  const same = others.filter((a) => a.category === current.category).sort(byNewest);
  const rest = others.filter((a) => a.category !== current.category).sort(byNewest);
  return [...same, ...rest].slice(0, count);
}

/** Neighbours in the list: newer is the story above this one, older the one below. */
export function adjacentArticles(current: Article): { newer?: Article; older?: Article } {
  const i = articles.findIndex((a) => a.slug === current.slug);
  return { newer: i > 0 ? articles[i - 1] : undefined, older: i >= 0 && i < articles.length - 1 ? articles[i + 1] : undefined };
}
