import Link from "next/link";
import Icon from "@/components/Icon";
import s from "@/components/tips/tips.module.css";

export type Crumb = { label: string; href?: string };

/**
 * A small "Home > Page" row above a page's hero, in the article pages' breadcrumb style (tips.module.css .crumbs).
 * The last item is the current page.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav className={s.crumbs} aria-label="Breadcrumb">
      {all.map((c, i) => i === all.length - 1
        ? <span key={c.label} aria-current="page">{c.label}</span>
        : <span key={c.label} style={{ display: "contents" }}><Link href={c.href ?? "/"}>{c.label}</Link><Icon name="chevron-right" size={14} /></span>)}
    </nav>
  );
}
