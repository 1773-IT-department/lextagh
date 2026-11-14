"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const COLOURS = ["#f4a72b", "#ffd23f", "#e3232b", "#8fd0ff", "#ffe99a", "#ffffff"];

/**
 * The fun layer on every page: sprinkles of tiny flakes and stars burst from every tap or click (not on form fields),
 * and [data-reveal] blocks pop up as they scroll into view. Both stay off for visitors who prefer reduced motion
 * (the CSS shows everything). Purely decorative: nothing here is announced to screen readers.
 */
export default function Playground() {
  const path = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("hc-js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onDown = (e: PointerEvent) => {
      if (reduce.matches || e.button !== 0) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable], .leaflet-container, [data-no-sprinkle]")) return;
      for (let i = 0; i < 9; i++) {
        const el = document.createElement("span");
        el.className = "hc-sprinkle";
        if (i % 3 === 0) el.dataset.star = "";
        const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
        const d = 34 + Math.random() * 46;
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        el.style.setProperty("--x", `${Math.cos(a) * d}px`);
        el.style.setProperty("--y", `${Math.sin(a) * d - 18}px`);
        el.style.setProperty("--r", `${(Math.random() - 0.5) * 540}deg`);
        el.style.setProperty("--c", COLOURS[i % COLOURS.length]);
        el.setAttribute("aria-hidden", "true");
        document.body.appendChild(el);
        window.setTimeout(() => el.remove(), 850);
      }
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  // Reveal on scroll; runs again after each navigation.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);

  return null;
}
