import type { CSSProperties } from "react";

export type Crumb = { label: string; href?: string };

/**
 * A small "Home / Page" row at the top of a page's opening section, above its eyebrow. Linzzy has no breadcrumb style of
 * its own, so it takes the eyebrow's type at a quieter weight; plain links, so it never touches the scroll animations.
 */
export default function Breadcrumbs({ items, style }: { items: Crumb[]; style?: CSSProperties }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" style={{ margin: "0 0 18px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em", color: "#6b5a80", ...style }}>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
        {all.map((c, i) => (
          <li key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            {i > 0 && <span aria-hidden="true" style={{ color: "#b9a9cc" }}>/</span>}
            {i === all.length - 1
              ? <span aria-current="page" style={{ color: "#23103a" }}>{c.label}</span>
              : <a href={c.href ?? "/"} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>{c.label}</a>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
