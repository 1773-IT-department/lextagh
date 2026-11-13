import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import ArticleCard from "@/components/tips/ArticleCard";
import SubscribeForm from "@/components/tips/SubscribeForm";
import s from "@/components/tips/tips.module.css";
import { ARTICLES, CATEGORIES, HEALTH_NOTE, isCategory, sortedArticles, TOPIC_TILES } from "@/content/articles";

type Search = Promise<{ category?: string | string[] }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const raw = (await searchParams).category;
  const c = typeof raw === "string" && isCategory(raw) ? CATEGORIES.find((x) => x.slug === raw)! : null;
  const title = c ? `${c.label}: Tips & Articles` : "Tips & Articles";
  const description = c
    ? c.blurb
    : "Yazz® Tips & Articles: Tips Just 4 You on periods and puberty, guides Just 4 Parents, and everyday care tips for oral care, baby care and home care.";
  return { title, description, alternates: { canonical: c ? `/tips?category=${c.slug}` : "/tips" }, openGraph: { title: `${title} | Yazz®`, description, url: "/tips" } };
}

/**
 * Tips & Articles: the prototype's News, Article list and Tips Just 4 You merged into one page. Categories are links
 * (?category=...), so filtering works without JavaScript. Articles live in content/articles.ts.
 */
export default async function TipsPage({ searchParams }: { searchParams: Search }) {
  const raw = (await searchParams).category;
  const category = typeof raw === "string" && isCategory(raw) ? raw : null;
  const cat = category ? CATEGORIES.find((c) => c.slug === category)! : null;
  const list = sortedArticles(category ? ARTICLES.filter((a) => a.category === category) : ARTICLES);
  const showTiles = !category || category === "just-4-you";
  const health = !category || category === "just-4-you" || category === "just-4-parents";

  return (
    <>
      <section className={s.hero} aria-labelledby="tips-title">
        <p className="yz-eyebrow">Tips &amp; Advice</p>
        <h1 id="tips-title" className={s.heroTitle}>{cat ? cat.title : "Helpful ideas for everyday living."}</h1>
        <p className={s.heroText}>
          {cat
            ? cat.blurb
            : "Created around the real questions families ask. Browse Tips Just 4 You on periods, puberty and confidence, guides Just 4 Parents & Caregivers, and care tips for the home."}
        </p>
        <nav className={s.filters} aria-label="Article categories">
          <Link href="/tips" className="yz-chip" aria-current={!category ? "true" : undefined}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/tips?category=${c.slug}`} className="yz-chip" aria-current={category === c.slug ? "true" : undefined}>{c.label}</Link>
          ))}
        </nav>
      </section>

      {showTiles && (
        <section className={s.section} aria-labelledby="tiles-title">
          <div className={s.sectionHead}>
            <h2 id="tiles-title" className={s.sectionTitle}>Tips Just 4 You: what would you like to know today?</h2>
          </div>
          <div className={s.tiles}>
            {TOPIC_TILES.map((t) => (
              <Link key={t.slug} href={`/tips/${t.slug}`} className={s.tile}>
                <strong>{t.title}</strong>
                <span>{t.body}</span>
                <Icon name="arrow" size={18} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={s.section} aria-labelledby="list-title">
        <div className={s.sectionHead}>
          <h2 id="list-title" className={s.sectionTitle}>{cat ? cat.label : "All articles"}</h2>
          <span className={s.count}>{list.length} {list.length === 1 ? "article" : "articles"}</span>
        </div>
        {list.length > 0 ? (
          <div className={s.grid3}>{list.map((a) => <ArticleCard key={a.slug} article={a} />)}</div>
        ) : (
          <p className={s.empty}>
            No news yet. [PLACEHOLDER: Yazz news stories and press releases from Lexta]. In the meantime, read our{" "}
            <Link href="/tips?category=just-4-you">Tips Just 4 You</Link>.
          </p>
        )}
      </section>

      {health && <p className={s.note}>{HEALTH_NOTE}</p>}

      <SubscribeForm />
    </>
  );
}
