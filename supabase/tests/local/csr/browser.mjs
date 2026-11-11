// Browser check of the CSR activity tracker (item 25): a production build of the portal against the local harness
// database through ../browser/gateway.mjs on port 54401. Build the portal first (see run.sh), then run:
//   bash supabase/tests/local/csr/run.sh
// Covers marketing on a phone (390 px): log an activity, add a photo (checked by its first bytes, shown through a
// signed link), change it; a file that is not a photo is refused. Management at 1440 px: totals per programme,
// filters, read only detail. Admin: the programme list (seeded ones to check), add a programme, delete an activity
// and its photo file. Customer care sees nothing. Screenshots go to CSR_SCREENSHOTS (default: lexta-csr-screens in
// the temp directory). Every server it starts is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
const OUT = process.env.CSR_SCREENSHOTS || path.join(os.tmpdir(), "lexta-csr-screens");
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

// Seed (test data in the throwaway database only) ------------------------------------------------------------------
await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000c101', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000c102', 'manager@lexta.test', '{"role":"management"}', '{"full_name":"Kwame Manager"}'),
  ('00000000-0000-0000-0000-00000000c103', 'marketing@lexta.test', '{"role":"marketing"}', '{"full_name":"Ama Mensah"}'),
  ('00000000-0000-0000-0000-00000000c105', 'care@lexta.test', '{"role":"customer_care"}', '{"full_name":"Efua Care"}')`);
await q(`insert into public.profile_brands (profile_id, brand_id) select '00000000-0000-0000-0000-00000000c103'::uuid, id from public.brands where slug = 'yazz'`);

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.CSR_SERVER_LOG;
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

// The portal's photo secret, the same in the database (test value only).
const PHOTO_SECRET = "harness-field-photo-secret-0123456789abcdef";
await q("insert into private.field_photo_secret (secret) values (:'s')", { s: PHOTO_SECRET });
const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-csr-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  FIELD_PHOTO_SECRET: PHOTO_SECRET };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3102", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);

const PORTAL = "http://127.0.0.1:3102";
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const filtersFit = (page) => page.evaluate(() => [...document.querySelectorAll(".filters")].every((f) =>
  f.scrollWidth <= f.clientWidth + 1 && [...f.querySelectorAll("input, select, button")].every((el) => el.getBoundingClientRect().right <= f.getBoundingClientRect().right + 1)));

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

async function makePhoto() {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await ctx.newPage();
  await page.setContent(`<body style="margin:0;background:#e9f6fa"><div style="display:flex;gap:16px;padding:80px">${
    ["#12a3c4", "#e05a8a", "#f2b632", "#0b2f3d"].map((c) => `<div style="width:120px;height:120px;background:${c};border-radius:60px"></div>`).join("")
  }</div></body>`);
  const buf = await page.screenshot({ type: "jpeg", quality: 85 });
  await ctx.close();
  const file = path.join(OUT, "fixture-event.jpg");
  writeFileSync(file, buf);
  return file;
}
const files = (dir) => (existsSync(dir) ? readdirSync(dir, { recursive: true }).filter((f) => /\.(jpg|png|webp)$/.test(String(f))) : []);

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);
  const photo = await makePhoto();
  const notPhoto = path.join(OUT, "not-a-photo.jpg");
  writeFileSync(notPhoto, "<html><script>alert(1)</script></html>");

  // Marketing on a phone (390) ----------------------------------------------------------------------------------------
  const mkt = await login(await context(390), "marketing@lexta.test");
  check(await mkt.getByRole("link", { name: "CSR activities", exact: true }).count() === 1, "390: marketing has CSR activities in the menu");
  await go(mkt, `${PORTAL}/systems/csr`);
  check(await mkt.getByText("No activities yet").isVisible(), "390: no activities yet");
  check(await mkt.locator(".ptable").first().getByText("The Dignity Project").isVisible(), "390: the seeded programmes show in the totals");
  check(await noSideScroll(mkt) && await filtersFit(mkt), "390: the list and filters fit the phone");
  await mkt.screenshot({ path: `${OUT}/marketing-390-empty.png`, fullPage: true });

  await mkt.getByRole("link", { name: "Log an activity" }).click();
  await mkt.waitForURL(`${PORTAL}/systems/csr/new`);
  await mkt.locator("main h1").waitFor();
  const options = await mkt.locator("#programme_id option").allInnerTexts();
  check(options.includes("The Dignity Project") && options.includes("The Lexta Teen Care Campaign") && options.length === 9,
    "390: marketing with Yazz may log every seeded programme (no brand, or Yazz)", options);
  await mkt.getByRole("button", { name: "Save activity" }).click();
  await mkt.getByText("Please check the highlighted fields.").waitFor();
  check(await mkt.getByText("Choose a programme.").isVisible() && await mkt.getByText("Choose a region.").isVisible(), "390: missing fields are named");
  await mkt.getByLabel("Programme").selectOption({ label: "The Dignity Project" });
  await mkt.getByLabel("Region").selectOption({ label: "Volta" });
  await mkt.getByLabel("Town or place").fill("Mawuko Girls SHS, Ho");
  await mkt.getByLabel("People reached").fill("350");
  await mkt.getByLabel("Partners (optional)").fill("Ghana Education Service");
  await mkt.getByLabel("Notes (optional)").fill("Sanitary pads and learning materials for 350 girls.");
  check(await noSideScroll(mkt), "390: the form fits the phone");
  const statusBox = await mkt.locator(".csr-status label").first().boundingBox();
  check(statusBox && statusBox.height >= 44, "390: the status choice is a big touch target", statusBox);
  await mkt.screenshot({ path: `${OUT}/marketing-390-form.png`, fullPage: true });
  await mkt.getByRole("button", { name: "Save activity" }).click();
  await mkt.waitForURL(/\/systems\/csr\/[0-9a-f-]{36}\?created=1/);
  await mkt.getByText("The activity is saved. Add photos below.").waitFor();
  const actId = new URL(mkt.url()).pathname.split("/").pop();
  check(await q(`select people_reached || '|' || status || '|' || place from public.csr_activities where id = :'id'`, { id: actId }) === "350|done|Mawuko Girls SHS, Ho",
    "390: the activity is saved");

  await mkt.locator('input[aria-label="Take a photo"]').setInputFiles(photo);
  await mkt.locator(".fs-gallery img").first().waitFor({ timeout: 20000 });
  check(await q(`select count(*) from public.csr_activity_photos where activity_id = :'id'`, { id: actId }) === "1", "390: the photo is recorded");
  const src = await mkt.locator(".fs-gallery img").first().getAttribute("src");
  check(/\/object\/sign\/csr-activity-photos\//.test(src ?? ""), "390: the photo is shown through a signed link", src);
  const loaded = await mkt.locator(".fs-gallery img").first().evaluate((img) => img.complete && img.naturalWidth > 0);
  check(loaded, "390: the photo loads");
  check(await q(`select count(*) from public.csr_activity_photos where activity_id = :'id' and created_by = '00000000-0000-0000-0000-00000000c103'`, { id: actId }) === "1",
    "390: the photo's author is marketing");
  await mkt.locator('input[aria-label="Choose photos"]').setInputFiles(notPhoto);
  await mkt.getByText("That file is not a photo. Use a JPG, PNG or WebP image.").waitFor({ timeout: 20000 });
  check(await q(`select count(*) from public.csr_activity_photos where activity_id = :'id'`, { id: actId }) === "1", "390: a file that is not a photo is refused");
  check(await mkt.locator(".fs-thumb").count() === 0 && !(await mkt.getByRole("button", { name: "Try again" }).count()),
    "390: a refused file is dropped, with no Try again");
  check(await noSideScroll(mkt), "390: the activity page fits the phone");
  await mkt.screenshot({ path: `${OUT}/marketing-390-activity.png`, fullPage: true });

  await mkt.getByLabel("People reached").fill("362");
  await mkt.getByRole("button", { name: "Save changes" }).click();
  await mkt.getByText("Saved.", { exact: true }).waitFor();
  check(await q(`select people_reached from public.csr_activities where id = :'id'`, { id: actId }) === "362", "390: marketing changes the activity");

  // A planned one and a Hooch programme marketing may not log.
  await q(`insert into public.csr_programmes (name, brand_id, sort_order) values ('Hooch Community Kitchens', (select id from public.brands where slug = 'hooch'), 90)`);
  await q(`set role postgres; insert into public.csr_activities (programme_id, activity_date, status, region_id, place, people_reached)
    values ((select id from public.csr_programmes where name = 'The Dignity Project'), current_date + 20, 'planned', (select id from public.regions where slug = 'ashanti'), 'Kumasi', 500),
           ((select id from public.csr_programmes where name = 'Hooch Community Kitchens'), current_date - 40, 'done', (select id from public.regions where slug = 'ashanti'), 'Kejetia', 120)`);
  await go(mkt, `${PORTAL}/systems/csr/new`);
  check(!(await mkt.locator("#programme_id option", { hasText: "Hooch Community Kitchens" }).count()), "390: a Hooch programme is not offered to Yazz marketing");
  const hooch = await q(`select id from public.csr_activities where place = 'Kejetia'`);
  await go(mkt, `${PORTAL}/systems/csr/${hooch}`);
  check(!(await mkt.getByRole("heading", { name: "Change this activity" }).count()) && !(await mkt.locator('input[aria-label="Take a photo"]').count()),
    "390: marketing reads but cannot change a Hooch activity");

  // Management at 1440 -------------------------------------------------------------------------------------------------
  const mgr = await login(await context(1440), "manager@lexta.test");
  await go(mgr, `${PORTAL}/systems/csr`);
  check(!(await mgr.getByRole("link", { name: "Log an activity" }).count()), "1440: management has no Log an activity");
  const counts = await mgr.locator(".csr-counts .pipe b").allInnerTexts();
  check(JSON.stringify(counts) === JSON.stringify(["482", "2", "1"]), "1440: grand totals (done people, done activities, planned)", counts);
  const dignity = mgr.locator(".ptable tr", { hasText: "The Dignity Project" }).first();
  check((await dignity.innerText()).includes("362"), "1440: Dignity Project totals count the done activity only");
  await mgr.screenshot({ path: `${OUT}/manager-1440-csr.png`, fullPage: true });
  await mgr.getByLabel("Region").selectOption({ label: "Ashanti" });
  await mgr.getByRole("button", { name: "Apply" }).click();
  await mgr.waitForURL(/region=/);
  await mgr.locator("main h1").waitFor();
  const regionCounts = await mgr.locator(".csr-counts .pipe b").allInnerTexts();
  check(JSON.stringify(regionCounts) === JSON.stringify(["120", "1", "1"]), "1440: totals follow the region filter", regionCounts);
  check(await mgr.locator("table").nth(1).locator("tbody tr").count() === 2, "1440: the list follows the region filter");
  await mgr.goto(`${PORTAL}/systems/csr?from=${new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)}`);
  await mgr.locator("main h1").waitFor();
  check(JSON.stringify(await mgr.locator(".csr-counts .pipe b").allInnerTexts()) === JSON.stringify(["362", "1", "1"]), "1440: totals follow the date range");
  await go(mgr, `${PORTAL}/systems/csr/${actId}`);
  check(await mgr.locator(".fs-gallery img").count() === 1 && !(await mgr.getByRole("heading", { name: "Change this activity" }).count())
    && !(await mgr.getByRole("button", { name: /Remove photo/ }).count()), "1440: management sees the photo, read only");
  check(await mgr.getByText("by Ama Mensah").first().isVisible(), "1440: who logged it");
  await mgr.screenshot({ path: `${OUT}/manager-1440-activity.png`, fullPage: true });
  const mgrPhone = await login(await context(390), "manager@lexta.test");
  await go(mgrPhone, `${PORTAL}/systems/csr`);
  check(await noSideScroll(mgrPhone) && await filtersFit(mgrPhone), "390: the manager view fits the phone");
  await mgrPhone.screenshot({ path: `${OUT}/manager-390-csr.png`, fullPage: true });

  // Admin --------------------------------------------------------------------------------------------------------------
  const admin = await login(await context(1440), "admin@lexta.test");
  await go(admin, `${PORTAL}/systems/csr/programmes`);
  check(await admin.getByText("8 programmes were copied from the CSR page of the Lexta website").isVisible(), "1440: admin sees the seeded programmes to check");
  await admin.screenshot({ path: `${OUT}/admin-1440-programmes.png`, fullPage: true });
  await admin.locator(".csr-programme").first().getByRole("button", { name: "Save as checked" }).click();
  await admin.getByText("7 programmes were copied").waitFor();
  check(true, "1440: admin marks a seeded programme as checked");
  await admin.getByLabel("Name").last().fill("GES Cook Art Competition");
  await admin.getByRole("button", { name: "Add programme" }).click();
  // The add form starts empty again once the new programme is in the list.
  await admin.locator(".csr-programme input[value='GES Cook Art Competition']").waitFor();
  check(await q(`select count(*) from public.csr_programmes where name = 'GES Cook Art Competition' and is_active`) === "1", "1440: admin adds a programme");
  // A file in the activity's folder that was never recorded (a failed upload): deleting the activity removes it too.
  await q(`insert into storage.objects (bucket_id, name, owner, metadata) values ('csr-activity-photos', :'n', '00000000-0000-0000-0000-00000000c103', '{"size": 3, "mimetype": "image/jpeg"}')`,
    { n: `${actId}/00000000-0000-4000-8000-0000000000aa.jpg` });
  mkdirSync(path.join(STORE, "csr-activity-photos", actId), { recursive: true });
  writeFileSync(path.join(STORE, "csr-activity-photos", actId, "00000000-0000-4000-8000-0000000000aa.jpg"), Buffer.from([0xff, 0xd8, 0xff]));
  await go(admin, `${PORTAL}/systems/csr/${actId}`);
  const before = files(STORE).length;
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Delete activity" }).click();
  await admin.waitForURL(/deleted=1/);
  await admin.getByText("The activity was deleted.").waitFor();
  check(await q(`select count(*) from public.csr_activities where id = :'id'`, { id: actId }) === "0" && files(STORE).length === before - 2
      && await q(`select count(*) from storage.objects where name like :'p'`, { p: `${actId}/%` }) === "0",
    "1440: admin deletes an activity, its photo file and a file never recorded");

  // A programme whose brand is switched off keeps it when saved.
  await q(`update public.brands set is_active = false where slug = 'hooch'`);
  await go(admin, `${PORTAL}/systems/csr/programmes`);
  const hoochRow = admin.locator(".csr-programme", { has: admin.locator("input[value='Hooch Community Kitchens']") });
  check((await hoochRow.locator("select[name=brand_id] option:checked").innerText()) === "Hooch (switched off)", "1440: a switched off brand shows on its programme");
  await hoochRow.getByLabel("Description (optional)").fill("Community kitchens.");
  await hoochRow.getByRole("button", { name: "Save", exact: true }).click();
  await hoochRow.getByText("Programme saved.").waitFor();
  check(await q(`select (brand_id = (select id from public.brands where slug = 'hooch'))::text from public.csr_programmes where name = 'Hooch Community Kitchens'`) === "true",
    "1440: saving keeps the switched off brand");
  await q(`update public.brands set is_active = true where slug = 'hooch'`);

  // Customer care ------------------------------------------------------------------------------------------------------
  const care = await login(await context(1440), "care@lexta.test");
  check(!(await care.getByRole("link", { name: "CSR activities", exact: true }).count()), "customer care has no CSR activities in the menu");
  await go(care, `${PORTAL}/systems/csr`);
  check(await care.getByText("Your role does not include CSR activities").isVisible(), "customer care opening CSR is refused");
  const res = await care.request.post(`${PORTAL}/systems/csr/${hooch}/photos`, { multipart: { photo_id: "00000000-0000-4000-8000-000000000001", file: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0]) } } });
  check(res.status() === 403, "customer care cannot add photos", res.status());
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
