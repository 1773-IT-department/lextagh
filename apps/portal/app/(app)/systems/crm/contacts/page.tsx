import Link from "next/link";
import { crmChannelLabel, crmContactName } from "@lexta/db";
import CrmTabs from "@/components/crm/CrmTabs";
import { cleanSearch, getCrmAccess, NO_CRM_ACCESS, PAGE_SIZE, staffName } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Contacts | Lexta Business System" };

type Search = { q?: string; consent?: string; owner?: string; page?: string; deleted?: string };
type Row = {
  id: string; full_name: string | null; email: string | null; phone: string | null; job_title: string | null;
  preferred_channel: string | null; consent_marketing: boolean; owner_id: string | null;
  organisation: { name: string } | { name: string }[] | null;
};

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>CRM</h1><p className="small">{NO_CRM_ACCESS}</p></>);

  const q = cleanSearch(params.q, 80);
  const consent = params.consent === "yes" || params.consent === "no" ? params.consent : "";
  const owner = params.owner === "mine" || params.owner === "unassigned" ? params.owner : "";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = !!(q || consent || owner);

  const supabase = await createClient();
  let query = supabase.from("crm_contacts")
    .select("id, full_name, email, phone, job_title, preferred_channel, consent_marketing, owner_id, organisation:crm_organisations!crm_contacts_organisation_id_fkey(name)", { count: "exact" });
  if (q) {
    // Same rule as public.crm_phone_key (0007): drop leading zeros, a leading 233, then leading zeros again.
    const digits = q.replace(/[^0-9]/g, "").replace(/^0+/, "").replace(/^233/, "").replace(/^0+/, "");
    query = query.or([`full_name.ilike.*${q}*`, `email.ilike.*${q}*`, `phone.ilike.*${q}*`, ...(digits.length >= 4 ? [`phone_key.ilike.*${digits}*`] : [])].join(","));
  }
  if (consent) query = query.eq("consent_marketing", consent === "yes");
  if (owner === "mine") query = query.eq("owner_id", access.userId);
  else if (owner === "unassigned") query = query.is("owner_id", null);
  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.order("full_name", { nullsFirst: false }).order("id").range(from, from + PAGE_SIZE - 1);
  if (error) console.error("[crm] contacts list failed", error);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (consent) sp.set("consent", consent);
    if (owner) sp.set("owner", owner);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/systems/crm/contacts${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>CRM</h1>
          <p className="small">People we deal with: buyers, owners, partners and website visitors who wrote in. Contacts are shared by every team.</p>
        </div>
        <div className="head-actions"><Link className="btn" href="/systems/crm/contacts/new">New contact</Link></div>
      </div>
      <CrmTabs active="contacts" />
      {params.deleted && <div className="alert ok" role="status">The contact was deleted.</div>}

      <form className="filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, email or phone" />
        </div>
        <div className="field">
          <label htmlFor="consent">Marketing consent</label>
          <select id="consent" name="consent" defaultValue={consent}>
            <option value="">Any</option>
            <option value="yes">Agreed</option>
            <option value="no">Not agreed</option>
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
          {filtered && <Link className="btn light" href="/systems/crm/contacts">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the contacts. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No contacts match" : "No contacts yet"}</b>
          <span>{filtered ? "Try another search or clear the filters." : "Add one with New contact. Website enquiries and newsletter sign ups will also appear here once the forms are connected."}</span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "contact" : "contacts"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead><tr><th scope="col">Contact</th><th scope="col">Phone</th><th scope="col">Email</th><th scope="col">Prefers</th><th scope="col">Consent</th><th scope="col">Owner</th></tr></thead>
              <tbody>
                {rows.map((c) => {
                  const org = Array.isArray(c.organisation) ? c.organisation[0] : c.organisation;
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link className="pname" href={`/systems/crm/contacts/${c.id}`}>{crmContactName(c)}</Link>
                        {(c.job_title || org?.name) && <span className="hint">{[c.job_title, org?.name].filter(Boolean).join(", ")}</span>}
                      </td>
                      <td data-label="Phone">{c.phone ?? <span className="small">None</span>}</td>
                      <td data-label="Email">{c.email ?? <span className="small">None</span>}</td>
                      <td data-label="Prefers">{crmChannelLabel(c.preferred_channel) || <span className="small">Not known</span>}</td>
                      <td data-label="Consent"><span className={`badge ${c.consent_marketing ? "on" : "off"}`}>{c.consent_marketing ? "Agreed" : "No"}</span></td>
                      <td data-label="Owner">{c.owner_id ? (c.owner_id === access.userId ? "Me" : staffName(access, c.owner_id)) : <span className="small">Unassigned</span>}</td>
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
