-- CSR activity tracker (item 25): programmes, activities, photos and totals. Who may read, log, change and delete;
-- marketing's brand rule; anon gets nothing; totals per programme; photo records only with the server's signature;
-- the photo bucket's policies; and deleting a person, region or programme that activities point at.
-- Run with: bash supabase/tests/local/run.sh csr_tracker_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Helpers ----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000c001'
    when 'mgmt' then '00000000-0000-0000-0000-00000000c002'
    when 'mkt' then '00000000-0000-0000-0000-00000000c003'
    when 'mkt_yazz' then '00000000-0000-0000-0000-00000000c004'
    when 'rep' then '00000000-0000-0000-0000-00000000c005'
    when 'care' then '00000000-0000-0000-0000-00000000c006'
    when 'hr' then '00000000-0000-0000-0000-00000000c007'
    when 'dist' then '00000000-0000-0000-0000-00000000c008'
    when 'norole' then '00000000-0000-0000-0000-00000000c009'
    when 'mkt_off' then '00000000-0000-0000-0000-00000000c00a'
    -- programmes made here
    when 'pr_lexta' then '00000000-0000-0000-0000-00000000ca01'
    when 'pr_hooch' then '00000000-0000-0000-0000-00000000ca02'
    when 'pr_off' then '00000000-0000-0000-0000-00000000ca03'
    when 'pr_empty' then '00000000-0000-0000-0000-00000000ca04'
    -- photo ids
    when 'ph1' then '00000000-0000-0000-0000-00000000cf01'
    when 'ph2' then '00000000-0000-0000-0000-00000000cf02'
    when 'ph3' then '00000000-0000-0000-0000-00000000cf03'
    when 'phx' then '00000000-0000-0000-0000-00000000cf0f'
  end::uuid;
$$;

create function pg_temp.brand(slug text) returns uuid language sql stable as $$
  select id from public.brands where brands.slug = brand.slug;
$$;

create function pg_temp.region(slug text) returns uuid language sql stable as $$
  select id from public.regions where regions.slug = region.slug;
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

-- Logs an activity as the current person and returns its id.
create function pg_temp.log(programme uuid, day date, region text, place text, reached integer, status text default 'done')
returns uuid language sql as $$
  insert into public.csr_activities (programme_id, activity_date, status, region_id, place, people_reached)
  values (programme, day, status, pg_temp.region(region), place, reached)
  returning id;
$$;

create function pg_temp.act(place text) returns uuid language sql stable as $$
  select id from public.csr_activities where csr_activities.place = act.place;
$$;

-- Schema checks ------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.ok(not exists (select 1 from pg_tables where schemaname = 'public' and tablename like 'csr_%' and not rowsecurity),
    'every CSR table has Row Level Security on');
  perform pg_temp.ok((select count(*) from pg_tables where schemaname = 'public' and tablename like 'csr_%') = 3, 'three CSR tables');
  perform pg_temp.ok(not exists (select 1 from public.csr_activities) and not exists (select 1 from public.csr_activity_photos),
    'no activities are seeded');
  perform pg_temp.ok((select count(*) from public.csr_programmes where needs_review) = 8
      and (select count(*) from public.csr_programmes) = 8,
    'the eight programmes from the website are seeded and marked to check');
  perform pg_temp.ok(exists (select 1 from public.csr_programmes where name = 'The Dignity Project' and brand_id = pg_temp.brand('yazz'))
    and exists (select 1 from public.csr_programmes where name = 'Clean Hands, Green Land' and brand_id is null),
    'seeded names and brands');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname like '%csr%'
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=""')),
    'every CSR function sets search_path to empty');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('csr_activity_list', 'csr_programme_totals', 'delete_csr_activity') and p.prosecdef),
    'reading and deleting run as the caller (security invoker)');
  perform pg_temp.ok((select not public and file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
    from storage.buckets where id = 'csr-activity-photos'), 'the photo bucket is private, 5 MB, JPEG, PNG and WebP only');
  raise notice 'PASS: RLS on for the three tables, eight programmes seeded to check, search_path set, invoker RPCs, private bucket';
end $$;

