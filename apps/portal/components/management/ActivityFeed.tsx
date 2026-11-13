"use client";

import { useState, useTransition } from "react";
import { loadMoreActivity, type FeedQuery } from "@/app/(app)/management/actions";
import type { FeedItem } from "@/lib/management";
import FeedRow from "./FeedRow";

/**
 * The feed with "Load more": the next page is asked for with the last row's time and key (keyset paging), and added
 * under the rows already shown. Without JavaScript, "Load more" is a plain link to the next page.
 */
export default function ActivityFeed({ first, hasMore, query, brandNames, nextHref }: {
  first: FeedItem[]; hasMore: boolean; query: FeedQuery; brandNames: Record<string, string>; nextHref: string;
}) {
  const [items, setItems] = useState(first);
  const [more, setMore] = useState(hasMore);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const last = items[items.length - 1];

  const loadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!last || pending) return;
    setError("");
    start(async () => {
      const res = await loadMoreActivity(query, last.at, last.key);
      if (!res.ok) { setError(res.error); return; }
      setItems((now) => [...now, ...res.items.filter((i) => !now.some((x) => x.key === i.key))]);
      setMore(res.hasMore);
    });
  };

  return (
    <>
      <ol className="mgmt-feed" aria-label="Activity, newest first">
        {items.map((i) => <FeedRow key={i.key} item={i} brandNames={brandNames} />)}
      </ol>
      {error && <div className="alert error" role="alert">{error}</div>}
      <p className="small mgmt-feed-count" role="status">Showing {items.length.toLocaleString("en-GB")} {items.length === 1 ? "event" : "events"}{more ? "" : ", all there are for these filters"}.</p>
      {more && last && (
        <a className="btn light mgmt-more" href={nextHref} onClick={loadMore} aria-disabled={pending || undefined}>
          {pending ? "Loading..." : "Load more"}
        </a>
      )}
    </>
  );
}
