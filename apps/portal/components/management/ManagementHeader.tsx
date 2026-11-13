import { Select } from "@lexta/ui";
import Link from "next/link";
import { DASHBOARD_PRESETS, formatRangeDay } from "@/lib/dashboard";
import { MANAGEMENT_TABS, managementHref, type ManagementFilters } from "@/lib/management";

export type BrandOption = { id: string; name: string; is_active: boolean };

/**
 * The top of every management page: the title, the period presets, the date and brand filter, and the tabs. The
 * period and brand travel with every tab link, so they stay set when moving between tabs. `keep` holds the page's own
 * filters (the activity feed's system and person) so Apply does not drop them.
 */
export default function ManagementHeader({ path, title, intro, f, brands, keep = {} }: {
  path: string; title: string; intro: string; f: ManagementFilters; brands: BrandOption[]; keep?: Record<string, string>;
}) {
  const brandName = f.brand ? brands.find((b) => b.id === f.brand)?.name ?? "" : "";
  const period = `${formatRangeDay(f.from)} to ${formatRangeDay(f.to)}`;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="small">{intro} Showing {period}{brandName ? `, ${brandName} only` : ", every brand"}.</p>
        </div>
      </div>

      <nav className="crm-tabs mgmt-tabs" aria-label="Management overview">
        {MANAGEMENT_TABS.map((t) => (
          <Link key={t.href} href={managementHref(t.href, f)} aria-current={t.href === path ? "page" : undefined}>{t.label}</Link>
        ))}
      </nav>

      <nav className="dash-presets" aria-label="Period">
        {DASHBOARD_PRESETS.map((p) => (
          <Link key={p.value} className="btn small light" href={managementHref(path, { range: p.value, brand: f.brand }, keep)}
            aria-current={f.range === p.value ? "page" : undefined}>{p.label}</Link>
        ))}
      </nav>
      {/* Keyed on the filters: the inputs are uncontrolled, so a client side change of address (Clear, a preset) must
          give a fresh form, or the old brand and dates would stay showing. */}
      <form key={`${f.from}|${f.to}|${f.brand}`} className="filters dash-filters" method="get" action={path} role="search" aria-label="Overview filters">
        {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={f.from} required />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={f.to} required />
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <Select id="brand" name="brand" defaultValue={f.brand}>
            <option value="">Every brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}{b.is_active ? "" : " (switched off)"}</option>)}
          </Select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {(f.range !== "30d" || f.brand) && <Link className="btn light" href={managementHref(path, { range: "30d", brand: "" }, keep)}>Clear</Link>}
        </div>
      </form>
    </>
  );
}
