"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Hides the bar if a navigation never finishes (an error page, a cancelled click), so it cannot stay forever. */
const GIVE_UP_MS = 20_000;

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

  // A new address means the page arrived.
  useEffect(() => {
    setBusy(false);
    if (timer.current) clearTimeout(timer.current);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || !internalTarget(a, e)) return;
      setBusy(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBusy(false), GIVE_UP_MS);
    };
    // On window, so React's own click handling (next/link) has already run.
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
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
