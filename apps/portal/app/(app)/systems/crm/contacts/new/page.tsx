import Link from "next/link";
import ContactForm from "@/components/crm/ContactForm";
import CrmTabs from "@/components/crm/CrmTabs";
import { getCrmAccess, NO_CRM_ACCESS, UUID } from "@/lib/crm";
import { organisationOptions, ownerChoices } from "@/lib/crm-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New contact | Lexta Business System" };

export default async function NewContactPage({ searchParams }: { searchParams: Promise<{ organisation?: string }> }) {
  const params = await searchParams;
  const access = await getCrmAccess();
  if (!access.canView) return (<><h1>New contact</h1><p className="small">{NO_CRM_ACCESS}</p></>);
  const organisation = params.organisation && UUID.test(params.organisation) ? params.organisation : undefined;
  const supabase = await createClient();
  const organisations = await organisationOptions(supabase, organisation);
  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/contacts">CRM</Link> / Contacts</p>
      <h1>New contact</h1>
      <CrmTabs active="contacts" />
      <p className="small">Before adding someone, search Contacts to check they are not already there.</p>
      <ContactForm mode="new" organisations={organisations} ownerOptions={ownerChoices(access)} defaults={{ organisation_id: organisation }} />
    </>
  );
}