-- Fixtures (as the database owner) -----------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),    'csr.admin@test.local',   '{"role":"admin"}',         '{"full_name":"Csr Admin"}'),
  (pg_temp.u('mgmt'),     'csr.mgmt@test.local',    '{"role":"management"}',    '{"full_name":"Csr Manager"}'),
  (pg_temp.u('mkt'),      'csr.mkt@test.local',     '{"role":"marketing"}',     '{"full_name":"Ama Marketing"}'),
  (pg_temp.u('mkt_yazz'), 'csr.mkty@test.local',    '{"role":"marketing"}',     '{}'),
  (pg_temp.u('mkt_off'),  'csr.mktoff@test.local',  '{"role":"marketing"}',     '{}'),
  (pg_temp.u('rep'),      'csr.rep@test.local',     '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('care'),     'csr.care@test.local',    '{"role":"customer_care"}', '{}'),
  (pg_temp.u('hr'),       'csr.hr@test.local',      '{"role":"hr"}',            '{}'),
  (pg_temp.u('dist'),     'csr.dist@test.local',    '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),   'csr.norole@test.local',  '{}',                       '{}');
update public.profiles set is_active = false where id = pg_temp.u('mkt_off');
insert into public.profile_brands (profile_id, brand_id) values
  (pg_temp.u('mkt_yazz'), pg_temp.brand('yazz')),
  (pg_temp.u('rep'), pg_temp.brand('hooch'));

-- Programmes ------------------------------------------------------------------------------------------------
do $$
declare who text;
begin
  perform pg_temp.login('admin');
  insert into public.csr_programmes (name, brand_id, sort_order) values
    ('Harness Lexta Outreach', null, 1),
    ('Harness Hooch Kitchens', pg_temp.brand('hooch'), 2),
    ('Harness Old Programme', null, 3),
    ('Harness Empty Programme', null, 4);
  perform pg_temp.ok(pg_temp.fails($q$insert into public.csr_programmes (id, name) values (gen_random_uuid(), 'Harness Own Id')$q$, '42501'),
    'ids come from the database');
  -- Fixed ids for the rest of the test (as the database owner).
  perform pg_temp.owner();
  update public.csr_programmes set id = case name when 'Harness Lexta Outreach' then pg_temp.u('pr_lexta')
    when 'Harness Hooch Kitchens' then pg_temp.u('pr_hooch') when 'Harness Old Programme' then pg_temp.u('pr_off')
    else pg_temp.u('pr_empty') end
  where name like 'Harness %';
  perform pg_temp.login('admin');
  perform pg_temp.ok((select created_by = pg_temp.u('admin') and updated_by = pg_temp.u('admin') and not needs_review
    from public.csr_programmes where id = pg_temp.u('pr_lexta')), 'admin adds programmes; authors from the session');
  update public.csr_programmes set name = 'The Dignity Project (Yazz)', needs_review = false where name = 'The Dignity Project';
  perform pg_temp.ok(exists (select 1 from public.csr_programmes where name = 'The Dignity Project (Yazz)' and not needs_review),
    'admin edits a seeded programme and marks it checked');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.csr_programmes (name) values ('Harness Lexta Outreach')$q$, '23505'), 'names are unique');
  perform pg_temp.ok(pg_temp.fails($q$insert into public.csr_programmes (name) values ('  ')$q$, '23514'), 'a name is needed');
  perform pg_temp.ok(pg_temp.fails($q$update public.csr_programmes set created_by = null$q$, '42501'), 'authors cannot be written');

  foreach who in array array['mgmt', 'mkt', 'mkt_yazz'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok((select count(*) from public.csr_programmes) = 12, who || ' reads every programme');
    perform pg_temp.ok(pg_temp.fails($q$insert into public.csr_programmes (name) values ('Harness Not Allowed')$q$, '42501'), who || ' cannot add programmes');
    update public.csr_programmes set name = 'Changed' where id = pg_temp.u('pr_lexta');
    delete from public.csr_programmes where id = pg_temp.u('pr_empty');
  end loop;
  perform pg_temp.owner();
  perform pg_temp.ok((select name from public.csr_programmes where id = pg_temp.u('pr_lexta')) = 'Harness Lexta Outreach'
    and exists (select 1 from public.csr_programmes where id = pg_temp.u('pr_empty')), 'only admin changes or deletes programmes');
  foreach who in array array['rep', 'care', 'hr', 'dist', 'norole', 'mkt_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(not exists (select 1 from public.csr_programmes), who || ' sees no programmes');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails('select * from public.csr_programmes', '42501'), 'website visitors read no programmes');
  perform pg_temp.owner();
  raise notice 'PASS: programmes: admin manages, management and marketing read, others see nothing';
end $$;

-- Activities ------------------------------------------------------------------------------------------------
do $$
declare
  a uuid;
  who text;
begin
  -- Marketing without brands: programmes with no brand only.
  perform pg_temp.login('mkt');
  a := pg_temp.log(pg_temp.u('pr_lexta'), current_date - 10, 'greater-accra', 'Mawuko Girls SHS', 120);
  perform pg_temp.ok((select created_by = pg_temp.u('mkt') and updated_by = pg_temp.u('mkt') and status = 'done'
    from public.csr_activities where id = a), 'marketing logs an activity; authors from the session');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', 10)$q$, pg_temp.u('pr_hooch')), '42501'),
    'marketing without the Hooch brand cannot log for a Hooch programme');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'nowhere', 'Nowhere', 10)$q$, pg_temp.u('pr_lexta')), '23514'),
    'a region is needed');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', -1)$q$, pg_temp.u('pr_lexta')), '23514'),
    'people reached is never negative');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date + 30, 'ashanti', 'Kumasi', 10, 'done')$q$, pg_temp.u('pr_lexta')), '23514'),
    'an activity in the future is planned, not done');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', 10, 'cancelled')$q$, pg_temp.u('pr_lexta')), '23514'),
    'status is planned or done');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', '  ', 10)$q$, pg_temp.u('pr_lexta')), '23514'),
    'a town or place is needed');
  perform pg_temp.log(pg_temp.u('pr_lexta'), current_date + 30, 'ashanti', 'Kumasi Planned', 300, 'planned');
  perform pg_temp.log(pg_temp.u('pr_lexta'), current_date - 400, 'ashanti', 'Kumasi Last Year', 50);
  perform pg_temp.ok(pg_temp.fails(format($q$insert into public.csr_activities (programme_id, activity_date, region_id, place, created_by) values (%L, current_date, %L, 'X', %L)$q$,
    pg_temp.u('pr_lexta'), pg_temp.region('ashanti'), pg_temp.u('admin')), '42501'), 'authors cannot be written');

  -- Marketing with Yazz: no brand programmes and Yazz ones, not Hooch.
  perform pg_temp.login('mkt_yazz');
  perform pg_temp.log((select id from public.csr_programmes where name like 'The Dignity Project%'), current_date - 5, 'volta', 'Ho Dignity Day', 400);
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', 10)$q$, pg_temp.u('pr_hooch')), '42501'),
    'marketing with Yazz cannot log for a Hooch programme');

  -- Admin: any programme, not a switched off one.
  perform pg_temp.login('admin');
  perform pg_temp.log(pg_temp.u('pr_hooch'), current_date - 3, 'ashanti', 'Kumasi Kitchens', 75);
  perform pg_temp.log(pg_temp.u('pr_off'), current_date - 2, 'greater-accra', 'Old Accra Event', 5);
  update public.csr_programmes set is_active = false where id = pg_temp.u('pr_off');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', 10)$q$, pg_temp.u('pr_off')), '23514'),
    'no new activities on a switched off programme');
  update public.csr_activities set notes = 'Still editable.' where place = 'Old Accra Event';
  perform pg_temp.ok((select notes from public.csr_activities where place = 'Old Accra Event') = 'Still editable.',
    'an activity of a switched off programme can still be changed');

  -- Changing.
  perform pg_temp.login('mkt');
  update public.csr_activities set people_reached = 130, notes = 'Recounted.' where place = 'Mawuko Girls SHS';
  perform pg_temp.ok((select people_reached = 130 and updated_by = pg_temp.u('mkt') from public.csr_activities where place = 'Mawuko Girls SHS'),
    'marketing changes an activity');
  update public.csr_activities set notes = 'Not mine.' where place = 'Kumasi Kitchens';
  perform pg_temp.ok(pg_temp.fails(format($q$update public.csr_activities set region_id = null where id = %L$q$, pg_temp.act('Mawuko Girls SHS')), '23514'),
    'the region cannot be cleared by a person');
  perform pg_temp.ok(pg_temp.fails(format($q$update public.csr_activities set programme_id = %L where id = %L$q$, pg_temp.u('pr_hooch'), pg_temp.act('Mawuko Girls SHS')), '42501'),
    'marketing cannot move an activity to a programme of a brand they do not work on');
  perform pg_temp.ok(pg_temp.fails(format($q$update public.csr_activities set programme_id = %L where id = %L$q$, pg_temp.u('pr_off'), pg_temp.act('Mawuko Girls SHS')), '23514'),
    'nor to a switched off programme');
  delete from public.csr_activities where place = 'Mawuko Girls SHS';
  perform pg_temp.ok(exists (select 1 from public.csr_activities where place = 'Mawuko Girls SHS'), 'marketing cannot delete activities');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.delete_csr_activity(%L)$q$, pg_temp.act('Mawuko Girls SHS')), '42501'),
    'delete_csr_activity tells marketing no');

  perform pg_temp.login('mgmt');
  update public.csr_activities set notes = 'Manager edit.' where place = 'Mawuko Girls SHS';
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', 10)$q$, pg_temp.u('pr_lexta')), '42501'),
    'management cannot log activities');
  delete from public.csr_activities;
  perform pg_temp.ok((select count(*) from public.csr_activities) = 6, 'management reads all six activities and deletes none');

  perform pg_temp.owner();
  perform pg_temp.ok((select notes = 'Recounted.' from public.csr_activities where place = 'Mawuko Girls SHS')
    and (select notes is null from public.csr_activities where place = 'Kumasi Kitchens'), 'refused changes left nothing behind');

  foreach who in array array['rep', 'care', 'hr', 'dist', 'norole', 'mkt_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(not exists (select 1 from public.csr_activities) and not exists (select 1 from public.csr_activity_list())
      and not exists (select 1 from public.csr_programme_totals()), who || ' sees no activities or totals');
    perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.log(%L, current_date, 'ashanti', 'Kumasi', 10)$q$, pg_temp.u('pr_lexta')), '42501'),
      who || ' cannot log activities');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails('select * from public.csr_activities', '42501') and pg_temp.fails('select * from public.csr_activity_photos', '42501')
    and pg_temp.fails('select * from public.csr_activity_list()', '42501') and pg_temp.fails('select * from public.csr_programme_totals()', '42501'),
    'website visitors read nothing');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into public.csr_activities (programme_id, activity_date, region_id, place) values (%L, current_date, %L, 'X')$q$,
    pg_temp.u('pr_lexta'), pg_temp.region('ashanti')), '42501'), 'website visitors write nothing');
  perform pg_temp.owner();
  raise notice 'PASS: activities: admin any, marketing by brand, management reads, others and anon nothing';
