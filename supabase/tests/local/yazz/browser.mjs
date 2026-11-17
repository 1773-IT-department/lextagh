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
//   - the Drive requests of 17 November 2026 (Y1 to Y10): range tips buttons and CSR strips, the ten Tips Just 4 You
//     cards, My Period & Me, the category intros and closings, links inside articles, the Products sub-menu (desktop and
//     phone), What's Inside My Yazz® (layers open on tap, also without JavaScript), no reviewer yet, no empty Parenting
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
  ["about", "/about"], ["faqs", "/faqs"], ["tips", "/tips"], ["tips-just-4-you", "/tips?category=just-4-you"], ["tips-just-4-parents", "/tips?category=just-4-parents"],
  ["article", "/tips/understanding-your-first-period"], ["article-links", "/tips/personal-hygiene-during-puberty"],
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
    // Plus Lexta's coming soon items from content/catalogue.ts, which show even without a database row. Since 0021 no
    // live product sells pocket tissues (the prototype "Tissue" row is archived), so pocket tissue is coming soon too.
    const soon = ["Yazz dental floss", "Yazz pocket tissue"].filter((n) => !yazz.includes(n));
    const pocket = page.locator("main article").filter({ hasText: "Yazz pocket tissue" });
    check(await pocket.getByText("Coming soon", { exact: true }).count() === 1, "products page: pocket tissue, which no live product sells, has a Coming soon badge", cards);
    check(yazz.every((n) => cards.includes(n)) && soon.every((n) => cards.includes(n)) && cards.length === yazz.length + soon.length,
      `products page: one card for each of the ${yazz.length} Yazz products and the ${soon.length} coming soon items`, cards);
    const floss = page.locator("main article").filter({ hasText: "Yazz dental floss" });
    check(await floss.getByText("Coming soon", { exact: true }).count() === 1 && await floss.getByRole("link", { name: /Where to buy/ }).count() === 0,
      "products page: Dental Floss has a Coming soon badge and no Where to buy link");
    check(!other.some((n) => cards.includes(n) && !yazz.includes(n)) && !/corn flakes/i.test(text), "products page: no Linzzy or Hooch product", other);

    await page.goto(`${SITE}/contact`);
    await page.locator("#where-to-buy li h3").first().waitFor({ timeout: 15000 });
    const shops = await page.locator("#where-to-buy li h3").allInnerTexts();
    check(shops.includes("Demo Shop Adabraka") && shops.includes("Demo Pharmacy Osu") && shops.includes("Demo Supermarket Tema"), "where to buy: the active Yazz stockists are listed", shops);
    check(!shops.includes("Demo Mart Kejetia") && !shops.includes("Demo Chemist Ho") && !shops.includes("Demo Provisions Madina"), "where to buy: no Hooch or Linzzy only shop, no closed shop", shops);
    const pins = await page.locator(".leaflet-marker-icon").count();
    check(pins >= 4, `where to buy: the Leaflet map shows the shops with a position and the head office (${pins} pins)`);
    // Volta: only a non Yazz demo shop and none of the 16 original Yazz shops from migration 0018 (those are in Greater
    // Accra, Ashanti, Central, Eastern, Northern and Upper West).
    await page.locator("#wtb-region").selectOption("volta").catch(async () => { await page.locator("#wtb-region").evaluate((s) => { s.value = "volta"; s.dispatchEvent(new Event("change", { bubbles: true })); }); });
    await page.getByText(/We are adding Yazz stockists in Volta/).waitFor({ timeout: 10000 }).then(() => check(true, "where to buy: Volta (no Yazz shop) shows the friendly empty message"), (e) => check(false, "where to buy: Volta empty message", e.message));
    const remembered = await page.evaluate(() => localStorage.getItem("yazz-region"));
    check(remembered === "volta", "where to buy: the chosen region is remembered for the product pages' Where to buy links", remembered);
    await page.goto(`${SITE}/contact?product=toothpaste-herbal#where-to-buy`);
    await page.getByText(/We are adding Yazz stockists in Volta/).waitFor({ timeout: 10000 }).then(() => check(true, "where to buy: a product's Where to buy link arrives with the remembered region preselected"), (e) => check(false, "where to buy: remembered region", e.message));
    check(await page.getByText(/Looking for Yazz Herbal toothpaste\?/i).count() === 1, "where to buy: the product is named");
    await ctx.close();

    const nojs = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const p2 = await nojs.newPage();
    await p2.goto(`${SITE}/contact#where-to-buy`);
    await p2.locator("#wtb-region").selectOption("greater-accra");
    await Promise.all([p2.waitForURL(/region=greater-accra/), p2.getByRole("button", { name: "Find stockists" }).click()]);
    const listed = await p2.locator("#where-to-buy li h3").allInnerTexts();
    // 3 active demo Yazz shops plus the 8 original Greater Accra Yazz shops from migration 0018.
    check(listed.length === 11 && listed.includes("Demo Shop Adabraka") && listed.includes("Shoprite Accra Mall") && !listed.includes("Demo Provisions Madina"),
      "where to buy without JavaScript: submitting the region form lists that region's Yazz stockists", { url: p2.url(), listed });
    await nojs.close();
  }

  // Keyboard: the Products dropdown and a product window ------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/`);
    const navItems = await page.getByRole("navigation", { name: "Main" }).evaluate((nav) =>
      [...nav.children].map((c) => (c.matches("a") ? c : c.querySelector(":scope > a"))?.textContent?.trim() ?? ""));
    check(JSON.stringify(navItems) === JSON.stringify(["Home", "Products", "About Us", "Tips & Advice", "FAQs", "Contact", "Community Impact"]), "header: the nav has the 6 pages, then Community Impact", navItems);
    const ciHref = await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Community Impact/ }).getAttribute("href");
    check(ciHref === "https://lextagh.vercel.app/corporate-social-responsibility", "header: Community Impact links out to the Lexta CSR preview page", ciHref);
    check(await page.getByRole("contentinfo").getByRole("link", { name: "FAQs", exact: true }).count() === 1, "footer: links to the FAQs page");
    {
      const fam = await page.getByRole("contentinfo").locator("a").evaluateAll((as) => as.map((a) => [a.textContent.replace(/[↗\s]+$/, "").trim(), a.getAttribute("href")]));
      const want = [["Linzzy®", "https://lexta-linzzy.vercel.app/"], ["Hooch®", "https://lexta-hooch.vercel.app/"]];
      check(want.every(([n, h]) => fam.some(([fn, fh]) => fn === n && fh === h)) && fam.some(([fn, fh]) => fn === "Lexta Ghana Limited" && fh === "https://lextagh.vercel.app/") && !fam.some(([, h]) => !/^mailto:/.test(h ?? "") && /lextagh\.com|yazzproducts\.com|linzzyproducts\.com|hoochfoods\.com/.test(h ?? "")),
        "footer: Lexta family links to Lexta and the two sister brands' preview sites, never a real domain", fam.filter(([n]) => /Yazz|Linzzy|Hooch|Lexta/.test(n)));
    }

    // FAQs accordion by keyboard.
    await page.goto(`${SITE}/faqs`);
    const item = page.locator("details").filter({ hasText: "When might I get my first period?" });
    await item.locator("summary").focus();
    await page.keyboard.press("Enter");
    check(await item.evaluate((d) => d.open) && await item.getByText(/There isn't a single date or age/).isVisible(), "faqs: Enter on a question opens its answer");
    await page.keyboard.press("Space");
    check(!(await item.evaluate((d) => d.open)), "faqs: Space closes it again");
    await page.getByRole("button", { name: "Where to Buy", exact: true }).click();
    check(await page.getByRole("heading", { name: "Ask Yazz®" }).count() === 0 && await page.getByRole("heading", { name: "Where to Buy" }).count() === 1, "faqs: a topic chip shows only that group");
    check(await page.locator('script[type="application/ld+json"]').count() === 1, "faqs: the FAQ structured data is on the FAQs page");
    await page.goto(`${SITE}/about`);
    check(await page.getByText("What is a period?").count() === 0 && await page.getByRole("link", { name: /Read the FAQs/ }).getAttribute("href") === "/faqs", "about: no accordion any more, a card links to /faqs");

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

  // Drive requests (Y1 to Y10) ------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    // Y5 and Y6: each range page has its tips button and its one line CSR link out to the Lexta CSR page.
    const TIPS = { "feminine-care": ["Tips Just 4 You", "/tips?category=just-4-you"], "oral-care": ["Oral Hygiene Tips", "/tips/tips-for-a-healthy-smile"],
      "home-tissue": ["Read Home Tips", "/tips?category=care-tips"], "baby-care": ["Parenting Guides", "/tips/diaper-changing-routines"],
      "home-care": ["Home-Care Advice", "/tips/laundry-care-with-yazz-activ"] };
    const SDG = { "feminine-care": "SDG 5", "oral-care": "SDG 3", "home-tissue": "SDG 15", "baby-care": "SDG 6", "home-care": "SDG 12" };
    for (const [range, [label, href]] of Object.entries(TIPS)) {
      await page.goto(`${SITE}/products/${range}`);
      const hero = page.locator("section[aria-labelledby=range-title]");
      const btn = hero.getByRole("link", { name: label, exact: true });
      const csr = page.locator("p").filter({ hasText: SDG[range] }).first();
      const csrHref = await csr.getByRole("link", { name: /Community Impact \(CSR\)/ }).getAttribute("href").catch(() => null);
      check(await btn.getAttribute("href") === href && (await fetch(`${SITE}${href}`)).status === 200 && /\/corporate-social-responsibility$/.test(csrHref ?? "")
        && !/lextagh\.com/.test(csrHref ?? ""), `range ${range}: tips button "${label}" to existing tips, ${SDG[range]} strip links out to the Lexta CSR preview page`, { csrHref });
    }

    // Y1, Y3, Y8, Y9: the Just 4 You view.
    await page.goto(`${SITE}/tips?category=just-4-you`);
    const tiles = await page.locator("section[aria-labelledby=tiles-title] a").evaluateAll((as) => as.map((a) => [a.querySelector("strong")?.textContent, a.getAttribute("href")]));
    check(tiles.length === 10 && JSON.stringify(tiles.map((x) => x[0])) === JSON.stringify(["My First Period", "My Period & Me", "Choose My Yazz®", "Feeling Fresh", "Puberty & Me", "Just 4 Parents", "Periods at School", "Myths & Facts", "What's Inside My Yazz®?", "Ask Yazz®"]),
      "Tips Just 4 You: Lexta's ten cards in Lexta's order", tiles);
    const hashes = [];
    for (const [, href] of tiles) {
      const [url, hash] = href.split("#");
      const r = await fetch(`${SITE}${url}`);
      const html = await r.text();
      if (r.status !== 200 || (hash && !html.includes(`id="${hash}"`))) hashes.push(href);
    }
    check(hashes.length === 0, "Tips Just 4 You: every card opens a page (and its section) that exists", hashes);
    const period = page.locator("#my-period-and-me");
    const periodLinks = await period.locator("li a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    check(periodLinks.length === 7 && periodLinks.every((h) => /^\/tips\/[a-z0-9-]+$/.test(h)) && await period.getByText("Learn it. Track it. Understand it.").count() === 1,
      "My Period & Me: Lexta's topics link to existing articles", periodLinks);
    for (const id of ["welcome", "first-period-checklist", "growing"]) check(await page.locator(`section#${id}`).count() === 1, `Just 4 You: the "${id}" panel shows`);
    const explore = await page.locator("#growing nav a").count();
    check(explore === 7, `Just 4 You: "You're Growing. We're Listening." has its seven Explore more links (${explore})`);
    const inside = page.locator("#whats-inside");
    const layers = inside.locator("details");
    check(await layers.count() === 4 && await inside.getByText(/\[PLACEHOLDER: /).count() >= 4
      && await inside.getByRole("link", { name: "support@yazzproducts.com" }).getAttribute("href") === "mailto:support@yazzproducts.com",
      "What's Inside My Yazz®: four layers, placeholder facts, the Consumer Care email");
    await layers.first().locator("summary").click();
    check(await layers.first().evaluate((d) => d.open) && await layers.first().getByText(/what layer 1 does/).isVisible(), "What's Inside My Yazz®: a layer opens on tap");
    const order = await page.evaluate(() => ["#welcome", "#tiles-title", "#my-period-and-me", "#list-title", "#whats-inside", "#growing"].map((s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : -1; }));
    const news = await page.locator("form").filter({ has: page.getByLabel("Your email address") }).evaluate((f) => f.getBoundingClientRect().top + scrollY);
    check(order.every((y, i) => y >= 0 && (i === 0 || y > order[i - 1])) && order.every((y) => y < news), "Just 4 You: intro, cards, My Period & Me, articles, What's Inside, closing, all above the newsletter", { order, news });

    // Y3 and Y2: the Just 4 Parents view's intro links each of the ten topics to its article; the closing shows.
    await page.goto(`${SITE}/tips?category=just-4-parents`);
    const topics = await page.locator("#start-with-a-conversation li a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const cards = await page.locator("section[aria-labelledby=list-title] h3 a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    check(topics.length === 10 && topics.every((h) => cards.includes(h)) && await page.locator("#conversation-starts-at-home").count() === 1,
      "Just 4 Parents: Start With a Conversation links the ten topics to the ten articles; The Conversation Starts at Home closes it", { topics, cards });

    // Y2: links inside articles, internal only, no raw link tokens.
    await page.goto(`${SITE}/tips/understanding-your-first-period`);
    const menarche = page.getByRole("link", { name: "menarche", exact: true });
    check(await menarche.getAttribute("href") === "#when-will-my-first-period-start" && await page.locator("h2#when-will-my-first-period-start").count() === 1
      && await page.getByRole("link", { name: "Sanitary pads", exact: true }).getAttribute("href") === "/products/feminine-care#product-sanitary-pads",
      "article: menarche links to its own first period section (not Google), the period kit pads to the pads window");
    await page.goto(`${SITE}/tips/personal-hygiene-during-puberty`);
    check(await page.getByRole("link", { name: "Brush regularly" }).getAttribute("href") === "/products/oral-care#product-toothbrushes"
      && await page.getByRole("link", { name: "good dental-care practices" }).getAttribute("href") === "/tips/tips-for-a-healthy-smile",
      "article: brushing mentions link to the toothbrushes window and Tips for a Healthy Smile");
    const bad = [];
    for (const url of ["/tips?category=just-4-you", "/tips?category=just-4-parents", ...topics, "/tips/understanding-your-first-period", "/tips/periods-at-school", "/tips/which-pad-is-right-4-me", "/tips/tips-for-a-healthy-smile"]) {
      await page.goto(`${SITE}${url}`);
      const text = await page.locator("main").innerText();
      const links = await page.locator("main a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      if (/\]\(\/|\]\(#/.test(text)) bad.push(`${url}: raw link token`);
      if (await page.getByText("Reviewed by").count()) bad.push(`${url}: reviewer shown`);
      for (const h of links.filter((h) => /^https?:/.test(h) && !/lextagh\.vercel\.app|wa\.me|whatsapp\.com|facebook|instagram|tiktok/.test(h))) bad.push(`${url}: outside link ${h}`);
    }
    check(bad.length === 0, "Tips pages and articles: no raw link tokens, no outside links in the text, no reviewer shown yet (Y7)", bad);

    // Y10: no empty Parenting category.
    await page.goto(`${SITE}/tips`);
    const chips = await page.getByRole("navigation", { name: "Article categories" }).locator("a").allInnerTexts();
    await page.goto(`${SITE}/tips?category=parenting-baby-care`);
    check(!chips.some((c) => /Parenting/.test(c)) && await page.locator("#list-title").innerText() === "All articles", "Tips: the Parenting & Baby Care category stays hidden while it has no article", chips);

    // Y4: the Products sub-menu, and a product window opening from it.
    await page.goto(`${SITE}/`);
    const caret = page.getByRole("button", { name: "Products menu" });
    const panel = page.locator(`#${await caret.getAttribute("aria-controls")}`);
    const subs = await panel.locator("ul a").evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
    check(subs.length === 14 && subs.some(([l, h]) => l === "Sanitary Pads" && h === "/products/feminine-care#product-sanitary-pads") && subs.some(([l, h]) => l === "Baby Care Tips" && h === "/tips/diaper-changing-routines"),
      "Products menu: second level links under each range (products and tips)", subs);
    await page.getByRole("link", { name: "Products", exact: true }).hover();
    await sleep(250);
    await page.screenshot({ path: path.join(OUT, "products-menu-1440.png") });
    await panel.getByRole("link", { name: "Sanitary Pads" }).click();
    await page.waitForURL(/feminine-care#product-sanitary-pads/);
    await page.locator("#product-sanitary-pads").waitFor({ state: "visible", timeout: 10000 }).then(() => check(true, "Products menu: Sanitary Pads opens the pads window on the range page"), (e) => check(false, "Products menu: Sanitary Pads opens the pads window", e.message));
    await page.keyboard.press("Escape");
    await sleep(300);
    await page.getByRole("link", { name: "Products", exact: true }).hover();
    await sleep(250);
    await panel.getByRole("link", { name: "Panty Liners" }).click();
    await page.locator("#product-panty-liners").waitFor({ state: "visible", timeout: 10000 }).then(() => check(true, "Products menu: on the same range page, Panty Liners opens its window"), (e) => check(false, "Products menu: same page window", e.message));
    await ctx.close();

    const phone = await context("phone");
    const p2 = await phone.newPage();
    await p2.goto(`${SITE}/`);
    await p2.getByLabel("Menu", { exact: true }).click();
    const sheet = p2.getByRole("navigation", { name: "Mobile" });
    const minis = await sheet.getByRole("link", { name: "Toothbrushes" }).getAttribute("href");
    await p2.screenshot({ path: path.join(OUT, "products-menu-390.png") });
    await sheet.getByRole("link", { name: "Wipes", exact: true }).click();
    await p2.locator("#product-baby-wipes").waitFor({ state: "visible", timeout: 10000 }).then(() => check(minis === "/products/oral-care#product-toothbrushes", "phone menu: product sub links, Wipes opens the wipes window", minis), (e) => check(false, "phone menu: Wipes opens the wipes window", e.message));
    await p2.goto(`${SITE}/tips?category=just-4-you`);
    await p2.locator("#whats-inside").screenshot({ path: path.join(OUT, "whats-inside-390.png") });
    await phone.close();

    const nojs = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const p3 = await nojs.newPage();
    await p3.goto(`${SITE}/tips?category=just-4-you`);
    const layer = p3.locator("#whats-inside details").nth(1);
    await layer.locator("summary").click();
    check(await layer.getAttribute("open") !== null && await layer.getByText(/what layer 2 does/).isVisible(), "What's Inside My Yazz® without JavaScript: a layer opens on tap");
    await nojs.close();
  }

  // FAQs without JavaScript: the answers still open.
  {
    const ctx = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${SITE}/faqs`);
    const item = page.locator("details").filter({ hasText: "Can I go to school during my period?" });
    await item.locator("summary").click();
    check(await item.getAttribute("open") !== null && await item.getByText(/Most people can continue their usual activities/).isVisible(), "faqs without JavaScript: a question opens its answer");
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
    await page.goto(`${SITE}/contact?topic=question&product=toothpaste-herbal#message`);
    const form = page.locator("#message form");
    check(await form.locator("input[name=topic][value=question]").isChecked() && await page.locator("#c-product").inputValue() === "toothpaste-herbal", "consumer form: Ask about this product arrives with the topic and product chosen");
    await page.fill("#c-name", "Ama JS");
    await page.fill("#c-email", `ama.js.${stamp}@example.com`);
    await page.fill("#c-message", "Is the toothpaste safe for children?");
    // Without the privacy tick the server refuses it (X4), with an inline message under the box.
    await form.getByRole("button", { name: /Send Message/ }).click();
    await form.locator("#c-privacy-error").waitFor({ timeout: 15000 }).catch(() => {});
    check(/agree to the privacy notice/.test(await form.locator("#c-privacy-error").innerText().catch(() => "")) && await form.locator("a[href$='/privacy-policy']").count() === 1,
      "consumer form (JS): without the privacy tick it is refused, with a link to the privacy notice");
    await form.locator("input[name=privacy]").check();
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
    await form.locator("input[name=privacy]").check();
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
    await page.locator("#message form input[name=privacy]").check();
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
