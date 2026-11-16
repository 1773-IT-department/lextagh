// Browser check of the two installable phone apps (lib/pwa.ts). See run.sh.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
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
const OUT = process.env.PWA_SCREENSHOTS || path.join(os.tmpdir(), "lexta-pwa-screens");
mkdirSync(OUT, { recursive: true });
const { psql } = await import(`${ROOT}/supabase/tests/local/forms/rpc_shim.mjs`);

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 500)}`); }
};
async function q(sql) { const r = await psql(sql); if (r.code !== 0) throw new Error(r.err); return r.out; }

await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a101', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000a102', 'rep@lexta.test', '{"role":"sales_rep"}', '{"full_name":"Yaw Rep"}'),
  ('00000000-0000-0000-0000-00000000a103', 'mkt@lexta.test', '{"role":"marketing"}', '{"full_name":"Ama Marketing"}')`);
await q(`insert into public.profile_brands (profile_id, brand_id) select '00000000-0000-0000-0000-00000000a102'::uuid, id from public.brands where slug = 'yazz'`);

const procs = [];
const run = (cmd, args, opts) => { const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "ignore", "pipe"] }); procs.push(p); return p; };
async function waitFor(url) {
  for (let i = 0; i < 120; i += 1) { try { const r = await fetch(url); if (r.status < 500) return; } catch { /* not up */ } await sleep(500); }
  throw new Error(`not up: ${url}`);
}
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: process.env });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  NEXT_PUBLIC_PORTAL_URL: "http://127.0.0.1:3101" };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3101", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
const PORTAL = "http://127.0.0.1:3101";
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });

