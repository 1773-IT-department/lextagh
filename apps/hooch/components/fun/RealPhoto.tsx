"use client";

/**
 * A real food photo that plays along: it tilts towards the pointer (a little 3D parallax, with real Hooch flakes and
 * strawberries floating in front at a different depth), and a tap makes a "crunch": real flakes burst out of the photo.
 * Still for visitors who prefer reduced motion or have paused motion. The photos are Lexta's own Hooch artwork
 * (see CONTENT-NEEDED.md for the photos still to come).
 */
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useMotionPaused } from "@/lib/motion";

const BITS = ["/images/hooch/bits/flake-sharp.webp", "/images/hooch/bits/flake-1.webp", "/images/hooch/bits/flake-2.webp", "/images/hooch/bits/flake-5.webp", "/images/hooch/bits/berry-1.webp"];
const SHOUTS = ["Crunch!", "Yum!", "Munch!", "Pop!"];

type Burst = { id: number; x: number; y: number; word: string; bits: { dx: number; dy: number; r: number; src: string; s: number }[] };

export default function RealPhoto({
  src, alt, ratio = "4 / 3", priority = false, floaters = true, placeholder, className, fit = "cover", position,
}: {
  src: string; alt: string; ratio?: string; priority?: boolean; floaters?: boolean;
  /** Shown as a clearly marked label when this photo stands in for one Lexta still has to send. */
  placeholder?: string;
  className?: string; fit?: "cover" | "contain"; position?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const paused = useMotionPaused();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [bursts, setBursts] = useState<Burst[]>([]);
  const id = useRef(0);
  const reduce = () => paused || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || reduce()) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  };
  const tap = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const n = ++id.current;
    const bits = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
      const d = 60 + Math.random() * 70;
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 30, r: (Math.random() - 0.5) * 540, src: BITS[(n + i) % BITS.length], s: 30 + Math.random() * 26 };
    });
    setBursts((b) => [...b.slice(-2), { id: n, x: e.clientX - r.left, y: e.clientY - r.top, word: SHOUTS[n % SHOUTS.length], bits }]);
    window.setTimeout(() => setBursts((b) => b.filter((v) => v.id !== n)), 1000);
  };

  return (
    <div
      ref={box}
      className={`hc-photo ${className ?? ""}`}
      style={{ "--ratio": ratio, "--tx": tilt.x.toFixed(3), "--ty": tilt.y.toFixed(3) } as CSSProperties}
      onPointerMove={move}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      onPointerDown={tap}
      data-no-sprinkle=""
    >
      <div className="hc-photo__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" style={{ objectFit: fit, objectPosition: position }} />
        <span className="hc-photo__shine" aria-hidden="true" />
      </div>
      {floaters && (
        <span className="hc-photo__bits" aria-hidden="true">
          <i style={{ "--img": `url(${BITS[0]})`, left: "-4%", top: "8%", "--s": "64px", "--d": "-1s" } as CSSProperties} />
          <i style={{ "--img": `url(${BITS[4]})`, right: "-3%", top: "62%", "--s": "58px", "--d": "-3s" } as CSSProperties} />
          <i style={{ "--img": `url(${BITS[2]})`, right: "6%", top: "-6%", "--s": "50px", "--d": "-2s" } as CSSProperties} />
        </span>
      )}
      {placeholder && <span className="hc-photo__ph">[PLACEHOLDER: {placeholder}]</span>}
      {bursts.map((b) => (
        <span key={b.id} className="hc-photo__burst" style={{ left: b.x, top: b.y }} aria-hidden="true">
          {b.bits.map((t, i) => <i key={i} style={{ "--dx": `${t.dx}px`, "--dy": `${t.dy}px`, "--r": `${t.r}deg`, "--img": `url(${t.src})`, "--s": `${t.s}px` } as CSSProperties} />)}
          <b>{b.word}</b>
        </span>
      ))}
    </div>
  );
}
