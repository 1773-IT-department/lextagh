-- Field sales (item 24): shop visits, stock checks, photos and outcomes. Who may log, see, change and delete visits;
-- brand scoping of shops and SKUs for sales reps; new shops as draft stockists; the CRM activity; retries with the same
-- nonce; the photo bucket's policies; and deleting a person, shop, region or CRM activity that visits point at.
-- Run with: bash supabase/tests/local/run.sh field_sales_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Helpers ----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000f001'
    when 'mgmt' then '00000000-0000-0000-0000-00000000f002'
    when 'rep_yazz' then '00000000-0000-0000-0000-00000000f003'
    when 'rep_hooch' then '00000000-0000-0000-0000-00000000f004'
    when 'rep_none' then '00000000-0000-0000-0000-00000000f005'
    when 'care' then '00000000-0000-0000-0000-00000000f006'
    when 'mkt' then '00000000-0000-0000-0000-00000000f007'
    when 'hr' then '00000000-0000-0000-0000-00000000f008'
    when 'dist' then '00000000-0000-0000-0000-00000000f009'
    when 'norole' then '00000000-0000-0000-0000-00000000f00a'
    when 'rep_off' then '00000000-0000-0000-0000-00000000f00b'
    -- stockists
    when 'st_yazz' then '00000000-0000-0000-0000-00000000fa01'
    when 'st_hooch' then '00000000-0000-0000-0000-00000000fa02'
    when 'st_both' then '00000000-0000-0000-0000-00000000fa03'
    when 'st_none' then '00000000-0000-0000-0000-00000000fa04'
    when 'st_off' then '00000000-0000-0000-0000-00000000fa05'
    -- products and SKUs
    when 'p_yazz' then '00000000-0000-0000-0000-00000000fb01'
    when 'p_hooch' then '00000000-0000-0000-0000-00000000fb02'
    when 'p_draft' then '00000000-0000-0000-0000-00000000fb03'
    when 's_yazz' then '00000000-0000-0000-0000-00000000fc01'
    when 's_yazz2' then '00000000-0000-0000-0000-00000000fc02'
    when 's_hooch' then '00000000-0000-0000-0000-00000000fc03'
    when 's_draft' then '00000000-0000-0000-0000-00000000fc04'
    when 's_off' then '00000000-0000-0000-0000-00000000fc05'
    -- CRM
    when 'org_yazz' then '00000000-0000-0000-0000-00000000fd01'
    -- visit nonces
    when 'v1' then '00000000-0000-0000-0000-00000000fe01'
    when 'v2' then '00000000-0000-0000-0000-00000000fe02'
    when 'v3' then '00000000-0000-0000-0000-00000000fe03'
    when 'v4' then '00000000-0000-0000-0000-00000000fe04'
    when 'v5' then '00000000-0000-0000-0000-00000000fe05'
    when 'v6' then '00000000-0000-0000-0000-00000000fe06'
    when 'v7' then '00000000-0000-0000-0000-00000000fe07'
    when 'vx' then '00000000-0000-0000-0000-00000000fe0f'
    -- photo nonces
    when 'ph1' then '00000000-0000-0000-0000-00000000ff01'
    when 'ph2' then '00000000-0000-0000-0000-00000000ff02'
    when 'ph3' then '00000000-0000-0000-0000-00000000ff03'
  end::uuid;
$$;

create function pg_temp.brand(slug text) returns uuid language sql stable as $$
  select id from public.brands where brands.slug = brand.slug;
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

-- A visit as the current person: details for save_field_visit.
create function pg_temp.visit(stockist text, outcome text default 'no_order', notes text default null,
  lat numeric default 5.6037, lng numeric default -0.1870) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'stockist_id', pg_temp.u(stockist), 'outcome_id', pg_temp.outcome(outcome), 'notes', notes,
    'location', case when lat is null then jsonb_build_object('status', 'denied')
                     else jsonb_build_object('status', 'captured', 'latitude', lat, 'longitude', lng, 'accuracy', 12.4) end);
$$;

-- Schema checks ------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.ok(not exists (select 1 from pg_tables where schemaname = 'public' and tablename like 'field_%' and not rowsecurity),
    'every field sales table has Row Level Security on');
  perform pg_temp.ok((select count(*) from pg_tables where schemaname = 'public' and tablename like 'field_%') = 5, 'five field sales tables');
  perform pg_temp.ok(not exists (select 1 from public.field_visits) and not exists (select 1 from public.field_visit_photos)
    and not exists (select 1 from public.field_visit_stock_checks), 'no visits are seeded');
  perform pg_temp.ok((select string_agg(slug, ',' order by sort_order) from public.field_visit_outcomes) = 'order_taken,no_order,follow_up,shop_closed',
    'the four starting outcomes');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname like '%field%'
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=""')),
    'every field sales function sets search_path to empty');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('save_field_visit', 'update_field_visit', 'delete_field_visit',
        'field_sales_shops', 'field_visit_list', 'field_sales_people') and p.prosecdef),
    'saving and reading run as the caller (security invoker)');
  perform pg_temp.ok((select not public and file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
    from storage.buckets where id = 'field-visit-photos'), 'the photo bucket is private, 5 MB, JPEG, PNG and WebP only');
  raise notice 'PASS: RLS on for the five tables, no visits seeded, four outcomes, search_path set, invoker RPCs, private bucket';
end $$;

