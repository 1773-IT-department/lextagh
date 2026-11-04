// Recruitment types, labels, the Careers page read and the website application intake. Hand written from
// supabase/migrations/0008_recruitment.sql.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, createWebsiteReadClient, websiteReadDeadline } from "./client";
import { JOB_CVS_BUCKET } from "./job-cv";

export * from "./job-cv";

type Timestamps = { created_at: string; updated_at: string };
type Option<T extends string> = { value: T; label: string };

export type JobOpeningStatus = "draft" | "open" | "closed";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "temporary";
export type JobApplicationStage =
  | "new" | "screening" | "shortlisted" | "interview" | "offer" | "hired" | "rejected" | "withdrawn";
export type JobApplicationEventType = "received" | "stage_change" | "owner_change" | "note";

export const JOB_OPENING_STATUSES: readonly Option<JobOpeningStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
] as const;

export const EMPLOYMENT_TYPES: readonly Option<EmploymentType>[] = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
] as const;

/** In working order; hired, rejected and withdrawn are the end of the road. */
export const JOB_APPLICATION_STAGES: readonly Option<JobApplicationStage>[] = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

const labelOf = <T extends string>(list: readonly Option<T>[], value: string | null | undefined, fallback = "") =>
  list.find((o) => o.value === value)?.label ?? fallback;

export const jobOpeningStatusLabel = (v: string | null | undefined) => labelOf(JOB_OPENING_STATUSES, v, "Draft");
export const employmentTypeLabel = (v: string | null | undefined) => labelOf(EMPLOYMENT_TYPES, v, "");
export const jobApplicationStageLabel = (v: string | null | undefined) => labelOf(JOB_APPLICATION_STAGES, v, "New");

type Authors = { created_by: string | null; updated_by: string | null };

export type JobOpening = Timestamps & Authors & {
  id: string;
  /** e.g. LX-HR-001: what the website shows and applicants quote. */
  reference: string;
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  level: string;
  summary: string;
  duties: string[];
  requirements: string[];
  status: JobOpeningStatus;
  /** YYYY-MM-DD in Ghana. */
  opens_at: string | null;
  /** YYYY-MM-DD in Ghana; applications are taken through the whole day. Null: open until closed. */
  closes_at: string | null;
  urgent: boolean;
  sort: number;
};

export type JobApplication = Timestamps & {
  id: string;
  /** LX-APP-<year>-0001, set by the database. */
  reference: string;
  opening_id: string | null;
  opening_reference_snapshot: string | null;
  opening_title_snapshot: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  interest: string | null;
  message: string | null;
  /** incoming/<uuid>/<file name> in the private job-cvs bucket. */
  cv_path: string | null;
  cv_file_name: string | null;
  cv_size_bytes: number | null;
  cv_mime_type: string | null;
  consent_keep: boolean;
  consent_at: string | null;
  stage: JobApplicationStage;
  stage_changed_at: string;
  owner_id: string | null;
  staff_notes: string | null;
  source: "website";
  updated_by: string | null;
};

export type JobApplicationEvent = Timestamps & {
  id: string;
  application_id: string;
  type: JobApplicationEventType;
  from_stage: JobApplicationStage | null;
  to_stage: JobApplicationStage | null;
  note: string | null;
  created_by: string | null;
};

/** One person who can own applications (from public.recruitment_staff()). */
export type RecruitmentStaff = { id: string; display_name: string; role: string; is_active: boolean };

// CVs -------------------------------------------------------------------------------------------------------

/** A signed request for an upload ticket, made by the website server (see apps/lexta/lib/forms/careers.ts). */
export type JobCvTicketRequest = {
  /** A new uuid; it becomes the upload's folder. */
  nonce: string;
  /** Unix seconds when the server signed the request; the database accepts 5 minutes. */
  issuedAt: number;
  /** HMAC SHA-256 (hex) of the visitor's IP address with the shared secret: the raw address never leaves the server. */
  ipHash: string;
  /** HMAC SHA-256 (hex) of "<nonce>.<issuedAt>.<ipHash>" with the shared secret. */
  signature: string;
  /** The file name as the applicant had it; the database cleans it into the path. */
  fileName: string;
};

export type CvUploadResult =
  | { ok: true; path: string }
  | { ok: false; reason: "rejected" | "rate_limited" | "not_configured" | "error" };

/**
 * Website server only. Gets a one time upload ticket from public.begin_job_cv_upload (checks the signature, the time
 * and the per visitor limits), then uploads the CV with the publishable key to the path the ticket allows, with the
 * content type the caller worked out from the file's first bytes. Nothing can be read back. The application then
 * claims the upload with submitJobApplication.
 */
