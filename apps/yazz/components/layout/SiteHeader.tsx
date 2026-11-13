"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import Icon from "@/components/Icon";
import { productLinks, tipsLinks, type NavLink } from "@/lib/nav";
import s from "./header.module.css";

/**
 * Header from the prototype: the tilted wordmark, the nav with the Products and Tips & Articles dropdowns, and a red
 * "Where to Buy" pill where the prototype had its cart and Shop Now (no shop, by contract).
 *
 * Dropdowns follow the disclosure pattern: the top link goes to the page, the chevron button next to it opens the list
 * (aria-expanded). Without JavaScript they open on hover and keyboard focus with CSS alone; once the page runs, the
 * open state is the component's alone (hover, the button, arrow keys), so Escape or a click outside closes the list even
 * while the pointer or focus is still there. Arrow keys move through an open list, Escape returns focus to the button.
 * Phones get a menu button and a panel built on <details>, which also opens without JavaScript.
 */
function Dropdown({ label, href, links, active }: { label: string; href: string; links: NavLink[]; active: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const items = () => Array.from(wrap.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-item]") ?? []);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "Escape") {
      if (open || i >= 0) { e.preventDefault(); setOpen(false); button.current?.focus(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      flushSync(() => setOpen(true));
      items()[i < 0 ? 0 : Math.min(i + 1, list.length - 1)]?.focus();
    } else if (e.key === "ArrowUp" && i >= 0) {
      e.preventDefault();
      (i === 0 ? button.current : list[i - 1])?.focus();
    } else if ((e.key === "Home" || e.key === "End") && i >= 0) {
      e.preventDefault();
      list[e.key === "Home" ? 0 : list.length - 1]?.focus();
    }
  };

  return (
    <div
      ref={wrap}
      className={s.drop}
      data-open={open ? "" : undefined}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
    >
      <Link href={href} className={s.link} aria-current={active ? "page" : undefined}>{label}</Link>
      <button
        ref={button}
        type="button"
        className={s.caret}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label} menu`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="chevron-down" size={16} />
      </button>
      <div className={s.panelWrap}>
        <ul id={id} className={s.panel}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} data-menu-item="" className={s.item} onClick={() => setOpen(false)}>
                {l.icon && <Icon name={l.icon} size={16} />} {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const path = usePathname() ?? "/";
  const mobile = useRef<HTMLDetailsElement>(null);
  const is = (p: string) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`));

  // Close the phone menu after navigating, and from any of its links (some keep the same path: a query or a hash).
  useEffect(() => { if (mobile.current) mobile.current.open = false; }, [path]);
  const closeMobile = () => { if (mobile.current) mobile.current.open = false; };
  // The CSS lets JavaScript drive the dropdowns from here on (header.module.css).
  useEffect(() => { document.documentElement.setAttribute("data-js", ""); }, []);

  const top = (href: string, label: string) => (
    <Link href={href} className={s.link} aria-current={is(href) ? "page" : undefined}>{label}</Link>
  );

  return (
    <header className={s.header}>
      <Link href="/" className={s.brand} aria-label="Yazz home">
        <span className="yz-logo"><span style={{ fontSize: 38 }}>Yazz</span></span>
      </Link>

      <nav className={s.nav} aria-label="Main">
        {top("/", "Home")}
        <Dropdown label="Products" href="/products" links={productLinks} active={is("/products")} />
        {top("/about", "About Us")}
        <Dropdown label="Tips & Articles" href="/tips" links={tipsLinks} active={is("/tips")} />
        {top("/contact", "Contact")}
      </nav>

      <div className={s.actions}>
        <Link href="/contact#where-to-buy" className={`yz-btn yz-btn--red ${s.cta}`}>
          <Icon name="pin" size={17} /> Where to Buy
        </Link>
        <details ref={mobile} className={s.mobile} onKeyDown={(e) => { if (e.key === "Escape" && mobile.current?.open) { mobile.current.open = false; mobile.current.querySelector("summary")?.focus(); } }}>
          <summary className={s.burger} aria-label="Menu">
            <Icon name="menu" size={24} className={s.burgerOpen} />
            <Icon name="close" size={24} className={s.burgerClose} />
          </summary>
          <nav className={s.sheet} aria-label="Mobile" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) closeMobile(); }}>
            <Link href="/" className={s.sheetLink} aria-current={is("/") ? "page" : undefined}>Home</Link>
            <div className={s.sheetGroup}>
              <Link href="/products" className={s.sheetLink} aria-current={path === "/products" ? "page" : undefined}>Products</Link>
              {productLinks.slice(1).map((l) => (
                <Link key={l.href} href={l.href} className={s.sheetSub} aria-current={is(l.href) ? "page" : undefined}>
                  {l.icon && <Icon name={l.icon} size={16} />} {l.label}
                </Link>
              ))}
            </div>
            <Link href="/about" className={s.sheetLink} aria-current={is("/about") ? "page" : undefined}>About Us</Link>
            <div className={s.sheetGroup}>
              <Link href="/tips" className={s.sheetLink} aria-current={is("/tips") ? "page" : undefined}>Tips &amp; Articles</Link>
              {tipsLinks.slice(1).map((l) => (
                <Link key={l.href} href={l.href} className={s.sheetSub}>{l.icon && <Icon name={l.icon} size={16} />} {l.label}</Link>
              ))}
            </div>
            <Link href="/contact" className={s.sheetLink} aria-current={is("/contact") ? "page" : undefined}>Contact &amp; Where to Buy</Link>
            <Link href="/contact#where-to-buy" className="yz-btn yz-btn--red" style={{ marginTop: 14 }}>
              <Icon name="pin" size={17} /> Find a stockist
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
