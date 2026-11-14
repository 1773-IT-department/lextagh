import type { Article } from "@/content/articles";
import s from "./tips.module.css";

type Block =
  | { kind: "h" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "tip"; label: string | null; text: string };

/** Parses the light article format of content/articles.ts (see its header). */
export function parseBody(body: string): Block[] {
  return body.trim().split(/\n\s*\n/).map((raw): Block => {
    const block = raw.trim();
    const lines = block.split("\n").map((l) => l.trim());
    if (block.startsWith("### ")) return { kind: "h3", text: block.slice(4).trim() };
    if (block.startsWith("## ")) return { kind: "h", text: block.slice(3).trim() };
    if (block.startsWith("> ")) {
      const parts = lines.map((l) => l.replace(/^>\s?/, ""));
      const label = /^\*\*(.+)\*\*$/.exec(parts[0])?.[1] ?? null;
      return { kind: "tip", label, text: (label ? parts.slice(1) : parts).join(" ") };
    }
    if (lines.every((l) => l.startsWith("- "))) return { kind: "ul", items: lines.map((l) => l.slice(2)) };
    if (lines.every((l) => /^\d+\.\s/.test(l))) return { kind: "ol", items: lines.map((l) => l.replace(/^\d+\.\s/, "")) };
    return { kind: "p", text: lines.join(" ") };
  });
}

/** The article text: headings, paragraphs, lists and the tip boxes. */
export default function ArticleBody({ article }: { article: Article }) {
  const blocks = parseBody(article.body);
  return (
    <div className={s.body}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h": return <h2 key={i}>{b.text}</h2>;
          case "h3": return <h3 key={i}>{b.text}</h3>;
          case "p": return <p key={i}>{b.text}</p>;
          case "ul": return <ul key={i}>{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
          case "ol": return <ol key={i}>{b.items.map((t) => <li key={t}>{t}</li>)}</ol>;
          case "tip":
            return (
              <aside key={i} className={s.tip} aria-label={b.label ?? "Linzzy tip"}>
                <p className={s.tipLabel}>{b.label ?? "Linzzy tip"}</p>
                <p>{b.text}</p>
              </aside>
            );
        }
      })}
    </div>
  );
}
