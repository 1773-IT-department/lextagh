"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Story photos come from the existing Lexta site. Only stories published on lextagh.com are shown; the five cards
 * summarised from press coverage (Tamale, Mamprobi, women doctors, Korle Bu, Kumasi) were removed with the held news stories.
 */
const stories = [
  {
    img: "/assets/original/web/lexta-lexta-ghana-limited-visits-mawuko-girls-shs-ho.webp",
    alt: "Lexta Ghana visits Mawuko Girls SHS, Ho",
    title: "Mawuko Girls SHS, Ho",
    text: "To educate on cervical cancer and Femcare.",
  },
  {
    img: "/assets/original/web/lexta-lexta-ghana-limited-spent-time-with-the-girls-of-unity-high-jhs-in-kot.webp",
    alt: "Unity High JHS, Kotobabi on International Women's Day",
    title: "Unity High JHS, Kotobabi",
    text: "In commemoration of the International Women's Day.",
  },
];

const GAP = 22;
const INTERVAL = 4000;

const card: CSSProperties = {
  flex: "0 0 calc(50% - 11px)", position: "relative", height: 290, borderRadius: 12, overflow: "hidden",
  boxShadow: "0 18px 38px rgba(11,60,78,.16)",
};
const fill: CSSProperties = { position: "absolute", inset: 0 };
const navBtn: CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", border: 0,
  background: "#fff", color: "#12a3c4", fontSize: 18, cursor: "pointer", boxShadow: "0 8px 20px rgba(11,60,78,.22)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4,
};

/** "Latest Activities & Campaigns" carousel: two cards per view on desktop (one on phones), auto-advancing every 4s. */
export default function StoriesCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(2);
  const indexRef = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const go = (n: number) => {
    const el = track.current;
    const first = el?.firstElementChild;
    // Two cards per view on desktop, one on phones (the track's parent is the visible window).
    const cardW = first ? first.getBoundingClientRect().width : 0;
    const windowW = el?.parentElement?.getBoundingClientRect().width ?? 0;
    const pv = first && cardW * 2 + GAP > windowW + 1 ? 1 : 2;
    const maxIdx = Math.max(0, stories.length - pv);
    const a = n > maxIdx ? 0 : n < 0 ? maxIdx : n;
    indexRef.current = a;
    setActive(a);
    setPerView(pv);
    if (el && first) el.style.transform = `translateX(${-a * (cardW + GAP)}px)`;
  };
  const restart = () => {
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => go(indexRef.current + 1), INTERVAL);
  };
  const goAndRestart = (n: number) => { go(n); restart(); };

  useEffect(() => {
    go(0);
    restart();
    const onResize = () => go(indexRef.current);
    window.addEventListener("resize", onResize);
    return () => { window.clearInterval(timer.current); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div data-acar="1" style={{ position: "relative" }}>
      <div style={{ overflow: "hidden", borderRadius: 12 }}>
        <div ref={track} data-acar-track="1" style={{ display: "flex", gap: GAP, transition: "transform .7s cubic-bezier(.3,.7,.2,1)", willChange: "transform" }}>
          {stories.map((st, k) => {
            // Cards outside the visible window must not take keyboard focus.
            const offscreen = k < active || k >= active + perView;
            return (
            <article key={st.title} style={card} inert={offscreen} aria-hidden={offscreen || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={st.img} alt={st.alt} style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ ...fill, background: "linear-gradient(180deg,rgba(6,32,42,0) 42%,rgba(6,32,42,.82))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 20, right: 70, bottom: 20, pointerEvents: "none" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{st.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,.85)" }}>{st.text}</p>
              </div>
              <Link
                href="/news"
                aria-label={`Read story: ${st.title}`}
                style={{
                  position: "absolute", right: 18, bottom: 22, width: 34, height: 34, borderRadius: "50%", background: "#12a3c4",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}
              >
                →
              </Link>
            </article>
            );
          })}
        </div>
      </div>
      <button type="button" data-acar-prev="1" aria-label="Previous stories" onClick={() => goAndRestart(indexRef.current - 1)} style={{ ...navBtn, left: -12 }}>‹</button>
      <button type="button" data-acar-next="1" aria-label="Next stories" onClick={() => goAndRestart(indexRef.current + 1)} style={{ ...navBtn, right: -12 }}>›</button>
      <div data-acar-dots="1" style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
        {stories.map((st, k) => (
          <button
            key={st.title}
            type="button"
            data-acar-dot={k}
            aria-label={`Stories ${k + 1}`}
            onClick={() => goAndRestart(k)}
            style={{ width: 22, height: 4, borderRadius: 2, border: 0, background: k === active ? "#12a3c4" : "rgba(18,163,196,.28)", cursor: "pointer", padding: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
