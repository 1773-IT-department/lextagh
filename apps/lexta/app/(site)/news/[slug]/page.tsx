import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArrowButton from "@/components/ArrowButton";
import NewsCard from "@/components/news/NewsCard";
import ShareRow from "@/components/news/ShareRow";
import s from "@/components/news/article.module.css";
import {
  aboutLexta, adjacentArticles, articleHref, articles, draftNotice, getArticle, mediaContact, mediaEmail, mediaPhone,
  relatedArticles, toCard, type ArticleBlock,
} from "@/content/news";
import { absoluteUrl, siteUrl } from "@/content/site";

type Params = { params: Promise<{ slug: string }> };

/** Every story is built at build time; any other /news/<slug> is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  const title = `${a.title} | Lexta Ghana`;
  const image = absoluteUrl(a.image);
  return {
    metadataBase: new URL(siteUrl),
    title: { absolute: title },
    description: a.standfirst,
    alternates: { canonical: articleHref(a) },
    openGraph: {
      type: "article", title, description: a.standfirst, url: articleHref(a), siteName: "Lexta Ghana",
      publishedTime: a.isoDate, section: a.category, images: [{ url: image, alt: a.imageAlt }],
    },
    twitter: { card: "summary_large_image", title, description: a.standfirst, images: [image] },
  };
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "h2":
      return <h2>{block.text}</h2>;
    case "quote":
      return (
        <figure className={s.quote}>
          <blockquote><p>{block.text}</p></blockquote>
          {block.cite && <figcaption>{block.cite}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <>
          {block.intro && <p>{block.intro}</p>}
          <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </>
      );
    default:
      return <p>{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: Params) {
  const a = getArticle((await params).slug);
  if (!a) notFound();

  const href = articleHref(a);
  const pageUrl = absoluteUrl(href);
  const related = relatedArticles(a);
  const { newer, older } = adjacentArticles(a);
  const categoryHref = `/news?category=${encodeURIComponent(a.category)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title,
    description: a.standfirst,
    image: [absoluteUrl(a.image)],
    datePublished: a.isoDate,
    articleSection: a.category,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    url: pageUrl,
    author: { "@type": "Organization", name: "Lexta Ghana Limited", url: siteUrl },
    publisher: { "@type": "Organization", name: "Lexta Ghana Limited", logo: { "@type": "ImageObject", url: absoluteUrl("/assets/lexta-logo.png") } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <article>
        <div className={s.hero}>
          <div className={s.heroInner}>
            <nav aria-label="Breadcrumb">
              <ol className={s.crumbs}>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/news">News</Link></li>
                <li><Link href={categoryHref}>{a.category}</Link></li>
              </ol>
            </nav>
            <div className={s.bar} />
            <div className={s.meta}>
              <Link href={categoryHref} className={s.pill}>{a.category}</Link>
              <time dateTime={a.isoDate}>{a.date}</time>
              <span className={s.dot} aria-hidden="true" />
              <span>{a.readingMinutes} min read</span>
            </div>
            <h1 className={s.title}>{a.title}</h1>
            <p className={s.standfirst}>{a.standfirst}</p>
          </div>
        </div>

        <div className={s.coverBand}>
          <div className={s.cover}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt={a.imageAlt} />
          </div>
        </div>

        <div className={s.wrap}>
          <div className={s.col}>
            <div className={s.toolbar}>
              <Link href="/news" className={s.backLink}><span aria-hidden="true">←</span> All news</Link>
              <ShareRow title={a.title} path={href} fallbackUrl={pageUrl} />
            </div>

            <div className={s.prose}>
              {a.body.map((b, i) => <Block key={i} block={b} />)}
            </div>

            <div className={s.endShare}>
              <ShareRow title={a.title} path={href} fallbackUrl={pageUrl} label="Share this story" />
            </div>

            {a.draft && (
              <aside className={s.draft} aria-label="About this story">
                <span className={s.draftIcon} aria-hidden="true">i</span>
                <div>
                  <div className={s.draftTitle}>Interim summary</div>
                  <p>{draftNotice}</p>
                </div>
              </aside>
            )}

            {a.sources.length > 0 && (
              <section className={s.sources} aria-labelledby="sources-title">
                <h2 id="sources-title" className={s.smallHeading}>Sources</h2>
                <ol>
                  {a.sources.map((src) => (
                    <li key={src.url + src.name}>
                      <a href={src.url} target="_blank" rel="noopener noreferrer">
                        {src.name}<span className={s.ext} aria-hidden="true">↗</span>
                        <span className={s.srOnly}> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className={s.boiler}>
              <section aria-labelledby="about-title">
                <h2 id="about-title" className={s.smallHeading}>About Lexta Ghana</h2>
                <p>{aboutLexta}</p>
              </section>
              <section aria-labelledby="media-title">
                <h2 id="media-title" className={s.smallHeading}>Media enquiries</h2>
                <p>{mediaContact}</p>
                <a href={`mailto:${mediaEmail}`} className={s.contactLine}>{mediaEmail}</a>
                <a href={`tel:${mediaPhone.replace(/[^+\d]/g, "")}`} className={s.contactLine}>{mediaPhone}</a>
              </section>
            </div>

            {(newer || older) && (
              <nav className={s.pager} aria-label="More from the newsroom">
                {newer ? (
                  <Link href={articleHref(newer)} className={s.pagerLink}>
                    <span className={s.pagerLabel}><span aria-hidden="true">←</span> Newer story</span>
                    <span className={s.pagerTitle}>{newer.title}</span>
                  </Link>
                ) : <span />}
                {older ? (
                  <Link href={articleHref(older)} className={`${s.pagerLink} ${s.pagerNext}`}>
                    <span className={s.pagerLabel}>Older story <span aria-hidden="true">→</span></span>
                    <span className={s.pagerTitle}>{older.title}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}
          </div>
        </div>
      </article>

      <section className={s.more} aria-labelledby="more-title">
        <div className={s.moreInner}>
          <div className={s.moreHead}>
            <div>
              <div className={s.eyebrow}>Keep reading</div>
              <h2 id="more-title" className={s.moreTitle}>More stories</h2>
            </div>
            <ArrowButton href="/news" padding="12px 12px 12px 20px">Back to all news</ArrowButton>
          </div>
          <div className={s.moreGrid}>
            {related.map((r) => <NewsCard key={r.slug} article={toCard(r)} />)}
          </div>
        </div>
      </section>
    </>
  );
}
