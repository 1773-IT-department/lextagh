import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/tips/ArticleCard";
import SubscribeForm from "@/components/tips/SubscribeForm";
import s from "@/components/tips/tips.module.css";
import { ARTICLES, CATEGORIES, isCategory, NOTICES, PARENT_CORNER, QUICK_TIPS } from "@/content/articles";
import { BRAND } from "@/content/brand";

type Search = Promise<{ category?: string | string[] }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const raw = (await searchParams).category;
  const c = typeof raw === "string" && isCategory(raw) ? CATEGORIES.find((x) => x.slug === raw)! : null;
  const title = c ? `${c.label}: Tips & Advice` : "Tips & Advice";
  const description = c ? c.blurb : "Linzzy Tips & Advice: practical articles on menstrual hygiene, choosing sanitary towels, diaper-changing routines, baby wipes, parenting and personal well-being.";
  return { title, description, alternates: { canonical: c ? `/tips?category=${c.slug}` : "/tips" }, openGraph: { title: `${title} | Linzzy`, description, url: "/tips" } };
}

/**
 * Tips & Advice: Lexta's Feminine Care Edition and Baby Diapers & Baby Wipes articles, the six quick tips and the
 * Linzzy Parent Corner (editorial only). Categories are links (?category=...), so filtering works without JavaScript.
 * Articles live in content/articles.ts.
 */
export default async function TipsPage({ searchParams }: { searchParams: Search }) {
  const raw = (await searchParams).category;
  const category = typeof raw === "string" && isCategory(raw) ? raw : null;
  const groups = CATEGORIES.filter((c) => !category || c.slug === category);
  const month = PARENT_CORNER.months[new Date().getUTCMonth()];

  return (
    <>
      <section className={s.hero} aria-labelledby="tips-title">
        <div className={`lz-wrap ${s.heroInner}`}>
          <span className="lz-sticker lz-sticker--mint">Tips &amp; Advice</span>
          <h1 id="tips-title" className={s.heroTitle}>Care Beyond the Product</h1>
          <p className={s.heroText}>{BRAND.tips.body.join(" ")}</p>
          <nav className={s.filters} aria-label="Article categories">
            <Link href="/tips" className="lz-chip" aria-current={!category ? "true" : undefined}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/tips?category=${c.slug}`} className="lz-chip" aria-current={category === c.slug ? "true" : undefined}>{c.label}</Link>
            ))}
            <a href="#parent-corner" className="lz-chip">Parent Corner</a>
          </nav>
        </div>
      </section>

      {groups.map((c) => {
        const list = ARTICLES.filter((a) => a.category === c.slug);
        return (
          <section key={c.slug} className={`lz-wrap ${s.section}`} aria-labelledby={`list-${c.slug}`}>
            <div className={s.sectionHead}>
              <div>
                <h2 id={`list-${c.slug}`} className={s.sectionTitle}>{c.title}</h2>
                <p className={s.tagline} data-cat={c.slug}>{c.tagline}</p>
              </div>
              <span className={s.count}>{list.length} {list.length === 1 ? "article" : "articles"}</span>
            </div>
            <div className={s.grid3}>{list.map((a) => <ArticleCard key={a.slug} article={a} />)}</div>
            {c.slug === "feminine-care" && (
              <div style={{ marginTop: 64 }}>
                <h2 className={s.sectionTitle} style={{ marginBottom: 40 }}>Six Quick Tips</h2>
                <div className={s.quick}>
                  {QUICK_TIPS.map((t) => (
                    <div key={t.n} className={s.quickCard}>
                      <span className={s.quickNum} aria-hidden="true">{t.n}</span>
                      <span className={s.quickTitle}>{t.title}</span>
                      <h3>{t.headline}</h3>
                      <p>{t.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className={s.notice}><strong>{NOTICES[c.slug].title}</strong>{NOTICES[c.slug].text}</p>
          </section>
        );
      })}

      <section id="parent-corner" className={s.corner} aria-labelledby="corner-title">
        <div className={`lz-wrap ${s.cornerGrid}`}>
          <div className={s.cornerText}>
            <span className="lz-sticker lz-sticker--lilac">{PARENT_CORNER.title}</span>
            <h2 id="corner-title" className={s.cornerTitle}>{PARENT_CORNER.tagline}</h2>
            <p className={s.cornerLead}>{PARENT_CORNER.lead}</p>
            {PARENT_CORNER.intro.map((p) => <p key={p}>{p}</p>)}
            <p className={s.cornerSign}>{PARENT_CORNER.sign}</p>
          </div>
          <div>
            <div className={s.question}>
              <p className={s.questionLabel}>This month&apos;s Parent Corner question</p>
              <p className={s.questionText}>&ldquo;{month.question}&rdquo;</p>
              <p className={s.questionTheme}>Community theme: {month.theme}</p>
            </div>
            <p style={{ marginTop: 28, fontFamily: "var(--lz-display)", fontWeight: 800, color: "var(--lz-ink)" }}>Parenting comes with plenty of questions, and finding reliable information matters.</p>
            <ul className={s.topics}>{PARENT_CORNER.topics.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </section>

      <div className="lz-wrap"><SubscribeForm /></div>
    </>
  );
}
