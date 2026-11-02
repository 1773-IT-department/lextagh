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
