import { crmActivityLabel, type CrmActivity } from "@lexta/db";

/** Newest first. Stage changes are written by the database; everything else by people. */
export default function Timeline({ items, nameOf, formatWhen }: {
  items: Pick<CrmActivity, "id" | "type" | "body" | "occurred_at" | "created_by">[];
  nameOf: (id: string | null) => string;
  formatWhen: (iso: string) => string;
}) {
  if (!items.length) return <p className="small">Nothing logged yet.</p>;
  return (
    <ol className="timeline">
      {items.map((a) => (
        <li key={a.id} className={`t-${a.type}`}>
          <div className="t-head">
            <span className="badge type">{crmActivityLabel(a.type)}</span>
            <span className="small">{formatWhen(a.occurred_at)}{` by ${nameOf(a.created_by)}`}</span>
          </div>
          <p className="t-body">{a.body}</p>
        </li>
      ))}
    </ol>
  );
}
