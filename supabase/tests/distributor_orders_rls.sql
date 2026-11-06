-- Distributor ordering (item 23): accounts, orders, lines, history, internal notes, the status flow and who may make
-- each move, brand scoping for staff, and that a distributor never sees another distributor's orders, internal notes
-- or any other system.
-- Run with: bash supabase/tests/local/run.sh distributor_orders_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Helpers ----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000d001'
    when 'mgmt' then '00000000-0000-0000-0000-00000000d002'
    when 'rep_yazz' then '00000000-0000-0000-0000-00000000d003'
    when 'rep_hooch' then '00000000-0000-0000-0000-00000000d004'
    when 'care' then '00000000-0000-0000-0000-00000000d005'
    when 'mkt' then '00000000-0000-0000-0000-00000000d006'
    when 'hr' then '00000000-0000-0000-0000-00000000d007'
    when 'norole' then '00000000-0000-0000-0000-00000000d008'
    when 'dist_a' then '00000000-0000-0000-0000-00000000d011'
    when 'dist_a2' then '00000000-0000-0000-0000-00000000d012'
    when 'dist_b' then '00000000-0000-0000-0000-00000000d013'
    when 'dist_free' then '00000000-0000-0000-0000-00000000d014'
    when 'dist_off' then '00000000-0000-0000-0000-00000000d015'
    when 'rep_none' then '00000000-0000-0000-0000-00000000d016'
    -- organisations
    when 'org_a' then '00000000-0000-0000-0000-00000000da01'
    when 'org_b' then '00000000-0000-0000-0000-00000000da02'
    when 'org_c' then '00000000-0000-0000-0000-00000000da03'
    -- products and SKUs
    when 'p_yazz' then '00000000-0000-0000-0000-00000000db01'
    when 'p_linzzy' then '00000000-0000-0000-0000-00000000db02'
    when 'p_hooch' then '00000000-0000-0000-0000-00000000db03'
    when 'p_draft' then '00000000-0000-0000-0000-00000000db04'
    when 's_yazz' then '00000000-0000-0000-0000-00000000dc01'
    when 's_yazz2' then '00000000-0000-0000-0000-00000000dc02'
    when 's_linzzy' then '00000000-0000-0000-0000-00000000dc03'
    when 's_hooch' then '00000000-0000-0000-0000-00000000dc04'
    when 's_draft' then '00000000-0000-0000-0000-00000000dc05'
    when 's_off' then '00000000-0000-0000-0000-00000000dc06'
  end::uuid;
$$;

create function pg_temp.brand(slug text) returns uuid language sql stable as $$
  select id from public.brands where brands.slug = brand.slug;
$$;

-- Become someone: the signed in person (role authenticated, JWT sub set), or 'anon'.
create function pg_temp.login(label text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', case when label = 'anon' then '' else pg_temp.u(label)::text end, true),
         set_config('role', case when label = 'anon' then 'anon' else 'authenticated' end, true);
$$;

-- Does this statement fail with this SQLSTATE (any error when code is null)?
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

-- The ids made during the test, shared between blocks.
create temp table ids (label text primary key, id uuid not null);
grant select, insert, update on ids to anon, authenticated;
create function pg_temp.id(label text) returns uuid language sql stable as $$ select id from ids where ids.label = id.label; $$;

-- Status move as the current person, true when it worked.
create function pg_temp.move(label text, new_status text, note text default null) returns boolean language plpgsql as $$
begin
  perform public.set_distributor_order_status(pg_temp.id(label), new_status, note);
  return true;
exception when others then
  return false;
end;
$$;

-- Schema checks ------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.ok(not exists (select 1 from pg_tables where schemaname = 'public' and tablename like 'distributor_%' and not rowsecurity),
    'every distributor table has Row Level Security on');
  perform pg_temp.ok((select count(*) from pg_tables where schemaname = 'public' and tablename like 'distributor_%') = 6, 'six distributor tables');
  perform pg_temp.ok(not exists (select 1 from public.distributor_accounts) and not exists (select 1 from public.distributor_orders)
    and not exists (select 1 from public.distributor_order_counters), 'nothing is seeded');
  perform pg_temp.ok(not exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name in ('products', 'product_skus', 'distributor_orders', 'distributor_order_lines') and column_name ~ 'price|amount|total|cost'),
    'no price fields anywhere in products or orders');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
        and (p.proname like '%distributor%' or p.proname like 'order_staff%')
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=""')),
    'every security definer function of item 23 sets search_path to empty');
  raise notice 'PASS: RLS on for the six tables, nothing seeded, no prices, search_path set on definer functions';
end $$;

-- Fixtures (as the database owner) -----------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),     'do.admin@test.local',     '{"role":"admin"}',         '{"full_name":"Order Admin"}'),
  (pg_temp.u('mgmt'),      'do.mgmt@test.local',      '{"role":"management"}',    '{}'),
  (pg_temp.u('rep_yazz'),  'do.repy@test.local',      '{"role":"sales_rep"}',     '{"full_name":"Yaw Yazz Rep"}'),
  (pg_temp.u('rep_hooch'), 'do.reph@test.local',      '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('rep_none'),  'do.repn@test.local',      '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('care'),      'do.care@test.local',      '{"role":"customer_care"}', '{}'),
  (pg_temp.u('mkt'),       'do.mkt@test.local',       '{"role":"marketing"}',     '{}'),
  (pg_temp.u('hr'),        'do.hr@test.local',        '{"role":"hr"}',            '{}'),
  (pg_temp.u('norole'),    'do.norole@test.local',    '{}',                       '{}'),
  (pg_temp.u('dist_a'),    'do.dista@test.local',     '{"role":"distributor"}',   '{"full_name":"Kofi Distributor A"}'),
  (pg_temp.u('dist_a2'),   'do.dista2@test.local',    '{"role":"distributor"}',   '{}'),
  (pg_temp.u('dist_b'),    'do.distb@test.local',     '{"role":"distributor"}',   '{}'),
  (pg_temp.u('dist_free'), 'do.distfree@test.local',  '{"role":"distributor"}',   '{}'),
  (pg_temp.u('dist_off'),  'do.distoff@test.local',   '{"role":"distributor"}',   '{}');

