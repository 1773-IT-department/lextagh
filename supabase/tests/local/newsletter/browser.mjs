// Newsletter unsubscribe (P4) in a browser, against the throwaway harness database only, through ../browser/gateway.mjs.
// Never pointed at the real project or a real domain. Seeds fictional demo people (../browser/demo-seed.mjs) and two
// newsletter sign ups through the real intake, then:
//   - /unsubscribe without a token, with a malformed token: "not valid" at once, nothing changes
//   - /unsubscribe with a real token: a button only (opening the link changes nothing); pressing it unsubscribes, with
//     JavaScript and without it; a well formed unknown token ends on "not valid"
//   - the page has no nav entry and is not indexed; no console errors, no sideways scroll at 390 and 1440 px
//   - the portal's CRM contacts "Newsletter" filter: Subscribed and Unsubscribed
// Screenshots of every state go to NEWSLETTER_SCREENSHOTS (default: a newsletter-screens folder in the temp directory).
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
const OUT = process.env.NEWSLETTER_SCREENSHOTS || path.join(os.tmpdir(), "newsletter-screens");
mkdirSync(OUT, { recursive: true });

const { q } = await import("../browser/demo-seed.mjs");
const stamp = Date.now().toString(36);
const subscribe = (email, brand) => q(`set role anon; select public.submit_website_enquiry('newsletter', jsonb_build_object('brand', '${brand}', 'email', '${email}', 'consent_marketing', true));`);
const A = `ama.news.${stamp}@example.com`;
const B = `kofi.news.${stamp}@example.com`;
await subscribe(A, "lexta");
await subscribe(B, "yazz");
const tokenOf = (email) => q(`select t.token from public.crm_newsletter_tokens t join public.crm_contacts c on c.id = t.contact_id where c.email = '${email}'`);
const state = (email) => q(`select consent_marketing || '|' || (marketing_unsubscribed_at is not null) from public.crm_contacts where email = '${email}'`);

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 700)}`); }
};

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  p.stdout.on("data", () => {});
  p.stderr.on("data", (d) => { if (/error/i.test(String(d))) process.stdout.write(`[${path.basename(opts?.cwd ?? cmd)}] ${String(d).slice(0, 300)}`); });
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
run(`${ROOT}/apps/lexta/node_modules/.bin/next`, ["start", "-p", "3110", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/lexta`, env });
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3111", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
const SITE = "http://127.0.0.1:3110";
const PORTAL = "http://127.0.0.1:3111";

