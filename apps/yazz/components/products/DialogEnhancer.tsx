"use client";

import { useEffect } from "react";

/**
 * Makes the product windows (ProductDialog, shown by the #product-<slug> address) behave like dialogs once JavaScript
 * runs: the page behind stops scrolling, focus moves into the window and stays there, Escape or the close button
 * closes it without adding history, and focus goes back to the link that opened it.
 */
export default function DialogEnhancer({ closeHash }: { closeHash: string }) {
  useEffect(() => {
    let opener: HTMLElement | null = null;
    const current = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      return el?.hasAttribute("data-product-dialog") ? el : null;
    };
    const close = () => {
      history.replaceState(null, "", `${location.pathname}${location.search}#${closeHash}`);
      sync();
      opener?.focus({ preventScroll: true });
    };
    const sync = () => {
      const d = current();
      document.documentElement.style.overflow = d ? "hidden" : "";
      document.querySelectorAll<HTMLElement>("[data-product-dialog]").forEach((x) => x.toggleAttribute("data-open", x === d));
      if (d) requestAnimationFrame(() => d.querySelector<HTMLElement>("[data-dialog-close]")?.focus({ preventScroll: true }));
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (/#product-/.test(href) && !a.closest("[data-product-dialog]")) opener = a;
      if (a.hasAttribute("data-dialog-close") || (a.closest("[data-product-dialog]") && href === `#${closeHash}`)) {
        e.preventDefault();
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const d = current();
      if (!d) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = Array.from(d.querySelectorAll<HTMLElement>("a[href]:not([tabindex='-1']), button:not([disabled])"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    sync();
    window.addEventListener("hashchange", sync);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", sync);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [closeHash]);
  return null;
}