insert into public.profile_brands (profile_id, brand_id) values
  (pg_temp.u('rep_yazz'), pg_temp.brand('yazz')),
  (pg_temp.u('rep_hooch'), pg_temp.brand('hooch')),
  -- A distributor with brand access rows must still get nothing from staff rules.
  (pg_temp.u('dist_b'), pg_temp.brand('yazz'));

insert into public.crm_organisations (id, name, kind) values
  (pg_temp.u('org_a'), 'Test Distributor A Ltd', 'distributor'),
  (pg_temp.u('org_b'), 'Test Distributor B Ltd', 'distributor'),
  (pg_temp.u('org_c'), 'Test Hooch Only Ltd', 'distributor');
insert into public.crm_organisation_brands (organisation_id, brand_id) values
  (pg_temp.u('org_a'), pg_temp.brand('yazz')),
  (pg_temp.u('org_a'), pg_temp.brand('linzzy')),
  (pg_temp.u('org_b'), pg_temp.brand('hooch')),
  (pg_temp.u('org_c'), pg_temp.brand('hooch'));

insert into public.products (id, brand_id, name, slug, is_published) values
  (pg_temp.u('p_yazz'), pg_temp.brand('yazz'), 'Test Yazz Pads', 'test-yazz-pads', true),
  (pg_temp.u('p_linzzy'), pg_temp.brand('linzzy'), 'Test Linzzy Diapers', 'test-linzzy-diapers', true),
  (pg_temp.u('p_hooch'), pg_temp.brand('hooch'), 'Test Hooch Biscuits', 'test-hooch-biscuits', true),
  (pg_temp.u('p_draft'), pg_temp.brand('yazz'), 'Test Yazz Unpublished', 'test-yazz-unpublished', false);
insert into public.product_skus (id, product_id, sku_code, variant_name, pack_size_label, is_active) values
  (pg_temp.u('s_yazz'), pg_temp.u('p_yazz'), 'T-YZ-01', 'Regular', 'Carton of 24 packs', true),
  (pg_temp.u('s_yazz2'), pg_temp.u('p_yazz'), 'T-YZ-02', 'Night', 'Carton of 12 packs', true),
  (pg_temp.u('s_off'), pg_temp.u('p_yazz'), 'T-YZ-03', 'Old', 'Carton of 6 packs', false),
  (pg_temp.u('s_linzzy'), pg_temp.u('p_linzzy'), 'T-LZ-01', 'Size 3', 'Bale of 8 packs', true),
  (pg_temp.u('s_hooch'), pg_temp.u('p_hooch'), 'T-HC-01', null, 'Carton of 48 packets', true),
  (pg_temp.u('s_draft'), pg_temp.u('p_draft'), 'T-YZ-99', null, 'Carton of 24 packs', true);

-- Something in the other systems that a distributor must never read.
insert into public.crm_contacts (id, full_name, phone) values ('00000000-0000-0000-0000-00000000dd01', 'Test Contact', '0244000111');
insert into public.crm_leads (title, brand_id, organisation_id, source) values ('Test lead for org A', pg_temp.brand('yazz'), pg_temp.u('org_a'), 'other');

-- Accounts: linking -----------------------------------------------------------------------------------------
do $$ begin perform pg_temp.login('rep_yazz'); end $$;
do $$
begin
  -- A sales rep links to an organisation they see in the CRM (org A carries Yazz) ...
  insert into public.distributor_accounts (profile_id, organisation_id) values (pg_temp.u('dist_a'), pg_temp.u('org_a'));
  insert into public.distributor_accounts (profile_id, organisation_id) values (pg_temp.u('dist_a2'), pg_temp.u('org_a'));
  -- ... but not to one carrying only another brand.
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_accounts (profile_id, organisation_id) values (%L, %L)',
    pg_temp.u('dist_b'), pg_temp.u('org_b')), '42501'), 'a Yazz rep cannot link a login to a Hooch only organisation');
  -- Only distributor logins are linked.
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_accounts (profile_id, organisation_id) values (%L, %L)',
    pg_temp.u('care'), pg_temp.u('org_a')), '23514'), 'a staff login cannot be linked as a distributor');
  -- The author comes from the session.
  perform pg_temp.ok((select created_by from public.distributor_accounts where profile_id = pg_temp.u('dist_a')) = pg_temp.u('rep_yazz'),
    'the link records who made it');
end $$;

do $$ begin perform pg_temp.login('admin'); end $$;
insert into public.distributor_accounts (profile_id, organisation_id) values (pg_temp.u('dist_b'), pg_temp.u('org_b'));
insert into public.distributor_accounts (profile_id, organisation_id) values (pg_temp.u('dist_off'), pg_temp.u('org_b'));
reset role;
update public.profiles set is_active = false where id = pg_temp.u('dist_off');

do $$
declare who text;
begin
  foreach who in array array['care', 'mkt', 'hr', 'norole', 'dist_a', 'dist_free'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_accounts (profile_id, organisation_id) values (%L, %L)',
      pg_temp.u('dist_free'), pg_temp.u('org_a')), '42501'), who || ' cannot link a distributor login');
    perform set_config('role', 'postgres', true);
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails('select count(*) from public.distributor_accounts', '42501'), 'website visitors cannot read accounts');
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: staff link logins (a sales rep only to organisations they see), only distributor logins, nobody else links';
end $$;

