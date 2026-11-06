import Link from "next/link";
import { notFound } from "next/navigation";
import { crmContactName, crmSourceLabel, crmStageLabel, type CrmActivity, type CrmLead } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import ActivityForm from "@/components/crm/ActivityForm";
import CrmTabs from "@/components/crm/CrmTabs";
import LeadForm from "@/components/crm/LeadForm";
import OwnerControl from "@/components/crm/OwnerControl";
import StageForm from "@/components/crm/StageForm";
import Timeline from "@/components/crm/Timeline";
import { formatDate, formatDateTime, getCrmAccess, leadBrandChoices, leadPermissions, NO_CRM_ACCESS, staffName, UUID } from "@/lib/crm";
import { contactOptions, organisationOptions, reassignChoices } from "@/lib/crm-data";
import { createClient } from "@/lib/supabase/server";
import { deleteRecord } from "../../actions";

export const metadata = { title: "Lead | Lexta Business System" };

const LEAD_COLUMNS =
  "id, title, description, contact_id, organisation_id, brand_id, source, stage, lost_reason, owner_id, next_action, next_action_date, " +
  "estimated_monthly_volume, intake_reference, submitted_organisation_name, closed_at, created_at, updated_at, created_by, updated_by";

export default async function LeadPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>Lead</h1><p className="small">{NO_CRM_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: lead, error } = await supabase.from("crm_leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle<CrmLead>();
  if (error) throw new Error("Could not load the lead");
  if (!lead) notFound();

  const [activitiesRes, contactRes, orgRes, contacts, organisations, chatRes] = await Promise.all([
    supabase.from("crm_activities").select("id, type, body, occurred_at, created_by").eq("lead_id", id).order("occurred_at", { ascending: false }).limit(200),
    lead.contact_id ? supabase.from("crm_contacts").select("id, full_name, email, phone, preferred_channel").eq("id", lead.contact_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    lead.organisation_id ? supabase.from("crm_organisations").select("id, name, town").eq("id", lead.organisation_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    contactOptions(supabase, lead.contact_id),
    organisationOptions(supabase, lead.organisation_id),
    // The live chat this lead was made from, for people who can read the chat inbox (empty for everyone else).
    supabase.from("chat_conversations").select("id, reference").eq("lead_id", id).limit(1),
  ]);
  if (activitiesRes.error) throw new Error("Could not load the timeline");
  const fromChat = ((chatRes.data ?? []) as { id: string; reference: string }[])[0] ?? null;
  const contact = contactRes.data as { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
  const org = orgRes.data as { id: string; name: string; town: string | null } | null;

  const perm = leadPermissions(access, lead);
  // A linked record missing from this person's lists is kept as it is when they save (see save_crm_lead).
  const hiddenContact = !!lead.contact_id && !contacts.some((c) => c.id === lead.contact_id);
  const hiddenOrganisation = !!lead.organisation_id && !organisations.some((o) => o.id === lead.organisation_id);
  const brandName = access.allBrands.find((b) => b.id === lead.brand_id)?.name;
  const brands = leadBrandChoices(access).map((b) => ({ id: b.id, label: b.name }));
  if (lead.brand_id && brandName && !brands.some((b) => b.id === lead.brand_id)) brands.unshift({ id: lead.brand_id, label: brandName });
  const nameOf = (who: string | null) => (who ? (who === access.userId ? "you" : staffName(access, who)) : "the website");

  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/leads">CRM</Link> / Leads</p>
      <div className="page-head">
        <div>
          <h1>{lead.title}</h1>
          <p className="small">
            <span className={`badge stage s-${lead.stage}`}>{crmStageLabel(lead.stage)}</span>{" "}
            {brandName ?? "No brand"}, {crmSourceLabel(lead.source)}
            {lead.intake_reference && <>, website reference <span className="mono">{lead.intake_reference}</span></>}
            {fromChat && <>, from live chat <Link href={`/systems/chat/${fromChat.id}`} className="mono">{fromChat.reference}</Link></>}
          </p>
        </div>
        <OwnerControl
          kind="lead"
          id={lead.id}
          ownerId={lead.owner_id}
          ownerName={lead.owner_id === access.userId ? "You" : staffName(access, lead.owner_id)}
          canAssignToMe={perm.canAssignToMe}
          canReassign={perm.canReassign}
          staff={reassignChoices(access)}
        />
      </div>
      <CrmTabs active="leads" />

      {flags.created && <div className="alert ok" role="status">Lead added.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The lead could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}
      {!perm.canEdit && <div className="alert info" role="note">You can read this lead and add to its timeline. Your role cannot change it.</div>}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <h2>Summary</h2>
            <dl className="facts">
              <dt>Contact</dt>
              <dd>{contact ? <Link href={`/systems/crm/contacts/${contact.id}`}>{crmContactName(contact)}</Link> : "None"}
                {contact?.phone && <span className="hint"><a href={`tel:${contact.phone.replace(/[^+0-9]/g, "")}`}>{contact.phone}</a></span>}
                {contact?.email && <span className="hint"><a href={`mailto:${contact.email}`}>{contact.email}</a></span>}
              </dd>
              <dt>Organisation</dt>
              <dd>
                {org ? <Link href={`/systems/crm/organisations/${org.id}`}>{org.name}</Link> : lead.organisation_id ? "An organisation you cannot see" : "None"}
                {!lead.organisation_id && lead.submitted_organisation_name && (
                  <span className="hint">Named on the website form: {lead.submitted_organisation_name}. Not linked yet.</span>
                )}
              </dd>
              <dt>Next action</dt>
              <dd>{lead.next_action || lead.next_action_date ? `${lead.next_action ?? "Follow up"}${lead.next_action_date ? `, by ${formatDate(lead.next_action_date)}` : ""}` : "Not set"}</dd>
              {lead.estimated_monthly_volume && (<><dt>Estimated volume</dt><dd>{lead.estimated_monthly_volume}</dd></>)}
              {lead.stage === "lost" && lead.lost_reason && (<><dt>Lost because</dt><dd>{lead.lost_reason}</dd></>)}
              {lead.closed_at && (<><dt>Closed</dt><dd>{formatDate(lead.closed_at)}</dd></>)}
              <dt>Added</dt>
              <dd>{formatDate(lead.created_at)} by {nameOf(lead.created_by)}</dd>
            </dl>
            {lead.description && <p className="pre">{lead.description}</p>}
          </section>

          {perm.canChangeStage && (
            <section className="panel">
              <h2>Stage</h2>
              <StageForm leadId={lead.id} stage={lead.stage} />
            </section>
          )}

          <section className="panel">
            <h2>Timeline</h2>
            <ActivityForm kind="lead" id={lead.id} />
            <Timeline items={(activitiesRes.data ?? []) as CrmActivity[]} nameOf={nameOf} formatWhen={formatDateTime} />
          </section>
        </div>

        <div>
          <h2 className="section-title">{perm.canEdit ? "Edit lead" : "Lead details"}</h2>
          <LeadForm
            mode={perm.canEdit ? "edit" : "view"}
            lead={lead}
            contacts={contacts}
            organisations={organisations}
            brands={brands}
            canChangeBrand={perm.canChangeBrand}
            hiddenContact={hiddenContact}
            hiddenOrganisation={hiddenOrganisation}
          />
          {perm.canDelete && (
            <section className="panel danger-zone">
              <h2>Delete lead</h2>
              <p className="small">Removes the lead and its timeline for good. To stop working on it, mark it as lost instead.</p>
              <form action={deleteRecord.bind(null, "lead", lead.id)}>
                <ConfirmButton className="btn danger" message="Delete this lead and its timeline for good? This cannot be undone.">Delete lead</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
