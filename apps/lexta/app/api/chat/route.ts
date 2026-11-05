import { handleChat } from "@/lib/chat/server";

// Live chat widget calls (start, send, read). The work happens in lib/chat/server.ts; this only checks the request
// came from this site, reads the body and the visitor's address. Never cached.
export const dynamic = "force-dynamic";

const MAX_BODY = 8000;

export async function POST(request: Request) {
  const noStore = { "cache-control": "no-store" };
  // Only this site's own pages call it: a browser sends Origin on a POST, and it must be this host.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    let originHost = "";
    try { originHost = new URL(origin).host; } catch { /* stays empty */ }
    if (!host || originHost !== host) return Response.json({ ok: false, code: "error", message: "Not allowed." }, { status: 403, headers: noStore });
  }
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return Response.json({ ok: false, code: "invalid", message: "Expected JSON." }, { status: 415, headers: noStore });
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return Response.json({ ok: false, code: "invalid", message: "Too long." }, { status: 413, headers: noStore });
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = null; }
  // The visitor's address: x-real-ip, which Vercel sets to the connecting client, else the first x-forwarded-for value.
  // This assumes the site runs on Vercel with no other proxy or CDN in front; behind one, every visitor would share
  // the proxy's address and its limits. Many real visitors share an address anyway (mobile CGNAT), see 0009.
  const ip = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const result = await handleChat(body, { ip });
  return Response.json(result.body, { status: result.status, headers: noStore });
}
