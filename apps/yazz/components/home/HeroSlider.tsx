"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import s from "./home.module.css";

export type Slide = {
  eyebrow: string;
  title: [string, string];
  accent: [string, string];
  body: string;
  ctas: { label: string; href: string; kind: "red" | "ghost" }[];
  image: { src: string; alt: string };
  position?: string;
  note?: boolean;
};

/**
 * The prototype's Home hero carousel: blue panel, photo on the right, arrows and dots, a new slide every 6 seconds
 * that pauses on hover or focus. Without JavaScript (or with reduced motion) it simply shows the first slide.
 */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  // Stopped by the visitor (the pause button), or by a reduced motion setting.
  const [stopped, setStopped] = useState(false);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStopped(true); }, []);
  const timer = useRef<number>(0);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || stopped) return;
    timer.current = window.setTimeout(() => go(i + 1), 6000);
    return () => window.clearTimeout(timer.current);
  }, [i, paused, stopped, go]);

  return (
    <section
      className={s.hero}
      aria-roledescription="carousel"
      aria-label="Yazz highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* The page's one main heading stays in place whichever slide shows; the slides use h2. */}
      <h1 className="yz-sr">Yazz®: Trusted Quality. Made for Everyday Living.</h1>
      {slides.map((sl, k) => (
        <div
          key={sl.eyebrow}
          className={s.slide}
          data-active={k === i ? "" : undefined}
          role="group"
          aria-roledescription="slide"
          aria-label={`${k + 1} of ${slides.length}`}
          aria-hidden={k !== i}
          inert={k !== i}
        >
          <div className={s.slidePic}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sl.image.src} alt={sl.image.alt} loading={k === 0 ? "eager" : "lazy"} style={{ objectPosition: sl.position }} />
          </div>
          <div className={s.slideText}>
            <p className={s.slideEyebrow}>{sl.eyebrow}</p>
            <h2 className={s.slideTitle}>{sl.title[0]} <em>{sl.accent[0]}</em><br />{sl.title[1]} <em className={s.pink}>{sl.accent[1]}</em></h2>
            <p className={s.slideBody}>{sl.body}</p>
            <div className={s.slideActions}>
              {sl.ctas.map((c) => (
                <Link key={c.label} href={c.href} className={`yz-btn ${c.kind === "red" ? "yz-btn--red" : "yz-btn--ghost-light"}`}>
                  {c.label} {c.kind === "red" && <Icon name="arrow" size={17} />}
                </Link>
              ))}
            </div>
          </div>
          {sl.note && (
            <p className={`yz-script ${s.slideNote}`} aria-hidden="true">Comfort<br />+ Protection<br />= Confidence<span className={s.noteLine} /></p>
          )}
        </div>
      ))}
      <button type="button" className={`${s.arrow} ${s.prev}`} aria-label="Previous slide" onClick={() => go(i - 1)}><Icon name="chevron-left" size={20} /></button>
      <button type="button" className={`${s.arrow} ${s.next}`} aria-label="Next slide" onClick={() => go(i + 1)}><Icon name="chevron-right" size={20} /></button>
      <div className={s.dots}>
        <button type="button" className={s.playPause} onClick={() => setStopped((v) => !v)} aria-label={stopped ? "Play the slideshow" : "Pause the slideshow"}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="14" height="14" fill="currentColor">
            {stopped ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
          </svg>
        </button>
        {slides.map((sl, k) => (
          <button key={sl.eyebrow} type="button" className={s.dot} data-active={k === i ? "" : undefined} aria-label={`Show slide ${k + 1}`} aria-current={k === i ? "true" : undefined} onClick={() => go(k)} />
        ))}
      </div>
    </section>
  );
}
