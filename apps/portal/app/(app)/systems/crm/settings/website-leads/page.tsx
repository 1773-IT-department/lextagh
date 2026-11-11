import Link from "next/link";
import type { CrmStaff, CrmWebsiteLeadManager, CrmWebsiteLeadManagerChange } from "@lexta/db";
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
  const [settingsRes, historyRes, linksRes] = await Promise.all([
    supabase.from("crm_website_lead_managers").select("id, brand_id, manager_id, created_at, updated_at, updated_by"),
    supabase.from("crm_website_lead_manager_changes")
      .select("id, scope, brand_id, brand_name, old_manager_id, old_manager_name, new_manager_id, new_manager_name, reason, changed_by, changed_by_name, created_at, updated_at")
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(HISTORY_LIMIT),
    supabase.from("profile_brands").select("profile_id, brand_id"),
  ]);
  if (settingsRes.error) throw new Error("Could not load the website lead managers");
  if (historyRes.error) throw new Error("Could not load the change history");
  if (linksRes.error) throw new Error("Could not load brand access");

  const settings = (settingsRes.data ?? []) as CrmWebsiteLeadManager[];
  const history = (historyRes.data ?? []) as CrmWebsiteLeadManagerChange[];
  const brandLinks = new Map<string, Set<string>>();
  for (const l of (linksRes.data ?? []) as { profile_id: string; brand_id: string }[]) {
    if (!brandLinks.has(l.profile_id)) brandLinks.set(l.profile_id, new Set());
    brandLinks.get(l.profile_id)!.add(l.brand_id);
  }

  const label = (s: CrmStaff) => `${s.display_name} (${roleLabel(s.role)})`;
  const byId = new Map(access.staff.map((s) => [s.id, s]));

  /** The people who may manage leads of this brand (null: every brand), plus the saved one if they no longer qualify. */
  const picker = (brandId: string | null, current: string | null) => {
    const options = access.staff.filter((s) => canManageWebsiteLeads(s, brandId, brandLinks)).map((s) => ({ id: s.id, label: label(s) }));
    let warning: string | undefined;
    if (current && !options.some((o) => o.id === current)) {
      const person = byId.get(current);
      const name = person?.display_name ?? "A former team member";
      warning = `${name} can no longer manage these leads (switched off, role changed or no access to the brand), so ${brandId ? "the default manager" : "nobody"} gets them now. Choose someone else.`;
      options.unshift({ id: current, label: `${name} (cannot manage these leads now)` });
    }
    return { options, warning };
  };

  const defaultSetting = settings.find((s) => s.brand_id === null);
  const defaultCurrent = defaultSetting?.manager_id ?? "";
  const defaultPicker = picker(null, defaultCurrent || null);

  const brands: BrandRow[] = access.allBrands.map((b) => {
    const current = settings.find((s) => s.brand_id === b.id)?.manager_id ?? "";
    const p = picker(b.id, current || null);
    return { id: b.id, name: b.name, current, options: p.options, warning: p.warning };
  });

  const describe = (h: CrmWebsiteLeadManagerChange) => {
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
        Choose who looks after leads that come in from the websites (contact form, partner form, newsletter and live chat).
        A new website lead without an owner goes to its brand&apos;s manager, otherwise to the default manager, otherwise it stays
        unassigned. If a manager is switched off or loses access, their leads go to the next choice automatically. Leads that
        already exist keep their owner; reassign them on the lead itself.
      </p>

      <WebsiteLeadManagersForm
        defaultCurrent={defaultCurrent}
        defaultOptions={defaultPicker.options}
        defaultWarning={defaultPicker.warning}
        brands={brands}
      />

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
