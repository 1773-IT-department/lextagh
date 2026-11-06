// Browser check of the field sales app (item 24): a production build of the portal against the local harness database
// through ../browser/gateway.mjs on port 54401. Build the portal first with
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
//   TURBO_FORCE=true pnpm --filter @lexta/portal build
// then run: bash supabase/tests/local/field-sales/run.sh
// Covers the rep flow on a phone (390 px) with a mocked position and a fixture photo: nearest shops, photo, outcome,
// notes, stock check, CRM, save; a dropped connection on the visit and on a photo (retried, saved once); a new shop
// with location refused; today and history; the visit page; the server's photo check by first bytes. Then the manager
// view at 1440 px: filters, CSV export with the formula guard, visit page with photo and map link; admin outcomes and
// delete; and roles that see nothing. Screenshots go to FIELD_SCREENSHOTS (default: lexta-field-screens in the temp
// directory). Every server it starts is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
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
const OUT = process.env.FIELD_SCREENSHOTS || path.join(os.tmpdir(), "lexta-field-screens");
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
  ('00000000-0000-0000-0000-00000000f101', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000f102', 'manager@lexta.test', '{"role":"management"}', '{"full_name":"Kwame Manager"}'),
  ('00000000-0000-0000-0000-00000000f103', 'rep.yazz@lexta.test', '{"role":"sales_rep"}', '{"full_name":"Yaw Boateng"}'),
  ('00000000-0000-0000-0000-00000000f104', 'rep.hooch@lexta.test', '{"role":"sales_rep"}', '{"full_name":"Esi Hooch Rep"}'),
  ('00000000-0000-0000-0000-00000000f105', 'care@lexta.test', '{"role":"customer_care"}', '{"full_name":"Efua Care"}')`);
await q(`insert into public.profile_brands (profile_id, brand_id)
  select '00000000-0000-0000-0000-00000000f103'::uuid, id from public.brands where slug = 'yazz'
  union all select '00000000-0000-0000-0000-00000000f104'::uuid, id from public.brands where slug = 'hooch'`);
await q(`insert into public.stockists (id, name, outlet_type, region_id, town, latitude, longitude) values
  ('00000000-0000-0000-0000-00000000f201', 'Osu Mini Mart', 'supermarket', (select id from public.regions where slug = 'greater-accra'), 'Osu', 5.556000, -0.182000),
  ('00000000-0000-0000-0000-00000000f202', 'Labone Pharmacy', 'pharmacy', (select id from public.regions where slug = 'greater-accra'), 'Labone', 5.565000, -0.170000),
  ('00000000-0000-0000-0000-00000000f203', 'Kejetia Provisions', 'open_market', (select id from public.regions where slug = 'ashanti'), 'Kumasi', 6.697000, -1.620000),
  ('00000000-0000-0000-0000-00000000f204', 'Tema Station Shop', 'general_trade', (select id from public.regions where slug = 'greater-accra'), 'Tema', 5.669000, -0.016000)`);
await q(`insert into public.stockist_brands (stockist_id, brand_id)
  select s, (select id from public.brands where slug = b) from (values
    ('00000000-0000-0000-0000-00000000f201'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000f202'::uuid, 'yazz'),
    ('00000000-0000-0000-0000-00000000f202'::uuid, 'hooch'), ('00000000-0000-0000-0000-00000000f203'::uuid, 'hooch'),
    ('00000000-0000-0000-0000-00000000f204'::uuid, 'yazz')) v(s, b)`);
await q(`insert into public.crm_organisations (id, name, kind, stockist_id) values
  ('00000000-0000-0000-0000-00000000f301', 'Osu Mini Mart Ltd', 'retailer', '00000000-0000-0000-0000-00000000f201')`);
await q(`insert into public.crm_organisation_brands (organisation_id, brand_id) select '00000000-0000-0000-0000-00000000f301', id from public.brands where slug = 'yazz'`);
await q(`insert into public.products (id, brand_id, name, slug, is_published) values
  ('00000000-0000-0000-0000-00000000f401', (select id from public.brands where slug = 'yazz'), 'Yazz Ultra Pads', 'yazz-ultra-pads-test', true),
  ('00000000-0000-0000-0000-00000000f402', (select id from public.brands where slug = 'hooch'), 'Hooch Cream Crackers', 'hooch-cream-crackers-test', true)`);
await q(`insert into public.product_skus (product_id, sku_code, variant_name, pack_size_label) values
  ('00000000-0000-0000-0000-00000000f401', 'YZ-UP-10', 'Regular', 'Pack of 10'),
  ('00000000-0000-0000-0000-00000000f401', 'YZ-UP-08', 'Night', 'Pack of 8'),
  ('00000000-0000-0000-0000-00000000f402', 'HC-CC-24', null, 'Carton of 24')`);
const yazzSkus = Number(await q(`select count(*) from public.product_skus s join public.products p on p.id = s.product_id
  join public.brands b on b.id = p.brand_id where b.slug = 'yazz' and s.is_active and p.is_published`));
console.log(`seeded: 4 shops, ${yazzSkus} Yazz SKUs to check`);

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.FIELD_SERVER_LOG;
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

run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: process.env });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness" };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3101", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);

const PORTAL = "http://127.0.0.1:3101";
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const NEAR_OSU = { latitude: 5.5570, longitude: -0.1830, accuracy: 15 };

async function context(width, geo) {
  const phone = width < 800;
  const ctx = await browser.newContext({
    ...(phone ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width, height: 900 } }),
    ...(geo ? { geolocation: geo, permissions: ["geolocation"] } : {}),
  });
  return ctx;
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

// A fixture photo: a real JPEG made by the browser (a shelf of coloured boxes).
async function makePhoto() {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await ctx.newPage();
  await page.setContent(`<body style="margin:0;background:#f4efe6"><div style="display:flex;gap:12px;padding:60px">${
    ["#12a3c4", "#e05a8a", "#f2b632", "#0b2f3d", "#7bc96f"].map((c) => `<div style="width:120px;height:300px;background:${c};border-radius:8px"></div>`).join("")
  }</div></body>`);
  const buf = await page.screenshot({ type: "jpeg", quality: 85 });
  await ctx.close();
  const file = path.join(OUT, "fixture-shelf.jpg");
  writeFileSync(file, buf);
  return file;
}

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);
  const photo = await makePhoto();

  // Rep on a phone (390) -------------------------------------------------------------------------------------------
  const repCtx = await context(390, NEAR_OSU);
  const rep = await login(repCtx, "rep.yazz@lexta.test");
  check(await rep.getByRole("link", { name: "Field sales", exact: true }).count() === 1, "390: a sales rep has Field sales in the menu");
  await go(rep, `${PORTAL}/systems/field-sales`);
  check(await rep.getByText("No visits yet today").isVisible(), "390: no visits yet today");
  check(await noSideScroll(rep), "390: the rep's home has no sideways scroll");
  const startBox = await rep.getByRole("link", { name: "Start visit" }).boundingBox();
  check(startBox && startBox.height >= 48 && startBox.width >= 300, "390: Start visit is a big touch target", startBox);
  await rep.screenshot({ path: `${OUT}/rep-390-today-empty.png`, fullPage: true });

  await rep.getByRole("link", { name: "Start visit" }).click();
  await rep.waitForURL(`${PORTAL}/systems/field-sales/visit`);
  await rep.getByText("Location captured").waitFor();
  check(await rep.getByText("accurate to about 15 m").isVisible(), "390: the phone's position is captured with its accuracy");
  const shopButtons = rep.locator(".fs-shop .fs-shop-name");
  await shopButtons.first().waitFor();
  const names = await shopButtons.allInnerTexts();
  check(JSON.stringify(names) === JSON.stringify(["Osu Mini Mart", "Labone Pharmacy", "Tema Station Shop"]),
    "390: the rep's brand shops, nearest first (no Hooch only shop)", names);
  check(await rep.locator(".fs-shop").first().getByText(/about 1[0-9]0 m away/).isVisible(), "390: the nearest shop shows its distance");
  const shopBox = await rep.locator(".fs-shop").first().boundingBox();
  check(shopBox && shopBox.height >= 56, "390: shop buttons are big touch targets", shopBox);
  check(await noSideScroll(rep), "390: the shop list has no sideways scroll");
  await rep.screenshot({ path: `${OUT}/rep-390-pick-shop.png`, fullPage: true });
  await rep.getByLabel("Find a shop").fill("tema");
  await rep.locator(".fs-shop .fs-shop-name", { hasText: "Tema Station Shop" }).waitFor();
  await rep.waitForFunction(() => document.querySelectorAll(".fs-shop").length === 1);
  check(true, "390: search finds a shop by town");
  await rep.getByLabel("Find a shop").fill("");
  await rep.waitForFunction(() => document.querySelectorAll(".fs-shop").length === 3);

  await rep.locator(".fs-shop", { hasText: "Osu Mini Mart" }).click();
  await rep.getByRole("heading", { name: "Osu Mini Mart" }).waitFor();
  await rep.locator('input[aria-label="Take a photo"]').setInputFiles(photo);
  await rep.locator(".fs-thumb img").first().waitFor();
  check(await rep.locator(".fs-thumb").count() === 1, "390: the photo is added and shown");
  check(await rep.locator('input[aria-label="Take a photo"]').getAttribute("capture") === "environment", "390: the photo input opens the back camera");
  await rep.getByText("Order taken", { exact: true }).click();
  await rep.getByLabel("Notes (optional)").fill("Spoke to Auntie Ama. Wants Night packs next week.");
  check(await rep.getByText("Also log this visit on the CRM timeline of Osu Mini Mart Ltd").isVisible(), "390: the CRM organisation is offered");
  await rep.getByText("Quick stock check (optional)").click();
  check(await rep.locator(".fs-stock-list li").count() === yazzSkus, "390: the stock check lists the rep's brand SKUs only");
  await rep.getByRole("group", { name: /On the shelf: Yazz Ultra Pads Regular/ }).getByRole("button", { name: "On shelf", exact: true }).click();
  await rep.getByLabel("Facings (optional)").fill("4");
  await rep.getByRole("group", { name: /On the shelf: Yazz Ultra Pads Night/ }).getByRole("button", { name: "Not on shelf", exact: true }).click();
  check(await noSideScroll(rep), "390: the visit form has no sideways scroll");
  await rep.screenshot({ path: `${OUT}/rep-390-visit-form.png`, fullPage: true });
  await rep.getByRole("button", { name: "Save visit" }).click();
  await rep.getByText("Visit saved and logged on the CRM.").waitFor();
  check(true, "390: the visit is saved and logged on the CRM");
  check(await rep.locator(".fs-steps li.st-done").count() === 2, "390: progress shows the visit and the photo done");
  await rep.screenshot({ path: `${OUT}/rep-390-saved.png`, fullPage: true });
  const v1 = JSON.parse(await q(`select json_build_object('n', count(*), 'id', max(id::text), 'status', max(location_status), 'lat', max(latitude),
    'notes', max(notes)) from public.field_visits`));
  check(v1.n === 1 && v1.status === "captured" && Number(v1.lat) === 5.557, "the database has the visit with the phone's position", v1);
  check(await q(`select count(*) from public.field_visit_photos`) === "1" && await q(`select count(*) from public.field_visit_stock_checks`) === "2"
    && await q(`select count(*) from public.crm_activities where type = 'visit'`) === "1", "one photo, two stock lines and one CRM activity");

  // A dropped connection: the visit save and the first photo upload reach the server but the answer is lost.
  await rep.getByRole("button", { name: "Start another visit" }).click();
  await rep.locator(".fs-shop", { hasText: "Labone Pharmacy" }).click();
  await rep.locator('input[aria-label="Take a photo"]').setInputFiles(photo);
  await rep.locator('input[aria-label="Choose photos from the phone"]').setInputFiles(photo);
  await rep.waitForFunction(() => document.querySelectorAll(".fs-thumb").length === 2);
  await rep.getByText("Follow up needed", { exact: true }).click();
  await rep.getByLabel("Notes (optional)").fill("=HYPERLINK(\"http://example.test\",\"x\") owner away");
  let dropVisit = 1;
  let dropPhoto = 1;
  const posts = { visit: 0, photo: 0 };
  await rep.route("**/systems/field-sales/visits", async (route) => {
    posts.visit += 1;
    if (dropVisit-- > 0) { await route.fetch(); await route.abort("connectionreset"); return; }
    await route.continue();
  });
  await rep.route("**/systems/field-sales/visits/*/photos", async (route) => {
    posts.photo += 1;
    if (dropPhoto-- > 0) { await route.fetch(); await route.abort("connectionreset"); return; }
    await route.continue();
  });
  await rep.getByRole("button", { name: "Save visit" }).click();
  await rep.getByText(/Connection problem\. Trying again/).first().waitFor();
  await rep.screenshot({ path: `${OUT}/rep-390-retrying.png`, fullPage: true });
  await rep.getByText("Visit saved.", { exact: true }).waitFor({ timeout: 30000 });
  check(posts.visit === 2 && posts.photo === 3, "390: the lost answers were retried (2 visit sends, 3 photo sends for 2 photos)", posts);
  check(await q(`select count(*) from public.field_visits`) === "2" && await q(`select count(*) from public.field_visit_photos`) === "3",
    "the retries saved nothing twice: 2 visits, 3 photos");
  await rep.unroute("**/systems/field-sales/visits");
  await rep.unroute("**/systems/field-sales/visits/*/photos");
  await rep.screenshot({ path: `${OUT}/rep-390-saved-after-retry.png`, fullPage: true });

  // A photo that never gets through: the visit is saved, the photo waits for Try again.
  await rep.getByRole("button", { name: "Start another visit" }).click();
  await rep.locator(".fs-shop", { hasText: "Tema Station Shop" }).click();
  await rep.getByText("No order", { exact: true }).click();
  await rep.locator('input[aria-label="Take a photo"]').setInputFiles(photo);
  await rep.locator(".fs-thumb img").first().waitFor();
  await rep.route("**/systems/field-sales/visits/*/photos", (route) => route.abort("internetdisconnected"));
  await rep.getByRole("button", { name: "Save visit" }).click();
  await rep.getByText("The visit is saved, but 1 photo did not upload.", { exact: false }).waitFor({ timeout: 40000 });
  check(await rep.getByRole("button", { name: "Send photos" }).isVisible(), "390: offline photo: the visit is saved and the photo can be sent again");
  await rep.screenshot({ path: `${OUT}/rep-390-photo-waiting.png`, fullPage: true });
  await rep.unroute("**/systems/field-sales/visits/*/photos");
  await rep.getByRole("button", { name: "Send photos" }).click();
  await rep.getByText("Visit saved.", { exact: true }).waitFor({ timeout: 30000 });
  check(await q(`select count(*) from public.field_visits`) === "3" && await q(`select count(*) from public.field_visit_photos`) === "4",
    "after Send photos: 3 visits, 4 photos");

  // Location refused, new shop.
  const deniedCtx = await context(390, null);
  const repNo = await login(deniedCtx, "rep.yazz@lexta.test");
  await go(repNo, `${PORTAL}/systems/field-sales/visit`);
  await repNo.getByText("Location not shared.").waitFor();
  check(true, "390: location refused is shown clearly, the visit can still be logged");
  await repNo.locator(".fs-shop").first().waitFor();
  await repNo.getByRole("button", { name: "Shop not listed? Add a new shop" }).click();
  await repNo.getByLabel("Shop name").fill("Mama Esi Provisions");
  await repNo.getByLabel("Region").selectOption({ label: "Greater Accra" });
  await repNo.getByLabel("Town").fill("Teshie");
  await repNo.getByLabel("Shop phone (optional)").fill("024 555 0101");
  check(await repNo.getByRole("checkbox", { name: "Yazz", exact: true }).isChecked(), "390: a rep with one brand has it ticked for the new shop");
  await repNo.getByText("Follow up needed", { exact: true }).click();
  await repNo.screenshot({ path: `${OUT}/rep-390-new-shop.png`, fullPage: true });
  check(await noSideScroll(repNo), "390: the new shop form has no sideways scroll");
  await repNo.getByRole("button", { name: "Save visit" }).click();
  await repNo.getByText("Visit saved.", { exact: true }).waitFor();
  const ns = JSON.parse(await q(`select json_build_object('active', s.is_active, 'new', v.new_shop, 'loc', v.location_status)
    from public.field_visits v join public.stockists s on s.id = v.stockist_id where s.name = 'Mama Esi Provisions'`));
  check(ns.active === false && ns.new === true && ns.loc === "denied", "the new shop is a draft stockist and the visit is flagged as no location", ns);
  await go(repNo, `${PORTAL}/systems/field-sales`);
  check(await repNo.locator(".fs-cards li").count() === 4, "390: My visits today lists the four visits");
  check(await repNo.getByText("New shop, waiting for staff").isVisible(), "390: the new shop waits for staff");
  check(await noSideScroll(repNo), "390: today has no sideways scroll");
  await repNo.screenshot({ path: `${OUT}/rep-390-today.png`, fullPage: true });
  await go(repNo, `${PORTAL}/systems/field-sales/history`);
  check(await repNo.locator(".fs-cards li").count() === 4, "390: My history lists the visits");
  await repNo.screenshot({ path: `${OUT}/rep-390-history.png`, fullPage: true });

  // The visit page on the phone: photo shown, notes changed.
  await go(rep, `${PORTAL}/systems/field-sales/visits/${v1.id}`);
  const img = rep.locator(".fs-gallery img").first();
  await img.waitFor();
  await rep.waitForFunction(() => { const i = document.querySelector(".fs-gallery img"); return i && i.complete && i.naturalWidth > 0; });
  check(true, "390: the visit photo loads through the portal");
  await rep.getByLabel("Notes", { exact: true }).fill("Spoke to Auntie Ama. Order of 20 packs confirmed by phone.");
  await rep.getByRole("button", { name: "Save changes" }).click();
  await rep.getByText("Saved.", { exact: true }).waitFor();
  check(await q(`select notes from public.field_visits where id = '${v1.id}'`) === "Spoke to Auntie Ama. Order of 20 packs confirmed by phone.", "390: the rep changes the notes the same day");
  check(await noSideScroll(rep), "390: the visit page has no sideways scroll");
  await rep.screenshot({ path: `${OUT}/rep-390-visit-page.png`, fullPage: true });

  // The server checks the photo's first bytes, whatever its name and type.
  const fake = await rep.request.post(`${PORTAL}/systems/field-sales/visits/${v1.id}/photos`, {
    multipart: { photo_id: "00000000-0000-4000-8000-00000000abcd", file: { name: "shelf.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<svg onload=alert(1)>not a photo</svg>") } },
  });
  check(fake.status() === 415 && await q(`select count(*) from public.field_visit_photos`) === "4", "a file that is not a JPEG, PNG or WebP is refused by its bytes", fake.status());

  // Another rep sees none of it.
  const hoochCtx = await context(390, NEAR_OSU);
  const hooch = await login(hoochCtx, "rep.hooch@lexta.test");
  await hooch.goto(`${PORTAL}/systems/field-sales/visits/${v1.id}`);
  await hooch.getByText("This page could not be found").waitFor();
  check(true, "a Hooch rep cannot open a Yazz rep's visit");
  const photoId = await q(`select id from public.field_visit_photos where visit_id = '${v1.id}' limit 1`);
  const stolen = await hooch.request.get(`${PORTAL}/systems/field-sales/visits/${v1.id}/photos/${photoId}`);
  check(stolen.status() === 404, "a Hooch rep cannot load the photo", stolen.status());
  const own = await rep.request.get(`${PORTAL}/systems/field-sales/visits/${v1.id}/photos/${photoId}`);
  check(own.status() === 200 && own.headers()["content-type"] === "image/jpeg" && own.headers()["x-content-type-options"] === "nosniff",
    "the rep loads it as image/jpeg with nosniff", own.headers());
  await go(hooch, `${PORTAL}/systems/field-sales/visit`);
  await hooch.locator(".fs-shop").first().waitFor();
  const hNames = await hooch.locator(".fs-shop .fs-shop-name").allInnerTexts();
  check(JSON.stringify(hNames) === JSON.stringify(["Labone Pharmacy", "Kejetia Provisions"]), "a Hooch rep only sees Hooch shops", hNames);
  await go(hooch, `${PORTAL}/systems/field-sales`);
  check(await hooch.getByText("No visits yet today").isVisible(), "a Hooch rep sees none of the Yazz rep's visits");

  // Manager at 1440 -------------------------------------------------------------------------------------------------
  const mgrCtx = await context(1440, null);
  const mgr = await login(mgrCtx, "manager@lexta.test");
  await go(mgr, `${PORTAL}/systems/field-sales`);
  await mgr.locator("tbody tr").first().waitFor();
  check(await mgr.locator("tbody tr").count() === 4, "1440: management sees every visit");
  check(await mgr.getByText("New shop, to confirm").isVisible(), "1440: the new shop is marked to confirm");
  await mgr.screenshot({ path: `${OUT}/manager-1440-all-visits.png`, fullPage: true });
  const yazzId = await q(`select id from public.brands where slug = 'yazz'`);
  const hoochId = await q(`select id from public.brands where slug = 'hooch'`);
  const follow = await q(`select id from public.field_visit_outcomes where slug = 'follow_up'`);
  await mgr.getByLabel("Outcome").selectOption({ label: "Follow up needed" });
  await mgr.getByRole("button", { name: "Apply" }).click();
  await mgr.waitForURL(/outcome=/);
  await mgr.locator("main h1").waitFor();
  check(await mgr.locator("tbody tr").count() === 2, "1440: filter by outcome");
  await go(mgr, `${PORTAL}/systems/field-sales?brand=${hoochId}`);
  check(await mgr.getByText("No visits match").isVisible(), "1440: filter by brand (no Hooch visits)");
  await go(mgr, `${PORTAL}/systems/field-sales?brand=${yazzId}&rep=00000000-0000-0000-0000-00000000f103`);
  check(await mgr.locator("tbody tr").count() === 4, "1440: filter by brand and rep");
  await go(mgr, `${PORTAL}/systems/field-sales?region=${await q(`select id from public.regions where slug = 'ashanti'`)}`);
  check(await mgr.getByText("No visits match").isVisible(), "1440: filter by region");
  await go(mgr, `${PORTAL}/systems/field-sales?from=2000-01-01&to=2000-01-02`);
  check(await mgr.getByText("No visits match").isVisible(), "1440: filter by date");
  const csv = await mgr.request.get(`${PORTAL}/systems/field-sales/export?outcome=${follow}`);
  const csvText = await csv.text();
  const csvLines = csvText.split("\r\n").filter(Boolean);
  check(csv.status() === 200 && csvLines.length === 3 && csvText.includes("Labone Pharmacy") && csvText.includes("Mama Esi Provisions"),
    "CSV export: the filtered visits, one row each", csvText.slice(0, 400));
  check(csvText.includes(`"'=HYPERLINK(""http://example.test"",""x"") owner away"`), "CSV export: a note that looks like a formula is guarded");
  check(csvText.includes("https://www.openstreetmap.org/?mlat=5.557&mlon=-0.183"), "CSV export: map links");
  await go(mgr, `${PORTAL}/systems/field-sales/visits/${v1.id}`);
  await mgr.waitForFunction(() => { const i = document.querySelector(".fs-gallery img"); return i && i.complete && i.naturalWidth > 0; });
  const osm = await mgr.getByRole("link", { name: "Open in OpenStreetMap" }).getAttribute("href");
  check(osm === "https://www.openstreetmap.org/?mlat=5.557&mlon=-0.183#map=18/5.557/-0.183", "1440: the visit page has a plain map link", osm);
  check(await mgr.getByText("Logged on the organisation's CRM timeline").isVisible() && await mgr.getByText("On shelf, 4 facings").isVisible(),
    "1440: the visit page shows the CRM link and the stock check");
  check(!(await mgr.getByRole("button", { name: "Save changes" }).count()) && !(await mgr.getByRole("button", { name: "Delete visit" }).count()),
    "1440: management reads but does not change or delete");
  await mgr.screenshot({ path: `${OUT}/manager-1440-visit.png`, fullPage: true });

  // Admin: outcomes and delete.
  const adminCtx = await context(1440, null);
  const admin = await login(adminCtx, "admin@lexta.test");
  await go(admin, `${PORTAL}/systems/field-sales/outcomes`);
  await admin.getByLabel("New outcome").fill("Promotion material placed");
  await admin.getByRole("button", { name: "Add", exact: true }).click();
  await admin.getByLabel("Name").nth(4).waitFor();
  check(await q(`select count(*) from public.field_visit_outcomes where slug = 'promotion_material_placed' and is_active`) === "1", "1440: admin adds an outcome");
  await admin.screenshot({ path: `${OUT}/admin-1440-outcomes.png`, fullPage: true });
  const labone = await q(`select id from public.field_visits where shop_name = 'Labone Pharmacy'`);
  await go(admin, `${PORTAL}/systems/field-sales/visits/${labone}`);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Delete visit" }).click();
  await admin.waitForURL(/deleted=1/);
  await admin.getByText("The visit was deleted.").waitFor();
  check(await q(`select count(*) from public.field_visits`) === "3" && await q(`select count(*) from storage.objects where bucket_id = 'field-visit-photos' and name like '${labone}/%'`) === "0",
    "1440: admin deletes a visit and its photo files");

  // Roles with no field sales.
  const careCtx = await context(1440, null);
  const care = await login(careCtx, "care@lexta.test");
  check(!(await care.getByRole("link", { name: "Field sales", exact: true }).count()), "customer care has no Field sales in the menu");
  await go(care, `${PORTAL}/systems/field-sales`);
  check(await care.getByText("Your role does not include field sales").isVisible(), "customer care opening field sales is refused");
  check((await care.request.get(`${PORTAL}/systems/field-sales/shops`)).status() === 403, "customer care gets no shops");
  check((await care.request.get(`${PORTAL}/systems/field-sales/export`)).status() === 403, "customer care cannot export");
  check((await care.request.get(`${PORTAL}/systems/field-sales/visits/${v1.id}/photos/${photoId}`)).status() === 404, "customer care cannot load photos");

  // The manager view on a phone and the rep's form at 1440, for the record.
  const mgrPhone = await login(await context(390, null), "manager@lexta.test");
  await go(mgrPhone, `${PORTAL}/systems/field-sales`);
  check(await noSideScroll(mgrPhone), "390: the manager view has no sideways scroll");
  await mgrPhone.screenshot({ path: `${OUT}/manager-390-all-visits.png`, fullPage: true });
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
  try { console.log("  [db]", await q("select shop_name, location_status from public.field_visits")); } catch (err) { console.log(String(err)); }
  for (const [who, page] of opened) {
    try { await page.screenshot({ path: `${OUT}/failure-${who.split("@")[0]}.png`, fullPage: true }); } catch { /* closed */ }
  }
} finally {
  await browser.close();
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
}
console.log(failures ? `${failures} browser check(s) failed` : "All browser checks passed");
process.exit(failures ? 1 : 0);
