"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

// useLayoutEffect warns during server rendering; it only matters in the browser.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Impact counter. The server HTML (and visitors without JavaScript, and crawlers) get the final figure.
 * In the browser it behaves like the prototype: a counter that starts below the fold is reset to 0 and
 * counts up (1.5s ease-out) when it scrolls into view, with the prototype's 4s fallback so it never stays on 0.
 */
export default function CountUp({ target, suffix, style }: { target: number; suffix: string; style?: CSSProperties }) {
  const el = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(target);

  useBrowserLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    let started = false;
    let raf = 0;
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1500);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) return; // keep the final figure
    setValue(0);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    const r = node.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) run(); else io.observe(node);
    const fallback = window.setTimeout(run, 4000);
    return () => { io.disconnect(); window.clearTimeout(fallback); cancelAnimationFrame(raf); };
  }, [target]);

  return <div ref={el} style={style}>{`${value}${suffix}`}</div>;
}
