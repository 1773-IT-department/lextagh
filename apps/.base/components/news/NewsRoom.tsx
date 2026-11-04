"use client";

import { useEffect, useState } from "react";
import { newsCategories } from "@/content/news/categories";
import type { CardArticle } from "@/content/news";
import NewsCard from "./NewsCard";
import s from "./news.module.css";

/** Same page size as the prototype (its storiesPerPage default). */
const PER_PAGE = 9;

type Cat = (typeof newsCategories)[number];
const isCat = (v: string | null): v is Cat => !!v && (newsCategories as readonly string[]).includes(v);

/**
 * "All stories": category chips, the card grid, "Load more stories" and the empty state, behaving exactly like
 * the prototype. A link like /news?category=Health (used by the article breadcrumb) opens with that chip selected.
 */
export default function NewsRoom({ articles }: { articles: CardArticle[] }) {
  const [cat, setCat] = useState<Cat>("All");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("category");
    if (isCat(q)) setCat(q);
  }, []);

  const filtered = cat === "All" ? articles : articles.filter((a) => a.category === cat);
  const limit = PER_PAGE + shown;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", borderBottom: "1px solid rgba(18,163,196,.2)", paddingBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>Newsroom</div>
          <h2 style={{ margin: "12px 0 0", fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d" }}>All stories</h2>
        </div>
        <div role="group" aria-label="Filter stories by category" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {newsCategories.map((label) => {
            const on = label === cat;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                className={s.chip}
                onClick={() => { setCat(label); setShown(0); }}
                style={{
                  border: `1px solid ${on ? "#12313d" : "rgba(18,163,196,.3)"}`, background: on ? "#12313d" : "#fff", color: on ? "#fff" : "#3f5f6b",
                  fontSize: 12, fontWeight: 600, padding: "9px 15px", borderRadius: 20, cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 26, marginTop: 34 }}>
        {filtered.slice(0, limit).map((a) => <NewsCard key={a.slug} article={a} />)}
      </div>

      {filtered.length > limit && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
          <button
            type="button"
            className={s.loadMore}
            onClick={() => setShown((n) => n + PER_PAGE)}
            style={{ border: "1px solid rgba(18,163,196,.45)", background: "#f7fcfe", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "13px 26px", borderRadius: 7, cursor: "pointer" }}
          >
            Load more stories
          </button>
        </div>
      )}
      {filtered.length === 0 && <p style={{ margin: "40px 0 0", fontSize: 14, color: "#5d7883" }}>No stories in this category yet.</p>}
    </>
  );
}
