-- Management dashboard (item 26): public.management_dashboard(p_from, p_to, p_brand). Admin and management get counts
-- that match the seeded data; every other role, an inactive manager and anon are refused; the date range (with its
-- edges) and the brand filter work; an empty database gives zeros, not errors; bad input is refused.
-- Run with: bash supabase/tests/local/run.sh management_dashboard_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Helpers ----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000d001'
    when 'mgmt' then '00000000-0000-0000-0000-00000000d002'
    when 'rep' then '00000000-0000-0000-0000-00000000d003'
    when 'rep2' then '00000000-0000-0000-0000-00000000d004'
    when 'care' then '00000000-0000-0000-0000-00000000d005'
    when 'mkt' then '00000000-0000-0000-0000-00000000d006'
    when 'hr' then '00000000-0000-0000-0000-00000000d007'
    when 'dist' then '00000000-0000-0000-0000-00000000d008'
    when 'norole' then '00000000-0000-0000-0000-00000000d009'
    when 'mgmt_off' then '00000000-0000-0000-0000-00000000d00a'
    when 'contact' then '00000000-0000-0000-0000-00000000d101'
    when 'org' then '00000000-0000-0000-0000-00000000d102'
    when 'role_open' then '00000000-0000-0000-0000-00000000d201'
    when 'role_past' then '00000000-0000-0000-0000-00000000d202'
    when 'role_closed' then '00000000-0000-0000-0000-00000000d203'
    when 'role_future' then '00000000-0000-0000-0000-00000000d204'
    when 'shop_new' then '00000000-0000-0000-0000-00000000d301'
    when 'shop_old' then '00000000-0000-0000-0000-00000000d302'
    when 'pr_lexta' then '00000000-0000-0000-0000-00000000d401'
    when 'pr_hooch' then '00000000-0000-0000-0000-00000000d402'
  end::uuid;
$$;

create function pg_temp.brand(slug text) returns uuid language sql stable as $$
  select id from public.brands where brands.slug = brand.slug;
$$;

create function pg_temp.region(slug text) returns uuid language sql stable as $$
  select id from public.regions where regions.slug = region.slug;
$$;

create function pg_temp.outcome(slug text) returns uuid language sql stable as $$
  select id from public.field_visit_outcomes where field_visit_outcomes.slug = outcome.slug;
$$;

