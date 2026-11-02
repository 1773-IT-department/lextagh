"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Impact counter: counts from 0 to `target` (1.5s ease-out) when it scrolls into view,
 * with the prototype's 4s fallback so it never stays on 0.
 */
export default function CountUp({ target, suffix, style }: { target: number; suffix: string; style?: CSSProperties }) {
  const el = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
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
    if (!("IntersectionObserver" in window)) { run(); return; }
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