-- What a distributor's account shows.
do $$
declare acc jsonb;
begin
  perform pg_temp.login('dist_a');
  acc := public.my_distributor_account();
  perform pg_temp.ok(acc ->> 'organisation_id' = pg_temp.u('org_a')::text and acc ->> 'organisation_name' = 'Test Distributor A Ltd',
    'a distributor sees their own organisation');
  perform pg_temp.ok((select string_agg(b ->> 'slug', ',' order by b ->> 'slug') from jsonb_array_elements(acc -> 'brands') b) = 'linzzy,yazz',
    'with the brands it carries');
  perform pg_temp.ok((select count(*) from public.distributor_accounts) = 1, 'a distributor reads only their own link');
  perform set_config('role', 'postgres', true);

  foreach acc in array array['"dist_free"', '"dist_off"', '"admin"', '"rep_yazz"']::jsonb[] loop
    perform pg_temp.login(acc #>> '{}');
    perform pg_temp.ok(public.my_distributor_account() is null, (acc #>> '{}') || ' has no distributor account');
    perform set_config('role', 'postgres', true);
  end loop;
  raise notice 'PASS: my_distributor_account gives the linked, active distributor their organisation and brands, nobody else anything';
end $$;

-- Orders: drafts ------------------------------------------------------------------------------------------------
do $$ begin perform pg_temp.login('dist_a'); end $$;
do $$
declare
  oid uuid;
  y integer := extract(year from now() at time zone 'UTC')::integer;
begin
  oid := public.save_distributor_order(null, jsonb_build_object(
    'delivery_region_id', (select id from public.regions where slug = 'greater-accra'),
    'delivery_address', 'Warehouse 4, Spintex Road',
    'distributor_notes', 'Please deliver before Friday',
    'lines', jsonb_build_array(
      jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'quantity', 10),
      jsonb_build_object('sku_id', pg_temp.u('s_linzzy'), 'quantity', 4),
      jsonb_build_object('sku_id', pg_temp.u('s_yazz2'), 'quantity', 0))));
  insert into ids values ('o1', oid);
  perform pg_temp.ok((select reference from public.distributor_orders where id = oid) = format('LX-ORD-%s-0001', y), 'first reference is LX-ORD-<year>-0001');
  perform pg_temp.ok((select status from public.distributor_orders where id = oid) = 'draft', 'a new order is a draft');
  perform pg_temp.ok((select organisation_id from public.distributor_orders where id = oid) = pg_temp.u('org_a'), 'the order is for the distributor''s organisation');
  perform pg_temp.ok((select count(*) from public.distributor_order_lines where order_id = oid) = 2, 'zero quantity lines are dropped');
  perform pg_temp.ok((select product_name_snapshot || '|' || sku_code_snapshot || '|' || pack_size_snapshot || '|' || quantity
                      from public.distributor_order_lines where order_id = oid and sku_id = pg_temp.u('s_yazz'))
    = 'Test Yazz Pads|T-YZ-01|Carton of 24 packs|10', 'lines copy product, SKU code and pack size, quantity in packs');
  perform pg_temp.ok((select count(*) from public.distributor_order_events where order_id = oid and type = 'created' and by_distributor
                      and created_by = pg_temp.u('dist_a')) = 1, 'creating writes the history');

  -- Not orderable: a brand the organisation does not carry, an unpublished product, an inactive SKU.
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_lines (order_id, sku_id, quantity) values (%L, %L, 1)', oid, pg_temp.u('s_hooch')), '23514'),
    'a brand the organisation does not carry cannot be ordered');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_lines (order_id, sku_id, quantity) values (%L, %L, 1)', oid, pg_temp.u('s_draft')), '23514'),
    'an unpublished product cannot be ordered');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_lines (order_id, sku_id, quantity) values (%L, %L, 1)', oid, pg_temp.u('s_off')), '23514'),
    'an inactive SKU cannot be ordered');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_distributor_order(%L, %L::jsonb)', oid,
    jsonb_build_object('lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'quantity', 2.5)))), '22023'),
    'packs are whole numbers');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_distributor_order(%L, %L::jsonb)', oid,
    jsonb_build_object('lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'quantity', 100001)))), '22023'),
    'at most 100000 packs a line');
  -- Database set fields cannot be typed.
  perform pg_temp.ok(pg_temp.fails(format('update public.distributor_orders set brand_ids = %L where id = %L', array[pg_temp.brand('hooch')], oid), '42501'),
    'brands on an order are set by the database');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_orders (organisation_id) values (%L)', pg_temp.u('org_b')), '42501'),
    'a distributor cannot pick another organisation');
  perform pg_temp.ok(pg_temp.fails(format('update public.distributor_order_lines set product_name_snapshot = %L where order_id = %L', 'x', oid), '42501'),
    'line copies are set by the database');

  -- A second order straight through the table: the organisation comes from the login.
  insert into public.distributor_orders (delivery_address) values ('Kumasi depot') returning id into oid;
  insert into ids values ('o2', oid);
  perform pg_temp.ok((select reference from public.distributor_orders where id = oid) = format('LX-ORD-%s-0002', y), 'references count up');
  perform pg_temp.ok((select organisation_id from public.distributor_orders where id = oid) = pg_temp.u('org_a'), 'the organisation comes from the login');
  perform pg_temp.ok(pg_temp.fails('select count(*) from public.distributor_order_counters', '42501'), 'nobody reads the counters');
end $$;
reset role;

