// Screenshots for the staff user guide. Run through ./run.sh, which starts the throwaway harness database first
// (PGHOST and friends set). Seeds clearly fictional demo data ("Demo Shop Adabraka", "Ama Demo"), starts the local
// gateway (supabase/tests/local/browser/gateway.mjs) and the portal's production build, signs in as each demo role and
// saves PNGs to docs/user-guide/images (desktop 1280 px, field sales on a phone at 390 px, device scale 1).
// Outside hosts never resolve; product images that point at them get a plain grey tile instead.
// Every server it starts is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require("/opt/node-tools/node_modules/playwright/index.js"); }
const { chromium } = pw;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const OUT = process.env.GUIDE_SCREENSHOTS || path.resolve(HERE, "../images");
mkdirSync(OUT, { recursive: true });
const { firstOrder, PHOTO_SECRET, q } = await import(`${ROOT}/supabase/tests/local/browser/demo-seed.mjs`);

// Servers --------------------------------------------------------------------------------------------------------------
const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.GUIDE_SERVER_LOG;
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
const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-guide-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  FIELD_PHOTO_SECRET: PHOTO_SECRET };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3104", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);
const PORTAL = "http://127.0.0.1:3104";

// Browser --------------------------------------------------------------------------------------------------------------
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
// A plain grey tile for product images that live on outside hosts.
const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const NEAR_ADABRAKA = { latitude: 5.5605, longitude: -0.2102, accuracy: 12 };

async function context(kind) {
  const phone = kind === "phone";
  const ctx = await browser.newContext({
    ...(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } }),
    deviceScaleFactor: 1,
    ...(phone ? { geolocation: NEAR_ADABRAKA, permissions: ["geolocation"] } : {}),
  });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => (r.request().resourceType() === "image"
    ? r.fulfill({ status: 200, contentType: "image/svg+xml", body: GREY }) : r.abort()));
  return ctx;
}
async function login(email, kind = "desktop") {
  const ctx = await context(kind);
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return page;
}
async function go(page, url) {
  await page.goto(`${PORTAL}${url}`);
  await page.locator("main h1").first().waitFor();
  await page.waitForLoadState("networkidle").catch(() => {});
}
const shots = [];
/** Saves a PNG. Full pages are cut at maxHeight so files stay small. */
async function shot(page, name, { full = false, maxHeight = 1500 } = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  if (full) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const w = page.viewportSize().width;
    await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, maxHeight) } });
  } else {
    await page.screenshot({ path: file });
  }
  shots.push(name);
  console.log(`  saved ${name}.png`);
}

