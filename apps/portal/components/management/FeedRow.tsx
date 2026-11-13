import Link from "next/link";
import type { FeedView } from "@/lib/management";

/** One event of the activity feed. The whole row opens the record in its own system. Every text comes ready made. */
export default function FeedRow({ item }: { item: FeedView }) {
  return (
    <li className="mgmt-feed-row">
      <Link href={item.href}>
        <span className="mgmt-feed-top">
          <span className="badge type">{item.system}</span>
          <time dateTime={item.at}>{item.when}</time>
        </span>
        <b className="mgmt-feed-what">{item.what}</b>
        {item.detail && <span className="mgmt-feed-detail">{item.detail}</span>}
        {item.meta && <span className="mgmt-feed-meta">{item.meta}</span>}
      </Link>
    </li>
  );
}
