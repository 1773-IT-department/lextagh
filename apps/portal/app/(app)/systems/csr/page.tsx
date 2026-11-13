import { DateInput, Select } from "@lexta/ui";
import Link from "next/link";
import { CSR_STATUS_LABELS, type CsrActivityRow, type CsrProgrammeTotal } from "@lexta/db";
import CsrTabs from "@/components/csr/CsrTabs";
import { PAGE_SIZE } from "@/lib/crm";
import { brandName, csrFilterQuery, formatCount, formatDay, getCsrAccess, NO_CSR_ACCESS, parseCsrFilters, type CsrFilters } from "@/lib/csr";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "CSR activities | Lexta Business System" };

type Search = Partial<Record<keyof CsrFilters | "page" | "deleted", string>>;

export default async function CsrPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getCsrAccess();
  if (!access.canView) return (<><h1>CSR activities</h1><p className="small">{NO_CSR_ACCESS}</p></>);

  const f = parseCsrFilters(params);
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = Object.values(f).some(Boolean);
  const supabase = await createClient();
  const [listRes, totalsRes] = await Promise.all([
    supabase.rpc("csr_activity_list", {
      p_programme: f.programme || null, p_region: f.region || null, p_from: f.from || null, p_to: f.to || null,
      p_status: f.status || null, p_q: f.q || null, p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE,
    }),
    // Totals follow the date, region and programme filters (status and search do not apply: totals count done activities).
    supabase.rpc("csr_programme_totals", { p_from: f.from || null, p_to: f.to || null, p_region: f.region || null, p_programme: f.programme || null }),
  ]);
  if (listRes.error) console.error("[csr] list failed", listRes.error);
  if (totalsRes.error) console.error("[csr] totals failed", totalsRes.error);
  const rows = (listRes.data ?? []) as CsrActivityRow[];
  const totals = (totalsRes.data ?? []) as CsrProgrammeTotal[];
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: Search) => `/systems/csr${csrFilterQuery({ ...f, page: String(page), ...over })}`;
  const sum = (k: "activities_done" | "people_reached" | "activities_planned") => totals.reduce((n, t) => n + Number(t[k] ?? 0), 0);
  const range = f.from || f.to ? `${f.from ? formatDay(f.from) : "the start"} to ${f.to ? formatDay(f.to) : "today"}` : "all time";
  const regionName = f.region ? access.regions.find((r) => r.id === f.region)?.name : "";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>CSR activities</h1>
          <p className="small">Every CSR activity: when, which programme, where, how many people it reached, with photos. Totals count activities marked done.</p>
        </div>
        {access.canWrite && access.writableProgrammeIds.size > 0 && (
          <div className="head-actions"><Link className="btn" href="/systems/csr/new">Log an activity</Link></div>
        )}
      </div>
      <CsrTabs active="activities" isAdmin={access.isAdmin} />
      {params.deleted && <div className="alert ok" role="status">The activity was deleted.</div>}
      {access.canWrite && access.writableProgrammeIds.size === 0 && (
        <div className="alert info" role="status">There is no programme you can log activities for yet. Ask your Lexta administrator to add one or link you to its brand.</div>
      )}

      <form className="filters csr-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Place, partner or notes" />
        </div>
        <div className="field">
          <label htmlFor="programme">Programme</label>
          <Select id="programme" name="programme" defaultValue={f.programme}>
            <option value="">Any programme</option>
            {access.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}{p.is_active ? "" : " (off)"}</option>)}
          </Select>
        </div>
        <div className="field">
          <label htmlFor="region">Region</label>
          <Select id="region" name="region" defaultValue={f.region}>
            <option value="">Any region</option>
            {access.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <Select id="status" name="status" defaultValue={f.status}>
            <option value="">Done and planned</option>
            <option value="done">Done</option>
            <option value="planned">Planned</option>
          </Select>
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <DateInput id="from" name="from" type="date" defaultValue={f.from} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <DateInput id="to" name="to" type="date" defaultValue={f.to} />
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/csr">Clear</Link>}
        </div>
      </form>

      <section className="panel" aria-labelledby="totals_title">
        <h2 id="totals_title">Totals per programme <span className="small">({range}{regionName ? `, ${regionName}` : ""})</span></h2>
        {totalsRes.error ? (
          <div className="alert error" role="alert">We could not load the totals. Please refresh the page.</div>
        ) : (
          <>
            <div className="pipeline csr-counts">
              <div className="pipe"><b>{formatCount(sum("people_reached"))}</b><span>People reached</span></div>
              <div className="pipe"><b>{formatCount(sum("activities_done"))}</b><span>Activities done</span></div>
              <div className="pipe"><b>{formatCount(sum("activities_planned"))}</b><span>Planned</span></div>
            </div>
            <div className="table-wrap">
              <table className="ptable">
                <thead>
                  <tr><th scope="col">Programme</th><th scope="col">Activities done</th><th scope="col">People reached</th><th scope="col">Last activity</th><th scope="col">Planned</th></tr>
                </thead>
                <tbody>
                  {totals.map((t) => (
                    <tr key={t.programme_id}>
                      <td>
                        <Link className="pname" href={href({ programme: t.programme_id, page: "1" })}>{t.programme_name}</Link>
                        {(brandName(access, t.brand_id) || !t.is_active) && (
                          <span className="hint">{[brandName(access, t.brand_id), t.is_active ? "" : "Switched off"].filter(Boolean).join(", ")}</span>
                        )}
                      </td>
                      <td data-label="Activities done">{formatCount(t.activities_done)}</td>
                      <td data-label="People reached">{formatCount(t.people_reached)}</td>
                      <td data-label="Last activity">{formatDay(t.last_activity_date) || <span className="small">None</span>}</td>
                      <td data-label="Planned">
                        {formatCount(t.activities_planned)}
                        {t.next_planned_date && <span className="hint">Next: {formatDay(t.next_planned_date)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <h2 className="section-title">Activities</h2>
      {listRes.error ? (
        <div className="alert error" role="alert">We could not load the activities. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No activities match" : "No activities yet"}</b>
          <span>{filtered ? "Try another search or clear the filters." : access.canWrite ? "Press Log an activity after each CSR event." : "Activities appear here when marketing logs them."}</span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "activity" : "activities"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Date</th><th scope="col">Programme</th><th scope="col">Where</th><th scope="col">People reached</th><th scope="col">Status</th><th scope="col">Photos</th></tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td><Link href={`/systems/csr/${a.id}`} className="pname">{formatDay(a.activity_date)}</Link></td>
                    <td data-label="Programme">{a.programme_name}</td>
                    <td data-label="Where">{a.place}<span className="hint">{a.region_name ?? "Region removed"}</span></td>
                    <td data-label="People reached">{formatCount(a.people_reached)}</td>
                    <td data-label="Status"><span className={`badge ${a.status === "done" ? "on" : "off"}`}>{CSR_STATUS_LABELS[a.status]}</span></td>
                    <td data-label="Photos">{a.photo_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn small light" href={href({ page: String(page - 1) })}>Previous</Link> : <span />}
              <span className="small">Page {page} of {pages}</span>
              {page < pages ? <Link className="btn small light" href={href({ page: String(page + 1) })}>Next</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </>
  );
}
