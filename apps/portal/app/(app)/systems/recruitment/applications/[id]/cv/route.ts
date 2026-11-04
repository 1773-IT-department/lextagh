import { NextResponse, type NextRequest } from "next/server";
import { JOB_CVS_BUCKET } from "@lexta/db";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Opens an applicant's CV. The application is read with the person's own session, so Row Level Security decides
 * who may open it (admin, management, hr); the storage policy checks again when the signed link is made. The link
 * works for one minute and downloads under the applicant's file name.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const { data: app } = await supabase.from("job_applications").select("cv_path, cv_file_name").eq("id", id).maybeSingle();
  if (!app?.cv_path) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from(JOB_CVS_BUCKET)
    .createSignedUrl(app.cv_path as string, 60, { download: (app.cv_file_name as string) || true });
  if (error || !data?.signedUrl) return new NextResponse("This CV could not be opened. Please try again.", { status: 502 });
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
