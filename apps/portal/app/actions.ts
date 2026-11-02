"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string; email?: string };

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || !password) return { error: "Please enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password do not match. Please try again or reset your password.", email };
  redirect(safeNext(form.get("next")));
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
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
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
  redirect("/");
}
