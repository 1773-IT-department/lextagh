import { Select } from "@lexta/ui";
import Link from "next/link";
import type { FieldVisitRow } from "@lexta/db";
import FieldTabs from "@/components/field-sales/FieldTabs";
import VisitCards from "@/components/field-sales/VisitCards";
import { PAGE_SIZE } from "@/lib/crm";
import { fieldFilterArgs, fieldFilterQuery, getFieldAccess, NO_FIELD_ACCESS, parseFieldFilters, type FieldFilters } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My visits | Lexta Business System" };

type Search = Partial<Record<keyof FieldFilters | "page", string>>;

/** The signed in person's own visits, newest first, on a phone. */
export default async function HistoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getFieldAccess();
  if (!access.canView) return (<><h1>My visits</h1><p className="small">{NO_FIELD_ACCESS}</p></>);
  const f = { ...parseFieldFilters(params), rep: "", region: "", brand: "" };
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = Object.values(f).some(Boolean);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("field_visit_list", {
    ...fieldFilterArgs({ ...f, rep: access.userId }), p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) console.error("[field-sales] history failed", error);
  const rows = (data ?? []) as FieldVisitRow[];
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: Search) => `/systems/field-sales/history${fieldFilterQuery({ ...f, page: String(page), ...over })}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{access.seesAll ? "My visits" : "My history"}</h1>
          <p className="small">Every visit you logged. You can change a visit&apos;s outcome, notes, stock check and photos for 24 hours.</p>
        </div>
      </div>
      {!access.seesAll && <Link className="btn block fs-big fs-start" href="/systems/field-sales/visit">Start visit</Link>}
      <FieldTabs active="history" seesAll={access.seesAll} isAdmin={access.isAdmin} />

      <form className="filters fs-history-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Shop</label>
          <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Shop or town" />
        </div>
        <div className="field">
          <label htmlFor="outcome">Outcome</label>
          <Select id="outcome" name="outcome" defaultValue={f.outcome}>
            <option value="">Any outcome</option>
            {access.outcomes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={f.from} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={f.to} />
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/field-sales/history">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load your visits. Please refresh the page.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty"><b>{filtered ? "No visits match" : "No visits yet"}</b><span>{filtered ? "Try other dates or clear the filters." : "Your visits appear here once you log them."}</span></div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "visit" : "visits"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <VisitCards rows={rows} />
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