create function pg_temp.login(label text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', case when label = 'anon' then '' else pg_temp.u(label)::text end, true),
         set_config('role', case when label = 'anon' then 'anon' else 'authenticated' end, true);
$$;

create function pg_temp.owner() returns void language sql as $$
  select set_config('request.jwt.claim.sub', '', true), set_config('role', 'postgres', true);
$$;

create function pg_temp.fails(stmt text, code text default null) returns boolean language plpgsql as $$
begin
  execute stmt;
  return false;
exception when others then
  if code is null or sqlstate = code then return true; end if;
  raise notice 'unexpected error % (%) for: %', sqlstate, sqlerrm, left(stmt, 200);
  return false;
end;
$$;

create function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', msg; end if;
end;
$$;

-- Same as ok(), and shows what came back.
create function pg_temp.eq(got jsonb, want jsonb, msg text) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL: % (got %, want %)', msg, got, want; end if;
end;
$$;

-- The dashboard as someone, then back to the database owner.
create function pg_temp.d(who text, p_from date default null, p_to date default null, p_brand uuid default null)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform pg_temp.login(who);
  r := public.management_dashboard(p_from, p_to, p_brand);
  perform pg_temp.owner();
  return r;
end;
$$;

-- Midnight in Ghana, n days before today.
create function pg_temp.day_start(n integer) returns timestamptz language sql stable as $$
  select (public.ghana_today() - n)::timestamp at time zone 'Africa/Accra';
$$;

-- Schema checks ------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.ok((select not p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'management_dashboard'), 'the dashboard runs as the caller (security invoker)');
  perform pg_temp.ok((select 'search_path=""' = any (p.proconfig) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'management_dashboard'), 'the dashboard sets search_path to empty');
  perform pg_temp.ok(not has_function_privilege('anon', 'public.management_dashboard(date,date,uuid)', 'execute'), 'anon cannot run it');
  perform pg_temp.ok(has_function_privilege('authenticated', 'public.management_dashboard(date,date,uuid)', 'execute'), 'signed in people can call it');
  raise notice 'PASS: security invoker, empty search_path, closed to anon';
end $$;

-- People -----------------------------------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),    'dash.admin@test.local',   '{"role":"admin"}',         '{"full_name":"Dash Admin"}'),
  (pg_temp.u('mgmt'),     'dash.mgmt@test.local',    '{"role":"management"}',    '{"full_name":"Dash Manager"}'),
  (pg_temp.u('mgmt_off'), 'dash.mgmtoff@test.local', '{"role":"management"}',    '{}'),
  (pg_temp.u('rep'),      'dash.rep@test.local',     '{"role":"sales_rep"}',     '{"full_name":"Kofi Rep"}'),
  (pg_temp.u('rep2'),     'dash.rep2@test.local',    '{"role":"sales_rep"}',     '{"full_name":"Esi Rep"}'),
  (pg_temp.u('care'),     'dash.care@test.local',    '{"role":"customer_care"}', '{}'),
  (pg_temp.u('mkt'),      'dash.mkt@test.local',     '{"role":"marketing"}',     '{}'),
  (pg_temp.u('hr'),       'dash.hr@test.local',      '{"role":"hr"}',            '{}'),
  (pg_temp.u('dist'),     'dash.dist@test.local',    '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),   'dash.norole@test.local',  '{}',                       '{}');
update public.profiles set is_active = false where id = pg_temp.u('mgmt_off');

-- What the migrations seed (products, maybe stockists), counted before the fixtures.
create temp table base as
select
  (select count(*) from public.products where is_published) as published,
  (select count(*) from public.products) as products,
  (select count(*) from public.products where is_published and brand_id = pg_temp.brand('hooch')) as published_hooch,
  (select count(*) from public.stockists where is_active) as stockists,
  (select count(*) from public.stockists s where s.is_active
     and exists (select 1 from public.stockist_brands sb where sb.stockist_id = s.id and sb.brand_id = pg_temp.brand('yazz'))) as stockists_yazz,
  (select count(*) from public.job_openings where status = 'open') as open_roles;
grant select on base to authenticated;

-- An empty database gives zeros, not errors ----------------------------------------------------------------------
do $$
declare d jsonb := pg_temp.d('admin');
begin
  perform pg_temp.eq(d->'from', to_jsonb(public.ghana_today() - 29), 'default start: 30 days ago, today included');
  perform pg_temp.eq(d->'to', to_jsonb(public.ghana_today()), 'default end: today');
  perform pg_temp.eq(d->'crm', '{"new_leads":0,"by_source":{},"by_stage":{},"open_now":0,"won":0,"lost":0,"unassigned_website":0}', 'empty CRM');
  perform pg_temp.eq(d->'complaints', '{"opened":0,"closed":0,"resolved":0,"avg_days_to_close":null,"open_now":0,"open_by_severity":{},"open_by_status":{},"overdue_now":0}', 'empty complaints');
  perform pg_temp.eq(d->'recruitment', jsonb_build_object('open_roles', (select open_roles from base), 'applications', 0, 'by_stage', '{}'::jsonb, 'in_progress_now', 0), 'empty recruitment');
  perform pg_temp.eq(d->'chat', '{"conversations":0,"awaiting_reply_now":0,"never_answered_now":0,"leads_from_chat":0}', 'empty chat');
  perform pg_temp.eq(d->'orders', '{"orders":0,"by_status":{},"lines":0,"packs":0,"to_confirm_now":0}', 'empty orders');
  perform pg_temp.eq(d->'field_sales', '{"visits":0,"reps":0,"new_shops_in_period":0,"top_reps":[],"outcomes":[],"shops_to_confirm_now":0}', 'empty field sales');
  perform pg_temp.eq(d->'csr', '{"activities_done":0,"people_reached":0,"by_programme":[],"planned_ahead":0}', 'empty CSR');
  perform pg_temp.eq(d->'catalogue', jsonb_build_object('published_products', (select published from base), 'products', (select products from base),
    'active_stockists', (select stockists from base)), 'catalogue counts what the migrations seed');
  perform pg_temp.eq(pg_temp.d('mgmt'), d, 'management gets the same as admin');
  perform pg_temp.eq(pg_temp.d('admin', null, null, pg_temp.brand('linzzy'))->'crm'->'new_leads', '0', 'a brand filter on an empty database');
  raise notice 'PASS: an empty database gives zeros and empty lists, default range is the last 30 days';
end $$;

-- Fixtures (as the database owner; triggers off so dates can be set in the past) ---------------------------------
set local session_replication_role = replica;

insert into public.crm_contacts (id, full_name) values (pg_temp.u('contact'), 'Dash Customer');
insert into public.crm_organisations (id, name, kind) values (pg_temp.u('org'), 'Dash Distributors', 'distributor');

-- CRM leads
insert into public.crm_leads (title, contact_id, brand_id, source, stage, lost_reason, owner_id, created_at, closed_at) values
  ('L1', pg_temp.u('contact'), pg_temp.brand('yazz'),  'website_contact_form', 'new',       null,    null,            now() - interval '2 days',  null),
  ('L2', pg_temp.u('contact'), pg_temp.brand('yazz'),  'phone',                'won',       null,    pg_temp.u('rep'), now() - interval '3 days',  now() - interval '1 day'),
  ('L3', pg_temp.u('contact'), pg_temp.brand('hooch'), 'website_live_chat',    'lost',      'Price', null,            now() - interval '5 days',  now() - interval '1 day'),
  ('L4', pg_temp.u('contact'), null,                   'referral',             'contacted', null,    null,            now() - interval '60 days', null),
  ('L5', pg_temp.u('contact'), pg_temp.brand('hooch'), 'website_partner_form', 'qualified', null,    pg_temp.u('rep'), pg_temp.day_start(29),     null),
  ('L6', pg_temp.u('contact'), pg_temp.brand('yazz'),  'email',                'new',       null,    null,            pg_temp.day_start(29) - interval '1 second', null);

-- Complaints
insert into public.complaints (case_number, brand_id, category, severity, channel, description, contact_id, status,
  response_due_at, resolution_due_at, first_response_at, resolution_summary, root_cause, resolved_at, closed_at, created_at) values
  ('LX-2026-9001', pg_temp.brand('yazz'),  'product_quality', 'high',     'website', 'K1', pg_temp.u('contact'), 'new',
    now() - interval '1 hour', now() + interval '5 days', null, null, null, null, null, now() - interval '1 day'),
  ('LX-2026-9002', pg_temp.brand('hooch'), 'packaging',       'normal',   'phone',   'K2', pg_temp.u('contact'), 'investigating',
    now() - interval '8 days', now() + interval '1 day', now() - interval '9 days', null, null, null, null, now() - interval '10 days'),
  ('LX-2026-9003', pg_temp.brand('yazz'),  'delivery',        'low',      'email',   'K3', pg_temp.u('contact'), 'closed',
    now() - interval '17 days', now() - interval '5 days', now() - interval '19 days', 'Sorted', null, null, now() - interval '15 days', now() - interval '20 days'),
  ('LX-2026-9004', pg_temp.brand('lexta'), 'other',           'critical', 'phone',   'K4', pg_temp.u('contact'), 'resolved',
    now() - interval '5 days', now() - interval '4 days', now() - interval '5 days', 'Fixed', 'Batch', now() - interval '2 days', null, now() - interval '6 days'),
  ('LX-2026-9005', pg_temp.brand('hooch'), 'other',           'normal',   'phone',   'K5', pg_temp.u('contact'), 'closed',
    now() - interval '98 days', now() - interval '90 days', now() - interval '99 days', 'Old', null, null, now() - interval '40 days', now() - interval '100 days'),
  ('LX-2026-9006', pg_temp.brand('hooch'), 'health_safety',   'critical', 'phone',   'K6', pg_temp.u('contact'), 'reopened',
    now() - interval '69 days', now() - interval '60 days', now() - interval '69 days', null, null, null, null, now() - interval '70 days');

-- Recruitment
insert into public.job_openings (id, reference, title, department, location, employment_type, level, summary, status, opens_at, closes_at) values
  (pg_temp.u('role_open'),   'LX-DSH-001', 'Open role',   'Sales', 'Accra', 'full_time', 'Entry', 'Open', 'open',   public.ghana_today() - 10, null),
  (pg_temp.u('role_past'),   'LX-DSH-002', 'Past role',   'Sales', 'Accra', 'full_time', 'Entry', 'Past', 'open',   public.ghana_today() - 40, public.ghana_today() - 1),
  (pg_temp.u('role_closed'), 'LX-DSH-003', 'Closed role', 'Sales', 'Accra', 'full_time', 'Entry', 'Shut', 'closed', public.ghana_today() - 40, null),
  (pg_temp.u('role_future'), 'LX-DSH-004', 'Future role', 'Sales', 'Accra', 'full_time', 'Entry', 'Soon', 'open',   public.ghana_today() + 5, null);
insert into public.job_applications (reference, opening_id, full_name, email, interest, stage, created_at) values
  ('LX-APP-2026-9001', pg_temp.u('role_open'), 'A One',   'a1@test.local', 'Sales', 'new',       now() - interval '1 day'),
  ('LX-APP-2026-9002', pg_temp.u('role_open'), 'A Two',   'a2@test.local', 'Sales', 'interview', now() - interval '5 days'),
  ('LX-APP-2026-9003', null,                   'A Three', 'a3@test.local', 'Sales', 'hired',     now() - interval '50 days'),
  ('LX-APP-2026-9004', null,                   'A Four',  'a4@test.local', 'Sales', 'rejected',  now() - interval '3 days');

-- Live chat
insert into public.chat_conversations (reference, brand_id, token_hash, visitor_name, status, last_staff_message_at, closed_at, created_at) values
  ('LC-D0000001', pg_temp.brand('yazz'),  repeat('1', 64), 'V One',   'open',    null,                      null,                      now() - interval '1 day'),
  ('LC-D0000002', pg_temp.brand('hooch'), repeat('2', 64), 'V Two',   'open',    now() - interval '1 hour', null,                      now() - interval '2 days'),
  ('LC-D0000003', pg_temp.brand('yazz'),  repeat('3', 64), 'V Three', 'waiting', now() - interval '3 days', null,                      now() - interval '3 days'),
  ('LC-D0000004', pg_temp.brand('lexta'), repeat('4', 64), 'V Four',  'closed',  now() - interval '44 days', now() - interval '40 days', now() - interval '45 days');

-- Distributor orders (D4 is a draft: staff never see it)
insert into public.distributor_orders (reference, organisation_id, status, brand_ids, submitted_at, created_at) values
  ('LX-ORD-2026-9001', pg_temp.u('org'), 'submitted', array[pg_temp.brand('yazz')],                        now() - interval '1 day',   now() - interval '1 day'),
  ('LX-ORD-2026-9002', pg_temp.u('org'), 'delivered', array[pg_temp.brand('yazz'), pg_temp.brand('hooch')], now() - interval '7 days',  now() - interval '7 days'),
  ('LX-ORD-2026-9003', pg_temp.u('org'), 'cancelled', array[pg_temp.brand('hooch')],                       now() - interval '4 days',  now() - interval '4 days'),
  ('LX-ORD-2026-9004', pg_temp.u('org'), 'draft',     '{}',                                                null,                       now() - interval '1 day'),
  ('LX-ORD-2026-9005', pg_temp.u('org'), 'confirmed', array[pg_temp.brand('hooch')],                       now() - interval '60 days', now() - interval '60 days');
insert into public.distributor_order_lines (order_id, brand_id, product_name_snapshot, sku_code_snapshot, pack_size_snapshot, quantity)
select o.id, pg_temp.brand(l.brand), 'P', 'S-' || l.n, 'Carton', l.qty
from (values ('LX-ORD-2026-9001', 'yazz', 1, 10), ('LX-ORD-2026-9001', 'yazz', 2, 5),
             ('LX-ORD-2026-9002', 'yazz', 3, 3), ('LX-ORD-2026-9002', 'hooch', 4, 20),
             ('LX-ORD-2026-9003', 'hooch', 5, 50), ('LX-ORD-2026-9004', 'yazz', 6, 99),
             ('LX-ORD-2026-9005', 'hooch', 7, 7)) l(ref, brand, n, qty)
join public.distributor_orders o on o.reference = l.ref;

-- Field sales: a draft shop awaiting confirmation (Hooch) and a confirmed one (Yazz)
insert into public.stockists (id, name, outlet_type, region_id, town, is_active) values
  (pg_temp.u('shop_new'), 'Dash New Shop', 'general_trade', pg_temp.region('ashanti'), 'Kumasi', false),
  (pg_temp.u('shop_old'), 'Dash Old Shop', 'supermarket',   pg_temp.region('greater-accra'), 'Accra', true);
insert into public.stockist_brands (stockist_id, brand_id) values
  (pg_temp.u('shop_new'), pg_temp.brand('hooch')),
  (pg_temp.u('shop_old'), pg_temp.brand('yazz'));
insert into public.field_visits (id, rep_id, stockist_id, new_shop, shop_name, brand_ids, visited_at, location_status, outcome_id) values
  (gen_random_uuid(), pg_temp.u('rep'),  pg_temp.u('shop_old'), false, 'Dash Old Shop', array[pg_temp.brand('yazz')], now() - interval '1 day',  'denied', pg_temp.outcome('order_taken')),
  (gen_random_uuid(), pg_temp.u('rep'),  pg_temp.u('shop_old'), false, 'Dash Old Shop', array[pg_temp.brand('yazz')], now() - interval '2 days', 'denied', pg_temp.outcome('no_order')),
  (gen_random_uuid(), pg_temp.u('rep2'), pg_temp.u('shop_new'), true,  'Dash New Shop', array[pg_temp.brand('hooch')], now() - interval '3 days', 'denied', pg_temp.outcome('order_taken')),
  (gen_random_uuid(), pg_temp.u('rep2'), pg_temp.u('shop_old'), false, 'Dash Old Shop', array[pg_temp.brand('yazz'), pg_temp.brand('hooch')], now() - interval '50 days', 'denied', pg_temp.outcome('follow_up')),
  (gen_random_uuid(), null,              pg_temp.u('shop_new'), false, 'Dash New Shop', array[pg_temp.brand('hooch')], now() - interval '4 days', 'unavailable', pg_temp.outcome('no_order'));
insert into public.field_new_shops (stockist_id, visit_id, confirmed_at) values
  (pg_temp.u('shop_new'), null, null),
  (pg_temp.u('shop_old'), null, now() - interval '30 days');

-- CSR
insert into public.csr_programmes (id, name, brand_id) values
  (pg_temp.u('pr_lexta'), 'Dash Lexta Outreach', null),
  (pg_temp.u('pr_hooch'), 'Dash Hooch Kitchens', pg_temp.brand('hooch'));
insert into public.csr_activities (programme_id, activity_date, status, region_id, place, people_reached) values
  (pg_temp.u('pr_lexta'), public.ghana_today() - 2,  'done',    pg_temp.region('volta'),   'Ho',      100),
  (pg_temp.u('pr_hooch'), public.ghana_today() - 5,  'done',    pg_temp.region('ashanti'), 'Kumasi',  50),
  (pg_temp.u('pr_hooch'), public.ghana_today() - 3,  'done',    pg_temp.region('ashanti'), 'Obuasi',  30),
  (pg_temp.u('pr_lexta'), public.ghana_today() + 5,  'planned', pg_temp.region('volta'),   'Hohoe',   999),
  (pg_temp.u('pr_hooch'), public.ghana_today() - 60, 'done',    pg_temp.region('ashanti'), 'Kejetia', 70);

-- Products: one published and one draft for Hooch
insert into public.products (brand_id, name, slug, is_published) values
  (pg_temp.brand('hooch'), 'Dash Published', 'dash-published', true),
  (pg_temp.brand('hooch'), 'Dash Draft', 'dash-draft', false);

set local session_replication_role = origin;

-- Who may open it ---------------------------------------------------------------------------------------------------
do $$
declare who text;
begin
  foreach who in array array['rep', 'care', 'mkt', 'hr', 'dist', 'norole', 'mgmt_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(pg_temp.fails($q$select public.management_dashboard()$q$, '42501'), who || ' is refused');
    perform pg_temp.ok(pg_temp.fails($q$select public.management_dashboard(current_date - 7, current_date, null)$q$, '42501'), who || ' is refused with a range too');
    perform pg_temp.owner();
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_dashboard()$q$, '42501'), 'anon is refused');
  perform pg_temp.owner();
  raise notice 'PASS: sales, customer care, marketing, HR, distributors, no role, an inactive manager and anon are refused';
