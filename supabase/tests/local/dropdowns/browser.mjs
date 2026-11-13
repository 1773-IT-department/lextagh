// Browser check of the Lexta dropdown (packages/ui Select), the one dropdown on the website and in the portal: production
// builds of both apps against the harness database through ../browser/gateway.mjs (see run.sh to build). Covers:
//   - the WAI-ARIA select-only combobox: roles, names from the field's label, aria-expanded, aria-controls,
//     aria-activedescendant, the real select hidden from screen readers but still the face of the field and what posts
//   - keyboard: arrows, Home, End, type-ahead, Enter, Escape (no change), Tab (choose and move on), a <label> click
//   - mouse: the ticked option, hover highlight, choosing, a click outside closing the list
//   - the polite announcement of a choice, the focus ring on the face
//   - placing: above the field near the bottom of the window, inside the window at 390 px, no sideways scroll
//   - touch screens: the phone's own picker on the branded face; Where to Buy keeps its branded list there
//   - without JavaScript: the restyled select posts the Contact form and the Careers role picker shows
//   - website forms sent with a choice made in the dropdown, the Where to Buy finder, and in the portal a filter, a
//     controlled select that changes the form, region groups, and a disabled select
// Screenshots go to DROPDOWN_SCREENSHOTS (default: lexta-dropdown-screens in the temp directory). Every server it starts
// is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
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
const OUT = process.env.DROPDOWN_SCREENSHOTS || path.join(os.tmpdir(), "lexta-dropdown-screens");
mkdirSync(OUT, { recursive: true });
const { q, PHOTO_SECRET } = await import(`${ROOT}/supabase/tests/local/browser/demo-seed.mjs`);
const { choose } = await import(`${ROOT}/supabase/tests/local/browser/choose.mjs`);

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 500)}`); }
};

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.DROPDOWN_SERVER_LOG;
  p.stdout.on("data", (d) => { if (log) appendFileSync(log, `[${path.basename(cmd)} out] ${d}`); });
  p.stderr.on("data", (d) => {
    if (log) appendFileSync(log, `[${path.basename(cmd)} err] ${d}`);
    if (/error/i.test(String(d)) && !/ECONNREFUSED|fetch failed/.test(String(d))) process.stdout.write(`[${path.basename(cmd)}] ${d}`);
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

const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-dropdown-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  NEXT_PUBLIC_PORTAL_URL: "http://127.0.0.1:3101", FIELD_PHOTO_SECRET: PHOTO_SECRET };
run(`${ROOT}/apps/lexta/node_modules/.bin/next`, ["start", "-p", "3100", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/lexta`, env });
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3101", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);
const SITE = "http://127.0.0.1:3100";
const PORTAL = "http://127.0.0.1:3101";

