import "server-only";

/** What changed, so a site only refreshes the pages that show it. */
export type SiteDataTag = "products" | "stockists" | "jobs";

/**
 * Tells every website to refresh the pages that show this data ("edit once, sites update").
 * Reads SITE_REVALIDATE_URLS (comma separated) and REVALIDATE_SECRET. If either is missing it only logs,
 * so a save never fails because a website could not be reached.
 */
export async function notifySites(reason: string, tags: SiteDataTag[] = ["products"]): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  const urls = (process.env.SITE_REVALIDATE_URLS ?? "").split(",").map((u) => u.trim()).filter(Boolean);
  if (!secret || urls.length === 0) {
    console.info(`[revalidate] skipped (${reason}): SITE_REVALIDATE_URLS or REVALIDATE_SECRET not set`);
    return;
  }
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-revalidate-secret": secret, "content-type": "application/json" },
        body: JSON.stringify({ reason, tags }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`${url} answered ${res.status}`);
      return url;
    }),
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`[revalidate] ${urls[i]} failed (${reason}):`, r.reason instanceof Error ? r.reason.message : r.reason);
  });
}
