// Browser check of the live chat (item 22) at 390 and 1440 px: production builds of the Lexta site and the portal,
// against the local harness database through ../browser/gateway.mjs on port 54401. Build both apps first with
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54401 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness \
//   NEXT_PUBLIC_PORTAL_URL=http://127.0.0.1:3101 TURBO_FORCE=true pnpm build
// then run: HARNESS_THEN="node supabase/tests/local/live-chat/browser.mjs" bash supabase/tests/local/run.sh __none__
// Screenshots go to CHAT_SCREENSHOTS (default: a lexta-chat-screens folder in the temp directory). Every server it
// starts is stopped by its PID at the end.
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
const OUT = process.env.CHAT_SCREENSHOTS || path.join(os.tmpdir(), "lexta-chat-screens");
mkdirSync(OUT, { recursive: true });
const SECRET = "harness-chat-secret-0123456789abcdef0";
const { psql } = await import(`${ROOT}/supabase/tests/local/forms/rpc_shim.mjs`);
const { choose } = await import(`${ROOT}/supabase/tests/local/browser/choose.mjs`);

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

// Seed: staff logins (password: harness-password through the gateway) and the shared chat secret.
await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000b001', 'care@lexta.test', '{"role":"customer_care"}', '{"full_name":"Efua Asante"}'),
  ('00000000-0000-0000-0000-00000000b002', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000b003', 'rep@lexta.test', '{"role":"sales_rep"}', '{"full_name":"Yaw Rep"}')`);
await q("insert into private.chat_intake_secret (secret) values (:'s')", { s: SECRET });

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  p.stdout.on("data", () => {});
  p.stderr.on("data", (d) => { if (/error/i.test(String(d))) process.stdout.write(`[${args.join(" ").slice(0, 30)}] ${d}`); });
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
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  NEXT_PUBLIC_PORTAL_URL: "http://127.0.0.1:3101", CHAT_INTAKE_SECRET: SECRET };
run(`${ROOT}/apps/lexta/node_modules/.bin/next`, ["start", "-p", "3100", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/lexta`, env });
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3101", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);

const SITE = "http://127.0.0.1:3100";
const PORTAL = "http://127.0.0.1:3101";
const browser = await chromium.launch();
try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(SITE);
  await waitFor(`${PORTAL}/login`);

  // Site, desktop -----------------------------------------------------------------------------------------
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const site = await desk.newPage();
  const jsBefore = [];
  site.on("request", (r) => { if (r.resourceType() === "script") jsBefore.push(r.url()); });
  await site.goto(SITE, { waitUntil: "networkidle" });
  const scriptsAtLoad = jsBefore.length;
  const launcher = site.getByRole("button", { name: "Chat with the Lexta team" });
  check(await launcher.isVisible(), "1440: the chat button shows on the home page");
  await site.screenshot({ path: `${OUT}/site-1440-home.png` });
  await launcher.click();
  await site.getByRole("dialog", { name: "Chat with Lexta" }).waitFor();
  check(jsBefore.length > scriptsAtLoad, "1440: the chat panel code loads only when the visitor asks for it", { atLoad: scriptsAtLoad, after: jsBefore.length });
  check(await site.evaluate(() => document.activeElement?.getAttribute("name")) === "name", "1440: focus moves to the name field");
  await site.screenshot({ path: `${OUT}/site-1440-form.png` });
  // Empty submit shows field errors.
  await site.getByRole("button", { name: "Start chat" }).click();
  await site.getByText("Please enter your name").waitFor();
  await site.screenshot({ path: `${OUT}/site-1440-form-errors.png` });
  await site.getByLabel("Your name").fill("Ama Owusu");
  await site.getByLabel("Email (optional)").fill("ama@example.com");
  await site.getByLabel("How can we help?").fill("Hello, where can I buy Yazz biscuits in Kumasi?");
  await site.getByRole("button", { name: "Start chat" }).click();
  await site.getByRole("log").getByText("where can I buy Yazz").waitFor();
  const auto = await site.getByRole("log").innerText();
  check(auto.includes("A member of the team will reply shortly") || auto.includes("[PLACEHOLDER: Lexta chat office hours]"), "1440: the fixed reply or out of hours note shows after the first message", auto);
  await site.screenshot({ path: `${OUT}/site-1440-thread.png` });
  const conv = JSON.parse(await site.evaluate(() => localStorage.getItem("lexta-chat-v1")));
  check(/^[0-9a-f]{64}$/.test(conv?.token ?? ""), "1440: the conversation id and token are kept in localStorage");

  // Portal, desktop: customer care answers -------------------------------------------------------------------
  const pdesk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const portal = await pdesk.newPage();
  await portal.goto(`${PORTAL}/login`);
  await portal.getByLabel("Email").fill("care@lexta.test");
  await portal.getByLabel("Password").fill("harness-password");
  await portal.getByRole("button", { name: /sign in/i }).click();
  await portal.waitForURL(`${PORTAL}/`);
  check(await portal.getByRole("link", { name: "Live chat inbox", exact: true }).isVisible(), "customer care sees Live chat inbox in the menu");
  await portal.goto(`${PORTAL}/systems/chat`);
  await portal.getByText("Ama Owusu").first().waitFor();
  check(await portal.getByText("Unread", { exact: true }).first().isVisible(), "the inbox marks the new chat unread");
  await portal.screenshot({ path: `${OUT}/portal-1440-inbox.png`, fullPage: true });
  await portal.getByRole("link", { name: /Ama Owusu/ }).click();
  await portal.waitForURL(/\/systems\/chat\/[0-9a-f-]{36}/);
  await portal.getByRole("button", { name: "Assign to me" }).click();
  await portal.getByText("Assigned to you.").waitFor();
  await portal.getByLabel("Reply to the visitor").fill("Hello Ama, Yazz is at Melcom Adum in Kumasi. Anything else?");
  await portal.getByRole("button", { name: "Send reply" }).click();
  await portal.getByText("Sent.").waitFor();
  await portal.getByLabel("Internal note").check();
  await portal.getByLabel("Internal note (only staff see this)").fill("Possible stockist lead, owns a shop");
  await portal.getByRole("button", { name: "Add note" }).click();
  await portal.getByText("Note added").waitFor();
  await portal.screenshot({ path: `${OUT}/portal-1440-thread.png`, fullPage: true });

  // The visitor sees the reply without reloading, never the note.
  await site.getByRole("log").getByText("Melcom Adum").waitFor({ timeout: 15000 });
  const visitorLog = await site.getByRole("log").innerText();
  check(visitorLog.includes("Efua, Lexta") && !visitorLog.includes("stockist lead") && !visitorLog.includes("Asante"),
    "the visitor sees the reply by polling, with the first name only and no internal note", visitorLog);
  await site.screenshot({ path: `${OUT}/site-1440-reply.png` });

  // A visitor message appears in the open portal thread without a manual refresh.
  await site.getByLabel("Your message").fill("Thank you! Do you deliver to shops?");
  await site.keyboard.press("Enter");
  await portal.getByText("Do you deliver to shops?").waitFor({ timeout: 20000 });
  check(true, "a new visitor message appears in the portal thread without a manual refresh");

  // Reload keeps the conversation.
  await site.reload({ waitUntil: "networkidle" });
  await site.getByRole("button", { name: "Chat with the Lexta team" }).click();
  await site.getByRole("log").getByText("Do you deliver to shops?").waitFor();
  check(true, "1440: after a reload the conversation is still there");

  // Convert to a lead and a complaint, with links back.
  await portal.getByRole("button", { name: "Make a CRM lead" }).click();
  await portal.waitForURL(/made=lead/);
  const leadLink = portal.getByRole("link", { name: "Live chat with Ama Owusu" });
  check(await leadLink.isVisible(), "a CRM lead is made from the chat and linked");
  await choose(portal, "What is the complaint about?", { value: "availability" });
  await portal.getByRole("button", { name: "Log a complaint" }).click();
  await portal.waitForURL(/made=complaint/);
  check(await portal.getByRole("link", { name: /^LX-\d{4}-\d{4}$/ }).isVisible(), "a complaint is logged from the chat and linked");
  await portal.screenshot({ path: `${OUT}/portal-1440-converted.png`, fullPage: true });
  await leadLink.click();
  await portal.waitForURL(/\/systems\/crm\/leads\//);
  await portal.getByRole("link", { name: /^LC-[0-9A-F]{8}$/ }).waitFor({ timeout: 15000 }).catch(() => {});
  check(await portal.getByRole("link", { name: /^LC-[0-9A-F]{8}$/ }).isVisible() && await portal.getByText("Website live chat").first().isVisible(),
    "the lead shows its source and links back to the chat");
  await portal.screenshot({ path: `${OUT}/portal-1440-lead.png` });
  await portal.goBack();
  await portal.getByRole("link", { name: /^LX-\d{4}-\d{4}$/ }).click();
  await portal.waitForURL(/\/systems\/complaints\//);
  await portal.getByRole("link", { name: /^LC-[0-9A-F]{8}$/ }).waitFor({ timeout: 15000 }).catch(() => {});
  await portal.screenshot({ path: `${OUT}/portal-1440-complaint.png` });
  check(await portal.getByRole("link", { name: /^LC-[0-9A-F]{8}$/ }).isVisible(), "the complaint links back to the chat");
  await portal.goBack();
  await portal.getByRole("button", { name: "Close chat" }).click();
  await portal.getByText("Chat closed.").waitFor();
  check(await portal.getByRole("button", { name: "Add note" }).isVisible(), "a closed chat only takes internal notes");
  await site.getByRole("log").getByText("Our team closed this chat").waitFor({ timeout: 15000 });
  check(true, "the visitor sees that the chat was closed");
  await portal.getByRole("button", { name: "Reopen chat" }).click();
  await portal.getByText("Chat reopened.").waitFor();

  // Phone ---------------------------------------------------------------------------------------------------
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const m = await phone.newPage();
  await m.goto(SITE, { waitUntil: "networkidle" });
  const btn = m.getByRole("button", { name: "Chat with the Lexta team" });
  const box = await btn.boundingBox();
  check(box && box.width === 56 && box.x + box.width <= 390 - 15 && box.y + box.height <= 844 - 15 && box.y > 58,
    "390: a 56 px round button in the bottom right corner, clear of the top bar", box);
  await m.screenshot({ path: `${OUT}/site-390-home.png` });
  // The menu drawer covers the chat button.
  await m.getByRole("button", { name: "Open menu" }).click();
  await sleep(400);
  const onTop = await m.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("[aria-label='Chat with the Lexta team']") !== null,
    { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  check(!onTop, "390: the open menu covers the chat button");
  await m.screenshot({ path: `${OUT}/site-390-menu-open.png` });
  await m.keyboard.press("Escape");
  await sleep(400);
  // Keyboard: Tab to the button, Enter opens, Escape closes and returns focus.
  await btn.focus();
  await m.keyboard.press("Enter");
  await m.getByRole("dialog", { name: "Chat with Lexta" }).waitFor();
  await sleep(100);
  check(await m.evaluate(() => document.activeElement?.getAttribute("name")) === "name", "390: keyboard opens the panel with focus on the name field");
  const anim = await m.evaluate(() => getComputedStyle(document.getElementById("lx-chat-panel")).animationName);
  check(anim === "none", "390: no opening animation with reduced motion", anim);
  const scroll = await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  const panelBox = await m.locator("#lx-chat-panel").boundingBox();
  check(scroll && panelBox.x >= 8 && panelBox.x + panelBox.width <= 382 && panelBox.y >= 58, "390: the panel fits the screen under the top bar, no sideways scroll", panelBox);
  await m.screenshot({ path: `${OUT}/site-390-form.png` });
  // Lost answers: the next start or send reaches the server, then the browser sees a timeout. Trying again reuses
  // the same id, so nothing is saved twice.
  let dropNext = 0;
  await m.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    if (dropNext > 0 && body?.action !== "read") {
      dropNext -= 1;
      await route.fetch();
      return route.abort("timedout");
    }
    return route.continue();
  });
  await m.getByLabel("Your name").fill("Kofi Mensah");
  await m.getByLabel("Phone (optional)").fill("024 555 0202");
  await m.getByLabel("How can we help?").fill("My Hooch pack was opened when I bought it.");
  dropNext = 1;
  await m.getByRole("button", { name: "Start chat" }).click();
  await m.getByText("Sorry, that did not go through").waitFor();
  await m.getByRole("button", { name: "Start chat" }).click();
  await m.getByRole("log").getByText("Hooch pack").waitFor();
  const firstLine = await m.getByRole("log").innerText();
  check(!firstLine.includes("Sending..."), "390: the first message shows as sent once the chat starts", firstLine);
  check(await q("select count(*) from public.chat_conversations where visitor_name = 'Kofi Mensah'") === "1",
    "390: retrying a start after a lost answer makes one chat");
  dropNext = 1;
  await m.getByLabel("Your message").fill("The batch code is 2611A");
  await m.keyboard.press("Enter");
  await m.getByText("Sorry, that did not go through").waitFor();
  check(await m.getByLabel("Your message").inputValue() === "The batch code is 2611A", "390: a failed send keeps the message in the box");
  await m.keyboard.press("Enter");
  await m.getByRole("log").getByText("2611A").first().waitFor();
  await sleep(4500);
  check(await q("select count(*) from public.chat_messages where body = 'The batch code is 2611A'") === "1"
    && await m.getByRole("log").getByText("The batch code is 2611A").count() === 1,
    "390: retrying a send after a lost answer saves and shows it once");
  await m.unroute("**/api/chat");
  await m.screenshot({ path: `${OUT}/site-390-thread.png` });
  await m.keyboard.press("Escape");
  await sleep(150);
  check(await m.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Chat with the Lexta team", "390: Escape closes the panel and focus returns to the button");
  // Storage blocked: the chat still opens (it simply does not survive a reload).
  const blocked = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  const b = await blocked.newPage();
  const errors = [];
  b.on("pageerror", (e) => errors.push(String(e)));
  await b.goto(SITE, { waitUntil: "networkidle" });
  await b.getByRole("button", { name: "Chat with the Lexta team" }).click();
  await b.getByLabel("Your name").waitFor();
  check(errors.length === 0, "390: with storage blocked the chat still opens without errors", errors);

  // Portal, phone ---------------------------------------------------------------------------------------------
  const pphone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pm = await pphone.newPage();
  await pm.goto(`${PORTAL}/login`);
  await pm.getByLabel("Email").fill("admin@lexta.test");
  await pm.getByLabel("Password").fill("harness-password");
  await pm.getByRole("button", { name: /sign in/i }).click();
  await pm.waitForURL(`${PORTAL}/`);
  await pm.goto(`${PORTAL}/systems/chat`);
  await pm.getByText("Kofi Mensah").first().waitFor();
  check(await pm.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "390: the inbox has no sideways scroll");
  await pm.screenshot({ path: `${OUT}/portal-390-inbox.png`, fullPage: true });
  await pm.getByRole("link", { name: /Kofi Mensah/ }).click();
  await pm.waitForURL(/\/systems\/chat\/[0-9a-f-]{36}/);
  await pm.getByLabel("Reply to the visitor").fill("Sorry to hear that, Kofi. Can you send the batch code?");
  await pm.getByRole("button", { name: "Send reply" }).click();
  await pm.getByText("Sent.").waitFor();
  check(await pm.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "390: the thread has no sideways scroll");
  await pm.screenshot({ path: `${OUT}/portal-390-thread.png`, fullPage: true });
  await m.getByRole("button", { name: "Chat with the Lexta team" }).click();
  await m.getByRole("log").getByText("send the batch code").waitFor({ timeout: 15000 });
  const adminName = await m.getByRole("log").innerText();
  check(adminName.includes("Akua, Lexta"), "390: the visitor sees the admin's first name", adminName);
  await m.screenshot({ path: `${OUT}/site-390-reply.png` });

  // A sales rep has no inbox.
  const rep = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await rep.goto(`${PORTAL}/login`);
  await rep.getByLabel("Email").fill("rep@lexta.test");
  await rep.getByLabel("Password").fill("harness-password");
  await rep.getByRole("button", { name: /sign in/i }).click();
  await rep.waitForURL(`${PORTAL}/`);
  check(!(await rep.getByRole("link", { name: "Live chat inbox", exact: true }).count()), "a sales rep does not see the inbox in the menu");
  await rep.goto(`${PORTAL}/systems/chat`);
  check(await rep.getByText("Your role does not include the live chat inbox").isVisible(), "a sales rep opening the inbox address is told it is not in their role");
  check(!(await rep.getByText("Ama Owusu").count()), "a sales rep sees no chats");

  // The API refuses other sites.
  const cross = await fetch(`${SITE}/api/chat`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ action: "start", name: "x", message: "y" }) });
  check(cross.status === 403, "the chat API refuses calls from another site's pages", cross.status);
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
} finally {
  await browser.close();
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
}
console.log(failures ? `${failures} browser check(s) failed` : "All browser checks passed");
process.exit(failures ? 1 : 0);
