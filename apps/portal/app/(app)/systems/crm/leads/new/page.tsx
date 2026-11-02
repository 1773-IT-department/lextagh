import Link from "next/link";
import CrmTabs from "@/components/crm/CrmTabs";
import LeadForm from "@/components/crm/LeadForm";
import { getCrmAccess, leadBrandChoices, NO_CRM_ACCESS, UUID } from "@/lib/crm";
import { contactOptions, organisationOptions, ownerChoices } from "@/lib/crm-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New lead | Lexta Business System" };

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<{ contact?: string; organisation?: string }> }) {
  const params = await searchParams;
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>New lead</h1><p className="small">{NO_CRM_ACCESS}</p></>);

  const contact = params.contact && UUID.test(params.contact) ? params.contact : undefined;
  const organisation = params.organisation && UUID.test(params.organisation) ? params.organisation : undefined;
  const supabase = await createClient();
  const [contacts, organisations] = await Promise.all([contactOptions(supabase, contact), organisationOptions(supabase, organisation)]);

  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/leads">CRM</Link> / Leads</p>
      <h1>New lead</h1>
      <CrmTabs active="leads" />
      <p className="small">A lead is a chance to sell: who it is with, which brand, and what happens next. Pick an existing contact or organisation, or{" "}
        <Link href="/systems/crm/contacts/new">add a contact first</Link>.</p>
      <LeadForm
        mode="new"
        contacts={contacts}
        organisations={organisations}
        brands={leadBrandChoices(access).map((b) => ({ id: b.id, label: b.name }))}
        canChangeBrand
        ownerOptions={ownerChoices(access)}
        defaults={{ contact_id: contact, organisation_id: organisation }}
      />
    </>
  );
}
