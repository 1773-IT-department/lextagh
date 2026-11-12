// Screenshots for the staff user guide. Run through ./run.sh, which starts the throwaway harness database first
// (PGHOST and friends set). Seeds clearly fictional demo data ("Demo Shop Adabraka", "Ama Demo"), starts the local
// gateway (supabase/tests/local/browser/gateway.mjs) and the portal's production build, signs in as each demo role and
// saves PNGs to docs/user-guide/images (desktop 1280 px, field sales on a phone at 390 px, device scale 1).
// Outside hosts never resolve; product images that point at them get a plain grey tile instead.
// Every server it starts is stopped by its PID at the end.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
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
const OUT = process.env.GUIDE_SCREENSHOTS || path.resolve(HERE, "../images");
mkdirSync(OUT, { recursive: true });
const { psql } = await import(`${ROOT}/supabase/tests/local/forms/rpc_shim.mjs`);

async function q(sql, vars) {
  const r = await psql(sql, vars);
  if (r.code !== 0) throw new Error(r.err);
  return r.out;
}

// Demo people (password "harness-password" in the throwaway database only) ------------------------------------------
const U = {
  admin: "00000000-0000-0000-0000-00000000a001",
  manager: "00000000-0000-0000-0000-00000000a002",
  rep: "00000000-0000-0000-0000-00000000a003",
  care: "00000000-0000-0000-0000-00000000a004",
  marketing: "00000000-0000-0000-0000-00000000a005",
  hr: "00000000-0000-0000-0000-00000000a006",
  dist: "00000000-0000-0000-0000-00000000a007",
  dist2: "00000000-0000-0000-0000-00000000a008",
  rep2: "00000000-0000-0000-0000-00000000a009",
};
await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('${U.admin}', 'admin@demo.test', '{"role":"admin"}', '{"full_name":"Akosua Demo"}'),
  ('${U.manager}', 'manager@demo.test', '{"role":"management"}', '{"full_name":"Kwame Demo"}'),
  ('${U.rep}', 'rep@demo.test', '{"role":"sales_rep"}', '{"full_name":"Yaw Demo"}'),
  ('${U.care}', 'care@demo.test', '{"role":"customer_care"}', '{"full_name":"Efua Demo"}'),
  ('${U.marketing}', 'marketing@demo.test', '{"role":"marketing"}', '{"full_name":"Abena Demo"}'),
  ('${U.hr}', 'hr@demo.test', '{"role":"hr"}', '{"full_name":"Esi Demo"}'),
  ('${U.dist}', 'distributor@demo.test', '{"role":"distributor"}', '{"full_name":"Kofi Demo"}'),
  ('${U.dist2}', 'adwoa@demo.test', '{"role":"distributor"}', '{"full_name":"Adwoa Demo"}'),
  ('${U.rep2}', 'rep2@demo.test', '{"role":"sales_rep"}', '{"full_name":"Kojo Demo"}')`);
await q(`insert into public.profile_brands (profile_id, brand_id)
  select p, (select id from public.brands where slug = b) from (values
    ('${U.rep}'::uuid, 'yazz'), ('${U.rep}'::uuid, 'linzzy'), ('${U.rep2}'::uuid, 'hooch'),
    ('${U.marketing}'::uuid, 'yazz'), ('${U.marketing}'::uuid, 'linzzy'), ('${U.marketing}'::uuid, 'hooch')) v(p, b)`);

// Demo pack sizes and variant names in place of the catalogue's placeholders (this database only).
await q(`update public.product_skus set pack_size_label = 'Pack of 10 (demo)' where pack_size_label like '[PLACEHOLDER%';
  update public.product_skus set variant_name = 'Demo variant ' || sort_order / 10 where variant_name like '[PLACEHOLDER%'`);

const brand = (slug) => `(select id from public.brands where slug = '${slug}')`;
const region = (slug) => `(select id from public.regions where slug = '${slug}')`;
const product = (b, slug) => `(select p.id from public.products p join public.brands x on x.id = p.brand_id where x.slug = '${b}' and p.slug = '${slug}')`;
const outcome = (slug) => `(select id from public.field_visit_outcomes where slug = '${slug}')`;
const programme = (name) => `(select id from public.csr_programmes where name = '${name}')`;
// A time earlier today (never before midnight UTC, which is Ghana's midnight).
const today = (mins) => `greatest(date_trunc('day', now()) + interval '1 minute', now() - interval '${mins} minutes')`;

// Records for every system, written as the database owner with triggers off, so dates can sit in the past.
await q(`
set session_replication_role = replica;