do $$
declare who text;
begin
  -- Staff never see drafts.
  foreach who in array array['admin', 'mgmt', 'rep_yazz'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok((select count(*) from public.distributor_orders) = 0, who || ' does not see drafts');
    perform pg_temp.ok((select count(*) from public.distributor_order_lines) = 0, who || ' does not see draft lines');
    perform pg_temp.ok(not pg_temp.move('o1', 'confirmed'), who || ' cannot confirm a draft');
    perform set_config('role', 'postgres', true);
  end loop;
  -- Unlinked, inactive and other people cannot create orders.
  foreach who in array array['dist_free', 'dist_off', 'admin', 'rep_yazz', 'care', 'norole'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(pg_temp.fails('select public.save_distributor_order(null, ''{"lines":[]}''::jsonb)', '42501'), who || ' cannot create an order');
    perform set_config('role', 'postgres', true);
  end loop;
  -- The second login of the same organisation sees and edits the same orders.
  perform pg_temp.login('dist_a2');
  perform pg_temp.ok((select count(*) from public.distributor_orders) = 2, 'a second login of the organisation sees its orders');
  perform public.save_distributor_order(pg_temp.id('o2'), jsonb_build_object('delivery_address', 'Kumasi depot',
    'lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz2'), 'quantity', 3))));
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: drafts: references, lines and copies, orderable SKUs only, whole packs, staff never see drafts, only linked distributors create';
end $$;

-- Another distributor sees nothing of organisation A -----------------------------------------------------------------
do $$ begin perform pg_temp.login('dist_b'); end $$;
do $$
begin
  perform pg_temp.ok((select count(*) from public.distributor_orders) = 0, 'distributor B sees no orders of A');
  perform pg_temp.ok((select count(*) from public.distributor_order_lines) = 0, 'distributor B sees no lines of A');
  perform pg_temp.ok((select count(*) from public.distributor_order_events) = 0, 'distributor B sees no history of A');
  perform pg_temp.ok(not pg_temp.move('o1', 'submitted'), 'distributor B cannot submit A''s order');
  perform pg_temp.ok(not pg_temp.move('o1', 'cancelled'), 'distributor B cannot cancel A''s order');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_distributor_order(%L, ''{"lines":[]}''::jsonb)', pg_temp.id('o1')), '42501'),
    'distributor B cannot edit A''s order');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_lines (order_id, sku_id, quantity) values (%L, %L, 1)',
    pg_temp.id('o1'), pg_temp.u('s_hooch')), '42501'), 'distributor B cannot add lines to A''s order');
  perform pg_temp.ok(public.distributor_org_name(pg_temp.u('org_a')) is null, 'distributor B cannot read A''s name');
  perform pg_temp.ok(public.distributor_order_problem(pg_temp.id('o1')) = 'order not found', 'distributor B learns nothing from the submit check');
  perform pg_temp.ok(public.distributor_order_brand_ids(pg_temp.id('o1')) = '{}', 'distributor B learns nothing from the brands helper');
end $$;
reset role;

-- Submitting -----------------------------------------------------------------------------------------------------
do $$ begin perform pg_temp.login('dist_a'); end $$;
do $$
declare empty uuid;
begin
  empty := public.save_distributor_order(null, '{"delivery_address":"Tema","lines":[]}'::jsonb);
  insert into ids values ('o_empty', empty);
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''submitted'')', empty), '23514'),
    'an empty order cannot be submitted');
  perform public.save_distributor_order(empty, jsonb_build_object('lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'quantity', 1))));
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''submitted'')', empty), '23514'),
    'an order without a delivery region or address cannot be submitted');
  -- Draft to cancelled: the distributor drops a draft.
  perform pg_temp.ok(pg_temp.move('o_empty', 'cancelled'), 'the distributor drops a draft');
  perform pg_temp.ok(not pg_temp.move('o_empty', 'draft'), 'a cancelled order stays cancelled');
  perform pg_temp.ok(not pg_temp.move('o_empty', 'submitted'), 'a cancelled order cannot be submitted');

  -- Submit order 1 through save (one call).
  perform public.save_distributor_order(pg_temp.id('o1'), jsonb_build_object(
    'delivery_region_id', (select id from public.regions where slug = 'greater-accra'),
    'delivery_address', 'Warehouse 4, Spintex Road', 'distributor_notes', 'Please deliver before Friday',
    'lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'quantity', 12),
                               jsonb_build_object('sku_id', pg_temp.u('s_linzzy'), 'quantity', 4))), true);
  perform pg_temp.ok((select status from public.distributor_orders where id = pg_temp.id('o1')) = 'submitted', 'the distributor submits');
  perform pg_temp.ok((select submitted_at is not null from public.distributor_orders where id = pg_temp.id('o1')), 'submitted_at is set');
  perform pg_temp.ok((select brand_ids = array(select unnest(array[pg_temp.brand('yazz'), pg_temp.brand('linzzy')]) order by 1)
                      from public.distributor_orders where id = pg_temp.id('o1')), 'the brands on the order are set when submitted');
  perform pg_temp.ok((select quantity from public.distributor_order_lines where order_id = pg_temp.id('o1') and sku_id = pg_temp.u('s_yazz')) = 12,
    'quantities update while a draft');

  -- After submitting nothing changes but the status.
  perform pg_temp.ok(pg_temp.fails(format('update public.distributor_orders set delivery_address = %L where id = %L', 'Elsewhere', pg_temp.id('o1')), '23514'),
    'a submitted order''s details cannot change');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_distributor_order(%L, ''{"lines":[]}''::jsonb)', pg_temp.id('o1')), '42501'),
    'a submitted order cannot be saved again');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_lines (order_id, sku_id, quantity) values (%L, %L, 1)',
    pg_temp.id('o1'), pg_temp.u('s_yazz2')), '42501'), 'no lines are added to a submitted order');
  update public.distributor_order_lines set quantity = 99 where order_id = pg_temp.id('o1');
  perform pg_temp.ok((select sum(quantity) from public.distributor_order_lines where order_id = pg_temp.id('o1')) = 16, 'lines of a submitted order do not change');
  delete from public.distributor_order_lines where order_id = pg_temp.id('o1');
  perform pg_temp.ok((select count(*) from public.distributor_order_lines where order_id = pg_temp.id('o1')) = 2, 'lines of a submitted order are not removed');
  -- The distributor cannot move it further.
  perform pg_temp.ok(not pg_temp.move('o1', 'confirmed'), 'a distributor cannot confirm');
  perform pg_temp.ok(not pg_temp.move('o1', 'dispatched'), 'a distributor cannot dispatch');
  perform pg_temp.ok(not pg_temp.move('o1', 'delivered'), 'a distributor cannot deliver');
  perform pg_temp.ok(not pg_temp.move('o1', 'draft'), 'a submitted order does not go back to draft');

  -- Order 2 submitted too (Yazz only), order 3 submitted and then cancelled by the distributor.
  perform pg_temp.ok(pg_temp.move('o2', 'submitted'), 'the distributor submits through the status call');
  insert into ids values ('o3', public.save_distributor_order(null, jsonb_build_object('delivery_address', 'Takoradi',
    'lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_linzzy'), 'quantity', 2))), true));
  perform pg_temp.ok(pg_temp.move('o3', 'cancelled', 'Ordered twice by mistake'), 'the distributor cancels a submitted order before it is confirmed');
