"use client";

import { useCallback, useEffect, useState } from "react";

/** The browser's install offer (Chrome and Edge on Android and desktop). Not in the TypeScript DOM types yet. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

declare global {
  interface Window { __lextaInstallPrompt?: InstallPromptEvent | null }
}

/**
 *   checking     not known yet (first render)
 *   ready        the browser offers installation: one tap on our button shows its install dialog
 *   ios          iPhone or iPad: no install dialog exists, people add it from the Share menu
 *   manual       another browser without the offer: install from the browser menu
 *   installed    it was just installed from this page
 *   standalone   this page is already running as the installed app
 */
export type InstallState = "checking" | "ready" | "ios" | "manual" | "installed" | "standalone";

export const isIos = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export function usePwaInstall() {
  const [state, setState] = useState<InstallState>("checking");

  useEffect(() => {
    const decide = () => {
      if (isStandalone()) return setState("standalone");
      if (window.__lextaInstallPrompt) return setState("ready");
      setState(isIos() ? "ios" : "manual");
    };
    decide();
    // The offer can arrive after the first render; PwaHead's early script keeps it and announces it.
    const onReady = () => decide();
    const onInstalled = () => { window.__lextaInstallPrompt = null; setState("installed"); };
    window.addEventListener("lexta-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("lexta-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const p = window.__lextaInstallPrompt;
    if (!p) return false;
    await p.prompt();
    const { outcome } = await p.userChoice;
    // The offer can be used once; the browser sends a new one if people decline and come back later.
    window.__lextaInstallPrompt = null;
    if (outcome === "accepted") setState("installed");
    else setState(isIos() ? "ios" : "manual");
    return outcome === "accepted";
  }, []);

  return { state, install };
}
