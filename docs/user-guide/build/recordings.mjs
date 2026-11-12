// Short screen recordings for the staff user guide (itinerary item 25). Run through ./record.sh, which starts the
// throwaway harness database first (PGHOST and friends set). Seeds the clearly fictional demo data of
// supabase/tests/local/browser/demo-seed.mjs ("Demo Shop Adabraka", "Ama Demo"), starts the local gateway
// (supabase/tests/local/browser/gateway.mjs) and the production builds of the Lexta site and the portal, then acts out
// one task per video at a human pace with Playwright's recordVideo, with a caption bar in the page that says what is
// happening. Desktop videos are 1280x800; field sales is a phone (390x844).
// Each video is converted to MP4 (H.264) with ffmpeg into docs/user-guide/videos; without ffmpeg the WebM is kept.
// Nothing here talks to the real Supabase project, the Vercel previews or any real Lexta domain: outside hosts never
// resolve, and product images that point at them get a plain grey tile.
//
// Environment (all optional):
//   REC_ONLY=02,05        record only these videos (by number)
//   REC_GATEWAY_PORT, REC_SITE_PORT, REC_PORTAL_PORT   default 54401, 3100, 3101 (must match the build, see record.sh)
//   REC_OUT               output folder (default docs/user-guide/videos)
//   REC_SERVER_LOG        file that gets the servers' output
// Every server it starts is stopped by its PID at the end.
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import http from "node:http";
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
const OUT = process.env.REC_OUT || path.resolve(HERE, "../videos");
mkdirSync(OUT, { recursive: true });
const ONLY = (process.env.REC_ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const GW_PORT = process.env.REC_GATEWAY_PORT || "54401";
const SITE_PORT = process.env.REC_SITE_PORT || "3100";
const PORTAL_PORT = process.env.REC_PORTAL_PORT || "3101";
const SITE = `http://127.0.0.1:${SITE_PORT}`;
const PORTAL = `http://127.0.0.1:${PORTAL_PORT}`;
const HAS_FFMPEG = spawnSync("ffmpeg", ["-version"]).status === 0;

const { q, PHOTO_SECRET } = await import(`${ROOT}/supabase/tests/local/browser/demo-seed.mjs`);
const CHAT_SECRET = "guide-video-chat-secret-0123456789abcdef0123456789";
const REC_SECRET = "guide-video-recruit-secret-0123456789abcdef01234567";
// The demo seed moves the counters to 50; set them back to the highest seeded number so a new complaint is
// LX-2026-0005 and a new application LX-APP-2026-0004 in the videos.
await q(`update public.complaint_case_counters c set last_number = coalesce((select max(substring(case_number from '(\\d+)$')::int)
    from public.complaints where case_number like 'LX-' || c.year || '-%'), 0);
  update public.job_application_counters c set last_number = coalesce((select max(substring(reference from '(\\d+)$')::int)
    from public.job_applications where reference like 'LX-APP-' || c.year || '-%'), 0);`);
await q(`insert into private.chat_intake_secret (secret) values ('${CHAT_SECRET}')`);
await q(`insert into private.recruitment_intake_secret (secret) values ('${REC_SECRET}')`);

// Servers --------------------------------------------------------------------------------------------------------------
const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.REC_SERVER_LOG;
  const tag = path.basename(opts.cwd ?? args[0] ?? cmd);
  p.stdout.on("data", (d) => { if (log) appendFileSync(log, `[${tag} out] ${d}`); });
  p.stderr.on("data", (d) => {
    if (log) appendFileSync(log, `[${tag} err] ${d}`);
    if (/error/i.test(String(d))) process.stdout.write(`[${tag}] ${String(d).slice(0, 400)}`);
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
const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-guide-video-store-"));
const RAW = mkdtempSync(path.join(os.tmpdir(), "lexta-guide-video-raw-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, GW_PORT], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${GW_PORT}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  NEXT_PUBLIC_PORTAL_URL: PORTAL, CHAT_INTAKE_SECRET: CHAT_SECRET, RECRUITMENT_INTAKE_SECRET: REC_SECRET, FIELD_PHOTO_SECRET: PHOTO_SECRET,
  REVALIDATE_SECRET: "guide-video-revalidate-secret", SITE_REVALIDATE_URLS: `${SITE}/api/revalidate` };
run(`${ROOT}/apps/lexta/node_modules/.bin/next`, ["start", "-p", SITE_PORT, "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/lexta`, env });
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", PORTAL_PORT, "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);

// Browser and recording helpers -----------------------------------------------------------------------------------------
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const NEAR_ADABRAKA = { latitude: 5.5605, longitude: -0.2102, accuracy: 12 };
const SIZES = { desktop: { width: 1280, height: 800 }, phone: { width: 390, height: 844 } };

// The caption bar and a visible mouse pointer, drawn in the top page only. The caption text survives page loads
// (sessionStorage), so a new page shows the same caption until the next one.
const OVERLAY = (opts) => {
  if (window.top !== window) return;
  const KEY = "__guideCaption";
  const css = `#__guide_cap{position:fixed;left:0;right:0;${opts.capTop ? "top:0" : "bottom:0"};z-index:2147483646;pointer-events:none;
    background:rgba(11,47,61,.94);color:#fff;font:600 ${opts.phone ? 15 : 19}px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
    padding:${opts.phone ? "10px 14px" : "12px 24px"};text-align:center;letter-spacing:.01em;transition:opacity .25s;
    box-shadow:0 ${opts.capTop ? "4px" : "-4px"} 16px rgba(0,0,0,.18)}
    #__guide_cap:empty{opacity:0}
    ${opts.capTop ? "" : "main::after{content:'';display:block;height:64px}"}
    #__guide_ptr{position:fixed;left:0;top:0;width:22px;height:22px;margin:-3px 0 0 -3px;z-index:2147483647;pointer-events:none;
      transition:transform .05s linear;display:${opts.phone ? "none" : "block"}}
    #__guide_tap{position:fixed;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;z-index:2147483647;pointer-events:none;
      background:rgba(242,182,50,.55);border:2px solid rgba(242,182,50,.95);opacity:0;transform:scale(.4);transition:opacity .35s,transform .35s}
    #__guide_tap.on{opacity:1;transform:scale(1);transition:none}`;
  const ensure = () => {
    if (!document.body) return null;
    if (!document.getElementById("__guide_style")) {
      const st = document.createElement("style"); st.id = "__guide_style"; st.textContent = css; document.head.appendChild(st);
    }
    let cap = document.getElementById("__guide_cap");
    if (!cap) { cap = document.createElement("div"); cap.id = "__guide_cap"; cap.setAttribute("aria-hidden", "true"); document.body.appendChild(cap); }
    if (!document.getElementById("__guide_ptr")) {
      const p = document.createElement("div"); p.id = "__guide_ptr";
      p.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l14 8.5-6.2 1.3-3.4 6.2z" fill="#fff" stroke="#0b2f3d" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
      const last = JSON.parse(sessionStorage.getItem("__guidePtr") || "null");
      if (last) p.style.transform = `translate(${last[0]}px,${last[1]}px)`;
      else p.style.transform = "translate(-40px,-40px)";
      document.body.appendChild(p);
    }
    if (!document.getElementById("__guide_tap")) { const t = document.createElement("div"); t.id = "__guide_tap"; document.body.appendChild(t); }
    // Keep the portal's side menu (and its Sign out button) uncovered.
    const aside = !opts.phone && document.querySelector("aside");
    const r = aside && aside.getBoundingClientRect();
    cap.style.left = r && r.left <= 0 && r.width > 0 && r.width < innerWidth / 2 ? `${Math.round(r.right)}px` : "0";
    return cap;
  };
  window.__guideCaption = (t) => {
    try { sessionStorage.setItem(KEY, t); } catch { /* private */ }
    const cap = ensure(); if (cap) cap.textContent = t;
  };
  window.__guidePointer = (x, y) => {
    try { sessionStorage.setItem("__guidePtr", JSON.stringify([x, y])); } catch { /* private */ }
    ensure(); const p = document.getElementById("__guide_ptr"); if (p) p.style.transform = `translate(${x}px,${y}px)`;
  };
  window.__guideTap = (x, y) => {
    ensure(); const t = document.getElementById("__guide_tap"); if (!t) return;
    t.style.left = `${x}px`; t.style.top = `${y}px`; t.classList.add("on");
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.remove("on")));
  };
  const restore = () => { const t = sessionStorage.getItem(KEY); window.__guideCaption(t || ""); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", restore); else restore();
  // Next.js can redraw the body; put the bar back if it goes.
  setInterval(() => { if (!document.getElementById("__guide_cap")) restore(); else ensure(); }, 300);
};

async function context(kind, { record = true, storageState, capTop } = {}) {
  const phone = kind === "phone";
  const ctx = await browser.newContext({
    ...(phone ? { viewport: SIZES.phone, isMobile: true, hasTouch: true } : { viewport: SIZES.desktop }),
    deviceScaleFactor: 1,
    geolocation: NEAR_ADABRAKA, permissions: ["geolocation"],
    ...(storageState ? { storageState } : {}),
    ...(record ? { recordVideo: { dir: RAW, size: SIZES[kind] } } : {}),
  });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => (r.request().resourceType() === "image"
    ? r.fulfill({ status: 200, contentType: "image/svg+xml", body: GREY }) : r.abort()));
  await ctx.addInitScript(OVERLAY, { phone, capTop: capTop ?? phone });
  if (record) open.push(ctx);
  return ctx;
}
/** Signs in without recording and returns the cookies, so a video can start on the right screen. */
async function signedIn(email) {
  const ctx = await context("desktop", { record: false });
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

/** Shows a caption and waits long enough to read it. */
/** Throws if any frame shows a load error, or a "Saving..." that does not go away within a few seconds. */
async function checkScreen(page) {
  for (const f of page.frames()) {
    if (await f.getByText(/We could not load/).count().catch(() => 0)) {
      throw new Error(`the screen shows "We could not load" (${f.url()})`);
    }
  }
  for (let i = 0; ; i += 1) {
    let saving = 0;
    for (const f of page.frames()) saving += await f.getByText(/^\s*Saving\.\.\.\s*$/).count().catch(() => 0);
    if (!saving) return;
    if (i >= 10) throw new Error(`"Saving..." is still showing after 5 seconds (${page.url()})`);
    await sleep(500);
  }
}
async function say(page, text, ms) {
  if (/[\u2013\u2014]| - /.test(text)) throw new Error(`caption has a dash: ${text}`);
  await checkScreen(page);
  await page.evaluate((t) => window.__guideCaption?.(t), text).catch(() => {});
  await sleep(ms ?? Math.max(1800, 900 + text.length * 45));
}
const pointer = new WeakMap();
async function moveTo(page, x, y) {
  const [fx, fy] = pointer.get(page) ?? [SIZES.desktop.width / 2, SIZES.desktop.height / 2];
  const steps = 14;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps; const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const nx = fx + (x - fx) * e; const ny = fy + (y - fy) * e;
    await page.mouse.move(nx, ny);
    await page.evaluate(([a, b]) => window.__guidePointer?.(a, b), [nx, ny]).catch(() => {});
    await sleep(18);
  }
  pointer.set(page, [x, y]);
}
async function point(page, loc) {
  await loc.scrollIntoViewIfNeeded();
  await sleep(150);
  let b = await loc.boundingBox();
  if (!b) return;
  // Keep it clear of the caption bar (and of sticky bars at the edges).
  const vh = page.viewportSize().height;
  if (b.y < 90 || b.y + b.height > vh - 90) {
    await loc.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    await sleep(700);
    b = (await loc.boundingBox()) ?? b;
  }
  await moveTo(page, b.x + Math.min(b.width / 2, 60), b.y + b.height / 2);
}
/** Moves the pointer to the element, waits a moment, then clicks (or taps on the phone). */
async function click(page, loc, { pause = 350 } = {}) {
  await loc.waitFor({ state: "visible" });
  await point(page, loc);
  await sleep(pause);
  const [x, y] = pointer.get(page) ?? [0, 0];
  await page.evaluate(([a, b]) => window.__guideTap?.(a, b), [x, y]).catch(() => {});
  await loc.click();
  await sleep(400);
}
/** Clicks into a field and types at a human pace. */
async function type(page, loc, text, { delay = 45, clear = false } = {}) {
  await click(page, loc, { pause: 200 });
  if (clear) { await loc.fill(""); await sleep(200); }
  await loc.pressSequentially(text, { delay });
  await sleep(350);
}
/** Points at a drop down and picks an option (the open list of a native drop down does not show in recordings). */
async function choose(page, loc, option) {
  await point(page, loc);
  await sleep(300);
  await loc.selectOption(option);
  await sleep(700);
}
async function scrollTo(page, loc, block = "center") {
  await loc.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b }), block);
  await sleep(900);
}
async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
  await sleep(300);
}

