import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

const PUBLIC_PATHS = ["/login", "/forgot-password"];

/** Request header with the path being opened, for server components (they cannot read the URL themselves). */
export const PATH_HEADER = "x-lexta-path";

/** Refreshes the Supabase session cookie on every request and sends signed out people to /login. */
export async function updateSession(request: NextRequest) {
  // The path travels to the signed in shell, which keeps distributors inside their ordering area (app/(app)/layout.tsx).
  // Built from the request's current headers each time, so refreshed session cookies go along too.
  // Server action requests are left out: their response may render another page (after a redirect), so their own path
  // says nothing about the page shown. A value sent by the browser is never trusted.
  const next = () => {
    const headers = new Headers(request.headers);
    headers.delete(PATH_HEADER);
    if (!request.headers.has("next-action")) headers.set(PATH_HEADER, request.nextUrl.pathname);
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
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = path !== "/" ? `?next=${encodeURIComponent(path)}` : "";
    return NextResponse.redirect(url);
  }
  return response;
}
