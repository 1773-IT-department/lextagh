import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import ArticleBody from "@/components/tips/ArticleBody";
import ArticleCard from "@/components/tips/ArticleCard";
import s from "@/components/tips/tips.module.css";
import { ARTICLES, articleBySlug, categoryOf, HEALTH_NOTE, monthLabel } from "@/content/articles";
import { RANGES } from "@/lib/ranges";

export const dynamicParams = false;

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
    openGraph: { type: "article", title: `${a.title} | Yazz®`, description: a.lede, url: `/tips/${a.slug}`, images: a.image ? [{ url: a.image.src }] : undefined },
  };
}

/** One article: the Tips & Articles page template showing a single article (the prototype's Article view). */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articleBySlug((await params).slug);
  if (!article) notFound();
  const cat = categoryOf(article.category);
  const same = ARTICLES.filter((a) => a.category === article.category);
  const next = same[(same.indexOf(article) + 1) % same.length];
  const related = same.filter((a) => a !== article && a !== next).slice(0, 3);
  const range = article.range ? RANGES[article.range] : null;
  const health = article.category === "just-4-you" || article.category === "just-4-parents";

  return (
    <div style={{ ["--tone" as string]: article.topic.tone }}>
      <nav className={s.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><Icon name="chevron-right" size={14} />
        <Link href="/tips">Tips &amp; Articles</Link><Icon name="chevron-right" size={14} />
        <Link href={`/tips?category=${cat.slug}`}>{cat.label}</Link><Icon name="chevron-right" size={14} />
        <span aria-current="page">{article.title}</span>
      </nav>

      <header className={s.artHero}>
        <div>
          <div className={s.artTopic}>{article.topic.label}</div>
          <h1 className={s.artTitle}>{article.title}</h1>
          <p className={s.artKicker}>{article.kicker}</p>
          <p className={s.artLede}>{article.lede}</p>
          <div className={s.artMeta}>
            <span><Icon name="clock" size={15} /> {article.readMinutes} min read</span>
            <span><Icon name="edit" size={15} /> {article.date ? `Yazz Care Team, ${monthLabel(article.date)}` : "Yazz Care Team"}</span>
          </div>
        </div>
        <div className={s.artPic}>
          <Photo image={article.image} needed={`photo for "${article.title}"`} icon="book" eager position="center 30%" />
        </div>
      </header>

      <div className={s.artGrid}>
        <article>
          <ArticleBody article={article} />
          {health && <p className={s.health}>{HEALTH_NOTE}</p>}
          <div className={s.backRow}>
            <Link href={`/tips?category=${cat.slug}`} className="yz-btn yz-btn--outline"><Icon name="arrow-left" size={16} /> Back to {cat.label}</Link>
            {range && <Link href={`/products/${range.slug}`} className="yz-btn yz-btn--red">See Yazz {range.name} <Icon name="arrow" size={16} /></Link>}
          </div>
        </article>
        <aside className={s.aside} aria-label="More">
          {next && next !== article && (
            <div className={s.next}>
              <div className={s.nextLabel}>UP NEXT</div>
              <p className={s.nextTitle}>{next.title}</p>
              <Link href={`/tips/${next.slug}`} className="yz-btn yz-btn--red yz-btn--sm" style={{ marginTop: 16 }}>Read next <Icon name="arrow" size={15} /></Link>
            </div>
          )}
          <div className={s.box}>
            <h2>Have a question?</h2>
            <p>Our consumer care team is happy to help, privately and without judgement.</p>
            <Link href="/contact?topic=question#message" className={s.boxLink}>Contact us <Icon name="arrow" size={15} /></Link>
          </div>
          {range && (
            <div className={s.box}>
              <h2>Yazz {range.name}</h2>
              <p>{range.tagline}. See the range and find a stockist near you.</p>
              <Link href={`/products/${range.slug}`} className={s.boxLink}>View products <Icon name="arrow" size={15} /></Link>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className={s.section} aria-labelledby="related-title" style={{ paddingBottom: 56 }}>
          <div className={s.sectionHead}><h2 id="related-title" className={s.sectionTitle}>You might also like</h2></div>
          <div className={s.grid3}>{related.map((a) => <ArticleCard key={a.slug} article={a} small />)}</div>
        </section>
      )}
    </div>
  );
}
