"use client";

import { useState, useTransition } from "react";
import { loadMoreActivity, type FeedQuery } from "@/app/(app)/management/actions";
import type { FeedView } from "@/lib/management";
import FeedRow from "./FeedRow";

/** A whole number with thousands separators, without Intl (the same on the server and in any browser). */
const count = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * The feed with "Load more": the next page is asked for with the last row's time and key (keyset paging), and added
 * under the rows already shown. Without JavaScript, "Load more" is a plain link to the next page (`laterPage`: this
 * page was opened that way, so it does not hold everything from the newest on).
 */
export default function ActivityFeed({ first, hasMore, query, nextHref, laterPage }: {
  first: FeedView[]; hasMore: boolean; query: FeedQuery; nextHref: string; laterPage: boolean;
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
        {items.map((i) => <FeedRow key={i.key} item={i} />)}
      </ol>
      {error && <div className="alert error" role="alert">{error}</div>}
      <p className="small mgmt-feed-count" role="status">
        Showing {count(items.length)} {items.length === 1 ? "event" : "events"}{more || laterPage ? "" : ", all there are for these filters"}.
      </p>
      {more && last && (
        <a className="btn light mgmt-more" href={nextHref} onClick={loadMore} aria-disabled={pending || undefined}>
          {pending ? "Loading..." : "Load more"}
        </a>
      )}
    </>
  );
}
