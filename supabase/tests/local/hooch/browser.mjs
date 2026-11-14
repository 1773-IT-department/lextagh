// The Hooch brand site in a browser (390 and 1440 px), against the throwaway harness database only, through
// ../browser/gateway.mjs. Never pointed at the real project or a real domain. Seeds the fictional demo data of
// ../browser/demo-seed.mjs, starts the gateway and the site's production build, then:
//   - every page, product, recipe and article: HTTP 200, one h1, no console errors or failed requests (outside hosts are
//     blocked), no horizontal scroll, images with alt text, no dashes, no link or picture from a real Lexta domain or the
//     third-party shop; a screenshot of each (posters: ?3d=off, so screenshots never wait for software 3D)
//   - Hooch data only: the two Drive cereals, no Choco Flakes, Hooch stockists only
//   - the live 3D scene: it loads on a capable browser (?3d=on), draws, fades in over the poster, a tap makes a "crunch",
//     the Pause motion button works; with reduced motion the poster stays and nothing moves
//   - the nav has exactly Lexta's six tabs; recipe filter chips; the pack toy and the "You need" tick list by keyboard
//   - the consumer form (question, recipe idea and a product problem) and the trade enquiry, with and without JavaScript
//   - the live chat widget opens and starts a conversation tagged hooch
// Build the site for the harness first (see run.sh). Screenshots go to HOOCH_SCREENSHOTS (default: a hooch-screens folder
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
const OUT = process.env.HOOCH_SCREENSHOTS || path.join(os.tmpdir(), "hooch-screens");
mkdirSync(OUT, { recursive: true });