-- Fixtures (as the database owner) -----------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),     'fs.admin@test.local',  '{"role":"admin"}',         '{"full_name":"Field Admin"}'),
  (pg_temp.u('mgmt'),      'fs.mgmt@test.local',   '{"role":"management"}',    '{"full_name":"Field Manager"}'),
  (pg_temp.u('rep_yazz'),  'fs.repy@test.local',   '{"role":"sales_rep"}',     '{"full_name":"Yaw Yazz Rep"}'),
  (pg_temp.u('rep_hooch'), 'fs.reph@test.local',   '{"role":"sales_rep"}',     '{"full_name":"Esi Hooch Rep"}'),
  (pg_temp.u('rep_none'),  'fs.repn@test.local',   '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('rep_off'),   'fs.repoff@test.local', '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('care'),      'fs.care@test.local',   '{"role":"customer_care"}', '{}'),
  (pg_temp.u('mkt'),       'fs.mkt@test.local',    '{"role":"marketing"}',     '{}'),
  (pg_temp.u('hr'),        'fs.hr@test.local',     '{"role":"hr"}',            '{}'),
  (pg_temp.u('dist'),      'fs.dist@test.local',   '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),    'fs.norole@test.local', '{}',                       '{}');
update public.profiles set is_active = false where id = pg_temp.u('rep_off');
insert into public.profile_brands (profile_id, brand_id) values
  (pg_temp.u('rep_yazz'), pg_temp.brand('yazz')),
  (pg_temp.u('rep_hooch'), pg_temp.brand('hooch')),
  (pg_temp.u('rep_off'), pg_temp.brand('yazz')),
  (pg_temp.u('mkt'), pg_temp.brand('yazz')),
  (pg_temp.u('care'), pg_temp.brand('yazz'));

insert into public.stockists (id, name, outlet_type, region_id, town, latitude, longitude, is_active) values
  (pg_temp.u('st_yazz'),  'Osu Mini Mart',      'supermarket',   (select id from public.regions where slug = 'greater-accra'), 'Osu',     5.5560, -0.1820, true),
  (pg_temp.u('st_hooch'), 'Kejetia Provisions', 'open_market',   (select id from public.regions where slug = 'ashanti'),       'Kumasi',  6.6970, -1.6200, true),
  (pg_temp.u('st_both'),  'Labone Pharmacy',    'pharmacy',      (select id from public.regions where slug = 'greater-accra'), 'Labone',  5.5650, -0.1700, true),
  (pg_temp.u('st_none'),  'No Brand Shop',      'general_trade', (select id from public.regions where slug = 'greater-accra'), 'Accra',   null, null, true),
  (pg_temp.u('st_off'),   'Closed Down Store',  'general_trade', (select id from public.regions where slug = 'greater-accra'), 'Madina',  5.6800, -0.1700, false);
insert into public.stockist_brands (stockist_id, brand_id) values
  (pg_temp.u('st_yazz'), pg_temp.brand('yazz')),
  (pg_temp.u('st_hooch'), pg_temp.brand('hooch')),
  (pg_temp.u('st_both'), pg_temp.brand('yazz')),
  (pg_temp.u('st_both'), pg_temp.brand('hooch')),
  (pg_temp.u('st_off'), pg_temp.brand('yazz'));

insert into public.products (id, brand_id, name, slug, is_published) values
  (pg_temp.u('p_yazz'), pg_temp.brand('yazz'), 'Field Yazz Pads', 'field-yazz-pads', true),
  (pg_temp.u('p_hooch'), pg_temp.brand('hooch'), 'Field Hooch Biscuits', 'field-hooch-biscuits', true),
  (pg_temp.u('p_draft'), pg_temp.brand('yazz'), 'Field Yazz Unpublished', 'field-yazz-unpublished', false);
insert into public.product_skus (id, product_id, sku_code, variant_name, pack_size_label, is_active) values
  (pg_temp.u('s_yazz'), pg_temp.u('p_yazz'), 'F-YZ-01', 'Regular', 'Pack of 10', true),
  (pg_temp.u('s_yazz2'), pg_temp.u('p_yazz'), 'F-YZ-02', 'Night', 'Pack of 8', true),
  (pg_temp.u('s_off'), pg_temp.u('p_yazz'), 'F-YZ-03', 'Old', 'Pack of 6', false),
  (pg_temp.u('s_hooch'), pg_temp.u('p_hooch'), 'F-HC-01', null, 'Carton of 24', true),
  (pg_temp.u('s_draft'), pg_temp.u('p_draft'), 'F-YZ-09', null, 'Pack of 4', true);

insert into public.crm_organisations (id, name, kind, stockist_id) values
  (pg_temp.u('org_yazz'), 'Osu Mini Mart Ltd', 'retailer', pg_temp.u('st_yazz'));
insert into public.crm_organisation_brands (organisation_id, brand_id) values (pg_temp.u('org_yazz'), pg_temp.brand('yazz'));

-- Shops a person may visit ---------------------------------------------------------------------------------
do $$
declare
  names text;
begin
  perform pg_temp.login('rep_yazz');
  -- Near Osu: Osu Mini Mart first, then Labone Pharmacy. Not Hooch only, not the brandless shop, not an inactive shop.
  select string_agg(name, ',') into names from public.field_sales_shops(5.5570, -0.1830, null, 40);
  perform pg_temp.ok(names = 'Osu Mini Mart,Labone Pharmacy', 'a Yazz rep sees shops of Yazz, nearest first: ' || coalesce(names, 'none'));
  perform pg_temp.ok((select distance_m between 100 and 200 from public.field_sales_shops(5.5570, -0.1830, null, 40) where name = 'Osu Mini Mart'),
    'the distance to the nearest shop is about 150 m');
  select string_agg(name, ',') into names from public.field_sales_shops(null, null, null, 40);
  perform pg_temp.ok(names = 'Labone Pharmacy,Osu Mini Mart', 'without a position the shops come by name');
  select string_agg(name, ',') into names from public.field_sales_shops(null, null, 'labone', 40);
  perform pg_temp.ok(names = 'Labone Pharmacy', 'search by name');
  select string_agg(name, ',') into names from public.field_sales_shops(null, null, 'osu', 40);
  perform pg_temp.ok(names = 'Osu Mini Mart', 'search by town');
  perform pg_temp.ok((select crm_organisation_name from public.field_sales_shops(null, null, 'osu', 40)) = 'Osu Mini Mart Ltd',
    'a shop with a CRM organisation says so');

  perform pg_temp.login('rep_hooch');
  select string_agg(name, ',') into names from public.field_sales_shops(null, null, null, 40);
  perform pg_temp.ok(names = 'Kejetia Provisions,Labone Pharmacy', 'a Hooch rep sees shops of Hooch: ' || coalesce(names, 'none'));
  perform pg_temp.ok((select crm_organisation_name from public.field_sales_shops(null, null, 'labone', 40)) is null, 'no CRM organisation on Labone');

  perform pg_temp.login('rep_none');
  perform pg_temp.ok(not exists (select 1 from public.field_sales_shops(null, null, null, 40)), 'a rep with no brands sees no shops');

  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.field_sales_shops(null, null, null, 40)) = 4, 'management sees every active shop');

  foreach names in array array['care', 'mkt', 'hr', 'dist', 'norole', 'rep_off'] loop
    perform pg_temp.login(names);
    perform pg_temp.ok(not exists (select 1 from public.field_sales_shops(null, null, null, 40)), names || ' sees no shops in field sales');
    perform pg_temp.ok(not exists (select 1 from public.field_visit_outcomes), names || ' reads no outcomes');
    perform pg_temp.ok(not exists (select 1 from public.field_sales_people()), names || ' gets no people list');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails('select * from public.field_sales_shops(null, null, null, 40)', '42501'), 'website visitors cannot list shops');
  perform pg_temp.ok(pg_temp.fails('select * from public.field_visit_outcomes', '42501'), 'website visitors cannot read outcomes');
  perform pg_temp.owner();
  raise notice 'PASS: shops are scoped to the rep''s brands, sorted by distance, searchable; other roles see none';
