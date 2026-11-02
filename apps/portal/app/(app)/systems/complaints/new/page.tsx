import Link from "next/link";
import { crmContactName } from "@lexta/db";
import ComplaintForm from "@/components/complaints/ComplaintForm";
import { cleanSearch } from "@/lib/crm";
import { organisationOptions, stockistOptions } from "@/lib/crm-data";
import { productPickers } from "@/lib/complaint-data";
import { getComplaintAccess, NO_COMPLAINT_ACCESS, ownerCandidates, phoneKey } from "@/lib/complaints";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Log a complaint | Lexta Business System" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type ContactRow = { id: string; full_name: string | null; email: string | null; phone: string | null; organisation: { name: string } | { name: string }[] | null };

const label = (c: ContactRow) => {
  const org = Array.isArray(c.organisation) ? c.organisation[0] : c.organisation;
  return [crmContactName(c), c.phone, c.email, org?.name].filter(Boolean).join(", ");
};

/** For a phone call or walk in: find the customer in the CRM first, then log the complaint. */
export default async function NewComplaintPage({ searchParams }: { searchParams: Promise<{ find?: string; contact?: string }> }) {
  const params = await searchParams;
  const access = await getComplaintAccess();
  if (!access.canView) return (<><h1>Log a complaint</h1><p className="small">{NO_COMPLAINT_ACCESS}</p></>);
  if (!access.works) {
    return (
      <>
        <p className="crumbs"><Link href="/systems/complaints">Complaints</Link></p>
        <h1>Log a complaint</h1>
        <p className="small">Admin and customer care log complaints. Pass the customer&apos;s details to customer care, or add a note to an existing complaint.</p>
      </>
    );
  }

  const supabase = await createClient();
  const find = cleanSearch(params.find, 80);
  const chosenId = params.contact && UUID.test(params.contact) ? params.contact : null;
  const select = "id, full_name, email, phone, organisation:crm_organisations!crm_contacts_organisation_id_fkey(name)";

  let matches: ContactRow[] = [];
  let findFailed = false;
  if (find && !chosenId) {
    const digits = phoneKey(find);
    const parts = [`full_name.ilike.*${find}*`, `email.ilike.*${find}*`];
    if (digits.length >= 4) parts.push(`phone_key.like.*${digits}*`);
    const { data, error } = await supabase.from("crm_contacts").select(select).or(parts.join(",")).order("full_name").limit(10);
    if (error) findFailed = true;
    matches = (data ?? []) as unknown as ContactRow[];
  }
  let chosen: ContactRow | null = null;
  if (chosenId) {
    const { data } = await supabase.from("crm_contacts").select(select).eq("id", chosenId).maybeSingle();
    chosen = (data as unknown as ContactRow) ?? null;
  }

  const [{ products, skus }, stockists, organisations] = await Promise.all([
    productPickers(supabase), stockistOptions(supabase), organisationOptions(supabase),
  ]);
  const owners = [
    { id: "me", label: "Me" },
    { id: "none", label: "Nobody yet" },
    ...(access.reassigns ? ownerCandidates(access).filter((s) => s.id !== access.userId).map((s) => ({ id: s.id, label: s.display_name })) : []),
  ];

  return (
    <>
      <p className="crumbs"><Link href="/systems/complaints">Complaints</Link></p>
      <h1>Log a complaint</h1>
      <p className="small">For a phone call, walk in, email or social media message. The case number is given when you save.</p>

      <section className="panel find-contact">
        <h2>Find the customer</h2>
        {chosen ? (
          <p className="small">
            Using <Link href={`/systems/crm/contacts/${chosen.id}`}>{label(chosen)}</Link>.{" "}
            <Link href="/systems/complaints/new">Choose someone else</Link>
          </p>
        ) : (
          <>
            <form method="get" className="find-form" role="search">
              <div className="field">
                <label htmlFor="find">Name, phone or email</label>
                <input id="find" name="find" type="search" defaultValue={find} placeholder="For example 024 123 4567" />
              </div>
              <button className="btn light" type="submit">Find</button>
            </form>
            {findFailed && <div className="alert error" role="alert">We could not search the CRM. Please try again.</div>}
            {find && !findFailed && (matches.length === 0 ? (
              <p className="small">Nobody in the CRM matches. Enter their details below and they will be added.</p>
            ) : (
              <ul className="mini-list">
                {matches.map((c) => (
                  <li key={c.id}>
                    <span>{label(c)}</span>
                    <Link className="btn small light" href={`/systems/complaints/new?contact=${c.id}`}>Use</Link>
                  </li>
                ))}
              </ul>
            ))}
          </>
        )}
      </section>

      <ComplaintForm
        mode="new"
        brands={access.allBrands.map((b) => ({ id: b.id, label: b.name }))}
        products={products}
        skus={skus}
        stockists={stockists}
        organisations={organisations}
        owners={owners}
        contact={chosen ? { id: chosen.id, label: label(chosen) } : null}
      />
    </>
  );
}
