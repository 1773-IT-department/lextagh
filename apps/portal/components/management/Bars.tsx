import { formatNumber, type Bar } from "@/lib/dashboard";

/** A list of labelled bars; the numbers are always written out, the bars only show their size. */
export default function Bars({ title, bars, empty, hideZero = false }: { title: string; bars: Bar[]; empty: string; hideZero?: boolean }) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  const shown = hideZero ? bars.filter((b) => b.value > 0) : bars;
  return (
    <div className="dash-bars">
      <h3>{title}</h3>
      {max === 0 ? (
        <p className="small dash-empty">{empty}</p>
      ) : (
        <ul>
          {shown.map((b) => (
            <li key={b.label}>
              <span className="dash-bar-label">{b.label}</span>
              <span className="dash-bar-track" aria-hidden="true"><span className="dash-bar-fill" style={{ width: `${(b.value / max) * 100}%` }} /></span>
              <b className="dash-bar-value">{formatNumber(b.value)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
