import Link from "next/link";
import { notFound } from "next/navigation";
import { jobApplicationStageLabel, type JobApplication, type JobApplicationEvent } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import { HistoryNoteForm, StaffNotesForm } from "@/components/recruitment/NotesForms";
import OwnerControl from "@/components/recruitment/OwnerControl";
import StageForm from "@/components/recruitment/StageForm";
import { formatDateTime, UUID } from "@/lib/crm";
import { fileSize, getRecruitmentAccess, NO_RECRUITMENT_ACCESS, ownerCandidates, staffName } from "@/lib/recruitment";
import { createClient } from "@/lib/supabase/server";
import { deleteApplication } from "../../actions";

export const metadata = { title: "Application | Lexta Business System" };

const COLUMNS =
  "id, reference, opening_id, opening_reference_snapshot, opening_title_snapshot, full_name, email, phone, interest, message, cv_path, " +
  "cv_file_name, cv_size_bytes, cv_mime_type, consent_keep, consent_at, stage, stage_changed_at, owner_id, staff_notes, source, created_at, updated_at, updated_by";

const TYPE_NAMES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word (.doc)",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (.docx)",
};

const EVENT_LABELS: Record<string, string> = { received: "Received", stage_change: "Stage", owner_change: "Owner", note: "Note" };

export default async function ApplicationPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getRecruitmentAccess();
  if (!access.canView) return (<><h1>Application</h1><p className="small">{NO_RECRUITMENT_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: a, error } = await supabase.from("job_applications").select(COLUMNS).eq("id", id).maybeSingle<JobApplication>();
  if (error) throw new Error("Could not load the application");
  if (!a) notFound();
  const [eventsRes, roleRes] = await Promise.all([
    supabase.from("job_application_events").select("id, type, from_stage, to_stage, note, created_by, created_at").eq("application_id", id)
      .order("created_at", { ascending: false }).limit(300),
    a.opening_id ? supabase.from("job_openings").select("id, status").eq("id", a.opening_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (eventsRes.error) throw new Error("Could not load the history");
  const events = (eventsRes.data ?? []) as JobApplicationEvent[];
  const role = roleRes.data as { id: string; status: string } | null;
  const nameOf = (who: string | null) => (who ? (who === access.userId ? "you" : staffName(access, who)) : "the website");
  const staff = ownerCandidates(access).map((s) => ({ id: s.id, label: s.id === access.userId ? `${s.display_name} (me)` : s.display_name }));

  return (
    <>
      <p className="crumbs"><Link href="/systems/recruitment">Recruitment</Link></p>
      <div className="page-head">
        <div>
          <h1>{a.full_name}</h1>
          <p className="small">
            <span className={`badge rstage r-${a.stage}`}>{jobApplicationStageLabel(a.stage)}</span>{" "}
            <span className="mono">{a.reference}</span>, {a.opening_title_snapshot ? `for ${a.opening_title_snapshot}` : "general application"}
          </p>
        </div>
        <OwnerControl id={a.id} ownerId={a.owner_id} ownerName={a.owner_id === access.userId ? "You" : staffName(access, a.owner_id)} staff={staff} />
      </div>
      {flags.error === "delete" && <div className="alert error" role="alert">The application could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <h2>Applicant</h2>
            <dl className="facts">
              <dt>Email</dt>
              <dd><a href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt>Phone</dt>
              <dd>{a.phone ? <a href={`tel:${a.phone.replace(/[^+0-9]/g, "")}`}>{a.phone}</a> : "Not given"}</dd>
              <dt>Applied for</dt>
              <dd>
                {a.opening_title_snapshot
                  ? (role ? <Link href={`/systems/recruitment/roles/${role.id}`}>{a.opening_title_snapshot}</Link> : a.opening_title_snapshot)
                  : "General application"}
                {a.opening_reference_snapshot && <span className="hint mono">{a.opening_reference_snapshot}</span>}
              </dd>
              {a.interest && (<><dt>Area of interest</dt><dd>{a.interest}</dd></>)}
              <dt>Received</dt>
              <dd>{formatDateTime(a.created_at)}, from the website</dd>
              <dt>Consent</dt>
              <dd>{a.consent_keep ? `Agreed we keep the details for this and future roles${a.consent_at ? ` (${formatDateTime(a.consent_at)})` : ""}` : "Not given"}</dd>
            </dl>
            {a.message ? <p className="pre">{a.message}</p> : <p className="small" style={{ marginTop: 14 }}>No message.</p>}
          </section>

          <section className="panel">
            <h2>CV</h2>
            {a.cv_path ? (
              <div className="panel-head" style={{ marginBottom: 0 }}>
                <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <b>{a.cv_file_name}</b>
                  <span className="hint">{[TYPE_NAMES[a.cv_mime_type ?? ""] ?? a.cv_mime_type, fileSize(a.cv_size_bytes)].filter(Boolean).join(", ")}</span>
                </div>
                <a className="btn small" href={`/systems/recruitment/applications/${a.id}/cv`}>Download CV</a>
              </div>
            ) : <p className="small">No CV on file.</p>}
            <p className="small" style={{ margin: "12px 0 0" }}>The download link works for one minute and is made for you only.</p>
          </section>

          <section className="panel">
            <h2>Stage</h2>
            <StageForm id={a.id} stage={a.stage} />
          </section>
        </div>

        <div>
          <section className="panel">
            <h2>Notes</h2>
            <StaffNotesForm id={a.id} notes={a.staff_notes} />
          </section>
          <section className="panel">
            <h2>History</h2>
            <HistoryNoteForm id={a.id} />
            {events.length === 0 ? <p className="small">Nothing logged yet.</p> : (
              <ol className="timeline">
                {events.map((e) => (
                  <li key={e.id} className={`t-${e.type === "stage_change" ? "status_change" : e.type}`}>
                    <div className="t-head">
                      <span className="badge type">{EVENT_LABELS[e.type] ?? "Note"}</span>
                      <span className="small">{formatDateTime(e.created_at)} by {nameOf(e.created_by)}</span>
                    </div>
                    {e.type === "stage_change" && (
                      <p className="t-body">{jobApplicationStageLabel(e.from_stage)} to {jobApplicationStageLabel(e.to_stage)}</p>
                    )}
                    {e.note && <p className="t-body">{e.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete application</h2>
              <p className="small">Removes the application, its history and the CV for good, for example when the applicant asks for their data to be erased.</p>
              <form action={deleteApplication.bind(null, a.id)}>
                <ConfirmButton className="btn danger" message={`Delete ${a.reference}, its history and CV for good? This cannot be undone.`}>Delete application</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
