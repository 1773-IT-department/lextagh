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
      const d = current();
      // Opened from a link (or a bookmark) with no opener on this page: go back to that product card's View details.
      const links = d ? Array.from(document.querySelectorAll<HTMLAnchorElement>(`a[href="#${d.id}"]`)).filter((a) => !a.closest("[data-product-dialog]") && a.tabIndex !== -1) : [];
      const fallback = links.find((a) => /View details/.test(a.textContent ?? "")) ?? links[0] ?? null;
      const target = opener && document.contains(opener) ? opener : fallback;
      history.replaceState(null, "", `${location.pathname}${location.search}#${closeHash}`);
      sync();
      target?.focus({ preventScroll: true });
      if (target && target !== opener) target.scrollIntoView({ block: "center" });
      opener = null;
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
    document.documentElement.setAttribute("data-dialogs-js", "");
    sync();
    window.addEventListener("hashchange", sync);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", sync);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.documentElement.removeAttribute("data-dialogs-js");
    };
  }, [closeHash]);
  return null;
}