export async function uploadJobCv(
  request: JobCvTicketRequest, bytes: ArrayBuffer, contentType: string, client?: SupabaseClient,
): Promise<CvUploadResult> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.rpc("begin_job_cv_upload", {
    nonce: request.nonce, issued_at: request.issuedAt, ip_hash: request.ipHash, signature: request.signature, file_name: request.fileName,
  });
  if (error) {
    if (error.code === "PT429") return { ok: false, reason: "rate_limited" };
    if (error.code === "55000") return { ok: false, reason: "not_configured" };
    if (error.code === "22023" && /cv_type|cv_name/.test(error.message)) return { ok: false, reason: "rejected" };
    return { ok: false, reason: "error" };
  }
  const path = typeof data === "string" ? data : "";
  if (!path) return { ok: false, reason: "error" };
  const { error: upError } = await supabase.storage.from(JOB_CVS_BUCKET)
    .upload(path, new Blob([bytes], { type: contentType }), { contentType, upsert: false });
  if (!upError) return { ok: true, path };
  // StorageApiError: status is the HTTP status; statusCode is what the server put in its body.
  const e = upError as { status?: number; statusCode?: string | number };
  const status = Number(e.status ?? e.statusCode ?? 0);
  // 400 (bad type) and 413 (too big) are refusals, the rest trouble.
  return { ok: false, reason: [400, 413, 415].includes(status) ? "rejected" : "error" };
}

// Careers page --------------------------------------------------------------------------------------------

/** Cache tag the websites use for job openings; the revalidate route clears it. */
export const JOBS_CACHE_TAG = "jobs";

/** What the Careers page shows about a live role. Authors and timestamps are never included. */
export type PublicJob = {
  reference: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  employmentTypeLabel: string;
  level: string;
  summary: string;
  duties: string[];
  requirements: string[];
  /** YYYY-MM-DD */
  opensAt: string | null;
  /** YYYY-MM-DD, or null when open until filled. */
  closesAt: string | null;
  urgent: boolean;
};

// Public columns only: anon cannot read created_by, updated_by, created_at or updated_at, so never select "*".
const JOB_COLUMNS = "reference, title, department, location, employment_type, level, summary, duties, requirements, opens_at, closes_at, urgent, sort";

type JobRow = Pick<JobOpening, "reference" | "title" | "department" | "location" | "employment_type" | "level" | "summary" | "duties"
  | "requirements" | "opens_at" | "closes_at" | "urgent" | "sort">;

/**
 * Live roles for the Careers page: open, opened, closing date not passed (Row Level Security only returns those to
 * the publishable key), in HR's order, then newest first. Cached under the "jobs" tag, so a portal save refreshes the
 * page. Gives up after WEBSITE_READ_TIMEOUT_MS (one attempt, no retries); throws on any error.
 */
export async function getOpenJobs(client?: SupabaseClient): Promise<PublicJob[]> {
  const supabase = client ?? createWebsiteReadClient(JOBS_CACHE_TAG);
  const { data, error } = await supabase.from("job_openings").select(JOB_COLUMNS).eq("status", "open")
    .order("sort").order("opens_at", { ascending: false }).order("reference").abortSignal(websiteReadDeadline());
  if (error) throw new Error(`Could not load open roles: ${error.message}`);
  return ((data ?? []) as JobRow[]).map((r) => ({
    reference: r.reference,
    title: r.title,
    department: r.department,
    location: r.location,
    employmentType: r.employment_type,
    employmentTypeLabel: employmentTypeLabel(r.employment_type) || r.employment_type,
    level: r.level,
    summary: r.summary,
    duties: r.duties ?? [],
    requirements: r.requirements ?? [],
    opensAt: r.opens_at,
    closesAt: r.closes_at,
    urgent: r.urgent,
  }));
}

// Website intake --------------------------------------------------------------------------------------------

export type JobApplicationPayload = {
  /** Hidden field that people never fill in. Send it as the form has it; anything in it marks a bot. */
  honeypot?: string;
  /** Reference of a live role; leave out for a general application. */
  opening?: string;
  name: string;
  email: string;
  phone?: string;
  /** Area of interest; required for a general application. */
  interest?: string;
  message?: string;
  /** The path uploadJobCv returned (a ticketed upload). */
  cv_path: string;
  /** The file name as the applicant had it. */
  cv_name?: string;
  /** Must be true: Lexta may keep the details for this and future roles. */
  consent: true;
};

export type JobApplicationResult =
  | { ok: true; reference: string }
  | { ok: false; reason: "invalid"; field: string | null }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "error" };

/**
 * Sends an application through public.submit_job_application. Visitors never read recruitment data: the only thing
 * that comes back is the LX-APP reference to show them. Leave out empty fields rather than sending "".
 */
export async function submitJobApplication(payload: JobApplicationPayload, client?: SupabaseClient): Promise<JobApplicationResult> {
  const supabase = client ?? createPublicClient();
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""));
  const { data, error } = await supabase.rpc("submit_job_application", { payload: clean });
  if (!error && typeof data === "string") return { ok: true, reference: data };
  if (error?.code === "PT429") return { ok: false, reason: "rate_limited" };
  if (error?.code === "22023") {
    const field = /^(?:invalid field|field too long): (\w+)/.exec(error.message)?.[1] ?? null;
    return { ok: false, reason: "invalid", field };
  }
  return { ok: false, reason: "error" };
}
