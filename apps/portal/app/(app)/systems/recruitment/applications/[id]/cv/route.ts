import { NextResponse, type NextRequest } from "next/server";
import { JOB_CV_TYPES, JOB_CVS_BUCKET } from "@lexta/db";
import { getRecruitmentAccess } from "@/lib/recruitment";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TYPES = new Set<string>(Object.values(JOB_CV_TYPES));

/**
 * A Content-Disposition for the applicant's file name: a plain ASCII fallback and the exact name as RFC 5987
 * filename* (the database already keeps names to letters, digits, spaces, dots, dashes, underscores and brackets).
 */
function cvDisposition(name: string): string {
  const clean = name.replace(/[\u0000-\u001f\u007f/\\]/g, "_").slice(0, 200) || "cv";
  const ascii = clean.replace(/[^A-Za-z0-9 ._()-]/g, "_");
  const star = encodeURIComponent(clean).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${star}`;
}

/**
 * Downloads an applicant's CV. The application and the file are read with the person's own session, so Row Level
 * Security decides who may open them (admin, management, hr), after a role check here; no link to the file ever leaves the server.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  // Row Level Security decides as well; this refuses everyone outside recruitment before any read.
  const access = await getRecruitmentAccess();
  if (!access.canView) return new NextResponse("Not found", { status: 404 });
  const { data: app } = await supabase.from("job_applications").select("cv_path, cv_file_name, cv_mime_type").eq("id", id).maybeSingle();
  if (!app?.cv_path) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from(JOB_CVS_BUCKET).download(app.cv_path as string);
  if (error || !data) return new NextResponse("This CV could not be opened. Please try again.", { status: 502 });
  const type = TYPES.has(app.cv_mime_type as string) ? (app.cv_mime_type as string) : "application/octet-stream";
  return new NextResponse(data, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": cvDisposition((app.cv_file_name as string) || "cv"),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
