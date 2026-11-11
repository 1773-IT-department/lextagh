import Link from "next/link";
import { formatDistance, type FieldVisitRow } from "@lexta/db";
import { formatDateTime } from "@/lib/crm";

/** A rep's visits as big cards that work on a phone. */
export default function VisitCards({ rows }: { rows: FieldVisitRow[] }) {
  return (
    <ul className="order-cards fs-cards">
      {rows.map((v) => (
        <li key={v.id}>
          <Link href={`/systems/field-sales/visits/${v.id}`} className="order-card">
            <div className="order-card-top">
              <b>{v.shop_name}</b>
              <span className="badge fs-outcome-badge">{v.outcome_label}</span>
            </div>
            <span className="small">{formatDateTime(v.visited_at)}{v.town ? `, ${v.town}` : ""}</span>
            <span className="hint">
              {v.photo_count} {v.photo_count === 1 ? "photo" : "photos"}
              {v.stock_count > 0 ? `, ${v.on_shelf_count} of ${v.stock_count} products on the shelf` : ""}
              {v.location_status !== "captured" ? ", no location" : v.distance_from_shop_m !== null ? `, ${formatDistance(v.distance_from_shop_m)} from the shop` : ""}
            </span>
            {v.new_shop && !v.shop_is_active && <span className="badge off">New shop, waiting for staff</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
