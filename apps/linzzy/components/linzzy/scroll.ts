"use client";

import { useEffect, useRef } from "react";

// The prototype's scroll engine (linzzy-scroll.js), as a hook. Every frame it reads the page and sets:
//   [data-pin]      --p, the progress (0 to 1) through a tall pinned section; moves its [data-track] sideways and
//                   fades in its [data-w] words one by one
//   [data-reveal]   --r, how far the element has come into view
//   [data-speed]    parallax (vertical), [data-xspeed] parallax (sideways), [data-marquee] endless sliding rows
//   [data-progress] the reading bar width, and the current [data-chapter] for the chapter label
// The styles that use --p and --r are the prototype's own inline styles. With reduced motion the values jump to their
// end state, so nothing is hidden and nothing moves (a sideways track becomes a row you can scroll).

const cl = (v: number) => Math.min(1, Math.max(0, v));

type PinEl = HTMLElement & { _p?: number; _vw?: number };

function reducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

function tick(state: { num: string | null; cb?: (num: string, name: string) => void }, still: boolean) {
  const vh = window.innerHeight, vw = window.innerWidth;
  document.querySelectorAll<PinEl>("[data-pin]").forEach((el) => {
    const r = el.getBoundingClientRect();
    const p = still ? 1 : cl(-r.top / Math.max(1, r.height - vh));
    if (el._p === p && el._vw === vw) return;
    el._p = p; el._vw = vw;
    el.style.setProperty("--p", p.toFixed(4));
    const tr = el.querySelector<HTMLElement>("[data-track]");
    if (tr && still) { tr.style.transform = "none"; if (tr.parentElement) tr.parentElement.style.overflowX = "auto"; }
    else if (tr) { const d = Math.max(0, tr.scrollWidth - vw); tr.style.transform = "translate3d(" + (-p * d).toFixed(1) + "px,0,0)"; }
    const ws = el.querySelectorAll<HTMLElement>("[data-w]");
    if (ws.length) { const k = p * 1.3 * ws.length; ws.forEach((w, i) => { w.style.opacity = Math.max(0.12, cl(k - i)).toFixed(3); }); }
  });
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--r", still ? "1" : cl((vh * 0.95 - r.top) / (vh * 0.4)).toFixed(3));
  });
  if (!still) {
    document.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
      const r = el.parentElement!.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (-c * parseFloat(el.dataset.speed || "0")).toFixed(1) + "px,0)";
    });
    document.querySelectorAll<HTMLElement>("[data-xspeed]").forEach((el) => {
      const r = el.parentElement!.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(" + (c * parseFloat(el.dataset.xspeed || "0")).toFixed(1) + "px,0,0)";
    });
    const now = performance.now();
    document.querySelectorAll<HTMLElement>("[data-marquee]").forEach((el) => {
      const half = el.scrollWidth / 2;
      if (!half) return;
      const x = (now * 0.04 + window.scrollY * 0.15) % half;
      el.style.transform = "translate3d(" + (parseFloat(el.dataset.marquee || "1") > 0 ? -x : x - half).toFixed(1) + "px,0,0)";
    });
  }
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  if (bar) { const h = document.documentElement.scrollHeight - vh; bar.style.width = (h > 0 ? cl(window.scrollY / h) * 100 : 0).toFixed(2) + "%"; }
  let cur: HTMLElement | null = null;
  document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => { if (el.getBoundingClientRect().top <= vh * 0.5) cur = el; });
  const c = cur as HTMLElement | null;
  if (c && c.dataset.num !== state.num) { state.num = c.dataset.num ?? null; state.cb?.(c.dataset.num ?? "", c.dataset.chapter ?? ""); }
}

/** Scrolls to a section. Pinned sections (and the home page, offset 0) start at their top; others leave room for the header. */
export function scrollToId(id: string, opts: { smooth?: boolean; offset?: number } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = opts.offset ?? (el.dataset.pin ? 0 : 70);
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: opts.smooth === false || reducedMotion() ? "auto" : "smooth" });
}

/** Runs the scroll engine while the page is mounted; onChapter gets the chapter number and name in view. */
export function useLinzzyScroll(onChapter: (num: string, name: string) => void, opts: { hashOffset?: number } = {}) {
  const cb = useRef(onChapter);
  cb.current = onChapter;
  useEffect(() => {
    const still = reducedMotion();
    const state: { num: string | null; cb: (n: string, m: string) => void } = { num: null, cb: (n, m) => cb.current(n, m) };
    let raf = 0;
    const loop = () => { tick(state, still); raf = requestAnimationFrame(loop); };
    const on = () => tick(state, still);
    if (still) on(); else raf = requestAnimationFrame(loop);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    const t1 = window.setTimeout(on, 50);
    let hash = "";
    try { hash = decodeURIComponent((location.hash || "").slice(1)); } catch { /* bad hash */ }
    const t2 = hash ? window.setTimeout(() => scrollToId(hash, { smooth: false, offset: opts.hashOffset }), 400) : 0;
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
}