const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const VIEW = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1440, height: 900 } } };
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost"] });
async function context(kind, extra = {}) {
  const ctx = await browser.newContext({ ...VIEW[kind], ...extra });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => (r.request().resourceType() === "image"
    ? r.fulfill({ status: 200, contentType: "image/svg+xml", body: GREY }) : r.abort()));
  return ctx;
}
const width = (kind) => (kind === "phone" ? 390 : 1440);
async function look(page) {
  return page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim() ?? "",
    state: document.querySelector("[data-unsubscribe-state]")?.getAttribute("data-unsubscribe-state") ?? "",
    text: document.querySelector("[data-unsubscribe-state]")?.textContent ?? "",
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
    sw: document.documentElement.scrollWidth, w: window.innerWidth,
    dashes: /—|–| - /.test(document.querySelector("main")?.textContent ?? ""),
    navLink: Array.from(document.querySelectorAll("header a, nav a, footer a")).some((a) => (a.getAttribute("href") ?? "").includes("unsubscribe")),
  }));
}

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${SITE}/unsubscribe`);
  await waitFor(`${PORTAL}/login`);
  const tokenA = await tokenOf(A);
  const tokenB = await tokenOf(B);
  check(/^[0-9a-f]{48}$/.test(tokenA) && /^[0-9a-f]{48}$/.test(tokenB) && tokenA !== tokenB, "each newsletter sign up has its own token");

  for (const kind of ["desktop", "phone"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message)));
    // Outside hosts (fonts, maps) are blocked on purpose; their failures are not the page's.
    page.on("console", (m) => { if (m.type() === "error" && !(/ERR_FAILED/.test(m.text()) && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(m.location()?.url ?? ""))) errors.push(`${m.text()} @ ${m.location()?.url ?? ""}`); });

    // No token, a malformed token: "not valid" at once.
    for (const [label, url] of [["no-token", "/unsubscribe"], ["bad-token", "/unsubscribe?token=../../etc"]]) {
      const r = await page.goto(`${SITE}${url}`);
      const l = await look(page);
      check(r?.status() === 200 && l.state === "invalid" && l.h1 === "This link is not valid" && l.text.includes("marketing@lextagh.com"),
        `${kind} ${label}: a neutral "link not valid" message`, l);
    }
    await page.screenshot({ path: path.join(OUT, `unsubscribe-invalid-${width(kind)}.png`), fullPage: true });

    // A real token: opening the link only shows the button.
    const token = kind === "desktop" ? tokenA : tokenB;
    const email = kind === "desktop" ? A : B;
    await page.goto(`${SITE}/unsubscribe?token=${token}`);
    const l = await look(page);
    check(l.state === "confirm" && l.h1 === "Unsubscribe from our emails" && /noindex/.test(l.robots) && !l.navLink && l.sw <= l.w && !l.dashes,
      `${kind}: the link shows a button, is not indexed, has no nav entry, no sideways scroll, no dashes`, l);
    check((await state(email)) === "true|false", `${kind}: opening the link alone changes nothing (mail scanners open links)`);
    await page.screenshot({ path: path.join(OUT, `unsubscribe-confirm-${width(kind)}.png`), fullPage: true });

    // Press the button (JavaScript on).
    await page.getByRole("button", { name: /Unsubscribe/ }).click();
    await page.waitForURL(/result=done/, { timeout: 15000 }).catch(() => {});
    const d = await look(page);
    check(d.state === "done" && d.h1 === "You are unsubscribed", `${kind}: pressing the button shows the confirmation`, d);
    check((await state(email)) === "false|true", `${kind}: marketing consent is off and the time is recorded`);
    await page.screenshot({ path: path.join(OUT, `unsubscribe-done-${width(kind)}.png`), fullPage: true });

    // A well formed token nobody has: "not valid".
    await page.goto(`${SITE}/unsubscribe?token=${"0".repeat(48)}`);
    await page.getByRole("button", { name: /Unsubscribe/ }).click();
    await page.waitForURL(/result=invalid/, { timeout: 15000 }).catch(() => {});
    check((await look(page)).state === "invalid", `${kind}: an unknown token ends on "not valid"`);
    check(errors.length === 0, `${kind}: no console errors`, errors);
    await ctx.close();
  }

  // Without JavaScript: the button is a plain form post.
  {
    const C = `esi.news.${stamp}@example.com`;
    await subscribe(C, "linzzy");
    const ctx = await context("phone", { javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${SITE}/unsubscribe?token=${await tokenOf(C)}`);
    await Promise.all([page.waitForURL(/result=done/, { timeout: 15000 }).catch(() => {}), page.getByRole("button", { name: /Unsubscribe/ }).click()]);
    const l = await look(page);
    check(l.state === "done" && (await state(C)) === "false|true", "without JavaScript: the button unsubscribes and shows the confirmation", l);
    await ctx.close();
  }

  // Portal: CRM contacts, Newsletter filter.
  for (const kind of ["desktop", "phone"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    await page.goto(`${PORTAL}/login`);
    await page.getByLabel("Email").fill("marketing@demo.test");
    await page.getByLabel("Password").fill("harness-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    await page.goto(`${PORTAL}/systems/crm/contacts`);
    const opts = await page.locator("select#newsletter option").allTextContents();
    check(JSON.stringify(opts) === JSON.stringify(["Any", "Subscribed", "Unsubscribed"]), `${kind} portal: a Newsletter filter with Subscribed and Unsubscribed`, opts);
    await page.goto(`${PORTAL}/systems/crm/contacts?newsletter=unsubscribed&q=news.${stamp}`);
    const unsub = await page.locator("table.ptable tbody").innerText().catch(() => "");
    check(unsub.includes(A) && unsub.includes(B) && /Unsubscribed/.test(unsub), `${kind} portal: Unsubscribed lists the people who used the link, marked Unsubscribed with the date`, unsub);
    await page.screenshot({ path: path.join(OUT, `crm-newsletter-unsubscribed-${width(kind)}.png`), fullPage: true });
    await subscribe(`yaw.news.${stamp}@example.com`, "hooch");
    await page.goto(`${PORTAL}/systems/crm/contacts?newsletter=subscribed&q=news.${stamp}`);
    const sub = await page.locator("table.ptable tbody").innerText().catch(() => "");
    check(sub.includes(`yaw.news.${stamp}@example.com`) && !sub.includes(A), `${kind} portal: Subscribed lists only people with marketing consent`, sub);
    await page.screenshot({ path: path.join(OUT, `crm-newsletter-subscribed-${width(kind)}.png`), fullPage: true });
    await ctx.close();
  }
} catch (e) {
  failures += 1;
  console.log(`  FAIL: unexpected error ${e?.stack ?? e}`);
} finally {
  await browser.close();
  for (const p of procs) p.kill("SIGTERM");
}

console.log(`Screenshots in ${OUT}`);
if (failures) { console.log(`${failures} newsletter browser checks failed`); process.exit(1); }
console.log("All newsletter browser checks passed");
