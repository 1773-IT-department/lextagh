/* Lexta Business System service worker, shared by the Field Sales and CSR Tracker phone apps (lib/pwa.ts).
 *
 * Kept small and careful, because staff share phones and signal in the field comes and goes:
 *   - Pages are always fetched from the network and never stored, so one person's data is never shown to another,
 *     and nobody works on stale lists. When a field sales, CSR, install or login page cannot load, a saved offline page
 *     says so and offers to retry.
 *   - Versioned build files (/_next/static/...) and the app icons are kept, so the apps open fast on a weak signal.
 *   - Data requests, uploads and anything that is not a GET pass straight through: the visit form's own retry and photo
 *     upload behaviour is unchanged.
 */
const VERSION = "lexta-pwa-v1";
const SHELL = ["/offline.html", "/pwa/field-sales-192.png", "/pwa/csr-192.png"];
const APP_PAGES = [/^\/systems\/field-sales(\/|$)/, /^\/systems\/csr(\/|$)/, /^\/install\//, /^\/login$/];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("lexta-pwa-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    if (!APP_PAGES.some((re) => re.test(url.pathname))) return;
    event.respondWith(
      fetch(req).catch(() => caches.open(VERSION).then((c) => c.match("/offline.html")).then((r) => r || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa/")) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && res.type === "basic") cache.put(req, res.clone());
        return res;
      }),
    );
  }
});
