-- Management overview (0015): public.management_timeseries and public.management_activity. Admin and management get
-- data that matches the fixtures; every other role, an inactive manager and anon are refused; day, week and month
-- points add up to the dashboard's own counts; the previous period of the same length works out; the brand, system
-- and person filters work; keyset paging returns every row once, newest first; drafts, token hashes and contact
-- details never come back; bad input is refused.
-- Run with: bash supabase/tests/local/run.sh management_overview_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Helpers ----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-0000000e0001'
    when 'mgmt' then '00000000-0000-0000-0000-0000000e0002'
    when 'rep' then '00000000-0000-0000-0000-0000000e0003'
    when 'rep2' then '00000000-0000-0000-0000-0000000e0004'
    when 'care' then '00000000-0000-0000-0000-0000000e0005'
    when 'mkt' then '00000000-0000-0000-0000-0000000e0006'
    when 'hr' then '00000000-0000-0000-0000-0000000e0007'
    when 'dist' then '00000000-0000-0000-0000-0000000e0008'
    when 'norole' then '00000000-0000-0000-0000-0000000e0009'
    when 'mgmt_off' then '00000000-0000-0000-0000-0000000e000a'
    when 'contact' then '00000000-0000-0000-0000-0000000e0101'
    when 'org' then '00000000-0000-0000-0000-0000000e0102'
    when 'lead1' then '00000000-0000-0000-0000-0000000e0201'
    when 'lead2' then '00000000-0000-0000-0000-0000000e0202'
    when 'lead_old' then '00000000-0000-0000-0000-0000000e0203'
    when 'cmp1' then '00000000-0000-0000-0000-0000000e0301'
    when 'cmp2' then '00000000-0000-0000-0000-0000000e0302'
    when 'app1' then '00000000-0000-0000-0000-0000000e0401'
    when 'chat1' then '00000000-0000-0000-0000-0000000e0501'
    when 'chat2' then '00000000-0000-0000-0000-0000000e0502'
    when 'ord1' then '00000000-0000-0000-0000-0000000e0601'
    when 'ord2' then '00000000-0000-0000-0000-0000000e0602'
    when 'ord_draft' then '00000000-0000-0000-0000-0000000e0603'
    when 'visit1' then '00000000-0000-0000-0000-0000000e0701'
    when 'visit2' then '00000000-0000-0000-0000-0000000e0702'
    when 'shop_new' then '00000000-0000-0000-0000-0000000e0801'
    when 'shop_edit' then '00000000-0000-0000-0000-0000000e0802'
    when 'pr_hooch' then '00000000-0000-0000-0000-0000000e0901'
    when 'csr1' then '00000000-0000-0000-0000-0000000e0902'
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

create function pg_temp.eq(got jsonb, want jsonb, msg text) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL: % (got %, want %)', msg, got, want; end if;
end;
$$;

-- The functions as someone, then back to the database owner.
create function pg_temp.ts(who text, p_from date default null, p_to date default null, p_brand uuid default null)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform pg_temp.login(who);
  r := public.management_timeseries(p_from, p_to, p_brand);
  perform pg_temp.owner();
  return r;
end;
$$;

create function pg_temp.dash(who text, p_from date default null, p_to date default null, p_brand uuid default null)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform pg_temp.login(who);
  r := public.management_dashboard(p_from, p_to, p_brand);
  perform pg_temp.owner();
  return r;
end;
$$;

create function pg_temp.feed(who text, p_from date default null, p_to date default null, p_brand uuid default null,
  p_system text default null, p_person uuid default null, p_before_at timestamptz default null, p_before_key text default null,
  p_limit integer default 30)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform pg_temp.login(who);
  r := public.management_activity(p_from, p_to, p_brand, p_system, p_person, p_before_at, p_before_key, p_limit);
  perform pg_temp.owner();
  return r;
end;
$$;

-- "kind title" of every item, in order.
create function pg_temp.kinds(f jsonb) returns text[] language sql immutable as $$
  select coalesce(array_agg((i->>'kind') || ' ' || (i->>'title') order by n), '{}') from jsonb_array_elements(f->'items') with ordinality t(i, n);
$$;

-- A sum over the chart points.
create function pg_temp.total(t jsonb, series text) returns integer language sql immutable as $$
  select coalesce(sum((p->>series)::int), 0)::int from jsonb_array_elements(t->'points') p;
$$;

create function pg_temp.day_start(n integer) returns timestamptz language sql stable as $$
  select (public.ghana_today() - n)::timestamp at time zone 'Africa/Accra';
$$;

