// Browser check of the management overview (item 26, grown into the super admin view): a production build of the
// portal against the local harness database through ../browser/gateway.mjs on port 54401. Build the portal first (see
// run.sh), then run:
//   bash supabase/tests/local/dashboard/run.sh
// Covers management at 1440 px: landing on the overview after sign in and on "/", the menu, the empty state, key
// figures with the change on the previous period, the needs attention strip and its links, the charts and their
// tables, the tabs carrying the period and brand, the activity feed (filters, a row opening its record, "Load more"
// with keyset paging, and the plain link without JavaScript), every system section with its latest records, and the
// old /systems/dashboard address. Management on a phone (390 px): no sideways scroll on the overview, the feed and a
// section. Admin sees it; customer care and a sales rep keep their Home and are refused.
// Screenshots go to DASHBOARD_SCREENSHOTS (default: lexta-dashboard-screens in the temp directory). Every server it
// starts is stopped by its PID at the end.
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
const OUT = process.env.DASHBOARD_SCREENSHOTS || path.join(os.tmpdir(), "lexta-dashboard-screens");
mkdirSync(OUT, { recursive: true });
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

// People (test data in the throwaway database only) ------------------------------------------------------------------
await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d101', 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}'),
  ('00000000-0000-0000-0000-00000000d102', 'manager@lexta.test', '{"role":"management"}', '{"full_name":"Kwame Manager"}'),
  ('00000000-0000-0000-0000-00000000d103', 'rep@lexta.test', '{"role":"sales_rep"}', '{"full_name":"Kofi Rep"}'),
  ('00000000-0000-0000-0000-00000000d105', 'care@lexta.test', '{"role":"customer_care"}', '{"full_name":"Efua Care"}')`);
// The migrations seed products dated when they ran; move them back so the empty state is empty.
await q(`set session_replication_role = replica;
  update public.products set created_at = now() - interval '5 years', updated_at = now() - interval '5 years';
  update public.stockists set created_at = now() - interval '5 years', updated_at = now() - interval '5 years';
  set session_replication_role = origin;`);

// Records for every system, dated in the past (triggers off, as the database owner). 40 extra leads make the feed run
// past one page of 30.
const SEED = `
set session_replication_role = replica;
insert into public.crm_contacts (id, full_name) values ('00000000-0000-0000-0000-00000000d201', 'Dash Customer');
insert into public.crm_organisations (id, name, kind) values ('00000000-0000-0000-0000-00000000d202', 'Dash Distributors', 'distributor');
insert into public.crm_leads (id, title, contact_id, brand_id, source, stage, owner_id, created_at, closed_at, intake_reference) values
  ('00000000-0000-0000-0000-00000000d211', 'L1', '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'yazz'), 'website_contact_form', 'new', null, now() - interval '2 days', null, 'LX-D0DA5B0A11'),
  ('00000000-0000-0000-0000-00000000d212', 'L2', '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'hooch'), 'phone', 'won', '00000000-0000-0000-0000-00000000d103', now() - interval '3 days', now() - interval '1 day', null),
  ('00000000-0000-0000-0000-00000000d213', 'L3 older', '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'yazz'), 'email', 'new', null, now() - interval '40 days', null, null);
insert into public.crm_leads (title, contact_id, brand_id, source, stage, created_at)
  select 'Bulk lead ' || g, '00000000-0000-0000-0000-00000000d201', (select id from public.brands where slug = 'linzzy'), 'event', 'new', now() - interval '20 days' - g * interval '1 minute'
  from generate_series(1, 40) g;
insert into public.crm_activities (lead_id, type, body, occurred_at, created_by) values
  ('00000000-0000-0000-0000-00000000d212', 'status_change', 'Stage changed from New to Won', now() - interval '1 day', '00000000-0000-0000-0000-00000000d103');
insert into public.complaints (id, case_number, brand_id, category, severity, channel, description, contact_id, status, response_due_at, resolution_due_at, created_at)
  values ('00000000-0000-0000-0000-00000000d221', 'LX-2026-9101', (select id from public.brands where slug = 'yazz'), 'product_quality', 'high', 'website', 'K1', '00000000-0000-0000-0000-00000000d201', 'new',
          now() - interval '1 hour', now() + interval '3 days', now() - interval '1 day');
insert into public.distributor_orders (id, reference, organisation_id, status, brand_ids, submitted_at) values
  ('00000000-0000-0000-0000-00000000d301', 'LX-ORD-2026-9101', '00000000-0000-0000-0000-00000000d202', 'submitted', array[(select id from public.brands where slug = 'yazz')], now() - interval '1 day');
insert into public.distributor_order_lines (order_id, brand_id, product_name_snapshot, sku_code_snapshot, pack_size_snapshot, quantity)
  values ('00000000-0000-0000-0000-00000000d301', (select id from public.brands where slug = 'yazz'), 'P', 'S-1', 'Carton', 12);
insert into public.distributor_order_events (order_id, type, from_status, to_status, by_distributor, created_at) values
  ('00000000-0000-0000-0000-00000000d301', 'created', null, 'submitted', true, now() - interval '1 day');
insert into public.field_visits (id, rep_id, shop_name, brand_ids, visited_at, location_status, outcome_id) values
  ('00000000-0000-0000-0000-00000000d401', '00000000-0000-0000-0000-00000000d103', 'Dash Shop', array[(select id from public.brands where slug = 'yazz')], now() - interval '1 day', 'denied',
   (select id from public.field_visit_outcomes where slug = 'order_taken'));
insert into public.csr_activities (programme_id, activity_date, status, region_id, place, people_reached, created_at) values
  ((select id from public.csr_programmes where name = 'The Dignity Project'), current_date - 1, 'done', (select id from public.regions where slug = 'volta'), 'Ho', 40, now() - interval '1 day');
insert into public.chat_conversations (id, reference, brand_id, token_hash, visitor_name, status, created_at) values
  ('00000000-0000-0000-0000-00000000d501', 'LC-D0000101', (select id from public.brands where slug = 'yazz'), repeat('a', 64), 'Visitor', 'open', now() - interval '3 hours');
insert into public.job_applications (id, reference, full_name, email, interest, stage, created_at) values
  ('00000000-0000-0000-0000-00000000d601', 'LX-APP-2026-9101', 'Dash Applicant', 'dash.applicant@example.com', 'Sales', 'new', now() - interval '5 hours');
set session_replication_role = origin;`;

const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.DASHBOARD_SERVER_LOG;
  p.stdout.on("data", (d) => { if (log) appendFileSync(log, `[${path.basename(cmd)} out] ${d}`); });
  p.stderr.on("data", (d) => {
    if (log) appendFileSync(log, `[${path.basename(cmd)} err] ${d}`);
    if (/error/i.test(String(d))) process.stdout.write(`[${path.basename(cmd)}] ${d}`);
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

const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-dashboard-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness" };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3102", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);

const PORTAL = "http://127.0.0.1:3102";
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function context(width, extra = {}) {
  const phone = width < 800;
  return browser.newContext({ ...(phone ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width, height: 900 } }), ...extra });
}
const opened = [];
const errors = [];
async function login(ctx, email) {
  const page = await ctx.newPage();
  opened.push([email, page]);
  page.on("pageerror", (e) => errors.push(`${email}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`${email} @ ${page.url()}: ${m.text().slice(0, 200)}`); });
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return page;
}
async function go(page, url) {
  await page.goto(url);
  await page.locator("main h1").first().waitFor();
}
const settle = (page) => page.waitForFunction(() => !document.querySelector(".nav-progress.on"));
/** A key figure's number, by its label, inside the card of one system. */
const fig = (page, system, label) => page.locator(".mgmt-system", { has: page.getByRole("heading", { name: system, exact: true }) })
  .locator(".mgmt-fig", { has: page.getByText(label, { exact: true }) });

