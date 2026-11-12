import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Profile } from "@lexta/db";
import { createClient } from "./supabase/server";

/** The subject (user id) written in an access token. Not trusted on its own: see requireSession. */
function tokenSubject(token: string): string | null {
  try {
    const sub = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString()).sub;
    return typeof sub === "string" && sub ? sub : null;
  } catch {
    return null;
  }
}

/**
 * The signed in person and their profile, checked on the server. Redirects to /login when signed out.
 *
 * Speed: the middleware has already asked Supabase Auth about this session (getUser) on this very request. Here the
 * token's signature and expiry are checked with getClaims, which needs no call to Supabase when the project signs
 * tokens with an asymmetric key (it then falls back to the same getUser call as before), and the profile is read at
 * the same time instead of after it. The profile read carries the same token, so the database checks it as well, and
 * its answer is used only when getClaims accepted that token and its subject is the id that was read. The role always
 * comes from the profiles table, never from the token.
 */
export const requireSession = cache(async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const sub = token ? tokenSubject(token) : null;
  if (!token || !sub) redirect("/login");
  const [claimsRes, profileRes] = await Promise.all([
    supabase.auth.getClaims(token),
    supabase
      .from("profiles")
      .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
      .eq("id", sub)
      .maybeSingle<Profile>(),
  ]);
  const claims = claimsRes.data?.claims;
  if (claimsRes.error || !claims || claims.sub !== sub) redirect("/login");
  const profile = profileRes.data && profileRes.data.id === sub ? profileRes.data : null;
  return { user: { id: sub, email: typeof claims.email === "string" ? claims.email : undefined }, profile };
});
