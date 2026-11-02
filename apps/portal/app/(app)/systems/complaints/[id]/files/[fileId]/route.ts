import { NextResponse, type NextRequest } from "next/server";
import { COMPLAINT_FILES_BUCKET } from "@lexta/db";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Opens a complaint file. The file record is read with the person's own session, so Row Level Security decides who
 * may open it; the storage policies check again when the signed link is made. The link works for one minute.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params;
  if (!UUID.test(id) || !UUID.test(fileId)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", _req.url));
  const { data: file } = await supabase.from("complaint_files").select("storage_path, file_name")
    .eq("id", fileId).eq("complaint_id", id).maybeSingle();
  if (!file) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from(COMPLAINT_FILES_BUCKET)
    .createSignedUrl(file.storage_path as string, 60, { download: file.file_name as string });
  if (error || !data?.signedUrl) return new NextResponse("This file could not be opened. Please try again.", { status: 502 });
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