end $$;

-- Logging visits -------------------------------------------------------------------------------------------
do $$
declare
  r jsonb;
  d jsonb;
  n_acts integer;
  names text;
begin
  perform pg_temp.login('rep_yazz');
  d := pg_temp.visit('st_yazz', 'order_taken', 'Spoke to the owner. Wants more Night packs.')
    || jsonb_build_object('stock', jsonb_build_array(
         jsonb_build_object('sku_id', pg_temp.u('s_yazz'), 'on_shelf', true, 'facings', 6),
         jsonb_build_object('sku_id', pg_temp.u('s_yazz2'), 'on_shelf', false)));
  r := public.save_field_visit(pg_temp.u('v1'), d);
  perform pg_temp.ok((r ->> 'created')::boolean and (r ->> 'crm_logged')::boolean and (r ->> 'id')::uuid = pg_temp.u('v1'),
    'a Yazz rep logs a visit at a Yazz shop, written on the CRM: ' || r::text);
  perform pg_temp.ok((select rep_id = pg_temp.u('rep_yazz') and shop_name = 'Osu Mini Mart' and town = 'Osu' and location_status = 'captured'
      and latitude = 5.6037 and accuracy_m = 12 and brand_ids = array[pg_temp.brand('yazz')] and not new_shop
      and visited_at = now() and updated_by = pg_temp.u('rep_yazz')
    from public.field_visits where id = pg_temp.u('v1')), 'the rep, shop, time, location and brands come from the database');
  perform pg_temp.ok((select count(*) from public.field_visit_stock_checks where visit_id = pg_temp.u('v1')) = 2, 'two stock check lines');
  perform pg_temp.ok((select product_name_snapshot = 'Field Yazz Pads' and sku_code_snapshot = 'F-YZ-01' and facings = 6 and brand_id = pg_temp.brand('yazz')
    from public.field_visit_stock_checks where sku_id = pg_temp.u('s_yazz')), 'stock lines copy the product details');
  perform pg_temp.ok((select a.type = 'visit' and a.organisation_id = pg_temp.u('org_yazz') and a.created_by = pg_temp.u('rep_yazz')
      and a.body = 'Shop visit (field sales): Order taken. Spoke to the owner. Wants more Night packs.'
    from public.crm_activities a join public.field_visits v on v.crm_activity_id = a.id where v.id = pg_temp.u('v1')),
    'the visit is on the organisation''s CRM timeline');

  -- The same nonce again (a retry after a dropped connection) saves nothing new.
  select count(*) into n_acts from public.crm_activities;
  r := public.save_field_visit(pg_temp.u('v1'), d);
  perform pg_temp.ok(not (r ->> 'created')::boolean and (r ->> 'id')::uuid = pg_temp.u('v1'), 'a retry returns the saved visit');
  perform pg_temp.ok((select count(*) from public.field_visits) = 1 and (select count(*) from public.crm_activities) = n_acts
    and (select count(*) from public.field_visit_stock_checks) = 2, 'a retry saves nothing twice');

  -- Location refused: saved with the flag and no numbers. No CRM when asked not to.
  r := public.save_field_visit(pg_temp.u('v2'), pg_temp.visit('st_both', 'follow_up', null, null) || '{"log_to_crm": false}');
  perform pg_temp.ok((select location_status = 'denied' and latitude is null and accuracy_m is null and crm_activity_id is null
    and brand_ids = array[pg_temp.brand('yazz')] from public.field_visits where id = pg_temp.u('v2')),
    'location refused is flagged; the visit is for the rep''s brand of a two brand shop');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f',
    jsonb_build_object('stockist_id', '00000000-0000-0000-0000-00000000fa01', 'outcome_id', pg_temp.outcome('no_order'),
      'location', jsonb_build_object('status', 'captured')))$q$, '22023'), 'captured without numbers is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f',
    jsonb_build_object('stockist_id', '00000000-0000-0000-0000-00000000fa01', 'outcome_id', pg_temp.outcome('no_order'),
      'location', jsonb_build_object('status', 'guessed')))$q$, '22023'), 'an unknown location status is refused');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visits (id, stockist_id, location_status, latitude, longitude, outcome_id)
    values ('00000000-0000-0000-0000-00000000fe0f', '00000000-0000-0000-0000-00000000fa01', 'denied', 5.6, -0.2, pg_temp.outcome('no_order'))$q$, '23514'),
    'a refused location cannot carry numbers');

  -- Brand scoping.
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_hooch'))$q$, '42501'),
    'a Yazz rep cannot log a visit at a Hooch only shop');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_none'))$q$, '42501'),
    'a Yazz rep cannot log a visit at a shop with no brand someone else added');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_yazz')
    || jsonb_build_object('stock', jsonb_build_array(jsonb_build_object('sku_id', '00000000-0000-0000-0000-00000000fc03', 'on_shelf', true))))$q$, '42501'),
    'a Yazz rep cannot check stock of a Hooch SKU');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_yazz')
    || jsonb_build_object('stock', jsonb_build_array(jsonb_build_object('sku_id', '00000000-0000-0000-0000-00000000fc04', 'on_shelf', true))))$q$, '23514'),
    'no stock check of an unpublished product');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_yazz')
    || jsonb_build_object('stock', jsonb_build_array(jsonb_build_object('sku_id', '00000000-0000-0000-0000-00000000fc05', 'on_shelf', true))))$q$, '23514'),
    'no stock check of an inactive SKU');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_yazz')
    || jsonb_build_object('stock', jsonb_build_array(jsonb_build_object('sku_id', '00000000-0000-0000-0000-00000000fc01', 'on_shelf', false, 'facings', 3))))$q$, '23514'),
    'not on the shelf means no facings');
  perform pg_temp.ok(not exists (select 1 from public.field_visits where id = pg_temp.u('vx')), 'a refused save leaves nothing behind');

  -- The database decides the rep, the shop details and new_shop.
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visits (id, rep_id, stockist_id, location_status, outcome_id)
    values ('00000000-0000-0000-0000-00000000fe0f', '00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000fa01', 'denied', pg_temp.outcome('no_order'))$q$, '42501'),
    'nobody sets the rep');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visits (id, stockist_id, shop_name, location_status, outcome_id)
    values ('00000000-0000-0000-0000-00000000fe0f', '00000000-0000-0000-0000-00000000fa01', 'Fake', 'denied', pg_temp.outcome('no_order'))$q$, '42501'),
    'nobody sets the shop name');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visits (id, stockist_id, new_shop, location_status, outcome_id)
    values ('00000000-0000-0000-0000-00000000fe0f', '00000000-0000-0000-0000-00000000fa01', true, 'denied', pg_temp.outcome('no_order'))$q$, '23514'),
    'a listed shop is not a new shop');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visits (id, stockist_id, location_status, outcome_id, crm_activity_id)
    values ('00000000-0000-0000-0000-00000000fe0f', '00000000-0000-0000-0000-00000000fa03', 'denied', pg_temp.outcome('no_order'),
      (select crm_activity_id from public.field_visits where id = '00000000-0000-0000-0000-00000000fe01'))$q$, '23514'),
    'a visit cannot point at another shop''s CRM activity');

  -- Another person's nonce.
  perform pg_temp.login('rep_hooch');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe01', pg_temp.visit('st_hooch'))$q$, '23505'),
    'reusing someone else''s visit id is refused');
  r := public.save_field_visit(pg_temp.u('v3'), pg_temp.visit('st_both', 'no_order', 'Hooch biscuits sold out.', 5.5651, -0.1701));
  perform pg_temp.ok((select brand_ids = array[pg_temp.brand('hooch')] from public.field_visits where id = pg_temp.u('v3')),
    'a Hooch rep visits a two brand shop for Hooch');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe03', pg_temp.visit('st_both'))$q$, '22023'),
    'a manager cannot take over a rep''s visit id');
  r := public.save_field_visit(pg_temp.u('v4'), pg_temp.visit('st_hooch', 'shop_closed'));
  perform pg_temp.ok((select rep_id = pg_temp.u('mgmt') and brand_ids = array[pg_temp.brand('hooch')] from public.field_visits where id = pg_temp.u('v4')),
    'management logs a visit of their own at any shop');

  d := pg_temp.visit('st_yazz');
  foreach names in array array['care', 'mkt', 'hr', 'dist', 'norole', 'rep_off', 'anon'] loop
    perform pg_temp.login(names);
    perform pg_temp.ok(pg_temp.fails(format($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', %L::jsonb)$q$, d)),
      names || ' cannot log a visit');
  end loop;
  perform pg_temp.owner();
  raise notice 'PASS: visits are logged with the database''s rep, time, shop and brands; retries save once; brand scoping holds';
end $$;

-- New shops ------------------------------------------------------------------------------------------------
do $$
declare
  r jsonb;
  st uuid;
  shop jsonb := jsonb_build_object('name', 'Mama Esi Provisions', 'outlet_type', 'general_trade',
    'region_id', (select id from public.regions where slug = 'greater-accra'), 'town', 'Teshie', 'phone', '024 555 0101');
begin
  perform pg_temp.login('rep_yazz');
  r := public.save_field_visit(pg_temp.u('v5'), jsonb_build_object('outcome_id', pg_temp.outcome('follow_up'),
    'location', jsonb_build_object('status', 'captured', 'latitude', 5.5800, 'longitude', -0.1000, 'accuracy', 30),
    'new_shop', shop || jsonb_build_object('brand_ids', jsonb_build_array(pg_temp.brand('yazz')))));
  st := (r ->> 'stockist_id')::uuid;
  perform pg_temp.ok((r ->> 'created')::boolean and not (r ->> 'crm_logged')::boolean, 'a rep logs a visit at a new shop');
  perform pg_temp.ok((select new_shop and shop_name = 'Mama Esi Provisions' and stockist_id = st from public.field_visits where id = pg_temp.u('v5')),
    'the visit is marked as a new shop');
  perform pg_temp.owner();
  perform pg_temp.ok((select not is_active and latitude = 5.58 and longitude = -0.1 and created_by = pg_temp.u('rep_yazz') from public.stockists where id = st),
    'the new shop is a draft stockist at the visit''s position, added by the rep');
  perform pg_temp.ok((select notes like 'Added from a field visit on %' from public.stockist_notes where stockist_id = st), 'with a note for staff');
  perform pg_temp.ok((select array_agg(brand_id) from public.stockist_brands where stockist_id = st) = array[pg_temp.brand('yazz')], 'carrying the rep''s brand');
  perform pg_temp.login('anon');
  perform pg_temp.ok(not exists (select 1 from public.stockists where id = st), 'a draft shop is not on Where to Buy');
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok((select not is_active from public.field_sales_shops(null, null, 'mama esi', 40)), 'the rep finds their draft shop again');
  perform pg_temp.login('rep_hooch');
  perform pg_temp.ok(not exists (select 1 from public.field_sales_shops(null, null, 'mama esi', 40)), 'other reps do not see it');

  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', jsonb_build_object(
    'outcome_id', pg_temp.outcome('no_order'), 'location', '{"status":"unavailable"}', 'new_shop', %L::jsonb))$q$,
    jsonb_set(shop, '{name}', '"Another Shop"') || jsonb_build_object('brand_ids', jsonb_build_array(pg_temp.brand('hooch'))))), 'a new shop only carries the rep''s brands');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', jsonb_build_object(
    'outcome_id', pg_temp.outcome('no_order'), 'location', '{"status":"unavailable"}', 'new_shop', %L::jsonb))$q$,
    jsonb_set(shop, '{name}', '"Another Shop"')), '22023'), 'a new shop needs a brand');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', jsonb_build_object(
    'outcome_id', pg_temp.outcome('no_order'), 'location', '{"status":"unavailable"}', 'new_shop', %L::jsonb))$q$,
    shop || jsonb_build_object('brand_ids', jsonb_build_array(pg_temp.brand('yazz')))), '23505'), 'the same shop twice is refused');
  perform pg_temp.ok(not exists (select 1 from public.stockists where name = 'Another Shop'), 'a refused new shop leaves no stockist');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', jsonb_build_object(
    'outcome_id', pg_temp.outcome('no_order'), 'location', '{"status":"unavailable"}', 'new_shop', %L::jsonb))$q$,
    jsonb_set(shop, '{name}', '"Mgmt Shop"') || jsonb_build_object('brand_ids', jsonb_build_array(pg_temp.brand('yazz')))), '42501'),
    'management cannot add stockists (the Stockists rules of 0005 decide)');
  -- Only admin or marketing switch a field visit draft on; every other stockist works as before (0005).
  perform pg_temp.owner();
  perform pg_temp.ok((select visit_id = pg_temp.u('v5') and created_by = pg_temp.u('rep_yazz') and confirmed_at is null
    from public.field_new_shops where stockist_id = st), 'the draft is listed in field_new_shops');
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_stockist_active(%L, true)', st), '42501'), 'the rep who added the shop cannot switch it on');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_stockist(%L, null, array[%L]::uuid[])', st, pg_temp.brand('yazz'))) is false
    and (select not is_active from public.stockists where id = st), 'other stockist edits by the rep still work and leave it a draft');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into public.field_new_shops (stockist_id, visit_id) values (%L, %L)$q$,
    pg_temp.u('st_yazz'), pg_temp.u('v1')), '23514'), 'a listed shop cannot be made a field draft');
  perform public.set_stockist_active(pg_temp.u('st_yazz'), false);
  perform public.set_stockist_active(pg_temp.u('st_yazz'), true);
  perform pg_temp.ok((select is_active from public.stockists where id = pg_temp.u('st_yazz')), 'a rep still switches other shops of their brand off and on (0005)');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails(format('select public.set_stockist_active(%L, true)', st), '42501'), 'management cannot switch it on');
  perform pg_temp.login('mkt');
  perform public.set_stockist_active(st, true);
  perform pg_temp.owner();
  perform pg_temp.ok((select is_active from public.stockists where id = st)
    and (select confirmed_at is not null and confirmed_by = pg_temp.u('mkt') from public.field_new_shops where stockist_id = st),
    'marketing switches it on, which confirms it');
  update public.stockists set is_active = false where id = st;
  raise notice 'PASS: a new shop becomes a draft stockist with the rep''s brands, hidden from Where to Buy; only admin or marketing switch it on';
