import { createClient } from "@supabase/supabase-js";

export type PublicClientOptions = {
  /**
   * Next.js cache tags for every request this client makes (for example ["products"]).
   * The sites' /api/revalidate route clears the "products" tag when staff save a product.
   */
  cacheTags?: string[];
  /** Seconds before cached data is refreshed even without a revalidation call. */
  revalidateSeconds?: number;
};

/**
 * Hard time limit for one website read (Our Brands products, Where to Buy regions or stockists), retries included.
 * postgrest-js retries a failed GET after 1, 2 and 4 seconds and fetch has no timeout of its own, so without this
 * an outage would hold a page rebuild for 7 seconds, or for ever if the server accepts and never answers.
 * The helpers abort at this limit and the sites show their fallback instead.
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
  const { cacheTags, revalidateSeconds } = options;
  if (!cacheTags && revalidateSeconds === undefined) return createClient(url, key);
  // Next.js reads the extra "next" option on fetch to cache and tag the response.
  const taggedFetch: typeof fetch = (input, init) =>
    fetch(input, { ...init, next: { tags: cacheTags, revalidate: revalidateSeconds } } as RequestInit);
  return createClient(url, key, { global: { fetch: taggedFetch } });
}
