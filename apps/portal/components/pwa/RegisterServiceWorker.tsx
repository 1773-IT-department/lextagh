"use client";

import { useEffect } from "react";

/** Registers the phone apps' service worker (public/lexta-sw.js). Quietly does nothing where it is not supported. */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/lexta-sw.js", { scope: "/" }).catch((e) => console.warn("[pwa] service worker not registered", e));
  }, []);
  return null;
}