-- Schema checks ------------------------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array['management_timeseries', 'management_activity'] loop
    perform pg_temp.ok((select not p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = f), f || ' runs as the caller (security invoker)');
    perform pg_temp.ok((select 'search_path=""' = any (p.proconfig) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = f), f || ' sets search_path to empty');
    perform pg_temp.ok((select p.provolatile = 's' from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = f), f || ' is stable (read only)');
  end loop;
  perform pg_temp.ok(not has_function_privilege('anon', 'public.management_timeseries(date,date,uuid)', 'execute'), 'anon cannot run the charts');
  perform pg_temp.ok(not has_function_privilege('anon', 'public.management_activity(date,date,uuid,text,uuid,timestamptz,text,integer)', 'execute'), 'anon cannot run the feed');
  perform pg_temp.ok(has_function_privilege('authenticated', 'public.management_timeseries(date,date,uuid)', 'execute'), 'signed in people can call the charts');
  perform pg_temp.ok(has_function_privilege('authenticated', 'public.management_activity(date,date,uuid,text,uuid,timestamptz,text,integer)', 'execute'), 'signed in people can call the feed');
  perform pg_temp.ok((select count(*) from pg_indexes where schemaname = 'public' and indexname in ('crm_activities_occurred_idx',
    'complaint_events_occurred_idx', 'distributor_order_events_created_idx', 'job_application_events_created_idx', 'chat_conversations_created_idx')) = 5,
    'the feed has its five date indexes');
  raise notice 'PASS: security invoker, stable, empty search_path, closed to anon, date indexes';
end $$;

-- People -----------------------------------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),    'ov.admin@test.local',   '{"role":"admin"}',         '{"full_name":"Ov Admin"}'),
  (pg_temp.u('mgmt'),     'ov.mgmt@test.local',    '{"role":"management"}',    '{"full_name":"Ov Manager"}'),
  (pg_temp.u('mgmt_off'), 'ov.mgmtoff@test.local', '{"role":"management"}',    '{}'),
  (pg_temp.u('rep'),      'ov.rep@test.local',     '{"role":"sales_rep"}',     '{"full_name":"Kofi Rep"}'),
  (pg_temp.u('rep2'),     'ov.rep2@test.local',    '{"role":"sales_rep"}',     '{"full_name":"Esi Rep"}'),
  (pg_temp.u('care'),     'ov.care@test.local',    '{"role":"customer_care"}', '{"full_name":"Efua Care"}'),
  (pg_temp.u('mkt'),      'ov.mkt@test.local',     '{"role":"marketing"}',     '{}'),
  (pg_temp.u('hr'),       'ov.hr@test.local',      '{"role":"hr"}',            '{"full_name":"Hana HR"}'),
  (pg_temp.u('dist'),     'ov.dist@test.local',    '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),   'ov.norole@test.local',  '{}',                       '{}');
update public.profiles set is_active = false where id = pg_temp.u('mgmt_off');

-- Who may open it (before any data, and again with data below) -----------------------------------------------------
do $$
declare who text;
begin
  foreach who in array array['rep', 'care', 'mkt', 'hr', 'dist', 'norole', 'mgmt_off', 'anon'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(pg_temp.fails($q$select public.management_timeseries()$q$, '42501'), who || ' is refused the charts');
    perform pg_temp.ok(pg_temp.fails($q$select public.management_activity()$q$, '42501'), who || ' is refused the feed');
    perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, null, 'crm', null, null, null, 5)$q$, '42501'), who || ' is refused a filtered feed');
    perform pg_temp.owner();
  end loop;
  raise notice 'PASS: sales, customer care, marketing, HR, distributors, no role, an inactive manager and anon are refused';
end $$;

-- An empty database ----------------------------------------------------------------------------------------------------
do $$
declare t jsonb := pg_temp.ts('admin');
        f jsonb;
begin
  perform pg_temp.eq(t->'unit', '"day"', 'the last 30 days are charted by day');
  perform pg_temp.ok(jsonb_array_length(t->'points') = 30, 'thirty points');
  perform pg_temp.eq(t->'points'->0->'from', to_jsonb(public.ghana_today() - 29), 'the first point is the first day');
  perform pg_temp.eq(t->'points'->29->'to', to_jsonb(public.ghana_today()), 'the last point is today');
  perform pg_temp.ok(pg_temp.total(t, 'orders') + pg_temp.total(t, 'leads') + pg_temp.total(t, 'complaints') + pg_temp.total(t, 'visits') = 0, 'all zero');
  perform pg_temp.eq(pg_temp.ts('mgmt'), t, 'management gets the same as admin');
  foreach f in array array[pg_temp.feed('admin', null, null, null, 'crm'), pg_temp.feed('mgmt', null, null, null, 'orders')] loop
    perform pg_temp.eq(f, '{"items":[],"has_more":false}', 'an empty system gives an empty page');
  end loop;
  raise notice 'PASS: an empty database gives zero points and an empty feed';
