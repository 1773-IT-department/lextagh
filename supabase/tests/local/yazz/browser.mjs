// The Yazz brand site in a browser (390 and 1440 px), against the throwaway harness database only, through
// ../browser/gateway.mjs. Never pointed at the real project or a real domain. Seeds the fictional demo data of
// ../browser/demo-seed.mjs (Yazz, Linzzy and Hooch stockists), starts the gateway and the site's production build, then:
//   - every page and an article: HTTP 200, a heading, no console errors or failed requests (outside hosts are blocked:
//     images get a grey tile, the rest is aborted), no horizontal scroll, images with alt text; a screenshot of each
//   - Yazz data only: the products are the published Yazz products, the stockists the active Yazz stockists
//   - the Products dropdown by keyboard, a product window (open, Escape, focus back)
//   - the consumer form (question and product problem), the trade enquiry and the newsletter, with JavaScript and
//     without it, each landing a Yazz lead, complaint or contact
//   - the live chat widget opens and starts a conversation tagged yazz
// Build the site for the harness first (see run.sh). Screenshots go to YAZZ_SCREENSHOTS (default: a yazz-screens folder
// in the temp directory). Every server it starts is stopped at the end.
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
const OUT = process.env.YAZZ_SCREENSHOTS || path.join(os.tmpdir(), "yazz-screens");
mkdirSync(OUT, { recursive: true });

const { q } = await import("../browser/demo-seed.mjs");
// A stockist whose name is HTML: it must show as text everywhere (list, map tooltip), never run.
const EVIL = `Evil <img src=x onerror="window.__xss=1"> Shop`;
await q(`insert into public.stockists (id, name, outlet_type, region_id, town, latitude, longitude, is_active) values
  ('00000000-0000-0000-0000-0000000e0001', '${EVIL.replace(/'/g, "''")}', 'general_trade', (select id from public.regions where slug = 'central'), 'Cape Coast', 5.105, -1.247, true)`);
await q(`insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-0000000e0001', (select id from public.brands where slug = 'yazz'))`);
const CHAT_SECRET = "harness-chat-secret-yazz-browser-0123456789";
await q(`insert into private.chat_intake_secret (secret) values ('${CHAT_SECRET}') on conflict do nothing`).catch(async () => {
  await q(`delete from private.chat_intake_secret`);
  await q(`insert into private.chat_intake_secret (secret) values ('${CHAT_SECRET}')`);
});

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
const REVALIDATE_SECRET = "harness-revalidate-secret-yazz";
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  CHAT_INTAKE_SECRET: CHAT_SECRET, REVALIDATE_SECRET };
run(`${ROOT}/apps/yazz/node_modules/.bin/next`, ["start", "-p", "3102", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/yazz`, env });
const SITE = "http://127.0.0.1:3102";

const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const VIEW = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1440, height: 900 } } };
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost"] });
async function context(kind, extra = {}) {
  const ctx = await browser.newContext({ ...VIEW[kind], extraHTTPHeaders: { "x-real-ip": "127.0.0.21" }, ...extra });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => (r.request().resourceType() === "image"
    ? r.fulfill({ status: 200, contentType: "image/svg+xml", body: GREY }) : r.abort()));
  return ctx;
}
function watch(page) {
  let buf = [];
  page.on("console", (m) => { if (m.type() === "error" && /127\.0\.0\.1/.test(m.location()?.url ?? "") && !/ERR_FAILED|ERR_NAME_NOT_RESOLVED/.test(m.text())) buf.push(`console: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => buf.push(`pageerror: ${String(e.message).slice(0, 200)}`));
  page.on("response", (r) => { if (/^https?:\/\/127\.0\.0\.1/.test(r.url()) && r.status() >= 400) buf.push(`http ${r.status()}: ${r.url()}`); });
  return () => { const out = buf; buf = []; return out; };
}

