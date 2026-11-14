"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import MotionToggle from "@/components/motion/MotionToggle";
import { NAV } from "@/lib/nav";
import s from "./header.module.css";

/**
 * Header: the Hooch mark, Lexta's six tabs and a red "Where to Buy" pill (no shop or cart, by contract). Phones get a
 * menu button and a panel built on <details>, which also opens without JavaScript. The bar sits on a sunny strip with
 * a wavy bottom edge; the logo does a little hop on hover.
 */
export default function SiteHeader() {
  const path = usePathname() ?? "/";
  const mobile = useRef<HTMLDetailsElement>(null);
  const is = (p: string) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`));

  useEffect(() => { if (mobile.current) mobile.current.open = false; }, [path]);
  const closeMobile = () => { if (mobile.current) mobile.current.open = false; };

  return (
    <header className={s.header}>
      <Link href="/" className={s.brand} aria-label="Hooch home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hooch-logo.webp" alt="" width={151} height={69} className={`hc-logo ${s.logo}`} />
      </Link>

      <nav className={s.nav} aria-label="Main">
        {NAV.map((l) => (
          <Link key={l.href} href={l.href} className={s.link} aria-current={is(l.href) ? "page" : undefined}>{l.label}</Link>
        ))}
      </nav>

      <div className={s.actions}>
        <MotionToggle compact className={s.motion} />
        <Link href="/contact#where-to-buy" className={`hc-btn hc-btn--red hc-btn--sm ${s.cta}`}>
          <Icon name="pin" size={17} /> Where to Buy
        </Link>
        <details ref={mobile} className={s.mobile} onKeyDown={(e) => { if (e.key === "Escape" && mobile.current?.open) { mobile.current.open = false; mobile.current.querySelector("summary")?.focus(); } }}>
          <summary className={s.burger} aria-label="Menu">
            <Icon name="menu" size={24} className={s.burgerOpen} />
            <Icon name="close" size={24} className={s.burgerClose} />
          </summary>
          <nav className={s.sheet} aria-label="Mobile" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) closeMobile(); }}>
            {NAV.map((l, i) => (
              <Link key={l.href} href={l.href} className={s.sheetLink} aria-current={is(l.href) ? "page" : undefined} style={{ animationDelay: `${i * 40}ms` }}>
                <span className={s.sheetIcon}>{l.icon && <Icon name={l.icon} size={20} />}</span> {l.label}
              </Link>
            ))}
            <Link href="/contact#where-to-buy" className="hc-btn hc-btn--red" style={{ marginTop: 16 }}>
              <Icon name="pin" size={17} /> Find a stockist
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
