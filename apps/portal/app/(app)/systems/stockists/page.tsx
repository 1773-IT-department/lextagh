import Link from "next/link";
import { OUTLET_TYPES, outletTypeLabel, type OutletType } from "@lexta/db";
import { canEditStockist, getStockistAccess } from "@/lib/stockists";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Stockists | Lexta Business System" };

const PAGE_SIZE = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type Row = {
  id: string;
  name: string;
  outlet_type: OutletType;
  town: string;
  address: string | null;
  latitude: number | null;
  is_active: boolean;
  created_by: string | null;
  updated_at: string;
  region: { name: string } | { name: string }[] | null;
  links: { brand_id: string }[];
};

type Search = { q?: string; region?: string; town?: string; type?: string; brand?: string; status?: string; page?: string; deleted?: string };

/** Characters that are safe inside a PostgREST filter value. */
const clean = (v: string | undefined, max: number) => (v ?? "").replace(/[^\p{L}\p{N} '-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);

export default async function StockistsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getStockistAccess();
  if (!access.canView) {
    return (
      <>
        <h1>Stockists</h1>
        <p className="small">Your role does not include this system. Ask your Lexta administrator if you need it.</p>
      </>
    );
  }

  const q = clean(params.q, 80);
  const town = clean(params.town, 80);
  const region = params.region && UUID.test(params.region) && access.regions.some((r) => r.id === params.region) ? params.region : "";
  const type = OUTLET_TYPES.some((o) => o.value === params.type) ? (params.type as OutletType) : "";
  const brand = params.brand && access.allBrands.some((b) => b.id === params.brand) ? params.brand : "";
  const status = params.status === "active" || params.status === "inactive" ? params.status : "";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = !!(q || town || region || type || brand || status);

  const supabase = await createClient();
  // "links" lists every brand the shop carries; "match" (inner join) only narrows the rows to one brand.
  const select = `id, name, outlet_type, town, address, latitude, is_active, created_by, updated_at, region:regions(name), links:stockist_brands(brand_id)${brand ? ", match:stockist_brands!inner(brand_id)" : ""}`;
  let query = supabase.from("stockists").select(select, { count: "exact" });
  if (brand) query = query.eq("match.brand_id", brand);
  if (region) query = query.eq("region_id", region);
  if (type) query = query.eq("outlet_type", type);
  if (status) query = query.eq("is_active", status === "active");
  if (town) query = query.ilike("town", `*${town}*`);
  if (q) query = query.or(`name.ilike.*${q}*,town.ilike.*${q}*,address.ilike.*${q}*`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.order("name").order("town").order("id").range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[stockists] list failed", error);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const brandName = new Map(access.allBrands.map((b) => [b.id, b.name]));
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (town) sp.set("town", town);
    if (region) sp.set("region", region);
    if (type) sp.set("type", type);
    if (brand) sp.set("brand", brand);
    if (status) sp.set("status", status);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/systems/stockists${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Stockists</h1>
          <p className="small">
            Shops, supermarkets, pharmacies, markets and distributors that carry our brands. Active stockists appear on Where to Buy.
            {!access.canCreate && " Your role can view stockists but not change them."}
          </p>
        </div>
        {access.canCreate && (
          <div className="head-actions">
            <Link className="btn light" href="/systems/stockists/import">Import CSV</Link>
            <Link className="btn" href="/systems/stockists/new">New stockist</Link>
          </div>
        )}
      </div>

      {params.deleted && <div className="alert ok" role="status">The stockist was deleted.</div>}

      <form className="filters stockist-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Shop, town or address" />
        </div>
        <div className="field">
          <label htmlFor="region">Region</label>
          <select id="region" name="region" defaultValue={region}>
            <option value="">All regions</option>
            {access.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="town">Town</label>
          <input id="town" name="town" defaultValue={town} placeholder="Any town" />
        </div>
        <div className="field">
          <label htmlFor="type">Outlet type</label>
          <select id="type" name="type" defaultValue={type}>
            <option value="">Any type</option>
            {OUTLET_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={brand}>
            <option value="">Any brand</option>
            {access.allBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="">Any</option>
            <option value="active">On Where to Buy</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/stockists">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the stockists. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No stockists match" : "No stockists yet"}</b>
          <span>
            {filtered
              ? "Try another search or clear the filters."
              : access.canCreate
                ? "Add shops one by one with New stockist, or load Lexta's list in one go with Import CSV."
                : "Stockists will appear here once the sales or marketing team adds them."}
          </span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">
            {total} {total === 1 ? "stockist" : "stockists"}{pages > 1 && `, page ${page} of ${pages}`}
          </p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Stockist</th><th scope="col">Region</th><th scope="col">Town</th><th scope="col">Brands</th><th scope="col">Map</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const reg = Array.isArray(s.region) ? s.region[0] : s.region;
                  const brandIds = s.links.map((l) => l.brand_id);
                  const editable = canEditStockist(access, { created_by: s.created_by, brandIds });
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/systems/stockists/${s.id}`} className="pname">{s.name}</Link>
                        <span className="hint">{outletTypeLabel(s.outlet_type)}{s.address ? `, ${s.address}` : ""}</span>
                      </td>
                      <td data-label="Region">{reg?.name ?? ""}</td>
                      <td data-label="Town">{s.town}</td>
                      <td data-label="Brands">{brandIds.map((id) => brandName.get(id)).filter(Boolean).join(", ") || <span className="small">None yet</span>}</td>
                      <td data-label="Map">{s.latitude !== null ? "Set" : <span className="small">Not set</span>}</td>
                      <td data-label="Status">
                        <span className={`badge ${s.is_active ? "on" : "off"}`}>{s.is_active ? "On Where to Buy" : "Deactivated"}</span>
                        {access.canCreate && !editable && <span className="hint">View only for you</span>}
                      </td>
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
