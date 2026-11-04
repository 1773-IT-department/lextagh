import { createClient } from "@supabase/supabase-js";

export type PublicClientOptions = {
  /**
   * Next.js cache tags for every request this client makes (for example ["products"]).
   * The sites' /api/revalidate route clears the "products" tag when staff save a product.
   */
  cacheTags?: string[];
  /** Seconds before cached data is refreshed even without a revalidation call. */
  revalidateSeconds?: number;
  /**
   * Website reads only: abort each request after this many milliseconds and switch off postgrest-js's automatic
   * retries, so an outage costs one short wait and the site shows its fallback. Left out, nothing changes.
   */
  timeoutMs?: number;
};

/**
 * Hard time limit for one website read (Our Brands products, Where to Buy regions or stockists).
 * postgrest-js retries a failed GET after 1, 2 and 4 seconds and fetch has no timeout of its own, so without this
 * an outage would hold a page rebuild for about 7 seconds, or for ever if the server accepts and never answers.
 * Website read clients therefore make one attempt only (no retries) and abort it at this limit; the helpers also
 * give a whole read (every page of it) the same deadline. A refused connection fails at once, a silent server
 * after this limit, and the sites show their fallback. A cached page simply tries again at its next rebuild.
 */
export const WEBSITE_READ_TIMEOUT_MS = 4000;

/** One deadline for a whole website read: pass it to every query of that read with .abortSignal(). */
export function websiteReadDeadline(ms: number = WEBSITE_READ_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
}

/** Browser/server-safe client using the publishable key. Row Level Security protects every table. */
export function createPublicClient(options: PublicClientOptions = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const { cacheTags, revalidateSeconds, timeoutMs } = options;
  const tagged = Boolean(cacheTags) || revalidateSeconds !== undefined;
  const timed = timeoutMs !== undefined && timeoutMs > 0;
  if (!tagged && !timed) return createClient(url, key);

  const customFetch: typeof fetch = (input, init) => {
    let signal = init?.signal ?? undefined;
    if (timed) {
      const limit = AbortSignal.timeout(timeoutMs);
      signal = signal ? AbortSignal.any([signal, limit]) : limit;
    }
    // Next.js reads the extra "next" option on fetch to cache and tag the response.
    const next = tagged ? { next: { tags: cacheTags, revalidate: revalidateSeconds } } : {};
    return fetch(input, { ...init, signal, ...next } as RequestInit);
  };
  return createClient(url, key, { global: { fetch: customFetch }, ...(timed ? { db: { retry: false } } : {}) });
}

/** The client every website read helper uses: cached under the given tag for an hour, one attempt, time limited. */
export function createWebsiteReadClient(cacheTag: string) {
  return createPublicClient({ cacheTags: [cacheTag], revalidateSeconds: 3600, timeoutMs: WEBSITE_READ_TIMEOUT_MS });
}
