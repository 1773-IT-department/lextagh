"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import s from "./home.module.css";

type Cta = { label: string; href: string; ghost?: boolean };
type Slide = {
  eyebrow: string;
  title: string;
  highlight: string;
  titleSize: number;
  titleLeading: number;
  body: string;
  bodyMax: number;
  img: string;
  w: number;
  h: number;
  alt: string;
  focus: string;
  shade?: string;
  ctas: Cta[];
};

const SHADE = "linear-gradient(100deg,rgba(6,32,42,.9) 0%,rgba(6,32,42,.62) 45%,rgba(6,32,42,.16) 78%)";
const SLIDE_TRANSITION = "transform .85s cubic-bezier(.3,.7,.2,1)";
const INTERVAL = 6500; // prototype heroInterval default

const slides: Slide[] = [
  {
    eyebrow: "Lexta Ghana Limited", title: "Caring for your ", highlight: "everyday", titleSize: 58, titleLeading: 1.05,
    body: "Home care, personal care and food products made in Ghana for families across Africa.", bodyMax: 460,
    img: "/assets/hero-family-products.png", w: 1774, h: 887, alt: "Ghanaian family at home with Lexta and Yazz products", focus: "70% center",
    ctas: [{ label: "Explore our brands", href: "/our-brands" }],
  },
  {
    eyebrow: "Proudly Ghanaian since 2002", title: "Two decades on ", highlight: "Ghana's shelves", titleSize: 58, titleLeading: 1.05,
    body: "Founded in Accra and built here. What began as a home care supplier now serves millions of homes across the sub-region.", bodyMax: 470,
    img: "/assets/hero-25-years.png", w: 1774, h: 887, alt: "25 years of quality products in homes across Ghana and beyond", focus: "75% center",
    ctas: [{ label: "Our story", href: "/about-us" }],
  },
  {
    eyebrow: "Three brands, one standard", title: "Yazz. Hooch. ", highlight: "Linzzy.", titleSize: 54, titleLeading: 1.08,
    body: "From sanitary care and detergents to breakfast cereals and tissue, our brands cover the essentials families reach for every day.", bodyMax: 470,
    img: "/assets/hero-family-brands.png", w: 1536, h: 1024, alt: "Ghanaian family with Hooch Corn Flakes, Yazz and Linzzy products", focus: "78% center",
    shade: "linear-gradient(100deg,rgba(6,32,42,.96) 0%,rgba(6,32,42,.88) 45%,rgba(6,32,42,.42) 80%)",
    ctas: [{ label: "See the range", href: "/our-brands" }],
  },
  {
    eyebrow: "Made under our own roof", title: "What is care without ", highlight: "quality?", titleSize: 56, titleLeading: 1.06,
    body: "Our production lines run to international hygiene and regulatory standards, with every batch checked before it leaves us.", bodyMax: 470,
    img: "/assets/hero-factory.png", w: 1774, h: 887, alt: "Lexta production line in Ghana packing Yazz and Corn Flakes", focus: "78% center",
    ctas: [{ label: "Inside our operation", href: "/about-us" }],
  },
  {
    eyebrow: "Quality within reach", title: "Care shouldn't cost ", highlight: "the earth", titleSize: 56, titleLeading: 1.06,
    body: "We build our products to a standard, then price them for the households that need them. No trade-off.", bodyMax: 470,
    img: "/assets/hero-quality-value.png", w: 1536, h: 1024, alt: "Family with Hooch Corn Flakes, Yazz and Linzzy products in a Ghanaian kitchen", focus: "80% center",
    ctas: [{ label: "Find our products", href: "/our-brands" }],
  },
  {
    eyebrow: "Ghana. Liberia. Next.", title: "Built to ", highlight: "reach further", titleSize: 56, titleLeading: 1.06,
    body: "A distribution network spanning Ghana, a wholly owned subsidiary in Monrovia, and an expanding footprint across West Africa.", bodyMax: 470,
    img: "/assets/hero-west-africa.png", w: 1672, h: 941, alt: "Lexta distribution from Ghana across West Africa", focus: "80% center",
    ctas: [{ label: "Contact us", href: "/contact-us" }, { label: "Bulk and institutional orders", href: "/contact-us", ghost: true }],
  },
  {
    eyebrow: "Beyond the product", title: "Care that ", highlight: "leaves the shelf", titleSize: 56, titleLeading: 1.06,
    body: "Free cervical cancer screening with the Medical Women Association of Ghana. Menstrual health education in schools nationwide. Ongoing work against period poverty.", bodyMax: 490,
    img: "/assets/hero-cervical-screening.png", w: 1536, h: 1024, alt: "Lexta and MWAG cervical cancer awareness and screening outreach", focus: "78% center",
    ctas: [{ label: "Our CSR work", href: "/corporate-social-responsibility" }],
  },
];

const fill: CSSProperties = { position: "absolute", inset: 0 };
const ctaSolid: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 14, background: "#12a3c4", color: "#fff", fontSize: 14, fontWeight: 600,
  padding: "13px 13px 13px 24px", borderRadius: 8, boxShadow: "0 12px 26px rgba(4,30,40,.35)",
};
const ctaGhost: CSSProperties = {
  display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.45)",
  color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 22px", borderRadius: 8,
};
const ctaArrow: CSSProperties = {
  width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 13,
};
const arrowBtn: CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)", width: 42, height: 42, borderRadius: "50%",
  border: "1px solid rgba(255,255,255,.4)", background: "rgba(8,42,55,.35)", color: "#fff", fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 8,
};
const dotStyle: CSSProperties = { width: 26, height: 5, borderRadius: 3, border: 0, cursor: "pointer", padding: 0 };