end $$;

-- Default range (last 30 days), every brand -------------------------------------------------------------------------
do $$
declare d jsonb := pg_temp.d('mgmt');
begin
  perform pg_temp.eq(pg_temp.d('admin'), d, 'admin and management get the same numbers');
  perform pg_temp.eq(d->'crm', '{"new_leads":4,"open_now":4,"won":1,"lost":1,"unassigned_website":1,
    "by_source":{"website_contact_form":1,"phone":1,"website_live_chat":1,"website_partner_form":1},
    "by_stage":{"new":1,"won":1,"lost":1,"qualified":1}}', 'CRM: new leads by source and stage (the first moment of the range counts, the second before does not), open, won, lost, unassigned website leads');
  perform pg_temp.eq(d->'complaints', '{"opened":4,"closed":1,"resolved":1,"avg_days_to_close":5.0,"open_now":3,
    "open_by_severity":{"high":1,"normal":1,"critical":1},"open_by_status":{"new":1,"investigating":1,"reopened":1},"overdue_now":2}',
    'complaints: opened, closed, resolved, average days to close, open by severity and status, overdue');
  perform pg_temp.eq(d->'recruitment', jsonb_build_object('open_roles', (select open_roles from base) + 1, 'applications', 3,
    'by_stage', '{"new":1,"interview":1,"rejected":1}'::jsonb, 'in_progress_now', 2), 'recruitment: open roles (opened, not past closing), applications by stage');
  perform pg_temp.ok((select count(*) from public.job_openings where status = 'open') = (select open_roles from base) + 3,
    'two more roles have status open (one closed by date, one opening in 5 days) and are not counted');
  perform pg_temp.eq(d->'chat', '{"conversations":3,"awaiting_reply_now":2,"never_answered_now":1,"leads_from_chat":1}', 'chat');
  perform pg_temp.eq(d->'orders', '{"orders":3,"by_status":{"submitted":1,"delivered":1,"cancelled":1},"lines":4,"packs":38,"to_confirm_now":1}',
    'orders: drafts never counted, cancelled orders not in packs');
  perform pg_temp.eq(d->'field_sales', '{"visits":4,"reps":2,"new_shops_in_period":1,
    "top_reps":[{"name":"Kofi Rep","visits":2},{"name":"Esi Rep","visits":1},{"name":"Former staff","visits":1}],
    "outcomes":[{"label":"Order taken","visits":2},{"label":"No order","visits":2}],"shops_to_confirm_now":1}', 'field sales');
  perform pg_temp.eq(d->'csr', '{"activities_done":3,"people_reached":180,"planned_ahead":1,
    "by_programme":[{"name":"Dash Lexta Outreach","activities":1,"people":100},{"name":"Dash Hooch Kitchens","activities":2,"people":80}]}',
    'CSR: done activities only, people reached by programme');
  perform pg_temp.eq(d->'catalogue', jsonb_build_object('published_products', (select published from base) + 1,
    'products', (select products from base) + 2, 'active_stockists', (select stockists from base) + 1), 'products and stockists');
  raise notice 'PASS: admin and management get numbers that match the data for the last 30 days';