const { q } = await import("../browser/demo-seed.mjs");
const CHAT_SECRET = "harness-chat-secret-hooch-browser-0123456789";
await q(`delete from private.chat_intake_secret`);
await q(`insert into private.chat_intake_secret (secret) values ('${CHAT_SECRET}')`);

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
const REVALIDATE_SECRET = "harness-revalidate-secret-hooch";
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  CHAT_INTAKE_SECRET: CHAT_SECRET, REVALIDATE_SECRET };
run(`${ROOT}/apps/hooch/node_modules/.bin/next`, ["start", "-p", "3104", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/hooch`, env });
const SITE = "http://127.0.0.1:3104";

const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const VIEW = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } };
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
async function context(kind, extra = {}) {
  const ctx = await browser.newContext({ ...VIEW[kind], extraHTTPHeaders: { "x-real-ip": "127.0.0.31" }, ...extra });
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
async function settle(page) {
  await page.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; });
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
    document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-in"));
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); setTimeout(r, 8000); }))));
  });
  await sleep(900);
}

/**
 * A full page screenshot at device scale 2. Chromium cannot draw more than about 8000 device pixels in one capture,
 * so a long page is saved in parts of 3600 CSS pixels (name-part1.png, name-part2.png...).
 */
async function shoot(page, name) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const width = page.viewportSize().width;
  if (height <= 3600) { await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); return; }
  for (let y = 0, n = 1; y < height; y += 3600, n += 1) {
    await page.screenshot({ path: path.join(OUT, `${name}-part${n}.png`), fullPage: true, clip: { x: 0, y, width, height: Math.min(3600, height - y) } });
  }
}

const BAD_HOST = /^https?:\/\/([a-z0-9-]+\.)*(lextagh\.com|yazzproducts\.com|linzzyproducts\.com|hoochfoods\.com|chopboxonline\.com)(\/|$)/i;
const PAGES = [
  ["home", "/"], ["about", "/about"], ["products", "/products"], ["product-cornflakes", "/products/cornflakes"], ["product-frosted-flakes", "/products/frosted-flakes"],
  ["recipes", "/recipes"], ["recipe-classic", "/recipes/classic-hooch-bowl"], ["recipe-frosted-fruit", "/recipes/frosted-fruit-delight"],
  ["recipe-yoghurt", "/recipes/yoghurt-crunch"], ["recipe-after-school", "/recipes/after-school-crunch"],
  ["nutrition", "/nutrition"], ["article", "/nutrition/what-makes-a-balanced-breakfast"], ["contact", "/contact"],
];

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${SITE}/api/health`);

  {
    const denied = await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": "wrong" } });
    const r = await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": REVALIDATE_SECRET, "content-type": "application/json" }, body: JSON.stringify({ tags: ["products", "stockists"] }) });
    const body = await r.json();
    check(denied.status === 401 && r.status === 200 && body.revalidated?.paths?.includes("/products/[slug]") && body.revalidated?.paths?.includes("/contact"), "revalidate: refused without the secret, refreshes the product pages with it", body);
    for (const [, url] of PAGES) await fetch(`${SITE}${url}`);
    await sleep(1500);
    for (const [, url] of PAGES) await fetch(`${SITE}${url}`);
  }

  // Every page at both widths (posters, no live 3D) -----------------------------------------------------------
  for (const kind of ["desktop", "phone"]) {
    const ctx = await context(kind);
    const page = await ctx.newPage();
    const drain = watch(page);
    for (const [name, url] of PAGES) {
      drain();
      const resp = await page.goto(`${SITE}${url}${url.includes("?") ? "&" : "?"}3d=off`, { waitUntil: "load" });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await settle(page);
      const info = await page.evaluate((bad) => {
        const re = new RegExp(bad, "i");
        const srcs = [...document.querySelectorAll("img")].flatMap((i) => [i.getAttribute("src") ?? "", i.currentSrc]);
        const backgrounds = [...document.querySelectorAll("*")].flatMap((e) => [...getComputedStyle(e).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]));
        return {
          sw: document.scrollingElement.scrollWidth, w: innerWidth, h1: document.querySelector("h1")?.textContent ?? "", h1s: document.querySelectorAll("h1").length,
          noAlt: [...document.querySelectorAll("img:not([alt])")].length, main: !!document.querySelector("main#main"),
          dashes: (document.body.innerText.match(/.{0,20}(?:[–—]| - ).{0,20}/g) ?? []).slice(0, 3),
          links: [...document.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => !h.startsWith("mailto:") && re.test(h)),
          images: [...srcs, ...backgrounds].filter((x) => re.test(x)),
          claims: (document.body.innerText.match(/.{0,30}(?:low in fat|sun ripened|high energy|choco flakes).{0,30}/gi) ?? []).slice(0, 3),
          cart: /add to cart|GH₵|checkout/i.test(document.body.innerText),
        };
      }, BAD_HOST.source);
      const problems = drain();
      check(resp?.status() === 200 && info.h1 && info.h1s === 1 && info.main && info.noAlt === 0 && info.sw <= info.w && problems.length === 0 && info.dashes.length === 0 && info.links.length === 0,
        `${kind} ${url}: 200, one h1, main, alt text, no sideways scroll, no errors, no dashes, no link to a real Lexta domain`, { status: resp?.status(), ...info, problems });
      check(info.images.length === 0 && info.claims.length === 0 && !info.cart, `${kind} ${url}: no hotlinked picture, no prototype claim or Choco Flakes, no cart or prices`, info);
      await shoot(page, `${name}-${kind === "phone" ? 390 : 1440}`);
    }
    await ctx.close();
  }

  // Hooch data only ---------------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/products?3d=off`);
    const names = await page.locator("main a[href^='/products/'] [class*='productName']").allInnerTexts();
    check(JSON.stringify(names) === JSON.stringify(["Hooch® Cornflakes", "Hooch® Frosted Flakes"]), "products page: the two Drive cereals, nothing else", names);
    const navItems = await page.getByRole("navigation", { name: "Main" }).locator("a").allInnerTexts();
    check(JSON.stringify(navItems) === JSON.stringify(["Home", "About Hooch®", "Our Products", "Recipes", "Nutrition & Tips", "Contact"]), "header: Lexta's six tabs", navItems);
    const films = await page.locator(".hc-video video").evaluateAll((vs) => vs.map((v) => ({ poster: v.getAttribute("poster"), muted: v.muted, loop: v.loop, inline: v.playsInline,
      types: [...v.querySelectorAll("source")].map((s) => s.type) })));
    check(films.length === 2 && films.every((f) => f.muted && f.loop && f.inline && f.poster?.startsWith("/videos/") && f.types.includes("video/webm") && f.types.includes("video/mp4")),
      "products page: each cereal's film slot plays its short film (muted loop, webm and mp4, poster)", films);

    await page.goto(`${SITE}/contact?3d=off`);
    await page.locator("#where-to-buy li h3").first().waitFor({ timeout: 15000 }).catch(() => {});
    const shops = await page.locator("#where-to-buy li h3").allInnerTexts();
    const expected = (await q(`select string_agg(s.name, '|' order by s.name) from public.stockists s join public.stockist_brands sb on sb.stockist_id = s.id join public.brands b on b.id = sb.brand_id where b.slug = 'hooch' and s.is_active`)).split("|").filter(Boolean);
    check(expected.length > 0 && [...shops].sort().join("|") === [...expected].sort().join("|"), "where to buy: exactly the active Hooch stockists", { shops, expected });

    // Recipe filter chips.
    await page.goto(`${SITE}/recipes?3d=off`);
    await page.getByRole("button", { name: "Snack", exact: true }).click();
    const snack = await page.locator("main a[href^='/recipes/']").count();
    await page.getByRole("button", { name: "All ideas" }).click();
    const all = await page.locator("main a[href^='/recipes/']").count();
    check(snack === 2 && all === 4, "recipes: the Snack chip shows the two snack ideas, All ideas all four", { snack, all });

    // The "You need" tick list by keyboard.
    await page.goto(`${SITE}/recipes/classic-hooch-bowl?3d=off`);
    const items = page.locator("main ul button[aria-pressed]");
    const n = await items.count();
    for (let i = 0; i < n; i += 1) { await items.nth(i).focus(); await page.keyboard.press("Enter"); }
    check(n === 3 && await page.getByText("Ready? Pour, add and enjoy!").isVisible(), "recipe: ticking every item by keyboard shows the ready message");

    // The pack toy by keyboard.
    await page.goto(`${SITE}/?3d=off`);
    const pack = page.getByRole("button", { name: "Pack 3 of 10" });
    await pack.focus();
    await page.keyboard.press("Space");
    check(await pack.getAttribute("aria-pressed") === "true", "home: a pack opens from the keyboard");
    await ctx.close();
  }

  // The live 3D scene ------------------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    const drain = watch(page);
    await page.goto(`${SITE}/products/cornflakes?3d=on`);
    const stage = page.locator("[data-mode]").first();
    await page.waitForSelector("[data-mode='live'][data-shown] canvas", { timeout: 60000, state: "attached" }).catch(() => {});
    const live = await stage.evaluate((el) => ({ mode: el.dataset.mode, shown: el.hasAttribute("data-shown"), canvas: !!el.querySelector("canvas"),
      label: el.querySelector("[role=img]")?.getAttribute("aria-label") ?? "", posterHidden: el.querySelector("img")?.getAttribute("aria-hidden") === "true" }));
    check(live.mode === "live" && live.shown && live.canvas && /3D model of the Hooch® Cornflakes box/.test(live.label) && live.posterHidden,
      "3D: on a capable browser the live scene loads, fades in over the poster and is described for screen readers", live);
    const pause = stage.getByRole("button", { name: /Pause motion/ });
    await pause.click();
    check(await stage.getByRole("button", { name: /Play motion/ }).getAttribute("aria-pressed") === "true" && await page.evaluate(() => document.documentElement.dataset.motion) === "paused",
      "3D: Pause motion stops the movement (WCAG 2.2.2), says so, and pauses the whole site");
    // The choice is remembered: the next page starts paused (ticker and hero film still), and Play motion undoes it.
    await page.goto(`${SITE}/`);
    await sleep(800);
    const calmHome = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, film: document.querySelector(".hc-film video")?.paused,
      ticker: getComputedStyle(document.querySelector(".hc-marquee__track")).animationPlayState }));
    check(calmHome.motion === "paused" && calmHome.film === true && calmHome.ticker === "paused", "site-wide pause: remembered on the next page; the hero film and the ticker stand still", calmHome);
    await page.getByRole("banner").getByRole("button", { name: /Play motion/ }).click();
    await sleep(800);
    const moving = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion ?? "", film: document.querySelector(".hc-film video")?.paused }));
    check(moving.motion === "" && moving.film === false, "site-wide pause: Play motion in the header starts everything again, the hero film plays", moving);
    check(drain().length === 0, "3D: no console errors");
    await ctx.close();

    // The settled scene (?3d=still, as for the posters: software rendering is too slow to watch the pour): it draws,
    // and a tap on the food makes a crunch.
    const sctx = await context("desktop");
    const sp = await sctx.newPage();
    await sp.goto(`${SITE}/products/cornflakes?3d=still`);
    await sp.waitForSelector("[data-mode][data-settled] canvas", { timeout: 120000, state: "attached" });
    const drawn = await sp.evaluate(() => {
      const c = document.querySelector("[data-mode] canvas");
      const g = c?.getContext("webgl2") ?? c?.getContext("webgl");
      if (!g) return -1;
      const px = new Uint8Array(4);
      g.readPixels(Math.floor(g.drawingBufferWidth / 2), Math.floor(g.drawingBufferHeight / 2), 1, 1, g.RGBA, g.UNSIGNED_BYTE, px);
      return px[3];
    });
    check(drawn > 0, "3D: the scene draws (the middle of the canvas is not empty)", drawn);
    const box = await sp.locator("[data-mode]").first().boundingBox();
    await sp.mouse.click(box.x + box.width / 2, box.y + box.height * 0.5);
    await sleep(300);
    const burst = await sp.locator("[data-mode] span[aria-hidden='true']").filter({ hasText: /Crunch!|Munch!|Yum!|Pop!/ }).count();
    check(burst >= 1, "3D: tapping the box makes a crunch burst", burst);
    await sctx.close();

    const calm = await context("desktop", { reducedMotion: "reduce" });
    const cp = await calm.newPage();
    await cp.goto(`${SITE}/`);
    await sleep(2500);
    const still = await cp.locator("[data-mode]").first().evaluate((el) => ({ mode: el.dataset.mode, canvas: !!el.querySelector("canvas"), anim: getComputedStyle(el.querySelector("img")).animationName }));
    check(still.mode === "poster" && !still.canvas && still.anim === "none", "3D: with reduced motion the poster stays, without movement", still);
    check(await cp.locator(".hc-film video").evaluate((v) => v.paused && !v.autoplay), "hero film: with reduced motion it shows its poster and does not play");
    check(await cp.locator(".hc-marquee__track").evaluate((e) => getComputedStyle(e).animationName) === "none", "marquee: no movement for reduced motion");
    await calm.close();
  }

  // Forms with JavaScript -------------------------------------------------------------------------------------------
  const stamp = Date.now().toString(36);
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/contact?topic=recipe&3d=off#message`);
    const form = page.locator("#message form");
    check(await form.locator("input[name=topic][value=recipe]").isChecked(), "consumer form: Share Your Hooch® Recipe arrives with the recipe topic chosen");
    await page.fill("#c-name", "Ama JS");
    await page.fill("#c-email", `ama.js.${stamp}@example.com`);
    await page.fill("#c-message", "Frosted flakes on fresh pineapple!");
    await form.locator("input[name=privacy]").check();
    await form.getByRole("button", { name: /Submit Enquiry/ }).click();
    const ok = form.locator("[data-form-message]");
    await ok.waitFor({ timeout: 15000 });
    const ref = /ENQ-[0-9A-F]{10}/.exec(await ok.innerText())?.[0];
    const row = ref ? await q(`select l.source || '|' || b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${ref}'`) : "";
    check(row === "website_contact_form|hooch", "consumer form (JS): a Hooch lead from the website contact form", { ref, row });

    await page.goto(`${SITE}/contact?3d=off#message`);
    await form.locator("label").filter({ hasText: "Report a problem with a product" }).click();
    await page.fill("#c-name", "Kofi JS");
    await page.fill("#c-phone", "+233 20 555 0101");
    await page.locator("#c-product").evaluate((s) => { s.value = "cornflakes"; s.dispatchEvent(new Event("change", { bubbles: true })); });
    await page.fill("#c-batch", "HC-77");
    await page.fill("#c-message", "The inner pack was open.");
    await form.locator("input[name=privacy]").check();
    await form.getByRole("button", { name: /Submit Enquiry/ }).click();
    await ok.waitFor({ timeout: 15000 });
    const caseNo = /LX-\d{4}-\d{4,}/.exec(await ok.innerText())?.[0];
    const crow = caseNo ? await q(`select b.slug || '|' || coalesce(p.slug, '') || '|' || coalesce(c.batch_number, '') from public.complaints c join public.brands b on b.id = c.brand_id left join public.products p on p.id = c.product_id where c.case_number = '${caseNo}'`) : "";
    check(crow === "hooch|cornflakes|HC-77", "consumer form (JS): a product problem becomes a Hooch complaint with product and batch", { caseNo, crow });

    const trade = page.locator("#trade form");
    await page.fill("#t-name", "Yaw JS");
    await page.fill("#t-business", `JS Foods ${stamp}`);
    await page.fill("#t-email", `yaw.js.${stamp}@example.com`);
    await trade.locator("label").filter({ hasText: "Hooch® Frosted Flakes" }).click();
    await trade.getByRole("button", { name: /Send Trade Enquiry/ }).click();
    const tok = trade.locator("[data-form-message]");
    await tok.waitFor({ timeout: 15000 });
    const tref = /PTN-[0-9A-F]{10}/.exec(await tok.innerText())?.[0];
    const trow = tref ? await q(`select l.source || '|' || b.slug || '|' || replace(l.description, E'\\n', '~') from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${tref}'`) : "";
    check(trow.startsWith("website_partner_form|hooch|") && trow.includes("Hooch® Frosted Flakes"), "trade enquiry (JS): a Hooch partner lead with the cereal chosen", { tref, trow });
    await ctx.close();
  }

  // Forms without JavaScript ------------------------------------------------------------------------------------------
  {
    const ctx = await context("phone", { javaScriptEnabled: false, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${SITE}/contact#message`);
    await page.fill("#c-name", "Esi NoJS");
    await page.fill("#c-email", `esi.nojs.${stamp}@example.com`);
    await page.fill("#c-message", "Where can I buy Hooch in Ho?");
    await page.locator("#message form input[name=privacy]").check();
    await Promise.all([page.waitForLoadState("load"), page.locator("#message form").getByRole("button", { name: /Submit Enquiry/ }).click()]);
    await sleep(500);
    const ref = /ENQ-[0-9A-F]{10}/.exec(await page.locator("body").innerText())?.[0];
    const row = ref ? await q(`select b.slug from public.crm_leads l join public.brands b on b.id = l.brand_id where l.intake_reference = '${ref}'`) : "";
    check(row === "hooch", "consumer form without JavaScript: posts, shows the reference and lands a Hooch lead", { ref, row });
    await page.goto(`${SITE}/`);
    check(await page.locator(".hc-film video[poster='/videos/hooch-hero-poster.webp']").count() === 1 && await page.locator("canvas").count() === 0, "without JavaScript: the home page shows the hero film's poster, no canvas");
    await page.goto(`${SITE}/recipes`);
    const bubble = page.locator("details").filter({ hasText: "Can I use Hooch® Cornflakes for baking?" });
    await bubble.locator("summary").click();
    check(await bubble.getAttribute("open") !== null, "recipes without JavaScript: a Beyond the Bowl question opens");
    await ctx.close();
  }

  // Live chat -----------------------------------------------------------------------------------------------------------
  {
    const ctx = await context("phone");
    const page = await ctx.newPage();
    await page.goto(`${SITE}/products/frosted-flakes?3d=off`);
    await page.getByRole("button", { name: /Chat with the Hooch/ }).click();
    const panel = page.getByRole("dialog", { name: /Chat with Hooch/ });
    await panel.waitFor();
    await panel.getByLabel("Your name").fill("Chat phone");
    await panel.getByLabel("How can we help?").fill("Is Frosted Flakes sold in Kumasi?");
    await panel.getByRole("button", { name: "Start chat" }).click();
    await panel.getByRole("log").waitFor({ timeout: 15000 });
    await sleep(300);
    const row = await q(`select b.slug || '|' || coalesce(c.start_page, '') from public.chat_conversations c join public.brands b on b.id = c.brand_id where c.visitor_name = 'Chat phone'`);
    check(row.startsWith("hooch|/products/frosted-flakes"), "live chat: the widget opens and the conversation is tagged hooch", row);
    await page.screenshot({ path: path.join(OUT, "chat-390.png") });
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
if (failures) { console.log(`${failures} Hooch browser checks failed`); process.exit(1); }
console.log("All Hooch browser checks passed");
