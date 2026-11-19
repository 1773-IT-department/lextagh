"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { scrollToId, useLinzzyScroll } from "./scroll";

// What every prototype page shares: the menu (open/close), the chapter label at the bottom left, the page links of the
// menu (the current page in pink) and the click helper of the prototype.

export const FEM = { tone: "#C2185B", soft: "#EFE6FF", cat: "Feminine Care" };
export const BABY = { tone: "#0E7A5B", soft: "#DDF7EC", cat: "Baby Care" };
export const tone = (g: "fem" | "baby") => (g === "fem" ? FEM : BABY);

/** The menu's page links, in Desmond's order (19 Nov 2026): Home, About Us, Products, then the rest. */
export const PAGES: [string, string][] = [
  ["/", "Home"],
  ["/about", "About Us"],
  ["/products", "Products"],
  ["/tips", "Tips & Advice"],
  ["/faqs", "FAQs"],
  ["/contact", "Contact & Where to Buy"],
];

/** The prototype's h(): a click handler that does not follow the link's "#". */
export const h = (fn: () => void) => (e?: MouseEvent | { preventDefault?: () => void }) => {
  if (e && e.preventDefault) e.preventDefault();
  fn();
};

export function useChrome(here: string, firstChapter: string, opts: { hashOffset?: number } = {}) {
  const [menu, setMenu] = useState(false);
  const [ch, setCh] = useState({ num: "00", name: firstChapter });
  useLinzzyScroll((num, name) => setCh({ num, name }), opts);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);
  const jumpTo = (id: string, offset?: number) => { setMenu(false); scrollToId(id, offset === undefined ? {} : { offset }); };
  return {
    menu,
    setMenu,
    jumpTo,
    base: {
      menuOpen: menu,
      menuLabel: menu ? "Close" : "Menu",
      toggleMenu: () => setMenu((m) => !m),
      chapterNum: ch.num,
      chapterName: ch.name,
      pages: PAGES.map(([href, label]) => {
        const [path, hash] = href.split("#");
        const on = path === here;
        // A link to a band of the page you are on: close the menu and scroll there.
        const go = on && hash ? h(() => jumpTo(hash)) : undefined;
        return { href, label, go, c: on ? "#F48FB1" : "#fff", current: on ? ("page" as const) : undefined };
      }),
    },
    chapters: (list: [string, string, string][]) => list.map(([id, num, name]) => ({ num, name, href: `#${id}`, go: h(() => jumpTo(id)) })),
  };
}
