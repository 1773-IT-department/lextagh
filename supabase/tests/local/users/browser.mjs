// Browser check of Users and access: a production build of the portal against the local harness database through
// ../browser/gateway.mjs on port 54401, with GATEWAY_FUNCTIONS=1 so /functions/v1/admin-users runs the Edge
// Function's real logic (supabase/functions/admin-users/handler.ts) with a stand in for the Auth admin API
// (functions_shim.mjs). Emails are written to a log file instead of being sent.
// Covers: only admin sees it; the list; an invite (email, role, brands, audit row); changing role and brands; switching
// a login off (sign in blocked) and on; the last active admin cannot switch themselves off; a password reset email.
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require("/opt/node-tools/node_modules/playwright/index.js"); }
const { chromium } = pw;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const OUT = process.env.USERS_SCREENSHOTS || path.join(os.tmpdir(), "lexta-users-screens");
mkdirSync(OUT, { recursive: true });
const { psql } = await import(`${ROOT}/supabase/tests/local/forms/rpc_shim.mjs`);
const { choose } = await import(`${ROOT}/supabase/tests/local/browser/choose.mjs`);

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 500)}`); }
};
async function q(sql, vars) {
  const r = await psql(sql, vars);
  if (r.code !== 0) throw new Error(r.err);
  return r.out;
}

await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a101', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000a102', 'manager@lexta.test', '{"role":"management"}', '{"full_name":"Kwame Manager"}')`);

const MAIL = path.join(mkdtempSync(path.join(os.tmpdir(), "lexta-users-mail-")), "mail.log");
const mails = () => (existsSync(MAIL) ? readFileSync(MAIL, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.USERS_SERVER_LOG;
  p.stdout.on("data", (d) => { if (log) appendFileSync(log, `[${path.basename(cmd)} out] ${d}`); });
  p.stderr.on("data", (d) => {
    if (log) appendFileSync(log, `[${path.basename(cmd)} err] ${d}`);
    if (/error/i.test(String(d))) process.stdout.write(`[${path.basename(cmd)}] ${d}`);
  });
  procs.push(p);
  return p;
}
async function waitFor(url) {
  for (let i = 0; i < 120; i += 1) {
    try { const r = await fetch(url); if (r.status < 500) return; } catch { /* not up */ }
    await sleep(500);
  }
  throw new Error(`not up: ${url}`);
}

const PORTAL = "http://127.0.0.1:3104";
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, GATEWAY_FUNCTIONS: "1", USERS_MAIL_LOG: MAIL, USERS_PORTAL_URL: PORTAL } });
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3104", "-H", "127.0.0.1"], {
  cwd: `${ROOT}/apps/portal`, env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness" },
});