const PAGES = [
  ["home", "/"], ["products", "/products"], ["range-feminine-care", "/products/feminine-care"], ["range-oral-care", "/products/oral-care"],
  ["range-home-tissue", "/products/home-tissue"], ["range-baby-care", "/products/baby-care"], ["range-home-care", "/products/home-care"],
  ["about", "/about"], ["tips", "/tips"], ["tips-just-4-parents", "/tips?category=just-4-parents"], ["article", "/tips/understanding-your-first-period"],
  ["contact", "/contact"],
];

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${SITE}/api/health`);

  // The build ran without the database (its pages hold the fallback catalogue): refresh them the way the portal does
  // after a product or stockist save, through /api/revalidate with the shared secret.
  {
    const denied = await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": "wrong" } });
    const r = await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": REVALIDATE_SECRET, "content-type": "application/json" }, body: JSON.stringify({ tags: ["products", "stockists"] }) });
    const body = await r.json();
    check(denied.status === 401 && r.status === 200 && body.revalidated?.paths?.includes("/products/baby-care"), "revalidate: refused without the secret, refreshes the product pages with it", body);
    for (const [, url] of PAGES) { await fetch(`${SITE}${url}`); }
    await sleep(1500);
    for (const [, url] of PAGES) { await fetch(`${SITE}${url}`); }
  }

  // Every page at both widths --------------------------------------------------------------------------------
  for (const kind of ["desktop", "phone"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const drain = watch(page);
    for (const [name, url] of PAGES) {
      drain();
      const resp = await page.goto(`${SITE}${url}`, { waitUntil: "load" });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
      await sleep(500);
      const info = await page.evaluate(() => ({
        sw: document.scrollingElement.scrollWidth, w: innerWidth, h1: document.querySelector("h1")?.textContent ?? "", h1s: document.querySelectorAll("h1").length,
        noAlt: [...document.querySelectorAll("img:not([alt])")].length, main: !!document.querySelector("main#main"),
        dashes: (document.body.innerText.match(/.{0,20}(?:[–—]| - ).{0,20}/g) ?? []).slice(0, 3),
      }));
      const problems = drain();
      check(resp?.status() === 200 && info.h1 && info.h1s === 1 && info.main && info.noAlt === 0 && info.sw <= info.w && problems.length === 0 && info.dashes.length === 0,
        `${kind} ${url}: 200, one h1, main landmark, alt text, no sideways scroll, no errors, no dashes`, { status: resp?.status(), ...info, problems });
      await page.screenshot({ path: path.join(OUT, `${name}-${kind === "phone" ? 390 : 1440}.png`), fullPage: true });
    }
    // The product window, as a screenshot too.
    await page.goto(`${SITE}/products/oral-care#product-toothbrushes`);
    await sleep(600);
    await page.screenshot({ path: path.join(OUT, `product-window-${kind === "phone" ? 390 : 1440}.png`) });
    await ctx.close();
  }

  // Yazz data only -------------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/products`);
    const text = await page.locator("main").innerText();
    const yazz = (await q(`select string_agg(p.name, '|') from public.products p join public.brands b on b.id = p.brand_id where b.slug = 'yazz' and p.is_published`)).split("|");
    const other = (await q(`select string_agg(p.name, '|') from public.products p join public.brands b on b.id = p.brand_id where b.slug in ('linzzy', 'hooch') and p.is_published`)).split("|");
    const cards = await page.locator("main article h3").allInnerTexts();
    check(yazz.every((n) => cards.includes(n)) && cards.length === yazz.length, `products page: one card for each of the ${yazz.length} Yazz products`, cards);
    check(!other.some((n) => cards.includes(n) && !yazz.includes(n)) && !/corn flakes/i.test(text), "products page: no Linzzy or Hooch product", other);

    await page.goto(`${SITE}/contact`);
    await page.locator("#where-to-buy li h3").first().waitFor({ timeout: 15000 });
    const shops = await page.locator("#where-to-buy li h3").allInnerTexts();
    check(shops.includes("Demo Shop Adabraka") && shops.includes("Demo Pharmacy Osu") && shops.includes("Demo Supermarket Tema"), "where to buy: the active Yazz stockists are listed", shops);
    check(!shops.includes("Demo Mart Kejetia") && !shops.includes("Demo Chemist Ho") && !shops.includes("Demo Provisions Madina"), "where to buy: no Hooch or Linzzy only shop, no closed shop", shops);
    const pins = await page.locator(".leaflet-marker-icon").count();
    check(pins >= 4, `where to buy: the Leaflet map shows the shops with a position and the head office (${pins} pins)`);
    await page.locator("#wtb-region").selectOption("ashanti").catch(async () => { await page.locator("#wtb-region").evaluate((s) => { s.value = "ashanti"; s.dispatchEvent(new Event("change", { bubbles: true })); }); });
    await page.getByText(/We are adding Yazz stockists in Ashanti/).waitFor({ timeout: 10000 }).then(() => check(true, "where to buy: Ashanti (only a Hooch shop) shows the friendly empty message"), (e) => check(false, "where to buy: Ashanti empty message", e.message));
    const remembered = await page.evaluate(() => localStorage.getItem("yazz-region"));
    check(remembered === "ashanti", "where to buy: the chosen region is remembered for the product pages' Where to buy links", remembered);
    await page.goto(`${SITE}/contact?product=toothpaste#where-to-buy`);
    await page.getByText(/We are adding Yazz stockists in Ashanti/).waitFor({ timeout: 10000 }).then(() => check(true, "where to buy: a product's Where to buy link arrives with the remembered region preselected"), (e) => check(false, "where to buy: remembered region", e.message));
    check(await page.getByText("Looking for Toothpaste?").count() === 1, "where to buy: the product is named");
    await ctx.close();

    const nojs = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const p2 = await nojs.newPage();
    await p2.goto(`${SITE}/contact#where-to-buy`);
    await p2.locator("#wtb-region").selectOption("greater-accra");
    await Promise.all([p2.waitForURL(/region=greater-accra/), p2.getByRole("button", { name: "Find stockists" }).click()]);
    const listed = await p2.locator("#where-to-buy li h3").allInnerTexts();
    check(listed.length === 3 && listed.includes("Demo Shop Adabraka") && !listed.includes("Demo Provisions Madina"),
      "where to buy without JavaScript: submitting the region form lists that region's Yazz stockists", { url: p2.url(), listed });
    await nojs.close();
  }

  // Keyboard: the Products dropdown and a product window ------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/`);
    const caret = page.getByRole("button", { name: "Products menu" });
    await caret.focus();
    await page.keyboard.press("Enter");
    check(await caret.getAttribute("aria-expanded") === "true", "dropdown: Enter on the Products button opens the list");
    await page.keyboard.press("ArrowDown");
    check(await page.evaluate(() => document.activeElement?.textContent?.trim()) === "All Products", "dropdown: Arrow Down moves to the first item");
    await page.keyboard.press("ArrowDown");
    check(/Feminine Care/.test(await page.evaluate(() => document.activeElement?.textContent ?? "")), "dropdown: Arrow Down moves to the next item");
    await page.keyboard.press("Escape");
    const panel = page.locator(`#${await caret.getAttribute("aria-controls")}`);
    await sleep(250);
    check(await caret.getAttribute("aria-expanded") === "false" && await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Products menu"
      && !(await panel.isVisible()), "dropdown: Escape closes it (the list is hidden although focus is still inside) and focus returns to the button");
    await page.getByRole("link", { name: "Products", exact: true }).hover();
    await sleep(250);
    const hoverOpen = await panel.isVisible();
    await caret.focus();
    await page.keyboard.press("Escape");
    await sleep(250);
    check(hoverOpen && !(await panel.isVisible()), "dropdown: hover opens it, and Escape closes it even while the pointer stays on it");

    // The carousel: one h1 outside the slides, and a pause button.
    await page.goto(`${SITE}/`);
    const pause = page.getByRole("button", { name: "Pause the slideshow" });
    await pause.click();
    check(await page.getByRole("button", { name: "Play the slideshow" }).count() === 1, "carousel: the pause button stops it and offers play");

    // The map: a stockist named with HTML shows as text.
    await page.goto(`${SITE}/contact`);
    await page.locator(".leaflet-marker-icon").first().waitFor({ timeout: 15000 });
    const evilPin = page.locator(`.leaflet-marker-icon[title="${EVIL.replace(/"/g, '\\"')}"]`);
    await evilPin.hover();
    await sleep(500);
    const tip = await page.locator(".leaflet-tooltip").last().textContent().catch(() => "");
    check(await page.evaluate(() => window.__xss) === undefined && tip === EVIL && await page.getByText(EVIL, { exact: true }).count() >= 1,
      "map: a stockist name with HTML shows as text in the list and the pin tooltip, and never runs", { tip });

    await page.goto(`${SITE}/products/oral-care`);
    const opener = page.locator("main article").filter({ hasText: "Toothbrushes" }).getByRole("link", { name: /View details/ });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Toothbrushes" });
    await dialog.waitFor({ state: "visible" });
    check(await dialog.isVisible() && await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Close product details", "product window: opens on View details, focus on Close");
    check(await dialog.getByRole("link", { name: /Where to buy/ }).getAttribute("href") === "/contact?product=toothbrushes#where-to-buy"
      && await dialog.getByRole("link", { name: /Ask about this product/ }).getAttribute("href") === "/contact?topic=question&product=toothbrushes#message",
      "product window: Where to buy and Ask about this product, no cart or price");
    await page.keyboard.press("Escape");
    await sleep(200);
    check(!(await dialog.isVisible()) && /View details/.test(await page.evaluate(() => document.activeElement?.textContent ?? "")), "product window: Escape closes it and focus returns to its link");
    check(!/add to cart|GH₵|checkout/i.test(await page.locator("body").innerText()), "range page: no cart, checkout or prices");
    await page.goto(`${SITE}/products/oral-care#product-toothbrushes`);
    await page.getByRole("dialog", { name: "Toothbrushes" }).waitFor({ state: "visible" });
    await sleep(200);
    await page.keyboard.press("Escape");
    await sleep(300);
    check(await page.evaluate(() => document.activeElement?.textContent?.trim()) === "View details" && await page.evaluate(() => document.activeElement?.getAttribute("href")) === "#product-toothbrushes",
      "product window opened from an address: Escape returns focus to that product's View details");
    await ctx.close();
  }

  // Phone menu: a link that keeps the same path (a query) still closes the menu.
  {
    const ctx = await context("phone");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/tips`);
    await page.getByLabel("Menu", { exact: true }).click();
    const sheet = page.getByRole("navigation", { name: "Mobile" });
    await sheet.getByRole("link", { name: /Just 4 Parents/ }).click();
    await page.waitForURL(/category=just-4-parents/);
    await sleep(300);
    check(!(await sheet.isVisible()), "phone menu: closes after a link to the same page with another category");
    await ctx.close();
  }

  // Forms with JavaScript ---------------------------------------------------------------------------------------
  const stamp = Date.now().toString(36);
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/contact?topic=question&product=toothpaste#message`);
    const form = page.locator("#message form");
    check(await form.locator("input[name=topic][value=question]").isChecked() && await page.locator("#c-product").inputValue() === "toothpaste", "consumer form: Ask about this product arrives with the topic and product chosen");
    await page.fill("#c-name", "Ama JS");
    await page.fill("#c-email", `ama.js.${stamp}@example.com`);
    await page.fill("#c-message", "Is the toothpaste safe for children?");
    await form.getByRole("button", { name: /Send Message/ }).click();
    const ok = form.locator("[data-form-message]");
    await ok.waitFor({ timeout: 15000 });
    const ref = /ENQ-[0-9A-F]{10}/.exec(await ok.innerText())?.[0];
    const row = ref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${ref}'`) : "";
    check(row === "website_contact_form|yazz", "consumer form (JS): a Yazz lead from the website contact form", { ref, row });

    await page.reload();
    await form.locator("label").filter({ hasText: "Report a problem with a product" }).click();
    check(await page.locator("#c-batch").isVisible(), "consumer form: the batch, place and date fields show for a product problem");
    await page.fill("#c-name", "Kofi JS");
    await page.fill("#c-phone", "+233 20 555 0101");
    await page.locator("#c-product").evaluate((s) => { s.value = "baby-wipes"; s.dispatchEvent(new Event("change", { bubbles: true })); });
    await page.fill("#c-batch", "BW-77");
    await page.fill("#c-date", "2026-10-20");
    await page.fill("#c-message", "The pack was dry when opened.");
    await form.getByRole("button", { name: /Send Message/ }).click();
    await ok.waitFor({ timeout: 15000 });
    const caseNo = /LX-\d{4}-\d{4,}/.exec(await ok.innerText())?.[0];
    const crow = caseNo ? await q(`select b.slug || '|' || coalesce(p.slug, '') || '|' || coalesce(c.batch_number, '') from public.complaints c join public.brands b on b.id = c.brand_id left join public.products p on p.id = c.product_id where c.case_number = '${caseNo}'`) : "";
    check(crow === "yazz|baby-wipes|BW-77", "consumer form (JS): a product problem becomes a Yazz complaint with product and batch", { caseNo, crow });

    const trade = page.locator("#trade form");
    await page.fill("#t-name", "Yaw JS");
    await page.fill("#t-business", `JS Traders ${stamp}`);
    await page.fill("#t-email", `yaw.js.${stamp}@example.com`);
    await trade.locator("label").filter({ hasText: "Baby Care" }).click();
    await trade.getByRole("button", { name: /Send Trade Enquiry/ }).click();
    const tok = trade.locator("[data-form-message]");
    await tok.waitFor({ timeout: 15000 });
    const tref = /PTN-[0-9A-F]{10}/.exec(await tok.innerText())?.[0];
    const trow = tref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${tref}'`) : "";
    check(trow === "website_partner_form|yazz", "trade enquiry (JS): a Yazz lead from the website partner form", { tref, trow });

    await page.goto(`${SITE}/tips`);
    const sub = page.locator("form").filter({ has: page.getByLabel("Your email address") });
    await sub.getByLabel("Your email address").fill(`news.js.${stamp}@example.com`);
    await sub.locator("input[name=consent]").check();
    await sub.getByRole("button", { name: /Subscribe/ }).click();
    await sub.locator("[data-form-message]").waitFor({ timeout: 15000 });
    const nrow = await q(`select consent_marketing || '|' || coalesce(consent_source, '') from public.crm_contacts where email = 'news.js.${stamp}@example.com'`);
    check(nrow === "true|Website newsletter (Yazz)", "newsletter (JS): a CRM contact with consent from the Yazz site", nrow);
    await ctx.close();
  }

  // Forms without JavaScript ------------------------------------------------------------------------------------
  {
    const ctx = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${SITE}/contact#message`);
    await page.fill("#c-name", "Esi NoJS");
    await page.fill("#c-email", `esi.nojs.${stamp}@example.com`);
    await page.fill("#c-message", "Where can I buy Mama Yazz in Ho?");
    await Promise.all([page.waitForLoadState("load"), page.locator("#message form").getByRole("button", { name: /Send Message/ }).click()]);
    await sleep(500);
    const text = await page.locator("body").innerText();
    const ref = /ENQ-[0-9A-F]{10}/.exec(text)?.[0];
    const row = ref ? await q(`select b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${ref}'`) : "";
    check(row === "yazz", "consumer form without JavaScript: posts, shows the reference and lands a Yazz lead", { ref, row });

    await page.goto(`${SITE}/contact#trade`);
    await page.fill("#t-name", "Kwame NoJS");
    await page.fill("#t-business", `NoJS Stores ${stamp}`);
    await page.fill("#t-phone", "0244111222");
    await Promise.all([page.waitForLoadState("load"), page.locator("#trade form").getByRole("button", { name: /Send Trade Enquiry/ }).click()]);
    await sleep(500);
    const tref = /PTN-[0-9A-F]{10}/.exec(await page.locator("body").innerText())?.[0];
    const trow = tref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${tref}'`) : "";
    check(trow === "website_partner_form|yazz", "trade enquiry without JavaScript: posts and lands a Yazz partner lead", { tref, trow });

    await page.goto(`${SITE}/contact#message`);
    await page.fill("#c-name", "");
    await Promise.all([page.waitForLoadState("load"), page.locator("#message form").getByRole("button", { name: /Send Message/ }).click()]);
    check(/Please enter your name/.test(await page.locator("body").innerText()), "consumer form without JavaScript: errors come back next to the fields");
    await ctx.close();
  }

  // Live chat ---------------------------------------------------------------------------------------------------
  for (const kind of ["desktop", "phone"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    await page.goto(`${SITE}/products/baby-care`);
    await page.getByRole("button", { name: "Chat with the Yazz care team" }).click();
    const panel = page.getByRole("dialog", { name: "Chat with Yazz" });
    await panel.waitFor();
    await panel.getByLabel("Your name").fill(`Chat ${kind}`);
    await panel.getByLabel("How can we help?").fill("Which diaper size for 7kg?");
    await panel.getByRole("button", { name: "Start chat" }).click();
    await panel.getByRole("log").waitFor({ timeout: 15000 });
    await sleep(300);
    const row = await q(`select b.slug || '|' || coalesce(c.start_page, '') from public.chat_conversations c join public.brands b on b.id = c.brand_id where c.visitor_name = 'Chat ${kind}'`);
    check(row === "yazz|/products/baby-care", `live chat (${kind}): the widget opens and the conversation is tagged yazz`, row);
    await page.screenshot({ path: path.join(OUT, `chat-${kind === "phone" ? 390 : 1440}.png`) });
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
if (failures) { console.log(`${failures} Yazz browser checks failed`); process.exit(1); }
console.log("All Yazz browser checks passed");
