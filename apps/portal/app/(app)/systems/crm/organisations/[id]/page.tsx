import Link from "next/link";
import { notFound } from "next/navigation";
import { crmContactName, crmOrgKindLabel, crmStageLabel, type CrmActivity, type CrmOrganisation, type CrmStage } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import ActivityForm from "@/components/crm/ActivityForm";
import CrmTabs from "@/components/crm/CrmTabs";
import OrganisationForm from "@/components/crm/OrganisationForm";
import OwnerControl from "@/components/crm/OwnerControl";
import Timeline from "@/components/crm/Timeline";
import { formatDate, formatDateTime, getCrmAccess, NO_CRM_ACCESS, staffName, UUID } from "@/lib/crm";
import { reassignChoices, stockistOptions } from "@/lib/crm-data";
import { createClient } from "@/lib/supabase/server";
import { deleteRecord } from "../../actions";

export const metadata = { title: "Organisation | Lexta Business System" };

const COLUMNS = "id, name, kind, region_id, town, address, phone, email, website, stockist_id, notes, owner_id, created_at, updated_at, created_by, updated_by";

export default async function OrganisationPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>Organisation</h1><p className="small">{NO_CRM_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: org, error } = await supabase.from("crm_organisations").select(COLUMNS).eq("id", id).maybeSingle<CrmOrganisation>();
  if (error) throw new Error("Could not load the organisation");
  if (!org) notFound();

  const [linksRes, contactsRes, leadsRes, activitiesRes, stockists] = await Promise.all([
    supabase.from("crm_organisation_brands").select("brand_id").eq("organisation_id", id),
    supabase.from("crm_contacts").select("id, full_name, email, phone, job_title").eq("organisation_id", id).order("full_name").limit(200),
    supabase.from("crm_leads").select("id, title, stage, next_action_date").eq("organisation_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("crm_activities").select("id, type, body, occurred_at, created_by").eq("organisation_id", id).order("occurred_at", { ascending: false }).limit(200),
    stockistOptions(supabase, org.stockist_id),
  ]);
  if (linksRes.error || contactsRes.error || leadsRes.error || activitiesRes.error) throw new Error("Could not load the organisation");
  const linked = (linksRes.data ?? []).map((l) => l.brand_id as string);
  const contacts = (contactsRes.data ?? []) as { id: string; full_name: string | null; email: string | null; phone: string | null; job_title: string | null }[];
  const leads = (leadsRes.data ?? []) as { id: string; title: string; stage: CrmStage; next_action_date: string | null }[];
  const productBrands = access.allBrands.filter((b) => !b.is_corporate);
  const region = access.regions.find((r) => r.id === org.region_id);
  const nameOf = (who: string | null) => (who ? (who === access.userId ? "you" : staffName(access, who)) : "the website");

  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/organisations">CRM</Link> / Organisations</p>
      <div className="page-head">
        <div>
          <h1>{org.name}</h1>
          <p className="small">
            {crmOrgKindLabel(org.kind)}{[org.town, region?.name].filter(Boolean).length ? `, ${[org.town, region?.name].filter(Boolean).join(", ")}` : ""}
            {". "}
            {linked.length ? `Brands: ${linked.map((b) => productBrands.find((p) => p.id === b)?.name).filter(Boolean).join(", ")}` : "No brand, shared with every team"}
          </p>
          <div className="quick-actions">
            {org.phone && <a className="btn small light" href={`tel:${org.phone.replace(/[^+0-9]/g, "")}`}>Call</a>}
            {org.email && <a className="btn small light" href={`mailto:${org.email}`}>Email</a>}
            {org.website && <a className="btn small light" href={org.website} target="_blank" rel="noopener noreferrer">Website</a>}
            {org.stockist_id && <Link className="btn small light" href={`/systems/stockists/${org.stockist_id}`}>Stockist listing</Link>}
          </div>
        </div>
        <OwnerControl
          kind="organisation" id={org.id} ownerId={org.owner_id}
          ownerName={org.owner_id === access.userId ? "You" : staffName(access, org.owner_id)}
          canAssignToMe={false} canReassign={access.manages} staff={reassignChoices(access)}
        />
      </div>
      <CrmTabs active="organisations" />

      {flags.created && <div className="alert ok" role="status">Organisation added.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The organisation could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}
      {flags.error === "linked" && <div className="alert error" role="alert">This organisation still has leads. Move or delete those leads first.</div>}
      {!access.canEdit && <div className="alert info" role="note">You can read this organisation, add to its timeline and create contacts and leads for it. Your role cannot change it.</div>}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>Contacts</h2>
              <Link className="btn small light" href={`/systems/crm/contacts/new?organisation=${org.id}`}>New contact</Link>
            </div>
            {contacts.length === 0 ? <p className="small">No contacts yet.</p> : (
              <ul className="mini-list">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <Link href={`/systems/crm/contacts/${c.id}`}>{crmContactName(c)}</Link>
                    {c.job_title && <span className="small">{c.job_title}</span>}
                    {c.phone && <a className="small" href={`tel:${c.phone.replace(/[^+0-9]/g, "")}`}>{c.phone}</a>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Leads</h2>
              <Link className="btn small" href={`/systems/crm/leads/new?organisation=${org.id}`}>New lead</Link>
            </div>
            {leads.length === 0 ? <p className="small">No leads you can see.</p> : (
              <ul className="mini-list">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/systems/crm/leads/${l.id}`}>{l.title}</Link>
                    <span className={`badge stage s-${l.stage}`}>{crmStageLabel(l.stage)}</span>
                    {l.next_action_date && <span className="small">Next {formatDate(l.next_action_date)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel">
            <h2>Timeline</h2>
            <ActivityForm kind="organisation" id={org.id} />
            <Timeline items={(activitiesRes.data ?? []) as CrmActivity[]} nameOf={nameOf} formatWhen={formatDateTime} />
          </section>
        </div>
        <div>
          <h2 className="section-title">{access.canEdit ? "Edit organisation" : "Organisation details"}</h2>
          <OrganisationForm
            mode={access.canEdit ? "edit" : "view"}
            organisation={org}
            regions={access.regions}
            stockists={stockists}
            productBrands={productBrands.map((b) => ({ id: b.id, label: b.name }))}
            myBrandIds={access.canEdit ? productBrands.filter((b) => access.myBrandIds.has(b.id)).map((b) => b.id) : []}
            linked={linked}
          />
          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete organisation</h2>
              <p className="small">Removes the organisation and its timeline for good. Its contacts stay, without an organisation. An organisation with leads cannot be deleted until the leads are moved or deleted.</p>
              <form action={deleteRecord.bind(null, "organisation", org.id)}>
                <ConfirmButton className="btn danger" message={`Delete ${org.name} for good? This cannot be undone.`}>Delete organisation</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