end $$;

-- Who sees what --------------------------------------------------------------------------------------------
do $$
declare
  who text;
begin
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok((select string_agg(id::text, ',' order by id) from public.field_visits) = concat_ws(',', pg_temp.u('v1'), pg_temp.u('v2'), pg_temp.u('v5')),
    'a rep sees only their own visits');
  perform pg_temp.ok((select count(*) from public.field_visit_list()) = 3 and (select max(total_count) from public.field_visit_list()) = 3,
    'the list has the rep''s three visits');
  perform pg_temp.ok((select string_agg(display_name, ',') from public.field_sales_people()) = 'Yaw Yazz Rep', 'a rep''s people list is themself');
  perform pg_temp.ok((select distance_from_shop_m between 5000 and 6000 from public.field_visit_list() where id = pg_temp.u('v1')),
    'the list says how far the phone was from the shop');
  perform pg_temp.ok((select photo_count = 0 and stock_count = 2 and on_shelf_count = 1 and crm_logged and rep_name = 'Yaw Yazz Rep'
    and outcome_label = 'Order taken' and region_name = 'Greater Accra' from public.field_visit_list() where id = pg_temp.u('v1')), 'list counts and names');
  perform pg_temp.login('rep_hooch');
  perform pg_temp.ok((select string_agg(id::text, ',') from public.field_visits) = pg_temp.u('v3')::text, 'a Hooch rep sees only their visit');
  perform pg_temp.ok(not exists (select 1 from public.field_visit_stock_checks), 'nor anyone else''s stock checks');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_rep => pg_temp.u('rep_yazz'))) = 0, 'filtering by another rep gives nothing');
  foreach who in array array['mgmt', 'admin'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok((select count(*) from public.field_visits) = 5 and (select count(*) from public.field_visit_stock_checks) = 2,
      who || ' sees every visit');
    perform pg_temp.ok((select count(*) from public.field_sales_people()) >= 4, who || ' gets every field sales person');
  end loop;
  -- Filters.
  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_rep => pg_temp.u('rep_yazz'))) = 3, 'filter by rep');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_brand => pg_temp.brand('hooch'))) = 2, 'filter by brand');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_region => (select id from public.regions where slug = 'ashanti'))) = 1, 'filter by region');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_outcome => pg_temp.outcome('follow_up'))) = 2, 'filter by outcome');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_from => current_date, p_to => current_date)) = 5
    and (select count(*) from public.field_visit_list(p_to => current_date - 1)) = 0, 'filter by date');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_q => 'labone')) = 2, 'search by shop');
  perform pg_temp.ok((select count(*) from public.field_visit_list(p_limit => 2, p_offset => 4)) = 1, 'paging');
  perform pg_temp.ok((select string_agg(id::text, ',') from public.field_visit_list(p_id => pg_temp.u('v3'))) = pg_temp.u('v3')::text, 'one visit by id');
  foreach who in array array['care', 'mkt', 'hr', 'dist', 'norole', 'rep_off', 'rep_none'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(not exists (select 1 from public.field_visits) and not exists (select 1 from public.field_visit_stock_checks)
      and not exists (select 1 from public.field_visit_photos) and not exists (select 1 from public.field_visit_list()),
      who || ' sees no visits');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails('select * from public.field_visits', '42501') and pg_temp.fails('select * from public.field_visit_photos', '42501')
    and pg_temp.fails('select * from public.field_visit_list()', '42501'), 'website visitors read nothing');
  perform pg_temp.owner();
  raise notice 'PASS: reps see their own visits, management and admin see all, filters work, other roles see nothing';
