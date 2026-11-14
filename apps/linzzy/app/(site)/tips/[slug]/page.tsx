import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import ArticleBody from "@/components/tips/ArticleBody";
import ArticleCard from "@/components/tips/ArticleCard";
import s from "@/components/tips/tips.module.css";
import { ARTICLES, articleBySlug, categoryOf, NOTICES } from "@/content/articles";
import { RANGES } from "@/lib/ranges";

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

/** One article: Lexta's text, the "Linzzy Says" line, the Community Corner question and the category's notice. */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articleBySlug((await params).slug);
  if (!article) notFound();
  const cat = categoryOf(article.category);
  const same = ARTICLES.filter((a) => a.category === article.category);
  const next = same[(same.indexOf(article) + 1) % same.length];
  const related = same.filter((a) => a !== article && a !== next).slice(0, 3);
  const range = RANGES[article.category];
  const notice = NOTICES[article.category];

  return (
    <>
      <div className="lz-wrap">
        <nav className={s.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link><Icon name="chevron-right" size={14} />
          <Link href="/tips">Tips &amp; Advice</Link><Icon name="chevron-right" size={14} />
          <Link href={`/tips?category=${cat.slug}`}>{cat.label}</Link><Icon name="chevron-right" size={14} />
          <span aria-current="page">{article.title}</span>
        </nav>

        <header className={s.artHero}>
          <div>
            <span className={`lz-sticker ${article.category === "baby-care" ? "lz-sticker--mint" : "lz-sticker--lilac"} ${s.artTopic}`}>{article.topic}</span>
            <h1 className={s.artTitle}>{article.title}</h1>
            <p className={s.artLede}>{article.lede}</p>
            <div className={s.artMeta}>
              <span><Icon name="clock" size={16} /> {article.readMinutes} min read</span>
              <span><Icon name="book" size={16} /> Linzzy Tips &amp; Advice, {cat.label}</span>
            </div>
          </div>
          <div className={s.artPic} data-cat={article.category}>
            <Photo image={article.image} needed={article.imageNeeded ?? `photo for "${article.title}"`} icon={article.category === "baby-care" ? "baby" : "female"} eager position="center 35%" />
          </div>
        </header>

        <div className={s.artGrid}>
          <article>
            <ArticleBody article={article} />
            {article.says && <p className={s.says}><span className="lz-sticker lz-sticker--berry">Linzzy Says</span><br />{article.says}</p>}
            {article.community && (
              <aside className={s.community} data-cat={article.category} aria-label="Community Corner">
                <h2>Community Corner</h2>
                <p>{article.community}</p>
              </aside>
            )}
            <p className={s.notice}><strong>{notice.title}</strong>{notice.text}</p>
            <div className={s.backRow}>
              <Link href={`/tips?category=${cat.slug}`} className="lz-btn"><Icon name="arrow-left" size={18} /> Back to {cat.label}</Link>
              <Link href={`/products/${range.slug}`} className="lz-btn lz-btn--berry">See Linzzy {range.name} <Icon name="arrow" size={18} /></Link>
            </div>
          </article>
          <aside className={s.aside} aria-label="More">
            {next && next !== article && (
              <div className={s.next}>
                <div className={s.nextLabel}>UP NEXT</div>
                <p className={s.nextTitle}>{next.title}</p>
                <Link href={`/tips/${next.slug}`} className="lz-btn lz-btn--mint lz-btn--sm" style={{ marginTop: 16 }}>Read next <Icon name="arrow" size={16} /></Link>
              </div>
            )}
            <div className={s.box}>
              <h2>Have a question?</h2>
              <p>Our consumer care team is here to listen, care and support.</p>
              <Link href="/contact?topic=question#message" className={s.boxLink}>Contact us <Icon name="arrow" size={16} /></Link>
            </div>
            <div className={s.box}>
              <h2>Linzzy {range.name}</h2>
              <p>{range.tagline}. See the range and find a stockist near you.</p>
              <Link href={`/products/${range.slug}`} className={s.boxLink}>View products <Icon name="arrow" size={16} /></Link>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className={`lz-wrap ${s.section}`} aria-labelledby="related-title" style={{ paddingBottom: 88, paddingTop: 0 }}>
          <div className={s.sectionHead}><h2 id="related-title" className={s.sectionTitle}>You might also like</h2></div>
          <div className={s.grid3}>{related.map((a) => <ArticleCard key={a.slug} article={a} small />)}</div>
        </section>
      )}
    </>
  );
}
