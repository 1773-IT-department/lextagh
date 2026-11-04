import Link from "next/link";
import { JOB_APPLICATION_STAGES, jobApplicationStageLabel, type JobApplication } from "@lexta/db";
import { CleanupForm } from "@/components/recruitment/NotesForms";
import RecruitmentTabs from "@/components/recruitment/RecruitmentTabs";
import { formatDate, PAGE_SIZE } from "@/lib/crm";
import { getRecruitmentAccess, NO_RECRUITMENT_ACCESS, ownerCandidates, staffName } from "@/lib/recruitment";
import { applyApplicationFilters, filterQuery, parseApplicationFilters, type ApplicationFilters } from "@/lib/recruitment-filters";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Recruitment | Lexta Business System" };

type Search = Partial<Record<keyof ApplicationFilters | "page" | "deleted", string>>;

type Row = Pick<JobApplication, "id" | "reference" | "full_name" | "email" | "opening_id" | "opening_title_snapshot"
  | "opening_reference_snapshot" | "interest" | "stage" | "owner_id" | "created_at" | "cv_path">;

export default async function RecruitmentPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getRecruitmentAccess();
  if (!access.canView) return (<><h1>Recruitment</h1><p className="small">{NO_RECRUITMENT_ACCESS}</p></>);

  const f = parseApplicationFilters(params);
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = Object.values(f).some(Boolean);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  const [listRes, rolesRes, unclaimedRes, ...countRes] = await Promise.all([
    applyApplicationFilters(
      supabase.from("job_applications").select(
        "id, reference, full_name, email, opening_id, opening_title_snapshot, opening_reference_snapshot, interest, stage, owner_id, created_at, cv_path",
        { count: "exact" },
      ),
      f, access.userId,
    ).order("created_at", { ascending: false }).order("id").range(from, from + PAGE_SIZE - 1),
    supabase.from("job_openings").select("id, reference, title, status").order("status").order("sort").order("reference"),
    supabase.rpc("unclaimed_job_cvs"),
    ...JOB_APPLICATION_STAGES.map((s) =>
      applyApplicationFilters(supabase.from("job_applications").select("id", { count: "exact", head: true }), f, access.userId, false).eq("stage", s.value)),
  ]);
  const { data, error, count } = listRes;
  if (error) console.error("[recruitment] list failed", error);
  if (rolesRes.error) console.error("[recruitment] roles failed", rolesRes.error);
  const rows = (data ?? []) as Row[];
  const roles = (rolesRes.data ?? []) as { id: string; reference: string; title: string; status: string }[];
  const unclaimed = unclaimedRes.error ? null : ((unclaimedRes.data ?? []) as unknown[]).length;
  const counts = JOB_APPLICATION_STAGES.map((s, i) => ({ ...s, count: countRes[i]?.count ?? 0, failed: !!countRes[i]?.error }));
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const owners = ownerCandidates(access);
  const href = (over: Search) => `/systems/recruitment${filterQuery({ ...f, page: String(page), ...over })}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recruitment</h1>
          <p className="small">Applications from the Careers page, with the CV, stage and owner. Open, close and edit the roles the page lists under Roles.</p>
        </div>
        <div className="head-actions">
          <a className="btn light" href={`/systems/recruitment/export${filterQuery(f)}`}>Export CSV</a>
          <Link className="btn" href="/systems/recruitment/roles/new">New role</Link>
        </div>
      </div>
      <RecruitmentTabs active="applications" />

      {params.deleted && <div className="alert ok" role="status">The application and its CV were deleted.</div>}

      <nav className="pipeline recruit-counts" aria-label="Applications by stage">
        {counts.map((s) => (
          <Link key={s.value} href={href({ stage: s.value, page: "1" })} className={`pipe r-${s.value}`} aria-current={f.stage === s.value ? "page" : undefined}>
            <b>{s.failed ? "?" : s.count}</b>
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>

      <form className="filters recruit-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Name, email, phone or LX-APP reference" />
        </div>
        <div className="field">
          <label htmlFor="opening">Role</label>
          <select id="opening" name="opening" defaultValue={f.opening}>
            <option value="">Any role</option>
            <option value="general">General applications</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.reference})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="stage">Stage</label>
          <select id="stage" name="stage" defaultValue={f.stage}>
            <option value="">Any stage</option>
            <option value="active">Still in play</option>
            {JOB_APPLICATION_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="owner">Owner</label>
          <select id="owner" name="owner" defaultValue={f.owner}>
            <option value="">Anyone</option>
            <option value="mine">Mine</option>
            <option value="unassigned">Unassigned</option>
            {owners.filter((s) => s.id !== access.userId).map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">Received from</label>
          <input id="from" name="from" type="date" defaultValue={f.from} />
        </div>
        <div className="field">
          <label htmlFor="to">Received to</label>
          <input id="to" name="to" type="date" defaultValue={f.to} />
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/recruitment">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the applications. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No applications match" : "No applications yet"}</b>
          <span>
            {filtered
              ? "Try another search or clear the filters."
              : "Applications sent from the Careers page land here with their CV. Open a role under Roles so it shows on the page."}
          </span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "application" : "applications"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Applicant</th><th scope="col">Role</th><th scope="col">Stage</th><th scope="col">Owner</th><th scope="col">Received</th></tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/systems/recruitment/applications/${a.id}`} className="pname">{a.full_name}</Link>
                      <span className="hint"><span className="mono">{a.reference}</span>, {a.email}{a.cv_path ? "" : ", no CV"}</span>
                    </td>
                    <td data-label="Role">
                      {a.opening_title_snapshot
                        ? <>{a.opening_title_snapshot}<span className="hint mono">{a.opening_reference_snapshot}</span></>
                        : <>General<span className="hint">{a.interest}</span></>}
                    </td>
                    <td data-label="Stage"><span className={`badge rstage r-${a.stage}`}>{jobApplicationStageLabel(a.stage)}</span></td>
                    <td data-label="Owner">{a.owner_id ? (a.owner_id === access.userId ? "Me" : staffName(access, a.owner_id)) : <span className="small">Unassigned</span>}</td>
                    <td data-label="Received">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn small light" href={href({ page: String(page - 1) })}>Previous</Link> : <span />}
              <span className="small">Page {page} of {pages}</span>
              {page < pages ? <Link className="btn small light" href={href({ page: String(page + 1) })}>Next</Link> : <span />}
            </nav>
          )}
        </>
      )}

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Unclaimed CV uploads</h2>
        <p className="small">
          {unclaimed === null
            ? "We could not check for unclaimed uploads just now."
            : unclaimed === 0
              ? "None. Uploads that never became an application (a visitor who gave up, or a bot) appear here after a day."
              : `${unclaimed} ${unclaimed === 1 ? "upload" : "uploads"} older than a day never became an application. They are safe to remove.`}
        </p>
        <CleanupForm count={unclaimed ?? 0} />
      </section>
    </>
  );
}