end $$;

-- Changing and deleting visits -----------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('rep_yazz');
  perform public.update_field_visit(pg_temp.u('v1'), jsonb_build_object('outcome_id', pg_temp.outcome('follow_up'), 'notes', 'Call back on Monday.',
    'stock', jsonb_build_array(jsonb_build_object('sku_id', pg_temp.u('s_yazz2'), 'on_shelf', true, 'facings', 2))));
  perform pg_temp.ok((select outcome_id = pg_temp.outcome('follow_up') and notes = 'Call back on Monday.' from public.field_visits where id = pg_temp.u('v1')),
    'the rep changes the outcome and notes of their visit the same day');
  perform pg_temp.ok((select count(*) from public.field_visit_stock_checks where visit_id = pg_temp.u('v1')) = 1, 'and replaces the stock check');
  perform pg_temp.ok(pg_temp.fails($q$update public.field_visits set shop_name = 'Elsewhere' where id = '00000000-0000-0000-0000-00000000fe01'$q$, '42501')
    and pg_temp.fails($q$update public.field_visits set latitude = 1 where id = '00000000-0000-0000-0000-00000000fe01'$q$, '42501'),
    'the shop and location cannot be changed');
  perform pg_temp.ok(pg_temp.fails($q$select public.update_field_visit('00000000-0000-0000-0000-00000000fe03', jsonb_build_object('outcome_id', pg_temp.outcome('no_order')))$q$, '42501'),
    'a rep cannot change another rep''s visit');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails($q$select public.update_field_visit('00000000-0000-0000-0000-00000000fe01', jsonb_build_object('outcome_id', pg_temp.outcome('no_order')))$q$, '42501'),
    'management reads but does not change a rep''s visit');
  perform pg_temp.ok(pg_temp.fails($q$select public.delete_field_visit('00000000-0000-0000-0000-00000000fe04')$q$, '42501'), 'management does not delete, even their own');

  -- A day later the rep cannot change it any more; admin still can.
  perform pg_temp.owner();
  alter table public.field_visits disable trigger field_visits_check;
  update public.field_visits set created_at = now() - interval '25 hours' where id = pg_temp.u('v1');
  alter table public.field_visits enable trigger field_visits_check;
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails($q$select public.update_field_visit('00000000-0000-0000-0000-00000000fe01', jsonb_build_object('outcome_id', pg_temp.outcome('no_order')))$q$, '42501'),
    'after 24 hours the rep cannot change the visit');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visit_stock_checks (visit_id, sku_id, on_shelf) values ('00000000-0000-0000-0000-00000000fe01', '00000000-0000-0000-0000-00000000fc01', true)$q$, '42501'),
    'nor its stock check');
  delete from public.field_visit_stock_checks where visit_id = pg_temp.u('v1');
  perform pg_temp.ok((select count(*) from public.field_visit_stock_checks where visit_id = pg_temp.u('v1')) = 1, 'nor remove stock lines');
  perform pg_temp.ok(pg_temp.fails($q$select public.delete_field_visit('00000000-0000-0000-0000-00000000fe02')$q$, '42501'), 'a rep does not delete their visit');
  perform pg_temp.login('admin');
  perform public.update_field_visit(pg_temp.u('v1'), jsonb_build_object('outcome_id', pg_temp.outcome('order_taken'), 'notes', 'Fixed by admin.'));
  perform pg_temp.ok((select notes = 'Fixed by admin.' and updated_by = pg_temp.u('admin') and rep_id = pg_temp.u('rep_yazz') from public.field_visits where id = pg_temp.u('v1')),
    'admin changes any visit; the rep stays');
  perform pg_temp.owner();
  raise notice 'PASS: reps change their own visits for 24 hours, admin any time, management never; only admin deletes';
