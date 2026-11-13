import { formatNumber } from "@/lib/dashboard";
import { pointLabel, type SeriesPoint, type Timeseries } from "@/lib/management";

type Key = "orders" | "leads" | "complaints" | "visits";

/**
 * A small column chart of one series over the period, drawn as inline SVG (no chart library). One colour, so no
 * legend: the heading names the series. Each column has a tooltip (title), the chart has a written summary for screen
 * readers, and the numbers sit in a table under "Show the numbers".
 */
export default function MiniChart({ id, title, series, unitWord, data }: {
  id: string; title: string; series: Key; unitWord: string; data: Timeseries;
}) {
  const points: SeriesPoint[] = data.points;
  const values = points.map((p) => Number(p[series] ?? 0));
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(0, ...values);
  const peakAt = values.indexOf(max);
  const per = data.unit === "day" ? "day" : data.unit === "week" ? "week" : "month";
  const summary = total === 0
    ? `No ${unitWord} in this period.`
    : `${formatNumber(total)} ${unitWord} in all, by ${per}. The busiest ${per} was ${pointLabel(points[peakAt], data.unit)} with ${formatNumber(max)}.`;

  const W = 320;
  const H = 96;
  const pad = 2;
  const n = Math.max(1, points.length);
  const slot = W / n;
  const gap = n > 40 ? 1 : 2;
  const bw = Math.max(1, slot - gap);
  const scale = max > 0 ? (H - pad) / max : 0;

  return (
    <figure className="mgmt-chart" aria-labelledby={`${id}_t`}>
      <figcaption id={`${id}_t`}>
        <b>{title}</b>
        <span className="small"> {formatNumber(total)} in all</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H + 1}`} preserveAspectRatio="none" role="img" aria-label={`${title}. ${summary}`} focusable="false">
        <line x1="0" x2={W} y1={H + 0.5} y2={H + 0.5} className="mgmt-chart-base" />
        {points.map((p, i) => {
          const v = values[i];
          const h = v > 0 ? Math.max(2, v * scale) : 0;
          return (
            <g key={p.from}>
              {/* A full height hit area per column, so the tooltip is easy to reach. */}
              <rect x={i * slot} y={0} width={slot} height={H} className="mgmt-chart-hit">
                <title>{`${pointLabel(p, data.unit)}: ${formatNumber(v)}`}</title>
              </rect>
              {h > 0 && <rect x={i * slot + gap / 2} y={H - h} width={bw} height={h} rx={Math.min(2, bw / 2)} className="mgmt-chart-bar" pointerEvents="none" />}
            </g>
          );
        })}
      </svg>
      <div className="mgmt-chart-axis small" aria-hidden="true">
        <span>{pointLabel(points[0] ?? { from: data.from, to: data.from }, data.unit)}</span>
        <span>{max > 0 ? `Highest ${formatNumber(max)}` : "None"}</span>
        <span>{pointLabel(points[points.length - 1] ?? { from: data.to, to: data.to }, data.unit)}</span>
      </div>
      <p className="sr-only">{summary}</p>
      <details className="mgmt-chart-table">
        <summary>Show the numbers</summary>
        <div className="mgmt-table-scroll">
          <table className="ptable mgmt-num-table">
            <caption className="sr-only">{title} by {per}</caption>
            <thead><tr><th scope="col">{per === "day" ? "Day" : per === "week" ? "Week" : "Month"}</th><th scope="col">{title}</th></tr></thead>
            <tbody>
              {points.map((p, i) => <tr key={p.from}><td>{pointLabel(p, data.unit)}</td><td>{formatNumber(values[i])}</td></tr>)}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
