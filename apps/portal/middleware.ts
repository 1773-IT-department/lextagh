import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Node.js, not the edge: Vercel runs edge middleware near the visitor, far from the database, and the getUser call
  // in lib/supabase/middleware.ts would cross to Ireland on every request. Node middleware runs in the project's function region (dub1, see
  // vercel.json), next to Supabase in eu-west-1. Stable since Next.js 15.5.
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