end $$;

-- Outcomes -------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visit_outcomes (slug, label) values ('x', 'X')$q$, '42501'), 'a rep cannot add outcomes');
  update public.field_visit_outcomes set label = 'Hacked';
  perform pg_temp.ok(not exists (select 1 from public.field_visit_outcomes where label = 'Hacked'), 'a rep cannot rename outcomes');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.field_visit_outcomes (slug, label) values ('x', 'X')$q$, '42501'), 'management cannot add outcomes');
  perform pg_temp.login('admin');
  insert into public.field_visit_outcomes (slug, label, sort_order) values ('promo_placed', 'Promotion material placed', 50);
  update public.field_visit_outcomes set is_active = false where slug = 'shop_closed';
  perform pg_temp.ok(pg_temp.fails($q$delete from public.field_visit_outcomes where slug = 'order_taken'$q$, '23503'), 'an outcome in use cannot be deleted');
  delete from public.field_visit_outcomes where slug = 'promo_placed';
  perform pg_temp.ok(not exists (select 1 from public.field_visit_outcomes where slug = 'promo_placed'), 'admin deletes an unused outcome');
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_field_visit('00000000-0000-0000-0000-00000000fe0f', pg_temp.visit('st_yazz', 'shop_closed'))$q$, '23514'),
    'a switched off outcome cannot be chosen');
  perform pg_temp.owner();
  update public.field_visit_outcomes set is_active = true where slug = 'shop_closed';
  raise notice 'PASS: only admin manages outcomes; used ones are switched off, not deleted';
end $$;

-- Photos and the bucket ------------------------------------------------------------------------------------
-- The portal's server signs each photo it checked; the harness signs with the same secret.
create function pg_temp.sig(photo uuid, visit uuid, mime text, size integer, at bigint) returns text language sql immutable as $$
  select encode(extensions.hmac('field-photo.' || photo || '.' || visit || '.' || mime || '.' || size || '.' || at,
    'harness-field-photo-secret-0123456789abcdef', 'sha256'), 'hex');
$$;
create function pg_temp.now_s() returns bigint language sql stable as $$ select extract(epoch from now())::bigint; $$;
-- A file in the bucket as the current person, with what Storage records about it.
create function pg_temp.put(visit uuid, photo uuid, ext text, mime text, size integer) returns void language sql as $$
  insert into storage.objects (bucket_id, name, owner, metadata)
  values ('field-visit-photos', visit || '/' || photo || '.' || ext, auth.uid(), jsonb_build_object('mimetype', mime, 'size', size));
$$;
create function pg_temp.rec(photo uuid, visit uuid, mime text, size integer) returns boolean language sql as $$
  select public.record_field_visit_photo(photo, visit, mime, size, pg_temp.now_s(), pg_temp.sig(photo, visit, mime, size, pg_temp.now_s()));
$$;
create function pg_temp.pid(n integer) returns uuid language sql immutable as $$
  select ('00000000-0000-0000-0000-0000000fa0' || lpad(n::text, 2, '0'))::uuid;
$$;

do $$
declare
  p1 text := pg_temp.u('v2') || '/' || pg_temp.u('ph1') || '.jpg';
  who text;
  n integer;