insert into public.stockists (id, name, outlet_type, region_id, town, address, phone, latitude, longitude, opening_hours, is_active, created_by) values
  ('00000000-0000-0000-0000-00000000b001', 'Demo Shop Adabraka', 'general_trade', ${region("greater-accra")}, 'Adabraka', 'Near the Demo lorry station', '030 000 0001', 5.560000, -0.210000, 'Mon to Sat, 7am to 8pm', true, '${U.rep}'),
  ('00000000-0000-0000-0000-00000000b002', 'Demo Pharmacy Osu', 'pharmacy', ${region("greater-accra")}, 'Osu', 'Demo Street', null, 5.556000, -0.182000, null, true, '${U.marketing}'),
  ('00000000-0000-0000-0000-00000000b003', 'Demo Mart Kejetia', 'open_market', ${region("ashanti")}, 'Kumasi', null, null, 6.697000, -1.620000, null, true, '${U.rep2}'),
  ('00000000-0000-0000-0000-00000000b004', 'Demo Supermarket Tema', 'supermarket', ${region("greater-accra")}, 'Tema', 'Community 1', null, 5.669000, -0.016000, null, true, '${U.admin}'),
  ('00000000-0000-0000-0000-00000000b005', 'Demo Provisions Madina', 'general_trade', ${region("greater-accra")}, 'Madina', null, null, 5.668000, -0.166000, null, false, '${U.rep}'),
  ('00000000-0000-0000-0000-00000000b006', 'Demo Chemist Ho', 'pharmacy', ${region("volta")}, 'Ho', null, null, null, null, null, true, '${U.marketing}');
