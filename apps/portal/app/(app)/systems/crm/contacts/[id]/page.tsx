import Link from "next/link";
import { notFound } from "next/navigation";
import { crmContactName, crmStageLabel, type CrmActivity, type CrmContact, type CrmStage } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import ActivityForm from "@/components/crm/ActivityForm";
import ContactForm from "@/components/crm/ContactForm";
import CrmTabs from "@/components/crm/CrmTabs";
import OwnerControl from "@/components/crm/OwnerControl";
import Timeline from "@/components/crm/Timeline";
import { formatDate, formatDateTime, getCrmAccess, NO_CRM_ACCESS, staffName, UUID } from "@/lib/crm";
import { organisationOptions, reassignChoices } from "@/lib/crm-data";
import { createClient } from "@/lib/supabase/server";
import { deleteRecord } from "../../actions";

export const metadata = { title: "Contact | Lexta Business System" };

/** WhatsApp wants the full international number: Ghana numbers written locally get 233 in front. */
function waNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "").replace(/^00/, "");
  if (phone.trim().startsWith("+") || phone.trim().startsWith("00")) return digits.replace(/^2330/, "233");
  return `233${digits.replace(/^0/, "")}`;
}

const COLUMNS = "id, full_name, organisation_id, job_title, phone, phone_key, email, preferred_channel, consent_marketing, consent_at, consent_source, " +
  "notes, owner_id, created_at, updated_at, created_by, updated_by";

export default async function ContactPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>Contact</h1><p className="small">{NO_CRM_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: contact, error } = await supabase.from("crm_contacts").select(COLUMNS).eq("id", id).maybeSingle<CrmContact>();
  if (error) throw new Error("Could not load the contact");
  if (!contact) notFound();

  const [leadsRes, activitiesRes, organisations] = await Promise.all([
    // Only the leads this person may see (Row Level Security).
    supabase.from("crm_leads").select("id, title, stage, next_action_date").eq("contact_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("crm_activities").select("id, type, body, occurred_at, created_by").eq("contact_id", id).order("occurred_at", { ascending: false }).limit(200),
    organisationOptions(supabase, contact.organisation_id),
  ]);
  if (leadsRes.error || activitiesRes.error) throw new Error("Could not load the contact");
  const leads = (leadsRes.data ?? []) as { id: string; title: string; stage: CrmStage; next_action_date: string | null }[];
  const nameOf = (who: string | null) => (who ? (who === access.userId ? "you" : staffName(access, who)) : "the website");
  const org = organisations.find((o) => o.id === contact.organisation_id);
  // Linked to an organisation this person cannot see: the form keeps that link unless they pick another.
  const hiddenOrganisation = !!contact.organisation_id && !org;

  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/contacts">CRM</Link> / Contacts</p>
      <div className="page-head">
        <div>
          <h1>{crmContactName(contact)}</h1>
          <p className="small">
            {[contact.job_title, org?.label ?? (hiddenOrganisation ? "an organisation you cannot see" : null)].filter(Boolean).join(", ") || "No organisation"}
            {contact.consent_marketing && <>{" "}<span className="badge on">Marketing consent</span></>}
          </p>
          <div className="quick-actions">
            {contact.phone && <a className="btn small light" href={`tel:${contact.phone.replace(/[^+0-9]/g, "")}`}>Call</a>}
            {contact.phone && <a className="btn small light" href={`https://wa.me/${waNumber(contact.phone)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            {contact.email && <a className="btn small light" href={`mailto:${contact.email}`}>Email</a>}
          </div>
        </div>
        <OwnerControl
          kind="contact" id={contact.id} ownerId={contact.owner_id}
          ownerName={contact.owner_id === access.userId ? "You" : staffName(access, contact.owner_id)}
          canAssignToMe={false} canReassign={access.manages} staff={reassignChoices(access)}
        />
      </div>
      <CrmTabs active="contacts" />

      {flags.created && <div className="alert ok" role="status">Contact added.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The contact could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}
      {flags.error === "linked" && <div className="alert error" role="alert">This contact still has leads. Move or delete those leads first.</div>}
      {!access.canEdit && <div className="alert info" role="note">You can read this contact, add to its timeline and create leads for it. Your role cannot change it.</div>}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <div className="panel-head">
              <h2>Leads</h2>
              <Link className="btn small" href={`/systems/crm/leads/new?contact=${contact.id}`}>New lead</Link>
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
            <ActivityForm kind="contact" id={contact.id} />
            <Timeline items={(activitiesRes.data ?? []) as CrmActivity[]} nameOf={nameOf} formatWhen={formatDateTime} />
            {contact.consent_marketing && contact.consent_at && (
              <p className="small">Agreed to marketing on {formatDate(contact.consent_at)}{contact.consent_source ? ` (${contact.consent_source})` : ""}.</p>
            )}
          </section>
        </div>
        <div>
          <h2 className="section-title">{access.canEdit ? "Edit contact" : "Contact details"}</h2>
          <ContactForm mode={access.canEdit ? "edit" : "view"} contact={contact} organisations={organisations} hiddenOrganisation={hiddenOrganisation} />
          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete contact</h2>
              <p className="small">Removes the contact and their timeline for good. A contact with leads cannot be deleted until the leads are moved or deleted.</p>
              <form action={deleteRecord.bind(null, "contact", contact.id)}>
                <ConfirmButton className="btn danger" message="Delete this contact for good? This cannot be undone.">Delete contact</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
