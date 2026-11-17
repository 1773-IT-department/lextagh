// The Linzzy brand site in a browser (390 and 1440 px), against the throwaway harness database only, through
// ../browser/gateway.mjs. Never pointed at the real project or a real domain. Seeds the fictional demo data of
// ../browser/demo-seed.mjs (Yazz, Linzzy and Hooch stockists), starts the gateway and the site's production build, then:
//   - every page and an article: HTTP 200, a heading, no console errors or failed requests (outside hosts are blocked:
//     images get a grey tile, the rest is aborted), no horizontal scroll, images with alt text; a screenshot of each
//   - the old range pages (/products/feminine-care, /products/baby-care) redirect to their band on /products
//   - the scroll animations of the design run (reveals, pinned sections), and stand still for reduced motion
//   - Linzzy data only: the products are the published Linzzy products, the stockists the active Linzzy stockists
//   - the menu by keyboard (the 6 pages, Escape), the FAQs, a product window (open, Escape, focus back)
//   - the consumer form (question and product problem), the trade enquiry and the newsletter, with JavaScript and
//     without it, each landing a Linzzy lead, complaint or contact
//   - the live chat widget (its previous look) opens and starts a conversation tagged linzzy
//   - the menu has exactly the 6 pages, every page has one h1, and a stockist named with HTML never runs on the map
// Build the site for the harness first (see run.sh). Screenshots go to LINZZY_SCREENSHOTS (default: a linzzy-screens folder
// in the temp directory). Every server it starts is stopped at the end.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
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
const OUT = process.env.LINZZY_SCREENSHOTS || path.join(os.tmpdir(), "linzzy-screens");
mkdirSync(OUT, { recursive: true });

const { q } = await import("../browser/demo-seed.mjs");
// A stockist whose name is HTML: it must show as text everywhere (list, map tooltip), never run.
const EVIL = `Evil <img src=x onerror="window.__xss=1"> Shop`;
await q(`insert into public.stockists (id, name, outlet_type, region_id, town, latitude, longitude, is_active) values
  ('00000000-0000-0000-0000-0000000e0001', '${EVIL.replace(/'/g, "''")}', 'general_trade', (select id from public.regions where slug = 'central'), 'Cape Coast', 5.105, -1.247, true)`);
