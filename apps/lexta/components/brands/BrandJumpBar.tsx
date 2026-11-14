"use client";

import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";

const brands = [
  { id: "yazz", label: "Yazz" },
  { id: "linzzy", label: "Linzzy" },
  { id: "hooch", label: "Hooch" },
];

const pill: CSSProperties = {
  fontSize: 13, fontWeight: 600, color: "#12313d", padding: "7px 15px", border: "1px solid rgba(18,163,196,.3)", borderRadius: 999,
};

/**
 * Sticky "Jump to" bar. The pill of the brand section under the bar lights up while scrolling,
 * and the pills scroll smoothly to their section. Ported from the prototype script.
 */
export default function BrandJumpBar() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const secs = brands.map((b) => document.getElementById(b.id));
    const jumps = Array.from(bar.current?.querySelectorAll<HTMLAnchorElement>("[data-jump]") ?? []);
    let act = -2;
    let last: number | null = null;
    let raf = 0;
    const paint = () => {
      let best = -1;
      secs.forEach((s, i) => {
        if (!s) return;
        const r = s.getBoundingClientRect();
        if (r.top < 190 && r.bottom > 190) best = i;
      });
      if (best === act) return;
      act = best;
      jumps.forEach((a, i) => {
        const on = i === best;
        a.style.background = on ? "#12a3c4" : "transparent";
        a.style.color = on ? "#fff" : "#12313d";
        a.style.borderColor = on ? "#12a3c4" : "rgba(18,163,196,.3)";
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = Math.round(window.scrollY || 0);
      if (y === last) return;
      last = y;
      paint();
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const jump = (id: string) => (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = document.getElementById(id);
    if (!t) return;
    ev.preventDefault();
    window.scrollTo({ top: (window.scrollY || 0) + t.getBoundingClientRect().top - 130, behavior: "smooth" });
  };

  return (
    <div
      ref={bar}
      data-brandbar="1"
      style={{
        position: "sticky", top: 74, zIndex: 40, background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(18,163,196,.16)",
      }}
    >
      <nav aria-label="Jump to a brand" style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 28px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#93a9b1", marginRight: 6 }}>Jump to</span>
        {brands.map((b) => (
          <a key={b.id} data-jump="1" href={`#${b.id}`} onClick={jump(b.id)} style={pill}>{b.label}</a>
        ))}
        <a href="#standard" style={{ fontSize: 13, fontWeight: 600, color: "#12a3c4", marginLeft: "auto" }}>What holds them together <span aria-hidden="true">→</span></a>
      </nav>
    </div>
  );
}
