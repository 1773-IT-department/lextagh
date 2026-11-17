import Link from "next/link";
import type { CSSProperties } from "react";
import s from "@/components/news/article.module.css";

export type Crumb = { label: string; href?: string };

/**
 * A small "Home / Page" trail at the top of a page's dark hero, in the news article's breadcrumb style
 * (components/news/article.module.css). The last item is the current page.
 */
export default function Breadcrumbs({ items, style }: { items: Crumb[]; style?: CSSProperties }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 18, ...style }}>
      <ol className={s.crumbs}>
        {all.map((c, i) => (
          <li key={c.label}>
            {i === all.length - 1 ? <span aria-current="page">{c.label}</span> : <Link href={c.href ?? "/"}>{c.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
