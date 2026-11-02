import { complaintEventLabel, type ComplaintEvent } from "@lexta/db";

/** Newest first. Status, owner and file entries are written by the database; notes, calls and emails by people. */
export default function ComplaintTimeline({ items, nameOf, formatWhen }: {
  items: Pick<ComplaintEvent, "id" | "type" | "body" | "occurred_at" | "created_by">[];
  nameOf: (id: string | null) => string;
  formatWhen: (iso: string) => string;
}) {
  if (!items.length) return <p className="small">Nothing logged yet.</p>;
  return (
    <ol className="timeline">
      {items.map((e) => (
        <li key={e.id} className={`t-${e.type}`}>
          <div className="t-head">
            <span className="badge type">{complaintEventLabel(e.type)}</span>
            <span className="small">{formatWhen(e.occurred_at)}{` by ${nameOf(e.created_by)}`}</span>
          </div>
          <p className="t-body">{e.body}</p>
        </li>
      ))}
    </ol>
  );
}