end $$;

-- List and totals ---------------------------------------------------------------------------------------------
do $$
declare t record;
begin
  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.csr_activity_list()) = 6, 'the list has every activity');
  perform pg_temp.ok((select programme_name = 'Harness Lexta Outreach' and region_name = 'Greater Accra' and created_by_name = 'Ama Marketing'
      and photo_count = 0 and total_count = 1
    from public.csr_activity_list(p_q => 'mawuko')), 'list row with names; search by place');
  perform pg_temp.ok((select count(*) from public.csr_activity_list(p_programme => pg_temp.u('pr_lexta'))) = 3, 'filter by programme');
  perform pg_temp.ok((select count(*) from public.csr_activity_list(p_region => pg_temp.region('ashanti'))) = 3, 'filter by region');
  perform pg_temp.ok((select count(*) from public.csr_activity_list(p_from => current_date - 30, p_to => current_date)) = 4, 'filter by dates');
  perform pg_temp.ok((select count(*) from public.csr_activity_list(p_status => 'planned')) = 1, 'filter by status');
  perform pg_temp.ok((select count(*) from public.csr_activity_list(p_limit => 2, p_offset => 4)) = 2, 'paging');

  -- All time: Lexta Outreach has two done (130 + 50) and one planned.
  select * into t from public.csr_programme_totals() where programme_id = pg_temp.u('pr_lexta');
  perform pg_temp.ok(t.activities_done = 2 and t.people_reached = 180 and t.last_activity_date = current_date - 10
    and t.activities_planned = 1 and t.next_planned_date = current_date + 30, 'all time totals; planned people are not counted');
  -- Last 30 days: one done, 130 people.
  select * into t from public.csr_programme_totals(p_from => current_date - 30, p_to => current_date) where programme_id = pg_temp.u('pr_lexta');
  perform pg_temp.ok(t.activities_done = 1 and t.people_reached = 130 and t.activities_planned = 0, 'totals for a date range');
  -- Ashanti only: Lexta has the old one (50) and the planned one; Hooch 75.
  perform pg_temp.ok((select people_reached from public.csr_programme_totals(p_region => pg_temp.region('ashanti')) where programme_id = pg_temp.u('pr_lexta')) = 50
    and (select people_reached from public.csr_programme_totals(p_region => pg_temp.region('ashanti')) where programme_id = pg_temp.u('pr_hooch')) = 75,
    'totals for a region');
  perform pg_temp.ok((select sum(people_reached) from public.csr_programme_totals()) = 130 + 50 + 400 + 75 + 5, 'grand total of people reached');
  perform pg_temp.ok((select activities_done = 0 and people_reached = 0 and last_activity_date is null
    from public.csr_programme_totals() where programme_id = pg_temp.u('pr_empty')), 'an active programme with nothing shows zeros');
  perform pg_temp.ok(exists (select 1 from public.csr_programme_totals() where programme_id = pg_temp.u('pr_off'))
    and not exists (select 1 from public.csr_programme_totals(p_region => pg_temp.region('ashanti')) where programme_id = pg_temp.u('pr_off')),
    'a switched off programme shows only when it has matching activities');
  perform pg_temp.ok((select count(*) from public.csr_programme_totals(p_programme => pg_temp.u('pr_hooch'))) = 1, 'totals for one programme');
  perform pg_temp.login('mkt');
  perform pg_temp.ok((select sum(people_reached) from public.csr_programme_totals()) = 660, 'marketing sees the same totals');
  perform pg_temp.ok(public.csr_person_name(pg_temp.u('mkt')) = 'Ama Marketing', 'a CSR author''s name is shown');
  perform pg_temp.ok(public.csr_person_name(pg_temp.u('hr')) is null and public.csr_person_name(pg_temp.u('mgmt')) is null,
    'names of people who authored nothing in CSR are not given out');
  perform pg_temp.owner();
  raise notice 'PASS: list filters and totals per programme (done only, date range, region, programme)';
