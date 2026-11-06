import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { FIELD_PHOTO_MAX_BYTES, FIELD_PHOTOS_BUCKET, sniffFieldPhoto } from "@lexta/db";
import { UUID } from "@/lib/crm";
import { FIELD_BASE, fieldDbError, getFieldAccess } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Adds one photo to a visit. multipart/form-data with "file" and "photo_id" (a nonce the phone made). The file is
 * checked here by its first bytes (JPEG, PNG or WebP, whatever its name or declared type) and its size, then stored
 * with the person's own session, so the bucket's policies decide whether they may add to this visit. Sending the
 * same photo_id again (a retry) answers ok without adding it twice.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: visitId } = await params;
  const access = await getFieldAccess();
  if (!access.canView) return fail("Your role does not include field sales.", 403);
  if (!UUID.test(visitId)) return fail("This visit could not be found.", 404);
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > FIELD_PHOTO_MAX_BYTES + 64 * 1024) return fail("Photos can be up to 5 MB.", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("The photo could not be read. Please try again.", 400);
  }
  const photoId = String(form.get("photo_id") ?? "");
  const file = form.get("file");
  if (!UUID.test(photoId)) return fail("The photo could not be read. Please try again.", 400);
  if (!file || typeof file === "string") return fail("Choose a photo.", 400);
  if (file.size < 1 || file.size > FIELD_PHOTO_MAX_BYTES) return fail("Photos can be up to 5 MB.", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffFieldPhoto(bytes.subarray(0, 12));
  if (!kind) return fail("That file is not a photo. Use a JPG, PNG or WebP image.", 415);

  const supabase = await createClient();
  // A retry of an upload that went through: nothing more to do.
  const { data: existing } = await supabase.from("field_visit_photos").select("id, visit_id").eq("id", photoId).maybeSingle();
  if (existing) {
    return existing.visit_id === visitId ? NextResponse.json({ id: photoId, created: false }) : fail("The photo could not be read. Please try again.", 400);
  }
  const { data: visit } = await supabase.from("field_visits").select("id").eq("id", visitId).maybeSingle();
  if (!visit) return fail("This visit could not be found.", 404);

  const path = `${visitId}/${photoId}.${kind.ext}`;
  const { error: upError } = await supabase.storage.from(FIELD_PHOTOS_BUCKET)
    .upload(path, bytes, { contentType: kind.mime, upsert: false, cacheControl: "3600" });
  if (upError) {
    const e = upError as { statusCode?: string; status?: number; message?: string };
    const duplicate = e.statusCode === "409" || /exist|duplicate/i.test(e.message ?? "");
    if (!duplicate) {
      if (e.statusCode === "403" || /row-level security|unauthorized/i.test(e.message ?? "")) {
        return fail("This visit can no longer take photos. Reps can add photos for 24 hours.", 403);
      }
      console.error("[field-sales] photo upload failed", upError);
      return fail("The photo could not be uploaded. Please try again.", 502);
    }
  }
  const { error } = await supabase.from("field_visit_photos").insert({
    id: photoId, visit_id: visitId, storage_path: path, mime_type: kind.mime, size_bytes: bytes.byteLength,
  });
  if (error && error.code !== "23505") {
    const status = ["42501", "23514"].includes(error.code ?? "") ? 422 : 500;
    return fail(fieldDbError(error, "photo record"), status);
  }
  revalidatePath(`${FIELD_BASE}/visits/${visitId}`);
  return NextResponse.json({ id: photoId, created: !error });
}