end $$;

-- Fixtures (as the database owner; triggers off so dates and history can be set in the past) ---------------------
set local session_replication_role = replica;
-- The migrations seed products dated when they ran (today here); move them out of every range this test uses.
update public.products set created_at = now() - interval '20 years', updated_at = now() - interval '20 years';
update public.stockists set created_at = now() - interval '20 years', updated_at = now() - interval '20 years';

insert into public.crm_contacts (id, full_name, email, phone) values (pg_temp.u('contact'), 'Secret Contact', 'secret.contact@test.local', '024 999 0000');
insert into public.crm_organisations (id, name, kind) values (pg_temp.u('org'), 'Ov Distributors', 'distributor');

-- CRM: a website lead today (no owner), a phone lead won by the rep, an old lead (previous period)
insert into public.crm_leads (id, title, contact_id, brand_id, source, stage, owner_id, created_by, created_at, closed_at) values
  (pg_temp.u('lead1'), 'Secret Contact (website)', pg_temp.u('contact'), pg_temp.brand('yazz'), 'website_contact_form', 'new', null, null, now() - interval '2 hours', null),
  (pg_temp.u('lead2'), 'Phone lead', pg_temp.u('contact'), pg_temp.brand('hooch'), 'phone', 'won', pg_temp.u('rep'), pg_temp.u('rep'), now() - interval '3 days', now() - interval '1 day'),
  (pg_temp.u('lead_old'), 'Old lead', pg_temp.u('contact'), pg_temp.brand('yazz'), 'email', 'new', null, pg_temp.u('rep'), pg_temp.day_start(40), null);
update public.crm_leads set intake_reference = 'ENQ-OV000001' where id = pg_temp.u('lead1');
insert into public.crm_activities (lead_id, type, body, occurred_at, created_at, created_by) values
  (pg_temp.u('lead2'), 'status_change', 'Stage changed from New to Won', now() - interval '1 day', now() - interval '1 day', pg_temp.u('rep')),
  (pg_temp.u('lead2'), 'call', 'Private call notes', now() - interval '20 hours', now() - interval '20 hours', pg_temp.u('rep'));

-- Complaints: one opened 5 days ago and closed today by customer care, one 45 days ago (previous period)
insert into public.complaints (id, case_number, brand_id, category, severity, channel, description, contact_id, status,
  response_due_at, resolution_due_at, first_response_at, resolution_summary, closed_at, created_at, created_by) values
  (pg_temp.u('cmp1'), 'LX-2026-8001', pg_temp.brand('hooch'), 'packaging', 'normal', 'phone', 'Private description', pg_temp.u('contact'), 'closed',
    now() - interval '4 days', now() + interval '5 days', now() - interval '4 days', 'Sorted', now() - interval '3 hours', now() - interval '5 days', pg_temp.u('care')),
  (pg_temp.u('cmp2'), 'LX-2026-8002', pg_temp.brand('yazz'), 'other', 'low', 'website', 'Old', pg_temp.u('contact'), 'new',
    now() - interval '40 days', now() + interval '5 days', null, null, null, pg_temp.day_start(45), null);
insert into public.complaint_events (complaint_id, type, body, occurred_at, created_at, created_by) values
  (pg_temp.u('cmp1'), 'status_change', 'Case LX-2026-8001 opened. Channel: Phone', now() - interval '5 days', now() - interval '5 days', pg_temp.u('care')),
  (pg_temp.u('cmp1'), 'note', 'Private note', now() - interval '4 days', now() - interval '4 days', pg_temp.u('care')),
  (pg_temp.u('cmp1'), 'status_change', E'Status changed from Investigating to Closed\nResolution: Sorted', now() - interval '3 hours', now() - interval '3 hours', pg_temp.u('care'));

-- Recruitment: an application yesterday, moved to screening by HR
insert into public.job_applications (id, reference, full_name, email, interest, stage, created_at) values
  (pg_temp.u('app1'), 'LX-APP-2026-8001', 'Secret Applicant', 'secret.applicant@test.local', 'Sales', 'screening', now() - interval '1 day');
insert into public.job_application_events (application_id, type, from_stage, to_stage, note, created_by, created_at) values
  (pg_temp.u('app1'), 'received', null, 'new', null, null, now() - interval '1 day'),
  (pg_temp.u('app1'), 'stage_change', 'new', 'screening', 'Private HR note', pg_temp.u('hr'), now() - interval '10 hours');

