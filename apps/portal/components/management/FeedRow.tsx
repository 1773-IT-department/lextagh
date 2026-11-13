import Link from "next/link";
import { actorText, describe, FEED_SYSTEM_LABELS, formatWhen, recordHref, type FeedItem } from "@/lib/management";

/** One event of the activity feed. The whole row opens the record in its own system. */
export default function FeedRow({ item, brandNames }: { item: FeedItem; brandNames: Record<string, string> }) {
  const { what, detail } = describe(item);
  const brands = item.brand_ids.map((b) => brandNames[b]).filter(Boolean);
  const who = actorText(item);
  const meta = [who ? `By ${who}` : "", brands.join(", ")].filter(Boolean).join(" \u00b7 ");
  return (
    <li className="mgmt-feed-row">
      <Link href={recordHref(item)}>
        <span className="mgmt-feed-top">
          <span className="badge type">{FEED_SYSTEM_LABELS[item.system] ?? item.system}</span>
          <time dateTime={item.at}>{formatWhen(item.at)}</time>
        </span>
        <b className="mgmt-feed-what">{what}</b>
        {detail && <span className="mgmt-feed-detail">{detail}</span>}
        {meta && <span className="mgmt-feed-meta">{meta}</span>}
      </Link>
    </li>
  );
}
