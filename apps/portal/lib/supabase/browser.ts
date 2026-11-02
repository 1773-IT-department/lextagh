"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client in the browser, signed in as the current person through the session cookie. */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return createBrowserClient(url, key);
}