-- Live chat: one open today, one closed by customer care
insert into public.chat_conversations (id, reference, brand_id, token_hash, visitor_name, visitor_email, start_page, status, closed_at, closed_by, created_at) values
  (pg_temp.u('chat1'), 'LC-0E000001', pg_temp.brand('lexta'), repeat('e', 64), 'Secret Visitor', 'secret.visitor@test.local', '/contact-us', 'open', null, null, now() - interval '30 minutes'),
  (pg_temp.u('chat2'), 'LC-0E000002', pg_temp.brand('yazz'), repeat('f', 64), 'Other Visitor', null, '/', 'closed', now() - interval '6 days', pg_temp.u('care'), now() - interval '7 days');

-- Orders: one submitted by the distributor and confirmed by the rep, one submitted, one still a draft
insert into public.distributor_orders (id, reference, organisation_id, status, brand_ids, submitted_at, created_at) values
  (pg_temp.u('ord1'), 'LX-ORD-2026-8001', pg_temp.u('org'), 'confirmed', array[pg_temp.brand('yazz')], now() - interval '2 days', now() - interval '2 days'),
  (pg_temp.u('ord2'), 'LX-ORD-2026-8002', pg_temp.u('org'), 'submitted', array[pg_temp.brand('hooch')], now() - interval '1 hour', now() - interval '1 hour'),
  (pg_temp.u('ord_draft'), 'LX-ORD-2026-8003', pg_temp.u('org'), 'draft', '{}', null, now() - interval '1 hour');
insert into public.distributor_order_events (order_id, type, from_status, to_status, note, by_distributor, created_by, created_at) values
  (pg_temp.u('ord1'), 'created', null, 'draft', null, true, pg_temp.u('dist'), now() - interval '2 days 1 minute'),
  (pg_temp.u('ord1'), 'status_change', 'draft', 'submitted', null, true, pg_temp.u('dist'), now() - interval '2 days'),
  (pg_temp.u('ord1'), 'status_change', 'submitted', 'confirmed', 'Private note', false, pg_temp.u('rep'), now() - interval '1 day 2 hours'),
  (pg_temp.u('ord2'), 'created', null, 'submitted', null, true, pg_temp.u('dist'), now() - interval '1 hour'),
  (pg_temp.u('ord_draft'), 'created', null, 'draft', null, true, pg_temp.u('dist'), now() - interval '1 hour');

-- Field sales: two visits, a new shop found on one, and a stockist edited by marketing
insert into public.stockists (id, name, outlet_type, region_id, town, is_active, created_by, created_at, updated_at, updated_by) values
  (pg_temp.u('shop_new'), 'Ov New Shop', 'general_trade', pg_temp.region('ashanti'), 'Kumasi', false, pg_temp.u('rep2'), now() - interval '4 days', now() - interval '4 days', pg_temp.u('rep2')),
  (pg_temp.u('shop_edit'), 'Ov Edited Shop', 'pharmacy', pg_temp.region('greater-accra'), 'Osu', true, pg_temp.u('mkt'), now() - interval '20 days', now() - interval '6 hours', pg_temp.u('mkt'));
insert into public.stockist_brands (stockist_id, brand_id) values
  (pg_temp.u('shop_new'), pg_temp.brand('hooch')), (pg_temp.u('shop_edit'), pg_temp.brand('yazz'));
insert into public.field_visits (id, rep_id, stockist_id, new_shop, shop_name, brand_ids, visited_at, location_status, outcome_id, notes) values
  (pg_temp.u('visit1'), pg_temp.u('rep'), pg_temp.u('shop_edit'), false, 'Ov Edited Shop', array[pg_temp.brand('yazz')], now() - interval '5 hours', 'denied', pg_temp.outcome('order_taken'), 'Private visit note'),
  (pg_temp.u('visit2'), pg_temp.u('rep2'), pg_temp.u('shop_new'), true, 'Ov New Shop', array[pg_temp.brand('hooch')], now() - interval '4 days', 'denied', pg_temp.outcome('no_order'), null);
insert into public.field_new_shops (stockist_id, visit_id, created_by, created_at, confirmed_at, confirmed_by) values
  (pg_temp.u('shop_new'), pg_temp.u('visit2'), pg_temp.u('rep2'), now() - interval '4 days', null, null);

