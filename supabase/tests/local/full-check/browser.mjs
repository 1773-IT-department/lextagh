// Full check of the Lexta website and the 8 systems (item 28) at 390 px (phone) and 1440 px (desktop), against the
// throwaway harness database only, through ../browser/gateway.mjs. Never pointed at the real project or a real domain.
// Seeds the fictional demo data of ../browser/demo-seed.mjs, starts the gateway and the production builds of the site
// and the portal, then:
//   - visits every page and screen: HTTP 200, no error text, no console errors or failed requests (outside hosts are
//     blocked: images get a grey tile, everything else is aborted and not counted), no horizontal scroll, images have alt
//   - checks every internal link those pages carry (a 2xx or 3xx answer)
//   - sends each website form and checks it reached the right portal list, the CV upload, and a live chat round trip
//   - signs in as every role: its menu and home tiles, and a refusal on every other system
//   - runs one create or edit and save per system and waits for the success message
// Build both apps for the harness first:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
//   NEXT_PUBLIC_PORTAL_URL=http://127.0.0.1:3101 TURBO_FORCE=true pnpm build
// then: bash supabase/tests/local/full-check/run.sh
// Screenshots of problems only go to FULL_CHECK_OUT (default: a lexta-full-check folder in the temp directory), with
// results.json and servers.log. Every server it starts is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const OUT = process.env.FULL_CHECK_OUT || path.join(os.tmpdir(), "lexta-full-check");
const SHOTS = OUT;
const RESULTS = path.join(OUT, "results.json");
mkdirSync(SHOTS, { recursive: true });
const SRVLOG = path.join(OUT, "servers.log");
writeFileSync(SRVLOG, "");
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require("/opt/node-tools/node_modules/playwright/index.js"); }
const { chromium } = pw;

const { q, firstOrder, PHOTO_SECRET } = await import("../browser/demo-seed.mjs");
const CHAT_SECRET = "harness-chat-secret-0123456789abcdef0123456789";
const REC_SECRET = "harness-recruit-secret-0123456789abcdef0123456789";
await q(`insert into private.chat_intake_secret (secret) values ('${CHAT_SECRET}')`);
await q(`insert into private.recruitment_intake_secret (secret) values ('${REC_SECRET}')`);

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const tag = path.basename(opts.cwd ?? args[0] ?? cmd);
  p.stdout.on("data", (d) => appendFileSync(SRVLOG, `[${tag} out] ${d}`));
  p.stderr.on("data", (d) => { appendFileSync(SRVLOG, `[${tag} err] ${d}`); if (/error/i.test(String(d))) process.stdout.write(`[srv ${path.basename(opts.cwd ?? cmd)}] ${String(d).slice(0, 400)}`); });
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
const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-full-check-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  NEXT_PUBLIC_PORTAL_URL: "http://127.0.0.1:3101", CHAT_INTAKE_SECRET: CHAT_SECRET, RECRUITMENT_INTAKE_SECRET: REC_SECRET, FIELD_PHOTO_SECRET: PHOTO_SECRET,
  REVALIDATE_SECRET: "harness-revalidate-secret", SITE_REVALIDATE_URLS: "http://127.0.0.1:3100/api/revalidate" };
run(`${ROOT}/apps/lexta/node_modules/.bin/next`, ["start", "-p", "3100", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/lexta`, env });
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3101", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);
const SITE = "http://127.0.0.1:3100";
const PORTAL = "http://127.0.0.1:3101";

const R = { pages: [], flows: [], roles: [], links: [], notes: [] };
const flow = (area, name, ok, detail) => { R.flows.push({ area, name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} [${area}] ${name}${detail && !ok ? ` :: ${String(detail).slice(0, 300)}` : ""}`); };

const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost"] });
const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const VIEW = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1440, height: 900 } } };