insert into public.stockist_brands (stockist_id, brand_id) select s, (select id from public.brands where slug = b) from (values
  ('00000000-0000-0000-0000-00000000b001'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000b001'::uuid, 'linzzy'),
  ('00000000-0000-0000-0000-00000000b002'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000b003'::uuid, 'hooch'),
  ('00000000-0000-0000-0000-00000000b004'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000b004'::uuid, 'hooch'),
  ('00000000-0000-0000-0000-00000000b005'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000b006'::uuid, 'linzzy')) v(s, b);

insert into public.crm_organisations (id, name, kind, region_id, stockist_id, owner_id) values
  ('00000000-0000-0000-0000-00000000c001', 'Demo Distributors Kumasi', 'distributor', ${region("ashanti")}, null, '${U.rep}'),
  ('00000000-0000-0000-0000-00000000c002', 'Demo Shop Adabraka', 'retailer', ${region("greater-accra")}, '00000000-0000-0000-0000-00000000b001', '${U.rep}'),
  ('00000000-0000-0000-0000-00000000c003', 'Demo Pharmacy Osu', 'pharmacy', ${region("greater-accra")}, '00000000-0000-0000-0000-00000000b002', null),
  ('00000000-0000-0000-0000-00000000c004', 'Demo Girls SHS Ho', 'institution', ${region("volta")}, null, '${U.marketing}');
insert into public.crm_organisation_brands (organisation_id, brand_id) select o, (select id from public.brands where slug = b) from (values
  ('00000000-0000-0000-0000-00000000c001'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000c001'::uuid, 'linzzy'),
  ('00000000-0000-0000-0000-00000000c002'::uuid, 'yazz'), ('00000000-0000-0000-0000-00000000c003'::uuid, 'hooch'),
  ('00000000-0000-0000-0000-00000000c004'::uuid, 'linzzy')) v(o, b);

insert into public.crm_contacts (id, full_name, organisation_id, phone, email, preferred_channel, consent_marketing, consent_at, consent_source, owner_id) values
  ('00000000-0000-0000-0000-00000000d001', 'Ama Demo', '00000000-0000-0000-0000-00000000c002', '024 000 0001', 'ama.demo@example.com', 'whatsapp', false, null, null, '${U.rep}'),
  ('00000000-0000-0000-0000-00000000d002', 'Kwesi Demo', '00000000-0000-0000-0000-00000000c001', '020 000 0002', null, 'phone', false, null, null, '${U.rep}'),
  ('00000000-0000-0000-0000-00000000d003', 'Afua Demo', null, null, 'afua.demo@example.com', 'email', true, now() - interval '9 days', 'Website newsletter form', null),
  ('00000000-0000-0000-0000-00000000d004', 'Nana Demo', '00000000-0000-0000-0000-00000000c004', '027 000 0004', null, 'phone', false, null, null, '${U.marketing}'),
  ('00000000-0000-0000-0000-00000000d005', 'Yaa Demo', null, '055 000 0005', 'yaa.demo@example.com', 'phone', false, null, null, null);

insert into public.crm_leads (id, title, description, contact_id, organisation_id, brand_id, source, stage, lost_reason, owner_id, next_action, next_action_date,
    estimated_monthly_volume, intake_reference, submitted_organisation_name, closed_at, created_at, created_by) values
  ('00000000-0000-0000-0000-00000000e001', 'Monthly Yazz pads order for Demo Shop Adabraka', 'The owner wants to stock Yazz pads every month. Met her on a shop visit.',
    '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000c002', ${brand("yazz")}, 'field_visit', 'contacted', null, '${U.rep}',
    'Call to agree the first order', current_date + 3, '20 packs a month', null, null, null, now() - interval '6 days', '${U.rep}'),
  ('00000000-0000-0000-0000-00000000e002', 'Become a Hooch distributor in Tamale', 'Partner form: we supply 40 shops around Tamale and want to add Hooch cereals.',
    '00000000-0000-0000-0000-00000000d003', null, ${brand("hooch")}, 'website_partner_form', 'new', null, null, null, null, null, 'PTN-DEMO000001', 'Demo Traders Tamale', null, now() - interval '1 day', null),
  ('00000000-0000-0000-0000-00000000e003', 'School supply of Linzzy napkins', null,
    '00000000-0000-0000-0000-00000000d004', '00000000-0000-0000-0000-00000000c004', ${brand("linzzy")}, 'phone', 'qualified', null, '${U.rep}',
    'Send the school a sample pack', current_date + 7, '200 packs a month', null, null, null, now() - interval '12 days', '${U.rep}'),
  ('00000000-0000-0000-0000-00000000e004', 'Question about Lexta products', 'Contact form: where can I buy your products in Ho?',
    '00000000-0000-0000-0000-00000000d003', null, ${brand("lexta")}, 'website_contact_form', 'new', null, null, null, null, null, 'ENQ-DEMO000002', null, null, now() - interval '3 hours', null),
  ('00000000-0000-0000-0000-00000000e005', 'Kumasi wholesale of Yazz and Linzzy', null,
    '00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-00000000c001', ${brand("yazz")}, 'referral', 'won', null, '${U.rep}',
    null, null, '150 cartons a month', null, null, now() - interval '4 days', now() - interval '30 days', '${U.rep}'),
  ('00000000-0000-0000-0000-00000000e006', 'Shelf space at Demo Pharmacy Osu', null,
    '00000000-0000-0000-0000-00000000d004', '00000000-0000-0000-0000-00000000c003', ${brand("hooch")}, 'email', 'lost', 'Chose another supplier', '${U.manager}',
    null, null, null, null, null, now() - interval '8 days', now() - interval '20 days', '${U.manager}');
insert into public.crm_activities (lead_id, type, body, occurred_at, created_at, created_by) values
  ('00000000-0000-0000-0000-00000000e001', 'visit', 'Shop visit: owner keen, asked for Heavy flow and Panty liners.', now() - interval '6 days', now() - interval '6 days', '${U.rep}'),
  ('00000000-0000-0000-0000-00000000e001', 'status_change', 'Stage changed from New to Contacted', now() - interval '5 days', now() - interval '5 days', '${U.rep}'),
  ('00000000-0000-0000-0000-00000000e001', 'call', 'Called Ama Demo. She will confirm quantities after payday.', now() - interval '2 days', now() - interval '2 days', '${U.rep}');
insert into public.crm_website_lead_managers (brand_id, manager_id, updated_by) values
  (null, '${U.manager}', '${U.admin}'), (${brand("yazz")}, '${U.rep}', '${U.admin}');

insert into public.complaints (id, case_number, brand_id, product_id, product_name_snapshot, batch_number, purchase_place, purchase_date, category, severity, channel,
    description, contact_id, status, owner_id, response_due_at, resolution_due_at, first_response_at, resolution_summary, root_cause, resolved_at, closed_at, created_at, created_by) values
  ('00000000-0000-0000-0000-00000000f001', 'LX-2026-0001', ${brand("yazz")}, ${product("yazz", "sanitary-pads-and-panty-liners")}, 'Sanitary Pads and Panty Liners',
    'B-DEMO-118', 'Demo Shop Adabraka', current_date - 6, 'product_quality', 'normal', 'phone',
    'Customer says some pads in one pack were torn when she opened it. She still has the pack.', '00000000-0000-0000-0000-00000000d005',
    'investigating', '${U.care}', now() - interval '1 day', now() + interval '7 days', now() - interval '2 days', null, null, null, null, now() - interval '3 days', '${U.care}'),
  ('00000000-0000-0000-0000-00000000f002', 'LX-2026-0002', ${brand("hooch")}, null, null, null, null, null, 'packaging', 'low', 'website',
    'The cereal box was dented and the inner bag was open.', '00000000-0000-0000-0000-00000000d003',
    'new', null, now() + interval '3 days', now() + interval '15 days', null, null, null, null, null, now() - interval '2 hours', null),
  ('00000000-0000-0000-0000-00000000f003', 'LX-2026-0003', ${brand("linzzy")}, null, null, 'L-DEMO-07', 'Demo Chemist Ho', current_date - 9, 'foreign_object', 'high', 'walk_in',
    'Customer found a small piece of plastic inside a pack.', '00000000-0000-0000-0000-00000000d004',
    'acknowledged', '${U.care}', now() - interval '5 days', now() - interval '1 day', now() - interval '5 days', null, null, null, null, now() - interval '6 days', '${U.care}'),
  ('00000000-0000-0000-0000-00000000f004', 'LX-2026-0004', ${brand("yazz")}, null, null, null, null, null, 'availability', 'normal', 'social_media',
    'Could not find Yazz toothpaste in shops in Cape Coast.', '00000000-0000-0000-0000-00000000d001',
    'closed', '${U.care}', now() - interval '18 days', now() - interval '10 days', now() - interval '19 days',
    'Told the customer which Demo shops stock it and passed the gap to sales.', null, null, now() - interval '12 days', now() - interval '20 days', '${U.care}');
insert into public.complaint_events (complaint_id, type, body, occurred_at, created_at, created_by) values
  ('00000000-0000-0000-0000-00000000f001', 'status_change', 'Status changed from New to Acknowledged', now() - interval '2 days', now() - interval '2 days', '${U.care}'),
  ('00000000-0000-0000-0000-00000000f001', 'call', 'Called Yaa Demo. She will bring the pack to Demo Shop Adabraka for collection.', now() - interval '2 days', now() - interval '2 days', '${U.care}'),
  ('00000000-0000-0000-0000-00000000f001', 'status_change', 'Status changed from Acknowledged to Investigating', now() - interval '1 day', now() - interval '1 day', '${U.care}'),
  ('00000000-0000-0000-0000-00000000f001', 'note', 'Asked the factory to check batch B-DEMO-118.', now() - interval '20 hours', now() - interval '20 hours', '${U.care}');

insert into public.field_visits (id, rep_id, stockist_id, new_shop, shop_name, region_id, town, brand_ids, visited_at, location_status, latitude, longitude, accuracy_m, outcome_id, notes) values
  (gen_random_uuid(), '${U.rep}', '00000000-0000-0000-0000-00000000b002', false, 'Demo Pharmacy Osu', ${region("greater-accra")}, 'Osu', array[${brand("yazz")}],
    ${today(90)}, 'captured', 5.556100, -0.182100, 14, ${outcome("follow_up")}, 'Pharmacist wants posters for the counter.'),
  (gen_random_uuid(), '${U.rep}', '00000000-0000-0000-0000-00000000b005', true, 'Demo Provisions Madina', ${region("greater-accra")}, 'Madina', array[${brand("yazz")}],
    now() - interval '1 day', 'captured', 5.668000, -0.166000, 20, ${outcome("order_taken")}, null),
  (gen_random_uuid(), '${U.rep}', '00000000-0000-0000-0000-00000000b004', false, 'Demo Supermarket Tema', ${region("greater-accra")}, 'Tema', array[${brand("yazz")}],
    now() - interval '2 days', 'denied', null, null, null, ${outcome("no_order")}, null),
  (gen_random_uuid(), '${U.rep2}', '00000000-0000-0000-0000-00000000b003', false, 'Demo Mart Kejetia', ${region("ashanti")}, 'Kumasi', array[${brand("hooch")}],
    now() - interval '1 day', 'captured', 6.697200, -1.620300, 9, ${outcome("order_taken")}, 'Took an order for 6 cartons.'),
  (gen_random_uuid(), '${U.rep2}', '00000000-0000-0000-0000-00000000b004', false, 'Demo Supermarket Tema', ${region("greater-accra")}, 'Tema', array[${brand("hooch")}],
    now() - interval '3 days', 'captured', 5.669100, -0.016200, 30, ${outcome("shop_closed")}, null);

insert into public.csr_activities (programme_id, activity_date, status, region_id, place, people_reached, partners, notes, created_at, created_by) values
  (${programme("The Dignity Project")}, current_date - 20, 'done', ${region("volta")}, 'Demo Girls SHS, Ho', 320, 'Ghana Education Service (demo)', 'Talk on menstrual health and free packs for every girl.', now() - interval '19 days', '${U.marketing}'),
  (${programme("The Empowered Periods Campaign")}, current_date - 45, 'done', ${region("ashanti")}, 'Demo JHS, Kumasi', 450, null, null, now() - interval '44 days', '${U.marketing}'),
  (${programme("The Lexta Teen Care Campaign")}, current_date - 70, 'done', ${region("greater-accra")}, 'Demo SHS, Accra', 600, null, 'School clean up competition.', now() - interval '69 days', '${U.marketing}'),
  (${programme("The Bright Smiles School Tour")}, current_date + 14, 'planned', ${region("northern")}, 'Demo Primary School, Tamale', 200, 'Demo dental team', null, now() - interval '2 days', '${U.marketing}');

update public.job_openings set status = 'open', opens_at = current_date - 10, closes_at = current_date + 20 where reference in ('LX-PRD-114', 'LX-QA-051');
insert into public.job_applications (id, reference, opening_id, opening_reference_snapshot, opening_title_snapshot, full_name, email, phone, interest, message,
    cv_path, cv_file_name, cv_size_bytes, cv_mime_type, consent_keep, consent_at, stage, stage_changed_at, owner_id, created_at) values
  ('00000000-0000-0000-0000-00000000aa01', 'LX-APP-2026-0001', (select id from public.job_openings where reference = 'LX-PRD-114'), 'LX-PRD-114', 'Production Line Supervisor',
    'Akua Demo', 'akua.demo@example.com', '024 000 0101', null, 'I have five years on a tissue converting line.',
    'demo/akua-demo-cv.pdf', 'Akua-Demo-CV.pdf', 120000, 'application/pdf', true, now() - interval '4 days', 'screening', now() - interval '1 day', '${U.hr}', now() - interval '4 days'),
  ('00000000-0000-0000-0000-00000000aa02', 'LX-APP-2026-0002', (select id from public.job_openings where reference = 'LX-QA-051'), 'LX-QA-051', 'Quality Assurance Officer',
    'Kwabena Demo', 'kwabena.demo@example.com', null, null, null,
    'demo/kwabena-demo-cv.docx', 'Kwabena-Demo-CV.docx', 90000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', false, null, 'new', now() - interval '5 hours', null, now() - interval '5 hours'),
  ('00000000-0000-0000-0000-00000000aa03', 'LX-APP-2026-0003', null, null, null,
    'Selorm Demo', 'selorm.demo@example.com', '020 000 0103', 'Sales and marketing', 'Open to any sales role in the Volta Region.',
    'demo/selorm-demo-cv.pdf', 'Selorm-Demo-CV.pdf', 80000, 'application/pdf', true, now() - interval '9 days', 'interview', now() - interval '2 days', '${U.hr}', now() - interval '9 days');
insert into public.job_application_events (application_id, type, from_stage, to_stage, note, created_by, created_at) values
  ('00000000-0000-0000-0000-00000000aa01', 'received', null, 'new', null, null, now() - interval '4 days'),
  ('00000000-0000-0000-0000-00000000aa01', 'stage_change', 'new', 'screening', 'CV looks strong, call to check notice period.', '${U.hr}', now() - interval '1 day');

insert into public.chat_conversations (id, reference, brand_id, token_hash, visitor_name, visitor_email, visitor_phone, start_page, status, assigned_to,
    last_message_at, last_message_preview, last_visitor_message_at, last_staff_message_at, staff_read_at, activity_at, visitor_message_count, closed_at, created_at) values
  ('00000000-0000-0000-0000-00000000ab01', 'LC-0000D001', ${brand("lexta")}, repeat('a', 64), 'Kafui Demo', 'kafui.demo@example.com', null, '/our-brands', 'open', null,
    now() - interval '4 minutes', 'Hello, where can I buy Yazz pads in Ho?', now() - interval '4 minutes', null, null, now() - interval '4 minutes', 1, null, now() - interval '4 minutes'),
  ('00000000-0000-0000-0000-00000000ab02', 'LC-0000D002', ${brand("lexta")}, repeat('b', 64), 'Mawuli Demo', null, '024 000 0202', '/contact-us', 'waiting', '${U.care}',
    now() - interval '25 minutes', 'You can find them at Demo Chemist Ho.', now() - interval '35 minutes', now() - interval '25 minutes', now() - interval '25 minutes', now() - interval '25 minutes', 2, null, now() - interval '40 minutes'),
  ('00000000-0000-0000-0000-00000000ab03', 'LC-0000D003', ${brand("lexta")}, repeat('c', 64), 'Dzifa Demo', 'dzifa.demo@example.com', null, '/', 'closed', '${U.care}',
    now() - interval '2 days', 'Thank you!', now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', 2, now() - interval '2 days', now() - interval '2 days');
insert into public.chat_messages (conversation_id, sender, author_id, is_internal, body, created_at) values
  ('00000000-0000-0000-0000-00000000ab01', 'visitor', null, false, 'Hello, where can I buy Yazz pads in Ho?', now() - interval '4 minutes'),
  ('00000000-0000-0000-0000-00000000ab02', 'visitor', null, false, 'Good afternoon. Which shop in Ho sells Linzzy napkins?', now() - interval '40 minutes'),
  ('00000000-0000-0000-0000-00000000ab02', 'visitor', null, false, 'I am near the Ho main station.', now() - interval '35 minutes'),
  ('00000000-0000-0000-0000-00000000ab02', 'staff', '${U.care}', true, 'Checked Stockists: Demo Chemist Ho carries Linzzy.', now() - interval '30 minutes'),
  ('00000000-0000-0000-0000-00000000ab02', 'staff', '${U.care}', false, 'You can find them at Demo Chemist Ho.', now() - interval '25 minutes'),
  ('00000000-0000-0000-0000-00000000ab03', 'visitor', null, false, 'Do you have vacancies?', now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000ab03', 'visitor', null, false, 'Thank you!', now() - interval '2 days');

insert into public.distributor_accounts (profile_id, organisation_id, created_by) values ('${U.dist}', '00000000-0000-0000-0000-00000000c001', '${U.rep}');
set session_replication_role = origin;`);

// Orders through the real functions, as the distributor and then the rep, so references and history are genuine.
const asUser = (id, sql) => q(`select set_config('request.jwt.claim.sub', '${id}', false); set role authenticated; ${sql}; reset role;`);
const lines = (codes, qty) => `(select jsonb_agg(jsonb_build_object('sku_id', s.id, 'quantity', ${qty})) from public.product_skus s where s.sku_code in (${codes.map((c) => `'${c}'`).join(", ")}))`;
await asUser(U.dist, `select public.save_distributor_order(null, jsonb_build_object('delivery_region_id', ${region("ashanti")}, 'delivery_address', 'Demo Warehouse, Adum, Kumasi',
  'distributor_notes', 'Please deliver before Friday.', 'lines', ${lines(["TBC-YAZZ-001", "TBC-YAZZ-002", "TBC-LINZZY-004"], 12)}), true)`);
await asUser(U.dist, `select public.save_distributor_order(null, jsonb_build_object('delivery_region_id', ${region("ashanti")}, 'delivery_address', 'Demo Warehouse, Adum, Kumasi',
  'lines', ${lines(["TBC-YAZZ-005", "TBC-YAZZ-006"], 30)}), true)`);
await asUser(U.dist, `select public.save_distributor_order(null, jsonb_build_object('lines', ${lines(["TBC-LINZZY-001"], 5)}), false)`);
const firstOrder = (await q(`select id from public.distributor_orders where status = 'submitted' order by created_at limit 1`)).trim();
await asUser(U.rep, `select public.set_distributor_order_status('${firstOrder}', 'confirmed', 'On the Tuesday truck.')`);
await asUser(U.rep, `insert into public.distributor_order_staff_notes (order_id, body) values ('${firstOrder}', 'Credit limit checked with finance.')`);

// The photo secret the portal signs with, the same in the database (a test value for this throwaway database only).
const PHOTO_SECRET = "guide-demo-photo-secret-0123456789abcdef0123456789";
await q("insert into private.field_photo_secret (secret) values (:'s')", { s: PHOTO_SECRET });
console.log("seeded demo data");

// Servers --------------------------------------------------------------------------------------------------------------
const procs = [];
function run(cmd, args, opts) {
  const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
  const log = process.env.GUIDE_SERVER_LOG;
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
const STORE = mkdtempSync(path.join(os.tmpdir(), "lexta-guide-store-"));
run("node", [`${ROOT}/supabase/tests/local/browser/gateway.mjs`, "54401"], { env: { ...process.env, SHIM_STORAGE_DIR: STORE } });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54401", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_harness",
  FIELD_PHOTO_SECRET: PHOTO_SECRET };
run(`${ROOT}/apps/portal/node_modules/.bin/next`, ["start", "-p", "3104", "-H", "127.0.0.1"], { cwd: `${ROOT}/apps/portal`, env });
console.log(`started pids ${procs.map((p) => p.pid).join(", ")}`);
const PORTAL = "http://127.0.0.1:3104";

// Browser --------------------------------------------------------------------------------------------------------------
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
// A plain grey tile for product images that live on outside hosts.
const GREY = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e3e8ec"/></svg>`);
const NEAR_ADABRAKA = { latitude: 5.5605, longitude: -0.2102, accuracy: 12 };

async function context(kind) {
  const phone = kind === "phone";
  const ctx = await browser.newContext({
    ...(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } }),
    deviceScaleFactor: 1,
    ...(phone ? { geolocation: NEAR_ADABRAKA, permissions: ["geolocation"] } : {}),
  });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => (r.request().resourceType() === "image"
    ? r.fulfill({ status: 200, contentType: "image/svg+xml", body: GREY }) : r.abort()));
  return ctx;
}
async function login(email, kind = "desktop") {
  const ctx = await context(kind);
  const page = await ctx.newPage();
  await page.goto(`${PORTAL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("harness-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return page;
}
async function go(page, url) {
  await page.goto(`${PORTAL}${url}`);
  await page.locator("main h1").first().waitFor();
  await page.waitForLoadState("networkidle").catch(() => {});
}
const shots = [];
/** Saves a PNG. Full pages are cut at maxHeight so files stay small. */
async function shot(page, name, { full = false, maxHeight = 1500 } = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  if (full) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const w = page.viewportSize().width;
    await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, maxHeight) } });
  } else {
    await page.screenshot({ path: file });
  }
  shots.push(name);
  console.log(`  saved ${name}.png`);
}

let failed = false;
try {
  await waitFor("http://127.0.0.1:54401/rest/v1/");
  await waitFor(`${PORTAL}/login`);

  // 1. Getting started -------------------------------------------------------------------------------------------------
  {
    const ctx = await context("desktop");
    const page = await ctx.newPage();
    await page.goto(`${PORTAL}/login`);
    await page.getByLabel("Email").waitFor();
    await shot(page, "01-sign-in");
    await page.goto(`${PORTAL}/forgot-password`);
    await page.getByLabel("Email").waitFor();
    await shot(page, "02-forgot-password");
    await ctx.close();
  }
  const admin = await login("admin@demo.test");
  await go(admin, "/");
  await shot(admin, "03-home-admin");
  const repPhone = await login("rep@demo.test", "phone");
  await go(repPhone, "/");
  await shot(repPhone, "04-home-phone", { full: true, maxHeight: 1400 });

  // 2. Management dashboard ---------------------------------------------------------------------------------------------
  const manager = await login("manager@demo.test");
  await go(manager, "/systems/dashboard");
  await shot(manager, "10-dashboard", { full: true, maxHeight: 1500 });

  // 3. Distributor ordering ---------------------------------------------------------------------------------------------
  const rep = await login("rep@demo.test");
  await go(rep, "/systems/orders");
  await shot(rep, "20-orders-inbox");
  await go(rep, `/systems/orders/${firstOrder}`);
  await shot(rep, "21-order-staff", { full: true, maxHeight: 1300 });
  await go(rep, "/systems/orders/distributors");
  await shot(rep, "22-distributor-logins");
  const dist = await login("distributor@demo.test");
  await go(dist, "/systems/orders");
  await shot(dist, "23-distributor-my-orders");
  await go(dist, "/systems/orders/new");
  const steppers = dist.locator(".stepper input");
  await steppers.nth(0).fill("24");
  await steppers.nth(1).fill("12");
  await shot(dist, "24-distributor-new-order");
  await dist.getByRole("button", { name: "Review order" }).click();
  await dist.getByRole("heading", { name: "Your order" }).waitFor();
  await shot(dist, "25-distributor-review", { full: true, maxHeight: 1300 });

  // 4. Field sales (phone) ----------------------------------------------------------------------------------------------
  await go(repPhone, "/systems/field-sales");
  await shot(repPhone, "30-field-today", { full: true, maxHeight: 1200 });
  await repPhone.getByRole("link", { name: "Start visit" }).click();
  await repPhone.getByText("Location captured").waitFor();
  await repPhone.locator(".fs-shop .fs-shop-name").first().waitFor();
  await shot(repPhone, "31-field-pick-shop", { full: true, maxHeight: 1300 });
  await repPhone.locator(".fs-shop", { hasText: "Demo Shop Adabraka" }).click();
  await repPhone.getByRole("heading", { name: "Demo Shop Adabraka" }).waitFor();
  // A demo shelf photo, made by the browser.
  const photoCtx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  const photoPage = await photoCtx.newPage();
  await photoPage.setContent(`<body style="margin:0;background:#f4efe6"><div style="display:flex;gap:12px;padding:60px">${
    ["#12a3c4", "#e05a8a", "#f2b632", "#0b2f3d", "#7bc96f"].map((c) => `<div style="width:120px;height:300px;background:${c};border-radius:8px"></div>`).join("")}</div></body>`);
  const photoFile = path.join(STORE, "demo-shelf.jpg");
  writeFileSync(photoFile, await photoPage.screenshot({ type: "jpeg", quality: 80 }));
  await photoCtx.close();
  await repPhone.locator('input[aria-label="Take a photo"]').setInputFiles(photoFile);
  await repPhone.locator(".fs-thumb img").first().waitFor();
  await repPhone.getByText("Order taken", { exact: true }).click();
  await repPhone.getByLabel("Notes (optional)").fill("Spoke to Ama Demo. Wants Heavy flow packs next week.");
  await repPhone.getByText("Quick stock check (optional)").click();
  await repPhone.locator(".fs-stock-list li").first().getByRole("button", { name: "On shelf", exact: true }).click();
  await shot(repPhone, "32-field-visit-form", { full: true, maxHeight: 1700 });
  await repPhone.getByRole("button", { name: "Save visit" }).click();
  await repPhone.getByRole("heading", { name: "Visit saved" }).waitFor({ timeout: 30000 });
  await repPhone.getByRole("heading", { name: "Visit saved" }).scrollIntoViewIfNeeded();
  await repPhone.evaluate(() => window.scrollBy(0, 200));
  await shot(repPhone, "33-field-visit-saved");
  await go(manager, "/systems/field-sales");
  await shot(manager, "34-field-all-visits");

  // 5. CRM ----------------------------------------------------------------------------------------------------------------
  await go(rep, "/systems/crm/leads");
  await shot(rep, "40-crm-leads");
  await go(rep, "/systems/crm/leads/00000000-0000-0000-0000-00000000e001");
  await shot(rep, "41-crm-lead", { full: true, maxHeight: 1500 });
  await go(admin, "/systems/crm/settings/website-leads");
  await shot(admin, "42-crm-website-lead-managers", { full: true, maxHeight: 1300 });

  // 6. Complaints ----------------------------------------------------------------------------------------------------------
  const care = await login("care@demo.test");
  await go(care, "/systems/complaints");
  await shot(care, "50-complaints-list");
  await go(care, "/systems/complaints/00000000-0000-0000-0000-00000000f001");
  await shot(care, "51-complaint", { full: true, maxHeight: 1600 });
  await go(care, "/systems/complaints/new");
  await shot(care, "52-log-complaint");

  // 7. Product management --------------------------------------------------------------------------------------------------
  const mkt = await login("marketing@demo.test");
  await go(mkt, "/systems/products");
  await shot(mkt, "60-products");
  const toothpaste = (await q(`select id from public.products where slug = 'toothpaste'`)).trim();
  await go(mkt, `/systems/products/${toothpaste}`);
  await shot(mkt, "61-product-edit", { full: true, maxHeight: 1600 });

  // 8. Stockists ------------------------------------------------------------------------------------------------------------
  await go(mkt, "/systems/stockists");
  await shot(mkt, "70-stockists");
  await go(mkt, "/systems/stockists/import");
  await mkt.getByLabel("Or paste the CSV text").fill([
    "name,outlet_type,region,town,address,phone,latitude,longitude,brands",
    "Demo Store Cape Coast,general trade,Central,Cape Coast,Opposite the Demo market,,,,Yazz",
    "Demo Pharmacy Takoradi,pharmacy,Western,Takoradi,,031 000 0002,4.8970,-1.7600,Yazz; Linzzy",
    "Demo Kiosk Bolga,kiosk,Upper East,Bolgatanga,,,,Yazz",
  ].join("\n"));
  await mkt.getByRole("button", { name: "Check rows" }).click();
  await mkt.getByRole("button", { name: /^Import \d+ valid/ }).waitFor();
  await shot(mkt, "71-stockists-import", { full: true, maxHeight: 1500 });
  await go(mkt, "/systems/stockists/00000000-0000-0000-0000-00000000b001");
  await shot(mkt, "72-stockist-edit", { full: true, maxHeight: 1500 });

  // 9. CSR activities -------------------------------------------------------------------------------------------------------
  await go(mkt, "/systems/csr");
  await shot(mkt, "80-csr", { full: true, maxHeight: 1400 });
  await go(mkt, "/systems/csr/new");
  await shot(mkt, "81-csr-log");

  // 10. Recruitment ---------------------------------------------------------------------------------------------------------
  const hr = await login("hr@demo.test");
  await go(hr, "/systems/recruitment");
  await shot(hr, "90-recruitment");
  await go(hr, "/systems/recruitment/applications/00000000-0000-0000-0000-00000000aa01");
  await shot(hr, "91-application", { full: true, maxHeight: 1400 });
  await go(hr, "/systems/recruitment/roles");
  await shot(hr, "92-roles");

  // 11. Live chat -----------------------------------------------------------------------------------------------------------
  await go(care, "/systems/chat");
  await shot(care, "100-chat-inbox");
  await go(care, "/systems/chat/00000000-0000-0000-0000-00000000ab02");
  await shot(care, "101-chat-conversation", { full: true, maxHeight: 1400 });

  // 12. Users and access ----------------------------------------------------------------------------------------------------
  await go(admin, "/systems/users");
  await shot(admin, "110-users");
} catch (e) {
  failed = true;
  console.error(e);
} finally {
  await browser.close().catch(() => {});
  for (const p of procs) { try { process.kill(p.pid); } catch { /* gone */ } }
  rmSync(STORE, { recursive: true, force: true });
}
console.log(`${shots.length} screenshots in ${OUT}`);
process.exit(failed ? 1 : 0);