end $$;

-- Brand filter ---------------------------------------------------------------------------------------------------------
do $$
declare y jsonb := pg_temp.d('mgmt', null, null, pg_temp.brand('yazz'));
        h jsonb := pg_temp.d('admin', null, null, pg_temp.brand('hooch'));
begin
  perform pg_temp.eq(y->'brand_id', to_jsonb(pg_temp.brand('yazz')), 'the brand comes back');
  perform pg_temp.eq(y->'crm', '{"new_leads":2,"open_now":2,"won":1,"lost":0,"unassigned_website":1,
    "by_source":{"website_contact_form":1,"phone":1},"by_stage":{"new":1,"won":1}}', 'Yazz CRM');
  perform pg_temp.eq(h->'complaints', '{"opened":1,"closed":0,"resolved":0,"avg_days_to_close":null,"open_now":2,
    "open_by_severity":{"normal":1,"critical":1},"open_by_status":{"investigating":1,"reopened":1},"overdue_now":1}', 'Hooch complaints');
  perform pg_temp.eq(y->'recruitment', pg_temp.d('mgmt')->'recruitment', 'recruitment has no brand: always in full');
  perform pg_temp.eq(y->'chat', '{"conversations":2,"awaiting_reply_now":1,"never_answered_now":1,"leads_from_chat":0}', 'Yazz chat');
  perform pg_temp.eq(h->'chat'->'leads_from_chat', '1', 'Hooch lead from chat');
  perform pg_temp.eq(y->'orders', '{"orders":2,"by_status":{"submitted":1,"delivered":1},"lines":3,"packs":18,"to_confirm_now":1}',
    'Yazz orders: an order with Yazz on it, only its Yazz lines');
  perform pg_temp.eq(h->'orders', '{"orders":2,"by_status":{"delivered":1,"cancelled":1},"lines":1,"packs":20,"to_confirm_now":0}', 'Hooch orders');
  perform pg_temp.eq(y->'field_sales', '{"visits":2,"reps":1,"new_shops_in_period":0,"top_reps":[{"name":"Kofi Rep","visits":2}],
    "outcomes":[{"label":"Order taken","visits":1},{"label":"No order","visits":1}],"shops_to_confirm_now":0}', 'Yazz field sales');
  perform pg_temp.eq(h->'field_sales'->'shops_to_confirm_now', '1', 'Hooch shop to confirm');
  perform pg_temp.eq(h->'csr', '{"activities_done":2,"people_reached":80,"planned_ahead":0,
    "by_programme":[{"name":"Dash Hooch Kitchens","activities":2,"people":80}]}', 'Hooch CSR leaves out corporate programmes');
  perform pg_temp.eq(h->'catalogue'->'published_products', to_jsonb((select published_hooch from base) + 1), 'Hooch published products');
  perform pg_temp.eq(y->'catalogue'->'active_stockists', to_jsonb((select stockists_yazz from base) + 1), 'Yazz active stockists');
  raise notice 'PASS: the brand filter works where the data has a brand';