-- CSR: a Hooch activity logged by marketing
insert into public.csr_programmes (id, name, brand_id) values (pg_temp.u('pr_hooch'), 'Ov Hooch Kitchens', pg_temp.brand('hooch'));
insert into public.csr_activities (id, programme_id, activity_date, status, region_id, place, people_reached, notes, created_by, created_at) values
  (pg_temp.u('csr1'), pg_temp.u('pr_hooch'), public.ghana_today() - 3, 'done', pg_temp.region('ashanti'), 'Kumasi', 50, 'Private CSR note', pg_temp.u('mkt'), now() - interval '2 days');

set local session_replication_role = origin;

-- Refused again, now that there is data -----------------------------------------------------------------------------
do $$
declare who text;
begin
  foreach who in array array['rep', 'care', 'hr', 'dist', 'mgmt_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(pg_temp.fails($q$select public.management_activity()$q$, '42501'), who || ' is refused the feed with data');
    perform pg_temp.ok(pg_temp.fails($q$select public.management_timeseries()$q$, '42501'), who || ' is refused the charts with data');
    perform pg_temp.owner();
  end loop;
  raise notice 'PASS: still refused with data';
end $$;

-- Charts: the points add up to the dashboard's counts -------------------------------------------------------------
do $$
declare t jsonb := pg_temp.ts('mgmt');
        d jsonb := pg_temp.dash('mgmt');
        th jsonb := pg_temp.ts('admin', null, null, pg_temp.brand('hooch'));
        dh jsonb := pg_temp.dash('admin', null, null, pg_temp.brand('hooch'));
        today jsonb;
begin
  perform pg_temp.ok(pg_temp.total(t, 'orders') = (d->'orders'->>'orders')::int and pg_temp.total(t, 'orders') = 2, 'orders add up (drafts never count)');
  perform pg_temp.ok(pg_temp.total(t, 'leads') = (d->'crm'->>'new_leads')::int and pg_temp.total(t, 'leads') = 2, 'leads add up');
  perform pg_temp.ok(pg_temp.total(t, 'complaints') = (d->'complaints'->>'opened')::int and pg_temp.total(t, 'complaints') = 1, 'complaints add up');
  perform pg_temp.ok(pg_temp.total(t, 'visits') = (d->'field_sales'->>'visits')::int and pg_temp.total(t, 'visits') = 2, 'visits add up');
  select p into today from jsonb_array_elements(t->'points') p where p->>'from' = public.ghana_today()::text;
  perform pg_temp.eq(today - 'from' - 'to', '{"orders":1,"leads":1,"complaints":0,"visits":1}'::jsonb,
    'today: the order submitted an hour ago, the website lead and the visit (when the test runs after 05:00 Ghana time)')
    where extract(hour from now() at time zone 'Africa/Accra') >= 5;
  perform pg_temp.ok(pg_temp.total(th, 'orders') = (dh->'orders'->>'orders')::int and pg_temp.total(th, 'orders') = 1, 'Hooch orders');
  perform pg_temp.ok(pg_temp.total(th, 'leads') = 1 and pg_temp.total(th, 'complaints') = 1 and pg_temp.total(th, 'visits') = 1, 'Hooch leads, complaints, visits');
  raise notice 'PASS: chart points add up to the dashboard counts, for every brand and for one';
end $$;

-- Charts: week and month points, cut to the range ---------------------------------------------------------------
do $$
declare w jsonb := pg_temp.ts('mgmt', public.ghana_today() - 89, public.ghana_today());
        m jsonb := pg_temp.ts('mgmt', public.ghana_today() - 399, public.ghana_today());
        n integer;
begin
  perform pg_temp.eq(w->'unit', '"week"', '90 days are charted by week');
  perform pg_temp.eq(w->'points'->0->'from', to_jsonb(public.ghana_today() - 89), 'the first week starts on the first day of the range');
  perform pg_temp.ok(extract(isodow from (w->'points'->1->>'from')::date) = 1, 'later weeks start on a Monday');
  perform pg_temp.eq(w->'points'->-1->'to', to_jsonb(public.ghana_today()), 'the last week ends today');
  n := jsonb_array_length(w->'points');
  perform pg_temp.ok(n between 13 and 14, 'about 13 weeks');
  perform pg_temp.ok(pg_temp.total(w, 'leads') = 3 and pg_temp.total(w, 'complaints') = 2, 'the 90 day weeks count the older lead and complaint too');
  perform pg_temp.ok((select bool_and((p->>'from')::date <= (p->>'to')::date) from jsonb_array_elements(w->'points') p), 'every week runs forward');
  perform pg_temp.eq(m->'unit', '"month"', 'over a year is charted by month');
  perform pg_temp.ok(extract(day from (m->'points'->1->>'from')::date) = 1, 'later months start on the 1st');
  perform pg_temp.ok(pg_temp.total(m, 'leads') = 3, 'months count every lead');
  perform pg_temp.eq(pg_temp.ts('mgmt', public.ghana_today(), public.ghana_today())->'unit', '"day"', 'one day is one point');
  raise notice 'PASS: week and month points, the first and last cut to the range';
end $$;

-- The previous period of the same length (what the overview compares with) -------------------------------------------
do $$
declare v_from date := public.ghana_today() - 29;
        v_to date := public.ghana_today();
        len integer := v_to - v_from + 1;
        cur jsonb := pg_temp.dash('mgmt', v_from, v_to);
        prev jsonb := pg_temp.dash('mgmt', v_from - len, v_from - 1);
        pts jsonb := pg_temp.ts('mgmt', v_from - len, v_from - 1);
begin
  perform pg_temp.ok(len = 30 and v_from - len = public.ghana_today() - 59, 'the previous 30 days end the day before the range starts');
  perform pg_temp.eq(prev->'crm'->'new_leads', '1', 'the previous period has the older lead');
  perform pg_temp.eq(prev->'complaints'->'opened', '1', 'and the older complaint');
  perform pg_temp.ok((cur->'crm'->>'new_leads')::int - (prev->'crm'->>'new_leads')::int = 1, 'leads up 1 on the previous 30 days');
  perform pg_temp.ok((cur->'complaints'->>'opened')::int - (prev->'complaints'->>'opened')::int = 0, 'complaints level with the previous 30 days');
  perform pg_temp.ok((cur->'orders'->>'orders')::int - (prev->'orders'->>'orders')::int = 2, 'orders up 2');
  perform pg_temp.ok(pg_temp.total(pts, 'leads') = 1, 'the previous period charts its own lead');
  raise notice 'PASS: the previous period of the same length works out';
end $$;

-- Feed: everything, newest first -------------------------------------------------------------------------------------
do $$
declare f jsonb := pg_temp.feed('mgmt');
        k text[] := pg_temp.kinds(f);
        txt text := f::text;
begin
  perform pg_temp.eq(to_jsonb(k), to_jsonb(array[
    'chat_started LC-0E000001',
    'order_submitted LX-ORD-2026-8002',
    'lead_created Website enquiry ENQ-OV000001',
    'complaint_status LX-2026-8001',
    'visit Ov Edited Shop',
    'stockist_updated Ov Edited Shop',
    'application_stage LX-APP-2026-8001',
    'lead_stage Phone lead',
    'application_received LX-APP-2026-8001',
    'order_status LX-ORD-2026-8001',
    'order_submitted LX-ORD-2026-8001',
    'csr_logged Ov Hooch Kitchens',
    'lead_created Phone lead',
    'visit Ov New Shop',
    'new_shop Ov New Shop',
    'complaint_opened LX-2026-8001',
    'chat_closed LC-0E000002',
    'chat_started LC-0E000002',
    'stockist_created Ov Edited Shop']),
    'website leads get a fixed title, never the name the database wrote into it; every kind of event in the last 30 days, newest first (the same moment: by key); drafts, notes, calls and the case opened line are not events; '
    || 'a shop found on a visit shows once, as a new shop');
  perform pg_temp.eq(f->'has_more', 'false', 'one page holds them all');
  perform pg_temp.eq((f->'items'->0) - 'at' - 'key' - 'record_id', jsonb_build_object('system', 'chat', 'kind', 'chat_started', 'title', 'LC-0E000001',
    'detail', '/contact-us', 'brand_ids', jsonb_build_array(pg_temp.brand('lexta')), 'actor_id', null, 'actor_name', null), 'a chat started: reference and page, no visitor');
  perform pg_temp.eq((select i from jsonb_array_elements(f->'items') i where i->>'kind' = 'order_status') - 'at' - 'key',
    jsonb_build_object('system', 'orders', 'kind', 'order_status', 'record_id', pg_temp.u('ord1'), 'title', 'LX-ORD-2026-8001',
      'detail', 'Ov Distributors|submitted|confirmed|', 'brand_ids', jsonb_build_array(pg_temp.brand('yazz')), 'actor_id', pg_temp.u('rep'), 'actor_name', 'Kofi Rep'),
    'an order status change: reference, distributor, from and to, who');
  perform pg_temp.eq((select i->'detail' from jsonb_array_elements(f->'items') i where i->>'kind' = 'order_submitted' and i->>'title' = 'LX-ORD-2026-8001'),
    '"Ov Distributors|draft|submitted|distributor"', 'a submission by the distributor says so');
  perform pg_temp.eq((select i->'detail' from jsonb_array_elements(f->'items') i where i->>'kind' = 'complaint_status'),
    '"Status changed from Investigating to Closed"', 'a complaint status change: the first line only, never the resolution');
  perform pg_temp.eq((select i->'detail' from jsonb_array_elements(f->'items') i where i->>'kind' = 'lead_created' and i->>'title' = 'Website enquiry ENQ-OV000001'),
    '"website_contact_form"', 'a new lead carries its source');
  perform pg_temp.eq((select i->'actor_name' from jsonb_array_elements(f->'items') i where i->>'kind' = 'application_stage'), '"Hana HR"', 'who moved the application');
  perform pg_temp.eq((select i->'detail' from jsonb_array_elements(f->'items') i where i->>'kind' = 'application_stage'), '"new|screening"', 'from and to stage');
  perform pg_temp.eq((select i->'record_id' from jsonb_array_elements(f->'items') i where i->>'kind' = 'lead_stage'), to_jsonb(pg_temp.u('lead2')), 'a stage change opens its lead');
  perform pg_temp.ok((select count(distinct i->>'key') from jsonb_array_elements(f->'items') i) = jsonb_array_length(f->'items'), 'every key is unique');
  perform pg_temp.ok(txt not like '%secret.%' and txt not like '%Secret%' and txt not like '%Private%' and txt not like '%eeeeeeee%'
    and txt not like '%024 999%' and txt not like '%LX-ORD-2026-8003%', 'no customer emails or phones, names of visitors or applicants, notes, token hashes or drafts (staff show by name, or by login email when they have no name, as in 0014)');
  perform pg_temp.eq(pg_temp.feed('admin'), f, 'admin gets the same as management');
  raise notice 'PASS: the feed lists every kind of event newest first, without contact details or drafts';
end $$;

-- Feed: filters ----------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.eq(to_jsonb(pg_temp.kinds(pg_temp.feed('mgmt', null, null, null, 'complaints'))),
    '["complaint_status LX-2026-8001", "complaint_opened LX-2026-8001"]', 'one system');
  perform pg_temp.eq(to_jsonb(pg_temp.kinds(pg_temp.feed('mgmt', null, null, null, 'field_sales'))),
    '["visit Ov Edited Shop", "visit Ov New Shop", "new_shop Ov New Shop"]', 'field sales');
  perform pg_temp.eq(to_jsonb(pg_temp.kinds(pg_temp.feed('mgmt', null, null, pg_temp.brand('hooch')))), to_jsonb(array[
    'order_submitted LX-ORD-2026-8002', 'complaint_status LX-2026-8001', 'lead_stage Phone lead', 'csr_logged Ov Hooch Kitchens',
    'lead_created Phone lead', 'visit Ov New Shop', 'new_shop Ov New Shop', 'complaint_opened LX-2026-8001']),
    'one brand: its records only, recruitment (no brand) left out');
  perform pg_temp.eq(to_jsonb(pg_temp.kinds(pg_temp.feed('mgmt', null, null, null, null, pg_temp.u('rep')))), to_jsonb(array[
    'visit Ov Edited Shop', 'lead_stage Phone lead', 'order_status LX-ORD-2026-8001', 'lead_created Phone lead']), 'one person: what they did');
  perform pg_temp.eq(to_jsonb(pg_temp.kinds(pg_temp.feed('mgmt', null, null, pg_temp.brand('yazz'), 'orders', pg_temp.u('dist')))),
    '["order_submitted LX-ORD-2026-8001"]', 'brand, system and person together');
  perform pg_temp.eq(to_jsonb(pg_temp.kinds(pg_temp.feed('mgmt', public.ghana_today() - 59, public.ghana_today() - 30))), to_jsonb(array[
    'lead_created Old lead', 'complaint_opened LX-2026-8002']), 'an older range');
  perform pg_temp.eq(pg_temp.feed('mgmt', null, null, null, 'recruitment', null, null, null, 30)->'items'->0->'brand_ids', '[]', 'recruitment has no brand');
  raise notice 'PASS: the system, brand, person and date filters work';
end $$;

-- Feed: keyset paging ----------------------------------------------------------------------------------------------------
do $$
declare allf jsonb := pg_temp.feed('mgmt');
        page jsonb;
        seen jsonb := '[]';
        last jsonb;
        pages integer := 0;
begin
  page := pg_temp.feed('mgmt', null, null, null, null, null, null, null, 4);
  loop
    pages := pages + 1;
    perform pg_temp.ok(jsonb_array_length(page->'items') between 1 and 4, 'a page holds at most 4');
    seen := seen || (page->'items');
    exit when not (page->>'has_more')::boolean;
    last := page->'items'->-1;
    page := pg_temp.feed('mgmt', null, null, null, null, null, (last->>'at')::timestamptz, last->>'key', 4);
    perform pg_temp.ok(pages < 20, 'paging ends');
  end loop;
  perform pg_temp.ok(pages = 5, 'nineteen events make five pages of four');
  perform pg_temp.eq(seen, allf->'items', 'the pages together are the whole feed, in order, every row once');
  -- Two events at the very same moment are split by their key, never lost or repeated.
  set local session_replication_role = replica;
  insert into public.crm_activities (lead_id, type, body, occurred_at, created_by)
  select pg_temp.u('lead2'), 'status_change', 'Stage changed from Won to Won', (select (i->>'at')::timestamptz from jsonb_array_elements(allf->'items') i where i->>'kind' = 'lead_stage'), pg_temp.u('rep')
  from generate_series(1, 2);
  set local session_replication_role = origin;
  allf := pg_temp.feed('mgmt', null, null, null, 'crm');
  perform pg_temp.ok(jsonb_array_length(allf->'items') = 5, 'five CRM events now');
  seen := '[]';
  page := pg_temp.feed('mgmt', null, null, null, 'crm', null, null, null, 1);
  loop
    seen := seen || (page->'items');
    exit when not (page->>'has_more')::boolean;
    last := page->'items'->-1;
    page := pg_temp.feed('mgmt', null, null, null, 'crm', null, (last->>'at')::timestamptz, last->>'key', 1);
  end loop;
  perform pg_temp.eq(seen, allf->'items', 'pages of one through events at the same moment');
  raise notice 'PASS: keyset paging returns every row once, newest first, ties included';
end $$;

-- A confirmed new shop shows once (shop_confirmed), not also as a stockist change ------------------------------
do $$
declare f jsonb;
begin
  set local session_replication_role = replica;
  update public.field_new_shops set confirmed_at = now() - interval '10 minutes', confirmed_by = pg_temp.u('mkt') where stockist_id = pg_temp.u('shop_new');
  update public.stockists set is_active = true, updated_at = now() - interval '10 minutes' + interval '2 seconds', updated_by = pg_temp.u('mkt') where id = pg_temp.u('shop_new');
  set local session_replication_role = origin;
  f := pg_temp.feed('mgmt', null, null, null, 'catalogue');
  perform pg_temp.ok(not (pg_temp.kinds(f) @> array['stockist_updated Ov New Shop']), 'no stockist change for the confirmation');
  f := pg_temp.feed('mgmt', null, null, null, 'field_sales');
  perform pg_temp.eq(f->'items'->0->'kind', '"shop_confirmed"', 'the confirmation is a field sales event');
  perform pg_temp.eq(f->'items'->0->'actor_name', '"ov.mkt@test.local"', 'by who confirmed it');
  -- A later edit of the same shop is a stockist change again.
  set local session_replication_role = replica;
  update public.stockists set updated_at = now() - interval '1 minute' where id = pg_temp.u('shop_new');
  set local session_replication_role = origin;
  perform pg_temp.ok(pg_temp.kinds(pg_temp.feed('mgmt', null, null, null, 'catalogue')) @> array['stockist_updated Ov New Shop'], 'a later edit shows');
  raise notice 'PASS: a confirmed new shop shows once';
end $$;

-- Bad input -----------------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_timeseries(current_date, current_date - 1, null)$q$, '22023'), 'charts: a backwards range is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_timeseries(current_date - 4000, current_date, null)$q$, '22023'), 'charts: a range over ten years is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_timeseries(null, null, gen_random_uuid())$q$, '22023'), 'charts: an unknown brand is refused');
  perform pg_temp.ok(jsonb_array_length(public.management_timeseries(current_date - 3650, current_date, null)->'points') between 120 and 122, 'charts: ten years is about 121 months');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(current_date, current_date - 1)$q$, '22023'), 'feed: a backwards range is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(current_date - 4000, current_date)$q$, '22023'), 'feed: a range over ten years is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, gen_random_uuid())$q$, '22023'), 'feed: an unknown brand is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, null, 'shop')$q$, '22023'), 'feed: an unknown system is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, null, null, null, now(), null)$q$, '22023'), 'feed: half a cursor is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, null, null, null, null, 'x')$q$, '22023'), 'feed: the other half too');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, null, null, null, null, null, 0)$q$, '22023'), 'feed: a page of 0 is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.management_activity(null, null, null, null, null, null, null, 101)$q$, '22023'), 'feed: a page over 100 is refused');
  perform pg_temp.owner();
  raise notice 'PASS: bad ranges, brands, systems, cursors and page sizes are refused';
end $$;

rollback;
