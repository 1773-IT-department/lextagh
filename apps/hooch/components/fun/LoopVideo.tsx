"use client";

/**
 * A short film that plays by itself: muted, looping, inline (phones too), smaller files on phones. It shows its poster
 * and stays still for visitors who prefer reduced motion or have paused motion on the site (WCAG 2.2.2), and pauses
 * while it is off screen. It starts from script (no autoplay attribute), so without JavaScript the poster shows, still.
 */
import { useEffect, useRef, useState } from "react";
import { useMotionPaused } from "@/lib/motion";
import type { Film } from "@/content/videos";

export default function LoopVideo({ film, className, priority = false }: { film: Film; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const paused = useMotionPaused();
  const [reduce, setReduce] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const still = reduce || paused;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (still) { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } return; }
    if (onScreen) v.play().catch(() => { /* autoplay refused: the poster stays */ });
    else v.pause();
  }, [still, onScreen]);

  return (
    <video
      ref={ref}
      className={className}
      poster={film.poster}
      muted
      loop
      playsInline
      preload={priority ? "auto" : "metadata"}
      aria-label={film.label}
      data-still={still ? "" : undefined}
      disablePictureInPicture
    >
      {film.small && <source src={film.small.webm} type="video/webm" media="(max-width: 700px)" />}
      {film.small && <source src={film.small.mp4} type="video/mp4" media="(max-width: 700px)" />}
      <source src={film.webm} type="video/webm" />
      <source src={film.mp4} type="video/mp4" />
    </video>
  );
}
