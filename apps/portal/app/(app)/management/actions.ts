"use server";

import { FEED_PAGE_SIZE, isFeedSystem, isManager, type FeedItem, type FeedPage } from "@/lib/management";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type FeedQuery = { from: string; to: string; brand: string; system: string; person: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The next page of the activity feed. Read only; the database checks the role again and refuses anyone else. */
export async function loadMoreActivity(q: FeedQuery, beforeAt: string, beforeKey: string):
  Promise<{ ok: true; items: FeedItem[]; hasMore: boolean } | { ok: false; error: string }> {
  const { profile } = await requireSession();
  if (!isManager(profile?.is_active ? profile.role : null)) return { ok: false, error: "Your role does not include the management overview." };
  if (!DATE.test(q.from) || !DATE.test(q.to) || (q.brand && !UUID.test(q.brand)) || (q.person && !UUID.test(q.person))
    || (q.system && !isFeedSystem(q.system)) || Number.isNaN(Date.parse(beforeAt)) || !beforeKey || beforeKey.length > 200) {
    return { ok: false, error: "We could not load more. Please refresh the page." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("management_activity", {
    p_from: q.from, p_to: q.to, p_brand: q.brand || null, p_system: q.system || null, p_person: q.person || null,
    p_before_at: beforeAt, p_before_key: beforeKey, p_limit: FEED_PAGE_SIZE,
  });
  if (error) {
    console.error("[management] feed page failed", error);
    return { ok: false, error: "We could not load more. Please try again." };
  }
  const page = data as FeedPage;
  return { ok: true, items: page.items, hasMore: page.has_more };
}
