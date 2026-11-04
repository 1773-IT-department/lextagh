import Link from "next/link";
import type { CSSProperties } from "react";
import type { CardArticle } from "@/content/news";
import s from "./news.module.css";

const card: CSSProperties = {
  display: "flex", flexDirection: "column", border: "1px solid rgba(18,163,196,.18)", borderRadius: 14, overflow: "hidden",
  background: "#fff", color: "#12313d", boxShadow: "0 12px 28px rgba(11,60,78,.07)", transition: "box-shadow .25s,transform .25s",
};
const meta: CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

/** News card, ported 1:1 from the prototype's articles grid. Used on /news and under every article ("More stories"). */
export default function NewsCard({ article: a }: { article: CardArticle }) {
  return (
    <Link href={`/news/${a.slug}`} className={s.card} style={card}>
      <div style={{ height: 190, overflow: "hidden", background: "#eef7fa" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image} alt={a.title} loading="lazy" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ padding: "22px 22px 26px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={meta}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" }}>{a.category}</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#b7cdd6" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8fa8b2" }}>{a.date}</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 17, lineHeight: 1.32, fontWeight: 700, letterSpacing: "-.015em", color: "#12313d", textWrap: "pretty" }}>{a.title}</div>
        <p style={{ margin: "11px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883", textWrap: "pretty" }}>{a.excerpt}</p>
        <span style={{ marginTop: "auto", paddingTop: 18, fontSize: 12, fontWeight: 600, color: "#12a3c4" }}>Read more →</span>
      </div>
    </Link>
  );
}
