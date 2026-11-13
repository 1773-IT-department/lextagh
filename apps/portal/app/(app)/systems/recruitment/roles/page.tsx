import { Select } from "@lexta/ui";
import Link from "next/link";
import { employmentTypeLabel, JOB_OPENING_STATUSES, jobOpeningStatusLabel, type JobOpening } from "@lexta/db";
import RecruitmentTabs from "@/components/recruitment/RecruitmentTabs";
import { cleanSearch, formatDate } from "@/lib/crm";
import { getRecruitmentAccess, NO_RECRUITMENT_ACCESS } from "@/lib/recruitment";
import { ghanaToday } from "@/lib/recruitment-input";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Roles | Recruitment | Lexta Business System" };

type Row = Pick<JobOpening, "id" | "reference" | "title" | "department" | "location" | "employment_type" | "status" | "opens_at" | "closes_at"
  | "urgent"> & { job_applications: { count: number }[] | null };

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; deleted?: string }> }) {
  const params = await searchParams;
  const access = await getRecruitmentAccess();
  if (!access.canView) return (<><h1>Roles</h1><p className="small">{NO_RECRUITMENT_ACCESS}</p></>);
  const q = cleanSearch(params.q, 80);
  const status = JOB_OPENING_STATUSES.some((s) => s.value === params.status) ? params.status! : "";

  const supabase = await createClient();
  let query = supabase.from("job_openings")
    .select("id, reference, title, department, location, employment_type, status, opens_at, closes_at, urgent, job_applications(count)")
    .order("status").order("sort").order("reference");
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.*${q}*,reference.ilike.*${q}*,department.ilike.*${q}*,location.ilike.*${q}*`);
  const { data, error } = await query;
  if (error) console.error("[recruitment] roles list failed", error);
  const rows = (data ?? []) as unknown as Row[];
  const today = ghanaToday();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recruitment</h1>
          <p className="small">Open roles show on the Careers page from their opening date to the end of their closing date. Drafts and closed roles do not.</p>
        </div>
        <div className="head-actions"><Link className="btn" href="/systems/recruitment/roles/new">New role</Link></div>
      </div>
      <RecruitmentTabs active="roles" />
      {params.deleted && <div className="alert ok" role="status">The role was deleted.</div>}

      <form className="filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Title, reference, department or location" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <Select id="status" name="status" defaultValue={status}>
            <option value="">Any status</option>
            {JOB_OPENING_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        <div className="field" aria-hidden="true" />
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {(q || status) && <Link className="btn light" href="/systems/recruitment/roles">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the roles. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{q || status ? "No roles match" : "No roles yet"}</b>
          <span>{q || status ? "Try another search or clear the filters." : "Create one with New role."}</span>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="ptable">
            <thead>
              <tr><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Where</th><th scope="col">Closes</th><th scope="col">Applications</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const expired = r.status === "open" && !!r.closes_at && r.closes_at < today;
                const scheduled = r.status === "open" && !!r.opens_at && r.opens_at > today;
                const n = r.job_applications?.[0]?.count ?? 0;
                return (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/systems/recruitment/roles/${r.id}`} className="pname">{r.title}</Link>
                      <span className="hint"><span className="mono">{r.reference}</span>, {r.department}</span>
                    </td>
                    <td data-label="Status">
                      <span className={`badge rrole r-${r.status}`}>{jobOpeningStatusLabel(r.status)}</span>
                      {expired && <span className="hint overdue">Past its closing date, hidden</span>}
                      {scheduled && <span className="hint">Shows from {formatDate(r.opens_at)}</span>}
                      {r.urgent && r.status === "open" && <span className="hint">Closing soon</span>}
                    </td>
                    <td data-label="Where">{r.location}<span className="hint">{employmentTypeLabel(r.employment_type)}</span></td>
                    <td data-label="Closes">{r.closes_at ? formatDate(r.closes_at) : <span className="small">No date</span>}</td>
                    <td data-label="Applications">
                      {n > 0 ? <Link href={`/systems/recruitment?opening=${r.id}`}>{n}</Link> : "0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
