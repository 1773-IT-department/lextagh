"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import ImageSlot from "@/components/ImageSlot";

type Milestone = {
  year: string;
  dot: string;
  eyebrow: string;
  title: string;
  text: string;
  photo: { placeholder: string; src: string; alt: string; w: number; h: number };
  imageFirst: boolean;
  link?: { label: string; href: string };
};

const milestones: Milestone[] = [
  {
    year: "1990s", dot: "Before Lexta", eyebrow: "Before Lexta: the UK years",
    title: "More than ten years abroad, and a reason to come back",
    text: "Martin Brobbey spent over a decade in the United Kingdom before returning to Ghana. He came home with one ambition: a cleaner, more hygienic Africa, served by quality consumer products that ordinary households could actually afford. That conviction is the reason Lexta exists.",
    photo: { placeholder: "Founder / early days photo", src: "/pasted-1788863343139-0-mtsj1pgq-1xnf.png", alt: "Speaker addressing an audience from a podium", w: 365, h: 547 },
    imageFirst: false,
  },
  {
    year: "2002", dot: "2002", eyebrow: "2002: The beginning",
    title: "Founded in Accra as a home care supplier",
    text: "Lexta Ghana Limited was established in Accra in 2002, starting out as a supplier of home care products. The early years were spent learning the market shop by shop, what families buy, at what price, and how often. That groundwork still shapes how we build products today.",
    photo: { placeholder: "First home care products photo", src: "/pasted-1788863387410-0-mtsj2nmh-7baf.png", alt: "Yazz team in branded shirts with a shop owner", w: 500, h: 562 },
    imageFirst: true,
  },
  {
    year: "2010", dot: "2010", eyebrow: "2010: Across the border",
    title: "Our first border crossing, into Monrovia",
    text: "Our wholly owned subsidiary in Monrovia, Liberia, has operated successfully since 2010. It proved the model travels: the same products, the same standard, served through people who know their own market. It remains the foundation of our wider ambitions for the sub-region.",
    photo: { placeholder: "Monrovia / Liberia operation photo", src: "/pasted-1788863416272-0-mtsj39w5-y1jr.png", alt: "Yazz branded truck with a team in red shirts", w: 640, h: 480 },
    imageFirst: false,
  },
  {
    year: "Today", dot: "Today", eyebrow: "Today: Three brands",
    title: "Yazz, Hooch and Linzzy  made to one standard",
    text: "Our portfolio now carries three brands across home care, personal care and food, each developed for a specific need in the Ghanaian home. Manufacturing sits under our own roof, so quality, safety and value are ours to guarantee, not a supplier’s promise.",
    photo: { placeholder: "Three brands lineup photo", src: "/pasted-1788863699695-0-mtsj9cl9-7qaa.png", alt: "Woman holding Hooch Corn Flakes, Linzzy and Yazz packs", w: 1536, h: 1024 },
    imageFirst: true,
    link: { label: "Explore the brands", href: "/our-brands" },
  },
];

const ACTIVE_DOT = "#12a3c4";
const IDLE_DOT = "rgba(18,163,196,.3)";
const line: CSSProperties = { flex: 1, minWidth: 14, height: 1, background: "rgba(18,163,196,.28)" };

/**
 * "Our Journey": milestones with a sticky year bar. As the visitor scrolls, the milestone nearest the middle of
 * the screen is highlighted, its year shows in the bar, and milestones not reached yet stay hidden.
 * Behaviour ported 1:1 from the prototype script (it reads the layout, so it runs imperatively).
 */
