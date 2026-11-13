import Link from "next/link";
import { formatNumber } from "@/lib/dashboard";
import { changeText } from "@/lib/management";

/** The label to show under exactly 1, where the plural would read wrong ("1 orders submitted"). */
const SINGULAR: Record<string, string> = {
  "active stockists, now": "active stockist, now",
  "activities done": "activity done",
  "applications in progress, now": "application in progress, now",
  "applications received": "application received",
  "chats started": "chat started",
  "complaints closed": "complaint closed",
  "complaints received": "complaint received",
  "complaints resolved": "complaint resolved",
  "leads lost": "lead lost",
  "leads made from chats": "lead made from chats",
  "leads won": "lead won",
  "new leads": "new lead",
  "new shops found": "new shop found",
  "new shops to confirm, now": "new shop to confirm, now",
  "open leads, now": "open lead, now",
  "open roles, now": "open role, now",
  "order lines (not cancelled)": "order line (not cancelled)",
  "orders submitted": "order submitted",
  "packs ordered (not cancelled)": "pack ordered (not cancelled)",
  "people reached": "person reached",
  "products in all, now": "product in all, now",
  "products on the websites, now": "product on the websites, now",
  "reps visiting": "rep visiting",
  "shop visits": "shop visit",
  "website leads with no owner, now": "website lead with no owner, now",
};

/**
 * One key figure. With `before` it says how it changed on the previous period of the same length ("Up 4 on the
 * previous 30 days"); the arrow is only decoration, the words carry the meaning.
 */
export default function Figure({ value, label, before, days, href, note }: {
  value: number; label: string; before?: number; days?: number; href?: string; note?: string;
}) {
  const change = before === undefined || days === undefined ? null : changeText(value, before, days);
  const body = (
    <>
      <b>{formatNumber(value)}</b>
      <span className="mgmt-fig-label">{Number(value) === 1 ? SINGULAR[label] ?? label : label}</span>
      {change && (
        <span className={`mgmt-change ${change.dir}`}>
          <span aria-hidden="true">{change.dir === "up" ? "↑ " : change.dir === "down" ? "↓ " : "= "}</span>{change.text}
        </span>
      )}
      {note && <span className="mgmt-change same">{note}</span>}
    </>
  );
  return href ? <Link className="pipe dash-stat mgmt-fig" href={href}>{body}</Link> : <div className="pipe dash-stat mgmt-fig">{body}</div>;
}