/** Closes the contexts, then joins their videos (in order) into one file and converts it. */
/** Stops one part of a video (closes its context) and returns the raw file. */
async function stop(page) {
  const v = page.video();
  await page.context().close();
  return v.path();
}
async function finish(name, parts) {
  const raws = [];
  open.length = 0;
  for (const p of parts) raws.push(typeof p === "string" ? p : await stop(p));
  const mp4 = path.join(OUT, `${name}.mp4`);
  const webm = path.join(OUT, `${name}.webm`);
  if (!HAS_FFMPEG) {
    if (raws.length > 1) console.log(`  no ffmpeg: ${name} kept as ${raws.length} separate WebM files`);
    raws.forEach((r, i) => copyFileSync(r, raws.length > 1 ? path.join(OUT, `${name}-part${i + 1}.webm`) : webm));
    return;
  }
  // Drop the first moments of each part (the empty page before the first screen loads).
  const inputs = raws.flatMap((r) => ["-ss", "0.6", "-i", r]);
  const filter = raws.map((_, i) => `[${i}:v]fps=25,setsar=1[v${i}]`).join(";")
    + `;${raws.map((_, i) => `[v${i}]`).join("")}concat=n=${raws.length}:v=1:a=0,format=yuv420p[out]`;
  const args = ["-y", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "[out]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-tune", "stillimage", "-movflags", "+faststart", mp4];
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${name}: ${r.stderr}`);
  const dur = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" }).stdout.trim();
  const kb = Math.round(statSync(mp4).size / 1024);
  made.push({ name: `${name}.mp4`, seconds: Math.round(Number(dur)), kb });
  console.log(`  saved ${name}.mp4 (${Math.round(Number(dur))} s, ${kb} KB)`);
}
const made = [];
const open = [];

// A small demo CV (PDF) and a demo photo, made by the browser.
async function makeFiles() {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<body style="font:15px/1.5 Arial;padding:40px;color:#123"><h1>Abena Demo</h1><p>Demo CV for the Lexta user guide videos.
    Not a real person.</p><h2>Experience</h2><p>Line supervisor, Demo Paper Mill, Tema (2019 to 2026).</p></body>`);
  const cv = path.join(STORE, "Abena-Demo-CV.pdf");
  writeFileSync(cv, await page.pdf({ format: "A4" }));
  await page.setContent(`<body style="margin:0;background:#cfe8ef"><div style="display:flex;gap:18px;padding:70px 40px;align-items:flex-end">${
    ["#12a3c4", "#e05a8a", "#f2b632", "#0b2f3d", "#7bc96f", "#12a3c4"].map((c, i) => `<div style="width:90px;height:${180 + (i % 3) * 60}px;background:${c};border-radius:45px 45px 8px 8px"></div>`).join("")
  }</div><div style="position:absolute;left:40px;bottom:30px;font:bold 28px Arial;color:#0b2f3d">Demo school visit</div></body>`);
  const photo = path.join(STORE, "demo-csr-photo.jpg");
  writeFileSync(photo, await page.screenshot({ type: "jpeg", quality: 80 }));
  await page.setContent(`<body style="margin:0;background:#f4efe6"><div style="display:flex;gap:12px;padding:60px">${
    ["#12a3c4", "#e05a8a", "#f2b632", "#0b2f3d", "#7bc96f"].map((c) => `<div style="width:120px;height:300px;background:${c};border-radius:8px"></div>`).join("")}</div></body>`);
  const shelf = path.join(STORE, "demo-shelf.jpg");
  writeFileSync(shelf, await page.screenshot({ type: "jpeg", quality: 80 }));
  await ctx.close();
  return { cv, photo, shelf };
}

