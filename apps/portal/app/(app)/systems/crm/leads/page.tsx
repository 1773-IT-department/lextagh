import Link from "next/link";
import { CRM_SOURCES, CRM_STAGES, crmContactName, crmSourceLabel, crmStageLabel, type CrmLeadSource, type CrmStage } from "@lexta/db";
import CrmTabs from "@/components/crm/CrmTabs";
import { cleanSearch, formatDate, getCrmAccess, NO_CRM_ACCESS, PAGE_SIZE, staffName, todayIso, UUID } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Leads | Lexta Business System" };

type Search = { q?: string; stage?: string; source?: string; brand?: string; owner?: string; sort?: string; page?: string; deleted?: string };

type Row = {
  id: string;
  title: string;
  stage: CrmStage;
  source: CrmLeadSource;
  brand_id: string | null;
  owner_id: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  contact: { full_name: string | null; email: string | null; phone: string | null } | null;
  organisation: { name: string } | null;
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getCrmAccess();
  if (!access.canView) {
    return (<><h1>CRM</h1><p className="small">{NO_CRM_ACCESS}</p></>);
  }

  const q = cleanSearch(params.q, 80);
  // Default view: open leads (not won or lost).
  const stage = params.stage === "all" || params.stage === "open" || CRM_STAGES.some((s) => s.value === params.stage) ? params.stage! : "open";
  const source = CRM_SOURCES.some((s) => s.value === params.source) ? params.source! : "";
  const brand = params.brand === "none" || access.allBrands.some((b) => b.id === params.brand) ? params.brand! : "";
  const owner = params.owner === "mine" || params.owner === "unassigned" || (params.owner && UUID.test(params.owner) && access.staff.some((s) => s.id === params.owner))
    ? params.owner! : "";
  const sort = params.sort === "newest" ? "newest" : "next";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = !!(q || source || brand || owner || stage !== "open");

  const supabase = await createClient();
  // Every filter except the stage, shared by the list and the pipeline counts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Builder = any;
  const applyFilters = (query: Builder): Builder => {
    let out = query;
    if (source) out = out.eq("source", source);
    if (brand === "none") out = out.is("brand_id", null);
    else if (brand) out = out.eq("brand_id", brand);
    if (owner === "mine") out = out.eq("owner_id", access.userId);
    else if (owner === "unassigned") out = out.is("owner_id", null);
    else if (owner) out = out.eq("owner_id", owner);
    if (q) out = out.or(`title.ilike.*${q}*,description.ilike.*${q}*,intake_reference.ilike.*${q}*`);
    return out;
  };

  let list = applyFilters(
    supabase.from("crm_leads").select(
      "id, title, stage, source, brand_id, owner_id, next_action, next_action_date, created_at, contact:crm_contacts!crm_leads_contact_id_fkey(full_name, email, phone), organisation:crm_organisations!crm_leads_organisation_id_fkey(name)",
      { count: "exact" },
    ),
  );
  if (stage === "open") list = list.not("stage", "in", "(won,lost)");
  else if (stage !== "all") list = list.eq("stage", stage);
  list = sort === "newest"
    ? list.order("created_at", { ascending: false })
    : list.order("next_action_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
  const from = (page - 1) * PAGE_SIZE;

  const [listRes, ...countRes] = await Promise.all([
    list.order("id").range(from, from + PAGE_SIZE - 1),
    ...CRM_STAGES.map((s) => applyFilters(supabase.from("crm_leads").select("id", { count: "exact", head: true })).eq("stage", s.value)),
  ]);
  const { data, error, count } = listRes;
  if (error) console.error("[crm] leads list failed", error);
  const rows = ((data ?? []) as unknown as (Omit<Row, "contact" | "organisation"> & { contact: Row["contact"] | Row["contact"][]; organisation: Row["organisation"] | Row["organisation"][] })[])
    .map((r) => ({ ...r, contact: one(r.contact), organisation: one(r.organisation) }));
  const counts = CRM_STAGES.map((s, i) => ({ ...s, count: countRes[i]?.count ?? 0, failed: !!countRes[i]?.error }));
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const today = todayIso();
  const brandName = new Map(access.allBrands.map((b) => [b.id, b.name]));

  const href = (over: Partial<Record<keyof Search, string>>) => {
    const sp = new URLSearchParams();
    const merged = { q, stage, source, brand, owner, sort, page: String(page), ...over };
    if (merged.q) sp.set("q", merged.q);
    if (merged.stage && merged.stage !== "open") sp.set("stage", merged.stage);
    if (merged.source) sp.set("source", merged.source);
    if (merged.brand) sp.set("brand", merged.brand);
    if (merged.owner) sp.set("owner", merged.owner);
    if (merged.sort && merged.sort !== "next") sp.set("sort", merged.sort);
    if (merged.page && merged.page !== "1") sp.set("page", merged.page);
    const s = sp.toString();
    return `/systems/crm/leads${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>CRM</h1>
          <p className="small">One shared CRM for Lexta and every brand. You see the leads of the brands you work on, leads with no brand, and leads you own.</p>
        </div>
        <div className="head-actions">
          {access.isAdmin && <Link className="btn light" href="/systems/crm/settings/website-leads">Website lead managers</Link>}
          <Link className="btn" href="/systems/crm/leads/new">New lead</Link>
        </div>
      </div>
      <CrmTabs active="leads" />

      {params.deleted && <div className="alert ok" role="status">The lead was deleted.</div>}

      <nav className="pipeline" aria-label="Pipeline">
        {counts.map((s) => (
          <Link key={s.value} href={href({ stage: s.value, page: "1" })} className={`pipe s-${s.value}`} aria-current={stage === s.value ? "page" : undefined}>
            <b>{s.failed ? "?" : s.count}</b>
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>

      <form className="filters crm-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Title, description or website reference" />
        </div>
        <div className="field">
          <label htmlFor="stage">Stage</label>
          <select id="stage" name="stage" defaultValue={stage}>
            <option value="open">Open leads</option>
            <option value="all">All stages</option>
            {CRM_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="source">Source</label>
          <select id="source" name="source" defaultValue={source}>
            <option value="">Any source</option>
            {CRM_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={brand}>
            <option value="">Any brand</option>
            <option value="none">No brand</option>
            {access.allBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="owner">Owner</label>
          <select id="owner" name="owner" defaultValue={owner}>
            <option value="">Anyone</option>
            <option value="mine">Mine</option>
            <option value="unassigned">Unassigned</option>
            {access.staff.filter((s) => s.id !== access.userId).map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={sort}>
            <option value="next">Next action</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/crm/leads">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the leads. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered || stage !== "open" ? "No leads match" : "No open leads"}</b>
          <span>
            {filtered
              ? "Try another search or clear the filters."
              : "Add one with New lead. Website enquiries land here automatically."}
          </span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "lead" : "leads"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Lead</th><th scope="col">Stage</th><th scope="col">Brand</th><th scope="col">Source</th><th scope="col">Owner</th><th scope="col">Next action</th></tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const who = [l.contact ? crmContactName(l.contact) : "", l.organisation?.name ?? ""].filter(Boolean).join(", ");
                  const overdue = !!l.next_action_date && l.next_action_date < today && l.stage !== "won" && l.stage !== "lost";
                  return (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/systems/crm/leads/${l.id}`} className="pname">{l.title}</Link>
                        {who && <span className="hint">{who}</span>}
                      </td>
                      <td data-label="Stage"><span className={`badge stage s-${l.stage}`}>{crmStageLabel(l.stage)}</span></td>
                      <td data-label="Brand">{l.brand_id ? brandName.get(l.brand_id) ?? "" : <span className="small">No brand</span>}</td>
                      <td data-label="Source">{crmSourceLabel(l.source)}</td>
                      <td data-label="Owner">{l.owner_id ? (l.owner_id === access.userId ? "Me" : staffName(access, l.owner_id)) : <span className="small">Unassigned</span>}</td>
                      <td data-label="Next action">
                        {l.next_action_date ? <span className={overdue ? "overdue" : ""}>{formatDate(l.next_action_date)}{overdue ? " (overdue)" : ""}</span> : <span className="small">Not set</span>}
                        {l.next_action && <span className="hint">{l.next_action}</span>}
                      </td>
                    </tr>
                  );
                })}
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
