import Link from "next/link";
import type { CrmStaff, CrmWebsiteLeadManager, CrmWebsiteLeadManagerChange } from "@lexta/db";
import ClearBrandManagerButton from "@/components/crm/ClearBrandManagerButton";
import WebsiteLeadManagersForm, { type BrandRow } from "@/components/crm/WebsiteLeadManagersForm";
import { formatDateTime, getCrmAccess } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";
import { canManageWebsiteLeads, roleLabel } from "@/lib/website-lead-managers";

export const metadata = { title: "Website lead managers | Lexta Business System" };

const HISTORY_LIMIT = 30;

export default async function WebsiteLeadManagersPage() {
  const access = await getCrmAccess();
  if (!access.isAdmin) {
    return (
      <>
        <p className="crumbs"><Link href="/systems/crm/leads">CRM</Link> / Settings</p>
        <h1>Website lead managers</h1>
        <div className="alert error" role="alert">Only admins can choose who manages website leads. Ask your Lexta administrator if something needs to change.</div>
      </>
    );
  }

  const supabase = await createClient();
  const [settingsRes, historyRes, linksRes, offBrandsRes] = await Promise.all([
    supabase.from("crm_website_lead_managers").select("id, brand_id, manager_id, created_at, updated_at, updated_by"),
    supabase.from("crm_website_lead_manager_changes")
      .select("id, scope, brand_id, brand_name, old_manager_id, old_manager_name, new_manager_id, new_manager_name, reason, changed_by, changed_by_name, created_at, updated_at")
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(HISTORY_LIMIT),
    supabase.from("profile_brands").select("profile_id, brand_id"),
    supabase.from("brands").select("id, name").eq("is_active", false).order("name"),
  ]);
  if (settingsRes.error) throw new Error("Could not load the website lead managers");
  if (historyRes.error) throw new Error("Could not load the change history");
  if (linksRes.error) throw new Error("Could not load brand access");
  if (offBrandsRes.error) throw new Error("Could not load brands");

  const settings = (settingsRes.data ?? []) as CrmWebsiteLeadManager[];
  const history = (historyRes.data ?? []) as CrmWebsiteLeadManagerChange[];
  const brandLinks = new Map<string, Set<string>>();
  for (const l of (linksRes.data ?? []) as { profile_id: string; brand_id: string }[]) {
    if (!brandLinks.has(l.profile_id)) brandLinks.set(l.profile_id, new Set());
    brandLinks.get(l.profile_id)!.add(l.brand_id);
  }

  const label = (s: CrmStaff) => `${s.display_name} (${roleLabel(s.role)})`;
  const byId = new Map(access.staff.map((s) => [s.id, s]));

  const defaultSetting = settings.find((s) => s.brand_id === null);
  const defaultCurrent = defaultSetting?.manager_id ?? "";
  const defaultPerson = defaultCurrent ? byId.get(defaultCurrent) : undefined;
  // Who gets a brand's leads when its own manager is skipped: the default manager while they qualify, else nobody.
  const fallback = defaultPerson && canManageWebsiteLeads(defaultPerson, null, brandLinks)
    ? `the default manager (${defaultPerson.display_name}) gets them now`
    : "they stay unassigned now, because no default manager is set";

  /** The people who may manage leads of this brand (null: every brand), plus the saved one if they no longer qualify. */
  const picker = (brandId: string | null, current: string | null) => {
    const options = access.staff.filter((s) => canManageWebsiteLeads(s, brandId, brandLinks)).map((s) => ({ id: s.id, label: label(s) }));
    let warning: string | undefined;
    if (current && !options.some((o) => o.id === current)) {
      const person = byId.get(current);
      const name = person?.display_name ?? "A former team member";
      warning = `${name} can no longer manage these leads (switched off, role changed or no access to the brand), so ${brandId ? fallback : "website leads without a brand manager stay unassigned now"}. Choose someone else.`;
      options.unshift({ id: current, label: `${name} (cannot manage these leads now)` });
    }
    return { options, warning };
  };

  const defaultPicker = picker(null, defaultCurrent || null);

  const brands: BrandRow[] = access.allBrands.map((b) => {
    const current = settings.find((s) => s.brand_id === b.id)?.manager_id ?? "";
    const p = picker(b.id, current || null);
    return { id: b.id, name: b.name, current, options: p.options, warning: p.warning };
  });

  // Settings of brands that are switched off: no picker, but they still apply to a lead that arrives with that brand.
  const offBrands = (offBrandsRes.data ?? []) as { id: string; name: string }[];
  const offSettings = offBrands.flatMap((b) => {
    const s = settings.find((x) => x.brand_id === b.id);
    return s ? [{ brand: b, manager: s.manager_id ? byId.get(s.manager_id)?.display_name ?? "A former team member" : "Nobody (their account was removed)" }] : [];
  });

  const describe = (h: CrmWebsiteLeadManagerChange) => {
    if (h.reason === "brand_deleted") return `Brand ${h.brand_name ?? ""} was deleted, so its manager setting (${h.old_manager_name ?? "a former team member"}) went with it.`;
    const before = h.old_manager_name ?? "A former team member";
    if (h.reason === "manager_deleted") {
      return `${before} was removed from the system, so ${h.scope === "default" ? "website leads stay unassigned" : "this brand uses the default"} until someone is chosen.`;
    }
    if (!h.old_manager_id && !h.old_manager_name) return `Set to ${h.new_manager_name ?? "a former team member"}.`;
    if (!h.new_manager_id && !h.new_manager_name) {
      return `${before} removed. ${h.scope === "default" ? "Website leads without a brand manager stay unassigned." : "Uses the default manager."}`;
    }
    return `${before} changed to ${h.new_manager_name ?? "a former team member"}.`;
  };
  const where = (h: CrmWebsiteLeadManagerChange) => (h.scope === "default" ? "Default manager" : h.brand_name ?? "A removed brand");

  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/leads">CRM</Link> / Settings</p>
      <h1>Website lead managers</h1>
      <p className="small">
        Choose who looks after leads that come in from the websites: leads the contact and partner forms create, and leads
        made from a live chat. Such a lead goes to its brand&apos;s manager, otherwise to the default manager, otherwise it stays
        unassigned. Leads someone creates by hand keep the owner they chose. If a manager is switched off or loses access, their leads go to the next choice automatically. Leads that
        already exist keep their owner; reassign them on the lead itself.
      </p>

      <WebsiteLeadManagersForm
        defaultCurrent={defaultCurrent}
        defaultOptions={defaultPicker.options}
        defaultWarning={defaultPicker.warning}
        brands={brands}
      />

      {offSettings.length > 0 && (
        <section className="panel">
          <h2>Brands that are switched off</h2>
          <p className="small">These brands are not active, so they have no picker above, but their manager still gets any website lead that arrives with that brand.</p>
          <ul className="mini-list">
            {offSettings.map(({ brand, manager }) => (
              <li key={brand.id}>
                <span><b>{brand.name}</b>: {manager}</span>
                <ClearBrandManagerButton brandId={brand.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2>Recent changes</h2>
        {history.length === 0 ? (
          <p className="small">No changes yet.</p>
        ) : (
          <ul className="timeline">
            {history.map((h) => (
              <li key={h.id}>
                <div className="t-head">
                  <b>{where(h)}</b>{" "}
                  <span className="small">{formatDateTime(h.created_at)}</span>
                </div>
                <div className="t-body">
                  {describe(h)}
                  {h.reason === "changed" && <span className="small">{` By ${h.changed_by_name ?? "the system"}.`}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {history.length === HISTORY_LIMIT && <p className="small">Showing the last {HISTORY_LIMIT} changes.</p>}
      </section>
    </>
  );
}