const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
let ip = 20;
async function context(width, extra = {}) {
  const touch = width < 800 && extra.touch !== false;
  const { touch: _t, ...rest } = extra;
  ip += 1;
  const ctx = await browser.newContext({ ...(touch ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width, height: width < 800 ? 844 : 900 } }),
    extraHTTPHeaders: { "x-real-ip": `127.0.1.${ip}` }, ...rest });
  // Outside hosts (fonts, pictures) are not reachable from the harness: answer them empty.
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.fulfill({ status: 204, body: "" }));
  return ctx;
}
const errors = [];
function watch(page, who) {
  page.on("pageerror", (e) => errors.push(`${who}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`${who} @ ${page.url()}: ${m.text().slice(0, 200)}`); });
  return page;
}
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const hydrated = (page, name) => page.locator("[data-lx-select-combo]").and(page.getByRole("combobox", { name, exact: true })).waitFor();
const db = async (sql) => (await q(sql)).trim?.() ?? "";

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${SITE}/`);
  await waitFor(`${PORTAL}/login`);

  // Website, desktop: the Contact form's region --------------------------------------------------------------------------
  const site = watch(await (await context(1440)).newPage(), "site 1440");
  await site.goto(`${SITE}/contact-us`);
  await hydrated(site, "Region");
  const form = site.getByRole("form", { name: "Send a message" });
  const combo = form.getByRole("combobox", { name: "Region", exact: true });
  const native = form.locator("select[name=region]");
  check(await combo.getAttribute("aria-haspopup") === "listbox" && await combo.getAttribute("aria-expanded") === "false" && await combo.innerText() === "Greater Accra",
    "1440 contact: a combobox named by its label, closed, showing the chosen region");
  check(await native.getAttribute("aria-hidden") === "true" && await native.getAttribute("tabindex") === "-1" && await native.isVisible(),
    "1440 contact: the real select stays as the face, hidden from screen readers and from Tab");
  const face = await native.evaluate((s) => { const c = getComputedStyle(s); return { appearance: c.appearance, pr: c.paddingRight, radius: c.borderRadius }; });
  check(face.appearance === "none" && face.pr === "40px" && face.radius === "7px", "1440 contact: the face has no native arrow, room for the brand chevron, the field's radius", face);
  check(await form.locator("[data-lx-select] > span[aria-hidden] svg").count() === 1, "1440 contact: a brand chevron (SVG)");

  // Keyboard: Tab in, arrows, Home, End, type-ahead, Enter.
  await form.locator("input[name=detail]").focus();
  await site.keyboard.press("Tab");
  check(await combo.evaluate((el) => el === document.activeElement), "1440 contact: Tab reaches the dropdown");
  const ring = await native.evaluate((s) => getComputedStyle(s).outlineStyle);
  check(ring === "solid", "1440 contact: the face shows a focus ring for keyboard focus", ring);
  await site.keyboard.press("ArrowDown");
  const listId = await combo.getAttribute("aria-controls");
  const list = site.locator(`#${listId}`);
  check(await combo.getAttribute("aria-expanded") === "true" && await list.getAttribute("role") === "listbox" && await list.isVisible(), "1440 contact: Down Arrow opens the listbox it controls");
  const activeText = async () => { const id = await combo.getAttribute("aria-activedescendant"); return id ? site.locator(`#${id}`).innerText() : ""; };
  check(await activeText() === "Greater Accra", "1440 contact: the chosen option is active when the list opens");
  check(await list.getByRole("option", { name: "Greater Accra" }).locator("svg").count() === 1, "1440 contact: the chosen option is ticked");
  await site.keyboard.press("ArrowDown");
  const second = await activeText();
  check(second !== "Greater Accra" && await list.getByRole("option", { name: second }).getAttribute("aria-selected") === "true", "1440 contact: Down Arrow moves the active option", second);
  await site.keyboard.press("End");
  const options = await list.getByRole("option").allInnerTexts();
  check(await activeText() === options.at(-1), "1440 contact: End goes to the last option");
  await site.keyboard.press("Home");
  check(await activeText() === options[0], "1440 contact: Home goes to the first option");
  await site.keyboard.type("vo");
  check(await activeText() === "Volta", "1440 contact: typing finds an option (type-ahead)", await activeText());
  await site.waitForTimeout(350);
  await site.screenshot({ path: `${OUT}/site-1440-contact-open.png` });
  await site.keyboard.press("Enter");
  check(await native.inputValue() === "Volta" && await combo.innerText() === "Volta" && await combo.getAttribute("aria-expanded") === "false"
    && await combo.evaluate((el) => el === document.activeElement), "1440 contact: Enter chooses, closes and keeps focus on the dropdown");
  await site.waitForTimeout(100);
  check(await form.locator("[data-lx-select] [role=status]").innerText() === "Volta, selected", "1440 contact: the choice is announced");
  // Escape leaves the value; Tab chooses and moves on.
  await site.keyboard.press("ArrowDown");
  await site.keyboard.press("ArrowDown");
  await site.keyboard.press("Escape");
  check(await native.inputValue() === "Volta" && await combo.getAttribute("aria-expanded") === "false", "1440 contact: Escape closes without changing the choice");
  await site.keyboard.press("ArrowDown");
  await site.keyboard.press("ArrowUp");
  const above = await activeText();
  await site.keyboard.press("Tab");
  check(await native.inputValue() === above && await form.locator("textarea[name=message]").evaluate((el) => el === document.activeElement),
    "1440 contact: Tab chooses the active option and moves to the next field", { above, now: await native.inputValue() });
  // Mouse: hover highlight, click to choose, click outside to close; a label click focuses the dropdown.
  await combo.click();
  await list.getByRole("option", { name: "Northern" }).hover();
  check(await activeText() === "Northern", "1440 contact: hovering an option highlights it");
  await list.getByRole("option", { name: "Northern" }).click();
  check(await native.inputValue() === "Northern" && !(await list.count()), "1440 contact: clicking an option chooses it and closes the list");
  check(await native.evaluate((s) => getComputedStyle(s).outlineStyle) === "none",
    "1440 contact: after a mouse pick the website keeps its keyboard only focus ring");
  // Tab with a highlight left by the mouse closes without choosing.
  await combo.click();
  await list.getByRole("option", { name: "Eastern" }).hover();
  await site.keyboard.press("Tab");
  check(await native.inputValue() === "Northern" && !(await list.count()), "1440 contact: Tab after a mouse hover closes without changing the choice", await native.inputValue());
  // Scrolling the field out of the window closes the list.
  await combo.click();
  await list.waitFor();
  await site.evaluate(() => window.scrollBy(0, 2000));
  await site.waitForTimeout(150);
  check(!(await list.count()) && await combo.getAttribute("aria-expanded") === "false", "1440 contact: the list closes when the field scrolls out of the window");
  await combo.scrollIntoViewIfNeeded();
  await combo.click();
  await site.mouse.click(30, 500);
  check(await combo.getAttribute("aria-expanded") === "false", "1440 contact: a click outside closes the list");
  await form.locator("label", { has: site.locator("select[name=region]") }).click({ position: { x: 8, y: 6 } });
  check(await combo.evaluate((el) => el === document.activeElement), "1440 contact: clicking the label focuses the dropdown");
  // Near the bottom of the window the list opens above the field, and stays inside the window.
  await site.evaluate(() => window.scrollTo(0, 0));
  const fieldBox = await combo.boundingBox();
  await site.evaluate((y) => window.scrollBy(0, y), fieldBox.y - (900 - fieldBox.height - 20));
  await combo.click();
  const lb = await list.boundingBox();
  const cb = await combo.boundingBox();
  check(await list.getAttribute("data-up") === "" && lb.y + lb.height <= cb.y && lb.y >= 0, "1440 contact: near the bottom of the window the list opens above", { lb, cb });
  check(Math.abs(lb.width - cb.width) < 1 && Math.abs(lb.x - cb.x) < 1, "1440 contact: the list lines up with the field");
  await site.waitForTimeout(350);
  await site.screenshot({ path: `${OUT}/site-1440-contact-open-above.png` });
  await site.keyboard.press("Escape");

  // Send the form with the region chosen in the dropdown.
  const ts = Date.now();
  await form.locator("input[name=name]").fill(`Dropdown Visitor ${ts}`);
  await form.locator("input[name=email]").fill(`dropdown.${ts}@example.com`);
  await form.locator("textarea[name=message]").fill("Where can I buy Yazz?");
  await choose(form, "Region", "Volta");
  await form.getByRole("button", { name: "Send message" }).click();
  await site.locator("[data-form-message]").first().waitFor({ timeout: 20000 });
  check(/ENQ-|thank/i.test(await site.locator("[data-form-message]").first().innerText()), "1440 contact: the form sends with the chosen region");
  check(await db(`select count(*) from public.crm_leads l join public.crm_contacts c on c.id = l.contact_id where c.full_name = 'Dropdown Visitor ${ts}' and l.description like '%Region: Volta%'`) === "1",
    "1440 contact: the CRM lead has the region chosen in the dropdown");
  check(await native.inputValue() === "Greater Accra" && await combo.innerText() === "Greater Accra", "1440 contact: after sending, the field and the dropdown go back to the first region");

  // Where to Buy (Home): the prototype's look, the branded list, and the finder.
  await site.goto(`${SITE}/`);
  await hydrated(site, "Your region");
  const region = site.getByRole("combobox", { name: "Your region", exact: true });
  await region.scrollIntoViewIfNeeded();
  const rb = await region.boundingBox();
  const regionFace = await site.locator("[data-variant=region] select").evaluate((s) => { const c = getComputedStyle(s); return { h: c.height, b: c.borderTopColor, bg: c.backgroundColor, r: c.borderRadius }; });
  check(Math.round(rb.height) === 48 && regionFace.b === "rgb(220, 234, 239)" && regionFace.bg === "rgb(251, 254, 255)" && regionFace.r === "9px",
    "1440 home: Where to Buy keeps the approved 48 px region field", regionFace);
  check(await site.locator("[data-variant=region] > span[aria-hidden]").innerText() === "▼", "1440 home: with its round caret");
  await choose(site, "Your region", "Greater Accra");
  await site.getByRole("button", { name: "Find a stockist" }).click();
  await site.getByText(/stockists? in Greater Accra/).waitFor({ timeout: 15000 });
  check(true, "1440 home: Find a stockist lists the region chosen in the dropdown");
  await region.click();
  await site.waitForTimeout(350);
  await site.screenshot({ path: `${OUT}/site-1440-where-to-buy-open.png` });
  await site.keyboard.press("Escape");

  // Website, a 390 px window with a mouse: the list stays inside the window.
  const narrow = watch(await (await context(390, { touch: false })).newPage(), "site 390 mouse");
  await narrow.goto(`${SITE}/contact-us`);
  await hydrated(narrow, "Region");
  const nCombo = narrow.getByRole("combobox", { name: "Region", exact: true });
  await nCombo.scrollIntoViewIfNeeded();
  await nCombo.click();
  const nl = await narrow.locator(`#${await nCombo.getAttribute("aria-controls")}`).boundingBox();
  check(nl.x >= 0 && nl.x + nl.width <= 390 && nl.y >= 0 && nl.y + nl.height <= 844, "390 mouse: the open list stays inside the window", nl);
  check(await noSideScroll(narrow), "390 mouse: no sideways scroll with the list open");
  await narrow.waitForTimeout(350);
  await narrow.screenshot({ path: `${OUT}/site-390-contact-open.png` });

  // Phone (touch): the phone's own picker on the branded face; Where to Buy keeps its branded list.
  const phone = watch(await (await context(390)).newPage(), "site 390 touch");
  await phone.goto(`${SITE}/contact-us`);
  await phone.waitForLoadState("networkidle");
  check(!(await phone.locator("[data-lx-select-combo]").count()) && await phone.locator("[data-lx-select]").count() > 0, "390 touch: the contact form uses the phone's own picker");
  const pSel = phone.locator("select[name=region]");
  check(await pSel.evaluate((s) => getComputedStyle(s).appearance) === "none" && await pSel.getAttribute("aria-hidden") === null, "390 touch: on the branded face, open to screen readers");
  await pSel.selectOption("Ashanti");
  check(await pSel.inputValue() === "Ashanti", "390 touch: choosing works");
  check(await noSideScroll(phone), "390 touch: no sideways scroll");
  await phone.screenshot({ path: `${OUT}/site-390-contact.png`, fullPage: true });
  await phone.goto(`${SITE}/`);
  const pRegion = phone.locator("[data-lx-select-combo]").and(phone.getByRole("combobox", { name: "Your region", exact: true }));
  await pRegion.waitFor();
  await pRegion.scrollIntoViewIfNeeded();
  await pRegion.tap();
  const pl = await phone.locator(`#${await pRegion.getAttribute("aria-controls")}`).boundingBox();
  check(pl && pl.x >= 0 && pl.x + pl.width <= 390, "390 touch: Where to Buy opens its branded list inside the window", pl);
  const tapBox = await phone.getByRole("option").first().boundingBox();
  check(tapBox.height >= 43.5, "390 touch: options are touch sized", tapBox);
  await phone.getByRole("option", { name: "Ashanti" }).tap();
  check(await pRegion.innerText() === "Ashanti", "390 touch: tapping an option chooses it");
  await phone.screenshot({ path: `${OUT}/site-390-where-to-buy.png` });

  // Without JavaScript: the restyled select posts the Contact form; the Careers role picker shows.
  const nojs = await (await context(1440, { javaScriptEnabled: false })).newPage();
  await nojs.goto(`${SITE}/contact-us`);
  const jSel = nojs.locator("select[name=region]");
  check(await jSel.isVisible() && await jSel.evaluate((s) => getComputedStyle(s).appearance) === "none" && !(await nojs.locator("[data-lx-select-combo]").count()),
    "no JavaScript: the contact form has the restyled select and no combobox");
  await jSel.selectOption("Northern");
  await nojs.locator("input[name=name]").fill(`No Script ${ts}`);
  await nojs.locator("input[name=email]").fill(`noscript.${ts}@example.com`);
  await nojs.locator("textarea[name=message]").fill("Sent without JavaScript.");
  await nojs.getByRole("button", { name: "Send message" }).click();
  await nojs.waitForLoadState("load");
  check(/ENQ-|thank/i.test(await nojs.locator("body").innerText()), "no JavaScript: the contact form posts and thanks the visitor");
  check(await db(`select count(*) from public.crm_leads l join public.crm_contacts c on c.id = l.contact_id where c.full_name = 'No Script ${ts}' and l.description like '%Region: Northern%'`) === "1",
    "no JavaScript: the lead has the region chosen in the select");
  await nojs.goto(`${SITE}/careers`);
  const roleSel = nojs.locator("select[name=opening_choice]");
  const interest = nojs.locator("select[name=interest]");
  check((await roleSel.count()) === 1 && await roleSel.evaluate((s) => getComputedStyle(s).appearance) === "none", "no JavaScript: Careers shows the restyled role picker");
  check(await interest.isVisible() && await interest.evaluate((s) => getComputedStyle(s).appearance) === "none", "no JavaScript: Careers area of interest is restyled");
  await nojs.context().close();

  // Portal -------------------------------------------------------------------------------------------------------------------
  const mgr = watch(await (await context(1440)).newPage(), "manager 1440");
  await mgr.goto(`${PORTAL}/login`);
  await mgr.getByLabel("Email").fill("manager@demo.test");
  await mgr.getByLabel("Password").fill("harness-password");
  await mgr.getByRole("button", { name: /sign in/i }).click();
  await mgr.waitForURL((u) => !u.pathname.startsWith("/login"));
  await mgr.goto(`${PORTAL}/management`);
  await hydrated(mgr, "Brand");
  const brand = mgr.getByRole("combobox", { name: "Brand", exact: true });
  await brand.focus();
  await mgr.keyboard.press("y");
  check(await brand.getAttribute("aria-expanded") === "true" && await mgr.locator(`#${await brand.getAttribute("aria-activedescendant")}`).innerText() === "Yazz",
    "1440 portal: typing a letter opens the brand list on the first match");
  await mgr.waitForTimeout(350);
  await mgr.screenshot({ path: `${OUT}/portal-1440-management-brand-open.png` });
  await mgr.keyboard.press("Enter");
  await mgr.getByRole("button", { name: "Apply" }).click();
  await mgr.waitForURL(/brand=/);
  check(await mgr.locator("#brand option:checked").innerText() === "Yazz", "1440 portal: the management brand filter applies the choice");

  // A form: region groups, a controlled select that changes the form, a disabled select.
  await mgr.goto(`${PORTAL}/systems/crm/organisations/new`);
  await hydrated(mgr, "Region (optional)");
  const orgRegion = mgr.getByRole("combobox", { name: "Region (optional)", exact: true });
  await orgRegion.click();
  const orgList = mgr.locator(`#${await orgRegion.getAttribute("aria-controls")}`);
  check(await orgList.getByRole("group", { name: "Ghana", exact: true }).count() === 1 && await orgList.getByRole("group", { name: "Ghana", exact: true }).getByRole("option", { name: "Ashanti" }).count() === 1,
    "1440 portal: region options keep their groups");
  await mgr.waitForTimeout(350);
  await mgr.screenshot({ path: `${OUT}/portal-1440-organisation-region-open.png` });
  await orgList.getByRole("option", { name: "Ashanti" }).click();
  check(/rgba\(18, 163, 196/.test(await mgr.locator("#region_id").evaluate((s) => getComputedStyle(s).boxShadow)),
    "1440 portal: after a mouse pick the field keeps the portal focus ring");
  // Inside a disabled <fieldset> (a form in view mode or while saving): not reachable, not opening, not changing.
  const orgKind = mgr.getByRole("combobox", { name: "Kind", exact: true });
  const kindBefore = await mgr.locator("#kind").inputValue();
  await mgr.locator("#kind").evaluate((s) => { s.closest("fieldset").disabled = true; });
  await mgr.waitForFunction(() => document.querySelector("#kind").parentElement.querySelector("[data-lx-select-combo]").getAttribute("aria-disabled") === "true");
  check(await orgKind.getAttribute("tabindex") === "-1" && await orgKind.getAttribute("aria-disabled") === "true", "1440 portal: inside a disabled fieldset the dropdown is disabled and out of the Tab order");
  await orgKind.click({ force: true });
  await orgKind.focus();
  await mgr.keyboard.press("ArrowDown");
  await mgr.keyboard.press("Enter");
  check(await orgKind.getAttribute("aria-expanded") === "false" && await mgr.locator("#kind").inputValue() === kindBefore,
    "1440 portal: inside a disabled fieldset it does not open and its value does not change");
  await mgr.locator("#kind").evaluate((s) => { s.closest("fieldset").disabled = false; });
  await mgr.waitForFunction(() => !document.querySelector("#kind").parentElement.querySelector("[data-lx-select-combo]").hasAttribute("aria-disabled"));
  check(await orgKind.getAttribute("tabindex") === "0", "1440 portal: enabled again when the fieldset is");

  const admin = watch(await (await context(1440)).newPage(), "admin 1440");
  await admin.goto(`${PORTAL}/login`);
  await admin.getByLabel("Email").fill("admin@demo.test");
  await admin.getByLabel("Password").fill("harness-password");
  await admin.getByRole("button", { name: /sign in/i }).click();
  await admin.waitForURL((u) => !u.pathname.startsWith("/login"));
  await admin.goto(`${PORTAL}/systems/complaints/new`);
  await hydrated(admin, "What it is about");
  const hint = admin.locator(".field", { has: admin.locator("#severity") }).locator(".hint");
  check(!/always at least High/.test(await hint.innerText()), "1440 portal: complaint form starts with the usual severity hint");
  await choose(admin, "What it is about", "Health or safety concern");
  check(/always at least High/.test(await hint.innerText()) && await admin.locator("#category").inputValue() === "health_safety",
    "1440 portal: a controlled select (category) updates the form when chosen in the dropdown");
  // A required dropdown (ProductForm's brand): the form posts as before (it uses the server's checks); with the
  // browser's own checks, the message shows under the field and focus lands on the dropdown, not the hidden select.
  const mktP = watch(await (await context(1440)).newPage(), "marketing 1440");
  await mktP.goto(`${PORTAL}/login`);
  await mktP.getByLabel("Email").fill("marketing@demo.test");
  await mktP.getByLabel("Password").fill("harness-password");
  await mktP.getByRole("button", { name: /sign in/i }).click();
  await mktP.waitForURL((u) => !u.pathname.startsWith("/login"));
  await mktP.goto(`${PORTAL}/systems/products/new`);
  await hydrated(mktP, "Brand");
  const newBrand = mktP.locator("[data-lx-select-combo]").and(mktP.getByRole("combobox", { name: "Brand", exact: true }));
  await mktP.locator("#brand_id").evaluate((s) => s.form.removeAttribute("novalidate"));
  await mktP.getByRole("button", { name: "Create product" }).click();
  await mktP.waitForTimeout(200);
  const msgId = (await newBrand.getAttribute("aria-describedby")) ?? "";
  check(await newBrand.evaluate((el) => el === document.activeElement) && await newBrand.getAttribute("aria-invalid") === "true"
    && msgId.includes("validity") && (await mktP.locator(`#${msgId.split(" ").pop()}`).innerText()).length > 0,
    "1440 portal: an empty required brand shows the message under it and focus lands on the dropdown", msgId);
  await choose(mktP, "Brand", "Yazz");
  check(!(await mktP.locator("[id$=-validity]").count()) && await newBrand.getAttribute("aria-invalid") !== "true", "1440 portal: choosing a brand clears the message");
  await mktP.locator("label[for=name]").click();
  await mktP.locator("label[for=brand_id]").click();
  check(await newBrand.evaluate((el) => el === document.activeElement), "1440 portal: afterwards a label click still lands on the dropdown");
  await mktP.context().close();

  await admin.goto(`${PORTAL}/systems/products`);
  await admin.locator("main table a").first().click();
  await admin.waitForURL(/\/systems\/products\/[0-9a-f-]{36}/);
  await hydrated(admin, "Brand");
  const pBrand = admin.getByRole("combobox", { name: "Brand", exact: true });
  check(await pBrand.getAttribute("aria-disabled") === "true" && await pBrand.getAttribute("tabindex") === "-1", "1440 portal: a disabled select gives a disabled dropdown");
  await pBrand.click({ force: true });
  check(await pBrand.getAttribute("aria-expanded") === "false", "1440 portal: a disabled dropdown does not open");

  // Date fields (packages/ui DateInput) --------------------------------------------------------------------------------------
  await mgr.goto(`${PORTAL}/management`);
  const fromWrap = mgr.locator("[data-lx-date]", { has: mgr.locator("#from") });
  const fromTrigger = fromWrap.locator("[data-lx-date-trigger]");
  await fromTrigger.waitFor();
  const fromInput = mgr.locator("#from");
  const dfFace = await fromInput.evaluate((el) => ({ pr: getComputedStyle(el).paddingRight, ind: getComputedStyle(el, "::-webkit-calendar-picker-indicator").opacity }));
  check(dfFace.pr === "42px" && await fromWrap.locator("span[aria-hidden] svg").count() === 1, "1440 date: the field has the teal calendar icon in place of the browser's", dfFace);
  const startFrom = await fromInput.inputValue();
  const dlg = mgr.locator("[data-lx-date-dialog]");
  const focusedDay = () => mgr.evaluate(() => document.activeElement?.id?.slice(-10) ?? "");
  const shift = (v, days) => new Date(Date.parse(`${v}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
  await fromTrigger.click();
  await dlg.waitFor();
  await mgr.waitForTimeout(350);
  await mgr.screenshot({ path: `${OUT}/portal-1440-management-from-calendar.png` });
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthOf = (v) => `${MONTHS[Number(v.slice(5, 7)) - 1]} ${v.slice(0, 4)}`;
  check(await dlg.getAttribute("role") === "dialog" && await dlg.getAttribute("aria-modal") === "true" && await dlg.getByRole("heading").innerText() === monthOf(startFrom),
    "1440 date: the calendar is a dialog named by its month and year", await dlg.getByRole("heading").innerText());
  check(await focusedDay() === startFrom && await dlg.locator(`[aria-selected=true]`).count() === 1, "1440 date: focus starts on the chosen day, shown as selected");
  check(await dlg.locator("[aria-current=date]").count() <= 1 && await dlg.getByRole("button", { name: "Clear" }).count() === 0 && await dlg.getByRole("button", { name: "Today" }).count() === 1,
    "1440 date: today is marked, Today is offered and Clear is not (the field is required)");
  check(JSON.stringify(await dlg.locator("th").evaluateAll((ths) => ths.map((t) => t.getAttribute("abbr")))) === JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    "1440 date: weeks run Monday to Sunday");
  await mgr.keyboard.press("ArrowRight");
  check(await focusedDay() === shift(startFrom, 1), "1440 date: Right Arrow moves a day");
  await mgr.keyboard.press("ArrowDown");
  check(await focusedDay() === shift(startFrom, 8), "1440 date: Down Arrow moves a week");
  await mgr.keyboard.press("Home");
  const home = await focusedDay();
  check(new Date(`${home}T00:00:00Z`).getUTCDay() === 1, "1440 date: Home goes to the Monday", home);
  await mgr.keyboard.press("End");
  check(await focusedDay() === shift(home, 6), "1440 date: End goes to the Sunday");
  await mgr.keyboard.press("PageDown");
  const nextMonth = await focusedDay();
  check(Number(nextMonth.slice(5, 7)) === (Number(shift(home, 6).slice(5, 7)) % 12) + 1, "1440 date: Page Down moves a month", nextMonth);
  await mgr.keyboard.press("Shift+PageDown");
  check(Number((await focusedDay()).slice(0, 4)) === Number(nextMonth.slice(0, 4)) + 1 && await dlg.getByRole("heading").innerText() === monthOf(await focusedDay()),
    "1440 date: Shift Page Down moves a year and the heading follows");
  await mgr.keyboard.press("Shift+PageUp");
  await mgr.keyboard.press("PageUp");
  await mgr.keyboard.press("Escape");
  check(!(await dlg.count()) && await fromInput.inputValue() === startFrom && await fromTrigger.evaluate((el) => el === document.activeElement),
    "1440 date: Escape closes without a change and returns focus to the calendar button");
  await mgr.keyboard.press("Enter");
  await dlg.waitFor();
  await mgr.keyboard.press("ArrowLeft");
  await mgr.keyboard.press("Enter");
  const chosen = shift(startFrom, -1);
  check(await fromInput.inputValue() === chosen && !(await dlg.count()) && await fromTrigger.evaluate((el) => el === document.activeElement),
    "1440 date: Enter chooses the day, closes and returns focus", await fromInput.inputValue());
  await mgr.waitForTimeout(100);
  check(/selected$/.test(await fromWrap.locator("[role=status]").innerText()), "1440 date: the choice is announced", await fromWrap.locator("[role=status]").innerText());
  // Typing still works, and the calendar opens on the typed month.
  await fromInput.fill("2026-01-05");
  await fromTrigger.click();
  check(await dlg.getByRole("heading").innerText() === "January 2026", "1440 date: a typed date opens the calendar on its month");
  await dlg.getByRole("button", { name: "8 January 2026", exact: true }).click();
  check(await fromInput.inputValue() === "2026-01-08", "1440 date: clicking a day chooses it");
  // min and max: days outside are greyed out and cannot be chosen.
  const toInput = mgr.locator("#to");
  const toBefore = await toInput.inputValue();
  await toInput.evaluate((el) => { el.min = "2026-11-10"; el.max = "2026-11-20"; });
  await toInput.fill("2026-11-15");
  await mgr.locator("[data-lx-date]", { has: toInput }).locator("[data-lx-date-trigger]").click();
  const early = dlg.getByRole("button", { name: "9 November 2026, not available", exact: true });
  check(await early.getAttribute("aria-disabled") === "true" && await dlg.getByRole("button", { name: "Previous month" }).isDisabled() && await dlg.getByRole("button", { name: "Next month" }).isDisabled(),
    "1440 date: days before min are greyed out and the months outside cannot be opened");
  await early.click({ force: true });
  check(await toInput.inputValue() === "2026-11-15" && await dlg.count() === 1, "1440 date: a day outside min and max cannot be chosen");
  await mgr.keyboard.press("Escape");
  await toInput.evaluate((el) => { el.removeAttribute("min"); el.removeAttribute("max"); });
  await toInput.fill(toBefore);
  // Posting: the chosen dates go to the address like before.
  await mgr.getByRole("button", { name: "Apply" }).click();
  await mgr.waitForURL(/from=2026-01-08/);
  check(new URL(mgr.url()).searchParams.get("to") === toBefore, "1440 date: Apply posts the dates chosen in the calendar", mgr.url());

  // A form date that is not required: Clear, a reset, and a disabled fieldset.
  await admin.goto(`${PORTAL}/systems/complaints/new`);
  const buyWrap = admin.locator("[data-lx-date]", { has: admin.locator("#purchase_date") });
  const buyTrigger = buyWrap.locator("[data-lx-date-trigger]");
  await buyTrigger.waitFor();
  await buyTrigger.click();
  const aDlg = admin.locator("[data-lx-date-dialog]");
  await aDlg.waitFor();
  await admin.waitForTimeout(350);
  await admin.screenshot({ path: `${OUT}/portal-1440-complaint-purchase-date-calendar.png` });
  await aDlg.getByRole("button", { name: "Today" }).click();
  const todayIso = await admin.evaluate(() => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())).toISOString().slice(0, 10); });
  check(await admin.locator("#purchase_date").inputValue() === todayIso, "1440 date: Today chooses today");
  await buyTrigger.click();
  await aDlg.getByRole("button", { name: "Clear" }).click();
  check(await admin.locator("#purchase_date").inputValue() === "", "1440 date: Clear empties a field that is not required");
  await buyTrigger.click();
  await aDlg.getByRole("button", { name: "Today" }).click();
  await admin.locator("#purchase_date").evaluate((el) => el.form.reset());
  await admin.waitForTimeout(100);
  check(await admin.locator("#purchase_date").inputValue() === "" && !/chosen/.test(await buyTrigger.innerText()), "1440 date: a form reset is picked up");
  await admin.locator("#purchase_date").evaluate((el) => { el.closest("fieldset").disabled = true; });
  await admin.waitForFunction(() => document.querySelector("#purchase_date").parentElement.querySelector("[data-lx-date-trigger]").disabled);
  await buyTrigger.click({ force: true });
  check(!(await aDlg.count()) && await admin.locator("#purchase_date").inputValue() === "", "1440 date: inside a disabled fieldset the calendar does not open");
  await admin.locator("#purchase_date").evaluate((el) => { el.closest("fieldset").disabled = false; });
  // Other screens with a date field, open, for the record.
  for (const [url, id, name] of [["/systems/csr/new", "activity_date", "csr-activity-date"], ["/systems/orders", "from", "orders-from"]]) {
    await admin.goto(`${PORTAL}${url}`);
    const t = admin.locator("[data-lx-date]", { has: admin.locator(`#${id}`) }).locator("[data-lx-date-trigger]");
    if (!(await t.count())) { await admin.locator("main h1").waitFor(); if (!(await t.count())) continue; }
    await t.click();
    await aDlg.waitFor();
    await admin.waitForTimeout(350);
    await admin.screenshot({ path: `${OUT}/portal-1440-${name}-calendar.png` });
    await admin.keyboard.press("Escape");
  }

  // Without JavaScript: the branded field still types and posts.
  const njs = await (await context(1440, { javaScriptEnabled: false })).newPage();
  await njs.context().addCookies(await mgr.context().cookies());
  await njs.goto(`${PORTAL}/management`);
  check(await njs.locator("#from").isVisible() && await njs.locator("#from").evaluate((el) => getComputedStyle(el).paddingRight) === "42px" && !(await njs.locator("[data-lx-date-trigger]").count()),
    "no JavaScript: the date field has the brand face and the browser's own picker");
  await njs.locator("#from").fill("2026-02-02");
  await njs.getByRole("button", { name: "Apply" }).click();
  await njs.waitForURL(/from=2026-02-02/);
  check(true, "no JavaScript: a typed date posts");
  await njs.context().close();

  // Portal on a phone: the phone's own picker on the branded face, no sideways scroll.
  const rep = watch(await (await context(390)).newPage(), "manager 390");
  await rep.goto(`${PORTAL}/login`);
  await rep.getByLabel("Email").fill("manager@demo.test");
  await rep.getByLabel("Password").fill("harness-password");
  await rep.getByRole("button", { name: /sign in/i }).click();
  await rep.waitForURL((u) => !u.pathname.startsWith("/login"));
  await rep.goto(`${PORTAL}/systems/crm/leads`);
  await rep.locator("main h1").waitFor();
  const stage = rep.locator("#stage");
  check(await stage.evaluate((s) => getComputedStyle(s).appearance) === "none" && !(await rep.locator("[data-lx-select-combo]").count()), "390 portal: filters use the phone's own picker on the branded face");
  check(await noSideScroll(rep), "390 portal: no sideways scroll on a filter bar");
  await rep.goto(`${PORTAL}/management`);
  await rep.locator("main h1").waitFor();
  check(!(await rep.locator("[data-lx-date-trigger]").count()) && await rep.locator("#from").evaluate((el) => getComputedStyle(el).paddingRight) === "42px",
    "390 touch: date fields keep the phone's own picker on the branded face");
  await rep.screenshot({ path: `${OUT}/portal-390-management-dates.png` });
  await rep.screenshot({ path: `${OUT}/portal-390-leads.png` });

  check(errors.length === 0, "no errors in the browser console", errors.slice(0, 5));
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
} finally {
  await browser.close();
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
}
console.log(failures ? `${failures} browser check(s) failed` : "All browser checks passed");
process.exit(failures ? 1 : 0);
