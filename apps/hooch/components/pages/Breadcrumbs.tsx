import Link from "next/link";
import Icon from "@/components/Icon";
import s from "./pages.module.css";

/**
 * A small "Home > Page" row at the top of an inner page's hero, in the product and recipe pages' breadcrumb style
 * (pages.module.css .crumbs).
 */
export default function Breadcrumbs({ page }: { page: string }) {
  return (
    <nav className={s.crumbs} aria-label="Breadcrumb" style={{ marginBottom: 14 }}>
      <Link href="/">Home</Link> <Icon name="chevron-right" size={14} /> <span aria-current="page">{page}</span>
    </nav>
  );
}
