"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Systems">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={pathname === i.href ? "page" : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
