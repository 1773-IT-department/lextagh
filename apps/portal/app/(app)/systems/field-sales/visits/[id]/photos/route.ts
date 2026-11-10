import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { FIELD_PHOTO_MAX_BYTES, FIELD_PHOTOS_BUCKET, sniffFieldPhoto } from "@lexta/db";
import { UUID } from "@/lib/crm";
import { FIELD_BASE, fieldApiAccess, fieldDbError, SESSION_ENDED } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** retry: false tells the phone not to send again (the answer will not change). */
const fail = (error: string, status: number, retry?: boolean) =>
  NextResponse.json(retry === undefined ? { error } : { error, retry }, { status });

const NOT_SET_UP = "Photo uploads are not set up yet. The visit is saved; tell the IT team.";

/** Same text and secret as public.record_field_visit_photo (0011_field_sales.sql). */
function sign(secret: string, photoId: string, visitId: string, mime: string, size: number, issuedAt: number) {
  return createHmac("sha256", secret).update(`field-photo.${photoId}.${visitId}.${mime}.${size}.${issuedAt}`).digest("hex");
}

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.byteLength === b.byteLength && a.every((x, i) => x === b[i]);

/**
 * Adds one photo to a visit. multipart/form-data with "file" and "photo_id" (a nonce the phone made).
 * 1. The file is checked here by its first bytes (JPEG, PNG or WebP, whatever its name or declared type) and size.
 * 2. It is stored with the person's own session, so the bucket's policies decide whether they may add to this visit.
 *    When a file is already at that path (a retry whose answer was lost), it is used only if its bytes are exactly
 *    the ones checked here; anything else is refused, so bytes sent straight to Storage are never recorded.
 * 3. The record is made by public.record_field_visit_photo with a signature only this server can make
 *    (FIELD_PHOTO_SECRET), which the database checks against the file's size and type in Storage.
 * Sending the same photo_id again answers ok without adding it twice.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: visitId } = await params;
  const access = await fieldApiAccess();
  if (!access) return fail(SESSION_ENDED, 401, false);
  if (!access.canView) return fail("Your role does not include field sales.", 403, false);
  if (!UUID.test(visitId)) return fail("This visit could not be found.", 404, false);
  const secret = process.env.FIELD_PHOTO_SECRET ?? "";
  if (secret.length < 32) {
    console.error("[field-sales] FIELD_PHOTO_SECRET is not set; photo uploads are refused");
    return fail(NOT_SET_UP, 503, false);
  }
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
    const e = upError as { statusCode?: string; message?: string };
    const duplicate = e.statusCode === "409" || /exist|duplicate/i.test(e.message ?? "");
    if (!duplicate) {
      if (e.statusCode === "403" || /row-level security|unauthorized/i.test(e.message ?? "")) {
        return fail("This visit can no longer take photos. Reps can add photos for 24 hours, up to 10 a visit.", 403, false);
      }
      console.error("[field-sales] photo upload failed", upError);
      return fail("The photo could not be uploaded. Please try again.", 502);
    }
    // Already there: only a file with exactly these checked bytes may be recorded.
    const { data: blob, error: readError } = await supabase.storage.from(FIELD_PHOTOS_BUCKET).download(path);
    if (readError || !blob) return fail("The photo could not be uploaded. Please try again.", 502);
    if (!sameBytes(new Uint8Array(await blob.arrayBuffer()), bytes)) {
      return fail("A different file is already stored under this photo. Please take the photo again.", 409, false);
    }
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const { error } = await supabase.rpc("record_field_visit_photo", {
    photo_id: photoId, visit_id: visitId, mime_type: kind.mime, size_bytes: bytes.byteLength, issued_at: issuedAt,
    signature: sign(secret, photoId, visitId, kind.mime, bytes.byteLength, issuedAt),
  });
  if (error) {
    if (error.code === "55000") {
      console.error("[field-sales] private.field_photo_secret is not set; photo uploads are refused");
      return fail(NOT_SET_UP, 503, false);
    }
    if (error.code === "22023" && (error.message ?? "").includes("signature")) {
      console.error("[field-sales] photo signature refused: FIELD_PHOTO_SECRET and private.field_photo_secret differ?", error);
      return fail(NOT_SET_UP, 503, false);
    }
    const status = error.code === "42501" ? 403 : ["23514", "22023"].includes(error.code ?? "") ? 422 : 500;
    return fail(fieldDbError(error, "photo record"), status, status < 500 ? false : undefined);
  }
  revalidatePath(`${FIELD_BASE}/visits/${visitId}`);
  return NextResponse.json({ id: photoId, created: true });
}
