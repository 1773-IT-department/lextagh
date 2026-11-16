import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleClient from "@/components/linzzy/pages/ArticleClient";
import { ARTICLES, articleBySlug, categoryOf, NOTICES } from "@/content/articles";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = articleBySlug((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.lede,
    alternates: { canonical: `/tips/${a.slug}` },
    openGraph: { type: "article", title: `${a.title} | Linzzy`, description: a.lede, url: `/tips/${a.slug}`, images: a.image ? [{ url: a.image.src }] : undefined },
  };
}

const ph = (a: (typeof ARTICLES)[number]) => (a.image ? "" : `[PLACEHOLDER: ${a.imageNeeded ?? "article photo from Lexta"}]`);

/** One article: Lexta's text, the "Linzzy Says" line, the Community Corner question, the category's notice and more reads. */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articleBySlug((await params).slug);
  if (!article) notFound();
  const same = ARTICLES.filter((a) => a.category === article.category);
  const i = same.indexOf(article);
  const reads = [1, 2, 3].map((k) => same[(i + k) % same.length]).filter((a) => a !== article);
  return (
    <ArticleClient
      a={{
        slug: article.slug, title: article.title, lede: article.lede, topic: article.topic, minutes: article.readMinutes, body: article.body,
        g: article.category === "baby-care" ? "baby" : "fem", catLabel: categoryOf(article.category).label, img: article.image, ph: ph(article),
        says: article.says, community: article.community, notice: NOTICES[article.category],
      }}
      reads={reads.map((a) => ({ slug: a.slug, title: a.title, topic: a.topic, minutes: a.readMinutes, img: a.image?.src ?? null, alt: a.image?.alt ?? "", ph: ph(a) }))}
    />
  );
}
