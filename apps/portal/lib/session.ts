import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Profile } from "@lexta/db";
import { createClient } from "./supabase/server";

/** The signed in person and their profile, checked on the server. Redirects to /login when signed out. */
export const requireSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, is_active, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  return { user, profile: profile ?? null };
});
