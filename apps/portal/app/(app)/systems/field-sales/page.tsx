import { DateInput, Select } from "@lexta/ui";
import Link from "next/link";
import { formatDistance, LOCATION_LABELS, type FieldVisitRow } from "@lexta/db";
import FieldTabs from "@/components/field-sales/FieldTabs";
import VisitCards from "@/components/field-sales/VisitCards";
import { formatDateTime, PAGE_SIZE, todayIso } from "@/lib/crm";
import {
  brandNames, fieldFilterArgs, fieldFilterQuery, getFieldAccess, NO_FIELD_ACCESS, parseFieldFilters, type FieldAccess, type FieldFilters,
} from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Field sales | Lexta Business System" };

type Search = Partial<Record<keyof FieldFilters | "page" | "deleted", string>>;

export default async function FieldSalesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getFieldAccess();
  if (!access.canView) return (<><h1>Field sales</h1><p className="small">{NO_FIELD_ACCESS}</p></>);
  if (access.seesAll) return <AllVisits access={access} params={params} />;
  return <Today access={access} deleted={!!params.deleted} />;
}

// Sales rep: today ---------------------------------------------------------------------------------------------------

async function Today({ access, deleted }: { access: FieldAccess; deleted: boolean }) {
  const supabase = await createClient();
  const today = todayIso();
  const { data, error } = await supabase.rpc("field_visit_list", { ...fieldFilterArgs({ q: "", rep: access.userId, region: "", brand: "", outcome: "", from: today, to: today }), p_limit: 200, p_offset: 0 });
  if (error) console.error("[field-sales] today failed", error);
  const rows = (data ?? []) as FieldVisitRow[];
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Field sales</h1>
          <p className="small">Log each shop visit here: the shop, a photo, what happened and your notes. Your location is added when your phone shares it.</p>
        </div>
      </div>
      <Link className="btn block fs-big fs-start" href="/systems/field-sales/visit">Start visit</Link>
      <FieldTabs active="today" seesAll={false} isAdmin={false} />
      {deleted && <div className="alert ok" role="status">The visit was deleted.</div>}
      {access.myBrandIds.size === 0 && (
        <div className="alert info" role="status">You are not linked to a brand yet, so no shops are listed for you. Ask your Lexta administrator to add your brands.</div>
      )}
      <h2 className="section-title">My visits today</h2>
      {error ? (
        <div className="alert error" role="alert">We could not load your visits. Please refresh the page.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty"><b>No visits yet today</b><span>Press Start visit when you reach a shop.</span></div>
      ) : (
        <>
          <p className="small" aria-live="polite">{rows.length} {rows.length === 1 ? "visit" : "visits"} today</p>
          <VisitCards rows={rows} />
        </>
      )}
    </>
  );
}

// Managers: every visit with filters -----------------------------------------------------------------------------------

async function AllVisits({ access, params }: { access: FieldAccess; params: Search }) {
  const f = parseFieldFilters(params);
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = Object.values(f).some(Boolean);
  const supabase = await createClient();
  const [listRes, peopleRes] = await Promise.all([
    supabase.rpc("field_visit_list", { ...fieldFilterArgs(f), p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE }),
    supabase.rpc("field_sales_people"),
  ]);
  if (listRes.error) console.error("[field-sales] list failed", listRes.error);
  const rows = (listRes.data ?? []) as FieldVisitRow[];
  const people = (peopleRes.data ?? []) as { id: string; display_name: string; role: string }[];
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: Search) => `/systems/field-sales${fieldFilterQuery({ ...f, page: String(page), ...over })}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Field sales</h1>
          <p className="small">Every shop visit sales reps log on their phones, with photos, location and outcome. New shops reps add stay off Where to Buy until admin or marketing switch them on in Stockists.</p>
        </div>
        <div className="head-actions">
          <Link className="btn" href="/systems/field-sales/visit">Log a visit</Link>
          <a className="btn light" href={`/systems/field-sales/export${fieldFilterQuery(f)}`}>Export CSV</a>
        </div>
      </div>
      <FieldTabs active="all" seesAll isAdmin={access.isAdmin} />
      {params.deleted && <div className="alert ok" role="status">The visit was deleted.</div>}

      <form className="filters fs-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Shop or town" />
        </div>
        <div className="field">
          <label htmlFor="rep">Rep</label>
          <Select id="rep" name="rep" defaultValue={f.rep}>
            <option value="">Any rep</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
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
          <label htmlFor="brand">Brand</label>
          <Select id="brand" name="brand" defaultValue={f.brand}>
            <option value="">Any brand</option>
            {access.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
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
          <DateInput id="from" name="from" type="date" defaultValue={f.from} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <DateInput id="to" name="to" type="date" defaultValue={f.to} />
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/field-sales">Clear</Link>}
        </div>
      </form>

      {listRes.error ? (
        <div className="alert error" role="alert">We could not load the visits. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No visits match" : "No visits yet"}</b>
          <span>{filtered ? "Try another search or clear the filters." : "Visits appear here when sales reps log them on their phones."}</span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "visit" : "visits"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Shop</th><th scope="col">Rep</th><th scope="col">When</th><th scope="col">Outcome</th><th scope="col">Brands</th><th scope="col">Location</th><th scope="col">Photos</th></tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/systems/field-sales/visits/${v.id}`} className="pname">{v.shop_name}</Link>
                      <span className="hint">{[v.town, v.region_name].filter(Boolean).join(", ")}</span>
                      {v.new_shop && <span className={`badge ${v.shop_is_active ? "on" : "off"}`}>{v.shop_is_active ? "New shop, confirmed" : "New shop, to confirm"}</span>}
                    </td>
                    <td data-label="Rep">{v.rep_name ?? "Former team member"}</td>
                    <td data-label="When">{formatDateTime(v.visited_at)}</td>
                    <td data-label="Outcome">{v.outcome_label}{v.crm_logged && <span className="hint">On the CRM timeline</span>}</td>
                    <td data-label="Brands">{brandNames(access, v.brand_ids) || <span className="small">None</span>}</td>
                    <td data-label="Location">
                      {v.location_status === "captured"
                        ? <>{v.distance_from_shop_m !== null ? `${formatDistance(v.distance_from_shop_m)} from the shop` : "Captured"}<span className="hint">accurate to {v.accuracy_m} m</span></>
                        : <span className="badge off">{LOCATION_LABELS[v.location_status].split(" (")[0]}</span>}
                    </td>
                    <td data-label="Photos">{v.photo_count}</td>
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