end $$;
reset role;

-- Brand scoping for staff ------------------------------------------------------------------------------------------
-- o1 has Yazz and Linzzy, o2 Yazz, o3 Linzzy only (cancelled by the distributor).
do $$
declare who text;
begin
  foreach who in array array['admin', 'mgmt', 'rep_yazz'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok((select count(*) from public.distributor_orders where id in (pg_temp.id('o1'), pg_temp.id('o2'))) = 2, who || ' sees the submitted Yazz orders');
    perform pg_temp.ok((select count(*) from public.distributor_order_lines where order_id = pg_temp.id('o1')) = 2, who || ' sees every line of a mixed order');
    perform pg_temp.ok(public.distributor_org_name(pg_temp.u('org_a')) = 'Test Distributor A Ltd', who || ' reads the distributor''s name');
    perform pg_temp.ok((select count(*) from public.distributor_order_inbox()) = case when who = 'rep_yazz' then 2 else 3 end, who || ' inbox size');
    perform set_config('role', 'postgres', true);
  end loop;
end $$;

do $$
declare who text;
begin
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok((select string_agg(id::text, ',' order by id) from public.distributor_orders)
    = (select string_agg(x::text, ',' order by x) from unnest(array[pg_temp.id('o1'), pg_temp.id('o2')]) x),
    'a Yazz rep sees only orders with Yazz on them');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_brand => pg_temp.brand('linzzy'))) = 1,
    'the brand filter finds the mixed order through Linzzy');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_status => 'cancelled')) = 0, 'a Yazz rep does not see the Linzzy cancellation');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('admin');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox()) = 3, 'admin sees all three submitted orders');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_status => 'open')) = 2, 'open filter');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_brand => pg_temp.brand('hooch'))) = 0, 'brand filter');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_org => pg_temp.u('org_b'))) = 0, 'distributor filter');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_q => 'distributor a')) = 3, 'search by distributor name');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_q => '-0002')) = 1, 'search by reference');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_from => current_date + 1)) = 0, 'date from filter');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox(p_to => current_date)) = 3, 'date to filter');
  perform pg_temp.ok((select sum(n) from public.distributor_order_counts()) = 3, 'status counts');
  perform pg_temp.ok((select total_count from public.distributor_order_inbox(p_limit => 1) limit 1) = 3, 'the total count comes with a page');
  perform pg_temp.ok((select pack_count from public.distributor_order_inbox() where id = pg_temp.id('o1')) = 16, 'pack count per order');
  perform pg_temp.ok((select count(*) from public.distributor_order_export()) = 4, 'export: one row per line');
  perform pg_temp.ok((select count(*) from public.distributor_order_organisations()) = 1, 'organisations with orders');
  perform set_config('role', 'postgres', true);

  foreach who in array array['rep_hooch', 'rep_none', 'care', 'mkt', 'hr', 'norole', 'dist_b', 'dist_free', 'dist_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok((select count(*) from public.distributor_orders) = 0, who || ' sees no orders');
    perform pg_temp.ok((select count(*) from public.distributor_order_lines) = 0, who || ' sees no lines');
    perform pg_temp.ok((select count(*) from public.distributor_order_events) = 0, who || ' sees no history');
    perform pg_temp.ok((select count(*) from public.distributor_order_inbox()) = 0, who || ' has an empty inbox');
    perform pg_temp.ok((select count(*) from public.distributor_order_export()) = 0, who || ' exports nothing');
    perform pg_temp.ok(not pg_temp.move('o1', 'confirmed'), who || ' cannot confirm');
    perform pg_temp.ok(not pg_temp.move('o1', 'cancelled', 'no'), who || ' cannot cancel');
    perform set_config('role', 'postgres', true);
  end loop;

  -- A distributor's own inbox call gives nothing: the inbox is for staff.
  perform pg_temp.login('dist_a');
  perform pg_temp.ok((select count(*) from public.distributor_order_inbox()) = 0, 'distributors get nothing from the staff inbox');
  perform pg_temp.ok((select count(*) from public.distributor_order_people()) = 0, 'distributors get no staff names');
  perform pg_temp.ok((select count(*) from public.distributor_logins()) = 0, 'distributors get no login list');
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: staff see submitted orders of their brands only; filters, counts and export follow the same rules';
end $$;

-- Status flow ------------------------------------------------------------------------------------------------------
do $$
begin
  -- Skipping a step is refused, even for admin.
  perform pg_temp.login('admin');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''dispatched'')', pg_temp.id('o1')), '23514'), 'submitted to dispatched is refused');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''delivered'')', pg_temp.id('o1')), '23514'), 'submitted to delivered is refused');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''draft'')', pg_temp.id('o1')), '23514'), 'submitted to draft is refused');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''shipped'')', pg_temp.id('o1')), '23514'), 'unknown statuses are refused');
  perform set_config('role', 'postgres', true);

  -- Staff cancel only with a reason.
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''cancelled'')', pg_temp.id('o2')), '23514'), 'staff need a reason to cancel');
  perform pg_temp.ok(pg_temp.move('o2', 'cancelled', 'Out of stock until next month'), 'staff cancel a submitted order with a reason');
  perform pg_temp.ok(not pg_temp.move('o2', 'confirmed'), 'a cancelled order cannot be confirmed');

  -- submitted -> confirmed -> dispatched -> delivered, by a sales rep of the brand.
  perform pg_temp.ok(pg_temp.move('o1', 'confirmed', 'Confirmed by phone'), 'staff confirm');
  perform pg_temp.ok((select confirmed_at is not null and status_changed_at >= submitted_at from public.distributor_orders where id = pg_temp.id('o1')), 'confirmed_at is set');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('dist_a');
  perform pg_temp.ok(not pg_temp.move('o1', 'cancelled'), 'a distributor cannot cancel once staff confirmed');
  perform pg_temp.ok(not pg_temp.move('o1', 'dispatched'), 'a distributor cannot dispatch');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('rep_hooch');
  perform pg_temp.ok(not pg_temp.move('o1', 'dispatched'), 'a rep of another brand cannot dispatch');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''delivered'')', pg_temp.id('o1')), '23514'), 'confirmed to delivered is refused');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''submitted'')', pg_temp.id('o1')), '23514'), 'confirmed back to submitted is refused');
  perform pg_temp.ok(pg_temp.move('o1', 'dispatched'), 'management dispatches');
  perform pg_temp.ok(not pg_temp.move('o1', 'cancelled', 'too late'), 'a dispatched order cannot be cancelled');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('dist_a');
  perform pg_temp.ok(not pg_temp.move('o1', 'delivered'), 'a distributor cannot mark delivered');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.move('o1', 'delivered'), 'staff mark delivered');
  perform pg_temp.ok((select delivered_at is not null and dispatched_at is not null from public.distributor_orders where id = pg_temp.id('o1')), 'every step has its time');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('admin');
  perform pg_temp.ok(not pg_temp.move('o1', 'cancelled', 'x'), 'a delivered order is final, even for admin');
  perform pg_temp.ok(not pg_temp.move('o1', 'dispatched'), 'a delivered order does not go back');
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: every status move and who may make it; no skipped steps, no going back, delivered and cancelled are final';
end $$;

