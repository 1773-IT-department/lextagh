import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

const PUBLIC_PATHS = ["/login", "/forgot-password"];
/** JSON routes of field sales: shops, saving a visit, adding and showing photos. */
const FIELD_JSON_ROUTE = /^\/systems\/field-sales\/(shops|visits(\/[0-9a-f-]{36}\/photos(\/[0-9a-f-]{36})?)?)$/;

/** Request header with the path being opened, for server components (they cannot read the URL themselves). */
export const PATH_HEADER = "x-lexta-path";
/** Marks the path header of a server action request: "action:" and the page it was sent from. */
export const ACTION_PREFIX = "action:";

/** Refreshes the Supabase session cookie on every request and sends signed out people to /login. */
export async function updateSession(request: NextRequest) {
  // The path travels to the signed in shell, which keeps distributors inside their ordering area (app/(app)/layout.tsx).
  // Built from the request's current headers each time, so refreshed session cookies go along too. A value sent by the
  // browser is never trusted. A server action (a POST with a Next-Action header) is marked as such with the page it was
  // sent from ("action:<path>"): its response may render another page after a redirect, so its own path is not the
  // page shown. Every other request, whatever its headers, carries its own path.
  const next = () => {
    const headers = new Headers(request.headers);
    const isAction = request.method === "POST" && request.headers.has("next-action");
    headers.set(PATH_HEADER, `${isAction ? ACTION_PREFIX : ""}${request.nextUrl.pathname}`);
    return NextResponse.next({ request: { headers } });
  };
  let response = next();
  const env = supabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = next();
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not put code between createServerClient and getUser: it validates and refreshes the session.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path) || path.startsWith("/auth/");
  if (!user && !isPublic) {
    // The field sales phone app's JSON routes answer 401 instead of the login page, so the phone can say the session
    // ended rather than retry a page it cannot read.
    if (FIELD_JSON_ROUTE.test(path)) {
      return NextResponse.json({ error: "Your session has ended, please sign in again.", retry: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = path !== "/" ? `?next=${encodeURIComponent(path)}` : "";
    return NextResponse.redirect(url);
  }
  return response;
}