const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
async function context(width) {
  return browser.newContext(width < 800 ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width, height: 900 } });
}
const opened = [];
async function login(ctx, email) {
  const page = await ctx.newPage();
  opened.push([email, page]);
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return page;
}
async function go(page, url) { await page.goto(url); await page.locator("main h1").first().waitFor(); }
const ADMIN = "00000000-0000-0000-0000-00000000a101";
const MANAGER = "00000000-0000-0000-0000-00000000a102";

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);

  // Management: no Users and access --------------------------------------------------------------------------------
  const mgr = await login(await context(1440), "manager@lexta.test");
  check(!(await mgr.getByRole("link", { name: "Users and access", exact: true }).count()), "management has no Users and access in the menu");
  await go(mgr, `${PORTAL}/systems/users`);
  check(await mgr.getByText("Only an admin can manage logins").isVisible(), "management opening Users and access is refused");
  await mgr.context().close();

  // Admin: list and invite ------------------------------------------------------------------------------------------
  const admin = await login(await context(1440), "admin@lexta.test");
  check(await admin.getByRole("link", { name: "Users and access", exact: true }).count() === 1, "admin has Users and access in the menu");
  await go(admin, `${PORTAL}/systems/users`);
  check(await admin.locator(".users-table").getByText("Kwame Manager").isVisible(), "the list shows the logins");
  check(!(await admin.getByText("not switched on yet").count()), "the admin-users function answers, so invites are switched on");

  const inv = admin.locator("form.users-form");
  await inv.getByLabel("Email", { exact: true }).fill("ama.rep@lexta.test");
  await inv.getByLabel("Full name").fill("Ama Rep");
  await choose(inv, "Role", "Sales rep");
  await inv.getByLabel("Yazz").check();
  await inv.getByRole("button", { name: "Send invite" }).click();
  await admin.getByText("Invite sent to ama.rep@lexta.test").waitFor();
  const invited = JSON.parse(await q(`select row_to_json(x) from (select p.id, p.role, p.full_name, coalesce((select array_agg(b.slug) from public.profile_brands pb join public.brands b on b.id = pb.brand_id where pb.profile_id = p.id), '{}') brands from public.profiles p where p.email = 'ama.rep@lexta.test') x`));
  check(invited?.role === "sales_rep" && invited.full_name === "Ama Rep" && invited.brands.join() === "yazz", "the invite creates the login with its role, name and brand", invited);
  const inviteMail = mails().find((m) => m.kind === "invite" && m.email === "ama.rep@lexta.test");
  check(!!inviteMail && inviteMail.redirectTo.endsWith("/auth/confirm?next=/set-password"), "the invite email sends them to choose a password", inviteMail);
  check(await q(`select count(*) from public.user_admin_audit where target_id = '${invited.id}' and action = 'invited' and actor_id = '${ADMIN}'`) === "1", "the invite is recorded");
  await admin.reload();
  const row = admin.locator(".users-table tr", { hasText: "Ama Rep" });
  check(await row.getByText("Invited").isVisible(), "the new login shows as Invited");
  const inv2 = admin.locator("form.users-form");
  await inv2.getByLabel("Email", { exact: true }).fill("ama.rep@lexta.test");
  await choose(inv2, "Role", "Management");
  await inv2.getByRole("button", { name: "Send invite" }).click();
  await admin.getByText("This email already has a login").waitFor();
  check(true, "a second invite for the same email is refused");
  await admin.screenshot({ path: `${OUT}/users-1440.png`, fullPage: true });

  // Change role and brands ------------------------------------------------------------------------------------------
  await go(admin, `${PORTAL}/systems/users/${invited.id}`);
  await choose(admin, "Role", "Customer care");
  await admin.getByLabel("Linzzy").check();
  await admin.getByLabel("Yazz").uncheck();
  await admin.getByRole("button", { name: "Save changes" }).click();
  await admin.locator(".alert.ok", { hasText: "Saved." }).waitFor();
  check(await q(`select role from public.profiles where id = '${invited.id}'`) === "customer_care", "the role is changed");
  check(await q(`select string_agg(action, ',' order by action) from public.user_admin_audit where target_id = '${invited.id}' and action in ('role_changed','brands_changed')`) === "brands_changed,role_changed",
    "the role and brand changes are recorded");
  await admin.getByRole("button", { name: "Send the invite again" }).click();
  await admin.locator(".alert.ok", { hasText: "Invite sent again" }).waitFor();
  check(mails().filter((m) => m.kind === "invite" && m.email === "ama.rep@lexta.test").length === 2, "the invite can be sent again");
  await admin.reload();
  check(await admin.locator(".users-audit").getByText("Role changed: Sales rep to Customer care").isVisible(), "the history shows the change in words");
  await admin.screenshot({ path: `${OUT}/user-detail-1440.png`, fullPage: true });

  // Switch the manager off and on -------------------------------------------------------------------------------------
  await go(admin, `${PORTAL}/systems/users/${MANAGER}`);
  await admin.getByLabel("Login switched on").uncheck();
  await admin.getByRole("button", { name: "Save changes" }).click();
  await admin.locator(".alert.ok", { hasText: "Saved." }).waitFor();
  check(await q(`select is_active::text || ',' || coalesce((banned_until > now())::text, 'false') from public.profiles p join auth.users u using (id) where p.id = '${MANAGER}'`) === "false,true",
    "switching a login off saves it and blocks sign in");
  const blocked = await (await context(1440)).newPage();
  await blocked.goto(`${PORTAL}/login`);
  await blocked.getByLabel("Email").fill("manager@lexta.test");
  await blocked.getByLabel("Password").fill("harness-password");
  await blocked.getByRole("button", { name: /sign in/i }).click();
  await sleep(1500);
  check(new URL(blocked.url()).pathname.startsWith("/login"), "a switched off login cannot sign in");
  await admin.reload();
  await admin.getByLabel("Login switched on").check();
  await admin.getByRole("button", { name: "Save changes" }).click();
  await admin.locator(".alert.ok", { hasText: "Saved." }).waitFor();
  const back = await q(`select is_active::text || ',' || coalesce((banned_until > now())::text, 'false') from public.profiles p join auth.users u using (id) where p.id = '${MANAGER}'`);
  check(back === "true,false", "switching it on again allows sign in", { back, alerts: await admin.locator(".alert").allInnerTexts(), checked: await admin.getByLabel("Login switched on").isChecked() });
  await admin.getByRole("button", { name: "Send a password reset email" }).click();
  await admin.locator(".alert.ok", { hasText: "Password reset email sent" }).waitFor();
  check(mails().some((m) => m.kind === "reset" && m.email === "manager@lexta.test"), "a password reset email is sent");

  // The last active admin -----------------------------------------------------------------------------------------------
  await go(admin, `${PORTAL}/systems/users/${ADMIN}`);
  await admin.getByLabel("Login switched on").uncheck();
  await admin.getByRole("button", { name: "Save changes" }).click();
  await admin.locator(".alert.error", { hasText: "only active admin" }).waitFor();
  check(await q(`select is_active::text from public.profiles where id = '${ADMIN}'`) === "true", "the only active admin cannot switch themselves off");

  // Phone ---------------------------------------------------------------------------------------------------------------
  const phone = await login(await context(390), "admin@lexta.test");
  await go(phone, `${PORTAL}/systems/users`);
  check(await noSideScroll(phone), "390: the page fits the phone");
  await phone.screenshot({ path: `${OUT}/users-390.png`, fullPage: true });
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
  for (const [who, page] of opened) {
    try { await page.screenshot({ path: `${OUT}/failure-${who.split("@")[0]}.png`, fullPage: true }); } catch { /* closed */ }
  }
} finally {
  await browser.close();
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(path.dirname(MAIL), { recursive: true, force: true });
}
console.log(failures ? `${failures} browser check(s) failed` : "All browser checks passed");
process.exit(failures ? 1 : 0);