try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);

  // Management at 1440: landing, menu, empty state ---------------------------------------------------------------------
  const mgr = await login(await context(1440), "manager@lexta.test");
  check(new URL(mgr.url()).pathname === "/management", "1440: management lands on the overview after sign in", mgr.url());
  await mgr.locator("main h1").waitFor();
  const nav = await mgr.locator("aside nav a").allInnerTexts();
  check(nav[0]?.trim() === "Management overview" && !nav.some((t) => t.trim() === "Home"), "1440: the overview is the first menu item, with no separate Home", nav);
  check(await mgr.locator("aside nav a").first().getAttribute("aria-current") === "page", "1440: the menu marks the overview as current");
  await go(mgr, `${PORTAL}/`);
  check(new URL(mgr.url()).pathname === "/management", "1440: / opens the overview for management");
  check(await mgr.getByText("Nothing needs attention right now.").isVisible(), "1440: empty: nothing needs attention");
  check(await fig(mgr, "CRM", "new leads").locator("b").innerText() === "0" && await fig(mgr, "CRM", "new leads").getByText("The same as the previous 30 days").isVisible(),
    "1440: empty: zero, the same as the previous 30 days");
  check(await mgr.locator(".mgmt-system").count() === 8, "1440: eight systems in key figures");
  check(await mgr.locator("figure.mgmt-chart").count() === 4, "1440: four charts");
  check(await mgr.getByText("Nothing has been recorded in this period yet.").isVisible(), "1440: empty latest activity");
  const tabs = await mgr.locator("nav.mgmt-tabs a").allInnerTexts();
  check(JSON.stringify(tabs) === JSON.stringify(["Overview", "Activity", "Orders", "Field sales", "CRM", "Complaints", "Recruitment", "Live chat", "Products and stockists", "CSR"]),
    "1440: tabs for the overview, activity and each system", tabs);
  await mgr.screenshot({ path: `${OUT}/manager-1440-empty.png`, fullPage: true });

  // With records ----------------------------------------------------------------------------------------------------------
  await q(SEED);
  await go(mgr, `${PORTAL}/management`);
  const leads = fig(mgr, "CRM", "new leads");
  check(await leads.locator("b").innerText() === "42" && await leads.getByText("Up 41 on the previous 30 days").isVisible(),
    "1440: new leads with the change on the previous 30 days", await leads.innerText());
  check(await fig(mgr, "Orders", "order submitted").getByText("Up 1 on the previous 30 days").isVisible(), "1440: orders up 1, and one order reads in the singular");
  check(await fig(mgr, "Orders", "order submitted").getAttribute("href") === `/systems/orders?from=${new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)}&to=${new Date().toISOString().slice(0, 10)}`
    && await fig(mgr, "CRM", "new leads").getAttribute("href") === "/systems/crm/leads?stage=all&sort=newest", "1440: key figures open their list in the system");
  check(await mgr.locator(".mgmt-system .mgmt-fig:not(a)").count() === 0, "1440: every key figure is a link");
  const attention = await mgr.locator(".mgmt-attention").evaluate((el) => {
    const h = el.querySelector("h2").getBoundingClientRect(); const p = el.querySelector("p.small").getBoundingClientRect(); return p.top - h.bottom;
  });
  check(attention >= 0, "1440: the needs attention heading and its subtitle do not overlap", attention);
  const alerts = await mgr.locator(".mgmt-alerts li").allInnerTexts();
  check(["1\ncomplaint overdue", "1\nchat waiting for a reply", "1\norder waiting to be confirmed", "1\nwebsite lead with no owner", "1\napplication waiting at the first stage"]
    .every((t) => alerts.some((a) => a.includes(t))) && alerts.every((a) => /^1\s/.test(a)), "1440: needs attention lists each alert with its count, in the singular for one", alerts);
  check(!alerts.some((a) => a.includes("new shops")), "1440: an alert with nothing waiting is left out");
  const chart = mgr.locator("figure.mgmt-chart", { hasText: "Orders submitted" });
  check(/Orders submitted\. 1 order in all, by day\. The busiest day was/.test(await chart.locator("svg").getAttribute("aria-label") ?? ""), "1440: the chart has a written summary",
    await chart.locator("svg").getAttribute("aria-label"));
  check(await chart.locator(".sr-only", { hasText: "in all, by day" }).count() === 0, "1440: the summary is read once (the chart label only)");
  check(await chart.locator("rect.mgmt-chart-bar").count() === 1 && await chart.locator("rect.mgmt-chart-hit").count() === 30, "1440: one column drawn, 30 days to point at");
  await chart.getByText("Show the numbers").click();
  check(await chart.locator("tbody tr").count() === 30 && await chart.locator("tbody td:nth-child(2)", { hasText: /^1$/ }).count() === 1, "1440: the numbers table has every day");
  check(await mgr.locator("figure.mgmt-chart", { hasText: "New leads" }).locator("figcaption").innerText().then((t) => t.includes("42 in all")), "1440: the leads chart total");
  check(await mgr.locator(".mgmt-feed .mgmt-feed-row").count() === 8, "1440: eight rows of latest activity");
  check(await noSideScroll(mgr), "1440: no sideways scroll");
  await mgr.screenshot({ path: `${OUT}/manager-1440.png`, fullPage: true });

  await mgr.locator(".mgmt-alerts a", { hasText: "complaint overdue" }).click();
  await mgr.waitForURL(/\/systems\/complaints\?status=open&overdue=1/);
  await mgr.locator("main h1").waitFor();
  check(await mgr.getByText("LX-2026-9101").isVisible(), "1440: an alert opens the filtered list in its system");

  // Filters travel across the tabs -------------------------------------------------------------------------------------------
  await go(mgr, `${PORTAL}/management`);
  await mgr.getByRole("link", { name: "This year" }).click();
  await mgr.waitForURL(/range=year/);
  await settle(mgr);
  await choose(mgr, "Brand", "Yazz");
  await mgr.getByRole("button", { name: "Apply" }).click();
  await mgr.waitForURL(/brand=/);
  await settle(mgr);
  const yazz = new URL(mgr.url()).searchParams.get("brand");
  check(!!yazz, "1440: a brand is chosen");
  await mgr.locator("nav.mgmt-tabs").getByRole("link", { name: "Activity" }).click();
  await mgr.waitForURL(/\/management\/activity/);
  await settle(mgr);
  const u = new URL(mgr.url());
  check(u.searchParams.get("brand") === yazz && u.searchParams.get("range") === "year", "1440: the tabs carry the period and brand", mgr.url());
  check(await mgr.getByRole("link", { name: "This year" }).getAttribute("aria-current") === "page" && await mgr.locator("#brand").inputValue() === yazz,
    "1440: the activity tab shows the same period and brand");
  const yazzRows = await mgr.locator(".mgmt-feed-row").allInnerTexts();
  check(yazzRows.length > 0 && yazzRows.every((t) => t.includes("Yazz")) && !yazzRows.some((t) => /Bulk lead|Application/.test(t)), "1440: the feed keeps to the brand", yazzRows.slice(0, 3));

  // Activity feed ------------------------------------------------------------------------------------------------------------
  await go(mgr, `${PORTAL}/management/activity`);
  const first = await mgr.locator(".mgmt-feed-row").allInnerTexts();
  check(first.length === 30, "1440: the feed shows 30 rows first", first.length);
  check(/Chat LC-D0000101 started/.test(first[0]) && /Website visitor/.test(first[0]), "1440: newest first: the chat 3 hours ago, by a website visitor", first[0]);
  check(first.some((t) => /Application LX-APP-2026-9101 received/.test(t) && /Careers page/.test(t)) && first.some((t) => /New lead: Website enquiry/.test(t) && /Website contact form/.test(t)),
    "1440: an application, and a website lead by its source, never its title");
  check(!first.some((t) => /\bL1\b/.test(t)), "1440: a website lead's title (it holds the visitor's name) is not shown");
  check(first.some((t) => /Lead L2/.test(t) && /Stage changed from New to Won/.test(t) && /By Kofi Rep/.test(t)), "1440: a stage change with who made it");
  const moreLink = mgr.getByRole("link", { name: "Load more" });
  check(/before_at=.*before_key=/.test(await moreLink.getAttribute("href") ?? ""), "1440: Load more is a real link for browsers without JavaScript");
  await moreLink.click();
  await mgr.waitForFunction(() => document.querySelectorAll(".mgmt-feed-row").length > 30);
  check(new URL(mgr.url()).pathname === "/management/activity" && !new URL(mgr.url()).search.includes("before_at"), "1440: Load more adds rows in place");
  const all = await mgr.locator(".mgmt-feed-row").allInnerTexts();
  // 42 new leads, and one each of: a stage change, a complaint, an order, a visit, a CSR activity, a chat, an application.
  const total = 42 + 7;
  check(all.length === total && new Set(all).size === all.length && !(await mgr.getByRole("link", { name: "Load more" }).count()),
    `1440: Load more brings the other ${total - 30} rows once each, then stops`, { shown: all.length, total });
  check(await mgr.getByText(/all there are for these filters/).isVisible(), "1440: says when everything is shown");

  await choose(mgr, "System", "Orders");
  await mgr.getByRole("button", { name: "Show" }).click();
  await mgr.waitForURL(/system=orders/);
  await settle(mgr);
  const orderRows = await mgr.locator(".mgmt-feed-row").allInnerTexts();
  check(orderRows.length === 1 && /Order LX-ORD-2026-9101 submitted/.test(orderRows[0]) && /Dash Distributors/.test(orderRows[0]), "1440: filter by system", orderRows);
  await mgr.getByRole("link", { name: "This month" }).click();
  await mgr.waitForURL(/range=month/);
  check(new URL(mgr.url()).searchParams.get("system") === "orders", "1440: a period preset keeps the system filter");
  await go(mgr, `${PORTAL}/management/activity?person=00000000-0000-0000-0000-00000000d103`);
  const repRows = await mgr.locator(".mgmt-feed-row").allInnerTexts();
  check(repRows.length === 2 && repRows.every((t) => t.includes("Kofi Rep")), "1440: filter by person", repRows);
  await mgr.locator(".mgmt-feed-row a", { hasText: "Lead L2" }).click();
  await mgr.waitForURL(/\/systems\/crm\/leads\/00000000-0000-0000-0000-00000000d212/);
  await mgr.locator("main h1").waitFor();
  check(/L2/.test(await mgr.locator("main h1").innerText()), "1440: a row opens the record in its own system");
  // Without JavaScript the next page comes from the address.
  const page2 = await (await context(1440, { javaScriptEnabled: false })).newPage();
  await page2.context().addCookies(await mgr.context().cookies());
  await page2.goto(`${PORTAL}/management/activity`);
  await page2.getByRole("link", { name: "Load more" }).click();
  await page2.waitForURL(/before_at=/);
  const p2 = await page2.locator(".mgmt-feed-row").allInnerTexts();
  check(p2.length === total - 30 && !p2.some((t) => first.includes(t)) && await page2.getByRole("link", { name: "Back to the newest" }).isVisible(),
    "no JavaScript: Load more opens the next page", p2.length);
  check(!(await page2.getByText(/all there are for these filters/).count()) && await page2.getByText(`Showing ${total - 30} events.`).isVisible(),
    "no JavaScript: a later page does not claim to show everything");
  await page2.context().close();

  // Every system section -------------------------------------------------------------------------------------------------------
  const sections = { orders: ["Orders", "LX-ORD-2026-9101"], "field-sales": ["Field sales", "Dash Shop"], crm: ["CRM", "Bulk lead 1"],
    complaints: ["Complaints", "LX-2026-9101"], recruitment: ["Recruitment", "LX-APP-2026-9101"], chat: ["Live chat", "LC-D0000101"],
    catalogue: ["Products and stockists", "Products, last changed first"], csr: ["CSR", "The Dignity Project"] };
  for (const [slug, [title, text]] of Object.entries(sections)) {
    await go(mgr, `${PORTAL}/management/${slug}`);
    const h1 = await mgr.locator("main h1").innerText();
    const ok = h1 === title && await mgr.getByText(text).first().isVisible() && await mgr.locator("nav.mgmt-tabs a[aria-current=page]").innerText() === title
      && await noSideScroll(mgr) && !(await mgr.locator(".alert.error").count());
    check(ok, `1440: the ${title} section shows its figures and latest records`, { h1 });
  }
  await go(mgr, `${PORTAL}/management/orders`);
  check(await mgr.locator(".mgmt-fig", { hasText: "packs ordered" }).locator("b").innerText() === "12", "1440: orders section figures");
  check(await mgr.getByRole("link", { name: "LX-ORD-2026-9101" }).getAttribute("href") === "/systems/orders/00000000-0000-0000-0000-00000000d301", "1440: a latest record links to its system");
  const fullList = await mgr.getByRole("link", { name: "All orders in Distributor ordering" }).getAttribute("href");
  check(/^\/systems\/orders\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/.test(fullList ?? ""), "1440: the full list link keeps the period", fullList);
  await mgr.screenshot({ path: `${OUT}/manager-1440-orders.png`, fullPage: true });
  await go(mgr, `${PORTAL}/management/crm`);
  check(await mgr.locator("section[aria-labelledby=sec_latest] .ptable tbody tr").count() === 10, "1440: about ten latest records, no more");
  const latestLeads = mgr.locator("section[aria-labelledby=sec_latest] .ptable tbody");
  const leadLinks = await latestLeads.locator("a").allInnerTexts();
  check(await latestLeads.getByRole("link", { name: "Website enquiry LX-D0DA5B0A11", exact: true }).getAttribute("href") === "/systems/crm/leads/00000000-0000-0000-0000-00000000d211"
    && !leadLinks.some((t) => /\bL1\b/.test(t)), "1440: latest leads: a website lead shows its fixed label and reference, never its title (the visitor's name)", leadLinks);
  check(leadLinks.includes("L2") && leadLinks.includes("Bulk lead 1"), "1440: latest leads: staff typed titles stay as they are", leadLinks);
  await go(mgr, `${PORTAL}/management/nothing-here`);
  check(/could not be found/i.test(await mgr.locator("body").innerText()), "1440: an unknown section is not found");
  errors.splice(0, errors.length, ...errors.filter((e) => !/404/.test(e)));

  // The old address ---------------------------------------------------------------------------------------------------------------
  await mgr.goto(`${PORTAL}/systems/dashboard?range=year&brand=${yazz}`);
  await mgr.waitForURL(/\/management\?/);
  check(new URL(mgr.url()).pathname === "/management" && new URL(mgr.url()).searchParams.get("range") === "year" && new URL(mgr.url()).searchParams.get("brand") === yazz,
    "1440: /systems/dashboard redirects to the overview with its period and brand", mgr.url());

  // Management on a phone (390) --------------------------------------------------------------------------------------------
  const phone = await login(await context(390), "manager@lexta.test");
  for (const p of ["/management", "/management/activity", "/management/complaints", "/management/catalogue"]) {
    await go(phone, `${PORTAL}${p}`);
    check(await noSideScroll(phone), `390: ${p} has no sideways scroll`);
  }
  await go(phone, `${PORTAL}/management`);
  const fromBox = await phone.locator("#from").boundingBox();
  const toBox = await phone.locator("#to").boundingBox();
  check(fromBox && toBox && Math.abs(fromBox.y - toBox.y) < 2 && toBox.x > fromBox.x, "390: From and To sit side by side", { fromBox, toBox });
  const alertBox = await phone.locator(".mgmt-alerts a").first().boundingBox();
  check(alertBox && alertBox.height >= 44, "390: alerts are touch sized", alertBox);
  await phone.screenshot({ path: `${OUT}/manager-390.png`, fullPage: true });
  await go(phone, `${PORTAL}/management/activity`);
  await phone.screenshot({ path: `${OUT}/manager-390-activity.png`, fullPage: true });

  // Admin, customer care and a sales rep --------------------------------------------------------------------------------------------
  const admin = await login(await context(1440), "admin@lexta.test");
  check(new URL(admin.url()).pathname === "/management", "admin lands on the overview");
  check(await admin.locator(".mgmt-fig", { hasText: "packs ordered" }).count() === 1, "admin sees the overview");
  const care = await login(await context(1440), "care@lexta.test");
  check(new URL(care.url()).pathname === "/", "customer care keeps its Home");
  check(!(await care.getByRole("link", { name: "Management overview", exact: true }).count()), "customer care has no overview in the menu");
  for (const p of ["/management", "/management/activity", "/management/orders", "/systems/dashboard"]) {
    await go(care, `${PORTAL}${p}`);
    check(await care.getByText("Your role does not include the management overview").isVisible() && !(await care.locator(".mgmt-fig, .mgmt-feed-row").count()),
      `customer care opening ${p} is refused`);
  }
  const rep = await login(await context(390), "rep@lexta.test");
  check(new URL(rep.url()).pathname === "/", "a sales rep keeps its Home");
  await go(rep, `${PORTAL}/management`);
  check(!(await rep.locator(".mgmt-fig").count()), "a sales rep opening the overview is refused");
  check(errors.length === 0, "no errors in the browser console", errors.slice(0, 5));
} catch (e) {
  failures += 1;
  console.log(`  FAIL: ${e?.stack ?? e}`);
  for (const [who, page] of opened) {
    try { await page.screenshot({ path: `${OUT}/failure-${who.split("@")[0]}.png`, fullPage: true }); } catch { /* closed */ }
  }
} finally {
  await browser.close();
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
}
console.log(failures ? `${failures} browser check(s) failed` : "All browser checks passed");
process.exit(failures ? 1 : 0);
