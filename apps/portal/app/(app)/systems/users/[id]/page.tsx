import Link from "next/link";
import { notFound } from "next/navigation";
import { EditUserForm, EmailButtons, RemoveUserForm } from "@/components/users/UserForms";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/systems";
import { AUDIT_LABELS, formatWhen, functionReady, listUsers, ROLE_ORDER, STATUS_LABELS, USERS_BASE, type AuditRow } from "@/lib/users";

export const metadata = { title: "Login | Users and access" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function describe(a: AuditRow): string {
  const d = a.details ?? {};
  const label = AUDIT_LABELS[a.action] ?? a.action;
  if (a.action === "role_changed") {
    const r = (v: unknown) => (typeof v === "string" ? ROLE_LABELS[v as keyof typeof ROLE_LABELS] ?? v : "none");
    return `${label}: ${r(d.from)} to ${r(d.to)}`;
  }
  if (a.action === "brands_changed") {
    const b = (v: unknown) => (Array.isArray(v) && v.length ? v.join(", ") : "none");
    return `${label}: ${b(d.from)} to ${b(d.to)}`;
  }
  if (a.action === "invited" && typeof d.role === "string") return `${label} as ${ROLE_LABELS[d.role as keyof typeof ROLE_LABELS] ?? d.role}`;
  return label;
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { profile } = await requireSession();
  if (!profile?.is_active || profile.role !== "admin") {
    return (<><h1>Users and access</h1><p className="small">Only an admin can manage logins.</p></>);
  }
  const supabase = await createClient();
  const [{ rows, missing }, ready, brandsRes, orgsRes, auditRes] = await Promise.all([
    listUsers(),
    functionReady(),
    supabase.from("brands").select("slug, name").eq("is_active", true).order("name"),
    supabase.from("crm_organisations").select("id, name").eq("kind", "distributor").order("name").limit(2000),
    supabase.from("user_admin_audit").select("id, created_at, actor_id, target_email, action, details").eq("target_id", id)
      .order("created_at", { ascending: false }).limit(50),
  ]);
  if (missing) {
    return (<><h1>Users and access</h1><div className="alert error" role="alert">Users and access needs its database update (0019) first.</div></>);
  }
  const u = rows.find((r) => r.id === id);
  if (!u) notFound();
  const nameOf = (pid: string | null) => rows.find((r) => r.id === pid)?.full_name ?? rows.find((r) => r.id === pid)?.email ?? "Someone";
  const audit = (auditRes.data ?? []) as AuditRow[];
  const roles = ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABELS[r] }));
  const brands = (brandsRes.data ?? []) as { slug: string; name: string }[];
  const organisations = ((orgsRes.data ?? []) as { id: string; name: string }[]).map((o) => ({ id: o.id, label: o.name }));

  return (
    <>
      <p className="small"><Link href={USERS_BASE}>Users and access</Link></p>
      <div className="page-head">
        <div>
          <h1>{u.full_name || u.email}</h1>
          <p className="small">{u.email}{u.phone ? `, ${u.phone}` : ""} <span className={`badge users-${u.status}`}>{STATUS_LABELS[u.status]}</span></p>
        </div>
      </div>

      <div className="pipeline users-counts">
        <div className="pipe"><b>{u.role ? ROLE_LABELS[u.role] : "None"}</b><span>Role</span></div>
        <div className="pipe"><b>{formatWhen(u.invited_at ?? u.created_at)}</b><span>Invited or added</span></div>
        <div className="pipe"><b>{formatWhen(u.last_sign_in_at)}</b><span>Last sign in</span></div>
      </div>

      <section className="panel" aria-labelledby="edit_title">
        <h2 id="edit_title">Role and access</h2>
        <EditUserForm self={u.id === profile.id} roles={roles} brands={brands} organisations={organisations} values={{
          id: u.id, email: u.email, full_name: u.full_name ?? "", phone: u.phone ?? "", role: u.role ?? "", brands: u.brand_slugs,
          organisation_id: u.organisation_id ?? "", is_active: u.is_active,
        }} />
      </section>

      <section className="panel" aria-labelledby="email_title">
        <h2 id="email_title">Emails</h2>
        {ready
          ? <EmailButtons id={u.id} accepted={u.status !== "invited"} />
          : <p className="small">Invite and password reset emails are not switched on yet: the admin-users function still has to be deployed in Supabase.</p>}
      </section>

      {ready && u.id !== profile.id && (
        <section className="panel" aria-labelledby="remove_title">
          <h2 id="remove_title">Remove this login</h2>
          <p className="small">Deletes the login for good: {u.email} can no longer sign in, and you can invite the address again later. Records they made (leads, visits, orders, notes) stay. To stop someone for a while instead, switch the login off above.</p>
          <RemoveUserForm id={u.id} email={u.email} />
        </section>
      )}

      <section className="panel" aria-labelledby="audit_title">
        <h2 id="audit_title">History</h2>
        {audit.length === 0 ? <p className="small">No changes recorded yet.</p> : (
          <ul className="users-audit">
            {audit.map((a) => (
              <li key={a.id}><b>{describe(a)}</b><span className="hint">{formatWhen(a.created_at)}, by {nameOf(a.actor_id)}</span></li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
