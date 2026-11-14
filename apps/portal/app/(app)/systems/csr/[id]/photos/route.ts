import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { CSR_PHOTO_MAX_BYTES, CSR_PHOTOS_BUCKET, sniffFieldPhoto } from "@lexta/db";
import { UUID } from "@/lib/crm";
import { CSR_BASE, csrDbError, getCsrAccess } from "@/lib/csr";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** retry: false tells the browser not to send again (the answer will not change). */
const fail = (error: string, status: number, retry?: boolean) =>
  NextResponse.json(retry === undefined ? { error } : { error, retry }, { status });

const SESSION_ENDED = "Your session has ended, please sign in again.";
const NOT_SET_UP = "Photo uploads are not set up yet. The activity is saved; tell the IT team.";

/**
 * Same text as public.record_csr_activity_photo (0013_csr_tracker.sql). The secret is the portal's photo secret,
 * FIELD_PHOTO_SECRET (private.field_photo_secret, 0011); the 'csr-photo.' start keeps CSR and field sales signatures apart.
 */
function sign(secret: string, photoId: string, activityId: string, mime: string, size: number, issuedAt: number) {
  return createHmac("sha256", secret).update(`csr-photo.${photoId}.${activityId}.${mime}.${size}.${issuedAt}`).digest("hex");
}

const sameBytes = (a: Uint8Array, b: Uint8Array) => a.byteLength === b.byteLength && a.every((x, i) => x === b[i]);

/**
 * Adds one photo to an activity. multipart/form-data with "file" and "photo_id" (a nonce the browser made).
 * 1. The file is checked here by its first bytes (JPEG, PNG or WebP, whatever its name or declared type) and size.
 * 2. It is stored with the person's own session, so the bucket's policies decide whether they may add to this activity.
 *    When a file is already at that path (a retry whose answer was lost), it is used only if its bytes are exactly the
 *    ones checked here.
 * 3. The record is made by public.record_csr_activity_photo with a signature only this server can make, which the
 *    database checks against the file's size and type in Storage.
 * Sending the same photo_id again answers ok without adding it twice.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: activityId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail(SESSION_ENDED, 401, false);
  const access = await getCsrAccess();
  if (!access.canWrite) return fail("Your role cannot add CSR photos.", 403, false);
  if (!UUID.test(activityId)) return fail("This activity could not be found.", 404, false);
  const secret = process.env.FIELD_PHOTO_SECRET ?? "";
  if (secret.length < 32) {
    console.error("[csr] FIELD_PHOTO_SECRET is not set; photo uploads are refused");
    return fail(NOT_SET_UP, 503, false);
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > CSR_PHOTO_MAX_BYTES + 64 * 1024) return fail("Photos can be up to 5 MB.", 413, false);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("The photo could not be read. Please try again.", 400);
  }
  const photoId = String(form.get("photo_id") ?? "");
  const file = form.get("file");
  if (!UUID.test(photoId)) return fail("The photo could not be read. Please try again.", 400);
  if (!file || typeof file === "string") return fail("Choose a photo.", 400, false);
  if (file.size < 1 || file.size > CSR_PHOTO_MAX_BYTES) return fail("Photos can be up to 5 MB.", 413, false);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffFieldPhoto(bytes.subarray(0, 12));
  if (!kind) return fail("That file is not a photo. Use a JPG, PNG or WebP image.", 415, false);

  // A retry of an upload that went through: nothing more to do.
  const { data: existing } = await supabase.from("csr_activity_photos").select("id, activity_id").eq("id", photoId).maybeSingle();
  if (existing) {
    return existing.activity_id === activityId ? NextResponse.json({ id: photoId, created: false }) : fail("The photo could not be read. Please try again.", 400);
  }
  const { data: activity } = await supabase.from("csr_activities").select("id").eq("id", activityId).maybeSingle();
  if (!activity) return fail("This activity could not be found.", 404, false);

  const path = `${activityId}/${photoId}.${kind.ext}`;
  const { error: upError } = await supabase.storage.from(CSR_PHOTOS_BUCKET)
    .upload(path, bytes, { contentType: kind.mime, upsert: false, cacheControl: "3600" });
  if (upError) {
    const e = upError as { statusCode?: string; message?: string };
    const duplicate = e.statusCode === "409" || /exist|duplicate/i.test(e.message ?? "");
    if (!duplicate) {
      if (e.statusCode === "403" || /row-level security|unauthorized/i.test(e.message ?? "")) {
        return fail("You cannot add photos to this activity, or it already has 20 photos.", 403, false);
      }
      console.error("[csr] photo upload failed", upError);
      return fail("The photo could not be uploaded. Please try again.", 502);
    }
    const { data: blob, error: readError } = await supabase.storage.from(CSR_PHOTOS_BUCKET).download(path);
    if (readError || !blob) return fail("The photo could not be uploaded. Please try again.", 502);
    if (!sameBytes(new Uint8Array(await blob.arrayBuffer()), bytes)) {
      return fail("A different file is already stored under this photo. Please add the photo again.", 409, false);
    }
  }

  // Rounded up: the database refuses a file stored after this time (a swap between upload and record).
  const issuedAt = Math.ceil(Date.now() / 1000);
  const { error } = await supabase.rpc("record_csr_activity_photo", {
    photo_id: photoId, activity_id: activityId, mime_type: kind.mime, size_bytes: bytes.byteLength, issued_at: issuedAt,
    signature: sign(secret, photoId, activityId, kind.mime, bytes.byteLength, issuedAt),
  });
  if (error) {
    if (error.code === "55000") {
      console.error("[csr] private.field_photo_secret is not set; photo uploads are refused");
      return fail(NOT_SET_UP, 503, false);
    }
    if (error.code === "22023" && (error.message ?? "").includes("signature")) {
      console.error("[csr] photo signature refused: FIELD_PHOTO_SECRET and private.field_photo_secret differ?", error);
      return fail(NOT_SET_UP, 503, false);
    }
    const status = error.code === "42501" ? 403 : ["23514", "22023"].includes(error.code ?? "") ? 422 : 500;
    return fail(csrDbError(error, "photo record"), status, status < 500 ? false : undefined);
  }
  revalidatePath(`${CSR_BASE}/${activityId}`);
  return NextResponse.json({ id: photoId, created: true });
}