async function phone() {
  return browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" });
}
async function login(ctx, email) {
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return page;
}

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);

  // Public files: manifests, icons, service worker, offline page, install pages, all without a login.
  for (const key of ["field-sales", "csr"]) {
    const r = await fetch(`${PORTAL}/pwa/${key}.webmanifest`, { redirect: "manual" });
    check(r.status === 200 && /manifest\+json/.test(r.headers.get("content-type") ?? ""), `${key}: manifest served without a login as application/manifest+json`, [r.status, r.headers.get("content-type")]);
    const m = await r.json().catch(() => ({}));
    const sizes = (m.icons ?? []).map((i) => `${i.sizes}:${i.purpose}`);
    check(m.display === "standalone" && m.start_url?.startsWith(key === "csr" ? "/systems/csr" : "/systems/field-sales") && m.name && m.short_name?.length <= 12,
      `${key}: manifest is standalone with its own name and start page`, m);
    check(sizes.includes("192x192:any") && sizes.includes("512x512:any") && sizes.includes("512x512:maskable"), `${key}: 192, 512 and maskable icons`, sizes);
    for (const i of m.icons ?? []) {
      const ir = await fetch(`${PORTAL}${i.src}`, { redirect: "manual" });
      check(ir.status === 200 && /image\/png/.test(ir.headers.get("content-type") ?? ""), `${key}: icon ${i.src} served`, ir.status);
    }
    const ip = await fetch(`${PORTAL}/install/${key}`, { redirect: "manual" });
    check(ip.status === 200, `${key}: install page opens without a login`, ip.status);
  }
  const sw = await fetch(`${PORTAL}/lexta-sw.js`, { redirect: "manual" });
  check(sw.status === 200 && /javascript/.test(sw.headers.get("content-type") ?? "") && /no-cache/.test(sw.headers.get("cache-control") ?? ""), "service worker served, never cached", [sw.status, sw.headers.get("cache-control")]);
  const off = await fetch(`${PORTAL}/offline.html`, { redirect: "manual" });
  check(off.status === 200, "offline page served", off.status);
  const fsPage = await fetch(`${PORTAL}/systems/field-sales`, { redirect: "manual" });
  check(fsPage.status >= 300 && fsPage.status < 400, "the field sales app itself still needs a login", fsPage.status);

  // Install page on a phone: install button, iPhone steps, the worker registers; Chromium sees an installable app.
  for (const key of ["field-sales", "csr"]) {
    const ctx = await phone();
    const page = await ctx.newPage();
    await page.goto(`${PORTAL}/install/${key}`);
    await page.locator("h1").first().waitFor();
    const body = await page.locator("body").innerText();
    check(/Install/.test(body) && /sign in/i.test(body), `${key}: install page explains installing then signing in`);
    const reg = await page.evaluate(async () => {
      for (let i = 0; i < 40; i += 1) { const r = await navigator.serviceWorker.getRegistration(); if (r?.active) return r.active.scriptURL; await new Promise((s) => setTimeout(s, 250)); }
      return null;
    });
    check(reg?.endsWith("/lexta-sw.js"), `${key}: service worker registered on the install page`, reg);
    const cdp = await ctx.newCDPSession(page);
    const errs = await cdp.send("Page.getInstallabilityErrors").catch((e) => ({ error: String(e) }));
    check(Array.isArray(errs.installabilityErrors) && errs.installabilityErrors.length === 0, `${key}: Chromium reports the app as installable`, errs);
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    check(manifestHref === `/pwa/${key}.webmanifest`, `${key}: install page links its own manifest`, manifestHref);
    await page.screenshot({ path: path.join(OUT, `install-${key}-390.png`), fullPage: true });
    await ctx.close();
  }
  // iPhone Safari sees the Add to Home Screen steps.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
    const page = await ctx.newPage();
    await page.goto(`${PORTAL}/install/field-sales`);
    await page.waitForTimeout(800);
    const t = await page.locator("body").innerText();
    check(/Add to Home Screen/i.test(t) && /Share/.test(t), "iPhone: step by step Share then Add to Home Screen", t.slice(0, 300));
    await page.screenshot({ path: path.join(OUT, "install-field-sales-iphone-390.png"), fullPage: true });
    await ctx.close();
  }

  // Share panels by role.
  {
    const ctx = await phone();
    const page = await login(ctx, "admin@lexta.test");
    await page.goto(`${PORTAL}/systems/field-sales`);
    await page.locator("main h1").first().waitFor();
    const panel = page.locator("section.pwa-share");
    check(await panel.count() === 1, "admin: field sales shows the Share install link panel");
    const link = await panel.first().locator("input[aria-label=\"Install link\"]").inputValue().catch(() => "");
    check(link === `${PORTAL}/install/field-sales`, "admin: the panel shows the install link", link);
    const wa = await panel.first().getByRole("link", { name: "WhatsApp" }).getAttribute("href").catch(() => "");
    check(wa.startsWith("https://wa.me/?text=") && decodeURIComponent(wa).includes("/install/field-sales"), "admin: WhatsApp share carries the link", wa);
    check(await panel.first().locator("svg, canvas, img").count() > 0, "admin: the panel has a QR code");
    await panel.first().scrollIntoViewIfNeeded();
    await panel.first().screenshot({ path: path.join(OUT, "share-panel-field-sales-390.png") });
    const html = await page.content();
    check(!/api\.qrserver|chart\.googleapis|quickchart/i.test(html), "QR code made locally, no outside QR service");
    await page.goto(`${PORTAL}/systems/csr`);
    await page.locator("main h1").first().waitFor();
    check(await page.locator("section.pwa-share").count() === 1, "admin: CSR shows its Share install link panel");
    await page.goto(`${PORTAL}/management`);
    await page.locator("main h1").first().waitFor();
    check(await page.locator("section.pwa-share").count() === 2, "admin: management overview shows both install links", await page.locator("section.pwa-share").count());
    await ctx.close();
  }
  {
    const ctx = await phone();
    const page = await login(ctx, "rep@lexta.test");
    await page.goto(`${PORTAL}/systems/field-sales`);
    await page.locator("main h1").first().waitFor();
    check(await page.locator("section.pwa-share").count() === 0, "sales rep: no Share panel");
    const banner = await page.locator("body").innerText();
    check(/Install/i.test(banner), "sales rep on a phone: install banner offered");
    await page.screenshot({ path: path.join(OUT, "field-sales-rep-banner-390.png") });
    const reg = await page.evaluate(async () => {
      for (let i = 0; i < 40; i += 1) { const r = await navigator.serviceWorker.getRegistration(); if (r?.active) return true; await new Promise((s) => setTimeout(s, 250)); }
      return false;
    });
    check(reg, "sales rep: service worker registered inside field sales");
    await ctx.close();
  }
  {
    const ctx = await phone();
    const page = await login(ctx, "mkt@lexta.test");
    await page.goto(`${PORTAL}/systems/csr`);
    await page.locator("main h1").first().waitFor();
    check(await page.locator("section.pwa-share").count() === 1, "marketing: CSR shows the Share panel");
    await ctx.close();
  }
  // Pages outside the two apps do not register the worker.
  {
    const ctx = await phone();
    const page = await ctx.newPage();
    await page.goto(`${PORTAL}/login`);
    await page.waitForTimeout(1500);
    const reg = await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
    check(!reg, "login page alone does not register the service worker");
    await ctx.close();
  }
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e.stack ?? e}`);
} finally {
  await browser.close().catch(() => {});
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
}
console.log(failures ? `${failures} PWA check(s) failed` : "All PWA checks passed");
process.exit(failures ? 1 : 0);
