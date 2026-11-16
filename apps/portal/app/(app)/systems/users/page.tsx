import Link from "next/link";
import { Select } from "@lexta/ui";
import { InviteForm } from "@/components/users/UserForms";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/systems";
import { formatWhen, functionReady, listUsers, ROLE_ORDER, STATUS_LABELS, USERS_BASE, type UserStatus } from "@/lib/users";

export const metadata = { title: "Users and access" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { profile } = await requireSession();
  if (!profile?.is_active || profile.role !== "admin") {
    return (<><h1>Users and access</h1><p className="small">Only an admin can manage logins. Ask your Lexta administrator if you need a change.</p></>);
  }
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const roleF = params.role ?? "";
  const statusF = params.status ?? "";

  const supabase = await createClient();
  const [{ rows, missing, failed }, ready, brandsRes, orgsRes, removedRes] = await Promise.all([
    listUsers(),
    functionReady(),
    supabase.from("brands").select("slug, name").eq("is_active", true).order("name"),
    supabase.from("crm_organisations").select("id, name, kind").eq("kind", "distributor").order("name").limit(2000),
    supabase.from("user_admin_audit").select("id, created_at, actor_id, target_email").eq("action", "removed")
      .order("created_at", { ascending: false }).limit(50),
  ]);
  const brands = (brandsRes.data ?? []) as { slug: string; name: string }[];
  const brandName = (s: string) => brands.find((b) => b.slug === s)?.name ?? s;
  const organisations = ((orgsRes.data ?? []) as { id: string; name: string }[]).map((o) => ({ id: o.id, label: o.name }));
  const removed = (removedRes.data ?? []) as { id: string; created_at: string; actor_id: string | null; target_email: string }[];
  const nameOf = (pid: string | null) => { const r = rows.find((x) => x.id === pid); return r ? r.full_name || r.email : "Someone"; };
  const roles = ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

  const shown = rows.filter((u) =>
    (!q || `${u.full_name ?? ""} ${u.email}`.toLowerCase().includes(q))
    && (!roleF || (roleF === "none" ? !u.role : u.role === roleF))
    && (!statusF || u.status === statusF));
  const counts = rows.reduce<Record<string, number>>((a, u) => ({ ...a, [u.status]: (a[u.status] ?? 0) + 1 }), {});
  const filtered = !!(q || roleF || statusF);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users and access</h1>
          <p className="small">Everyone who can sign in to the Business System: invite people, set their role and brands, switch logins off or remove them, and send password reset emails. Every change is recorded.</p>
        </div>
      </div>

      {params.removed && <div className="alert ok" role="status">{params.removed.slice(0, 300)}</div>}
      {missing && <div className="alert error" role="alert">Users and access needs its database update (0019) before it can show logins. Ask your developer to apply it.</div>}
      {failed && <div className="alert error" role="alert">We could not load the logins. Please refresh the page.</div>}
      {!ready && <div className="alert info" role="status">Invites and password reset emails are not switched on yet: the admin-users function still has to be deployed in Supabase. You can still change roles, brands and access here.</div>}

      {!missing && (
        <div className="pipeline users-counts">
          <div className="pipe"><b>{rows.length}</b><span>Logins</span></div>
          <div className="pipe"><b>{counts.active ?? 0}</b><span>Active</span></div>
          <div className="pipe"><b>{(counts.invited ?? 0) + (counts.never_signed_in ?? 0)}</b><span>Waiting to sign in</span></div>
          <div className="pipe"><b>{counts.deactivated ?? 0}</b><span>Switched off</span></div>
        </div>
      )}

      <section className="panel" aria-labelledby="invite_title">
        <h2 id="invite_title">Invite someone</h2>
        <InviteForm roles={roles} brands={brands} organisations={organisations} disabled={!ready || missing} />
      </section>

      <form className="filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={params.q ?? ""} placeholder="Name or email" />
        </div>
        <div className="field">
          <label htmlFor="role_f">Role</label>
          <Select id="role_f" name="role" defaultValue={roleF}>
            <option value="">Every role</option>
            {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            <option value="none">No role yet</option>
          </Select>
        </div>
        <div className="field">
          <label htmlFor="status_f">Status</label>
          <Select id="status_f" name="status" defaultValue={statusF}>
            <option value="">Every status</option>
            {(Object.keys(STATUS_LABELS) as UserStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href={USERS_BASE}>Clear</Link>}
        </div>
      </form>

      <section className="panel" aria-labelledby="list_title">
        <h2 id="list_title">Logins <span className="small">({shown.length}{filtered ? ` of ${rows.length}` : ""})</span></h2>
        {shown.length === 0 ? (
          <p className="small">{filtered ? "No login matches these filters." : "No logins yet."}</p>
        ) : (
          <div className="table-wrap">
            <table className="ptable users-table">
              <thead><tr><th>Person</th><th>Role</th><th>Brands</th><th>Status</th><th>Last sign in</th></tr></thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link className="pname" href={`${USERS_BASE}/${u.id}`}>{u.full_name || u.email}</Link>
                      <span className="hint">{u.email}{u.id === profile.id ? " (you)" : ""}</span>
                    </td>
                    <td>{u.role ? ROLE_LABELS[u.role] : "None"}{u.organisation_name ? <span className="hint">{u.organisation_name}</span> : null}</td>
                    <td>{u.role === "admin" || u.role === "management" ? "All brands" : u.brand_slugs.map(brandName).join(", ") || "None"}</td>
                    <td><span className={`badge users-${u.status}`}>{STATUS_LABELS[u.status]}</span></td>
                    <td>{formatWhen(u.last_sign_in_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {removed.length > 0 && (
        <section className="panel" aria-labelledby="removed_title">
          <h2 id="removed_title">Removed logins <span className="small">(latest {removed.length})</span></h2>
          <ul className="users-audit">
            {removed.map((a) => (
              <li key={a.id}><b>{a.target_email}</b><span className="hint">Removed {formatWhen(a.created_at)}, by {nameOf(a.actor_id)}</span></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
