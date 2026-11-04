"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

// useLayoutEffect warns during server rendering; it only matters in the browser.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const srOnly: CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
};

/**
 * Impact counter. The server HTML (and visitors without JavaScript, and crawlers) get the final figure.
 * In the browser it behaves like the prototype: a counter that starts below the fold is reset to 0 and
 * counts up once (1.5s ease-out) when it scrolls into view, with the prototype's 4s fallback so it never stays on 0.
 * Visitors who ask for reduced motion get the final figure straight away. Screen readers always read the
 * final figure (the animated digits are hidden from them), so nobody hears "0+".
 */
export default function CountUp({ target, suffix, style }: { target: number; suffix: string; style?: CSSProperties }) {
  const el = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(target);

  useBrowserLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) return; // keep the final figure
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; // keep the final figure
    let started = false;
    let raf = 0;
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1500);
        setValue(p >= 1 ? target : Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    setValue(0);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    const r = node.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) run(); else io.observe(node);
    const fallback = window.setTimeout(run, 4000);
    return () => {
      io.disconnect(); window.clearTimeout(fallback); cancelAnimationFrame(raf);
      // A cancelled run (unmount, fast refresh) must not leave a part-counted number behind.
      setValue(target);
    };
  }, [target]);

  return (
    <div ref={el} data-countup={`${target}${suffix}`} style={style}>
      <span aria-hidden="true">{`${value}${suffix}`}</span>
      <span style={srOnly}>{`${target}${suffix}`}</span>
    </div>
  );
}
