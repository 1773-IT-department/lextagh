"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Story photos come from the existing Yazz and Lexta sites, exactly as the prototype links them. */
const stories = [
  {
    img: "https://yazzproducts.com/wp-content/uploads/2024/02/WhatsApp-Image-2024-01-16-at-21.50.17-1021x1024.jpeg",
    alt: "Cervical Cancer Awareness Launch 2024, Tamale",
    title: "Awareness Launch 2024, Tamale",
    text: "The national launch, hosted in the north for the first time.",
  },
  {
    img: "https://yazzproducts.com/wp-content/uploads/2025/03/WE6A0601-1024x683.jpg",
    alt: "Tuesday Market Park, Mamprobi, 2025",
    title: "Tuesday Market Park, Mamprobi",
    text: "Screening and education taken into the market.",
  },
  {
    img: "https://yazzproducts.com/wp-content/uploads/2025/04/130202594139-vaqdtgfssn-health-cervical-cancer1.jpg",
    alt: "Ghanaian women doctors encourage screening",
    title: "Doctors Urge Early Detection",
    text: "MWAG's awareness month launch in Ablekuma South.",
  },
  {
    img: "https://yazzproducts.com/wp-content/uploads/2026/02/yazz-crvical-cancer-awareness-2026.png",
    alt: "SOFPOG, MWAG, Yazz and Korle Bu Polyclinic free screening",
    title: "Free Screening at Korle Bu",
    text: "With SOFPOG, MWAG and the Family Medicine Department.",
  },
  {
    img: "https://yazzproducts.com/wp-content/uploads/2026/05/WhatsApp-Image-2020-01-19-at-8.42.06-AM-1080x675-1-1024x640.jpeg",
    alt: "Free cervical cancer screening in Kumasi",
    title: "Free Screening in Kumasi",
    text: "Education and screening ahead of the Accra edition.",
  },
  {
    img: "https://lextagh.com/wp-content/uploads/2026/06/Lexta-Ghana-Limited-Visits-Mawuko-girls-SHS-Ho.jpeg",
    alt: "Lexta Ghana visits Mawuko Girls SHS, Ho",
    title: "Mawuko Girls SHS, Ho",
    text: "Health education and pad donations with MWAG.",
  },
  {
    img: "https://lextagh.com/wp-content/uploads/2026/06/Lexta-Ghana-Limited-spent-time-with-the-girls-of-Unity-high-JHS-in-Kotobabi-in-commemoration-of-the-internal-womens-day.jpg",
    alt: "Unity High JHS, Kotobabi on International Women's Day",
    title: "Unity High JHS, Kotobabi",
    text: "International Women's Day with the Domite Foundation.",
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
  const indexRef = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const maxIdx = Math.max(0, stories.length - 2);

  const go = (n: number) => {
    const a = n > maxIdx ? 0 : n < 0 ? maxIdx : n;
    indexRef.current = a;
    setActive(a);
    const el = track.current;
    const first = el?.firstElementChild;
    if (el && first) el.style.transform = `translateX(${-a * (first.getBoundingClientRect().width + GAP)}px)`;
  };
  const restart = () => {
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => go(indexRef.current + 1), INTERVAL);
  };
  const goAndRestart = (n: number) => { go(n); restart(); };

  useEffect(() => {
    restart();
    const onResize = () => go(indexRef.current);
    window.addEventListener("resize", onResize);
    return () => { window.clearInterval(timer.current); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div data-acar="1" style={{ position: "relative" }}>
      <div style={{ overflow: "hidden", borderRadius: 12 }}>
        <div ref={track} data-acar-track="1" style={{ display: "flex", gap: GAP, transition: "transform .7s cubic-bezier(.3,.7,.2,1)", willChange: "transform" }}>
          {stories.map((st) => (
            <article key={st.title} style={card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={st.img} alt={st.alt} style={{ ...fill, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ ...fill, background: "linear-gradient(180deg,rgba(6,32,42,0) 42%,rgba(6,32,42,.82))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 20, right: 70, bottom: 20, pointerEvents: "none" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{st.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,.85)" }}>{st.text}</p>
              </div>
              <Link
                href="/news"
                aria-label="Read story"
                style={{
                  position: "absolute", right: 18, bottom: 22, width: 34, height: 34, borderRadius: "50%", background: "#12a3c4",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}
              >
                →
              </Link>
            </article>
          ))}
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
