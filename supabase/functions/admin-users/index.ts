// Supabase Edge Function: admin-users. The privileged half of Users and access in the Lexta Business System
// (apps/portal/app/(app)/systems/users): sending invites, resending them, password reset emails and blocking sign in
// for a switched off login. Runs inside Supabase with the built in SUPABASE_SERVICE_ROLE_KEY; the portal only ever
// sends the signed in admin's own access token.
//
// Deploy:  supabase functions deploy admin-users --project-ref euqirakpychkhpwoszos
// Optional secret: PORTAL_URL (default https://lexta-portal.vercel.app), where invite and reset emails send people.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { handle, type Deps, type Role } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const deps: Deps = {
  portalUrl: Deno.env.get("PORTAL_URL") ?? "https://lexta-portal.vercel.app",
  async userFromToken(token) {
    const { data, error } = await admin.auth.getUser(token);
    return error || !data.user ? null : { id: data.user.id };
  },
  async profile(id) {
    const { data } = await admin.from("profiles").select("id, role, is_active").eq("id", id).maybeSingle();
    return data ?? null;
  },
  async profileByEmail(email) {
    const { data } = await admin.from("profiles").select("id").ilike("email", email).limit(1).maybeSingle();
    return data ?? null;
  },
  async getUser(id) {
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? "", email_confirmed_at: data.user.email_confirmed_at ?? null, user_metadata: data.user.user_metadata };
  },
  async invite(email, fullName, redirectTo) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: fullName ? { full_name: fullName } : {} });
    if (error) console.error("[admin-users] invite failed", error.message);
    return { user: data?.user ? { id: data.user.id, email: data.user.email ?? email } : null, error: error?.message ?? null };
  },
  async setAppRole(id, role: Role | null) {
    const { error } = await admin.auth.admin.updateUserById(id, { app_metadata: { role } });
    return error?.message ?? null;
  },
  async ban(id, banned) {
    const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: banned ? "876000h" : "none" });
    return error?.message ?? null;
  },
  async sendPasswordReset(email, redirectTo) {
    const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
    return error?.message ?? null;
  },
  async apply(a) {
    const { error } = await admin.rpc("admin_apply_user", {
      actor: a.actor, target: a.target, new_full_name: a.fullName, new_phone: a.phone, new_role: a.role,
      new_brands: a.brands, new_active: a.active, new_organisation: a.organisation, quiet: a.quiet,
    });
    return error?.message ?? null;
  },
  async audit(row) {
    const { error } = await admin.from("user_admin_audit").insert({ details: {}, ...row });
    if (error) console.error("[admin-users] audit failed", error.message);
  },
};

Deno.serve(async (req) => {
  const headers = { "content-type": "application/json" };
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "POST only" }), { status: 405, headers });
  let payload: unknown = null;
  try { payload = await req.json(); } catch { /* handled as an empty request */ }
  const result = await handle(req.headers.get("authorization"), payload, deps);
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
});
