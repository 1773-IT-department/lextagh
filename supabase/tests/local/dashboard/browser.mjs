// Browser check of the management dashboard (item 26): a production build of the portal against the local harness
// database through ../browser/gateway.mjs on port 54401. Build the portal first (see run.sh), then run:
//   bash supabase/tests/local/dashboard/run.sh
// Covers management at 1440 px: the empty state, then numbers that match the seeded data, the period presets, a
// custom range, the brand filter and a tile link into its system. Management on a phone (390 px): the tiles and
// filters fit with no sideways scroll. Admin sees it too; customer care has no menu entry and is refused.
// Screenshots go to DASHBOARD_SCREENSHOTS (default: lexta-dashboard-screens in the temp directory). Every server it
// starts is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
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
const OUT = process.env.DASHBOARD_SCREENSHOTS || path.join(os.tmpdir(), "lexta-dashboard-screens");
mkdirSync(OUT, { recursive: true });
const { psql } = await import(`${ROOT}/supabase/tests/local/forms/rpc_shim.mjs`);

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

// People (test data in the throwaway database only) ------------------------------------------------------------------
await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d101', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000d102', 'manager@lexta.test', '{"role":"management"}', '{"full_name":"Kwame Manager"}'),
  ('00000000-0000-0000-0000-00000000d103', 'rep@lexta.test', '{"role":"sales_rep"}', '{"full_name":"Kofi Rep"}'),
  ('00000000-0000-0000-0000-00000000d105', 'care@lexta.test', '{"role":"customer_care"}', '{"full_name":"Efua Care"}')`);

// Records for every system, dated in the past (triggers off, as the database owner).
const SEED = `
set session_replication_role = replica;
insert into public.crm_contacts (id, full_name) values ('00000000-0000-0000-0000-00000000d201', 'Dash Customer');
insert into public.crm_organisations (id, name, kind) values ('00000000-0000-0000-0000-00000000d202', 'Dash Distributors', 'distributor');
insert into public.crm_leads (title, contact_id, brand_id, source, stage, owner_id, created_at, closed_at) values
  ('L1', '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'yazz'), 'website_contact_form', 'new', null, now() - interval '2 days', null),
  ('L2', '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'hooch'), 'phone', 'won', '00000000-0000-0000-0000-00000000d103', now() - interval '3 days', now() - interval '1 day'),
  ('L3', '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'yazz'), 'email', 'new', null, date_trunc('year', now()) + interval '1 hour', null);
insert into public.complaints (case_number, brand_id, category, severity, channel, description, contact_id, status, response_due_at, resolution_due_at, created_at)
  values ('LX-2026-9101', (select id from public.brands where slug = 'yazz'), 'product_quality', 'high', 'website', 'K1', '00000000-0000-0000-0000-00000000d201', 'new',
          now() - interval '1 hour', now() + interval '3 days', now() - interval '1 day');
insert into public.distributor_orders (id, reference, organisation_id, status, brand_ids, submitted_at) values
  ('00000000-0000-0000-0000-00000000d301', 'LX-ORD-2026-9101', '00000000-0000-0000-0000-00000000d202', 'submitted', array[(select id from public.brands where slug = 'yazz')], now() - interval '1 day');
insert into public.distributor_order_lines (order_id, brand_id, product_name_snapshot, sku_code_snapshot, pack_size_snapshot, quantity)
  values ('00000000-0000-0000-0000-00000000d301', (select id from public.brands where slug = 'yazz'), 'P', 'S-1', 'Carton', 12);
insert into public.field_visits (id, rep_id, shop_name, brand_ids, visited_at, location_status, outcome_id) values
  (gen_random_uuid(), '00000000-0000-0000-0000-00000000d103', 'Dash Shop', array[(select id from public.brands where slug = 'yazz')], now() - interval '1 day', 'denied',
   (select id from public.field_visit_outcomes where slug = 'order_taken'));
insert into public.csr_activities (programme_id, activity_date, status, region_id, place, people_reached) values
  ((select id from public.csr_programmes where name = 'The Dignity Project'), current_date - 1, 'done', (select id from public.regions where slug = 'volta'), 'Ho', 40);
insert into public.chat_conversations (reference, brand_id, token_hash, visitor_name, status) values
  ('LC-D0000101', (select id from public.brands where slug = 'yazz'), repeat('a', 64), 'Visitor', 'open');
set session_replication_role = origin;`;

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.DASHBOARD_SERVER_LOG;
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

const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-dashboard-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness" };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3102", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);

const PORTAL = "http://127.0.0.1:3102";
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const fits = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].every((f) =>
  f.scrollWidth <= f.clientWidth + 1 && [...f.querySelectorAll("input, select, button, a, li")].every((el) => el.getBoundingClientRect().right <= f.getBoundingClientRect().right + 1)), sel);

async function context(width) {
  const phone = width < 800;
  return browser.newContext(phone ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width, height: 900 } });
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
async function go(page, url) {
  await page.goto(url);
  await page.locator("main h1").first().waitFor();
}
/** The number on a tile's stat, by the stat's label. */
const stat = (page, tile, label) => page.locator(`section[aria-labelledby="dash_${tile}"] .dash-stat`, { has: page.getByText(label, { exact: true }) })
  .locator("b").innerText();

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);

  // Management at 1440, empty database ---------------------------------------------------------------------------------
  const mgr = await login(await context(1440), "manager@lexta.test");
  const menu = mgr.getByRole("link", { name: "Management dashboard", exact: true });
  check(await menu.count() === 1, "1440: management has the dashboard in the menu");
  await menu.click();
  await mgr.waitForURL(`${PORTAL}/systems/dashboard`);
  await mgr.locator("main h1").waitFor();
  check(!(await mgr.getByText("Being built").count()), "1440: the menu opens the real dashboard, not the placeholder");
  check(await mgr.getByText("Nothing has been recorded for this period yet.").isVisible(), "1440: the empty state shows");
  check(await stat(mgr, "crm", "New in period") === "0" && await mgr.getByText("No new leads in this period.").first().isVisible(), "1440: empty tiles show zeros and a note");
  check(await mgr.locator(".dash-tile").count() === 8, "1440: eight tiles");
  check(await mgr.getByRole("link", { name: "Last 30 days" }).getAttribute("aria-current") === "page", "1440: last 30 days is the default");
  await mgr.screenshot({ path: `${OUT}/manager-1440-empty.png`, fullPage: true });

  // With records ----------------------------------------------------------------------------------------------------------
  await q(SEED);
  const l3In30 = (await q("select (date_trunc('year', now()) + interval '1 hour' >= (current_date - 29)::timestamptz)::int")) === "1";
  await go(mgr, `${PORTAL}/systems/dashboard`);
  check(!(await mgr.getByText("Nothing has been recorded").count()), "1440: no empty note once there are records");
  const crm30 = [await stat(mgr, "crm", "New in period"), await stat(mgr, "crm", "Open now"), await stat(mgr, "crm", "Won in period"),
    await stat(mgr, "crm", "Website leads with no owner, now")];
  check(JSON.stringify(crm30) === JSON.stringify([l3In30 ? "3" : "2", "2", "1", "1"]), "1440: CRM numbers match the data", crm30);
  check(await stat(mgr, "complaints", "Overdue now") === "1" && await stat(mgr, "complaints", "Received in period") === "1", "1440: complaints");
  check(await stat(mgr, "orders", "Packs ordered (not cancelled)") === "12" && await stat(mgr, "orders", "Waiting to be confirmed, now") === "1", "1440: orders");
  check(await stat(mgr, "field", "Shop visits in period") === "1" && (await mgr.locator('section[aria-labelledby="dash_field"] .dash-bars li', { hasText: "Kofi Rep" }).count()) === 1,
    "1440: field sales with the top rep");
  check(await stat(mgr, "csr", "People reached") === "40", "1440: CSR people reached");
  check(await stat(mgr, "chat", "Waiting for a reply, now") === "1", "1440: chats waiting");
  const bar = await mgr.locator('section[aria-labelledby="dash_crm"] .dash-bars li', { hasText: "Website contact form" }).locator(".dash-bar-fill").evaluate((el) => el.style.width);
  check(/%$/.test(bar) && parseFloat(bar) > 0, "1440: the source bar is drawn", bar);
  check(await noSideScroll(mgr), "1440: no sideways scroll");
  await mgr.screenshot({ path: `${OUT}/manager-1440.png`, fullPage: true });

  await mgr.getByRole("link", { name: "This year" }).click();
  await mgr.waitForURL(/range=year/);
  await mgr.locator("main h1").waitFor();
  check(await stat(mgr, "crm", "New in period") === "3" && await mgr.getByRole("link", { name: "This year" }).getAttribute("aria-current") === "page", "1440: this year counts the older lead");

  await mgr.getByLabel("Brand").selectOption({ label: "Hooch" });
  await mgr.getByRole("button", { name: "Apply" }).click();
  await mgr.waitForURL(/brand=/);
  await mgr.locator("main h1").waitFor();
  check(await stat(mgr, "crm", "Won in period") === "1" && await stat(mgr, "crm", "Open now") === "0" && await stat(mgr, "orders", "Submitted in period") === "0",
    "1440: the brand filter changes the numbers");
  check(await mgr.getByText("Recruitment is not split by brand").isVisible(), "1440: recruitment says it is not split by brand");
  check(await mgr.getByText("the inbox itself shows every brand").isVisible(), "1440: live chat says the inbox shows every brand");
  const brandOptions = await mgr.locator("#brand option").allInnerTexts();
  check(!brandOptions.includes("Lexta Ghana") && brandOptions.includes("Yazz"), "1440: the corporate brand is not in the brand filter", brandOptions);
  check((await mgr.locator('section[aria-labelledby="dash_field"] .dash-stat', { hasText: "New shops to confirm" }).getAttribute("href") ?? "").includes("brand="),
    "1440: the shops to confirm link keeps the brand");

  // Clear is a client side link: the form must reset with the address, not keep the brand and dates it had.
  const defaultTo = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  await mgr.getByRole("link", { name: "Clear" }).click();
  await mgr.waitForURL((u) => u.pathname === "/systems/dashboard" && !u.search);
  await mgr.waitForFunction(() => !document.querySelector(".nav-progress.on"));
  const cleared = { brand: await mgr.locator("#brand").inputValue(), from: await mgr.locator("#from").inputValue(), to: await mgr.locator("#to").inputValue() };
  check(cleared.brand === "" && cleared.from === defaultFrom && cleared.to === defaultTo, "1440: Clear resets the brand and dates in the form", cleared);

  const day = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  await go(mgr, `${PORTAL}/systems/dashboard?from=${day}&to=${day}`);
  check(await stat(mgr, "crm", "New in period") === "1", "1440: a custom one day range");
  check(await mgr.getByLabel("From").inputValue() === day, "1440: the custom range stays in the form");
  await mgr.getByRole("link", { name: "Clear" }).click();
  await mgr.waitForURL((u) => u.pathname === "/systems/dashboard" && !u.search);
  await mgr.waitForFunction(() => !document.querySelector(".nav-progress.on"));
  check(await mgr.locator("#from").inputValue() === new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
    && await mgr.locator("#to").inputValue() === new Date().toISOString().slice(0, 10), "1440: Clear after a custom range resets the dates in the form");

  await go(mgr, `${PORTAL}/systems/dashboard`);
  await mgr.getByRole("link", { name: "Overdue now" }).click();
  await mgr.waitForURL(/\/systems\/complaints\?status=open&overdue=1/);
  await mgr.locator("main h1").waitFor();
  check(await mgr.getByText("LX-2026-9101").isVisible(), "1440: a tile number opens the matching list in its system");

  // Management on a phone (390) --------------------------------------------------------------------------------------------
  const phone = await login(await context(390), "manager@lexta.test");
  await go(phone, `${PORTAL}/systems/dashboard`);
  check(await noSideScroll(phone), "390: no sideways scroll");
  check(await fits(phone, ".dash-filters") && await fits(phone, ".dash-tile"), "390: filters and tiles fit the phone");
  const fromBox = await phone.locator("#from").boundingBox();
  const toBox = await phone.locator("#to").boundingBox();
  check(fromBox && toBox && Math.abs(fromBox.y - toBox.y) < 2 && toBox.x > fromBox.x, "390: From and To sit side by side", { fromBox, toBox });
  const presetBox = await phone.getByRole("link", { name: "This month" }).boundingBox();
  check(presetBox && presetBox.height >= 34, "390: presets are touch sized", presetBox);
  await phone.screenshot({ path: `${OUT}/manager-390.png`, fullPage: true });

  // Admin and customer care --------------------------------------------------------------------------------------------------
  const admin = await login(await context(1440), "admin@lexta.test");
  await go(admin, `${PORTAL}/systems/dashboard`);
  check(await stat(admin, "orders", "Packs ordered (not cancelled)") === "12", "1440: admin sees the dashboard");
  const care = await login(await context(1440), "care@lexta.test");
  check(!(await care.getByRole("link", { name: "Management dashboard", exact: true }).count()), "customer care has no dashboard in the menu");
  await go(care, `${PORTAL}/systems/dashboard`);
  check(await care.getByText("Your role does not include the management dashboard").isVisible() && !(await care.locator(".dash-tile").count()),
    "customer care opening the dashboard is refused");
  const rep = await login(await context(390), "rep@lexta.test");
  await go(rep, `${PORTAL}/systems/dashboard`);
  check(!(await rep.locator(".dash-tile").count()), "a sales rep opening the dashboard is refused");
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
  for (const [who, page] of opened) {
    try { await page.screenshot({ path: `${OUT}/failure-${who.split("@")[0]}.png`, fullPage: true }); } catch { /* closed */ }
  }
} finally {
  await browser.close();
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
}
console.log(failures ? `${failures} browser check(s) failed` : "All browser checks passed");
process.exit(failures ? 1 : 0);
