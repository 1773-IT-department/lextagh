import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { PRODUCTS_CACHE_TAG, STOCKISTS_CACHE_TAG } from "@lexta/db";
import { RANGE_SLUGS } from "@/lib/ranges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pages that show each kind of data. Products show on Home (highlights), Products and every range page; stockists on
 * Contact & Where to Buy. The same route, secret and body as the Lexta site's, so the portal refreshes this site by
 * adding its address to SITE_REVALIDATE_URLS.
 */
const TARGETS: ReadonlyMap<string, readonly string[]> = new Map([
  [PRODUCTS_CACHE_TAG, ["/", "/products", ...RANGE_SLUGS.map((r) => `/products/${r}`)]],
  [STOCKISTS_CACHE_TAG, ["/contact"]],
]);

function sameSecret(given: string, expected: string) {
  // Compare fixed length digests so the check takes the same time whatever was sent.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Which tags the portal asked for. Unknown or missing tags mean "refresh everything". */
async function requestedTags(request: Request): Promise<string[]> {
  try {
    const body = (await request.json()) as { tags?: unknown };
    if (Array.isArray(body?.tags)) {
      // Only the tags in the allow list above; anything else (for example "toString") is ignored.
      const tags = body.tags.filter((t): t is string => typeof t === "string" && TARGETS.has(t));
      if (tags.length) return [...new Set(tags)];
    }
  } catch {
    // No body or not JSON: fall through.
  }
  return [...TARGETS.keys()];
}

/**
 * Called by the portal after a product or stockist is saved, so the site shows the change right away.
 * Requires the x-revalidate-secret header to equal REVALIDATE_SECRET.
 * Optional JSON body: { "tags": ["products"] } or { "tags": ["stockists"] } (other tags are ignored).
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

  const tags = await requestedTags(request);
  const paths = [...new Set(tags.flatMap((t) => TARGETS.get(t) ?? []))];
  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);
  return Response.json({ ok: true, revalidated: { tags, paths }, at: new Date().toISOString() });
}
