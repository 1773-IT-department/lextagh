import Link from "next/link";
import type { ReactNode } from "react";
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

/** "[words](/path)" inside any block: an internal link (Lexta's red "read more" text). */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Only this site's own addresses become links; anything else keeps its words as plain text. */
export const isInternalHref = (href: string) => (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("#");

/** A block's text with its link tokens turned into links. */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(isInternalHref(m[2]) ? <Link key={at} href={m[2]} className={s.inlineLink}>{m[1]}</Link> : m[1]);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** "When Will My First Period Start?" to "when-will-my-first-period-start": the id of an article heading. */
export const headingId = (text: string) => text.toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
          case "h": return <h2 key={i} id={headingId(b.text)}>{inline(b.text)}</h2>;
          case "p": return <p key={i}>{inline(b.text)}</p>;
          case "ul": return <ul key={i}>{b.items.map((t) => <li key={t}>{inline(t)}</li>)}</ul>;
          case "ol": return <ol key={i}>{b.items.map((t) => <li key={t}>{inline(t)}</li>)}</ol>;
          case "tip":
            return (
              <aside key={i} className={s.tip} aria-label={tipLabel}>
                <p className={`yz-script ${s.tipLabel}`}>{tipLabel}</p>
                <p>{inline(b.text)}</p>
              </aside>
            );
        }
      })}
    </div>
  );
}
