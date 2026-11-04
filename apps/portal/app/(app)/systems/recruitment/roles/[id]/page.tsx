import Link from "next/link";
import { notFound } from "next/navigation";
import { employmentTypeLabel, jobOpeningStatusLabel, type JobOpening } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import RoleForm from "@/components/recruitment/RoleForm";
import RoleStatus from "@/components/recruitment/RoleStatus";
import { formatDate, formatDateTime, UUID } from "@/lib/crm";
import { getRecruitmentAccess, NO_RECRUITMENT_ACCESS, staffName } from "@/lib/recruitment";
import { ghanaToday } from "@/lib/recruitment-input";
import { createClient } from "@/lib/supabase/server";
import { deleteRole } from "../../actions";

export const metadata = { title: "Role | Recruitment | Lexta Business System" };

const COLUMNS = "id, reference, title, department, location, employment_type, level, summary, duties, requirements, status, opens_at, closes_at, urgent, sort, created_at, updated_at, created_by, updated_by";

export default async function RolePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getRecruitmentAccess();
  if (!access.canView) return (<><h1>Role</h1><p className="small">{NO_RECRUITMENT_ACCESS}</p></>);
  const supabase = await createClient();
  const [roleRes, countRes, usedRes] = await Promise.all([
    supabase.from("job_openings").select(COLUMNS).eq("id", id).maybeSingle<JobOpening>(),
    supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("opening_id", id),
    supabase.from("job_openings").select("department, location"),
  ]);
  if (roleRes.error) throw new Error("Could not load the role");
  const r = roleRes.data;
  if (!r) notFound();
  const applications = countRes.count ?? 0;
  const used = (usedRes.data ?? []) as { department: string; location: string }[];
  const today = ghanaToday();
  const live = r.status === "open" && (!r.opens_at || r.opens_at <= today) && (!r.closes_at || r.closes_at >= today);
  const who = (id: string | null) => (id ? (id === access.userId ? "you" : staffName(access, id)) : "the seed data");

  return (
    <>
      <p className="crumbs"><Link href="/systems/recruitment/roles">Roles</Link></p>
      <div className="page-head">
        <div>
          <h1>{r.title}</h1>
          <p className="small">
            <span className={`badge rrole r-${r.status}`}>{jobOpeningStatusLabel(r.status)}</span>{" "}
            <span className="mono">{r.reference}</span>, {r.department}, {r.location}, {employmentTypeLabel(r.employment_type)}
          </p>
          <p className="small">
            {live ? "Shows on the Careers page now." : r.status === "open"
              ? (r.closes_at && r.closes_at < today ? "Its closing date has passed, so it no longer shows on the Careers page. Close it, or set a new closing date."
                : `Shows on the Careers page from ${formatDate(r.opens_at)}.`)
              : "Not on the Careers page."}{" "}
            {applications > 0
              ? <Link href={`/systems/recruitment?opening=${r.id}`}>{applications === 1 ? "1 application" : `${applications} applications`}</Link>
              : "No applications yet."}
          </p>
        </div>
        <RoleStatus id={r.id} status={r.status} />
      </div>
      {flags.created && <div className="alert ok" role="status">Role created as {r.reference}.</div>}
      {flags.error === "has-applications" && <div className="alert error" role="alert">This role has applications, so it cannot be deleted. Close it instead.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The role could not be deleted. Please reload and try again.</div>}

      <RoleForm
        mode="edit"
        role={r}
        departments={[...new Set(used.map((u) => u.department))].sort()}
        locations={[...new Set(used.map((u) => u.location))].sort()}
      />
      <p className="small">Created {formatDateTime(r.created_at)} by {who(r.created_by)}. Last saved {formatDateTime(r.updated_at)} by {who(r.updated_by)}.</p>

      {applications === 0 && (
        <section className="panel danger-zone" style={{ marginTop: 16 }}>
          <h2>Delete role</h2>
          <p className="small">Only for roles created by mistake. A role with applications cannot be deleted; close it instead.</p>
          <form action={deleteRole.bind(null, r.id)}>
            <ConfirmButton className="btn danger" message={`Delete ${r.reference} for good? This cannot be undone.`}>Delete role</ConfirmButton>
          </form>
        </section>
      )}
    </>
  );
}