// The videos -----------------------------------------------------------------------------------------------------------
const VIDEOS = [];
const video = (num, slug, fn) => VIDEOS.push({ num, name: `${num}-${slug}`, fn });

video("01", "sign-in", async () => {
  const ctx = await context("desktop");
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/login`);
  await settle(page);
  await say(page, "Open the Business System and sign in with the email your admin invited");
  await type(page, page.getByLabel("Email"), "admin@demo.test");
  await say(page, "Type your password", 1200);
  await type(page, page.getByLabel("Password"), "harness-password", { delay: 30 });
  await click(page, page.getByRole("button", { name: /sign in/i }));
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  await settle(page);
  await say(page, "Home shows a tile for each system your role can use");
  for (const name of ["Management dashboard", "CRM", "Complaints", "Live chat inbox"]) {
    await point(page, page.locator("main").getByRole("link", { name: new RegExp(`^${name}`) }));
    await sleep(700);
  }
  await say(page, "The menu on the left lists the same systems. Admin sees all of them", 3000);
  await point(page, page.getByRole("navigation", { name: "Systems" }).getByRole("link", { name: "Home" }));
  await sleep(500);
  await point(page, page.getByRole("navigation", { name: "Systems" }).getByRole("link", { name: "Users and access" }));
  await sleep(600);
  await say(page, "Tap a system to open it, for example Complaints", 300);
  await point(page, page.getByRole("navigation", { name: "Systems" }).getByRole("link", { name: "Complaints" }));
  await sleep(1300);
  await click(page, page.getByRole("navigation", { name: "Systems" }).getByRole("link", { name: "Complaints" }));
  await settle(page);
  await sleep(1500);
  await say(page, "Tap Home to go back to the tiles", 1500);
  await click(page, page.getByRole("navigation", { name: "Systems" }).getByRole("link", { name: "Home" }));
  await settle(page);
  await sleep(1000);
  await say(page, "Your name and role are at the bottom of the menu. Tap Sign out when you finish", 2500);
  await click(page, page.getByRole("button", { name: "Sign out" }));
  await page.waitForURL(/\/login/);
  await settle(page);
  await say(page, "You are back at the sign in page", 2200);
  await finish("01-sign-in", [page]);
});

video("02", "crm-website-lead", async () => {
  const ts = Date.now().toString(36).slice(-4);
  const manager = await signedIn("manager@demo.test");
  const ctx = await context("desktop", { storageState: manager });
  const page = await ctx.newPage();
  await page.goto(`${SITE}/contact-us`);
  await settle(page);
  const form = page.locator("form#contact-enquiry");
  await scrollTo(page, form, "start");
  await say(page, "A visitor sends a message on the Contact Us page of the Lexta website");
  await type(page, form.getByLabel("Full name"), "Kojo Demo");
  await type(page, form.getByLabel("Email"), `kojo.demo.${ts}@example.com`, { delay: 25 });
  await type(page, form.getByLabel("Phone"), "024 000 0303");
  await type(page, form.getByLabel("Company or organisation"), "Demo Traders Cape Coast");
  await choose(page, form.getByLabel("Region"), { label: "Central" });
  await type(page, form.getByLabel("Your message"), "We run 12 shops in Cape Coast and want to stock Yazz.", { delay: 30 });
  await click(page, form.getByRole("button", { name: "Send message" }));
  await form.locator("[data-form-message]").first().waitFor({ timeout: 20000 });
  await scrollTo(page, form.locator("[data-form-message]").first());
  await say(page, "The website thanks the visitor. The message is now a lead in the CRM", 3000);

  await page.goto(`${PORTAL}/systems/crm/leads`);
  await settle(page);
  await say(page, "In the Business System, open CRM. Website leads arrive in the Leads tab at stage New");
  const link = page.locator("main").getByRole("link", { name: /Kojo Demo|Demo Traders Cape Coast|Cape Coast/ }).first();
  await click(page, link);
  await page.locator("main h1").waitFor();
  await settle(page);
  await say(page, "It shows the source, Website contact form, and what the visitor wrote", 3000);
  await say(page, "It goes to the website lead manager first. To hand it on, choose the Owner and tap Set owner", 1200);
  await choose(page, page.getByLabel("Owner", { exact: true }), { label: "Yaw Demo" });
  await click(page, page.getByRole("button", { name: "Set owner" }));
  await page.getByText(/Owner: Yaw Demo/).waitFor({ timeout: 15000 });
  await sleep(1200);
  await scrollTo(page, page.getByRole("heading", { name: "Stage" }));
  await say(page, "After the first call, move it on: tap Contacted under Stage", 1500);
  await click(page, page.getByRole("radio", { name: "Contacted" }));
  await click(page, page.getByRole("button", { name: "Change stage" }));
  await settle(page);
  await sleep(800);
  await scrollTo(page, page.getByRole("heading", { name: "Timeline" }));
  await say(page, "Log the call on the timeline so the team can see what happened", 1500);
  await choose(page, page.getByLabel("Type", { exact: true }), { label: "Call" });
  await type(page, page.getByLabel("What happened"), "Called Kojo Demo. Sending the Yazz price list tomorrow.", { delay: 30 });
  await click(page, page.getByRole("button", { name: "Add to timeline" }));
  await settle(page);
  await sleep(800);
  await scrollTo(page, page.locator("main h1"), "start");
  await say(page, "The lead now has an owner, the stage Contacted and a call on its timeline", 3200);
  await finish("02-crm-website-lead", [page]);
});

let files;
video("03", "complaints", async () => {
  const care = await signedIn("care@demo.test");
  const ctx = await context("desktop", { storageState: care });
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/systems/complaints`);
  await settle(page);
  await say(page, "A customer calls about a product. Open Complaints and tap Log a complaint");
  await click(page, page.locator("main").getByRole("link", { name: "Log a complaint" }));
  await page.locator("main h1", { hasText: "Log a complaint" }).waitFor();
  await settle(page);
  await say(page, "Search for the customer first. If they are new, type their details", 2200);
  await type(page, page.getByLabel("Name", { exact: true }), "Adjoa Demo");
  await type(page, page.getByLabel("Phone", { exact: true }), "024 000 0404");
  await say(page, "Say how it came in, what it is about and how serious it is", 1500);
  await choose(page, page.getByLabel("How it came in"), { label: "Phone" });
  await choose(page, page.getByLabel("What it is about"), { label: "Packaging" });
  await choose(page, page.getByLabel("Severity"), { label: "Normal" });
  await say(page, "Type what the customer said", 1200);
  await type(page, page.getByLabel("What the customer said"), "The seal on a Hooch cereal pack was broken when she opened it.", { delay: 30 });
  await choose(page, page.getByLabel("Brand", { exact: true }), { label: "Hooch" });
  await type(page, page.getByLabel("Batch or lot number"), "H-DEMO-221");
  await scrollTo(page, page.getByRole("button", { name: "Log complaint" }));
  await say(page, "Leave yourself as the owner and tap Log complaint", 1500);
  await click(page, page.getByRole("button", { name: "Log complaint" }));
  await page.locator("main h1", { hasText: /^LX-\d{4}-\d{4}$/ }).waitFor({ timeout: 20000 });
  await settle(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await point(page, page.locator("main h1"));
  await say(page, "The complaint gets a case number and target times to respond and resolve", 3200);

  await scrollTo(page, page.getByRole("heading", { name: "Status" }));
  await say(page, "Call the customer back, then tap Acknowledged and Change status", 1500);
  await click(page, page.getByRole("radio", { name: "Acknowledged" }));
  await click(page, page.getByRole("button", { name: "Change status" }));
  await settle(page);
  await sleep(1000);
  await scrollTo(page, page.getByRole("heading", { name: "Timeline" }));
  await say(page, "Log each call or email on the timeline", 1300);
  await choose(page, page.getByLabel("Type", { exact: true }), { label: "Call" });
  await type(page, page.getByLabel("What happened"), "Called Adjoa Demo. Sending a replacement pack to her shop.", { delay: 30 });
  await click(page, page.getByRole("button", { name: "Add to timeline" }));
  await settle(page);
  await sleep(800);
  await scrollTo(page, page.getByRole("heading", { name: "Status" }));
  await say(page, "When it is sorted, tap Resolved and say how it was resolved", 1500);
  await click(page, page.getByRole("radio", { name: "Resolved" }));
  await sleep(600);
  const how = page.getByLabel(/How it was resolved/);
  await type(page, how, "Replacement pack delivered. Customer is happy.", { delay: 30 });
  const cause = page.getByLabel(/Root cause/);
  if (await cause.count()) await type(page, cause, "Seal damaged in transport.", { delay: 30 });
  await click(page, page.getByRole("button", { name: "Change status" }));
  await settle(page);
  await sleep(800);
  await scrollTo(page, page.locator("main h1"), "start");
  await say(page, "The case is now Resolved. Close it when the customer is satisfied", 3200);
  await finish("03-complaints", [page]);
});

