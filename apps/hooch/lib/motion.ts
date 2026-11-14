"use client";

/**
 * The site-wide Pause motion switch (WCAG 2.2.2): one choice covers the hero video, the 3D boxes, the ticker, the
 * floating flakes and every loop. It lives on <html data-motion="paused">, so CSS can stop animations everywhere, and
 * is remembered in this browser (localStorage, guarded: private windows and blocked storage simply forget it).
 */
import { useEffect, useState } from "react";

const KEY = "hooch-motion";
const EVENT = "hooch-motion";

export function readMotionPaused(): boolean {
  try { return document.documentElement.dataset.motion === "paused"; } catch { return false; }
}

export function setMotionPaused(paused: boolean) {
  try {
    if (paused) document.documentElement.dataset.motion = "paused";
    else delete document.documentElement.dataset.motion;
  } catch { /* no document */ }
  try { window.localStorage.setItem(KEY, paused ? "paused" : "on"); } catch { /* storage blocked */ }
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ }
}

/** True while the visitor has paused motion on the site. */
export function useMotionPaused(): boolean {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const sync = () => setPaused(readMotionPaused());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return paused;
}

/** Runs before the page paints (inline in <head>), so a remembered pause holds from the first frame. */
export const MOTION_BOOT = `try{if(localStorage.getItem("${KEY}")==="paused")document.documentElement.dataset.motion="paused"}catch(e){}`;