begin
  perform pg_temp.owner();
  perform pg_temp.ok(not has_table_privilege('authenticated', 'public.field_visit_photos', 'insert'), 'people have no insert rights on photo records');

  -- Not set up yet: refused.
  perform pg_temp.login('rep_yazz');
  perform pg_temp.put(pg_temp.u('v2'), pg_temp.u('ph1'), 'jpg', 'image/jpeg', 120000);
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 120000)$q$, pg_temp.u('ph1'), pg_temp.u('v2')), '55000'),
    'photos are refused until the secret is set up');
  perform pg_temp.owner();
  insert into private.field_photo_secret (secret) values ('harness-field-photo-secret-0123456789abcdef');

  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.rec(pg_temp.u('ph1'), pg_temp.u('v2'), 'image/jpeg', 120000), 'the server records a checked photo on the rep''s visit');
  perform pg_temp.ok((select created_by = pg_temp.u('rep_yazz') and storage_path = p1 from public.field_visit_photos where id = pg_temp.u('ph1')),
    'the record has the rep and the file''s path');
  perform pg_temp.ok(not pg_temp.rec(pg_temp.u('ph1'), pg_temp.u('v2'), 'image/jpeg', 120000), 'recording it again (a retry) adds nothing');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into public.field_visit_photos (id, visit_id, storage_path, mime_type, size_bytes) values (%L, %L, %L, 'image/jpeg', 100)$q$,
    pg_temp.u('ph2'), pg_temp.u('v2'), pg_temp.u('v2') || '/' || pg_temp.u('ph2') || '.jpg'), '42501'), 'a rep cannot insert a photo record directly');

  -- Bytes sent straight to the Storage API are never recorded without the server's signature.
  perform pg_temp.put(pg_temp.u('v2'), pg_temp.u('ph2'), 'png', 'image/png', 2000);
  perform pg_temp.ok(pg_temp.fails(format($q$select public.record_field_visit_photo(%L, %L, 'image/png', 2000, pg_temp.now_s(), repeat('a', 64))$q$,
    pg_temp.u('ph2'), pg_temp.u('v2')), '22023'), 'a made up signature is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.record_field_visit_photo(%L, %L, 'image/png', 2000, pg_temp.now_s() - 3600, pg_temp.sig(%L, %L, 'image/png', 2000, pg_temp.now_s() - 3600))$q$,
    pg_temp.u('ph2'), pg_temp.u('v2'), pg_temp.u('ph2'), pg_temp.u('v2')), '22023'), 'an old signature is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/png', 2001)$q$, pg_temp.u('ph2'), pg_temp.u('v2')), '23514'),
    'a size different from the file in Storage is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 2000)$q$, pg_temp.u('ph2'), pg_temp.u('v2')), '23514'),
    'a type different from the file in Storage is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 100)$q$, pg_temp.u('ph3'), pg_temp.u('v2')), '23514'),
    'no record without its file');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/gif', 100)$q$, pg_temp.u('ph3'), pg_temp.u('v2')), '22023'),
    'only JPEG, PNG and WebP');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 100)$q$, pg_temp.u('ph3'), pg_temp.u('v3')), '42501'),
    'no record on another rep''s visit');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 120000)$q$, pg_temp.u('ph1'), pg_temp.u('v5')), '22023'),
    'a photo id cannot move to another visit');
  perform pg_temp.ok(pg_temp.rec(pg_temp.u('ph2'), pg_temp.u('v2'), 'image/png', 2000), 'with the right signature, size and type it is recorded');
  perform pg_temp.login('admin');
  perform pg_temp.put(pg_temp.u('v2'), pg_temp.u('ph3'), 'jpg', 'image/jpeg', 500);
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 500)$q$, pg_temp.u('ph3'), pg_temp.u('v2')), '23514'),
    'a rep cannot record a file someone else uploaded');

  -- Storage paths.
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 1)$q$, pg_temp.u('v3'), pg_temp.u('vx')), '42501'),
    'a rep cannot upload to another rep''s visit');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into storage.objects (bucket_id, name) values ('field-visit-photos', %L)$q$,
    pg_temp.u('v2') || '/photo.jpg'), '42501'), 'only <visit>/<photo id>.<ext> paths');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 1)$q$, pg_temp.u('v1'), pg_temp.u('vx')), '42501'),
    'no uploads to a visit older than 24 hours');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'gif', 'image/gif', 1)$q$, pg_temp.u('v2'), pg_temp.u('vx')), '42501'),
    'only jpg, png and webp names');
  perform pg_temp.ok((select photo_count from public.field_visit_list() where id = pg_temp.u('v2')) = 2, 'the list counts recorded photos only');
  perform pg_temp.ok(pg_temp.fails(format($q$update public.field_visit_photos set size_bytes = 1 where id = %L$q$, pg_temp.u('ph1')), '42501'), 'photos are never changed');
  delete from storage.objects where name = p1;
  delete from public.field_visit_photos where id = pg_temp.u('ph1');
  perform pg_temp.ok(exists (select 1 from storage.objects where name = p1) and exists (select 1 from public.field_visit_photos where id = pg_temp.u('ph1')),
    'a rep cannot remove photos');

  -- Who reads the files.
  perform pg_temp.login('rep_hooch');
  perform pg_temp.ok(not exists (select 1 from storage.objects where bucket_id = 'field-visit-photos'), 'another rep cannot read the photo files');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from storage.objects where bucket_id = 'field-visit-photos') = 3 and (select count(*) from public.field_visit_photos) = 2,
    'management reads every photo');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 1)$q$, pg_temp.u('v2'), pg_temp.u('vx')), '42501'),
    'management cannot add photos to a rep''s visit');
  delete from storage.objects where name = p1;
  perform pg_temp.ok(exists (select 1 from storage.objects where name = p1), 'management cannot remove photos');
  foreach who in array array['care', 'mkt', 'hr', 'dist', 'norole', 'rep_off', 'rep_none'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(not exists (select 1 from storage.objects where bucket_id = 'field-visit-photos'), who || ' cannot read the photo files');
    perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/png', 2000)$q$, pg_temp.u('ph2'), pg_temp.u('v2'))), who || ' cannot record photos');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(not exists (select 1 from storage.objects where bucket_id = 'field-visit-photos'), 'website visitors cannot read the photo files');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into storage.objects (bucket_id, name) values ('field-visit-photos', %L)$q$,
    pg_temp.u('v2') || '/' || pg_temp.u('vx') || '.jpg')), 'website visitors cannot upload');

  -- At most 10 photos a visit, and at most 15 files in its folder.
  perform pg_temp.login('rep_yazz');
  for n in 1..8 loop
    perform pg_temp.put(pg_temp.u('v2'), pg_temp.pid(n), 'jpg', 'image/jpeg', 100 + n);
    perform pg_temp.rec(pg_temp.pid(n), pg_temp.u('v2'), 'image/jpeg', 100 + n);
  end loop;
  perform pg_temp.put(pg_temp.u('v2'), pg_temp.pid(99), 'jpg', 'image/jpeg', 100);
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 100)$q$, pg_temp.pid(99), pg_temp.u('v2')), '23514'),
    'an eleventh photo is refused');
  -- 12 files now (10 recorded, the admin's and the eleventh): three more fit, the sixteenth does not.
  for n in 20..22 loop
    perform pg_temp.put(pg_temp.u('v2'), pg_temp.pid(n), 'jpg', 'image/jpeg', 100);
  end loop;
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 100)$q$, pg_temp.u('v2'), pg_temp.pid(23)), '42501'),
    'unrecorded files are capped at 15 a visit');

  perform pg_temp.login('admin');
  delete from storage.objects where name = pg_temp.u('v2') || '/' || pg_temp.pid(99) || '.jpg';
  perform pg_temp.ok(not exists (select 1 from storage.objects where name = pg_temp.u('v2') || '/' || pg_temp.pid(99) || '.jpg'), 'admin removes photo files');
  perform pg_temp.owner();
  raise notice 'PASS: photos: only server signed, size and type matched files are recorded; bucket rules; 10 photos and 15 files a visit';