async function context(kind, extra = {}) {
  const ctx = await browser.newContext({ ...VIEW[kind], extraHTTPHeaders: { "x-real-ip": "127.0.0.9" },
    geolocation: { latitude: 5.5605, longitude: -0.2102, accuracy: 12 }, permissions: ["geolocation"], ...extra });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => (r.request().resourceType() === "image"
    ? r.fulfill({ status: 200, contentType: "image/svg+xml", body: GREY }) : r.abort()));
  return ctx;
}
/** Attaches listeners; returns a function that drains problems seen since the last call. */
function watch(page) {
  let buf = [];
  page.on("console", (m) => { if (m.type() === "error" && !(/ERR_FAILED/.test(m.text()) && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(m.location()?.url ?? ""))) buf.push(`console: ${m.text().slice(0, 300)} @ ${m.location()?.url ?? ""}`); });
  page.on("pageerror", (e) => buf.push(`pageerror: ${String(e.message).slice(0, 300)}`));
  page.on("requestfailed", (r) => { if (/^https?:\/\/127\.0\.0\.1/.test(r.url()) && !/ERR_ABORTED/.test(r.failure()?.errorText ?? "")) buf.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  page.on("response", (r) => { if (/^https?:\/\/127\.0\.0\.1/.test(r.url()) && r.status() >= 400) buf.push(`http ${r.status()}: ${r.url()}`); });
  return () => { const out = buf; buf = []; return out; };
}
async function login(email, kind) {
  const ctx = await context(kind);
  const page = await ctx.newPage();
  const drain = watch(page);
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  drain();
  return { ctx, page, drain };
}

const linkSet = new Map(); // url -> { from, ctx }
async function checkPage(sess, base, url, kind, label, { as = "" } = {}) {
  const { page, drain } = sess;
  drain();
  const rec = { app: base === SITE ? "site" : "portal", url, kind, label, as, problems: [] };
  let resp;
  try {
    resp = await page.goto(`${base}${url}`, { waitUntil: "load", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await sleep(300);
  } catch (e) { rec.problems.push(`navigation: ${e.message.split("\n")[0]}`); }
  rec.status = resp?.status();
  if (rec.status !== 200) rec.problems.push(`status ${rec.status}`);
  const info = await page.evaluate(() => {
    const se = document.scrollingElement;
    const text = document.body?.innerText ?? "";
    const wide = [];
    if (se.scrollWidth > innerWidth) {
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed") {
          wide.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.split(" ").slice(0, 2).join(".")}` : ""} right=${Math.round(r.right)}`);
          if (wide.length > 5) break;
        }
      }
    }
    return {
      scrollWidth: se.scrollWidth, innerWidth, wide,
      errorBoundary: /Application error|Something went wrong|This page could not be found|Unhandled Runtime Error/i.test(text) ? text.match(/(Application error[^\n]*|Something went wrong[^\n]*|This page could not be found[^\n]*)/i)?.[0] : null,
      noAlt: [...document.querySelectorAll("img:not([alt])")].map((i) => i.getAttribute("src")).slice(0, 10),
      links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
      h1: document.querySelector("h1")?.innerText ?? "",
      placeholders: [...new Set((text.match(/\[PLACEHOLDER:[^\]]*\]/g) ?? []))],
      dashes: [...new Set((text.match(/.{0,30}(?:[\u2013\u2014]| - ).{0,30}/g) ?? []))].slice(0, 10),
      finalUrl: location.href,
    };
  }).catch((e) => ({ evalError: e.message }));
  Object.assign(rec, { h1: info.h1, finalUrl: info.finalUrl, placeholders: info.placeholders, dashes: info.dashes });
  if (info.evalError) rec.problems.push(`eval: ${info.evalError}`);
  if (info.scrollWidth > info.innerWidth) rec.problems.push(`horizontal scroll ${info.scrollWidth} > ${info.innerWidth}: ${info.wide?.join(", ")}`);
  if (info.errorBoundary) rec.problems.push(`error text: ${info.errorBoundary}`);
  if (info.dashes?.length) rec.problems.push(`em dash, en dash or spaced hyphen in the copy: ${info.dashes.join(" / ")}`);
  if (info.noAlt?.length) rec.problems.push(`img without alt: ${info.noAlt.join(", ")}`);
  const errs = drain();
  rec.problems.push(...errs);
  for (const l of info.links ?? []) {
    const u = new URL(l);
    if (!/^127\.0\.0\.1$/.test(u.hostname)) continue;
    u.hash = "";
    const key = u.href;
    if (!linkSet.has(key)) linkSet.set(key, { from: `${base}${url}`, ctx: sess.ctx });
  }
  if (rec.problems.length) {
    const file = `${SHOTS}/${rec.app}-${kind}-${(as ? `${as}-` : "")}${url.replace(/[^a-z0-9]+/gi, "_").slice(0, 60) || "home"}.png`;
    await page.screenshot({ path: file, fullPage: false }).catch(() => {});
    rec.screenshot = file;
  }
  R.pages.push(rec);
  console.log(`${rec.problems.length ? "ISSUE" : "ok   "} ${rec.app} ${kind} ${as} ${url} ${rec.problems.join(" | ").slice(0, 400)}`);
  return rec;
}

