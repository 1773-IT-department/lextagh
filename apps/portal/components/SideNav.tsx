"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

/** The label of a menu link, marked while the page it opens is loading (the click answers at once). */
function NavLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {label}
      <span className={`nav-pending${pending ? " on" : ""}`} aria-hidden="true" />
    </>
  );
}

export default function SideNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // The most specific item that matches is the current one (so "New order" wins over "My orders" on /systems/orders/new).
  const matches = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const current = items.filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Systems">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.href === current ? "page" : undefined}><NavLabel label={i.label} /></Link>
      ))}
    </nav>
  );
}