export default function Journey() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const miles = Array.from(section.querySelectorAll<HTMLElement>("[data-mile]"));
    const dots = Array.from(section.querySelectorAll<HTMLElement>("[data-dot]"));
    const big = section.querySelector<HTMLElement>("[data-year-big]");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let active = -1;
    let yearTimer = 0;
    let last: number | null = null;
    let lastH: number | null = null;

    const apply = () => {
      const mid = window.innerHeight / 2;
      const rects = miles.map((m) => m.getBoundingClientRect());
      let best = 0;
      let bestD = Infinity;
      rects.forEach((r, i) => {
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      miles.forEach((m, i) => {
        const inner = m.querySelector<HTMLElement>("[data-mile-inner]");
        if (!inner) return;
        if (reduce) { inner.style.opacity = ""; inner.style.transform = ""; return; }
        const r = rects[i];
        const seen = r.top < window.innerHeight * 0.95 && r.bottom > 0;
        inner.style.opacity = i === best ? "1" : seen ? ".55" : "0";
        inner.style.transform = i === best || seen ? "none" : "translateY(24px)";
      });
      if (best !== active) {
        active = best;
        const yr = miles[best].dataset.year ?? "";
        if (big && big.textContent !== yr) {
          big.style.opacity = "0";
          big.style.transform = "translateY(8px)";
          window.clearTimeout(yearTimer);
          yearTimer = window.setTimeout(() => { big.textContent = yr; big.style.opacity = ""; big.style.transform = ""; }, 170);
        }
        dots.forEach((d, k) => {
          const on = k === best;
          const sp = d.firstElementChild as HTMLElement | null;
          const t = d.lastElementChild as HTMLElement | null;
          if (sp) { sp.style.background = on ? ACTIVE_DOT : IDLE_DOT; sp.style.transform = on ? "scale(1.5)" : "none"; }
          if (t) t.style.color = on ? "#12313d" : "#93a9b1";
          if (on) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current");
        });
      }
    };

    // The prototype re-checked on every animation frame; it only does work when the scroll position or height changed.
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = Math.round(window.scrollY || document.documentElement.scrollTop || 0);
      const h = window.innerHeight;
      if (y === last && h === lastH) return;
      last = y;
      lastH = h;
      apply();
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.clearTimeout(yearTimer); };
  }, []);

  const jump = (i: number) => {
    const m = root.current?.querySelectorAll<HTMLElement>("[data-mile]")[i];
    if (m) window.scrollTo({ top: window.scrollY + m.getBoundingClientRect().top - 150, behavior: "smooth" });
  };
  const onDotKey = (i: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(i); }
  };

  return (
    <section
      ref={root}
      data-journey="1"
      data-screen-label="Journey"
      style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)", borderBottom: "1px solid rgba(18,163,196,.14)" }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "74px 28px 0", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>Our Journey</div>
        <h2 style={{ margin: "14px 0 0", fontSize: 34, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>Two decades, step by step</h2>
        <p style={{ margin: "16px auto 0", maxWidth: 520, fontSize: 14, lineHeight: 1.8, color: "#5d7883" }}>
          Scroll through the milestones that took Lexta from a single home care category to three brands made under one roof.
        </p>
      </div>

      <div
        data-journey-bar="1"
        style={{
          position: "sticky", top: 74, zIndex: 20, background: "rgba(247,252,254,.94)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(18,163,196,.16)", marginTop: 44,
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 22 }}>
          <div
            data-year-big="1"
            aria-live="polite"
            style={{
              fontSize: 34, lineHeight: 1, fontWeight: 800, letterSpacing: "-.03em", color: "#12a3c4", minWidth: 110,
              transition: "opacity .3s ease,transform .4s cubic-bezier(.2,.7,.2,1)",
            }}
          >
            {milestones[0].year}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {milestones.map((m, i) => (
              <JourneyDot key={m.year} index={i} label={m.dot} onJump={() => jump(i)} onKey={onDotKey(i)} />
            )).flatMap((dot, i) => (i === 0 ? [dot] : [<span key={`line-${i}`} style={line} />, dot]))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 28px 60px", display: "flex", flexDirection: "column" }}>
        {milestones.map((m) => (
          <div key={m.year} data-mile="1" data-year={m.year} style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
            <div
              data-mile-inner="1"
              style={{
                width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 44, alignItems: "center",
                transition: "opacity .5s ease,transform .6s cubic-bezier(.2,.7,.2,1)",
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" }}>{m.eyebrow}</div>
                <h3 style={{ margin: "14px 0 0", fontSize: 30, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>{m.title}</h3>
                <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.9, color: "#5d7883" }}>{m.text}</p>
                {m.link && (
                  <Link href={m.link.href} style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}>
                    {m.link.label} <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
                  </Link>
                )}
              </div>
              <div
                style={{
                  borderRadius: 14, overflow: "hidden", height: 320, boxShadow: "0 20px 44px rgba(11,60,78,.16)",
                  order: m.imageFirst ? -1 : undefined,
                }}
              >
                <ImageSlot
                  placeholder={m.photo.placeholder}
                  src={m.photo.src}
                  alt={m.photo.alt}
                  width={m.photo.w}
                  height={m.photo.h}
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JourneyDot({ index, label, onJump, onKey }: { index: number; label: string; onJump: () => void; onKey: (e: KeyboardEvent<HTMLDivElement>) => void }) {
  const on = index === 0;
  return (
    <div
      data-dot={index}
      role="button"
      tabIndex={0}
      aria-label={`Go to ${label}`}
      onClick={onJump}
      onKeyDown={onKey}
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? ACTIVE_DOT : IDLE_DOT, transition: "background .3s ease,transform .3s ease", flex: "0 0 auto" }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: on ? "#12313d" : "#93a9b1", transition: "color .3s ease" }}>{label}</span>
    </div>
  );
}