let failed = false;
try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);

  // 1. Getting started -------------------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${PORTAL}/login`);
    await page.getByLabel("Email").waitFor();
    await shot(page, "01-sign-in");
    await page.goto(`${PORTAL}/forgot-password`);
    await page.getByLabel("Email").waitFor();
    await shot(page, "02-forgot-password");
    await ctx.close();
  }
  // Admin and management land on the management overview, so Home is shown for a marketing person.
  const admin = await login("admin@demo.test");
  const marketingHome = await login("marketing@demo.test");
  await go(marketingHome, "/");
  await shot(marketingHome, "03-home-marketing");
  const repPhone = await login("rep@demo.test", "phone");
  await go(repPhone, "/");
  await shot(repPhone, "04-home-phone", { full: true, maxHeight: 1400 });

  // 2. Management overview ----------------------------------------------------------------------------------------------
  // The catalogue rows the migrations seed are dated the day they ran; date them back so the feed shows the demo work.
  await q(`set session_replication_role = replica;
    update public.products set created_at = now() - interval '1 year', updated_at = now() - interval '1 year';
    set session_replication_role = origin;`);
  const manager = await login("manager@demo.test");
  await go(manager, "/management");
  await shot(manager, "10-dashboard", { full: true, maxHeight: 1500 });
  await go(manager, "/management/activity");
  await shot(manager, "11-management-activity", { full: true, maxHeight: 1300 });
  await go(manager, "/management/complaints");
  await shot(manager, "12-management-section", { full: true, maxHeight: 1500 });
  // The CRM tab's latest leads: website leads by their kind and reference, never the visitor's name.
  await go(manager, "/management/crm");
  const latest = manager.locator("section[aria-labelledby=sec_latest]");
  await latest.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24));
  await manager.waitForTimeout(300);
  await shot(manager, "13-management-crm-latest");
  // A Lexta dropdown open: the brand filter, with the chosen option ticked and the next one highlighted.
  await go(manager, "/management");
  const brand = manager.locator("[data-lx-select-combo]").and(manager.getByRole("combobox", { name: "Brand", exact: true }));
  await brand.waitFor();
  await brand.click();
  await manager.keyboard.press("ArrowDown");
  await manager.waitForTimeout(400);
  await manager.screenshot({ path: path.join(OUT, "05-dropdown.png"), clip: { x: 250, y: 0, width: 1030, height: 520 } });
  shots.push("05-dropdown");
  console.log("  saved 05-dropdown.png");
  await manager.keyboard.press("Escape");

  // 3. Distributor ordering ---------------------------------------------------------------------------------------------
  const rep = await login("rep@demo.test");
  await go(rep, "/systems/orders");
  await shot(rep, "20-orders-inbox");
  await go(rep, `/systems/orders/${firstOrder}`);
  await shot(rep, "21-order-staff", { full: true, maxHeight: 1300 });
  await go(rep, "/systems/orders/distributors");
  await shot(rep, "22-distributor-logins");
  const dist = await login("distributor@demo.test");
  await go(dist, "/systems/orders");
  await shot(dist, "23-distributor-my-orders");
  await go(dist, "/systems/orders/new");
  const steppers = dist.locator(".stepper input");
  await steppers.nth(0).fill("24");
  await steppers.nth(1).fill("12");
  await shot(dist, "24-distributor-new-order");
  await dist.getByRole("button", { name: "Review order" }).click();
  await dist.getByRole("heading", { name: "Your order" }).waitFor();
  await shot(dist, "25-distributor-review", { full: true, maxHeight: 1300 });

  // 4. Field sales (phone) ----------------------------------------------------------------------------------------------
  await go(repPhone, "/systems/field-sales");
  await shot(repPhone, "30-field-today", { full: true, maxHeight: 1200 });
  await repPhone.getByRole("link", { name: "Start visit" }).click();
  await repPhone.getByText("Location captured").waitFor();
  await repPhone.locator(".fs-shop .fs-shop-name").first().waitFor();
  await shot(repPhone, "31-field-pick-shop", { full: true, maxHeight: 1300 });
  await repPhone.locator(".fs-shop", { hasText: "Demo Shop Adabraka" }).click();
  await repPhone.getByRole("heading", { name: "Demo Shop Adabraka" }).waitFor();
  // A demo shelf photo, made by the browser.
  const photoCtx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  const photoPage = await photoCtx.newPage();
  await photoPage.setContent(`<body style="margin:0;background:#f4efe6"><div style="display:flex;gap:12px;padding:60px">${
    ["#12a3c4", "#e05a8a", "#f2b632", "#0b2f3d", "#7bc96f"].map((c) => `<div style="width:120px;height:300px;background:${c};border-radius:8px"></div>`).join("")}</div></body>`);
  const photoFile = path.join(STORE, "demo-shelf.jpg");
  writeFileSync(photoFile, await photoPage.screenshot({ type: "jpeg", quality: 80 }));
  await photoCtx.close();
  await repPhone.locator('input[aria-label="Take a photo"]').setInputFiles(photoFile);
  await repPhone.locator(".fs-thumb img").first().waitFor();
  await repPhone.getByText("Order taken", { exact: true }).click();
  await repPhone.getByLabel("Notes (optional)").fill("Spoke to Ama Demo. Wants Heavy flow packs next week.");
  await repPhone.getByText("Quick stock check (optional)").click();
  await repPhone.locator(".fs-stock-list li").first().getByRole("button", { name: "On shelf", exact: true }).click();
  await shot(repPhone, "32-field-visit-form", { full: true, maxHeight: 1700 });
  await repPhone.getByRole("button", { name: "Save visit" }).click();
  await repPhone.getByRole("heading", { name: "Visit saved" }).waitFor({ timeout: 30000 });
  await repPhone.getByRole("heading", { name: "Visit saved" }).scrollIntoViewIfNeeded();
  await repPhone.evaluate(() => window.scrollBy(0, 200));
  await shot(repPhone, "33-field-visit-saved");
  await go(manager, "/systems/field-sales");
  await shot(manager, "34-field-all-visits");

  // 5. CRM ----------------------------------------------------------------------------------------------------------------
  await go(rep, "/systems/crm/leads");
  await shot(rep, "40-crm-leads");
  await go(rep, "/systems/crm/leads/00000000-0000-0000-0000-00000000e001");
  await shot(rep, "41-crm-lead", { full: true, maxHeight: 1500 });
  await go(admin, "/systems/crm/settings/website-leads");
  await shot(admin, "42-crm-website-lead-managers", { full: true, maxHeight: 1300 });

  // 6. Complaints ----------------------------------------------------------------------------------------------------------
  const care = await login("care@demo.test");
  await go(care, "/systems/complaints");
  await shot(care, "50-complaints-list");
  await go(care, "/systems/complaints/00000000-0000-0000-0000-00000000f001");
  await shot(care, "51-complaint", { full: true, maxHeight: 1600 });
  await go(care, "/systems/complaints/new");
  await shot(care, "52-log-complaint");

  // 7. Product management --------------------------------------------------------------------------------------------------
  const mkt = await login("marketing@demo.test");
  await go(mkt, "/systems/products");
  await shot(mkt, "60-products");
  const toothpaste = (await q(`select id from public.products where slug = 'toothpaste'`)).trim();
  await go(mkt, `/systems/products/${toothpaste}`);
  // Above the sticky Save bar, so it covers nothing.
  await mkt.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await mkt.screenshot({ path: path.join(OUT, "61-product-edit.png"), clip: { x: 0, y: 0, width: 1280, height: 715 } });
  shots.push("61-product-edit");

  // 8. Stockists ------------------------------------------------------------------------------------------------------------
  await go(mkt, "/systems/stockists");
  await shot(mkt, "70-stockists");
  await go(mkt, "/systems/stockists/import");
  await mkt.getByLabel("Or paste the CSV text").fill([
    "name,outlet_type,region,town,address,phone,latitude,longitude,brands",
    "Demo Store Cape Coast,general trade,Central,Cape Coast,Opposite the Demo market,,,,Yazz",
    "Demo Pharmacy Takoradi,pharmacy,Western,Takoradi,,031 000 0002,4.8970,-1.7600,Yazz; Linzzy",
    "Demo Kiosk Bolga,kiosk,Upper East,Bolgatanga,,,,Yazz",
  ].join("\n"));
  await mkt.getByRole("button", { name: "Check rows" }).click();
  await mkt.getByRole("button", { name: /^Import \d+ valid/ }).waitFor();
  await shot(mkt, "71-stockists-import", { full: true, maxHeight: 1500 });
  await go(mkt, "/systems/stockists/00000000-0000-0000-0000-00000000b001");
  await shot(mkt, "72-stockist-edit", { full: true, maxHeight: 1500 });

  // 9. CSR activities -------------------------------------------------------------------------------------------------------
  await go(mkt, "/systems/csr");
  await shot(mkt, "80-csr", { full: true, maxHeight: 1400 });
  await go(mkt, "/systems/csr/new");
  await shot(mkt, "81-csr-log");

  // 10. Recruitment ---------------------------------------------------------------------------------------------------------
  const hr = await login("hr@demo.test");
  await go(hr, "/systems/recruitment");
  await shot(hr, "90-recruitment");
  await go(hr, "/systems/recruitment/applications/00000000-0000-0000-0000-00000000aa01");
  await shot(hr, "91-application", { full: true, maxHeight: 1400 });
  await go(hr, "/systems/recruitment/roles");
  await shot(hr, "92-roles");

  // 11. Live chat -----------------------------------------------------------------------------------------------------------
  await go(care, "/systems/chat");
  await shot(care, "100-chat-inbox");
  await go(care, "/systems/chat/00000000-0000-0000-0000-00000000ab02");
  await shot(care, "101-chat-conversation", { full: true, maxHeight: 1400 });

  // 12. Users and access ----------------------------------------------------------------------------------------------------
  await go(admin, "/systems/users");
  await shot(admin, "110-users");
} catch (e) {
  failed = true;
  console.error(e);
} finally {
  await browser.close().catch(() => {});
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
}
console.log(`${shots.length} screenshots in ${OUT}`);
process.exit(failed ? 1 : 0);