video("04", "recruitment", async () => {
  const hrState = await signedIn("hr@demo.test");
  const ctx = await context("desktop", { storageState: hrState });
  const page = await ctx.newPage();
  await page.goto(`${SITE}/careers`);
  await settle(page);
  const role = page.locator("button[aria-expanded]", { hasText: "Production Line Supervisor" }).first();
  await scrollTo(page, role);
  await say(page, "On the Careers page of the website, a visitor opens a role and taps Apply for this role");
  await click(page, role);
  await sleep(800);
  await click(page, page.getByRole("link", { name: /apply for this role/i }).first());
  await sleep(900);
  const form = page.locator("form").filter({ has: page.locator("input[name=cv]") }).first();
  await scrollTo(page, form, "start");
  await say(page, "They fill in their details and attach a CV", 1500);
  await type(page, form.locator("input[name=name]"), "Abena Demo");
  await type(page, form.locator("input[name=email]"), `abena.demo.${Date.now().toString(36).slice(-4)}@example.com`, { delay: 25 });
  await type(page, form.locator("input[name=phone]"), "020 000 0505");
  await point(page, form.getByRole("button", { name: /Attach your CV/ }));
  await form.locator("input[name=cv]").setInputFiles(files.cv);
  await sleep(1000);
  await click(page, form.locator("input[name=consent]"));
  await click(page, form.locator("button[type=submit]"));
  await form.locator("[data-form-message]").first().waitFor({ timeout: 30000 });
  await scrollTo(page, form.locator("[data-form-message]").first());
  await say(page, "The application is sent with a reference number", 2600);

  await page.goto(`${PORTAL}/systems/recruitment`);
  await settle(page);
  await say(page, "In the Business System, open Recruitment. New applications arrive at stage New");
  await click(page, page.locator("main").getByRole("link", { name: "Abena Demo" }).first());
  await page.locator("main h1", { hasText: "Abena Demo" }).waitFor();
  await settle(page);
  await say(page, "Take the application: choose yourself as Owner and tap Set owner", 1300);
  await choose(page, page.getByLabel("Owner", { exact: true }), { label: "Esi Demo (me)" });
  await click(page, page.getByRole("button", { name: "Set owner" }));
  await page.getByText(/Owner: (You|Esi Demo)/).waitFor({ timeout: 15000 });
  await sleep(800);
  await scrollTo(page, page.getByRole("heading", { name: "CV" }));
  await say(page, "Tap Download CV to read it. It downloads with your own login", 1300);
  const dl = page.waitForEvent("download");
  await click(page, page.getByRole("link", { name: "Download CV" }));
  const d = await dl;
  await say(page, `Downloaded ${d.suggestedFilename()}`, 2200);
  await scrollTo(page, page.getByRole("heading", { name: "Stage" }));
  await say(page, "Move it on: tap Screening, add a note and tap Change stage", 1300);
  await click(page, page.getByRole("radio", { name: "Screening" }));
  const note = page.getByLabel(/^Note/);
  if (await note.count()) await type(page, note.first(), "Good experience. Call to check her notice period.", { delay: 30 });
  await click(page, page.getByRole("button", { name: "Change stage" }));
  await settle(page);
  await sleep(800);
  await scrollTo(page, page.getByRole("heading", { name: "History" }));
  await say(page, "The history shows each step with who did it and when", 2800);
  await scrollTo(page, page.locator("main h1"), "start");
  await say(page, "Abena Demo is now at Screening, with Esi Demo as the owner", 2800);
  await finish("04-recruitment", [page]);
});

