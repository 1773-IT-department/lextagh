import Link from "next/link";
import { CRM_ORG_KINDS, crmOrgKindLabel, type CrmOrgKind } from "@lexta/db";
import CrmTabs from "@/components/crm/CrmTabs";
import { cleanSearch, getCrmAccess, NO_CRM_ACCESS, PAGE_SIZE, staffName } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Organisations | Lexta Business System" };

type Search = { q?: string; kind?: string; brand?: string; region?: string; owner?: string; page?: string; deleted?: string };
type Row = {
  id: string; name: string; kind: CrmOrgKind; town: string | null; owner_id: string | null;
  region: { name: string } | { name: string }[] | null;
  links: { brand_id: string }[];
};

export default async function OrganisationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>CRM</h1><p className="small">{NO_CRM_ACCESS}</p></>);

  const productBrands = access.allBrands.filter((b) => !b.is_corporate);
  const q = cleanSearch(params.q, 80);
  const kind = CRM_ORG_KINDS.some((k) => k.value === params.kind) ? params.kind! : "";
  const brand = productBrands.some((b) => b.id === params.brand) ? params.brand! : "";
  const region = access.regions.some((r) => r.id === params.region) ? params.region! : "";
  const owner = params.owner === "mine" || params.owner === "unassigned" ? params.owner : "";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = !!(q || kind || brand || region || owner);

  const supabase = await createClient();
  // "links" lists every brand; "match" (inner join) only narrows the rows to one brand.
  const select = `id, name, kind, town, owner_id, region:regions(name), links:crm_organisation_brands(brand_id)${brand ? ", match:crm_organisation_brands!inner(brand_id)" : ""}`;
  let query = supabase.from("crm_organisations").select(select, { count: "exact" });
  if (brand) query = query.eq("match.brand_id", brand);
  if (kind) query = query.eq("kind", kind);
  if (region) query = query.eq("region_id", region);
  if (owner === "mine") query = query.eq("owner_id", access.userId);
  else if (owner === "unassigned") query = query.is("owner_id", null);
  if (q) query = query.or(`name.ilike.*${q}*,town.ilike.*${q}*`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.order("name").order("id").range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[crm] organisations list failed", error);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const brandName = new Map(access.allBrands.map((b) => [b.id, b.name]));
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (kind) sp.set("kind", kind);
    if (brand) sp.set("brand", brand);
    if (region) sp.set("region", region);
    if (owner) sp.set("owner", owner);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/systems/crm/organisations${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>CRM</h1>
          <p className="small">Distributors, retailers, institutions, partners, media and suppliers. You see those of your brands, those with no brand, and those you own.</p>
        </div>
        {access.canCreateOrg && <div className="head-actions"><Link className="btn" href="/systems/crm/organisations/new">New organisation</Link></div>}
      </div>
      <CrmTabs active="organisations" />
      {params.deleted && <div className="alert ok" role="status">The organisation was deleted.</div>}

      <form className="filters crm-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name or town" />
        </div>
        <div className="field">
          <label htmlFor="kind">Kind</label>
          <select id="kind" name="kind" defaultValue={kind}>
            <option value="">Any kind</option>
            {CRM_ORG_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={brand}>
            <option value="">Any brand</option>
            {productBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="region">Region</label>
          <select id="region" name="region" defaultValue={region}>
            <option value="">Any region</option>
            {access.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="owner">Owner</label>
          <select id="owner" name="owner" defaultValue={owner}>
            <option value="">Anyone</option>
            <option value="mine">Mine</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/crm/organisations">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the organisations. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No organisations match" : "No organisations yet"}</b>
          <span>{filtered ? "Try another search or clear the filters." : access.canCreateOrg ? "Add one with New organisation." : "Organisations will appear here once the sales or marketing team adds them."}</span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "organisation" : "organisations"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead><tr><th scope="col">Organisation</th><th scope="col">Kind</th><th scope="col">Region</th><th scope="col">Brands</th><th scope="col">Owner</th></tr></thead>
              <tbody>
                {rows.map((o) => {
                  const reg = Array.isArray(o.region) ? o.region[0] : o.region;
                  return (
                    <tr key={o.id}>
                      <td>
                        <Link className="pname" href={`/systems/crm/organisations/${o.id}`}>{o.name}</Link>
                        {o.town && <span className="hint">{o.town}</span>}
                      </td>
                      <td data-label="Kind">{crmOrgKindLabel(o.kind)}</td>
                      <td data-label="Region">{reg?.name ?? <span className="small">Not set</span>}</td>
                      <td data-label="Brands">{o.links.map((l) => brandName.get(l.brand_id)).filter(Boolean).join(", ") || <span className="small">No brand</span>}</td>
                      <td data-label="Owner">{o.owner_id ? (o.owner_id === access.userId ? "Me" : staffName(access, o.owner_id)) : <span className="small">Unassigned</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn small light" href={pageHref(page - 1)}>Previous</Link> : <span />}
              <span className="small">Page {page} of {pages}</span>
              {page < pages ? <Link className="btn small light" href={pageHref(page + 1)}>Next</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </>
  );
}
