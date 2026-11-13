import Link from "next/link";
import { formatNumber } from "@/lib/dashboard";
import { changeText } from "@/lib/management";

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
      <span className="mgmt-fig-label">{label}</span>
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
