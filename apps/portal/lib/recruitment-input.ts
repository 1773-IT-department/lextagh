import { EMPLOYMENT_TYPES, JOB_OPENING_STATUSES, type EmploymentType, type JobOpeningStatus } from "@lexta/db";

/** What the role form sends, checked the same way as the job_openings table (0008_recruitment.sql). */
export type RoleDetails = {
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
  opens_at: string | null;
  closes_at: string | null;
  urgent: boolean;
  sort: number;
};

export const ROLE_REFERENCE = /^LX-[A-Z]{2,5}-[0-9]{2,5}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** One item per line; blank lines and list marks ("-", "*", "•") dropped. */
export const lines = (v: string | undefined) =>
  (v ?? "").replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);

/** Today in Ghana (UTC, no daylight saving) as YYYY-MM-DD. */
export const ghanaToday = () => new Date().toISOString().slice(0, 10);

/** current: the saved role, if any. An open role already past its closing date may still be edited if that date stays. */
export function checkRole(raw: Record<string, string>, current?: { status: string; closes_at: string | null }): { details?: RoleDetails; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const t = (k: string) => (raw[k] ?? "").trim();
  const reference = t("reference").toUpperCase();
  const status = (JOB_OPENING_STATUSES.some((s) => s.value === raw.status) ? raw.status : "draft") as JobOpeningStatus;
  const type = raw.employment_type as EmploymentType;
  const duties = lines(raw.duties);
  const requirements = lines(raw.requirements);
  const opens = t("opens_at");
  const closes = t("closes_at");
  const sort = t("sort") === "" ? 0 : Number(t("sort"));

  if (!ROLE_REFERENCE.test(reference)) errors.reference = "Use LX-, two to five capital letters, a dash and a number, for example LX-HR-001.";
  const need = (k: string, label: string, min: number, max: number) => {
    const v = t(k);
    if (v.length < min) errors[k] = `Enter ${label}.`;
    else if (v.length > max) errors[k] = `At most ${max} characters.`;
  };
  need("title", "the job title", 2, 160);
  need("department", "the department", 1, 80);
  need("location", "the location", 1, 80);
  need("level", "the level, for example Mid level", 1, 60);
  need("summary", "a short summary of the role", 1, 2000);
  if (!EMPLOYMENT_TYPES.some((e) => e.value === type)) errors.employment_type = "Choose the type of engagement.";
  if (duties.length > 20 || duties.some((d) => d.length > 400)) errors.duties = "At most 20 lines of up to 400 characters.";
  if (requirements.length > 20 || requirements.some((d) => d.length > 400)) errors.requirements = "At most 20 lines of up to 400 characters.";
  if (opens && !DATE.test(opens)) errors.opens_at = "Pick a date.";
  if (closes && !DATE.test(closes)) errors.closes_at = "Pick a date.";
  if (!errors.opens_at && !errors.closes_at && opens && closes && closes < opens) errors.closes_at = "The closing date must be on or after the opening date.";
  const unchanged = current?.status === "open" && (current.closes_at ?? "") === closes;
  if (status === "open" && closes && !errors.closes_at && closes < ghanaToday() && !unchanged) {
    errors.closes_at = "An open role needs a closing date today or later (or none).";
  }
  if (!Number.isInteger(sort) || Math.abs(sort) > 100000) errors.sort = "Use a whole number.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    details: {
      reference, title: t("title"), department: t("department"), location: t("location"), employment_type: type, level: t("level"),
      summary: t("summary"), duties, requirements, status, opens_at: opens || null, closes_at: closes || null,
      urgent: raw.urgent === "yes", sort,
    },
  };
}