video("05", "live-chat", async () => {
  const careState = await signedIn("care@demo.test");
  const ctx = await context("desktop", { storageState: careState });
  const page = await ctx.newPage();
  // Website (a phone sized frame) on the left, the staff inbox on the right, side by side in one page. The page is
  // served by a small local server (Chrome only lets a local page frame other local pages).
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <style>body{margin:0;background:#e9f1f4;font:600 13px system-ui,Arial,sans-serif;color:#0b2f3d;height:100vh;overflow:hidden}
    .w{display:flex;gap:14px;padding:10px 14px 0}.c{display:flex;flex-direction:column}.c span{padding:2px 4px 6px;text-transform:uppercase;letter-spacing:.08em;font-size:12px}
    iframe{border:1px solid #c6d9e0;border-radius:10px;background:#fff}</style></head><body><div class="w">
    <div class="c"><span>The website visitor</span><iframe id="site" name="site" width="380" height="690" src="${SITE}/our-brands"></iframe></div>
    <div class="c"><span>Lexta staff in the Business System</span><iframe id="portal" name="portal" width="856" height="690" src="${PORTAL}/systems/chat"></iframe></div>
    </div></body></html>`;
  const server = http.createServer((req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(html); });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const SPLIT = `http://127.0.0.1:${server.address().port}/`;
  await page.goto(SPLIT);
  await settle(page);
  const site = page.frameLocator("#site");
  const portal = page.frameLocator("#portal");
  await site.getByRole("button", { name: "Chat with the Lexta team" }).waitFor({ timeout: 20000 });
  await say(page, "Left: a visitor on the Lexta website. Right: customer care in the Live chat inbox", 3200);
  await say(page, "The visitor taps the chat button and types a question", 1300);
  await click(page, site.getByRole("button", { name: "Chat with the Lexta team" }));
  await site.getByRole("dialog", { name: "Chat with Lexta" }).waitFor();
  await type(page, site.getByLabel("Your name"), "Selasi Demo");
  await type(page, site.getByLabel("How can we help?"), "Hello, where can I buy Linzzy napkins in Ho?", { delay: 35 });
  await click(page, site.getByRole("button", { name: "Start chat" }));
  await site.getByRole("log").getByText("Linzzy napkins in Ho").waitFor({ timeout: 15000 });
  await say(page, "The chat appears in the staff inbox by itself within a few seconds", 1200);
  const row = portal.getByRole("link", { name: /Selasi Demo/ }).first();
  await row.waitFor({ timeout: 30000 });
  await sleep(1200);
  await say(page, "Tap the chat to open it", 1000);
  await click(page, row);
  await portal.getByRole("button", { name: "Assign to me" }).waitFor({ timeout: 15000 });
  await sleep(800);
  await say(page, "Tap Assign to me so colleagues know you have it", 1300);
  await click(page, portal.getByRole("button", { name: "Assign to me" }));
  await portal.getByText("Assigned to you.").waitFor({ timeout: 15000 });
  await sleep(600);
  await say(page, "Type your answer in Reply to the visitor and tap Send reply", 1300);
  await type(page, portal.getByLabel("Reply to the visitor"), "Hello Selasi, Demo Chemist Ho near the main station sells Linzzy napkins.", { delay: 30 });
  await click(page, portal.getByRole("button", { name: "Send reply" }));
  await portal.getByText("Sent.").waitFor({ timeout: 15000 });
  await say(page, "The visitor sees the answer in the chat window, with your first name", 1500);
  await site.getByRole("log").getByText("Demo Chemist Ho near").waitFor({ timeout: 30000 });
  await point(page, site.getByRole("log").getByText("Demo Chemist Ho near"));
  await sleep(2600);
  await say(page, "Every answer comes from a person. There is no chatbot", 2600);
  await finish("05-live-chat", [page]);
  server.close();
});

video("06", "products", async () => {
  const mkt = await signedIn("marketing@demo.test");
  const ctx = await context("desktop", { storageState: mkt, capTop: true });
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/systems/products`);
  await settle(page);
  await say(page, "Open Product management and tap the product, here Yazz Toothpaste");
  await click(page, page.locator("main").getByRole("link", { name: "Toothpaste" }).first());
  await page.locator("main h1", { hasText: "Toothpaste" }).waitFor();
  await settle(page);
  const full = page.getByLabel("Full description");
  await scrollTo(page, full);
  await say(page, "Change the details. The Full description is the text on the website card", 1500);
  await click(page, full);
  await full.press("Control+End");
  await sleep(300);
  await full.pressSequentially(" Now also in a demo family size tube.", { delay: 40 });
  await sleep(800);
  await say(page, "Tap Save changes", 900);
  await click(page, page.getByRole("button", { name: "Save changes" }));
  const ok = page.locator("main .alert.ok").first();
  await ok.waitFor({ timeout: 20000 });
  await scrollTo(page, ok);
  await say(page, "Saved. The websites show the change shortly", 2600);
  // The site refreshes in the background after a save; give it a moment.
  await sleep(1500);
  await page.goto(`${SITE}/our-brands`);
  await settle(page);
  const card = page.getByText("Now also in a demo family size tube.").first();
  for (let i = 0; i < 6 && !(await card.count()); i += 1) { await sleep(1500); await page.reload(); await settle(page); }
  await say(page, "On the Lexta website, Our Brands lists the Yazz range", 1800);
  await scrollTo(page, card);
  await point(page, card);
  await say(page, "The Toothpaste card shows the new text. No developer needed", 3200);
  await finish("06-products", [page]);
});

video("07", "stockists", async () => {
  const mkt = await signedIn("marketing@demo.test");
  const ctx = await context("desktop", { storageState: mkt });
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/systems/stockists`);
  await settle(page);
  await say(page, "Open Stockists (Where to Buy) and tap New stockist");
  await click(page, page.locator("main").getByRole("link", { name: "New stockist" }));
  await page.locator("main h1", { hasText: "New stockist" }).waitFor();
  await settle(page);
  await say(page, "Type the shop name, choose the outlet type and region, and type the town", 1500);
  await type(page, page.getByLabel("Shop name"), "Demo Store Cape Coast");
  const types = await page.getByLabel("Outlet type").locator("option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: o.textContent })));
  const supermarket = types.find((o) => /supermarket/i.test(o.t)) ?? types.find((o) => o.v);
  await choose(page, page.getByLabel("Outlet type"), supermarket.v);
  await choose(page, page.getByLabel("Region"), { label: "Central" });
  await type(page, page.getByLabel("Town"), "Cape Coast");
  await type(page, page.getByLabel("Address or landmark (optional)"), "Opposite the Demo market", { delay: 35 });
  await type(page, page.getByLabel("Opening hours (optional)"), "Mon to Sat, 8am to 7pm", { delay: 35 });
  await scrollTo(page, page.getByRole("group", { name: "Brands carried" }));
  await say(page, "Tick the brands the shop carries", 1200);
  await click(page, page.getByRole("checkbox", { name: "Yazz" }));
  await click(page, page.getByRole("checkbox", { name: "Hooch" }));
  await say(page, "Tap Add stockist", 900);
  await click(page, page.getByRole("button", { name: "Add stockist" }));
  await page.waitForURL((u) => !u.pathname.endsWith("/new"), { timeout: 20000 });
  await settle(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(900);
  const saved = page.locator("main .alert.ok").first();
  await point(page, (await saved.count()) ? saved : page.locator("main h1"));
  await say(page, "Saved. An active stockist shows on Where to Buy straight away", 2800);

  await page.goto(`${SITE}/`);
  await settle(page);
  const toggle = page.getByRole("button", { name: /^Your region:/ });
  await scrollTo(page, toggle);
  await say(page, "On the Lexta website home page, a shopper uses Where to Buy", 1600);
  await click(page, toggle);
  await sleep(500);
  await click(page, page.getByRole("option", { name: "Central" }));
  await click(page, page.getByRole("button", { name: "Find a stockist" }));
  const res = page.locator("#stockist-results");
  await res.getByText("Demo Store Cape Coast").waitFor({ timeout: 20000 });
  await scrollTo(page, res);
  await point(page, res.getByText("Demo Store Cape Coast"));
  await say(page, "The new shop is listed for the Central region", 3200);
  await finish("07-stockists", [page]);
});

video("08", "distributor-order", async () => {
  const distState = await signedIn("distributor@demo.test");
  const repState = await signedIn("rep@demo.test");
  const dctx = await context("desktop", { storageState: distState });
  const d = await dctx.newPage();
  await d.goto(`${PORTAL}/systems/orders`);
  await settle(d);
  await say(d, "A distributor signs in and sees My orders. Tap New order");
  await click(d, d.locator("main").getByRole("link", { name: "New order" }).first());
  await d.locator(".stepper input").first().waitFor();
  await settle(d);
  await say(d, "Set the number of packs for each product with plus and minus, or type it", 1500);
  const plus = d.getByRole("button", { name: /^One pack more of / });
  await click(d, plus.nth(0)); await click(d, plus.nth(0), { pause: 150 }); await click(d, plus.nth(0), { pause: 150 });
  const steppers = d.locator(".stepper input");
  await type(d, steppers.nth(1), "12", { clear: true });
  await type(d, steppers.nth(2), "24", { clear: true });
  await say(d, "Tap Review order", 900);
  await click(d, d.getByRole("button", { name: "Review order" }));
  await d.getByRole("heading", { name: "Your order" }).waitFor();
  await settle(d);
  await say(d, "Check the list and the delivery details", 1500);
  const addr = d.getByLabel("Delivery address");
  if (!(await addr.inputValue())) await type(d, addr, "Demo Warehouse, Adum, Kumasi");
  await scrollTo(d, d.getByRole("button", { name: "Submit order" }));
  await say(d, "Tap Submit order", 900);
  await click(d, d.getByRole("button", { name: "Submit order" }));
  await d.getByRole("heading", { level: 1, name: /^LX-ORD-/ }).waitFor({ timeout: 20000 });
  await settle(d);
  const ref = (await d.locator("main h1").innerText()).trim();
  await d.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(600);
  await point(d, d.locator("main h1"));
  await say(d, `The order ${ref} is submitted. The tracker shows each step`, 3200);
  const part1 = await stop(d);

  const sctx = await context("desktop", { storageState: repState });
  const s = await sctx.newPage();
  await s.goto(`${PORTAL}/systems/orders`);
  await settle(s);
  await say(s, "Lexta sales staff see it in Distributor ordering at Submitted");
  const id = (await q(`select id from public.distributor_orders where reference = '${ref}'`)).trim();
  await click(s, s.locator(`main a[href$="/systems/orders/${id}"]`).first());
  await s.locator("main").getByText(ref).first().waitFor();
  await settle(s);
  await say(s, "Check the products, packs and delivery details", 2200);
  const status = s.getByRole("heading", { name: "Status" });
  if (await status.count()) await scrollTo(s, status);
  await say(s, "Under Status, tap Confirm order and add a note for the distributor", 1300);
  await click(s, s.getByText("Confirm order", { exact: true }).first());
  const note = s.getByLabel(/Note for the distributor/);
  if (await note.count()) await type(s, note.first(), "On the Thursday truck to Kumasi.", { delay: 35 });
  await click(s, s.getByRole("button", { name: "Confirm order" }));
  await s.locator(".page-head .badge.ostatus", { hasText: "Confirmed" }).waitFor({ timeout: 20000 });
  await scrollTo(s, s.locator("main h1"), "start");
  await say(s, "The order is Confirmed. The distributor sees the new status and your note", 3200);
  await finish("08-distributor-order", [part1, s]);
});

video("09", "field-sales-phone", async () => {
  const repState = await signedIn("rep@demo.test");
  const ctx = await context("phone", { storageState: repState });
  const page = await ctx.newPage();
  pointer.set(page, [195, 600]);
  await page.goto(`${PORTAL}/systems/field-sales`);
  await settle(page);
  await say(page, "At the shop, open Field sales on your phone and tap Start visit");
  await click(page, page.getByRole("link", { name: "Start visit" }));
  await page.getByText("Location captured").waitFor({ timeout: 20000 });
  await settle(page);
  await say(page, "Your location is captured. Shops near you are listed first", 2200);
  await click(page, page.locator(".fs-shop", { hasText: "Demo Shop Adabraka" }));
  await page.getByRole("heading", { name: "Demo Shop Adabraka" }).waitFor();
  await sleep(600);
  await say(page, "Take a photo of the shelf", 1500);
  await point(page, page.getByText("Take a photo").first());
  await page.locator('input[aria-label="Take a photo"]').setInputFiles(files.shelf);
  await page.locator(".fs-thumb img").first().waitFor();
  await scrollTo(page, page.locator(".fs-thumb img").first());
  await sleep(900);
  await say(page, "Tap what happened and add a note", 1300);
  await click(page, page.getByText("Order taken", { exact: true }));
  await type(page, page.getByLabel("Notes (optional)"), "Spoke to Ama Demo. Wants Heavy flow packs.", { delay: 35 });
  await say(page, "Optional: a quick stock check", 1200);
  await click(page, page.getByText("Quick stock check (optional)"));
  await click(page, page.locator(".fs-stock-list li").first().getByRole("button", { name: "On shelf", exact: true }));
  await sleep(500);
  await say(page, "Tap Save visit", 900);
  await click(page, page.getByRole("button", { name: "Save visit" }));
  await page.getByRole("heading", { name: "Visit saved" }).waitFor({ timeout: 30000 });
  await scrollTo(page, page.getByRole("heading", { name: "Visit saved" }));
  await say(page, "Visit saved. Your manager sees it straight away", 3000);
  await finish("09-field-sales-phone", [page]);
});

video("10", "csr", async () => {
  const mkt = await signedIn("marketing@demo.test");
  const ctx = await context("desktop", { storageState: mkt });
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/systems/csr`);
  await settle(page);
  await say(page, "Open CSR activities. The totals show people reached per programme");
  await click(page, page.locator("main").getByRole("link", { name: "Log an activity" }).first());
  await page.locator("main h1", { hasText: "Log a CSR activity" }).waitFor();
  await settle(page);
  await say(page, "Choose the programme and the date, and tick Done", 1300);
  await choose(page, page.getByLabel("Programme"), { label: "The Dignity Project" });
  const yday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  await point(page, page.getByLabel("Date"));
  await page.getByLabel("Date").fill(yday);
  await sleep(600);
  await click(page, page.getByRole("radio", { name: "Done" }));
  await say(page, "Choose the region and type the place and the people reached", 1300);
  await choose(page, page.getByLabel("Region"), { label: "Central" });
  await type(page, page.getByLabel("Town or place"), "Demo Girls SHS, Cape Coast");
  await type(page, page.getByLabel("People reached"), "280", { clear: true });
  await type(page, page.getByLabel("Notes (optional)"), "Talk on menstrual health and free Yazz pads.", { delay: 30 });
  await say(page, "Tap Save activity", 900);
  await click(page, page.getByRole("button", { name: "Save activity" }));
  await page.waitForURL((u) => !u.pathname.endsWith("/new"), { timeout: 20000 });
  await settle(page);
  await sleep(600);
  const input = page.locator('main input[type=file]').last();
  const btn = page.locator("main").getByText("Choose photos", { exact: true }).first();
  if (await btn.count()) await scrollTo(page, btn);
  await say(page, "On the next screen, add photos: Take a photo or Choose photos", 1500);
  if (await btn.count()) await point(page, btn);
  await input.setInputFiles(files.photo);
  await page.locator("main img").first().waitFor({ timeout: 30000 });
  await settle(page);
  await sleep(1200);
  await scrollTo(page, page.locator("main img").first());
  await say(page, "The photo is saved with the activity", 2600);
  await say(page, "Open CSR activities again to see the totals", 600);
  await page.goto(`${PORTAL}/systems/csr`);
  await settle(page);
  await say(page, "Back on CSR activities, the new activity and the totals are updated", 3200);
  await finish("10-csr", [page]);
});

video("11", "dashboard", async () => {
  const mgr = await signedIn("manager@demo.test");
  const ctx = await context("desktop", { storageState: mgr });
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/systems/dashboard`);
  await settle(page);
  await say(page, "The Management dashboard shows the last 30 days for every brand at first", 2800);
  await say(page, "Tap This month or This year to change the period", 1300);
  await click(page, page.getByRole("navigation", { name: "Period" }).getByRole("link", { name: "This month" }));
  await settle(page);
  await sleep(1200);
  await click(page, page.getByRole("navigation", { name: "Period" }).getByRole("link", { name: "This year" }));
  await settle(page);
  await sleep(1500);
  await say(page, "Or set your own dates in From and To", 1300);
  const first = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}-01`;
  await point(page, page.getByLabel("From"));
  await page.getByLabel("From").fill(first);
  await sleep(700);
  await say(page, "Choose a brand to see only its numbers, then tap Apply", 1300);
  await choose(page, page.getByLabel("Brand"), { label: "Yazz" });
  await click(page, page.getByRole("button", { name: "Apply" }));
  await settle(page);
  await page.locator("main p").first().waitFor();
  await sleep(800);
  await point(page, page.locator("main p").first());
  await say(page, "The line under the title says which dates and brand you are looking at", 2600);
  for (const y of [500, 500, 500]) { await page.mouse.wheel(0, y); await sleep(1100); }
  await say(page, "Tap a number or a tile title to open the records behind it", 2600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1000);
  await say(page, "Tap Clear to go back to every brand and the last 30 days", 300);
  await click(page, page.getByRole("link", { name: "Clear" }).first());
  await settle(page);
  await sleep(800);
  await point(page, page.getByLabel("Brand"));
  await say(page, "The Brand box is back to Every brand, and the dates to the last 30 days", 3000);
  await finish("11-dashboard", [page]);
});

// Run ------------------------------------------------------------------------------------------------------------------
let failed = false;
try {
  await waitFor(`http://127.0.0.1:${GW_PORT}/rest/v1/`);
  await waitFor(SITE);
  await waitFor(`${PORTAL}/login`);
  // The site was built without a database, so ask it to read the seeded data (as the portal does after a save).
  await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": "guide-video-revalidate-secret", "content-type": "application/json" }, body: "{}" });
  for (const p of ["/", "/our-brands", "/careers", "/contact-us"]) await fetch(`${SITE}${p}`);
  await sleep(1500);
  files = await makeFiles();
  for (const v of VIDEOS) {
    if (ONLY.length && !ONLY.includes(v.num)) continue;
    console.log(`recording ${v.name}`);
    try { await v.fn(); } catch (e) {
      failed = true;
      console.error(`FAILED ${v.name}:`, e);
      // What the screen showed when it stopped, for whoever re-records.
      for (const [i, c] of open.entries()) {
        for (const p of c.pages()) await p.screenshot({ path: path.join(os.tmpdir(), `lexta-guide-video-${v.name}-failed-${i}.png`) }).catch(() => {});
      }
    }
    for (const c of open.splice(0)) await c.close().catch(() => {});
  }
} catch (e) {
  failed = true;
  console.error(e);
} finally {
  await browser.close().catch(() => {});
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
  rmSync(RAW, { recursive: true, force: true });
}
if (!HAS_FFMPEG) console.log("ffmpeg not found: the videos were kept as WebM");
for (const m of made) console.log(`${m.name}\t${m.seconds} s\t${m.kb} KB`);
writeFileSync(path.join(os.tmpdir(), "lexta-guide-videos.json"), JSON.stringify(made, null, 1));
process.exit(failed ? 1 : 0);