end $$;

-- Date range ---------------------------------------------------------------------------------------------------------
do $$
declare d jsonb := pg_temp.d('mgmt', public.ghana_today() - 90, public.ghana_today() - 30);
        one jsonb := pg_temp.d('admin', public.ghana_today() - 2, public.ghana_today() - 2);
begin
  perform pg_temp.eq(d->'from', to_jsonb(public.ghana_today() - 90), 'the start comes back');
  perform pg_temp.eq(d->'crm'->'new_leads', '2', 'older leads, the last second of the end day included, its next midnight not');
  perform pg_temp.eq(d->'crm'->'open_now', '4', 'open now ignores the range');
  perform pg_temp.eq(d->'complaints'->'opened', '1', 'older complaints opened');
  perform pg_temp.eq(d->'complaints'->'closed', '1', 'older complaints closed');
  perform pg_temp.eq(d->'complaints'->'avg_days_to_close', '60.0', 'average days to close for that range');
  perform pg_temp.eq(d->'recruitment'->'by_stage', '{"hired":1}', 'older applications');
  perform pg_temp.eq(d->'chat'->'conversations', '1', 'older chats');
  perform pg_temp.eq(d->'orders', '{"orders":1,"by_status":{"confirmed":1},"lines":1,"packs":7,"to_confirm_now":1}', 'older orders');
  perform pg_temp.eq(d->'field_sales'->'visits', '1', 'older visits');
  perform pg_temp.eq(d->'csr'->'people_reached', '70', 'older CSR');
  perform pg_temp.eq(one->'crm'->'new_leads', '1', 'a one day range');
  perform pg_temp.eq(one->'field_sales'->'visits', '1', 'a one day range of visits');
  raise notice 'PASS: the date range works, edges included';
end $$;

-- Bad input -------------------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_dashboard(current_date, current_date - 1, null)$q$, '22023'), 'a backwards range is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_dashboard(current_date - 4000, current_date, null)$q$, '22023'), 'a range over ten years is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_dashboard(null, null, gen_random_uuid())$q$, '22023'), 'an unknown brand is refused');
  perform pg_temp.ok((public.management_dashboard(current_date - 3650, current_date, null)->'crm'->>'new_leads')::int = 6, 'a ten year range works');
  perform pg_temp.owner();
  raise notice 'PASS: bad ranges and unknown brands are refused';
end $$;

rollback;
