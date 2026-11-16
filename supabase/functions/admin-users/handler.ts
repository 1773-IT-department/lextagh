// The admin-users Edge Function's logic, kept free of Deno and Supabase imports so the local harness can run it with
// a stand in for the Auth admin API (supabase/tests/local/users). index.ts wires it to the real service role client.
//
// Every call must carry the signed in admin's access token. The function checks the token with Auth, then checks in
// public.profiles that the person is an active admin, before it does anything. The service role key never leaves
// Supabase.

export const ROLES = ["admin", "management", "sales_rep", "distributor", "customer_care", "hr", "marketing"] as const;
export type Role = (typeof ROLES)[number];

export type AuthUser = { id: string; email: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> };

export type Deps = {
  /** Who the access token belongs to, or null when Auth does not accept it. */
  userFromToken(token: string): Promise<{ id: string } | null>;
  /** The caller's profile (service role read). */
  profile(id: string): Promise<{ id: string; role: string | null; is_active: boolean } | null>;
  /** A profile by email (service role read), to refuse a second invite for the same address. */
  profileByEmail(email: string): Promise<{ id: string } | null>;
  getUser(id: string): Promise<AuthUser | null>;
  invite(email: string, fullName: string | null, redirectTo: string): Promise<{ user: AuthUser | null; error: string | null }>;
  setAppRole(id: string, role: Role | null): Promise<string | null>;
  ban(id: string, banned: boolean): Promise<string | null>;
  sendPasswordReset(email: string, redirectTo: string): Promise<string | null>;
  /** Deletes the Auth user. The profile, brands and distributor link go with it; records they made keep a blank name. */
  deleteUser(id: string): Promise<string | null>;
  /** public.admin_apply_user as the service role. Returns the database's error message, or null. */
  apply(args: {
    actor: string; target: string; fullName: string | null; phone: string | null; role: Role | null; brands: string[];
    active: boolean; organisation: string | null; quiet: boolean;
  }): Promise<string | null>;
  audit(row: { actor_id: string; target_id: string | null; target_email: string; action: string; details?: Record<string, unknown> }): Promise<void>;
  portalUrl: string;
};