end $$;

-- Deleting what visits point at ----------------------------------------------------------------------------
do $$
declare
  st uuid := (select stockist_id from public.field_visits where id = '00000000-0000-0000-0000-00000000fe05');
begin
  -- A visit deleted by admin takes its stock check and photo records with it.
  perform pg_temp.login('admin');
  perform public.delete_field_visit(pg_temp.u('v4'));
  perform pg_temp.ok(not exists (select 1 from public.field_visits where id = pg_temp.u('v4')), 'admin deletes a visit');
  perform pg_temp.owner();

  -- The rep who made visits, stock checks and photos.
  delete from auth.users where id = pg_temp.u('rep_yazz');
  perform pg_temp.ok(not exists (select 1 from public.profiles where id = pg_temp.u('rep_yazz')), 'the rep is deleted');
  perform pg_temp.ok((select count(*) from public.field_visits where rep_id is null) = 3, 'their visits stay, without the rep');
  perform pg_temp.ok((select notes = 'Fixed by admin.' and outcome_id = pg_temp.outcome('order_taken') and shop_name = 'Osu Mini Mart'
    and latitude = 5.6037 and updated_by = pg_temp.u('admin') from public.field_visits where id = pg_temp.u('v1')), 'nothing else about them changes');
  perform pg_temp.ok((select count(*) from public.field_visit_photos where visit_id = pg_temp.u('v2') and created_by is null) = 10, 'their photos stay, without author');
  perform pg_temp.ok((select count(*) from public.field_visit_stock_checks where visit_id = pg_temp.u('v1')) = 1, 'their stock checks stay');
  perform pg_temp.ok((select created_by is null from public.field_new_shops where stockist_id = st), 'their new shop record stays, without author');
  perform pg_temp.ok((select created_by is null and name = 'Mama Esi Provisions' from public.stockists where id = st),
    'the shop they added stays, without author (set_stockist_authors keeps only existing authors)');
  perform pg_temp.ok((select a.created_by is null from public.crm_activities a join public.field_visits v on v.crm_activity_id = a.id
    where v.id = pg_temp.u('v1')), 'their CRM activity stays, without author (set_crm_activity_author keeps only existing authors)');

  -- The admin who last changed a visit.
  delete from auth.users where id = pg_temp.u('admin');
  perform pg_temp.ok((select updated_by is null from public.field_visits where id = pg_temp.u('v1')), 'the admin who changed a visit is deleted; the link is cleared');

  -- The shop, its region, a SKU and the CRM activity.
  delete from public.stockists where id = pg_temp.u('st_yazz');
  perform pg_temp.ok((select stockist_id is null and shop_name = 'Osu Mini Mart' and town = 'Osu' from public.field_visits where id = pg_temp.u('v1')),
    'a deleted shop leaves the visit with its name');
  delete from public.stockists where id = st;
  delete from public.product_skus where id = pg_temp.u('s_yazz2');
  perform pg_temp.ok((select sku_id is null and sku_code_snapshot = 'F-YZ-02' from public.field_visit_stock_checks where visit_id = pg_temp.u('v1')),
    'a deleted SKU leaves the stock line readable');
  delete from public.crm_activities where id in (select crm_activity_id from public.field_visits);
  perform pg_temp.ok(not exists (select 1 from public.field_visits where crm_activity_id is not null), 'a deleted CRM activity clears the link');
  delete from public.stockists where id = pg_temp.u('st_hooch');
  delete from public.regions where slug = 'ashanti';
  perform pg_temp.ok((select count(*) from public.field_visits) = 4, 'every visit is still there');

  -- The Hooch rep, whose visit is at a deleted shop in a deleted region.
  delete from auth.users where id = pg_temp.u('rep_hooch');
  perform pg_temp.ok((select rep_id is null and notes = 'Hooch biscuits sold out.' from public.field_visits where id = pg_temp.u('v3')), 'deleting another rep works too');
  raise notice 'PASS: deleting people, shops, regions, SKUs and CRM activities never fails and keeps the visits';
end $$;

-- Functions closed to website visitors.
do $$
declare f text;
begin
  foreach f in array array['field_sales_role()', 'field_may_visit_stockist(uuid)', 'field_stockist_mine(uuid)', 'field_visit_can_see(uuid)',
                           'field_visit_can_edit(uuid)', 'field_photo_room(uuid)', 'record_field_visit_photo(uuid,uuid,text,integer,bigint,text)', 'save_field_visit(uuid,jsonb)',
                           'update_field_visit(uuid,jsonb)', 'delete_field_visit(uuid)', 'field_sales_shops(numeric,numeric,text,integer)',
                           'field_visit_list(uuid,date,date,uuid,uuid,uuid,text,integer,integer,uuid)', 'field_sales_people()'] loop
    perform pg_temp.ok(not has_function_privilege('anon', 'public.' || f, 'execute'), 'anon cannot run ' || f);
  end loop;
  foreach f in array array['check_field_visit()', 'check_field_visit_stock()', 'check_field_visit_photo()', 'check_field_new_shop()', 'check_stockist_field_draft()'] loop
    perform pg_temp.ok(not has_function_privilege('authenticated', 'public.' || f, 'execute'), 'trigger function ' || f || ' is internal');
  end loop;
  raise notice 'PASS: functions closed to website visitors; trigger functions closed to everyone';
end $$;

rollback;
