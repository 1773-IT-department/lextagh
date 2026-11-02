import Link from "next/link";
import CrmTabs from "@/components/crm/CrmTabs";
import OrganisationForm from "@/components/crm/OrganisationForm";
import { getCrmAccess, NO_CRM_ACCESS } from "@/lib/crm";
import { ownerChoices, stockistOptions } from "@/lib/crm-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New organisation | Lexta Business System" };

export default async function NewOrganisationPage() {
  const access = await getCrmAccess();
  if (!access.canCreateOrg) {
    return (
      <>
        <p className="crumbs"><Link href="/systems/crm/organisations">CRM</Link> / Organisations</p>
        <h1>New organisation</h1>
        <p className="small">{access.canView ? "Your role can view organisations but not add them. Ask the sales or marketing team." : NO_CRM_ACCESS}</p>
      </>
    );
  }
  const supabase = await createClient();
  const stockists = await stockistOptions(supabase);
  const productBrands = access.allBrands.filter((b) => !b.is_corporate);
  return (
    <>
      <p className="crumbs"><Link href="/systems/crm/organisations">CRM</Link> / Organisations</p>
      <h1>New organisation</h1>
      <CrmTabs active="organisations" />
      <p className="small">Before adding one, search Organisations to check it is not already there.</p>
      <OrganisationForm
        mode="new"
        regions={access.regions}
        stockists={stockists}
        productBrands={productBrands.map((b) => ({ id: b.id, label: b.name }))}
        myBrandIds={productBrands.filter((b) => access.myBrandIds.has(b.id)).map((b) => b.id)}
        linked={[]}
        ownerOptions={ownerChoices(access)}
      />
    </>
  );
}
