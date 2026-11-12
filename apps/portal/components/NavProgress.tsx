"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Hides the bar if a navigation never finishes (an error page, a cancelled click), so it cannot stay forever. */
const GIVE_UP_MS = 10_000;
/** After the server's answer for the clicked page has fully arrived, time for React to show it. */
const SETTLE_MS = 150;

/** The address a click on this anchor opens inside the portal, or null when it is not an in app page change. */
function internalTarget(a: HTMLAnchorElement, e: MouseEvent): string | null {
  // next/link cancels the browser's own navigation and loads the page itself. A click nothing cancelled is a plain
  // link (a CSV export, a CV download), where the browser shows its own progress.
  if (!e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  const next = url.pathname + url.search;
  // Same page, or only a jump to an anchor on it: nothing loads.
  if (next === window.location.pathname + window.location.search) return null;
  return next;
}

/**
 * A thin bar at the top of the screen from the moment an internal link is clicked until the new page is shown. The
 * portal has no loading.tsx on purpose (it made staff actions hang on "Saving..."), so without this a click shows
 * nothing until the server answers. Screen readers hear "Loading page" once.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The page being loaded (its path) and when the click happened. */
  const pending = useRef<{ path: string; at: number } | null>(null);

  const stop = (after = 0) => {
    if (timer.current) clearTimeout(timer.current);
    const done = () => { pending.current = null; setBusy(false); };
    if (after > 0) timer.current = setTimeout(done, after);
    else done();
  };

  // A new address means the page arrived.
  useEffect(() => stop(), [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const next = a instanceof HTMLAnchorElement ? internalTarget(a, e) : null;
      if (!next) return;
      pending.current = { path: new URL(next, window.location.href).pathname, at: performance.now() };
      setBusy(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => stop(), GIVE_UP_MS);
    };
    // A navigation can also end on the address already shown (the server redirects back to the current page, as the
    // distributor guard does), so the address never changes. The router fetches the clicked page with an "_rsc"
    // request: once that answer has fully arrived, the bar ends shortly after even if the address stays the same.
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        const p = pending.current;
        if (!p) return;
        for (const entry of list.getEntries()) {
          if (entry.startTime < p.at) continue;
          const url = new URL(entry.name, window.location.href);
          if (url.searchParams.has("_rsc") && url.pathname === p.path) { stop(SETTLE_MS); return; }
        }
      });
      observer.observe({ type: "resource", buffered: false });
    } catch {
      observer = null; // No resource timing: the give up timer still ends the bar.
    }
    // On window, so React's own click handling (next/link) has already run.
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
      observer?.disconnect();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (busy) main.setAttribute("aria-busy", "true");
    else main.removeAttribute("aria-busy");
  }, [busy]);

  return (
    <>
      <div className={`nav-progress${busy ? " on" : ""}`} aria-hidden="true"><span /></div>
      <span className="sr-only" role="status">{busy ? "Loading page" : ""}</span>
    </>
  );
}
