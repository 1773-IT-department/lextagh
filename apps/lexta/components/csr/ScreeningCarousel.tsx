"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/** Cervical cancer stories, linked to the Yazz site exactly as the prototype links them. */
const stories = [
  {
    href: "/news/cervical-cancer-awareness-launch-2024-tamale",
    img: "https://yazzproducts.com/wp-content/uploads/2024/02/WhatsApp-Image-2024-01-16-at-21.50.17-1021x1024.jpeg",
    title: "Cervical Cancer Awareness Launch 2024, Tamale",
    alt: "Cervical Cancer Awareness Launch 2024, Tamale",
    text: "The first time the national launch was held in the northern sector, hosted at the forecourt of Tamale Teaching Hospital with school children, women's groups, apprentices and the public, followed by free screening at the hospital's gynaecology clinic.",
  },
  {
    href: "/news/cervical-cancer-awareness-at-tuesday-market-park-mamprobi",
    img: "https://yazzproducts.com/wp-content/uploads/2025/03/WE6A0601-1024x683.jpg",
    title: "Tuesday Market Park, Mamprobi, 2025",
    alt: "Tuesday Market Park, Mamprobi, 2025",
    text: "Taking screening and education into the market, where the women who most need it already are.",
  },
  {
    href: "/news/ghanaian-women-doctors-encourage-screening-for-early-detection",
    img: "https://yazzproducts.com/wp-content/uploads/2025/04/130202594139-vaqdtgfssn-health-cervical-cancer1.jpg",
    title: "Ghanaian women doctors encourage screening for early detection",
    alt: "Ghanaian women doctors encourage screening",
    text: "MWAG's Cervical Cancer Awareness Month launch in Ablekuma South, sponsored by Lexta, under the theme “We Can Prevent Cervical Cancer, Get Screened Now.”",
  },
  {
    href: "/news/free-public-cervical-cancer-screening-with-sofpog-mwag-and-korle-bu-polyclinic",
    img: "https://yazzproducts.com/wp-content/uploads/2026/02/yazz-crvical-cancer-awareness-2026.png",
    title: "SOFPOG, MWAG, Yazz and Korle Bu Polyclinic",
    alt: "SOFPOG, MWAG, Yazz and Korle Bu Polyclinic",
    text: "Free public screening during Cervical Cancer Awareness Month, with education on HPV, vaccination and the warning signs that should never be ignored.",
  },
  {
    href: "/news/free-cervical-cancer-screening-and-education-in-kumasi",
    img: "https://yazzproducts.com/wp-content/uploads/2026/05/WhatsApp-Image-2020-01-19-at-8.42.06-AM-1080x675-1-1024x640.jpeg",
    title: "Free screening in Kumasi",
    alt: "Free screening in Kumasi",
    text: "Education and free screening in Kumasi, ahead of the Accra edition at Accra Psychiatric Hospital.",
  },
];

const GAP = 20;
const PER = 3;
const SPEED = 0.035; // px per ms, as in the prototype

const card: CSSProperties = {
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, overflow: "hidden",
  display: "flex", flexDirection: "column", color: "#fff",
  // Three cards per view at every width, as the prototype sized them.
  flex: "0 0 auto", width: `calc((100% - ${GAP * (PER - 1)}px) / ${PER})`,
};

/**
 * Port of the prototype's cervical cancer story strip: the five cards plus a copy of them scroll left
 * continuously and loop, pausing while the pointer or keyboard focus is on the strip, and staying still for visitors who ask for reduced motion.
 */
export default function ScreeningCarousel() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const t = track.current;
    if (!w || !t) return;
    let x = 0;
    let last = 0;
    let hovered = false;
    let focused = false;
    let raf = 0;
    // Respect the visitor's reduced motion setting: the strip stays still and can be scrolled by focus.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => {
      w.style.overflowX = reduce.matches ? "auto" : "hidden";
      if (reduce.matches) { x = 0; t.style.transform = "translateX(0px)"; }
    };
    applyMotionPref();
    reduce.addEventListener("change", applyMotionPref);
    const span = () => {
      const cardW = (w.clientWidth - GAP * (PER - 1)) / PER;
      return stories.length * (cardW + GAP);
    };
    const step = (time: number) => {
      if (!last) last = time;
      const dt = Math.min(time - last, 60);
      last = time;
      if (!hovered && !focused && !reduce.matches) {
        x -= dt * SPEED;
        const s = span();
        if (-x >= s) x += s;
        t.style.transform = `translateX(${x}px)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = false; };
    const onFocusIn = () => { focused = true; };
    const onFocusOut = (e: FocusEvent) => {
      if (!w.contains(e.relatedTarget as Node | null)) focused = false;
    };
    const onResize = () => { x = 0; t.style.transform = "translateX(0px)"; };
    w.addEventListener("mouseenter", onEnter);
    w.addEventListener("mouseleave", onLeave);
    w.addEventListener("focusin", onFocusIn);
    w.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      reduce.removeEventListener("change", applyMotionPref);
      w.removeEventListener("mouseenter", onEnter);
      w.removeEventListener("mouseleave", onLeave);
      w.removeEventListener("focusin", onFocusIn);
      w.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={wrap} data-carousel="1" style={{ position: "relative", overflow: "hidden", marginTop: 46 }}>
      <div ref={track} data-track="1" style={{ display: "flex", gap: GAP, alignItems: "stretch", willChange: "transform" }}>
        {[0, 1].map((copy) =>
          stories.map((s) => (
            // The second copy only makes the loop seamless: hidden from screen readers and keyboard.
            <a key={`${copy}-${s.href}`} href={s.href} style={card} aria-hidden={copy ? true : undefined} tabIndex={copy ? -1 : undefined}>
              <div style={{ height: 180, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={copy ? "" : s.alt} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{s.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.8)" }}>{s.text}</p>
                <span style={{ marginTop: "auto", paddingTop: 16, fontSize: 12, fontWeight: 600, color: "#3fc0dd" }}>Read more <span aria-hidden="true">→</span></span>
              </div>
            </a>
          )),
        )}
      </div>
    </div>
  );
}