let failed = false;
try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(SITE);
  await waitFor(`${PORTAL}/login`);
  // The site was built without a database, so ask it to read the seeded data (as the portal does after a save).
  const rv = await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": "harness-revalidate-secret", "content-type": "application/json" }, body: "{}" });
  flow("site", "revalidate route refreshes products, stockists and jobs", rv.status === 200, await rv.text());
  for (const p of ["/", "/our-brands", "/careers"]) { await fetch(`${SITE}${p}`); }
  await sleep(1500);

  // ---------------------------------------------------------------- Website pages
  const newsSlugs = [];
  for (const kind of ["phone", "desktop"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const sess = { ctx, page, drain: watch(page) };
    const pages = ["/", "/about-us", "/our-brands", "/people-and-culture", "/corporate-social-responsibility", "/news", "/careers", "/contact-us",
      "/partner-with-us", "/faqs", "/privacy-policy", "/terms-and-conditions"];
    for (const p of pages) {
      const rec = await checkPage(sess, SITE, p, kind, p);
      if (p === "/news" && !newsSlugs.length) {
        const slugs = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href*='/news/']")].map((a) => new URL(a.href).pathname))]);
        newsSlugs.push(...slugs);
      }
      void rec;
    }
    if (kind === "phone") flow("site", "the News page links to its articles", newsSlugs.length > 0, String(newsSlugs.length));
    for (const s of newsSlugs) await checkPage(sess, SITE, s, kind, s);
    // Old .html bookmarks redirect.
    const r = await page.goto(`${SITE}/about-us.html`);
    if (kind === "desktop") flow("site", "old /about-us.html redirects to /about-us", r?.status() === 200 && page.url().endsWith("/about-us"), page.url());
    // Staff login link.
    await page.goto(`${SITE}/`);
    const staff = await page.evaluate(() => [...document.querySelectorAll("a")].filter((a) => /staff/i.test(a.innerText) || /staff/i.test(a.getAttribute("aria-label") ?? "")).map((a) => ({ t: a.innerText.trim(), h: a.href, vis: a.offsetParent !== null })));
    if (staff[0]) {
      const r2 = await page.goto(staff[0].h);
      flow("site", `${kind}: following the staff login link opens the portal sign in`, r2?.status() === 200 && /\/login/.test(page.url()), `${r2?.status()} ${page.url()}`);
      await page.goto(`${SITE}/`);
    }
    flow("site", `${kind}: staff login link present and points at the portal`, staff.length > 0 && staff.every((s) => s.h.startsWith(PORTAL)), JSON.stringify(staff));
    if (kind === "phone") {
      // Mobile nav opens and has the staff link.
      const menuBtn = page.getByRole("button", { name: /menu/i }).first();
      if (await menuBtn.count()) {
        await menuBtn.click();
        await sleep(400);
        const navText = await page.evaluate(() => document.body.innerText);
        flow("site", "phone: menu opens and lists Contact Us and Staff login", /Contact/i.test(navText) && /Staff/i.test(navText));
        R.notes.push({ phoneMenuStaffVisible: staff });
      } else flow("site", "phone: a menu button exists", false, "no button named menu");
    }
    // Where to Buy: the stockist finder answers.
    const api = await page.request.get(`${SITE}/api/stockists?region=greater-accra`);
    const apiText = await api.text();
    if (kind === "desktop") flow("site", "Where to Buy API /api/stockists answers 200 with demo shops", api.status() === 200 && apiText.includes("Demo"), `${api.status()} ${apiText.slice(0, 200)}`);
    await ctx.close();
  }

  // Where to Buy in the page (desktop and phone).
  for (const kind of ["phone", "desktop"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const drain = watch(page);
    await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
    const finder = page.locator("#stockist-results");
    const btn = page.locator("button[aria-controls='stockist-results']").first();
    if (await btn.count()) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await sleep(2500);
      const txt = (await finder.innerText().catch(() => "")) || "";
      // Greater Accra has three active demo shops; Demo Provisions Madina is inactive and must not show.
      const shown = ["Demo Shop Adabraka", "Demo Pharmacy Osu", "Demo Supermarket Tema"].every((n) => txt.includes(n)) && !txt.includes("Demo Provisions Madina");
      flow("site", `${kind}: Where to Buy on home lists the 3 active Greater Accra demo shops`, shown, txt.slice(0, 300));
      const errs = drain();
      if (errs.length) flow("site", `${kind}: Where to Buy no console errors`, false, errs.join(" | "));
      if (!/Demo/.test(txt)) await page.screenshot({ path: `${SHOTS}/site-${kind}-where-to-buy.png` });
    } else flow("site", `${kind}: Where to Buy finder button found`, false);
    await ctx.close();
  }

  // ---------------------------------------------------------------- Website forms
  const ts = Date.now().toString(36);
  {
    // Contact (general) and Consumer care (complaint) on the phone.
    const ctx = await context("phone");
    const page = await ctx.newPage();
    const drain = watch(page);
    await page.goto(`${SITE}/contact-us`, { waitUntil: "networkidle" });
    const form = page.locator("form#contact-enquiry");
    await form.locator("input[name=name]").fill(`QA Contact ${ts}`);
    await form.locator("input[name=email]").fill(`qa.contact.${ts}@example.com`);
    await form.locator("input[name=phone]").fill("0240000999");
    await form.locator("textarea[name=message]").fill("QA test: where can I buy Yazz in Ho?");
    await form.getByRole("button", { name: "Send message" }).click();
    await form.locator("[role=status] [data-form-message], [role=alert]").first().waitFor({ timeout: 20000 }).catch(() => {});
    const msg = await form.locator("[data-form-message]").first().innerText().catch(() => "");
    flow("site-forms", "phone: contact form (General enquiry) sends and shows a thank you", /ENQ-|thank/i.test(msg), msg);
    // Consumer care -> complaint.
    await page.getByText("Consumer care", { exact: true }).first().click();
    await form.locator("input[name=name]").fill(`QA Complaint ${ts}`);
    await form.locator("input[name=email]").fill(`qa.complaint.${ts}@example.com`);
    await form.locator("input[name=detail]").fill("Yazz pads, batch QA-1");
    await form.locator("textarea[name=message]").fill("QA test: torn pack.");
    await form.getByRole("button", { name: "Send message" }).click();
    await page.waitForFunction(() => /LX-\d{4}-\d{4}/.test(document.querySelector("form#contact-enquiry [data-form-message]")?.textContent ?? "") || document.querySelector("form#contact-enquiry [role=alert]"), null, { timeout: 20000 }).catch(() => {});
    const msg2 = await form.locator("[data-form-message]").first().innerText().catch(() => "");
    flow("site-forms", "phone: Consumer care sends and gives an LX case number", /LX-\d{4}-\d{4}/.test(msg2), msg2);
    const e = drain(); if (e.length) flow("site-forms", "contact page no console errors during sends", false, e.join(" | "));
    await ctx.close();
  }
  {
    // Partner (desktop) and newsletters.
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    const drain = watch(page);
    await page.goto(`${SITE}/partner-with-us`, { waitUntil: "networkidle" });
    const pform = page.locator("form").filter({ has: page.locator("input[name=business_name]") }).first();
    await pform.locator("input[name=contact_name]").fill(`QA Partner ${ts}`);
    await pform.locator("input[name=business_name]").fill(`QA Traders ${ts}`);
    await pform.locator("input[name=email]").fill(`qa.partner.${ts}@example.com`);
    await pform.locator("input[name=phone]").fill("0240000998");
    await pform.locator("input[name=trading_location]").fill("Tamale");
    const ta = pform.locator("textarea[name=message]");
    if (await ta.count()) await ta.fill("QA test: we want to distribute Hooch.");
    await pform.locator("button[type=submit]").click();
    await pform.locator("[data-form-message]").first().waitFor({ timeout: 20000 }).catch(() => {});
    const pm = await pform.locator("[data-form-message]").first().innerText().catch(() => "");
    flow("site-forms", "desktop: partner form sends and shows a reference", /PTN-|thank/i.test(pm), pm);
    // Home newsletter.
    await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
    const nf = page.locator("form[aria-label='Newsletter sign up']");
    await nf.locator("input[name=email]").fill(`qa.news.${ts}@example.com`);
    await nf.locator("input[name=consent]").check();
    await nf.locator("button[type=submit]").click();
    await nf.locator("[data-form-message]").first().waitFor({ timeout: 20000 }).catch(() => {});
    const nm = await nf.locator("[data-form-message]").first().innerText().catch(() => "");
    flow("site-forms", "desktop: home newsletter sign up thanks the visitor with an NWS reference", /NWS-/.test(nm), nm);
    const e = drain(); if (e.length) flow("site-forms", "partner/newsletter no console errors", false, e.join(" | "));
    await ctx.close();
  }
  {
    // News page newsletter on the phone.
    const ctx = await context("phone");
    const page = await ctx.newPage();
    const drain = watch(page);
    await page.goto(`${SITE}/news`, { waitUntil: "networkidle" });
    const nf = page.locator("form[aria-label='Get our stories by email']");
    await nf.locator("input[name=email]").fill(`qa.news2.${ts}@example.com`);
    await nf.locator("input[name=consent]").check();
    await nf.locator("button[type=submit]").click();
    await nf.locator("[data-form-message]").first().waitFor({ timeout: 20000 }).catch(() => {});
    const nm = await nf.locator("[data-form-message]").first().innerText().catch(() => "");
    flow("site-forms", "phone: news page newsletter sign up thanks the visitor with an NWS reference", /NWS-/.test(nm), nm);
    const e = drain(); if (e.length) flow("site-forms", "news newsletter no console errors", false, e.join(" | "));
    await ctx.close();
  }
  for (const kind of ["phone", "desktop"]) {
    // Careers application with a small PDF CV.
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const drain = watch(page);
    await page.goto(`${SITE}/careers`, { waitUntil: "networkidle" });
    // Open roles: expand the first one and press "Apply for this role" (desktop); the phone sends a general application.
    const roleRows = page.locator("button[aria-expanded]", { hasText: /Production Line Supervisor|Quality Assurance Officer/ });
    const nApply = await roleRows.count();
    let picked = "";
    if (kind === "desktop" && nApply) {
      await roleRows.first().click();
      await page.getByRole("link", { name: /apply for this role/i }).first().click();
      await sleep(300);
      picked = await page.locator("form input[name=opening]").first().inputValue().catch(() => "");
      flow("site-forms", "desktop: Apply for this role fills the role on the application form", /^LX-/.test(picked), picked);
    }
    const form = page.locator("form").filter({ has: page.locator("input[name=cv]") }).first();
    await form.locator("input[name=name]").fill(`QA Applicant ${kind} ${ts}`);
    await form.locator("input[name=email]").fill(`qa.apply.${kind}.${ts}@example.com`);
    await form.locator("input[name=phone]").fill("0240000997");
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
    await form.locator("input[name=cv]").setInputFiles({ name: `QA-CV-${kind}.pdf`, mimeType: "application/pdf", buffer: pdf });
    await form.locator("input[name=consent]").check();
    await form.locator("button[type=submit]").click();
    await form.locator("[data-form-message]").first().waitFor({ timeout: 30000 }).catch(() => {});
    const m = await form.locator("[data-form-message]").first().innerText().catch(() => "");
    flow("site-forms", `${kind}: careers application with PDF CV sends (${picked ? `for ${picked}` : nApply ? "general" : "no open roles shown"})`, /LX-APP-|thank/i.test(m), m);
    if (!/LX-APP-|thank/i.test(m)) await page.screenshot({ path: `${SHOTS}/site-${kind}-careers-form.png`, fullPage: false });
    const e = drain(); if (e.length) flow("site-forms", `${kind}: careers no console errors`, false, e.join(" | "));
    await ctx.close();
  }
  // Database side: each reached the right place.
  const dbc = async (sql) => (await q(sql)).trim();
  flow("site-forms", "contact form became a CRM lead (website_contact_form)", (await dbc(`select count(*) from public.crm_leads l join public.crm_contacts c on c.id = l.contact_id where c.full_name = 'QA Contact ${ts}' and l.source = 'website_contact_form'`)) === "1");
  flow("site-forms", "consumer care became a complaint (channel website)", (await dbc(`select count(*) from public.complaints k join public.crm_contacts c on c.id = k.contact_id where c.full_name = 'QA Complaint ${ts}'`)) === "1");
  flow("site-forms", "partner form became a CRM lead (website_partner_form)", (await dbc(`select count(*) from public.crm_leads where source = 'website_partner_form' and submitted_organisation_name = 'QA Traders ${ts}'`)) === "1");
  flow("site-forms", "newsletter sign ups became CRM contacts with consent", (await dbc(`select count(*) from public.crm_contacts where email in ('qa.news.${ts}@example.com','qa.news2.${ts}@example.com') and consent_marketing`)) === "2");
  flow("site-forms", "both applications saved with a CV", (await dbc(`select count(*) from public.job_applications where email like 'qa.apply.%.${ts}@example.com' and cv_path is not null`)) === "2");
  flow("site-forms", "the role application is linked to its opening", (await dbc(`select count(*) from public.job_applications where email = 'qa.apply.desktop.${ts}@example.com' and opening_id is not null`)) === "1");

  // ---------------------------------------------------------------- Live chat: visitor (phone) and staff (desktop)
  {
    const ctx = await context("phone");
    const site = await ctx.newPage();
    const drain = watch(site);
    await site.goto(`${SITE}/our-brands`, { waitUntil: "networkidle" });
    await site.getByRole("button", { name: "Chat with the Lexta team" }).click();
    await site.getByRole("dialog", { name: "Chat with Lexta" }).waitFor();
    const ov = await site.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth);
    flow("chat", "phone: chat panel opens without horizontal scroll", ov);
    await site.getByLabel("Your name").fill(`QA Visitor ${ts}`);
    await site.getByLabel("How can we help?").fill("QA: do you sell Hooch in Tamale?");
    await site.getByRole("button", { name: "Start chat" }).click();
    await site.getByRole("log").getByText("Hooch in Tamale").waitFor({ timeout: 15000 });
    flow("chat", "phone: visitor starts a chat", true);
    const staff = await login("care@demo.test", "desktop");
    await staff.page.goto(`${PORTAL}/systems/chat`);
    await staff.page.getByRole("link", { name: new RegExp(`QA Visitor ${ts}`) }).click();
    await staff.page.waitForURL(/\/systems\/chat\/[0-9a-f-]{36}/);
    await staff.page.getByRole("button", { name: "Assign to me" }).click();
    await staff.page.getByText("Assigned to you.").waitFor();
    await staff.page.getByLabel("Reply to the visitor").fill("Yes, at Demo Mart Kejetia. QA reply.");
    await staff.page.getByRole("button", { name: "Send reply" }).click();
    await staff.page.getByText("Sent.").waitFor({ timeout: 15000 });
    flow("chat", "desktop: staff assigns and replies", true);
    await site.getByRole("log").getByText("QA reply").waitFor({ timeout: 20000 });
    flow("chat", "phone: visitor sees the staff reply", true);
    const e = [...drain(), ...staff.drain()]; if (e.length) flow("chat", "chat no console errors", false, e.join(" | "));
    await staff.ctx.close();
    await ctx.close();
  }

  // ---------------------------------------------------------------- Portal: sign in pages (signed out)
  for (const kind of ["phone", "desktop"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const sess = { ctx, page, drain: watch(page) };
    for (const p of ["/login", "/forgot-password", "/set-password"]) await checkPage(sess, PORTAL, p, kind, p, { as: "signed-out" });
    // Wrong password.
    await page.goto(`${PORTAL}/login`);
    await page.getByLabel("Email").fill("admin@demo.test");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.locator(".alert.error").first().waitFor({ timeout: 10000 }).catch(() => {});
    const alertText = await page.locator(".alert.error").first().innerText().catch(() => "");
    if (!alertText) await page.screenshot({ path: `${SHOTS}/portal-${kind}-wrong-password.png` });
    flow("portal", `${kind}: wrong password shows an error`, alertText.length > 0, alertText);
    sess.drain();
    // Signed out visit to a system goes to login.
    await page.goto(`${PORTAL}/systems/crm`);
    flow("portal", `${kind}: signed out visit to a system goes to sign in`, page.url().includes("/login"), page.url());
  }

  // ---------------------------------------------------------------- Portal: every screen as admin (and distributor, rep)
  const one = async (sql) => (await q(sql)).trim();
  const ids = {
    product: await one(`select id from public.products where slug = 'toothpaste'`),
    csr: await one(`select id from public.csr_activities order by created_at limit 1`),
    visit: await one(`select id from public.field_visits order by visited_at desc limit 1`),
    role: await one(`select id from public.job_openings where reference = 'LX-PRD-114'`),
    distOrder: await one(`select id from public.distributor_orders order by created_at limit 1`),
  };
  const adminPages = ["/", "/systems/dashboard", "/systems/orders", `/systems/orders/${firstOrder}`, "/systems/orders/distributors",
    "/systems/field-sales", "/systems/field-sales/history", "/systems/field-sales/outcomes", `/systems/field-sales/visits/${ids.visit}`,
    "/systems/crm", "/systems/crm/leads", "/systems/crm/leads/00000000-0000-0000-0000-00000000e001", "/systems/crm/leads/new",
    "/systems/crm/contacts", "/systems/crm/contacts/00000000-0000-0000-0000-00000000d001", "/systems/crm/contacts/new",
    "/systems/crm/organisations", "/systems/crm/organisations/00000000-0000-0000-0000-00000000c001", "/systems/crm/organisations/new",
    "/systems/crm/settings/website-leads",
    "/systems/complaints", "/systems/complaints/00000000-0000-0000-0000-00000000f001", "/systems/complaints/new",
    "/systems/products", `/systems/products/${ids.product}`, "/systems/products/new",
    "/systems/stockists", "/systems/stockists/00000000-0000-0000-0000-00000000b001", "/systems/stockists/new", "/systems/stockists/import",
    "/systems/csr", `/systems/csr/${ids.csr}`, "/systems/csr/new", "/systems/csr/programmes",
    "/systems/recruitment", "/systems/recruitment/applications/00000000-0000-0000-0000-00000000aa01", "/systems/recruitment/roles",
    `/systems/recruitment/roles/${ids.role}`, "/systems/recruitment/roles/new",
    "/systems/chat", "/systems/chat/00000000-0000-0000-0000-00000000ab02", "/systems/users"];
  for (const kind of ["phone", "desktop"]) {
    const admin = await login("admin@demo.test", kind);
    for (const p of adminPages) await checkPage(admin, PORTAL, p, kind, p, { as: "admin" });
    const dist = await login("distributor@demo.test", kind);
    for (const p of ["/systems/orders", "/systems/orders/new", "/systems/orders/catalogue", `/systems/orders/${ids.distOrder}`]) await checkPage(dist, PORTAL, p, kind, p, { as: "distributor" });
    const rep = await login("rep@demo.test", kind);
    for (const p of ["/", "/systems/field-sales", "/systems/field-sales/visit", "/systems/orders", "/systems/crm/leads"]) await checkPage(rep, PORTAL, p, kind, p, { as: "sales_rep" });
    const mgr = await login("manager@demo.test", kind);
    for (const p of ["/", "/systems/dashboard"]) await checkPage(mgr, PORTAL, p, kind, p, { as: "management" });
    for (const s of [admin, dist, rep, mgr]) s.ctx.__keep = true;
    // Links found on these pages are checked below with the admin context of this width.
  }

  // ---------------------------------------------------------------- Roles: menu and refusals
  const SYS = { dashboard: ["admin", "management"], orders: ["admin", "management", "sales_rep", "distributor"], "field-sales": ["admin", "management", "sales_rep"],
    crm: ["admin", "management", "sales_rep", "customer_care", "marketing"], complaints: ["admin", "management", "customer_care", "sales_rep", "marketing"],
    products: ["admin", "management", "marketing"], stockists: ["admin", "management", "sales_rep", "marketing", "customer_care"], csr: ["admin", "management", "marketing"],
    recruitment: ["admin", "management", "hr"], chat: ["admin", "management", "customer_care"], users: ["admin"] };
  const roleUsers = { admin: "admin@demo.test", management: "manager@demo.test", sales_rep: "rep@demo.test", customer_care: "care@demo.test",
    marketing: "marketing@demo.test", hr: "hr@demo.test", distributor: "distributor@demo.test" };
  for (const [role, email] of Object.entries(roleUsers)) {
    const s = await login(email, "desktop");
    await s.page.goto(`${PORTAL}/`);
    const nav = await s.page.evaluate(() => [...document.querySelectorAll("aside a")].map((a) => new URL(a.href).pathname));
    const expected = Object.entries(SYS).filter(([, r]) => r.includes(role)).map(([k]) => `/systems/${k}`);
    const navSystems = nav.filter((n) => n.startsWith("/systems/"));
    const menuOk = role === "distributor" ? navSystems.includes("/systems/orders") && navSystems.every((n) => n.startsWith("/systems/orders")) : expected.every((e) => navSystems.includes(e)) && navSystems.every((n) => expected.includes(n));
    const tiles = await s.page.evaluate(() => [...document.querySelectorAll("main a")].map((a) => new URL(a.href).pathname).filter((p) => p.startsWith("/systems/")));
    const tilesOk = role === "distributor" ? true : tiles.every((t) => expected.some((e) => t.startsWith(e)));
    const refused = [];
    for (const [slug, allowed] of Object.entries(SYS)) {
      if (allowed.includes(role)) continue;
      s.drain();
      const resp = await s.page.goto(`${PORTAL}/systems/${slug}`);
      const text = await s.page.locator("main").innerText().catch(() => "");
      const redirected = !new URL(s.page.url()).pathname.startsWith(`/systems/${slug}`);
      const ok = redirected || /does not include|not include|Ask your Lexta administrator|not have access|only for/i.test(text);
      refused.push({ slug, ok, redirected, status: resp?.status(), text: ok ? "" : text.slice(0, 200) });
    }
    const refusedOk = refused.every((x) => x.ok);
    R.roles.push({ role, nav, expected, menuOk, tiles, tilesOk, refused });
    flow("roles", `${role}: menu shows only its systems`, menuOk, JSON.stringify({ nav, expected }));
    flow("roles", `${role}: home tiles match its systems`, tilesOk, JSON.stringify(tiles));
    flow("roles", `${role}: refused on every other system`, refusedOk, JSON.stringify(refused.filter((x) => !x.ok)));
    await s.ctx.close();
  }

  // ---------------------------------------------------------------- One create/edit/save flow per system
  async function fillRequired(page, form) {
    const fields = await form.locator("input[required], select[required], textarea[required]").all();
    for (const f of fields) {
      const tag = await f.evaluate((e) => e.tagName.toLowerCase());
      const type = (await f.getAttribute("type")) ?? "text";
      const val = await f.inputValue().catch(() => "");
      if (tag === "select") {
        if (!val) { const opts = await f.evaluate((e) => [...e.options].map((o) => o.value).filter(Boolean)); if (opts[0]) await f.selectOption(opts[0]); }
        continue;
      }
      if (val) continue;
      if (type === "checkbox" || type === "radio") { await f.check().catch(() => {}); continue; }
      if (type === "hidden" || !(await f.isVisible())) continue;
      if (type === "email") await f.fill(`qa.${ts}@example.com`);
      else if (type === "date") await f.fill(new Date().toISOString().slice(0, 10));
      else if (type === "number") await f.fill("5");
      else if (type === "tel") await f.fill("0240000123");
      else await f.fill(`QA ${ts}`);
    }
  }
  async function createFlow(sess, area, url, { before, formHas = "button[type=submit]", button, success = /created=1|Saved\.|saved|submitted=1/i } = {}) {
    const { page, drain } = sess;
    drain();
    await page.goto(`${PORTAL}${url}`);
    await page.locator("main h1").first().waitFor();
    const form = page.locator("main form").filter({ has: page.locator(formHas) }).first();
    if (before) await before(page, form);
    await fillRequired(page, form);
    const btn = button ? form.getByRole("button", { name: button, exact: true }) : form.locator("button[type=submit]").last();
    const btnText = (await btn.innerText()).trim();
    await btn.click();
    let ok = false; let detail = "";
    for (let i = 0; i < 40; i += 1) {
      await sleep(500);
      const okText = await page.locator("main .alert.ok").first().innerText({ timeout: 200 }).catch(() => "");
      if (success.test(page.url()) || /Saved|created|added|logged/i.test(okText)) { ok = true; detail = okText; break; }
      const alert = await page.locator("main .alert.error, main .ferr").first().innerText({ timeout: 200 }).catch(() => "");
      if (alert) { detail = alert; }
    }
    const stuck = await page.getByRole("button", { name: /Saving\.\.\./ }).count();
    if (!ok) await page.screenshot({ path: `${SHOTS}/flow-${area}.png`, fullPage: true });
    flow("systems", `${area}: create via ${url} ("${btnText}")`, ok && !stuck, `${page.url()} ${detail} ${stuck ? "stuck Saving..." : ""}`);
    R.flows[R.flows.length - 1].detail = `${page.url()} ${detail}`;
    const e = drain(); if (e.length) flow("systems", `${area}: no console errors`, false, e.join(" | "));
    return ok;
  }
  async function saveFlow(sess, area, url, { label = /^Save/ } = {}) {
    const { page, drain } = sess;
    drain();
    await page.goto(`${PORTAL}${url}`);
    await page.locator("main h1").first().waitFor();
    const btn = page.locator("main").getByRole("button", { name: label }).first();
    await btn.click();
    let ok = false; let txt = "";
    for (let i = 0; i < 40; i += 1) {
      await sleep(500);
      txt = await page.locator("main .alert.ok").first().innerText({ timeout: 200 }).catch(() => "");
      if (/Saved|updated/i.test(txt)) { ok = true; break; }
      const err = await page.locator("main .alert.error, main .ferr").first().innerText({ timeout: 200 }).catch(() => "");
      if (err) txt = `error: ${err}`;
    }
    const stuck = await page.getByRole("button", { name: /Saving\.\.\./ }).count();
    if (!ok) await page.screenshot({ path: `${SHOTS}/save-${area}.png`, fullPage: true });
    flow("systems", `${area}: edit and save on ${url}`, ok && !stuck, stuck ? "stuck Saving..." : txt.slice(0, 200));
    const e = drain(); if (e.length) flow("systems", `${area}: save no console errors`, false, e.join(" | "));
  }

  const admin = await login("admin@demo.test", "desktop");
  const rep = await login("rep@demo.test", "desktop");
  const mkt = await login("marketing@demo.test", "desktop");
  const care = await login("care@demo.test", "desktop");
  const hr = await login("hr@demo.test", "desktop");
  const mgr = await login("manager@demo.test", "desktop");

  // Dashboard: loads with figures for management.
  {
    mgr.drain();
    await mgr.page.goto(`${PORTAL}/systems/dashboard`);
    const t = await mgr.page.locator("main").innerText();
    flow("systems", "dashboard: management sees figures", /order/i.test(t) && /complaint/i.test(t), t.slice(0, 200));
  }
  // Orders: distributor places one (phone) and rep confirms it.
  {
    const dist = await login("distributor@demo.test", "phone");
    await dist.page.goto(`${PORTAL}/systems/orders/new`);
    await dist.page.getByRole("button", { name: /^One pack more of / }).first().click();
    await dist.page.getByRole("button", { name: "Review order" }).click();
    await dist.page.getByRole("heading", { name: "Your order" }).waitFor();
    const addr = dist.page.getByLabel("Delivery address");
    if (!(await addr.inputValue())) await addr.fill("QA Warehouse, Kumasi");
    await dist.page.getByRole("button", { name: "Submit order" }).click();
    let ok = true;
    try { await dist.page.getByRole("heading", { level: 1, name: /^LX-ORD-/ }).waitFor({ timeout: 20000 }); } catch { ok = false; }
    const ref = ok ? (await dist.page.locator("main h1").innerText()).trim() : "";
    flow("systems", "orders: distributor submits an order on the phone", ok && await dist.page.getByText("Order submitted").count() > 0, ref);
    const e = dist.drain(); if (e.length) flow("systems", "orders: distributor no console errors", false, e.join(" | "));
    await dist.ctx.close();
    if (ref) {
      const id = await one(`select id from public.distributor_orders where reference = '${ref}'`);
      await rep.page.goto(`${PORTAL}/systems/orders/${id}`);
      await rep.page.getByText("Confirm order", { exact: true }).click().catch(() => {});
      await rep.page.getByRole("button", { name: "Confirm order" }).click();
      let ok2 = true;
      try { await rep.page.locator(".page-head .badge.ostatus", { hasText: "Confirmed" }).waitFor({ timeout: 20000 }); } catch { ok2 = false; }
      if (!ok2) await rep.page.screenshot({ path: `${SHOTS}/flow-orders-confirm.png`, fullPage: true });
      flow("systems", "orders: staff (rep) confirms the order", ok2);
    }
  }
  // Field sales on the phone: visit saved.
  {
    const rp = await login("rep@demo.test", "phone");
    await rp.page.goto(`${PORTAL}/systems/field-sales`);
    await rp.page.getByRole("link", { name: "Start visit" }).click();
    await rp.page.getByText("Location captured").waitFor({ timeout: 20000 });
    await rp.page.locator(".fs-shop", { hasText: "Demo Shop Adabraka" }).click();
    await rp.page.getByRole("heading", { name: "Demo Shop Adabraka" }).waitFor();
    await rp.page.getByText("Order taken", { exact: true }).click();
    await rp.page.getByLabel("Notes (optional)").fill("QA visit");
    await rp.page.getByRole("button", { name: "Save visit" }).click();
    let ok = true;
    try { await rp.page.getByRole("heading", { name: "Visit saved" }).waitFor({ timeout: 30000 }); } catch { ok = false; await rp.page.screenshot({ path: `${SHOTS}/flow-field.png`, fullPage: true }); }
    flow("systems", "field sales: rep saves a shop visit on the phone", ok);
    const e = rp.drain(); if (e.length) flow("systems", "field sales: no console errors", false, e.join(" | "));
    await rp.ctx.close();
  }
  // CRM.
  await createFlow(rep, "crm-contact", "/systems/crm/contacts/new", { formHas: "#full_name", button: "Add contact",
    before: async (page, form) => { await form.locator("#full_name").fill(`QA Contact Portal ${ts}`); await form.locator("#phone").fill("0240000555"); } });
  await createFlow(rep, "crm-lead", "/systems/crm/leads/new", { formHas: "#title", button: "Add lead",
    before: async (page, form) => {
      await form.locator("#title").fill(`QA Lead ${ts}`);
      const opts = await form.locator("#contact_id option").evaluateAll((os) => os.map((o) => o.value).filter((v) => v && v !== "keep"));
      await form.locator("#contact_id").selectOption(opts[0]);
      await form.locator("#source").selectOption("phone");
    } });
  await saveFlow(rep, "crm-lead", "/systems/crm/leads/00000000-0000-0000-0000-00000000e001");
  await saveFlow(admin, "crm-website-lead-managers", "/systems/crm/settings/website-leads");
  // Complaints.
  await createFlow(care, "complaints", "/systems/complaints/new", { formHas: "#description",
    before: async (page, form) => {
      await form.locator("#contact_name").fill(`QA Caller ${ts}`);
      await form.locator("#contact_phone").fill("0240000556");
      const cat = await form.locator("#category option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
      await form.locator("#category").selectOption(cat[0]);
      const br = await form.locator("#brand_id option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
      await form.locator("#brand_id").selectOption(br[0]);
      await form.locator("#description").fill("QA: caller found a torn pack.");
    } });
  // Products: edit and save.
  await saveFlow(mkt, "products", `/systems/products/${ids.product}`);
  // Stockists.
  await createFlow(mkt, "stockists", "/systems/stockists/new", { formHas: "#region_id",
    before: async (page, form) => { await form.locator("#region_id").selectOption({ label: "Greater Accra" }).catch(async () => {
      const v = await form.locator("#region_id option").evaluateAll((os) => os.filter((o) => /Greater Accra/.test(o.textContent)).map((o) => o.value)); await form.locator("#region_id").selectOption(v[0]); });
      await form.locator("input[name=brand_ids]:not([disabled])").first().check(); } });
  // CSR.
  await createFlow(mkt, "csr", "/systems/csr/new", { formHas: "#programme_id",
    before: async (page, form) => {
      const pick = async (sel) => { const v = await form.locator(`${sel} option`).evaluateAll((os) => os.map((o) => o.value).filter(Boolean)); if (v[0]) await form.locator(sel).selectOption(v[0]); };
      await pick("#programme_id");
      await form.locator("#activity_date").fill(new Date(Date.now() - 86400000).toISOString().slice(0, 10));
      await form.locator("input[name=status]").first().check().catch(() => {});
      await pick("#region_id");
      await form.locator("#place").fill("QA Demo School, Ho");
      await form.locator("#people_reached").fill("120");
    } });
  // Recruitment: new role, then move an application on.
  await createFlow(hr, "recruitment-role", "/systems/recruitment/roles/new", { formHas: "#reference",
    before: async (page, form) => {
      await form.locator("#reference").fill("LX-QAT-901");
      await form.locator("#title").fill(`QA Role ${ts}`);
      await form.locator("#department").fill("Quality");
      await form.locator("#location").fill("Accra");
      await form.locator("#level").fill("Mid level");
      await form.locator("#summary").fill("QA test role.");
    } });
  // The uploaded CV opens for HR.
  {
    const appId = (await q(`select id from public.job_applications where email = 'qa.apply.desktop.${ts}@example.com'`)).trim();
    if (appId) {
      const r = await hr.ctx.request.get(`${PORTAL}/systems/recruitment/applications/${appId}/cv`);
      flow("site-forms", "HR can download the CV uploaded from the Careers page", r.status() === 200 && (r.headers()["content-type"] ?? "").includes("pdf"), `${r.status()} ${r.headers()["content-type"]}`);
    } else flow("site-forms", "HR can download the CV uploaded from the Careers page", false, "no application");
  }
  // Edit once, site updates: a stockist saved in the portal shows on Where to Buy.
  {
    const r = await fetch(`${SITE}/api/stockists?region=greater-accra`);
    const t = await r.text();
    flow("site", "Where to Buy lists the stockist added in the portal (QA)", r.status === 200 && t.includes(`QA ${ts}`), `${r.status} ${t.slice(0, 200)}`);
  }
  {
    hr.drain();
    await hr.page.goto(`${PORTAL}/systems/recruitment`);
    const t = await hr.page.locator("main").innerText();
    flow("site-forms", "careers applications reach the Recruitment list", t.includes(`QA Applicant desktop ${ts}`) && t.includes(`QA Applicant phone ${ts}`), t.slice(0, 300));
  }
  // Website leads reach CRM leads list; complaint reaches complaints list; newsletter reaches contacts.
  {
    await admin.page.goto(`${PORTAL}/systems/crm/leads`);
    let t = await admin.page.locator("main").innerText();
    flow("site-forms", "contact form lead appears in the CRM leads list", t.includes(`QA Contact ${ts}`), t.slice(0, 400));
    flow("site-forms", "partner form lead appears in the CRM leads list", t.includes(`QA Traders ${ts}`), t.slice(0, 400));
    await admin.page.goto(`${PORTAL}/systems/complaints`);
    t = await admin.page.locator("main").innerText();
    flow("site-forms", "consumer care complaint reaches the Complaints list", t.includes(`QA Complaint ${ts}`), t.slice(0, 300));
    await admin.page.goto(`${PORTAL}/systems/crm/contacts`);
    t = await admin.page.locator("main").innerText();
    flow("site-forms", "newsletter sign up reaches the CRM contacts list", t.includes(`qa.news.${ts}@example.com`) && t.includes(`qa.news2.${ts}@example.com`), t.slice(0, 300));
    await admin.page.goto(`${PORTAL}/systems/chat?status=all`);
    t = await admin.page.locator("main").innerText();
    flow("site-forms", "website chat reaches the Live chat inbox", t.includes(`QA Visitor ${ts}`));
  }
  // Users placeholder.
  {
    await admin.page.goto(`${PORTAL}/systems/users`);
    const t = await admin.page.locator("main").innerText();
    flow("systems", "users and access: placeholder shows for admin", /Users and access/.test(t), t.slice(0, 200));
  }

  // ---------------------------------------------------------------- Internal links
  const anon = await pw.request.newContext();
  for (const [url, { from, ctx }] of linkSet) {
    // The demo seed's applications point at CV files that were never uploaded; the uploaded one is checked above.
    if (/\/applications\/00000000-0000-0000-0000-00000000aa0\d\/cv$/.test(url)) continue;
    let status = 0;
    try {
      const r = await (from.startsWith(SITE) ? anon : ctx.request).get(url, { maxRedirects: 0, timeout: 30000 });
      status = r.status();
    } catch { status = -1; }
    R.links.push({ url, from, status });
    if (status >= 400 || status < 0) console.log(`BROKEN LINK ${status} ${url} (from ${from})`);
  }
  console.log(`checked ${linkSet.size} internal links`);
} catch (e) {
  failed = true;
  console.error(e);
  R.fatal = String(e.stack ?? e);
} finally {
  writeFileSync(RESULTS, JSON.stringify(R, null, 1));
  await browser.close().catch(() => {});
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
}
const bad = R.pages.filter((p) => p.problems.length).length + R.flows.filter((f) => !f.ok).length + R.links.filter((l) => l.status >= 400 || l.status < 0).length;
console.log(`pages ${R.pages.length}, flows ${R.flows.length}, links ${R.links.length}, issues ${bad}. Results: ${RESULTS}`);
process.exit(failed || bad ? 1 : 0);
