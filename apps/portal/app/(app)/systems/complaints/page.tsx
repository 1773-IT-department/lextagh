import Link from "next/link";
import {
  COMPLAINT_CATEGORIES, COMPLAINT_SEVERITIES, COMPLAINT_STATUSES, OPEN_COMPLAINT_STATUSES, complaintCategoryLabel,
  complaintSeverityLabel, complaintStatusLabel, crmContactName, isComplaintOverdue, type Complaint,
} from "@lexta/db";
import { cleanSearch, formatDate, PAGE_SIZE } from "@/lib/crm";
import { CASE_NUMBER, getComplaintAccess, NO_COMPLAINT_ACCESS, ownerCandidates, phoneKey, staffName } from "@/lib/complaints";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Complaints | Lexta Business System" };

type Search = {
  q?: string; status?: string; severity?: string; brand?: string; category?: string; owner?: string; overdue?: string;
  page?: string; deleted?: string;
};

type Row = Pick<Complaint, "id" | "case_number" | "brand_id" | "category" | "severity" | "status" | "owner_id" | "created_at"
  | "response_due_at" | "resolution_due_at" | "first_response_at"> & {
  contact: { full_name: string | null; email: string | null; phone: string | null } | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
const OPEN_LIST = `(${OPEN_COMPLAINT_STATUSES.join(",")})`;

export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getComplaintAccess();
  if (!access.canView) return (<><h1>Complaints</h1><p className="small">{NO_COMPLAINT_ACCESS}</p></>);

  const q = cleanSearch(params.q, 80);
  // Default view: open complaints (not resolved or closed).
  const status = params.status === "all" || params.status === "open" || COMPLAINT_STATUSES.some((s) => s.value === params.status) ? params.status! : "open";
  const severity = COMPLAINT_SEVERITIES.some((s) => s.value === params.severity) ? params.severity! : "";
  const brand = access.visibleBrands.some((b) => b.id === params.brand) ? params.brand! : "";
  const category = COMPLAINT_CATEGORIES.some((c) => c.value === params.category) ? params.category! : "";
  const owners = ownerCandidates(access);
  const owner = params.owner === "mine" || params.owner === "unassigned" || (params.owner && UUID.test(params.owner) && owners.some((s) => s.id === params.owner))
    ? params.owner! : "";
  const overdue = params.overdue === "1";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = !!(q || severity || brand || category || owner || overdue || status !== "open");
  const nowIso = new Date().toISOString();

  const supabase = await createClient();

  // Search: a case number, or the customer's name, email or phone (matched on its digits like the CRM does).
  let contactIds: string[] | null = null;
  let searchFailed = false;
  if (q && !CASE_NUMBER.test(q)) {
    const digits = phoneKey(q);
    const parts = [`full_name.ilike.*${q}*`, `email.ilike.*${q}*`];
    if (digits.length >= 4) parts.push(`phone_key.like.*${digits}*`);
    const { data, error } = await supabase.from("crm_contacts").select("id").or(parts.join(",")).limit(200);
    if (error) searchFailed = true;
    contactIds = (data ?? []).map((c) => c.id as string);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Builder = any;
  const overdueFilter = `resolution_due_at.lt.${nowIso},and(first_response_at.is.null,response_due_at.lt.${nowIso})`;
  /** Every filter except the status, shared by the list and the counts. */
  const applyFilters = (query: Builder, withOverdue = overdue): Builder => {
    let out = query;
    if (severity) out = out.eq("severity", severity);
    if (brand) out = out.eq("brand_id", brand);
    if (category) out = out.eq("category", category);
    if (owner === "mine") out = out.eq("owner_id", access.userId);
    else if (owner === "unassigned") out = out.is("owner_id", null);
    else if (owner) out = out.eq("owner_id", owner);
    if (q) {
      const ids = contactIds && contactIds.length ? `,contact_id.in.(${contactIds.join(",")})` : "";
      out = out.or(`case_number.ilike.*${q}*${ids}`);
    }
    if (withOverdue) out = out.filter("status", "in", OPEN_LIST).or(overdueFilter);
    return out;
  };

  let list = applyFilters(
    supabase.from("complaints").select(
      "id, case_number, brand_id, category, severity, status, owner_id, created_at, response_due_at, resolution_due_at, first_response_at, contact:crm_contacts!complaints_contact_id_fkey(full_name, email, phone)",
      { count: "exact" },
    ),
  );
  if (status === "open") list = list.filter("status", "in", OPEN_LIST);
  else if (status !== "all") list = list.eq("status", status);
  const from = (page - 1) * PAGE_SIZE;

  const [listRes, overdueRes, ...countRes] = await Promise.all([
    list.order("created_at", { ascending: false }).order("id").range(from, from + PAGE_SIZE - 1),
    applyFilters(supabase.from("complaints").select("id", { count: "exact", head: true }), true),
    ...COMPLAINT_STATUSES.map((s) => applyFilters(supabase.from("complaints").select("id", { count: "exact", head: true })).eq("status", s.value)),
  ]);
  const { data, error, count } = listRes;
  if (error) console.error("[complaints] list failed", error);
  const rows = ((data ?? []) as unknown as (Omit<Row, "contact"> & { contact: Row["contact"] | Row["contact"][] })[])
    .map((r) => ({ ...r, contact: one(r.contact) }));
  const counts = COMPLAINT_STATUSES.map((s, i) => ({ ...s, count: countRes[i]?.count ?? 0, failed: !!countRes[i]?.error }));
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const brandName = new Map(access.allBrands.map((b) => [b.id, b.name]));
  const now = new Date();

  const href = (over: Partial<Record<keyof Search, string>>) => {
    const sp = new URLSearchParams();
    const merged = { q, status, severity, brand, category, owner, overdue: overdue ? "1" : "", page: String(page), ...over };
    if (merged.q) sp.set("q", merged.q);
    if (merged.status && merged.status !== "open") sp.set("status", merged.status);
    if (merged.severity) sp.set("severity", merged.severity);
    if (merged.brand) sp.set("brand", merged.brand);
    if (merged.category) sp.set("category", merged.category);
    if (merged.owner) sp.set("owner", merged.owner);
    if (merged.overdue) sp.set("overdue", merged.overdue);
    if (merged.page && merged.page !== "1") sp.set("page", merged.page);
    const s = sp.toString();
    return `/systems/complaints${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Complaints</h1>
          <p className="small">
            {access.brandLimited
              ? "Complaints about the brands you work on. You can read them and add notes; customer care works and closes them."
              : "Every complaint gets a case number, an owner and targets from its severity. Website complaints land here at New."}
          </p>
        </div>
        {access.works && (
          <div className="head-actions">
            <Link className="btn" href="/systems/complaints/new">Log a complaint</Link>
          </div>
        )}
      </div>

      {params.deleted && <div className="alert ok" role="status">The complaint was deleted.</div>}

      <nav className="pipeline complaint-counts" aria-label="Complaints by status">
        {counts.map((s) => (
          <Link key={s.value} href={href({ status: s.value, overdue: "", page: "1" })} className={`pipe c-${s.value}`}
            aria-current={status === s.value && !overdue ? "page" : undefined}>
            <b>{s.failed ? "?" : s.count}</b>
            <span>{s.label}</span>
          </Link>
        ))}
        <Link href={href({ status: "open", overdue: "1", page: "1" })} className="pipe c-overdue" aria-current={overdue ? "page" : undefined}>
          <b>{overdueRes.error ? "?" : overdueRes.count ?? 0}</b>
          <span>Overdue</span>
        </Link>
      </nav>

      <form className="filters complaint-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Case number, name or phone" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="open">Open complaints</option>
            <option value="all">All statuses</option>
            {COMPLAINT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="severity">Severity</label>
          <select id="severity" name="severity" defaultValue={severity}>
            <option value="">Any severity</option>
            {COMPLAINT_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={brand}>
            <option value="">Any brand</option>
            {access.visibleBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category}>
            <option value="">Any category</option>
            {COMPLAINT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="owner">Owner</label>
          <select id="owner" name="owner" defaultValue={owner}>
            <option value="">Anyone</option>
            {access.works && <option value="mine">Mine</option>}
            <option value="unassigned">Unassigned</option>
            {owners.filter((s) => s.id !== access.userId).map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
          </select>
        </div>
        <label className="check-inline">
          <input type="checkbox" name="overdue" value="1" defaultChecked={overdue} /> Overdue only
        </label>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/complaints">Clear</Link>}
        </div>
      </form>

      {error || searchFailed ? (
        <div className="alert error" role="alert">We could not load the complaints. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No complaints match" : "No open complaints"}</b>
          <span>
            {filtered
              ? "Try another search or clear the filters."
              : access.works
                ? "Log one with Log a complaint. Website complaints land here automatically."
                : "Nothing to follow up for your brands right now."}
          </span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "complaint" : "complaints"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Case</th><th scope="col">Status</th><th scope="col">Severity</th><th scope="col">Brand</th><th scope="col">Owner</th><th scope="col">Resolve by</th></tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const late = isComplaintOverdue(c, now);
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/systems/complaints/${c.id}`} className="pname mono">{c.case_number}</Link>
                        <span className="hint">{c.contact ? crmContactName(c.contact) : ""}{c.contact ? ", " : ""}{complaintCategoryLabel(c.category)}</span>
                      </td>
                      <td data-label="Status"><span className={`badge cstatus c-${c.status}`}>{complaintStatusLabel(c.status)}</span></td>
                      <td data-label="Severity"><span className={`badge sev-${c.severity}`}>{complaintSeverityLabel(c.severity)}</span></td>
                      <td data-label="Brand">{brandName.get(c.brand_id) ?? ""}</td>
                      <td data-label="Owner">{c.owner_id ? (c.owner_id === access.userId ? "Me" : staffName(access, c.owner_id)) : <span className="small">Unassigned</span>}</td>
                      <td data-label="Resolve by">
                        <span className={late ? "overdue" : ""}>{formatDate(c.resolution_due_at)}{late ? " (overdue)" : ""}</span>
                        <span className="hint">Received {formatDate(c.created_at)}</span>
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
