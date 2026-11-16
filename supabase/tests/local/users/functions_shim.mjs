// Test only. Runs the admin-users Edge Function's real logic (supabase/functions/admin-users/handler.ts) inside the
// harness gateway, with the Auth admin API replaced by SQL on the stub auth.users table. Emails are not sent: each one
// is appended to USERS_MAIL_LOG (one JSON line) so the browser check can see who was invited or sent a reset.
// Database calls run as the service role, like the deployed function.
import { appendFileSync } from "node:fs";
import { psql } from "../forms/rpc_shim.mjs";
import { handle } from "../../../functions/admin-users/handler.ts";

const lit = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(lit).join(",")}]::text[]`;
async function one(sql) {
  const r = await psql(sql);
  if (r.code !== 0) throw new Error(r.err);
  return r.out ? JSON.parse(r.out) : null;
}
const mail = (kind, email, redirectTo) => {
  if (process.env.USERS_MAIL_LOG) appendFileSync(process.env.USERS_MAIL_LOG, `${JSON.stringify({ kind, email, redirectTo })}\n`);
};

export async function answerAdminUsers(req, body, send, verify) {
  const deps = {
    portalUrl: process.env.USERS_PORTAL_URL || "http://127.0.0.1:3104",
    async userFromToken(token) {
      if (!verify(token)) return null;
      return { id: JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub };
    },
    profile: (id) => one(`select row_to_json(p) from (select id, role, is_active from public.profiles where id = ${lit(id)}) p;`),
    profileByEmail: (email) => one(`select row_to_json(p) from (select id from public.profiles where lower(email) = lower(${lit(email)}) limit 1) p;`),
    getUser: (id) => one(`select row_to_json(u) from (select id, email, email_confirmed_at, raw_user_meta_data as user_metadata from auth.users where id = ${lit(id)}) u;`),
    async invite(email, fullName, redirectTo) {
      const existing = await one(`select row_to_json(u) from (select id, email, email_confirmed_at from auth.users where lower(email) = lower(${lit(email)})) u;`);
      if (existing?.email_confirmed_at) return { user: null, error: "A user with this email address has already been registered" };
      const user = existing ?? await one(`with u as (insert into auth.users (email, raw_user_meta_data, invited_at)
        values (${lit(email)}, ${lit(JSON.stringify(fullName ? { full_name: fullName } : {}))}::jsonb, now()) returning id, email)
        select row_to_json(u) from u;`);
      if (existing) await psql(`update auth.users set invited_at = now() where id = ${lit(existing.id)};`);
      mail("invite", email, redirectTo);
      return { user, error: null };
    },
    async setAppRole(id, role) {
      const r = await psql(`update auth.users set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', ${lit(role)}::text) where id = ${lit(id)};`);
      return r.code === 0 ? null : r.err;
    },
    async ban(id, banned) {
      const r = await psql(`update auth.users set banned_until = ${banned ? "now() + interval '100 years'" : "null"} where id = ${lit(id)};`);
      return r.code === 0 ? null : r.err;
    },
    async sendPasswordReset(email, redirectTo) { mail("reset", email, redirectTo); return null; },
    async deleteUser(id) {
      const r = await psql(`delete from auth.users where id = ${lit(id)};`);
      return r.code === 0 ? null : r.err;
    },
    async apply(a) {
      const r = await psql(`set role service_role; select public.admin_apply_user(${lit(a.actor)}, ${lit(a.target)}, ${lit(a.fullName)},
        ${lit(a.phone)}, ${lit(a.role)}::public.app_role, ${arr(a.brands)}, ${a.active}, ${lit(a.organisation)}::uuid, ${a.quiet});`);
      return r.code === 0 ? null : (/ERROR:\s+[0-9A-Z]{5}:\s+(.*)/.exec(r.err)?.[1] ?? r.err);
    },
    async audit(row) {
      await psql(`set role service_role; insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
        values (${lit(row.actor_id)}, ${lit(row.target_id)}, ${lit(row.target_email)}, ${lit(row.action)}, ${lit(JSON.stringify(row.details ?? {}))}::jsonb);`);
    },
  };
  const result = await handle(req.headers.authorization ?? null, body, deps);
  return send(result.status, result.body);
}