/** Home hero: seven auto-advancing slides, arrows and dots. Behaviour ported 1:1 from the prototype script. */
export default function HeroSlider() {
  const root = useRef<HTMLElement>(null);
  const api = useRef<{ go: (n: number, dir?: number) => void; reset: () => void; index: () => number } | null>(null);

  useEffect(() => {
    const hero = root.current;
    if (!hero) return;
    const els = Array.from(hero.querySelectorAll<HTMLElement>("[data-slide]"));
    const dots = Array.from(hero.querySelectorAll<HTMLElement>("[data-dot]"));
    let i = 0;
    const go = (n: number, dir?: number) => {
      const from = i;
      i = (n + els.length) % els.length;
      const d = dir === undefined ? (i === (from + 1) % els.length ? 1 : -1) : dir;
      els.forEach((el, k) => {
        // Only the visible slide is reachable by keyboard and screen readers.
        el.inert = k !== i;
        if (k === i) el.removeAttribute("aria-hidden"); else el.setAttribute("aria-hidden", "true");
        if (k === i) {
          if (k !== from) {
            el.style.transition = "none";
            el.style.transform = `translateX(${d > 0 ? "100%" : "-100%"})`;
            void el.offsetWidth;
            el.style.transition = SLIDE_TRANSITION;
          }
          el.style.transform = "translateX(0)";
          el.style.pointerEvents = "";
          el.style.zIndex = "3";
          const t = el.querySelector<HTMLElement>("[data-slide-text]");
          if (t) { t.style.animation = "none"; void t.offsetWidth; t.style.animation = "lxrise .8s cubic-bezier(.2,.7,.2,1) both"; }
        } else if (k === from) {
          el.style.transition = SLIDE_TRANSITION;
          el.style.transform = `translateX(${d > 0 ? "-100%" : "100%"})`;
          el.style.pointerEvents = "none";
          el.style.zIndex = "2";
        } else {
          el.style.transition = "none";
          el.style.transform = "translateX(100%)";
          el.style.pointerEvents = "none";
          el.style.zIndex = "1";
        }
      });
      dots.forEach((dot, k) => { dot.style.background = k === i ? "#12a3c4" : "rgba(255,255,255,.4)"; });
    };
    let timer = window.setInterval(() => go(i + 1, 1), INTERVAL);
    const reset = () => { window.clearInterval(timer); timer = window.setInterval(() => go(i + 1, 1), INTERVAL); };
    api.current = { go, reset, index: () => i };
    go(0);
    return () => { window.clearInterval(timer); api.current = null; };
  }, []);

  const step = (delta: number) => { const a = api.current; if (a) { a.go(a.index() + delta, delta); a.reset(); } };
  const jump = (k: number) => { const a = api.current; if (a) { a.go(k, k > a.index() ? 1 : -1); a.reset(); } };

  return (
    <section ref={root} data-screen-label="Hero" data-hero="1" style={{ position: "relative", background: "#0c303e", overflow: "hidden" }}>
      <div className={s.heroSpacer} />

      {slides.map((sl, k) => {
        const Title = k === 0 ? "h1" : "h2";
        return (
          <div key={k} data-slide={k} inert={k !== 0} aria-hidden={k !== 0 || undefined} style={{ ...fill, transform: k === 0 ? "translateX(0)" : "translateX(100%)", transition: SLIDE_TRANSITION }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sl.img} alt={sl.alt} width={sl.w} height={sl.h} style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", objectPosition: sl.focus, display: "block" }} />
            <div style={{ ...fill, background: sl.shade ?? SHADE, pointerEvents: "none" }} />
            <div style={{ ...fill, display: "flex", alignItems: "center", pointerEvents: "none" }}>
              <div className={s.heroInner}>
                <div data-slide-text="1" style={{ maxWidth: 620 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>{sl.eyebrow}</div>
                  <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
                  <Title
                    className={s.heroTitle}
                    style={{ margin: "20px 0 0", fontSize: sl.titleSize, lineHeight: sl.titleLeading, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}
                  >
                    {sl.title}<span style={{ color: "#3fc0dd" }}>{sl.highlight}</span>
                  </Title>
                  <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,.9)", maxWidth: sl.bodyMax }}>{sl.body}</p>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28, pointerEvents: "auto" }}>
                    {sl.ctas.map((c) =>
                      c.ghost ? (
                        <Link key={c.label} href={c.href} style={ctaGhost}>{c.label}</Link>
                      ) : (
                        <Link key={c.label} href={c.href} style={ctaSolid}>
                          {c.label}
                          <span style={ctaArrow}>→</span>
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" data-hero-prev="1" aria-label="Previous slide" onClick={() => step(-1)} style={{ ...arrowBtn, left: 18 }}>‹</button>
      <button type="button" data-hero-next="1" aria-label="Next slide" onClick={() => step(1)} style={{ ...arrowBtn, right: 18 }}>›</button>

      <div data-hero-dots="1" style={{ position: "absolute", left: 0, right: 0, bottom: 132, display: "flex", justifyContent: "center", gap: 9, zIndex: 8 }}>
        {slides.map((_, k) => (
          <button
            key={k}
            type="button"
            data-dot={k}
            aria-label={`Slide ${k + 1}`}
            onClick={() => jump(k)}
            style={{ ...dotStyle, background: k === 0 ? "#12a3c4" : "rgba(255,255,255,.4)" }}
          />
        ))}
      </div>
    </section>
  );
}
