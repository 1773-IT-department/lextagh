"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const POLL_MS = 5000;

/**
 * Keeps the inbox and an open chat up to date without a manual refresh. Every few seconds, while the tab is visible,
 * it asks the database for one small value (public.chat_inbox_pulse: the latest activity time and the number of
 * chats this person can see) and refreshes the page only when that changed. Polling, not Realtime: one cheap call per
 * person, the same Row Level Security as every other read, and nothing to set up on the Supabase project.
 * Anything typed in a reply box stays as it is when the page refreshes.
 */
export default function InboxPoller() {
  const router = useRouter();
  const last = useRef<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer = 0;
    let supabase: ReturnType<typeof createBrowserSupabase> | null = null;
    try { supabase = createBrowserSupabase(); } catch { return; }
    const tick = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        const { data, error } = await supabase!.rpc("chat_inbox_pulse");
        if (!stop && !error && typeof data === "string") {
          if (last.current !== null && data !== last.current) router.refresh();
          last.current = data;
        }
      }
      if (!stop) timer = window.setTimeout(tick, POLL_MS);
    };
    void tick();
    const onVisible = () => { if (document.visibilityState === "visible") { window.clearTimeout(timer); void tick(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stop = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [router]);

  return null;
}
