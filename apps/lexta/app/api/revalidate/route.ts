import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { PRODUCTS_CACHE_TAG } from "@lexta/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pages that show product data. Add brand pages here as they are converted. */
const PRODUCT_PATHS = ["/our-brands"];

function sameSecret(given: string, expected: string) {
  // Compare fixed length digests so the check takes the same time whatever was sent.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Called by the portal after a product is saved or published, so the site shows the change right away.
 * Requires the x-revalidate-secret header to equal REVALIDATE_SECRET.
 */
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    console.warn("[revalidate] REVALIDATE_SECRET is not set; refusing the request");
    return Response.json({ ok: false, error: "Revalidation is not configured" }, { status: 503 });
  }
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!sameSecret(given, expected)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(PRODUCTS_CACHE_TAG);
  for (const path of PRODUCT_PATHS) revalidatePath(path);
  return Response.json({ ok: true, revalidated: { tags: [PRODUCTS_CACHE_TAG], paths: PRODUCT_PATHS }, at: new Date().toISOString() });
}
