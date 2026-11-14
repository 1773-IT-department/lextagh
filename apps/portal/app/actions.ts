"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { homePathFor } from "@/lib/management";
import { DISTRIBUTOR_HOME, isDistributorPath } from "@/lib/systems";

export type FormState = { error?: string; message?: string; email?: string };


export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || !password) return { error: "Please enter your email and password.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password do not match. Please try again or reset your password.", email };
  const next = safeNext(form.get("next"));
  // A distributor only ever goes to their ordering area, and admin and management land on the management overview:
  // straight there (a second redirect inside this action's response leaves the browser on an empty page). A
  // distributor goes there whatever "next" asks for outside it; the others only when "next" is the home page.
  if (!isDistributorPath(next) && data.user) {
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).maybeSingle();
    if (profile?.is_active && profile.role === "distributor") redirect(DISTRIBUTOR_HOME);
    if (next === "/") redirect(homePathFor(profile?.is_active ? profile.role : null));
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim();
  if (!email) return { error: "Please enter your email." };
  const h = await headers();
  // Prefer the configured portal address; fall back to the request host for previews.
  const origin = process.env.NEXT_PUBLIC_PORTAL_URL?.replace(/\/$/, "") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/confirm?next=/set-password` });
  // Same reply whether or not the email exists, so the form cannot be used to find accounts.
  return { message: "If that email has a login, a reset link is on its way. Check your inbox." };
}

export async function setPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your link has expired. Ask for a new one from the login page." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "We could not save that password. Please try a different one." };
  // Straight to the person's home (one redirect only, see signIn).
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (profile?.is_active && profile.role === "distributor") redirect(DISTRIBUTOR_HOME);
  redirect(homePathFor(profile?.is_active ? profile.role : null));
}
