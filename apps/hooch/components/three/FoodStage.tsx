"use client";

/**
 * A food stage: the poster picture first (a render of the settled 3D scene, so the page is fast and looks right with
 * no JavaScript), then, on devices that can take it, the live 3D scene fades in over it once the stage scrolls near.
 *
 * Who gets the live scene: WebGL2 works, the visitor has not asked for reduced motion or data saving, and the device
 * has at least 4 processor cores. Everyone else keeps the poster with a gentle CSS bob (still, with reduced motion).
 * ?3d=off and ?3d=on in the address force either way (for testing); ?3d=still shows the settled scene, standing still
 * (the poster renders).
 * The scene is unmounted when the stage is far off screen (frees the graphics memory; it pours again on return) and
 * paused when just out of view. A "Pause motion" button stops all movement (WCAG 2.2.2).
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import type { SceneConfig } from "./scene-config";
import s from "./stage.module.css";

const CerealScene = dynamic(() => import("./CerealScene"), { ssr: false });

type Mode = "poster" | "live";

const forced = () => { try { return new URLSearchParams(window.location.search).get("3d"); } catch { return null; } };

function canRun3d(): boolean {
  try {
    const force = forced();
    if (force === "off") return false;
    if (force === "on" || force === "still") return true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData) return false;
    if ((nav.hardwareConcurrency ?? 4) < 4) return false;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false;
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

const SHOUTS = ["Crunch!", "Munch!", "Yum!", "Crunch!", "Pop!"];

export default function FoodStage({
  config, poster, label, priority = false, variant = "detail", hint = true, className,
}: {
  config: SceneConfig;
  poster: { src: string; alt: string };
  /** Describes the scene for screen readers (the canvas is role="img"). */
  label: string;
  priority?: boolean;
  variant?: "hero" | "detail" | "band";
  hint?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("poster");
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settled, setSettled] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; word: string }[]>([]);
  const burstId = useRef(0);

  const [still, setStill] = useState(false);
  useEffect(() => { if (canRun3d()) { setMode("live"); setStill(forced() === "still"); } }, []);

  useEffect(() => {
    if (mode !== "live" || !box.current) return;
    const el = box.current;
    const far = new IntersectionObserver(([e]) => { setNear(e.isIntersecting); if (!e.isIntersecting) { setShown(false); setSettled(false); } }, { rootMargin: "600px 0px" });
    const seen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "60px 0px" });
    far.observe(el);
    seen.observe(el);
    return () => { far.disconnect(); seen.disconnect(); };
  }, [mode]);

  const onCrunch = useCallback((x: number, y: number) => {
    setTapped(true);
    const id = ++burstId.current;
    setBursts((b) => [...b.slice(-3), { id, x, y, word: SHOUTS[id % SHOUTS.length] }]);
    window.setTimeout(() => setBursts((b) => b.filter((v) => v.id !== id)), 900);
  }, []);

  const live = mode === "live" && near;

  return (
    <div
      ref={box}
      className={`${s.stage} ${s[variant]} ${className ?? ""}`}
      data-vessel={config.vessel}
      data-mode={mode}
      data-shown={shown ? "" : undefined}
      data-settled={settled ? "" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.poster}
        src={poster.src}
        alt={shown ? "" : poster.alt}
        aria-hidden={shown || undefined}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
      {live && (
        <div className={s.canvas} role="img" aria-label={label}>
          <CerealScene
            config={config}
            running={visible && !paused && !(still && settled)}
            onReady={() => setShown(true)}
            onSettled={() => setSettled(true)}
            onCrunch={onCrunch}
            idle={!still}
            still={still}
          />
        </div>
      )}
      {bursts.map((b) => (
        <span key={b.id} className={s.burst} style={{ left: b.x, top: b.y }} aria-hidden="true">{b.word}</span>
      ))}
      {shown && !still && (
        <>
          {hint && !tapped && <span className={s.hint} aria-hidden="true"><Icon name="hand" size={16} /> Tap the bowl for a crunch!</span>}
          <button type="button" className={s.pause} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            <Icon name={paused ? "play" : "pause"} size={14} /> {paused ? "Play motion" : "Pause motion"}
          </button>
        </>
      )}
    </div>
  );
}
