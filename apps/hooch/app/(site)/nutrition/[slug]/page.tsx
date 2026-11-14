import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import { ARTICLES, articleBySlug } from "@/content/articles";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = articleBySlug((await params).slug);
  if (!a) return { title: "Article not found" };
  return { title: a.title, description: a.summary, alternates: { canonical: `/nutrition/${a.slug}` } };
}

/** One Nutrition & Family Tips article: Lexta's summary, the full text to come, and the next article (Lexta's note). */
export default async function ArticlePage({ params }: { params: Params }) {
  const a = articleBySlug((await params).slug);
  if (!a) notFound();
  const next = ARTICLES[(ARTICLES.indexOf(a) + 1) % ARTICLES.length];
  return (
    <>
      <section className={s.hero} data-tone="cream" aria-labelledby="a-title">
        <div className={`hc-wrap ${s.heroInner}`}>
          <nav className={s.crumbs} aria-label="Breadcrumb"><Link href="/nutrition">Nutrition &amp; Family Tips</Link> <Icon name="chevron-right" size={14} /> <span aria-current="page">{a.title}</span></nav>
          <h1 id="a-title" className={s.heroTitle}>{a.title}</h1>
        </div>
        <MilkWave style={{ marginTop: 30 }} />
      </section>
      <article className={`hc-wrap ${s.section} ${s.article}`} style={{ paddingTop: 20 }}>
        <p className={s.articleLead}>{a.summary}</p>
        <p className={s.ph}>[PLACEHOLDER: full article text from Lexta]</p>
      </article>
      <section className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-label="Next article">
        <Link href={`/nutrition/${next.slug}`} className={`${s.next} hc-wobble`} style={{ maxWidth: 640 }}>
          <span className={s.valueIcon} style={{ width: 84, height: 84, flex: "none" }}><Icon name={next.icon} size={34} /></span>
          <span><small>Next article</small><strong>{next.title}</strong></span>
        </Link>
      </section>
    </>
  );
}