end $$;

-- Photos and the bucket ------------------------------------------------------------------------------------
create function pg_temp.sig(photo uuid, act uuid, mime text, size integer, at bigint, prefix text default 'csr-photo.') returns text
language sql immutable as $$
  select encode(extensions.hmac(prefix || photo || '.' || act || '.' || mime || '.' || size || '.' || at,
    'harness-field-photo-secret-0123456789abcdef', 'sha256'), 'hex');
$$;
-- Rounded up, like the portal: the signature's time is never before the upload.
create function pg_temp.now_s() returns bigint language sql stable as $$ select ceil(extract(epoch from now()))::bigint; $$;
create function pg_temp.put(act uuid, photo uuid, ext text, mime text, size integer) returns void language sql as $$
  insert into storage.objects (bucket_id, name, owner, metadata)
  values ('csr-activity-photos', act || '/' || photo || '.' || ext, auth.uid(), jsonb_build_object('mimetype', mime, 'size', size));
$$;
create function pg_temp.rec(photo uuid, act uuid, mime text, size integer) returns boolean language sql as $$
  select public.record_csr_activity_photo(photo, act, mime, size, pg_temp.now_s(), pg_temp.sig(photo, act, mime, size, pg_temp.now_s()));
$$;
create function pg_temp.pid(n integer) returns uuid language sql immutable as $$
  select ('00000000-0000-0000-0000-0000000cb0' || lpad(n::text, 2, '0'))::uuid;