-- confirmed -> cancelled by staff, with a reason.
do $$ begin perform pg_temp.login('dist_a'); end $$;
insert into ids values ('o4', public.save_distributor_order(null, jsonb_build_object('delivery_address', 'Ho',
  'lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'quantity', 1))), true));
reset role;
do $$
begin
  perform pg_temp.login('admin');
  perform pg_temp.ok(pg_temp.move('o4', 'confirmed'), 'admin confirms');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_distributor_order_status(%L, ''cancelled'')', pg_temp.id('o4')), '23514'), 'cancelling a confirmed order needs a reason');
  perform pg_temp.ok(pg_temp.move('o4', 'cancelled', 'Distributor asked by phone'), 'staff cancel a confirmed order with a reason');
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: staff cancel confirmed orders with a reason';
end $$;

-- History: who and when, as the distributor sees it --------------------------------------------------------------------
do $$ begin perform pg_temp.login('dist_a'); end $$;
do $$
begin
  perform pg_temp.ok((select string_agg(coalesce(from_status, '-') || '>' || to_status || ':' || by_distributor, ',' order by created_at, to_status)
                      from public.distributor_order_events where order_id = pg_temp.id('o1') and type = 'status_change')
    = 'draft>submitted:true,submitted>confirmed:false,confirmed>dispatched:false,dispatched>delivered:false', 'the history has every move');
  perform pg_temp.ok((select created_by from public.distributor_order_events where order_id = pg_temp.id('o1') and to_status = 'confirmed') = pg_temp.u('rep_yazz'),
    'the history records who confirmed');
  perform pg_temp.ok((select note from public.distributor_order_events where order_id = pg_temp.id('o2') and to_status = 'cancelled') = 'Out of stock until next month',
    'the distributor sees the reason for a cancellation');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_events (order_id, type, to_status) values (%L, ''status_change'', ''delivered'')',
    pg_temp.id('o1')), '42501'), 'nobody writes the history by hand');
  perform pg_temp.ok(pg_temp.fails(format('delete from public.distributor_order_events where order_id = %L', pg_temp.id('o1')), '42501'),
    'nobody removes the history');
  raise notice 'PASS: the history records every move with who and when; nobody writes or removes it by hand';
end $$;
reset role;

