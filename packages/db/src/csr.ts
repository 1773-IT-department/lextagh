// CSR activity tracker (item 25) types and limits. Hand written from supabase/migrations/0013_csr_tracker.sql.
// No imports, so browser components can load it without the Supabase client.

export const CSR_PHOTOS_BUCKET = "csr-activity-photos";
/** The bucket's limit. Photos are shrunk in the browser before upload, so real uploads are far smaller. */
export const CSR_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const CSR_PHOTO_MAX_PER_ACTIVITY = 20;
export const CSR_PLACE_MAX = 160;
export const CSR_PARTNERS_MAX = 500;
export const CSR_NOTES_MAX = 4000;
export const CSR_PEOPLE_MAX = 10_000_000;
export const CSR_PROGRAMME_NAME_MAX = 120;
export const CSR_PROGRAMME_DESCRIPTION_MAX = 2000;

export type CsrStatus = "planned" | "done";
export const CSR_STATUS_LABELS: Readonly<Record<CsrStatus, string>> = { done: "Done", planned: "Planned" };

export type CsrProgramme = {
  id: string;
  name: string;
  brand_id: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  needs_review: boolean;
};

/** One row of public.csr_activity_list(). */
export type CsrActivityRow = {
  id: string;
  activity_date: string;
  status: CsrStatus;
  programme_id: string;
  programme_name: string;
  brand_id: string | null;
  region_id: string | null;
  region_name: string | null;
  place: string;
  people_reached: number;
  partners: string | null;
  notes: string | null;
  photo_count: number;
  created_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
  total_count: number;
};

/** One row of public.csr_programme_totals(). Counts arrive as numbers or strings (bigint). */
export type CsrProgrammeTotal = {
  programme_id: string;
  programme_name: string;
  brand_id: string | null;
  is_active: boolean;
  sort_order: number;
  activities_done: number | string;
  people_reached: number | string;
  last_activity_date: string | null;
  activities_planned: number | string;
  next_planned_date: string | null;
};

export type CsrActivityPhoto = {
  id: string;
  activity_id: string;
  storage_path: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
  created_at: string;
  created_by: string | null;
};