$$;

do $$
declare
  a uuid := pg_temp.act('Mawuko Girls SHS');
  k uuid := pg_temp.act('Kumasi Kitchens');
  p1 text := pg_temp.act('Mawuko Girls SHS') || '/' || pg_temp.u('ph1') || '.jpg';
  who text;
  n integer;
begin
  perform pg_temp.owner();
  perform pg_temp.ok(not has_table_privilege('authenticated', 'public.csr_activity_photos', 'insert'), 'people have no insert rights on photo records');

  perform pg_temp.login('mkt');
  perform pg_temp.put(a, pg_temp.u('ph1'), 'jpg', 'image/jpeg', 120000);
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 120000)$q$, pg_temp.u('ph1'), a), '55000'),
    'photos are refused until the portal photo secret is set up');
  perform pg_temp.owner();
  insert into private.field_photo_secret (secret) values ('harness-field-photo-secret-0123456789abcdef');

  perform pg_temp.login('mkt');
  perform pg_temp.ok(pg_temp.rec(pg_temp.u('ph1'), a, 'image/jpeg', 120000), 'the server records a checked photo');
  perform pg_temp.ok((select created_by = pg_temp.u('mkt') and storage_path = p1 from public.csr_activity_photos where id = pg_temp.u('ph1')),
    'the record has the uploader and the file''s path');
  perform pg_temp.ok(not pg_temp.rec(pg_temp.u('ph1'), a, 'image/jpeg', 120000), 'recording it again (a retry) adds nothing');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into public.csr_activity_photos (id, activity_id, storage_path, mime_type, size_bytes) values (%L, %L, %L, 'image/jpeg', 100)$q$,
    pg_temp.u('ph2'), a, a || '/' || pg_temp.u('ph2') || '.jpg'), '42501'), 'nobody inserts a photo record directly');

  perform pg_temp.put(a, pg_temp.u('ph2'), 'png', 'image/png', 2000);
  perform pg_temp.ok(pg_temp.fails(format($q$select public.record_csr_activity_photo(%L, %L, 'image/png', 2000, pg_temp.now_s(), repeat('a', 64))$q$,
    pg_temp.u('ph2'), a), '22023'), 'a made up signature is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.record_csr_activity_photo(%L, %L, 'image/png', 2000, pg_temp.now_s(), pg_temp.sig(%L, %L, 'image/png', 2000, pg_temp.now_s(), 'field-photo.'))$q$,
    pg_temp.u('ph2'), a, pg_temp.u('ph2'), a), '22023'), 'a field sales signature is not a CSR signature');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.record_csr_activity_photo(%L, %L, 'image/png', 2000, pg_temp.now_s() - 3600, pg_temp.sig(%L, %L, 'image/png', 2000, pg_temp.now_s() - 3600))$q$,
    pg_temp.u('ph2'), a, pg_temp.u('ph2'), a), '22023'), 'an old signature is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/png', 2001)$q$, pg_temp.u('ph2'), a), '23514'),
    'a size different from the file in Storage is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 2000)$q$, pg_temp.u('ph2'), a), '23514'),
    'a type different from the file in Storage is refused');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 100)$q$, pg_temp.u('ph3'), a), '23514'), 'no record without its file');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/gif', 100)$q$, pg_temp.u('ph3'), a), '22023'), 'only JPEG, PNG and WebP');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 100)$q$, pg_temp.u('ph3'), k), '42501'),
    'no record on an activity of a brand marketing does not work on');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 120000)$q$, pg_temp.u('ph1'), pg_temp.act('Kumasi Last Year')), '22023'),
    'a photo id cannot move to another activity');
  -- A file swapped in after the server signed: same path, size and type, but stored later than the signature.
  perform pg_temp.owner();
  update storage.objects set created_at = now() + interval '30 seconds' where name = a || '/' || pg_temp.u('ph2') || '.png';
  perform pg_temp.login('mkt');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/png', 2000)$q$, pg_temp.u('ph2'), a), '23514'),
    'a file stored after the signature (a swap) is refused');
  perform pg_temp.owner();
  update storage.objects set created_at = now() where name = a || '/' || pg_temp.u('ph2') || '.png';
  perform pg_temp.login('mkt');
  perform pg_temp.ok(pg_temp.rec(pg_temp.u('ph2'), a, 'image/png', 2000), 'with the right signature, size and type it is recorded');
  perform pg_temp.login('admin');
  perform pg_temp.put(a, pg_temp.u('ph3'), 'jpg', 'image/jpeg', 500);
  perform pg_temp.login('mkt');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 500)$q$, pg_temp.u('ph3'), a), '23514'),
    'nobody records a file someone else uploaded');

  -- Storage paths and who uploads.
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 1)$q$, k, pg_temp.u('phx')), '42501'),
    'marketing cannot upload to an activity of another brand');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into storage.objects (bucket_id, name) values ('csr-activity-photos', %L)$q$, a || '/photo.jpg'), '42501'),
    'only <activity>/<photo id>.<ext> paths');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'gif', 'image/gif', 1)$q$, a, pg_temp.u('phx')), '42501'), 'only jpg, png and webp names');
  perform pg_temp.ok((select photo_count from public.csr_activity_list() where id = a) = 2, 'the list counts recorded photos only');
  perform pg_temp.ok(pg_temp.fails(format($q$update public.csr_activity_photos set size_bytes = 1 where id = %L$q$, pg_temp.u('ph1')), '42501'), 'photos are never changed');

  -- Who reads and removes.
  perform pg_temp.login('mkt_yazz');
  perform pg_temp.ok((select count(*) from public.csr_activity_photos) = 2 and (select count(*) from storage.objects where bucket_id = 'csr-activity-photos') = 3,
    'other marketing staff read the photos');
  delete from storage.objects where name = p1;
  delete from public.csr_activity_photos where id = pg_temp.u('ph1');
  perform pg_temp.ok(exists (select 1 from storage.objects where name = p1) and exists (select 1 from public.csr_activity_photos where id = pg_temp.u('ph1')),
    'marketing cannot remove someone else''s photo');
  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.csr_activity_photos) = 2 and (select count(*) from storage.objects where bucket_id = 'csr-activity-photos') = 3,
    'management reads every photo');
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 1)$q$, a, pg_temp.u('phx')), '42501'), 'management cannot add photos');
  delete from storage.objects where name = p1;
  delete from public.csr_activity_photos where id = pg_temp.u('ph1');
  perform pg_temp.ok(exists (select 1 from storage.objects where name = p1) and exists (select 1 from public.csr_activity_photos where id = pg_temp.u('ph1')),
    'management cannot remove photos');
  foreach who in array array['rep', 'care', 'hr', 'dist', 'norole', 'mkt_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(not exists (select 1 from storage.objects where bucket_id = 'csr-activity-photos') and not exists (select 1 from public.csr_activity_photos),
      who || ' cannot read the photos');
    perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 1)$q$, a, pg_temp.u('phx'))), who || ' cannot upload');
    perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/png', 2000)$q$, pg_temp.u('ph2'), a)), who || ' cannot record photos');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(not exists (select 1 from storage.objects where bucket_id = 'csr-activity-photos'), 'website visitors cannot read the photo files');
  perform pg_temp.ok(pg_temp.fails(format($q$insert into storage.objects (bucket_id, name) values ('csr-activity-photos', %L)$q$, a || '/' || pg_temp.u('phx') || '.jpg')),
    'website visitors cannot upload');

  -- The uploader removes their own photo.
  perform pg_temp.login('mkt');
  delete from storage.objects where name = p1;
  delete from public.csr_activity_photos where id = pg_temp.u('ph1');
  perform pg_temp.ok(not exists (select 1 from storage.objects where name = p1) and not exists (select 1 from public.csr_activity_photos where id = pg_temp.u('ph1')),
    'the person who added a photo removes it');

  -- At most 20 photos an activity, and at most 25 files in its folder.
  for n in 1..19 loop
    perform pg_temp.put(a, pg_temp.pid(n), 'jpg', 'image/jpeg', 100 + n);
    perform pg_temp.rec(pg_temp.pid(n), a, 'image/jpeg', 100 + n);
  end loop;
  perform pg_temp.ok((select count(*) from public.csr_activity_photos where activity_id = a) = 20, 'twenty photos');
  perform pg_temp.put(a, pg_temp.pid(99), 'jpg', 'image/jpeg', 100);
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.rec(%L, %L, 'image/jpeg', 100)$q$, pg_temp.pid(99), a), '23514'), 'a twenty first photo is refused');
  -- 22 files now (20 recorded, the admin's and the 21st): three more fit, the twenty sixth does not.
  for n in 40..42 loop
    perform pg_temp.put(a, pg_temp.pid(n), 'jpg', 'image/jpeg', 100);
  end loop;
  perform pg_temp.ok(pg_temp.fails(format($q$select pg_temp.put(%L, %L, 'jpg', 'image/jpeg', 100)$q$, a, pg_temp.pid(43)), '42501'),
    'unrecorded files are capped at 25 an activity');

  perform pg_temp.login('admin');
  delete from storage.objects where name = a || '/' || pg_temp.pid(99) || '.jpg';
  perform pg_temp.ok(not exists (select 1 from storage.objects where name = a || '/' || pg_temp.pid(99) || '.jpg'), 'admin removes any photo file');
  delete from public.csr_activity_photos where id = pg_temp.pid(19);
  perform pg_temp.ok(not exists (select 1 from public.csr_activity_photos where id = pg_temp.pid(19)), 'admin removes any photo record');
  perform pg_temp.owner();
  raise notice 'PASS: photos: only server signed, size and type matched files are recorded; bucket rules; 20 photos and 25 files an activity';
end $$;

-- Deleting what activities point at ----------------------------------------------------------------------------
do $$
declare a uuid := pg_temp.act('Mawuko Girls SHS');
begin
  -- Admin deletes an activity: its photo records go with it.
  perform pg_temp.login('admin');
  perform public.delete_csr_activity(pg_temp.act('Old Accra Event'));
  perform pg_temp.ok(pg_temp.act('Old Accra Event') is null, 'admin deletes an activity');
  perform pg_temp.ok(pg_temp.fails(format($q$select public.delete_csr_activity(%L)$q$, pg_temp.u('phx')), '42501'), 'deleting a missing activity says so');

  -- A programme with activities cannot be deleted; an empty one can.
  perform pg_temp.ok(pg_temp.fails(format($q$delete from public.csr_programmes where id = %L$q$, pg_temp.u('pr_lexta')), '23503'),
    'a programme with activities cannot be deleted');
  insert into public.csr_programmes (name) values ('Harness Second Empty');
  delete from public.csr_programmes where id = pg_temp.u('pr_empty');
  perform pg_temp.ok(not exists (select 1 from public.csr_programmes where id = pg_temp.u('pr_empty')), 'an empty programme is deleted');
  update public.csr_activities set notes = 'Admin was here.' where id = a;
  perform pg_temp.owner();

  -- The marketer who logged activities and added photos.
  delete from auth.users where id = pg_temp.u('mkt');
  perform pg_temp.ok(not exists (select 1 from public.profiles where id = pg_temp.u('mkt')), 'the marketer is deleted');
  perform pg_temp.ok((select count(*) from public.csr_activities where place in ('Mawuko Girls SHS', 'Kumasi Planned', 'Kumasi Last Year') and created_by is null) = 3,
    'their activities stay, without author');
  perform pg_temp.ok((select people_reached = 130 and notes = 'Admin was here.' and updated_by = pg_temp.u('admin') from public.csr_activities where id = a),
    'nothing else about them changes');
  perform pg_temp.ok((select count(*) from public.csr_activity_photos where activity_id = a and created_by is null) = 19, 'their photos stay, without author');

  -- The admin who created programmes and last changed an activity.
  delete from auth.users where id = pg_temp.u('admin');
  perform pg_temp.ok((select updated_by is null from public.csr_activities where id = a)
    and (select created_by is null from public.csr_programmes where id = pg_temp.u('pr_lexta')), 'deleting the admin clears their links');

  -- A region and a brand.
  delete from public.regions where slug = 'ashanti';
  perform pg_temp.ok((select region_id is null and place = 'Kumasi Kitchens' and people_reached = 75 from public.csr_activities where place = 'Kumasi Kitchens'),
    'a deleted region leaves the activity with its town or place');
  insert into public.brands (slug, name) values ('csr-harness', 'Csr Harness Brand');
  update public.csr_programmes set brand_id = pg_temp.brand('csr-harness') where id = (select id from public.csr_programmes where name = 'Harness Second Empty');
  delete from public.brands where slug = 'csr-harness';
  perform pg_temp.ok((select brand_id is null from public.csr_programmes where id = (select id from public.csr_programmes where name = 'Harness Second Empty')), 'a deleted brand leaves the programme without a brand');
  perform pg_temp.ok((select count(*) from public.csr_activities) = 5, 'every other activity is still there');

  -- Totals still add up without the region.
  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select sum(people_reached) from public.csr_programme_totals()) = 130 + 50 + 400 + 75, 'totals still add up');
  perform pg_temp.owner();
  raise notice 'PASS: deleting people, regions, brands, activities and empty programmes never fails and keeps the records';