-- Internal notes ----------------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('rep_yazz');
  insert into public.distributor_order_staff_notes (order_id, body) values (pg_temp.id('o1'), 'Credit limit checked with finance');
  perform pg_temp.ok((select created_by from public.distributor_order_staff_notes where order_id = pg_temp.id('o1')) = pg_temp.u('rep_yazz'), 'notes record their author');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.distributor_order_staff_notes) = 1, 'management reads internal notes');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('dist_a');
  perform pg_temp.ok((select count(*) from public.distributor_order_staff_notes) = 0, 'the distributor never sees internal notes');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_staff_notes (order_id, body) values (%L, ''x'')', pg_temp.id('o1')), '42501'),
    'the distributor cannot write internal notes');
  perform pg_temp.ok(not exists (select 1 from public.distributor_order_events where note like '%finance%'), 'internal notes never reach the history');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('rep_hooch');
  perform pg_temp.ok((select count(*) from public.distributor_order_staff_notes) = 0, 'a rep of another brand reads no notes');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.distributor_order_staff_notes (order_id, body) values (%L, ''x'')', pg_temp.id('o1')), '42501'),
    'a rep of another brand cannot add notes');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('care');
  perform pg_temp.ok((select count(*) from public.distributor_order_staff_notes) = 0, 'customer care reads no notes');
  perform set_config('role', 'postgres', true);

  perform pg_temp.login('rep_yazz');
  delete from public.distributor_order_staff_notes;
  perform pg_temp.ok((select count(*) from public.distributor_order_staff_notes) = 1, 'only admin deletes notes');
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: internal notes: staff of the brand read and add, distributors and other roles never see them';
end $$;

-- A distributor sees no other system -------------------------------------------------------------------------------
do $$ begin perform pg_temp.login('dist_a'); end $$;
do $$
declare t text;
begin
  foreach t in array array['crm_organisations', 'crm_organisation_brands', 'crm_contacts', 'crm_leads', 'crm_activities', 'complaints',
                           'complaint_events', 'job_applications', 'job_application_events', 'chat_conversations', 'chat_messages',
                           'stockist_notes', 'profile_brands'] loop
    begin
      execute format('select count(*) from public.%I', t) into strict t;
      perform pg_temp.ok(t = '0', 'a distributor reads nothing in ' || t);
    exception when insufficient_privilege then null;
    end;
  end loop;
  perform pg_temp.ok((select count(*) from public.profiles) = 1, 'a distributor reads only their own profile');
  perform pg_temp.ok(not exists (select 1 from public.products where id = pg_temp.u('p_draft')), 'a distributor does not see unpublished products');
  perform pg_temp.ok(not public.order_staff_role(), 'a distributor is not order staff');
  perform pg_temp.ok(not public.order_staff_sees(array[pg_temp.brand('yazz')]), 'a distributor gets nothing from staff brand rules');
  perform pg_temp.ok((select count(*) from public.crm_staff()) = 0 and (select count(*) from public.chat_staff()) = 0, 'no staff lists');
  raise notice 'PASS: a distributor reads nothing in the CRM, complaints, recruitment, chat or stockist notes';
end $$;
reset role;

-- dist_b has profile_brands rows for Yazz: still no staff rights.
do $$ begin perform pg_temp.login('dist_b'); end $$;
do $$
begin
  perform pg_temp.ok(not public.order_staff_sees(array[pg_temp.brand('yazz')]), 'brand rows do not make a distributor staff');
  perform pg_temp.ok((select count(*) from public.distributor_orders) = 0, 'distributor B still sees no orders of A');
end $$;
reset role;

-- Products deleted later: lines keep what was ordered ------------------------------------------------------------------
delete from public.product_skus where id = pg_temp.u('s_linzzy');
do $$
begin
  perform pg_temp.ok((select sku_id is null and sku_code_snapshot = 'T-LZ-01' and pack_size_snapshot = 'Bale of 8 packs' and quantity = 4
                      from public.distributor_order_lines where order_id = pg_temp.id('o1') and brand_id = pg_temp.brand('linzzy')),
    'a deleted SKU leaves the line with its copies');
  raise notice 'PASS: deleting a SKU keeps the order lines readable';
end $$;

-- Unlinking --------------------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('rep_hooch');
  delete from public.distributor_accounts where profile_id = pg_temp.u('dist_a2');
  perform set_config('role', 'postgres', true);
  perform pg_temp.ok(exists (select 1 from public.distributor_accounts where profile_id = pg_temp.u('dist_a2')), 'a Hooch rep cannot unlink an A login');
  perform pg_temp.login('rep_yazz');
  delete from public.distributor_accounts where profile_id = pg_temp.u('dist_a2');
  perform set_config('role', 'postgres', true);
  perform pg_temp.ok(not exists (select 1 from public.distributor_accounts where profile_id = pg_temp.u('dist_a2')), 'a Yazz rep unlinks an A login');
  perform pg_temp.login('dist_a2');
  perform pg_temp.ok((select count(*) from public.distributor_orders) = 0, 'an unlinked login sees no orders');
  perform set_config('role', 'postgres', true);
  raise notice 'PASS: unlinking follows the same rules as linking and takes access away at once';
end $$;

-- Delete: admin only ---------------------------------------------------------------------------------------------------
do $$
declare who text;
begin
  foreach who in array array['mgmt', 'rep_yazz', 'dist_a'] loop
    perform pg_temp.login(who);
    delete from public.distributor_orders where id = pg_temp.id('o1');
    perform set_config('role', 'postgres', true);
    perform pg_temp.ok(exists (select 1 from public.distributor_orders where id = pg_temp.id('o1')), who || ' cannot delete an order');
  end loop;
  perform pg_temp.login('rep_yazz');
  insert into public.distributor_order_staff_notes (order_id, body) values (pg_temp.id('o1'), 'Second note');
  perform set_config('role', 'postgres', true);
  perform pg_temp.login('admin');
  delete from public.distributor_orders where id = pg_temp.id('o1');
  perform set_config('role', 'postgres', true);
  perform pg_temp.ok(not exists (select 1 from public.distributor_orders where id = pg_temp.id('o1'))
    and not exists (select 1 from public.distributor_order_lines where order_id = pg_temp.id('o1'))
    and not exists (select 1 from public.distributor_order_events where order_id = pg_temp.id('o1'))
    and not exists (select 1 from public.distributor_order_staff_notes where order_id = pg_temp.id('o1')),
    'admin deletes an order with its lines, history and notes');
  -- An organisation with orders cannot be deleted from the CRM.
  perform pg_temp.ok(pg_temp.fails(format('delete from public.crm_organisations where id = %L', pg_temp.u('org_a')), '23503'),
    'an organisation with orders stays');
  raise notice 'PASS: only admin deletes orders (with lines, history and notes)';
