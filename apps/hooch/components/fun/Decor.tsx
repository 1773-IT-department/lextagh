import type { CSSProperties } from "react";
import type { Film } from "@/content/videos";
import LoopVideo from "./LoopVideo";

/** Wavy creamy edge between two sections (the colour is the section below; the background the section above). */
export function MilkWave({ color = "var(--hc-cream)", flip = false, style }: { color?: string; flip?: boolean; style?: CSSProperties }) {
  return (
    <span className="hc-wave" aria-hidden="true" style={{ color, transform: flip ? "scaleY(-1)" : undefined, ...style }}>
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path fill="currentColor" d="M0 34c60-14 120-22 180-14s120 26 180 26 120-22 180-26 120 10 180 18 120 14 180 6 120-26 180-28 120 14 180 20 120 4 180-4 120-18 180-16 120 14 180 20 120 6 180-4 120-20 180-22 120 12 180 20v42H0z" />
      </svg>
    </span>
  );
}

/** Real Hooch flakes and strawberries (cut from Lexta's own Hooch artwork) for the floaters. */
const BITS = [
  "/images/hooch/bits/flake-sharp.webp", "/images/hooch/bits/flake-1.webp", "/images/hooch/bits/flake-sharp.webp", "/images/hooch/bits/flake-2.webp",
  "/images/hooch/bits/flake-5.webp", "/images/hooch/bits/berry-1.webp", "/images/hooch/bits/flake-6.webp", "/images/hooch/bits/flake-4.webp",
  "/images/hooch/bits/berry-2.webp",
];

/** Cereal flakes drifting along the edges of a section (decorative, seeded so the server and browser agree). */
export function Floaters({ count = 12, seed = 1 }: { count?: number; seed?: number }) {
  let a = seed * 9301 + 49297;
  const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const items = Array.from({ length: count }, () => ({
    // Along the left and right edges only, so they never sit on the words.
    left: `${Math.round(r() < 0.5 ? r() * 7 : 89 + r() * 8)}%`, top: `${Math.round(r() * 90)}%`, s: 26 + Math.round(r() * 34), t: 7 + r() * 6, d: -r() * 8,
    img: BITS[Math.floor(r() * BITS.length)], b: r() < 0.25 ? 1.5 : 0,
    dx: Math.round((r() - 0.5) * 40), dy: -Math.round(12 + r() * 30), r0: Math.round(r() * 360), r1: Math.round(r() * 360 - 180),
  }));
  return (
    <div className="hc-floaters" aria-hidden="true">
      {items.map((it, i) => (
        <i
          key={i}
          style={{
            left: it.left, top: it.top, "--s": `${it.s}px`, "--t": `${it.t.toFixed(1)}s`, "--d": `${it.d.toFixed(1)}s`, "--dx": `${it.dx}px`,
            "--dy": `${it.dy}px`, "--r0": `${it.r0}deg`, "--r1": `${it.r1}deg`, "--img": `url(${it.img})`, "--b": `${it.b}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

/** A headline whose letters bounce in one by one. Screen readers get the plain words. */
export function Bouncy({ text, className }: { text: string; className?: string }) {
  let i = 0;
  return (
    <span className={className}>
      <span className="hc-sr">{text}</span>
      <span className="hc-bouncy" aria-hidden="true">
        {text.split(" ").map((word, w, all) => (
          <span key={w} style={{ display: "inline-block", whiteSpace: "nowrap", animation: "none" }} className="hc-bouncy">
            {Array.from(word).map((ch) => <span key={i} style={{ "--i": i++ } as CSSProperties}>{ch}</span>)}
            {w < all.length - 1 && <span data-space="" style={{ "--i": i++ } as CSSProperties}>{" "}</span>}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Where a product film goes. With a film it plays it (muted loop, see LoopVideo; today our stand-in made from Lexta's
 * Hooch artwork, set in content/videos.ts); with none, a clearly marked placeholder over the pack shot.
 */
export function VideoSlot({ needed, poster, film }: { needed: string; poster: { src: string; alt: string }; film?: Film }) {
  if (film) {
    return (
      <div className="hc-video">
        <LoopVideo film={film} />
      </div>
    );
  }
  return (
    <div className="hc-video" role="img" aria-label={`Product video to come: ${needed}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster.src} alt="" loading="lazy" style={{ objectFit: "contain", background: "radial-gradient(circle at 50% 60%, #fff4cc, #ffd23f)" }} />
      <div className="hc-video__ph" aria-hidden="true">
        <span className="hc-video__play"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M8 5v14l11-7z" /></svg></span>
        <span>[PLACEHOLDER: {needed}]</span>
      </div>
    </div>
  );
}
