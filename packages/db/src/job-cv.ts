// CV file rules shared by the website (server and browser) and the portal. No imports, so a browser component can
// load it without the Supabase client. Same rules as the job-cvs bucket and public.job_cv_path_ok (0008_recruitment.sql).

export const JOB_CVS_BUCKET = "job-cvs";
/** 4 MB: the bucket's limit, and with the form's other fields still under Vercel's 4.5 MB request limit. */
export const JOB_CV_MAX_BYTES = 4 * 1024 * 1024;
/** File extension to the content type Storage records (the bucket allows only these three). */
export const JOB_CV_TYPES: Readonly<Record<"pdf" | "doc" | "docx", string>> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** The extension of a CV file name (pdf, doc or docx), or null when it is not one of those. */
export function jobCvExtension(fileName: string): keyof typeof JOB_CV_TYPES | null {
  const ext = /\.([A-Za-z]+)$/.exec(fileName.trim())?.[1]?.toLowerCase();
  return ext === "pdf" || ext === "doc" || ext === "docx" ? ext : null;
}

/**
 * A path of the shape website uploads use: incoming/<uuid>/<safe name>.<ext>. The database makes the real path when
 * it issues an upload ticket (public.begin_job_cv_upload, same rule); this is for tests and checks. Null for other
 * file types.
 */
export function jobCvUploadPath(fileName: string, uuid: string = crypto.randomUUID()): string | null {
  const ext = jobCvExtension(fileName);
  if (!ext) return null;
  const stem = fileName.trim().replace(/\.[A-Za-z]+$/, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[^A-Za-z0-9]+/, "").slice(0, 80).replace(/[._-]+$/, "");
  return `incoming/${uuid}/${stem || "cv"}.${ext}`;
}

const CV_PATH = /^incoming\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.(pdf|doc|docx)$/i;
export const isJobCvUploadPath = (path: string) => CV_PATH.test(path);

/** The first bytes of a real PDF (%PDF-), DOC (OLE compound file) or DOCX (zip). Needs the first 8 bytes. */
export function looksLikeCv(ext: keyof typeof JOB_CV_TYPES, head: Uint8Array): boolean {
  const starts = (sig: number[]) => sig.every((b, i) => head[i] === b);
  if (ext === "pdf") return starts([0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (ext === "doc") return starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  return starts([0x50, 0x4b, 0x03, 0x04]);
}

