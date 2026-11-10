import { NextResponse, type NextRequest } from "next/server";
import { FIELD_PHOTOS_BUCKET, sniffFieldPhoto } from "@lexta/db";
import { UUID } from "@/lib/crm";
import { fieldApiAccess } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Shows a visit photo. The record and the file are read with the person's own session, so Row Level Security and the
 * bucket's policies decide who may see it (the rep who made the visit, management and admin). The bytes are checked
 * again and sent with the type they really are, never one taken from the upload.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await params;
  if (!UUID.test(id) || !UUID.test(photoId)) return new NextResponse("Not found", { status: 404 });
  const access = await fieldApiAccess();
  if (!access) return new NextResponse("Your session has ended, please sign in again.", { status: 401, headers: { "Cache-Control": "no-store" } });
  // Roles without field sales get the same answer as a photo that does not exist.
  if (!access.canView) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: photo } = await supabase.from("field_visit_photos").select("storage_path")
    .eq("id", photoId).eq("visit_id", id).maybeSingle();
  if (!photo) return new NextResponse("Not found", { status: 404 });
  const { data: blob, error } = await supabase.storage.from(FIELD_PHOTOS_BUCKET).download(photo.storage_path as string);
  if (error || !blob) return new NextResponse("This photo could not be opened. Please try again.", { status: 502 });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const kind = sniffFieldPhoto(bytes.subarray(0, 12));
  if (!kind) return new NextResponse("This file is not a photo.", { status: 415 });
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": kind.mime,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename="visit-photo.${kind.ext}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