end $$;

-- Deleting a region used on a submitted order ---------------------------------------------------------------------------
insert into public.regions (id, slug, name, sort_order) values ('00000000-0000-0000-0000-00000000de01', 'test-region', 'Test Region', 999);
do $$ begin perform pg_temp.login('dist_b'); end $$;
insert into ids values ('o_region', public.save_distributor_order(null, jsonb_build_object(
  'delivery_region_id', '00000000-0000-0000-0000-00000000de01',
  'lines', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_hooch'), 'quantity', 2))), true));
do $$
begin
  perform pg_temp.ok(pg_temp.fails(format('update public.distributor_orders set delivery_region_id = null where id = %L', pg_temp.id('o_region')), '23514'),
    'the distributor still cannot clear the region of a submitted order');
end $$;
reset role;
do $$
begin
  delete from public.regions where id = '00000000-0000-0000-0000-00000000de01';
  perform pg_temp.ok((select delivery_region_id is null and status = 'submitted' from public.distributor_orders where id = pg_temp.id('o_region')),
    'deleting a region clears it on a submitted order and changes nothing else');
  raise notice 'PASS: a region used on a submitted order can be deleted';
end $$;

-- Deleting people who placed orders, linked logins, moved orders or wrote notes ----------------------------------------
do $$
begin
  perform pg_temp.login('rep_yazz');
  insert into public.distributor_order_staff_notes (order_id, body) values (pg_temp.id('o2'), 'Note by the Yazz rep');
  perform set_config('role', 'postgres', true);
  perform pg_temp.ok((select updated_by from public.distributor_orders where id = pg_temp.id('o2')) = pg_temp.u('rep_yazz'), 'set up: the rep last moved o2');
  perform pg_temp.ok((select created_by from public.distributor_accounts where profile_id = pg_temp.u('dist_a')) = pg_temp.u('rep_yazz'), 'set up: the rep linked dist_a');

  -- A staff user who linked a login, moved an order and wrote a note.
  delete from auth.users where id = pg_temp.u('rep_yazz');
  perform pg_temp.ok(not exists (select 1 from public.profiles where id = pg_temp.u('rep_yazz')), 'the sales rep is deleted');
  perform pg_temp.ok((select created_by is null from public.distributor_accounts where profile_id = pg_temp.u('dist_a')), 'their link authorship is cleared');
  perform pg_temp.ok((select updated_by is null from public.distributor_orders where id = pg_temp.id('o2')), 'their order edits are cleared');
  perform pg_temp.ok((select created_by is null from public.distributor_order_staff_notes where body = 'Note by the Yazz rep'), 'their notes stay, without author');
  perform pg_temp.ok(not exists (select 1 from public.distributor_order_events where created_by = pg_temp.u('rep_yazz')), 'their history entries stay, without author');

  -- A distributor who placed orders.
  delete from auth.users where id = pg_temp.u('dist_a');
  perform pg_temp.ok(not exists (select 1 from public.profiles where id = pg_temp.u('dist_a')), 'the distributor is deleted');
  perform pg_temp.ok((select count(*) from public.distributor_orders where organisation_id = pg_temp.u('org_a') and created_by is null) >= 3,
    'their orders stay for the organisation, without author');
  perform pg_temp.ok(not exists (select 1 from public.distributor_accounts where profile_id = pg_temp.u('dist_a')), 'their link goes with them');

  -- The admin who linked dist_b and moved orders.
  delete from auth.users where id = pg_temp.u('admin');
  perform pg_temp.ok((select created_by is null from public.distributor_accounts where profile_id = pg_temp.u('dist_b')), 'the admin''s link authorship is cleared');
  raise notice 'PASS: deleting staff and distributors who linked, ordered, moved orders or wrote notes works and keeps the records';
end $$;

-- Helper functions are closed to website visitors.
do $$
declare f text;
begin
  foreach f in array array['order_staff_role()', 'distributor_org()', 'my_distributor_account()', 'distributor_logins()',
                           'distributor_order_people()', 'distributor_order_inbox(text,uuid,uuid,date,date,text,integer,integer)',
                           'save_distributor_order(uuid,jsonb,boolean)', 'set_distributor_order_status(uuid,text,text)',
                           'distributor_order_export(text,uuid,uuid,date,date,text)', 'distributor_sku_orderable(uuid,uuid)',
                           'next_distributor_order_reference(integer)'] loop
    perform pg_temp.ok(not has_function_privilege('anon', 'public.' || f, 'execute'), 'anon cannot run ' || f);
  end loop;
  perform pg_temp.ok(not has_function_privilege('authenticated', 'public.next_distributor_order_reference(integer)', 'execute'),
    'nobody takes a reference by hand');
  perform pg_temp.ok(not has_function_privilege('authenticated', 'public.distributor_sku_orderable(uuid,uuid)', 'execute'),
    'the orderable check is internal');
  raise notice 'PASS: functions closed to website visitors; internal ones closed to everyone';
end $$;

rollback;
