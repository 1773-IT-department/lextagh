import { TIP_LABEL, type Article } from "@/content/articles";
import s from "./tips.module.css";

type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "tip"; text: string };

/** Parses the light article format of content/articles.ts (see its header). */
export function parseBody(body: string): Block[] {
  return body.trim().split(/\n\s*\n/).map((raw) => {
    const block = raw.trim();
    const lines = block.split("\n").map((l) => l.trim());
    if (block.startsWith("## ")) return { kind: "h", text: block.slice(3).trim() };
    if (block.startsWith("> ")) return { kind: "tip", text: lines.map((l) => l.replace(/^>\s?/, "")).join(" ") };
    if (lines.every((l) => l.startsWith("- "))) return { kind: "ul", items: lines.map((l) => l.slice(2)) };
    if (lines.every((l) => /^\d+\.\s/.test(l))) return { kind: "ol", items: lines.map((l) => l.replace(/^\d+\.\s/, "")) };
    return { kind: "p", text: lines.join(" ") };
  });
}

/** The article text: headings, paragraphs, lists and the coloured Yazz tip box. */
export default function ArticleBody({ article }: { article: Article }) {
  return <BodyText body={article.body} tipLabel={TIP_LABEL[article.category]} />;
}

/** Text in the article body format, outside an article too (the Tips page's intros and closings). */
export function BodyText({ body, tipLabel = "Yazz® Tip", className = s.body }: { body: string; tipLabel?: string; className?: string }) {
  const blocks = parseBody(body);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h": return <h2 key={i}>{b.text}</h2>;
          case "p": return <p key={i}>{b.text}</p>;
          case "ul": return <ul key={i}>{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
          case "ol": return <ol key={i}>{b.items.map((t) => <li key={t}>{t}</li>)}</ol>;
          case "tip":
            return (
              <aside key={i} className={s.tip} aria-label={tipLabel}>
                <p className={`yz-script ${s.tipLabel}`}>{tipLabel}</p>
                <p>{b.text}</p>
              </aside>
            );
        }
      })}
    </div>
  );
}
