"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // The most specific item that matches is the current one (so "New order" wins over "My orders" on /systems/orders/new).
  const matches = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const current = items.filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Systems">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.href === current ? "page" : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