await q(`insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-0000000e0001', (select id from public.brands where slug = 'linzzy'))`);
const CHAT_SECRET = "harness-chat-secret-linzzy-browser-0123456789";
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
const REVALIDATE_SECRET = "harness-revalidate-secret-linzzy";
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  CHAT_INTAKE_SECRET: CHAT_SECRET, REVALIDATE_SECRET };
run(`${ROOT}/apps/linzzy/node_modules/.bin/next`, ["start", "-p", "3103", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/linzzy`, env });
const SITE = "http://127.0.0.1:3103";

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

/** Before a screenshot: every lazy image is made eager, the page is scrolled slowly to the end and back, and the fonts and
 *  every image have finished loading, so no picture is caught half loaded. */
async function settle(page) {
  await page.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; });
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); setTimeout(r, 8000); }))));
  });
  await sleep(400);
}

/** For a full page screenshot of the scroll driven design: stops the scroll engine and shows every element in its end
 *  state, so one tall picture shows the whole page. */
async function freeze(page) {
  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    document.querySelectorAll("[data-reveal]").forEach((e) => e.style.setProperty("--r", "1"));
    document.querySelectorAll("[data-w]").forEach((e) => { e.style.opacity = "1"; });
  });
  await sleep(300);
}

/** Lexta's real domains: no link, picture or background on the site may point at one. */
const REAL_DOMAIN = /^https?:\/\/(www\.)?(lextagh\.com|yazzproducts\.com|linzzyproducts\.com|hoochfoods\.com)(\/|$)/i;

const PAGES = [
  ["home", "/"], ["products", "/products"], ["about", "/about"], ["tips", "/tips"], ["article-feminine", "/tips/know-your-flow"],
  ["article-baby", "/tips/the-perfect-diaper-bag"], ["faqs", "/faqs"], ["contact", "/contact"],
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
    check(denied.status === 401 && r.status === 200 && body.revalidated?.paths?.includes("/products/baby-care") && body.revalidated?.paths?.includes("/products/feminine-care"), "revalidate: refused without the secret, refreshes the product pages with it", body);
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
      await settle(page);
      const info = await page.evaluate((realSource) => ({
        sw: document.scrollingElement.scrollWidth, w: innerWidth, h1: document.querySelector("h1")?.textContent ?? "", h1s: document.querySelectorAll("h1").length,
        noAlt: [...document.querySelectorAll("img:not([alt])")].length, main: !!document.querySelector("main#main"),
        dashes: (document.body.innerText.match(/.{0,20}(?:[–—]| - ).{0,20}/g) ?? []).slice(0, 3),
        real: [...document.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => !h.startsWith("mailto:") && /lextagh\.com|yazzproducts\.com|linzzyproducts\.com|hoochfoods\.com/.test(h)),
        placeholderPhones: /009-215-5599|info@example\.com/.test(document.body.innerText),
        realImages: (() => {
          const real = new RegExp(realSource, "i");
          const srcs = [...document.querySelectorAll("img")].flatMap((i) => [i.getAttribute("src") ?? "", i.currentSrc, ...(i.getAttribute("srcset") ?? "").split(",").map((x) => x.trim().split(" ")[0])]);
          const nextImg = srcs.map((x) => { try { const u = new URL(x, location.href); return u.pathname === "/_next/image" ? u.searchParams.get("url") ?? "" : u.href; } catch { return x; } });
          const backgrounds = [...document.querySelectorAll("*")].flatMap((e) => [...getComputedStyle(e).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]));
          return [...nextImg, ...backgrounds].filter((x) => real.test(x));
        })(),
        prototypeClaims: (document.body.innerText.match(/.{0,30}(?:fragrance[ -]free|clinical).{0,30}/gi) ?? []).slice(0, 3),
      }), REAL_DOMAIN.source);
      const problems = drain();
      check(resp?.status() === 200 && info.h1 && info.h1s === 1 && info.main && info.noAlt === 0 && info.sw <= info.w && problems.length === 0 && info.dashes.length === 0
        && info.real.length === 0 && !info.placeholderPhones,
        `${kind} ${url}: 200, one h1, main landmark, alt text, no sideways scroll, no errors, no dashes, no link to a real Lexta domain`, { status: resp?.status(), ...info, problems });
      check(info.realImages.length === 0, `${kind} ${url}: no image or CSS background from lextagh.com, yazzproducts.com, linzzyproducts.com or hoochfoods.com`, info.realImages);
      check(info.prototypeClaims.length === 0, `${kind} ${url}: no "fragrance free" or "clinical" claim`, info.prototypeClaims);
      await freeze(page);
      await page.screenshot({ path: path.join(OUT, `${name}-${kind === "phone" ? 390 : 1440}.png`), fullPage: true });
    }
    // The old range pages send visitors to their band on /products.
    for (const [r, band] of [["feminine-care", "fem"], ["baby-care", "baby"]]) {
      const res = await fetch(`${SITE}/products/${r}`, { redirect: "manual" });
      check([307, 308].includes(res.status) && res.headers.get("location")?.endsWith(`/products#${band}`), `${kind} /products/${r}: redirects to /products#${band}`, { status: res.status, location: res.headers.get("location") });
    }
    // The product window, as a screenshot too.
    await page.goto(`${SITE}/products?p=baby-wipes`);
    await page.getByRole("dialog", { name: "Linzzy Baby Wipes" }).waitFor({ state: "visible" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll("dialog img")].map((i) => { i.loading = "eager"; return i.decode().catch(() => {}); }));
    });
    await sleep(600);
    await page.screenshot({ path: path.join(OUT, `product-window-${kind === "phone" ? 390 : 1440}.png`) });
    await ctx.close();
  }

  // The live database before 0016: the three prototype rows, with their claims and hotlinked lextagh.com photos.
  // The pages must show Lexta's six products in Drive wording and never draw a picture from a real Lexta domain.
  {
    const brand = "(select id from public.brands where slug = 'linzzy')";
    const refresh = async () => {
      await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": REVALIDATE_SECRET, "content-type": "application/json" }, body: JSON.stringify({ tags: ["products"] }) });
      for (const u of ["/", "/products"]) await fetch(`${SITE}${u}`);
      await sleep(1500);
    };
    await q(`update public.products set is_published = (slug in ('sanitary-napkins', 'baby-wipes', 'baby-care')) where brand_id = ${brand};
      update public.products set name = 'Baby wipes', long_description = 'Ultra mild, fragrance free wipes in 80 piece packs, formulated for sensitive skin.',
        short_description = 'Ultra mild, fragrance free wipes in 80 piece packs.', key_features = array['Ultra mild', 'Fragrance free'] where brand_id = ${brand} and slug = 'baby-wipes';
      update public.product_images set is_primary = false where product_id = (select id from public.products where brand_id = ${brand} and slug = 'baby-wipes');
      insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
        select id, 'https://www.lextagh.com/wp-content/uploads/2026/06/linzzy-wipes-poster.jpg', 'Linzzy poster', 1, true from public.products where brand_id = ${brand} and slug = 'baby-wipes';`);
    await refresh();
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    for (const u of ["/", "/products", "/products?p=baby-wipes"]) {
      await page.goto(`${SITE}${u}`);
      await settle(page);
      const seen = await page.evaluate((realSource) => {
        const real = new RegExp(realSource, "i");
        const srcs = [...document.querySelectorAll("img")].map((i) => i.getAttribute("src") ?? "");
        const backgrounds = [...document.querySelectorAll("*")].flatMap((e) => [...getComputedStyle(e).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]));
        return { real: [...srcs, ...backgrounds].filter((x) => real.test(x)), claims: /fragrance[ -]free|clinical|ultra mild/i.test(document.body.innerText),
          cards: [...document.querySelectorAll("main article h3")].map((h) => h.textContent?.trim()) };
      }, REAL_DOMAIN.source);
      check(seen.real.length === 0 && !seen.claims, `before 0016, ${u}: no picture from a real Lexta domain and no prototype claim`, seen);
      if (u === "/products") {
        check(seen.cards.length === 6 && seen.cards.includes("Linzzy Baby Wipes") && seen.cards.includes("Linzzy Heavy Flow Sanitary Towels") && !seen.cards.includes("Sanitary napkins") && !seen.cards.includes("Baby care"),
          "before 0016, products page: Lexta's six products, the prototype umbrella cards skipped", seen.cards);
      }
    }
    await ctx.close();
    await q(`delete from public.product_images where external_url like 'https://www.lextagh.com/%';
      update public.product_images set is_primary = true where external_url = '/images/linzzy/baby-wipes.webp';
      ${readFileSync(path.join(ROOT, "supabase/migrations/0016_linzzy_catalogue_products.sql"), "utf8")}`);
    await refresh();
  }

  // Linzzy data only ----------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/products`);
    const text = await page.locator("main").innerText();
    const linzzy = (await q(`select string_agg(p.name, '|') from public.products p join public.brands b on b.id = p.brand_id where b.slug = 'linzzy' and p.is_published`)).split("|");
    const other = (await q(`select string_agg(p.name, '|') from public.products p join public.brands b on b.id = p.brand_id where b.slug in ('yazz', 'hooch') and p.is_published`)).split("|");
    const cards = await page.locator("main article h3").allInnerTexts();
    check(linzzy.every((n) => cards.includes(n)) && cards.length === linzzy.length, `products page: one card for each of the ${linzzy.length} Linzzy products`, cards);
    check(!other.some((n) => cards.includes(n) && !linzzy.includes(n)) && !/corn flakes|toothpaste/i.test(text), "products page: no Yazz or Hooch product", other);
    check(!/add to cart|GH₵|checkout|price/i.test(text), "products page: no cart, checkout or prices");

    await page.goto(`${SITE}/contact`);
    await page.locator("#where-to-buy li strong").first().waitFor({ timeout: 15000 });
    const shops = await page.locator("#where-to-buy li strong").allInnerTexts();
    check(shops.includes("Demo Shop Adabraka") && shops.includes("Demo Chemist Ho"), "where to buy: the active Linzzy stockists are listed", shops);
    check(!shops.includes("Demo Mart Kejetia") && !shops.includes("Demo Pharmacy Osu") && !shops.includes("Demo Supermarket Tema") && !shops.includes("Demo Provisions Madina"), "where to buy: no Yazz or Hooch only shop, no closed shop", shops);
    await page.locator(".leaflet-marker-icon").nth(2).waitFor({ timeout: 15000 }).catch(() => {}); // the map loads after the list
    const pins = await page.locator(".leaflet-marker-icon").count();
    check(pins >= 3, `where to buy: the Leaflet map shows the shops with a position and the head office (${pins} pins)`);
    await page.locator("#wtb-region").selectOption("ashanti").catch(async () => { await page.locator("#wtb-region").evaluate((s) => { s.value = "ashanti"; s.dispatchEvent(new Event("change", { bubbles: true })); }); });
    await page.getByText(/No Linzzy stockists are listed in Ashanti yet/).waitFor({ timeout: 10000 }).then(() => check(true, "where to buy: Ashanti (only a Hooch shop) shows the friendly empty message"), (e) => check(false, "where to buy: Ashanti empty message", e.message));
    const remembered = await page.evaluate(() => localStorage.getItem("linzzy-region"));
    check(remembered === "ashanti", "where to buy: the chosen region is remembered for the product pages' Where to buy links", remembered);
    await page.goto(`${SITE}/contact?product=baby-wipes#where-to-buy`);
    await page.getByText(/No Linzzy stockists are listed in Ashanti yet/).waitFor({ timeout: 10000 }).then(() => check(true, "where to buy: a product's Where to buy link arrives with the remembered region preselected"), (e) => check(false, "where to buy: remembered region", e.message));
    check(await page.locator("#wtb-region").inputValue() === "ashanti", "where to buy: the region dropdown shows the remembered region");
    await page.locator("#wtb-region").selectOption("all");
    await page.locator("#where-to-buy li strong").first().waitFor({ timeout: 10000 });
    await page.fill("#wtb-q", "Chemist");
    const found = await page.locator("#where-to-buy li strong").allInnerTexts();
    check(found.includes("Demo Chemist Ho") && !found.includes("Demo Shop Adabraka"), "where to buy: the search narrows the list by town or shop", found);
    await ctx.close();

    const nojs = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const p2 = await nojs.newPage();
    await p2.goto(`${SITE}/contact#where-to-buy`);
    await p2.locator("#wtb-region").selectOption("greater-accra");
    await Promise.all([p2.waitForURL(/region=greater-accra/), p2.getByRole("button", { name: "Find stockists" }).click()]);
    const listed = await p2.locator("#where-to-buy li strong").allInnerTexts();
    check(listed.length === 1 && listed.includes("Demo Shop Adabraka") && !listed.includes("Demo Pharmacy Osu"),
      "where to buy without JavaScript: submitting the region form lists that region's Linzzy stockists", { url: p2.url(), listed });
    await nojs.close();
  }

  // Keyboard: the Products dropdown and a product window ------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/`);
    // The menu: the button opens it, it lists the 6 pages (this page marked), Escape closes it.
    await page.goto(`${SITE}/tips`);
    const menuBtn = page.getByRole("button", { name: "Menu", exact: true });
    await menuBtn.focus();
    await page.keyboard.press("Enter");
    const pagesNav = page.getByRole("navigation", { name: "Pages" });
    await pagesNav.waitFor({ timeout: 5000 });
    const navItems = await pagesNav.getByRole("link").allInnerTexts();
    check(await page.getByRole("button", { name: "Close", exact: true }).getAttribute("aria-expanded") === "true", "menu: Enter on Menu opens it (aria-expanded)");
    check(JSON.stringify(navItems.map((t) => t.trim())) === JSON.stringify(["Home", "Products", "About Us", "Tips & Advice", "FAQs", "Contact & Where to Buy"]), "menu: the 6 pages", navItems);
    check(await pagesNav.locator('[aria-current="page"]').innerText().then((t) => t.trim()) === "Tips & Advice", "menu: the current page is marked");
    await page.keyboard.press("Escape");
    await sleep(200);
    check(!(await pagesNav.isVisible()) && await menuBtn.getAttribute("aria-expanded") === "false", "menu: Escape closes it");
    check(await page.getByRole("contentinfo").getByRole("link", { name: "FAQs", exact: true }).count() >= 1, "footer: links to the FAQs page");

    // The scroll animations (home page): a reveal comes in as it scrolls into view, and the pinned "Care That Grows" track moves.
    await page.goto(`${SITE}/`);
    const rv = page.locator("[data-reveal]").nth(6);
    const before = await rv.evaluate((e) => parseFloat(getComputedStyle(e).getPropertyValue("--r") || "0"));
    await rv.scrollIntoViewIfNeeded();
    await sleep(600);
    const after = await rv.evaluate((e) => parseFloat(getComputedStyle(e).getPropertyValue("--r") || "0"));
    check(before < 0.5 && after > 0.5, "animations: a section fades in as it scrolls into view", { before, after });
    const track = page.locator("[data-pin] [data-track]").first();
    await page.locator("[data-pin]:has([data-track])").first().evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY + (e.offsetHeight - innerHeight) / 2));
    await sleep(600);
    const moved = await track.evaluate((e) => getComputedStyle(e).transform);
    check(moved !== "none" && moved !== "matrix(1, 0, 0, 1, 0, 0)", "animations: the pinned section's track slides sideways with the scroll", moved);
    const calm = await browser.newContext({ ...VIEW.desktop, reducedMotion: "reduce" });
    const cp = await calm.newPage();
    await cp.goto(`${SITE}/`);
    await sleep(600);
    const still = await cp.evaluate(() => ({ hidden: [...document.querySelectorAll("[data-reveal]")].filter((e) => getComputedStyle(e).getPropertyValue("--r").trim() !== "1").length,
      marquee: [...document.querySelectorAll("[data-marquee]")].map((e) => getComputedStyle(e).transform) }));
    check(still.hidden === 0 && still.marquee.every((t) => t === "none"), "animations: for reduced motion everything shows at once and nothing slides", still);
    await calm.close();

    // FAQs: a question opens its answer, a topic chip shows only that group.
    await page.goto(`${SITE}/faqs`);
    const qBtn = page.getByRole("button", { name: /How to make the right choice/ });
    await qBtn.focus();
    await page.keyboard.press("Enter");
    check(await qBtn.getAttribute("aria-expanded") === "true" && await page.getByText(/a longer towel is not automatically more absorbent/).first().isVisible(), "faqs: Enter on a question opens its answer");
    await page.keyboard.press("Space");
    check(await qBtn.getAttribute("aria-expanded") === "false", "faqs: Space closes it again");
    await page.getByRole("button", { name: "About Linzzy", exact: true }).click();
    await sleep(300);
    check(await page.getByRole("button", { name: /Getting to know Linzzy's sanitary towel range/ }).count() === 0 && await page.getByRole("button", { name: /Interested in distributing or stocking Linzzy products\?/ }).count() === 1, "faqs: a topic chip shows only that group");
    check(await page.locator('script[type="application/ld+json"]').count() === 1, "faqs: the FAQ structured data is on the FAQs page");
    await page.goto(`${SITE}/about`);
    const lextaLinks = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.href).filter((h) => /lexta/i.test(h)));
    check(lextaLinks.length > 0 && lextaLinks.every((h) => /^https:\/\/lextagh\.vercel\.app\//.test(h)), "about: the Lexta links go to the Lexta preview site, never a real domain", lextaLinks);

    // The map: a stockist named with HTML shows as text.
    await page.goto(`${SITE}/contact`);
    await page.locator(".leaflet-marker-icon").first().waitFor({ timeout: 15000 });
    const evilPin = page.locator(`.leaflet-marker-icon[title="${EVIL.replace(/"/g, '\\"')}"]`);
    await evilPin.hover();
    await sleep(500);
    const tip = await page.locator(".leaflet-tooltip").last().textContent().catch(() => "");
    check(await page.evaluate(() => window.__xss) === undefined && tip === EVIL && await page.getByText(EVIL, { exact: true }).count() >= 1,
      "map: a stockist name with HTML shows as text in the list and the pin tooltip, and never runs", { tip });

    // A product window: View details opens it, Escape closes it and focus returns.
    await page.goto(`${SITE}/products`);
    const opener = page.locator("main article").filter({ hasText: "Linzzy Baby Wipes" }).getByRole("button", { name: /View details/ });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Linzzy Baby Wipes" });
    await dialog.waitFor({ state: "visible" });
    check(await dialog.isVisible() && await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Close product details", "product window: opens on View details, focus on Close");
    check(await dialog.getByRole("link", { name: /Where to buy/i }).getAttribute("href") === "/contact?product=baby-wipes#where-to-buy"
      && await dialog.getByRole("link", { name: /Ask a question/i }).getAttribute("href") === "/contact?topic=question&product=baby-wipes#message",
      "product window: Where to buy and Ask a question, no cart or price");
    await page.keyboard.press("Escape");
    await sleep(200);
    check(!(await dialog.isVisible()) && /View details/.test(await page.evaluate(() => document.activeElement?.textContent ?? "")), "product window: Escape closes it and focus returns to its link");
    check(!/add to cart|GH₵|checkout/i.test(await page.locator("body").innerText()), "products page: no cart, checkout or prices");
    await page.goto(`${SITE}/products?p=baby-wipes`);
    await page.getByRole("dialog", { name: "Linzzy Baby Wipes" }).waitFor({ state: "visible" });
    check(true, "product window: opens from an address (?p=baby-wipes)");
    await ctx.close();
  }

  // FAQs without JavaScript: the answers still open.
  {
    const ctx = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${SITE}/faqs`);
    check(await page.getByText(/Used baby wipes should be placed in an appropriate waste bin/).isVisible(), "faqs without JavaScript: every answer shows");
    const shown = await page.evaluate(() => getComputedStyle(document.querySelector("[data-reveal]")).opacity);
    check(shown === "1", "without JavaScript: the content is shown, not left waiting for the scroll animations", shown);
    await ctx.close();
  }

  // Phone menu: a link in the menu leaves the menu closed on the next page; a chapter link closes it.
  {
    const ctx = await context("phone");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/tips`);
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("link", { name: /Parent Corner/ }).first().click();
    await sleep(600);
    check(await page.getByRole("navigation", { name: "Pages" }).count() === 0, "phone menu: closes after a chapter link");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "FAQs" }).click();
    await page.waitForURL(/\/faqs$/);
    await sleep(300);
    check(await page.getByRole("navigation", { name: "Pages" }).count() === 0, "phone menu: a page link opens that page with the menu closed");
    await ctx.close();
  }

  // Forms with JavaScript ---------------------------------------------------------------------------------------
  const stamp = Date.now().toString(36);
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/contact?topic=question&product=baby-wipes#message`);
    const form = page.locator("#message form");
    check(await form.locator("input[name=topic]").inputValue() === "question" && await form.locator("select[name=product]").inputValue() === "baby-wipes", "consumer form: Ask about this product arrives with the topic and product chosen");
    await form.locator("[name=name]").fill("Ama JS");
    await form.locator("[name=email]").fill(`ama.js.${stamp}@example.com`);
    await form.locator("[name=message]").fill("Are the wipes safe for newborns?");
    await form.locator("input[name=privacy]").check();
    await form.getByRole("button", { name: /Submit Enquiry/ }).click();
    const ok = page.locator("#message [data-form-message]");
    await ok.waitFor({ timeout: 15000 });
    const ref = /ENQ-[0-9A-F]{10}/.exec(await ok.innerText())?.[0];
    const row = ref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${ref}'`) : "";
    check(row === "website_contact_form|linzzy", "consumer form (JS): a Linzzy lead from the website contact form", { ref, row });

    await page.reload();
    await form.getByRole("button", { name: "Report a problem with a product" }).click();
    check(await form.locator("[name=batch]").isVisible(), "consumer form: the batch, place and date fields show for a product problem");
    await form.locator("[name=name]").fill("Kofi JS");
    await form.locator("[name=phone]").fill("+233 20 555 0101");
    await form.locator("select[name=product]").selectOption("heavy-flow-sanitary-towels");
    await form.locator("[name=batch]").fill("BW-77");
    await form.locator("[name=purchase_date]").fill("2026-10-20");
    await form.locator("[name=message]").fill("The pack was torn when opened.");
    await form.locator("input[name=privacy]").check();
    await form.getByRole("button", { name: /Submit Enquiry/ }).click();
    await ok.waitFor({ timeout: 15000 });
    const caseNo = /LX-\d{4}-\d{4,}/.exec(await ok.innerText())?.[0];
    const crow = caseNo ? await q(`select b.slug || '|' || coalesce(p.slug, '') || '|' || coalesce(c.batch_number, '') from public.complaints c join public.brands b on b.id = c.brand_id left join public.products p on p.id = c.product_id where c.case_number = '${caseNo}'`) : "";
    check(crow === "linzzy|heavy-flow-sanitary-towels|BW-77", "consumer form (JS): a product problem becomes a Linzzy complaint with product and batch", { caseNo, crow });

    const trade = page.locator("#trade form");
    await trade.locator("[name=contact_name]").fill("Yaw JS");
    await trade.locator("[name=business_name]").fill(`JS Traders ${stamp}`);
    await trade.locator("[name=email]").fill(`yaw.js.${stamp}@example.com`);
    await trade.locator("input[name=ranges][value=feminine-care]").check();
    await trade.getByRole("button", { name: /Send Trade Enquiry/ }).click();
    const tok = page.locator("#trade [data-form-message]");
    await tok.waitFor({ timeout: 15000 });
    const tref = /PTN-[0-9A-F]{10}/.exec(await tok.innerText())?.[0];
    const trow = tref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${tref}'`) : "";
    check(trow === "website_partner_form|linzzy", "trade enquiry (JS): a Linzzy lead from the website partner form", { tref, trow });

    await page.goto(`${SITE}/tips`);
    const sub = page.getByRole("form", { name: "Sign up for Linzzy educational updates" });
    await sub.locator("[name=email]").fill(`news.js.${stamp}@example.com`);
    await sub.locator("input[name=consent]").check();
    await sub.getByRole("button", { name: /Subscribe/ }).click();
    await page.locator("#subscribe [data-form-message]").waitFor({ timeout: 15000 });
    const nrow = await q(`select consent_marketing || '|' || coalesce(consent_source, '') from public.crm_contacts where email = 'news.js.${stamp}@example.com'`);
    check(nrow === "true|Website newsletter (Linzzy)", "newsletter (JS): a CRM contact with consent from the Linzzy site", nrow);
    await ctx.close();
  }

  // Forms without JavaScript ------------------------------------------------------------------------------------
  {
    const ctx = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${SITE}/contact#message`);
    await page.locator("#message form [name=name]").fill("Esi NoJS");
    await page.locator("#message form [name=email]").fill(`esi.nojs.${stamp}@example.com`);
    await page.locator("#message form [name=message]").fill("Where can I buy Linzzy diapers in Ho?");
    await page.locator("#message form input[name=privacy]").check();
    await Promise.all([page.waitForLoadState("load"), page.locator("#message form").getByRole("button", { name: /Submit Enquiry/ }).click()]);
    await sleep(500);
    const text = await page.locator("body").innerText();
    const ref = /ENQ-[0-9A-F]{10}/.exec(text)?.[0];
    const row = ref ? await q(`select b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${ref}'`) : "";
    check(row === "linzzy", "consumer form without JavaScript: posts, shows the reference and lands a Linzzy lead", { ref, row });

    await page.goto(`${SITE}/contact#trade`);
    await page.locator("#trade form [name=contact_name]").fill("Kwame NoJS");
    await page.locator("#trade form [name=business_name]").fill(`NoJS Stores ${stamp}`);
    await page.locator("#trade form [name=phone]").fill("0244111222");
    await Promise.all([page.waitForLoadState("load"), page.locator("#trade form").getByRole("button", { name: /Send Trade Enquiry/ }).click()]);
    await sleep(500);
    const tref = /PTN-[0-9A-F]{10}/.exec(await page.locator("body").innerText())?.[0];
    const trow = tref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${tref}'`) : "";
    check(trow === "website_partner_form|linzzy", "trade enquiry without JavaScript: posts and lands a Linzzy partner lead", { tref, trow });

    await page.goto(`${SITE}/contact#message`);
    await page.locator("#message form [name=name]").fill("");
    await Promise.all([page.waitForLoadState("load"), page.locator("#message form").getByRole("button", { name: /Submit Enquiry/ }).click()]);
    const errText = await page.locator("body").innerText();
    check(/Please enter your name/.test(errText) && /Please tick the box to agree to the privacy notice/.test(errText), "consumer form without JavaScript: errors (name, privacy notice) come back next to the fields");
    await ctx.close();
  }

  // Live chat ---------------------------------------------------------------------------------------------------
  for (const kind of ["desktop", "phone"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    await page.goto(`${SITE}/products`);
    const launcher = page.getByRole("button", { name: "Chat with the Linzzy care team" });
    const look = await launcher.evaluate((b) => { const cs = getComputedStyle(b); return { font: cs.fontFamily, bg: cs.backgroundColor }; });
    check(/DM Sans|^"?body"?,|font-body/i.test(look.font) && look.bg === "rgb(179, 16, 90)", `live chat (${kind}): the launcher keeps its look (DM Sans, Linzzy berry)`, look);
    await launcher.click();
    const panel = page.getByRole("dialog", { name: "Chat with Linzzy" });
    await panel.waitFor();
    await panel.getByLabel("Your name").fill(`Chat ${kind}`);
    await panel.getByLabel("How can we help?").fill("Which diaper size for 7kg?");
    await panel.getByRole("button", { name: "Start chat" }).click();
    await panel.getByRole("log").waitFor({ timeout: 15000 });
    await sleep(300);
    const row = await q(`select b.slug || '|' || coalesce(c.start_page, '') from public.chat_conversations c join public.brands b on b.id = c.brand_id where c.visitor_name = 'Chat ${kind}'`);
    check(row === "linzzy|/products", `live chat (${kind}): the widget opens and the conversation is tagged linzzy`, row);
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
if (failures) { console.log(`${failures} Linzzy browser checks failed`); process.exit(1); }
console.log("All Linzzy browser checks passed");
