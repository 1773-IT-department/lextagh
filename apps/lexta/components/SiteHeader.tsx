"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerLinks, isCurrent } from "./site-links";

const linkBase = { fontSize: 13, fontWeight: 500, color: "#1d3c48" } as const;
const linkActive = { fontSize: 13, fontWeight: 600, color: "#12a3c4", boxShadow: "0 8px 0 -6px #12a3c4" } as const;

/** Desktop header, ported 1:1 from the prototype. Hidden under 900px by globals.css (mobile bar takes over). */
export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header
      data-nav="1"
      style={{ position: "sticky", top: 0, zIndex: 60, background: "#fff", boxShadow: "0 1px 0 rgba(10,55,70,.08)" }}
    >
      <div
        style={{
          maxWidth: 1240, margin: "0 auto", padding: "12px 28px", display: "grid",
          gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 24,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/lexta-logo.png" alt="Lexta" style={{ height: 44, width: "auto", display: "block" }} />
        </Link>
        <nav
          aria-label="Main"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "nowrap", minWidth: 0 }}
        >
          {headerLinks.map((l) => {
            const current = isCurrent(l.href, pathname);
            return (
              <Link key={l.href} href={l.href} style={current ? linkActive : linkBase} aria-current={current ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto", justifySelf: "end" }}>
          <Link href="/contact-us" className="lx-btn-solid">Contact Us</Link>
          <Link href="/partner-with-us" className="lx-btn-outline" data-partner="1">Partner With Us</Link>
        </div>
      </div>
    </header>
  );
}