end $$;

-- Functions closed to website visitors.
do $$
declare f text;
begin
  foreach f in array array['csr_role()', 'csr_writer()', 'csr_may_write_programme(uuid)', 'csr_activity_can_see(uuid)', 'csr_activity_can_edit(uuid)',
                           'csr_activity_id_from_path(text)', 'csr_photo_room(uuid)', 'record_csr_activity_photo(uuid,uuid,text,integer,bigint,text)',
                           'csr_person_name(uuid)', 'csr_activity_list(uuid,uuid,date,date,text,text,integer,integer,uuid)',
                           'csr_programme_totals(date,date,uuid,uuid)', 'delete_csr_activity(uuid)'] loop
    perform pg_temp.ok(not has_function_privilege('anon', 'public.' || f, 'execute'), 'anon cannot run ' || f);
  end loop;
  foreach f in array array['set_csr_programme_authors()', 'check_csr_activity()', 'check_csr_activity_photo()'] loop
    perform pg_temp.ok(not has_function_privilege('authenticated', 'public.' || f, 'execute'), 'trigger function ' || f || ' is internal');
  end loop;
  -- csr_person_name answers only CSR roles.
  perform pg_temp.login('rep');
  perform pg_temp.ok(public.csr_person_name(pg_temp.u('mgmt')) is null, 'other roles get no names');
  perform pg_temp.owner();
  raise notice 'PASS: functions closed to website visitors; trigger functions closed to everyone';
end $$;

rollback;
