"use client";

import type { CSSProperties } from "react";
import { parseBody } from "../article";
import ShellView from "../views/ShellView";
import { useChrome } from "../chrome";
import Breadcrumbs from "../Breadcrumbs";

// One Tips & Advice article (/tips/<slug>) in the prototype's design: the Tips page header, menu and footer around
// Lexta's article text, its "Linzzy Says" line, the Community Corner question, the category's notice and more reads.
// The prototype has no article page; this one is built from the Tips page's type, colours and cards.

export type ArticleData = {
  slug: string; title: string; lede: string; topic: string; minutes: number | null; body: string; g: "fem" | "baby";
  catLabel: string; img: { src: string; alt: string } | null; ph: string; says: string | null; community: string | null;
  notice: { title: string; text: string };
  /** The product that goes with the article (its panel opens at /products?p=<slug>), or null. */
  product: { slug: string; name: string } | null;
};
export type ReadData = { slug: string; title: string; topic: string; minutes: number | null; img: string | null; alt: string; ph: string };

const serif = "'DM Serif Display',serif";
const eyebrow = (color: string): CSSProperties => ({ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color });
const pad = "clamp(20px,5vw,80px)";

export default function ArticleClient({ a, reads }: { a: ArticleData; reads: ReadData[] }) {
  const c = useChrome("/tips", a.catLabel);
  const tone = a.g === "fem" ? "#C2185B" : "#0E7A5B";
  const soft = a.g === "fem" ? "#EFE6FF" : "#DDF7EC";
  const v = { ...c.base, chapters: c.chapters([["top", "00", a.catLabel], ["article", "01", "The Article"], ["more", "02", "Keep Reading"]]) };
  const blocks = parseBody(a.body);

  return (
    <ShellView v={v}>
      <section id="top" data-chapter={a.catLabel} data-num="00" style={{ background: "#FBF8FF", padding: `clamp(130px,16vw,200px) ${pad} clamp(40px,6vw,80px)` }}>
        <Breadcrumbs items={[{ label: "Tips & Advice", href: "/tips" }, { label: a.title }]} />
        <p style={eyebrow(tone)}><a href="/tips" style={{ color: "inherit" }}>Tips &amp; Advice</a> · {a.catLabel} · {a.topic}{a.minutes ? ` · ${a.minutes} min read` : ""}</p>
        <h1 data-reveal="1" style={{ margin: "22px 0 0", maxWidth: 1100, fontFamily: serif, fontWeight: 400, fontSize: "clamp(42px,6.4vw,104px)", lineHeight: 0.95, letterSpacing: "-0.03em", color: "#23103a", opacity: "var(--r,1)" as unknown as number, transform: "translateY(calc((1 - var(--r,1)) * 40px))" }}>{a.title}</h1>
        <p style={{ margin: "28px 0 0", maxWidth: 760, fontSize: "clamp(19px,1.6vw,24px)", lineHeight: 1.5, color: "#3d2a55" }}>{a.lede}</p>
      </section>

      <section id="article" data-chapter="The Article" data-num="01" style={{ background: "#FBF8FF", padding: `0 ${pad} clamp(70px,9vw,130px)` }}>
        <div style={{ aspectRatio: "16/8", maxHeight: 620, overflow: "hidden", background: soft }}>
          {a.img ? (
            <img src={a.img.src} alt={a.img.alt} data-speed="0.06" style={{ width: "100%", height: "112%", objectFit: "cover", objectPosition: "center 35%" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "repeating-linear-gradient(135deg,rgba(35,16,58,0.06) 0 10px,rgba(35,16,58,0) 10px 20px)", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, lineHeight: 1.5, color: "#5B1A7A" }}>{a.ph}</div>
          )}
        </div>
        <div className="lz-article" style={{ display: "grid", gap: "40px clamp(40px,6vw,100px)", marginTop: "clamp(48px,6vw,90px)", alignItems: "start" }}>
          <div style={{ minWidth: 0, maxWidth: 780, fontSize: "clamp(17px,1.3vw,19px)", lineHeight: 1.7, color: "#3d2a55" }}>
            {blocks.map((b, i) => {
              switch (b.kind) {
                case "h": return <h2 key={i} style={{ margin: "48px 0 14px", fontFamily: serif, fontWeight: 400, fontSize: "clamp(30px,3vw,44px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#23103a" }}>{b.text}</h2>;
                case "h3": return <h3 key={i} style={{ margin: "32px 0 10px", fontFamily: serif, fontWeight: 400, fontSize: "clamp(24px,2.2vw,30px)", lineHeight: 1.1, color: "#23103a" }}>{b.text}</h3>;
                case "p": return <p key={i} style={{ margin: "0 0 18px" }}>{b.text}</p>;
                case "ul": return <ul key={i} style={{ margin: "0 0 22px", paddingLeft: 22 }}>{b.items.map((t) => <li key={t} style={{ marginBottom: 8 }}>{t}</li>)}</ul>;
                case "ol": return <ol key={i} style={{ margin: "0 0 22px", paddingLeft: 22 }}>{b.items.map((t) => <li key={t} style={{ marginBottom: 8 }}>{t}</li>)}</ol>;
                case "tip":
                  return (
                    <aside key={i} aria-label={b.label ?? "Linzzy tip"} style={{ margin: "28px 0", padding: "24px 28px", background: soft, color: "#23103a" }}>
                      <p style={{ ...eyebrow(tone), marginBottom: 8 }}>{b.label ?? "Linzzy tip"}</p>
                      <p style={{ margin: 0 }}>{b.text}</p>
                    </aside>
                  );
              }
            })}
          </div>
          <aside className="lz-side" style={{ display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 100 }}>
            {a.says && (
              <div style={{ padding: 28, background: tone, color: "#fff" }}>
                <p style={eyebrow("#fff")}>Linzzy says</p>
                <p style={{ margin: "12px 0 0", fontFamily: serif, fontSize: "clamp(24px,2.2vw,32px)", lineHeight: 1.1 }}>{a.says}</p>
              </div>
            )}
            {a.community && (
              <div style={{ padding: 28, background: "#FFF1C9", color: "#23103a" }}>
                <p style={eyebrow("#5B1A7A")}>Community corner</p>
                <p style={{ margin: "12px 0 0", fontFamily: serif, fontSize: "clamp(22px,2vw,28px)", lineHeight: 1.15 }}>{a.community}</p>
                <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.5 }}><a href="/contact?topic=feedback#message" style={{ color: "#C2185B", textDecoration: "underline" }}>Contact Linzzy →</a></p>
              </div>
            )}
            {a.product && (
              <p style={{ margin: 0, padding: 28, background: soft, fontSize: 15, lineHeight: 1.5 }}>
                <a href={`/products?p=${encodeURIComponent(a.product.slug)}`} style={{ color: tone, fontWeight: 700, textDecoration: "underline" }}>See {a.product.name} →</a>
              </p>
            )}
            <p style={{ margin: 0, padding: 28, background: "#fff", fontSize: 14, lineHeight: 1.6, color: "#3d2a55" }}><strong style={{ display: "block", marginBottom: 6, color: "#23103a" }}>{a.notice.title}</strong>{a.notice.text}</p>
          </aside>
        </div>
      </section>

      <section id="more" data-chapter="Keep Reading" data-num="02" style={{ background: a.g === "fem" ? "#F4EEFF" : "#F3FBF7", padding: `clamp(70px,9vw,130px) ${pad}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <h2 data-reveal="1" style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: "clamp(40px,5vw,80px)", lineHeight: 0.95, letterSpacing: "-0.03em", color: "#23103a" }}>Keep <em style={{ color: tone }}>Reading</em></h2>
          <a href="/tips" className="lzt3" style={{ padding: "16px 0", borderBottom: "1.5px solid #23103a", color: "#23103a", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>All Tips &amp; Advice →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "48px clamp(20px,3vw,40px)", marginTop: "clamp(40px,5vw,70px)" }}>
          {reads.map((r) => (
            <article key={r.slug} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <a href={`/tips/${r.slug}`} aria-hidden="true" tabIndex={-1} style={{ display: "block", aspectRatio: "4/5", overflow: "hidden", background: soft }}>
                {r.img ? <img className="lzt6" src={r.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%", transition: "transform .8s" }} /> : <span style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, color: "#5B1A7A" }}>{r.ph}</span>}
              </a>
              <p style={eyebrow(tone)}>{r.topic}{r.minutes ? ` · ${r.minutes} min read` : ""}</p>
              <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: "clamp(24px,2vw,30px)", lineHeight: 1.1 }}><a href={`/tips/${r.slug}`} style={{ color: "#23103a" }}>{r.title}</a></h3>
            </article>
          ))}
        </div>
      </section>
    </ShellView>
  );
}
