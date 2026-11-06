import { redirect } from "next/navigation";
import type { DistributorLogin } from "@lexta/db";
import { LinkForm, UnlinkForm } from "@/components/orders/OrderForms";
import OrderTabs from "@/components/orders/OrderTabs";
import { getOrdersAccess, NO_ORDERS_ACCESS } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Distributor logins | Lexta Business System" };

/**
 * Staff: link each distributor login to the CRM organisation it orders for. Logins are invited with the distributor
 * role under Users and access; the organisation and the brands it carries come from the CRM.
 */
export default async function DistributorLoginsPage() {
  const access = await getOrdersAccess();
  if (access.isDistributor) redirect("/systems/orders");
  if (!access.isStaff) return (<><h1>Distributor logins</h1><p className="small">{NO_ORDERS_ACCESS}</p></>);
  const supabase = await createClient();
  const [loginsRes, orgsRes] = await Promise.all([
    supabase.rpc("distributor_logins"),
    supabase.from("crm_organisations").select("id, name, kind").order("name").limit(2000),
  ]);
  if (loginsRes.error) throw new Error("Could not load distributor logins");
  if (orgsRes.error) throw new Error("Could not load organisations");
  const logins = (loginsRes.data ?? []) as DistributorLogin[];
  type Org = { id: string; name: string; kind: string };
  const orgs = (orgsRes.data ?? []) as Org[];
  // Distributors first, then everyone else.
  const choices = [...orgs.filter((o) => o.kind === "distributor"), ...orgs.filter((o) => o.kind !== "distributor")];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Distributor logins</h1>
          <p className="small">
            Link each distributor login to its organisation in the CRM. The distributor then orders the brands that organisation carries
            and sees only that organisation&apos;s orders. Invite new distributor logins under Users and access with the Distributor role.
          </p>
        </div>
      </div>
      <OrderTabs active="distributors" />
      {logins.length === 0 ? (
        <div className="tile empty"><b>No distributor logins yet</b><span>Invite a distributor under Users and access with the Distributor role, then link them here.</span></div>
      ) : (
        <ul className="login-list">
          {logins.map((l) => (
            <li key={l.profile_id} className="panel">
              <div className="login-head">
                <div>
                  <b>{l.display_name}</b>
                  <span className="hint">{l.email}{l.is_active ? "" : ", login switched off"}</span>
                </div>
                {l.organisation_id
                  ? <span className="badge on">Linked</span>
                  : <span className="badge off">Not linked</span>}
              </div>
              {l.organisation_id ? (
                <div className="login-linked">
                  <span>Orders for <b>{l.organisation_name ?? "an organisation outside your brands"}</b></span>
                  {l.may_unlink && <UnlinkForm profileId={l.profile_id} name={l.display_name} />}
                </div>
              ) : (
                <LinkForm profileId={l.profile_id} name={l.display_name} organisations={choices.map(({ id, name }) => ({ id, name }))} />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