export type Result = { status: number; body: { ok: true; message: string; userId?: string } | { ok: false; error: string } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[0-9][0-9 ()-]{5,22}$/;
const BRANDS = /^[a-z0-9-]{1,40}$/;

const fail = (status: number, error: string): Result => ({ status, body: { ok: false, error } });
const done = (message: string, userId?: string): Result => ({ status: 200, body: { ok: true, message, ...(userId ? { userId } : {}) } });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Where invite and reset emails send people: the portal's link handler, then the choose a password page. */
export const confirmUrl = (portalUrl: string) => `${portalUrl.replace(/\/+$/, "")}/auth/confirm?next=/set-password`;

/** Database messages written for people (see apps/portal/lib/db-errors.ts); anything else becomes a generic line. */
function friendly(message: string | null): string {
  if (!message) return "That did not go through. Please try again.";
  if (/row-level security|permission denied|violates|duplicate key|syntax|column|relation|function/i.test(message)) {
    return "That did not go through. Please try again.";
  }
  const t = message.charAt(0).toUpperCase() + message.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

export async function handle(authHeader: string | null, payload: unknown, deps: Deps): Promise<Result> {
  const token = /^Bearer\s+(.+)$/i.exec(authHeader ?? "")?.[1];
  if (!token) return fail(401, "Please sign in again.");
  const caller = await deps.userFromToken(token);
  if (!caller) return fail(401, "Please sign in again.");
  const me = await deps.profile(caller.id);
  if (!me || me.role !== "admin" || !me.is_active) return fail(403, "Only an admin can manage logins.");

  const body = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const action = str(body.action, 40);

  if (action === "ping") return done("ready");

  if (action === "invite") {
    const email = str(body.email, 254).toLowerCase();
    const fullName = str(body.full_name, 120) || null;
    const phone = str(body.phone, 30) || null;
    const role = str(body.role, 40) as Role;
    const brands = Array.isArray(body.brands) ? body.brands.map((b) => str(b, 40)).filter((b) => BRANDS.test(b)) : [];
    const organisation = str(body.organisation_id, 40) || null;
    if (!EMAIL.test(email)) return fail(400, "Please enter a valid email address.");
    if (!ROLES.includes(role)) return fail(400, "Please choose a role.");
    if (phone && !PHONE.test(phone)) return fail(400, "The phone number does not look right.");
    if (organisation && !UUID.test(organisation)) return fail(400, "Please choose the distributor's organisation again.");
    if (await deps.profileByEmail(email)) return fail(409, "This email already has a login. Find it in the list instead.");

    const invited = await deps.invite(email, fullName, confirmUrl(deps.portalUrl));
    if (invited.error || !invited.user) {
      return fail(502, /rate limit|too many/i.test(invited.error ?? "")
        ? "Supabase is limiting how many emails can be sent right now. Please try again in an hour."
        : "The invite email could not be sent. Please check the address and try again.");
    }
    const id = invited.user.id;
    const applied = await deps.apply({ actor: me.id, target: id, fullName, phone, role, brands, active: true, organisation, quiet: true });
    await deps.setAppRole(id, role);
    await deps.audit({ actor_id: me.id, target_id: id, target_email: email, action: "invited",
      details: { role, brands, ...(organisation ? { organisation_id: organisation } : {}) } });
    if (applied) {
      return fail(500, `The invite was sent, but the role could not be saved: ${friendly(applied)} Open the login in the list to set it.`);
    }
    return done(`Invite sent to ${email}. They choose their password from the email.`, id);
  }

  const target = str(body.user_id, 40);
  if (!UUID.test(target)) return fail(400, "Please choose the login again.");
  const user = await deps.getUser(target);
  if (!user) return fail(404, "That login no longer exists.");

  if (action === "resend_invite") {
    // Auth only re-sends an invite to someone who has not accepted it yet. Someone who already accepted (and may have
    // lost or forgotten their password) gets the same kind of link through a password email: it opens the choose a
    // password page, exactly like the invite does.
    if (!user.email_confirmed_at) {
      const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
      const res = await deps.invite(user.email, fullName, confirmUrl(deps.portalUrl));
      if (!res.error) {
        await deps.audit({ actor_id: me.id, target_id: target, target_email: user.email, action: "invite_resent" });
        return done(`Invite sent again to ${user.email}.`);
      }
      if (/rate limit|too many/i.test(res.error)) {
        return fail(502, "Supabase is limiting how many emails can be sent right now. Please try again in an hour.");
      }
      if (!/already|registered|exists/i.test(res.error)) return fail(502, "The invite email could not be sent. Please try again later.");
    }
    const err = await deps.sendPasswordReset(user.email, confirmUrl(deps.portalUrl));
    if (err) {
      return fail(502, /rate limit|too many|seconds/i.test(err)
        ? "Supabase is limiting how many emails can be sent right now. Please wait a minute and try again."
        : "The invite email could not be sent. Please try again later.");
    }
    await deps.audit({ actor_id: me.id, target_id: target, target_email: user.email, action: "invite_resent",
      details: { via: "password_link" } });
    return done(`${user.email} had already accepted the invite, so a new link to choose their password was sent instead.`);
  }

  if (action === "remove") {
    if (target === me.id) return fail(400, "You cannot remove your own login.");
    const err = await deps.deleteUser(target);
    if (err) return fail(502, "The login could not be removed. Please try again.");
    // Written after the delete, so target_id is blank (the profile is gone); the email keeps the record readable.
    await deps.audit({ actor_id: me.id, target_id: null, target_email: user.email, action: "removed", details: { user_id: target } });
    return done(`${user.email} was removed. They can no longer sign in, and you can invite the address again.`);
  }

  if (action === "reset_password") {
    const err = await deps.sendPasswordReset(user.email, confirmUrl(deps.portalUrl));
    if (err) return fail(502, "The password reset email could not be sent. Please try again later.");
    await deps.audit({ actor_id: me.id, target_id: target, target_email: user.email, action: "password_reset_sent" });
    return done(`Password reset email sent to ${user.email}.`);
  }

  // Keeps sign in in step with the switch the portal already saved in public.profiles (admin_update_user writes the
  // audit row): a switched off login cannot sign in at all; switched on again, it can.
  if (action === "sync_access") {
    const target_profile = await deps.profile(target);
    if (!target_profile) return fail(404, "That login no longer exists.");
    if (target === me.id && !target_profile.is_active) return fail(400, "You cannot block your own sign in.");
    const err = await deps.ban(target, !target_profile.is_active);
    if (err) return fail(502, "Access was changed, but sign in could not be updated. Please try again.");
    return done(target_profile.is_active ? "Sign in is allowed again." : "Sign in is blocked.");
  }

  return fail(400, "Unknown request.");
}
