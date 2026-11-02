-- Complaints: case numbers, Row Level Security, privileges, status rules, files and the website intake function.
-- Run with: bash supabase/tests/local/run.sh complaints_rls
-- Everything happens inside one transaction that is rolled back at the end, except the two session case number
-- test, which commits in its own connections (year 2093) and removes what it made.

begin;

-- Nothing is seeded; the bucket is private ---------------------------------------------------------
do $$
begin
  if exists (select 1 from public.complaints) or exists (select 1 from public.complaint_events)
     or exists (select 1 from public.complaint_files) or exists (select 1 from public.complaint_case_counters) then
    raise exception 'FAIL: the complaints migration must not seed any records';
  end if;
  if not exists (select 1 from storage.buckets where id = 'complaint-files' and not public and file_size_limit = 10485760
                 and allowed_mime_types @> array['application/pdf', 'image/jpeg'] and not allowed_mime_types @> array['text/html']) then
    raise exception 'FAIL: complaint-files bucket must be private with size and type limits';
  end if;
  raise notice 'PASS: no complaints seeded; complaint-files bucket is private with size and type limits';
end $$;

-- Case numbers under concurrency (two real sessions) ------------------------------------------------
create extension if not exists dblink;
do $$
declare
  conn text := format('host=%s port=%s dbname=%s user=%s', split_part(current_setting('unix_socket_directories'), ',', 1),
                      current_setting('port'), current_database(), current_user);
  a_num text;
  b_num text;
  busy integer;
  insert_sql text := $q$
    with c as (insert into public.crm_contacts (full_name, phone) values ('Concurrency %s', '020 000 000%s') returning id)
    insert into public.complaints (brand_id, category, channel, description, contact_id, created_at)
    select (select id from public.brands where slug = 'yazz'), 'other', 'phone', 'Concurrency test %s', c.id,
           timestamptz '2093-06-01 10:00:00+00'
    from c returning case_number
  $q$;
  cleanup_sql text := $q$
    begin;
    delete from public.complaints where description like 'Concurrency test %';
    delete from public.crm_contacts where full_name like 'Concurrency %';
    delete from public.complaint_case_counters where year = 2093;
    commit;
  $q$;
begin
  perform dblink_connect('cx_a', conn);
  perform dblink_connect('cx_b', conn);
  begin
    perform dblink_exec('cx_a', 'begin');
    select t.n into a_num from dblink('cx_a', format(insert_sql, 'A', '1', 'A')) as t(n text);
    perform dblink_exec('cx_b', 'begin');
    perform dblink_send_query('cx_b', format(insert_sql, 'B', '2', 'B'));
    perform pg_sleep(0.5);
    busy := dblink_is_busy('cx_b');
    perform dblink_exec('cx_a', 'commit');
    select t.n into b_num from dblink_get_result('cx_b') as t(n text);
    perform 1 from dblink_get_result('cx_b') as t(n text);
    perform dblink_exec('cx_b', 'commit');
    perform dblink_exec('cx_a', cleanup_sql);
  exception when others then
    perform dblink_exec('cx_a', 'rollback') where dblink_is_busy('cx_a') = 0;
    perform dblink_disconnect('cx_b');
    perform dblink_exec('cx_a', cleanup_sql);
    perform dblink_disconnect('cx_a');
    raise;
  end;
  perform dblink_disconnect('cx_a');
  perform dblink_disconnect('cx_b');
  if busy <> 1 then raise exception 'FAIL: the second session did not wait for the first one''s case number'; end if;
  if a_num <> 'LX-2093-0001' or b_num <> 'LX-2093-0002' then
    raise exception 'FAIL: concurrent case numbers were % and %', a_num, b_num;
  end if;
  if exists (select 1 from public.complaint_case_counters where year = 2093) or exists (select 1 from public.crm_contacts where full_name like 'Concurrency %') then
    raise exception 'FAIL: the concurrency test left rows behind';
  end if;
  raise notice 'PASS: two sessions saving at once get LX-2093-0001 and LX-2093-0002 (the second waits for the first)';
end $$;

-- Fixtures (as the database owner) ---------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-000000000c01'
    when 'mgmt' then '00000000-0000-0000-0000-000000000c02'
    when 'care' then '00000000-0000-0000-0000-000000000c03'
    when 'care2' then '00000000-0000-0000-0000-000000000c04'
    when 'rep_yazz' then '00000000-0000-0000-0000-000000000c05'
    when 'mkt_hooch' then '00000000-0000-0000-0000-000000000c06'
    when 'dist' then '00000000-0000-0000-0000-000000000c07'
    when 'hr' then '00000000-0000-0000-0000-000000000c08'
    when 'norole' then '00000000-0000-0000-0000-000000000c09'
    when 'rep_lexta' then '00000000-0000-0000-0000-000000000c0a'
    when 'care_gone' then '00000000-0000-0000-0000-000000000c0b'
  end::uuid;
$$;

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),     'cx.admin@test.local',     '{"role":"admin"}',         '{"full_name":"Test Admin"}'),
  (pg_temp.u('mgmt'),      'cx.mgmt@test.local',      '{"role":"management"}',    '{}'),
  (pg_temp.u('care'),      'cx.care@test.local',      '{"role":"customer_care"}', '{"full_name":"Test Care One"}'),
  (pg_temp.u('care2'),     'cx.care2@test.local',     '{"role":"customer_care"}', '{"full_name":"Test Care Two"}'),
  (pg_temp.u('rep_yazz'),  'cx.rep.yazz@test.local',  '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('mkt_hooch'), 'cx.mkt.hooch@test.local', '{"role":"marketing"}',     '{}'),
  (pg_temp.u('dist'),      'cx.dist@test.local',      '{"role":"distributor"}',   '{}'),
  (pg_temp.u('hr'),        'cx.hr@test.local',        '{"role":"hr"}',            '{}'),
  (pg_temp.u('norole'),    'cx.norole@test.local',    '{}',                       '{}'),
  (pg_temp.u('rep_lexta'), 'cx.rep.lexta@test.local', '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('care_gone'), 'cx.gone@test.local',      '{"role":"customer_care"}', '{}');
update public.profiles set is_active = false where id = pg_temp.u('care_gone');

insert into public.profile_brands (profile_id, brand_id) select pg_temp.u('rep_yazz'), id from public.brands where slug = 'yazz';
insert into public.profile_brands (profile_id, brand_id) select pg_temp.u('mkt_hooch'), id from public.brands where slug = 'hooch';
insert into public.profile_brands (profile_id, brand_id) select pg_temp.u('rep_lexta'), id from public.brands where slug = 'lexta';

insert into public.products (id, brand_id, slug, name, is_published) values
  ('00000000-0000-0000-0000-000000000d01', (select id from public.brands where slug = 'yazz'),  'cx-test-paste', 'Test paste', true),
  ('00000000-0000-0000-0000-000000000d02', (select id from public.brands where slug = 'hooch'), 'cx-test-oil',   'Test oil',   true),
  ('00000000-0000-0000-0000-000000000d03', (select id from public.brands where slug = 'yazz'),  'cx-test-draft', 'Test draft', false);
insert into public.product_skus (id, product_id, sku_code, pack_size_label, is_active) values
  ('00000000-0000-0000-0000-000000000d11', '00000000-0000-0000-0000-000000000d01', 'CX-PASTE-100', '100 g', true),
  ('00000000-0000-0000-0000-000000000d12', '00000000-0000-0000-0000-000000000d02', 'CX-OIL-1L',    '1 litre', true),
  ('00000000-0000-0000-0000-000000000d13', '00000000-0000-0000-0000-000000000d01', 'CX-PASTE-OLD', '50 g', false);

insert into public.crm_organisations (id, name, kind) values ('00000000-0000-0000-0000-000000000e01', 'Test Complaint Org', 'retailer');
-- A staff typed contact, as customer care left it.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000c03';
insert into public.crm_contacts (id, full_name, email, phone, organisation_id, notes) values
  ('00000000-0000-0000-0000-000000000e11', 'Test Abena Staff Typed', 'abena@test.local', null, '00000000-0000-0000-0000-000000000e01', 'Prefers mornings'),
  ('00000000-0000-0000-0000-000000000e12', 'Test Yaw', null, '024 777 8888', null, null);
set local request.jwt.claim.sub = '';

create temp table ids as select
  (select id from public.brands where slug = 'yazz') as yazz,
  (select id from public.brands where slug = 'hooch') as hooch,
  (select id from public.brands where slug = 'lexta') as lexta,
  '00000000-0000-0000-0000-000000000d01'::uuid as paste,
  '00000000-0000-0000-0000-000000000d02'::uuid as oil,
  '00000000-0000-0000-0000-000000000d03'::uuid as draft,
  '00000000-0000-0000-0000-000000000d11'::uuid as paste_sku,
  '00000000-0000-0000-0000-000000000d12'::uuid as oil_sku,
  '00000000-0000-0000-0000-000000000e01'::uuid as org,
  '00000000-0000-0000-0000-000000000e11'::uuid as abena,
  '00000000-0000-0000-0000-000000000e12'::uuid as yaw,
  (select id from public.stockists limit 1) as stockist;
grant select on ids to anon, authenticated;

-- Case numbers made during the test, by label.
create temp table cases (label text primary key, id uuid not null);
grant select, insert on cases to authenticated;

-- Website visitors (anon) --------------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare t text;
begin
  foreach t in array array['complaints', 'complaint_events', 'complaint_files', 'complaint_case_counters'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon read %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  begin
    insert into public.complaints (brand_id, category, channel, description, contact_id)
    values ((select yazz from ids), 'other', 'website', 'x', (select abena from ids));
    raise exception 'FAIL: anon inserted a complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_complaint(null, '{}'::jsonb);
    raise exception 'FAIL: anon called save_complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_complaint_status(gen_random_uuid(), 'closed', null, 'x', null);
    raise exception 'FAIL: anon called set_complaint_status';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_complaint_owner(gen_random_uuid(), null);
    raise exception 'FAIL: anon called set_complaint_owner';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_complaint(gen_random_uuid());
    raise exception 'FAIL: anon called delete_complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.next_complaint_case_number(2026);
    raise exception 'FAIL: anon took a case number';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.complaint_can_see((select yazz from ids));
    raise exception 'FAIL: anon called a complaints helper';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.complaint_is_owner_candidate(pg_temp.u('care'));
    raise exception 'FAIL: anon probed complaint owners';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon cannot read or write complaints nor call complaint functions other than the intake';
end $$;
reset role;

-- Customer care creates complaints --------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000c03';
do $$
declare
  id1 uuid; id2 uuid; id3 uuid;
  c record;
  n int;
  before_abena jsonb := (select to_jsonb(x) - 'updated_at' from public.crm_contacts x where x.id = (select abena from ids));
begin
  -- A phone call from a new customer: the contact is created.
  id1 := public.save_complaint(null, jsonb_build_object(
    'brand_id', (select yazz from ids), 'product_id', (select paste from ids), 'sku_id', (select paste_sku from ids),
    'batch_number', 'B123', 'stockist_id', (select stockist from ids), 'purchase_date', (current_date - 3)::text,
    'category', 'packaging', 'severity', 'normal', 'channel', 'phone', 'description', 'Tube split in the box',
    'new_contact', jsonb_build_object('full_name', 'Test Caller New', 'phone', '+233 20 555 0101')));
  insert into cases values ('yazz_phone', id1);
  select * into c from public.complaints where id = id1;
  if c.case_number !~ ('^LX-' || extract(year from now() at time zone 'UTC')::int || '-[0-9]{4}$') then
    raise exception 'FAIL: case number % is not LX-<year>-NNNN', c.case_number;
  end if;
  if c.status <> 'new' or c.owner_id is not null or c.created_by <> pg_temp.u('care') or c.updated_by <> pg_temp.u('care') then
    raise exception 'FAIL: new complaint status, owner or authors wrong';
  end if;
  if c.response_due_at <> c.created_at + interval '2 days' or c.resolution_due_at <> c.created_at + interval '10 days' then
    raise exception 'FAIL: normal severity targets wrong';
  end if;
  if c.first_response_at is not null or c.resolved_at is not null or c.closed_at is not null then
    raise exception 'FAIL: new complaint has status times';
  end if;
  if not exists (select 1 from public.crm_contacts where id = c.contact_id and full_name = 'Test Caller New' and phone_key = '205550101') then
    raise exception 'FAIL: new contact not created';
  end if;
  if not exists (select 1 from public.complaint_events where complaint_id = id1 and type = 'status_change' and body like 'Case LX-% opened. Channel: Phone') then
    raise exception 'FAIL: opening entry missing from the timeline';
  end if;

  -- A walk in from a known customer (same email, different case): the existing contact is used and not changed.
  id2 := public.save_complaint(null, jsonb_build_object(
    'brand_id', (select hooch from ids), 'category', 'staff_service', 'severity', 'low', 'channel', 'walk_in',
    'description', 'Rude staff at the depot', 'owner_id', pg_temp.u('care'),
    'new_contact', jsonb_build_object('full_name', 'Someone Else', 'email', 'ABENA@test.local', 'phone', '020 111 1111')));
  insert into cases values ('hooch_walkin', id2);
  select * into c from public.complaints where id = id2;
  if c.contact_id <> (select abena from ids) then raise exception 'FAIL: existing contact not matched by email'; end if;
  if (select to_jsonb(x) - 'updated_at' from public.crm_contacts x where x.id = (select abena from ids)) <> before_abena then
    raise exception 'FAIL: staff create overwrote an existing contact';
  end if;
  if c.owner_id <> pg_temp.u('care') or c.response_due_at <> c.created_at + interval '3 days' or c.resolution_due_at <> c.created_at + interval '15 days' then
    raise exception 'FAIL: own owner or low targets wrong';
  end if;
  if not exists (select 1 from public.complaint_events where complaint_id = id2 and type = 'owner_change' and body = 'Assigned to Test Care One') then
    raise exception 'FAIL: owner on create not on the timeline';
  end if;

  -- Matched by phone, written differently.
  id3 := public.save_complaint(null, jsonb_build_object(
    'brand_id', (select lexta from ids), 'category', 'delivery', 'severity', 'critical', 'channel', 'email',
    'description', 'Corporate delivery missed', 'organisation_id', (select org from ids),
    'new_contact', jsonb_build_object('phone', '+233 (0)24 777 8888')));
  insert into cases values ('lexta_critical', id3);
  select * into c from public.complaints where id = id3;
  if c.contact_id <> (select yaw from ids) then raise exception 'FAIL: existing contact not matched by phone'; end if;
  if c.response_due_at <> c.created_at + interval '4 hours' or c.resolution_due_at <> c.created_at + interval '2 days' then
    raise exception 'FAIL: critical targets wrong';
  end if;

  -- Existing contact picked from the list.
  insert into cases values ('hooch_open', public.save_complaint(null, jsonb_build_object(
    'brand_id', (select hooch from ids), 'product_id', (select oil from ids), 'category', 'product_quality',
    'channel', 'social_media', 'description', 'Oil smells off', 'contact_id', (select yaw from ids))));

  -- Refusals.
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'channel', 'phone',
      'description', 'x', 'contact_id', (select yaw from ids), 'owner_id', pg_temp.u('care2')));
    raise exception 'FAIL: customer care assigned a new complaint to someone else';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'product_id', (select oil from ids),
      'category', 'other', 'channel', 'phone', 'description', 'x', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: a Hooch product was put on a Yazz complaint';
  exception when check_violation then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'product_id', (select paste from ids),
      'sku_id', (select oil_sku from ids), 'category', 'other', 'channel', 'phone', 'description', 'x', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: another product''s SKU was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'sku_id', (select paste_sku from ids),
      'category', 'other', 'channel', 'phone', 'description', 'x', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: a SKU without a product was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'purchase_date', (current_date + 5)::text,
      'category', 'other', 'channel', 'phone', 'description', 'x', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: a purchase date in the future was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'mystery', 'channel', 'phone',
      'description', 'x', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: an unknown category was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'channel', 'phone',
      'description', 'x', 'new_contact', jsonb_build_object('full_name', 'No way to reach')));
    raise exception 'FAIL: a new contact without phone or email was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'channel', 'phone',
      'description', '   ', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: an empty description was accepted';
  exception when check_violation then null;
  end;
  raise notice 'PASS: customer care logs complaints, contacts are found by email or phone without changes, targets follow severity';
end $$;
reset role;

-- Health or safety is at least high ---------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000c03';
do $$
declare id1 uuid; c record;
begin
  id1 := public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'health_safety', 'severity', 'low',
    'channel', 'phone', 'description', 'Rash after use', 'contact_id', (select yaw from ids)));
  insert into cases values ('yazz_health', id1);
  select * into c from public.complaints where id = id1;
  if c.severity <> 'high' or c.response_due_at <> c.created_at + interval '1 day' or c.resolution_due_at <> c.created_at + interval '5 days' then
    raise exception 'FAIL: health or safety complaint saved as % with wrong targets', c.severity;
  end if;
  update public.complaints set severity = 'normal' where id = id1;
  if (select severity from public.complaints where id = id1) <> 'high' then raise exception 'FAIL: health or safety lowered to normal'; end if;
  update public.complaints set severity = 'critical' where id = id1;
  if (select severity from public.complaints where id = id1) <> 'critical' then raise exception 'FAIL: health or safety could not go to critical'; end if;
  -- Changing another complaint to health or safety raises it too.
  update public.complaints set category = 'health_safety', severity = 'low' where id = (select id from cases where label = 'hooch_walkin');
  select * into c from public.complaints where id = (select id from cases where label = 'hooch_walkin');
  if c.severity <> 'high' or c.resolution_due_at <> c.created_at + interval '5 days' then raise exception 'FAIL: recategorised complaint not raised to high'; end if;
  update public.complaints set category = 'staff_service', severity = 'low' where id = (select id from cases where label = 'hooch_walkin');
  raise notice 'PASS: a health or safety concern is always high or critical, and targets follow';
end $$;
reset role;

-- Spoofing database set columns ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000c03';
do $$
declare col text; target uuid := (select id from cases where label = 'yazz_phone');
begin
  foreach col in array array['case_number', 'created_by', 'updated_by', 'created_at', 'closed_at', 'resolved_at',
                             'first_response_at', 'response_due_at', 'resolution_due_at', 'status', 'id'] loop
    begin
      execute format('insert into public.complaints (brand_id, category, channel, description, contact_id, %I) values ($1, ''other'', ''phone'', ''x'', $2, %s)',
        col, case when col in ('case_number', 'status') then '''LX-2000-0001''' when col like '%_by' or col = 'id' then 'gen_random_uuid()' else 'now()' end)
        using (select yazz from ids), (select yaw from ids);
      raise exception 'FAIL: customer care set % on insert', col;
    exception when insufficient_privilege then null;
    end;
  end loop;
  foreach col in array array['case_number', 'created_by', 'updated_by', 'created_at', 'closed_at', 'resolved_at',
                             'first_response_at', 'response_due_at', 'resolution_due_at', 'id'] loop
    begin
      execute format('update public.complaints set %I = %s where id = $1', col,
        case when col = 'case_number' then '''LX-2000-0001''' when col like '%_by' or col = 'id' then 'gen_random_uuid()' else 'now()' end)
        using target;
      raise exception 'FAIL: customer care changed %', col;
    exception when insufficient_privilege then null;
    end;
  end loop;
  begin
    insert into public.complaint_events (complaint_id, type, body, created_by) values (target, 'note', 'x', pg_temp.u('admin'));
    raise exception 'FAIL: an event author was set by hand';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.complaint_events set body = 'Changed' where complaint_id = target;
    raise exception 'FAIL: the timeline was edited';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: case number, authors, timestamps, targets and status times cannot be typed';
end $$;
reset role;

-- The database owner cannot spoof them either (only triggers set them).
set local request.jwt.claim.sub = '';
do $$
declare c record;
begin
  insert into public.complaints (brand_id, category, channel, description, contact_id, case_number, response_due_at,
                                 resolution_due_at, closed_at, first_response_at, created_by)
  values ((select yazz from ids), 'other', 'phone', 'Owner spoof', (select yaw from ids), 'LX-1999-0001', now() + interval '99 days',
          now() + interval '99 days', null, now(), pg_temp.u('admin'))
  returning * into c;
  if c.case_number = 'LX-1999-0001' or c.response_due_at <> c.created_at + interval '2 days' or c.first_response_at is not null
     or c.created_by is not null then
    raise exception 'FAIL: database set columns were taken from the insert';
  end if;
  begin
    insert into public.complaints (brand_id, category, channel, description, contact_id, status, resolution_summary, root_cause)
    values ((select yazz from ids), 'other', 'phone', 'Starts resolved', (select yaw from ids), 'resolved', 'x', 'y');
    raise exception 'FAIL: a complaint started as resolved';
  exception when check_violation then null;
  end;
  update public.complaints set case_number = 'LX-1999-0002' where id = c.id;
  if (select case_number from public.complaints where id = c.id) <> c.case_number then raise exception 'FAIL: case number changed'; end if;
  delete from public.complaints where id = c.id;
  raise notice 'PASS: case numbers and targets come from the database even for the database owner';
end $$;

-- Case numbers: many in a row, year rollover, more than 9999 -------------------------------------------
do $$
declare
  i int;
  nums text[] := '{}';
  c text;
  y int := extract(year from now() at time zone 'UTC')::int;
  first_n int;
begin
  for i in 1..40 loop
    insert into public.complaints (brand_id, category, channel, description, contact_id)
    values ((select yazz from ids), 'other', 'phone', 'Loop ' || i, (select yaw from ids)) returning case_number into c;
    nums := nums || c;
  end loop;
  if (select count(distinct x) from unnest(nums) x) <> 40 then raise exception 'FAIL: duplicate case numbers in a loop'; end if;
  first_n := split_part(nums[1], '-', 3)::int;
  if nums[40] <> 'LX-' || y || '-' || lpad((first_n + 39)::text, 4, '0') then raise exception 'FAIL: case numbers are not consecutive (% to %)', nums[1], nums[40]; end if;
  delete from public.complaints where description like 'Loop %';

  insert into public.complaints (brand_id, category, channel, description, contact_id, created_at)
  values ((select yazz from ids), 'other', 'phone', 'Year end', (select yaw from ids), timestamptz '2091-12-31 23:59:59+00') returning case_number into c;
  if c <> 'LX-2091-0001' then raise exception 'FAIL: first case of 2091 is %', c; end if;
  insert into public.complaints (brand_id, category, channel, description, contact_id, created_at)
  values ((select yazz from ids), 'other', 'phone', 'New year', (select yaw from ids), timestamptz '2092-01-01 00:00:00+00') returning case_number into c;
  if c <> 'LX-2092-0001' then raise exception 'FAIL: first case of 2092 is % (the count must start again each year)', c; end if;
  insert into public.complaints (brand_id, category, channel, description, contact_id, created_at)
  values ((select yazz from ids), 'other', 'phone', 'Late entry', (select yaw from ids), timestamptz '2091-12-31 12:00:00+00') returning case_number into c;
  if c <> 'LX-2091-0002' then raise exception 'FAIL: second case of 2091 is %', c; end if;

  insert into public.complaint_case_counters (year, last_number) values (2090, 9999);
  insert into public.complaints (brand_id, category, channel, description, contact_id, created_at)
  values ((select yazz from ids), 'other', 'phone', 'Big year', (select yaw from ids), timestamptz '2090-05-05 00:00:00+00') returning case_number into c;
  if c <> 'LX-2090-10000' then raise exception 'FAIL: the 10000th case is %', c; end if;
  begin
    insert into public.complaints (brand_id, category, channel, description, contact_id) select brand_id, category, channel, 'dup', contact_id
    from public.complaints where case_number = 'LX-2090-10000';
    update public.complaints set case_number = 'LX-2090-10000' where description = 'dup';
    if (select count(*) from public.complaints where case_number = 'LX-2090-10000') <> 1 then raise exception 'FAIL: duplicate case number'; end if;
  end;
  delete from public.complaints where description in ('Year end', 'New year', 'Late entry', 'Big year', 'dup');
  raise notice 'PASS: case numbers are consecutive and unique, start again each year and grow past 9999';
end $$;

-- Status flow ---------------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000c03';
do $$
declare id1 uuid := (select id from cases where label = 'yazz_phone'); c record;
begin
  begin
    perform public.set_complaint_status(id1, 'reopened', 'why', null, null);
    raise exception 'FAIL: a new complaint was reopened';
  exception when check_violation then null;
  end;
  perform public.set_complaint_status(id1, 'acknowledged', 'Called back', null, null);
  select * into c from public.complaints where id = id1;
  if c.status <> 'acknowledged' or c.first_response_at is null then raise exception 'FAIL: acknowledging did not record the first response'; end if;
  if not exists (select 1 from public.complaint_events where complaint_id = id1 and type = 'status_change'
                 and body = E'Status changed from New to Acknowledged\nNote: Called back' and created_by = pg_temp.u('care')) then
    raise exception 'FAIL: status change not on the timeline';
  end if;
  perform public.set_complaint_status(id1, 'investigating', null, null, null);
  if (select first_response_at from public.complaints where id = id1) <> c.first_response_at then raise exception 'FAIL: first response time moved'; end if;
  begin
    perform public.set_complaint_status(id1, 'new', null, null, null);
    raise exception 'FAIL: a complaint went back to new';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_status(id1, 'resolved', null, 'Replaced the tube', null);
    raise exception 'FAIL: resolved without a root cause';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_status(id1, 'resolved', null, null, 'Weak seal');
    raise exception 'FAIL: resolved without a resolution summary';
  exception when check_violation then null;
  end;
  perform public.set_complaint_status(id1, 'resolved', null, 'Replaced the tube', 'Weak seal on batch B123');
  select * into c from public.complaints where id = id1;
  if c.resolved_at is null or c.closed_at is not null then raise exception 'FAIL: resolved_at not set'; end if;
  perform public.set_complaint_status(id1, 'closed', null, null, null);
  select * into c from public.complaints where id = id1;
  if c.status <> 'closed' or c.closed_at is null or c.resolution_summary <> 'Replaced the tube' then raise exception 'FAIL: closing failed'; end if;
  begin
    perform public.save_complaint(id1, jsonb_build_object('brand_id', (select yazz from ids), 'product_id', 'keep', 'sku_id', 'keep',
      'category', 'packaging', 'channel', 'phone', 'description', 'Changed after closing'));
    raise exception 'FAIL: a closed complaint was edited';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_status(id1, 'investigating', null, null, null);
    raise exception 'FAIL: closed went to investigating';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_status(id1, 'reopened', '  ', null, null);
    raise exception 'FAIL: reopened without a reason';
  exception when check_violation then null;
  end;
  perform public.set_complaint_status(id1, 'reopened', 'Customer says the new tube leaks too', null, null);
  select * into c from public.complaints where id = id1;
  if c.closed_at is not null or c.resolved_at is not null or c.status <> 'reopened' then raise exception 'FAIL: reopening did not clear the close'; end if;
  if not exists (select 1 from public.complaint_events where complaint_id = id1 and type = 'status_change'
                 and body = E'Status changed from Closed to Reopened\nReason: Customer says the new tube leaks too') then
    raise exception 'FAIL: reopening not on the timeline with its reason';
  end if;
  -- The note does not leak into a later change in the same transaction.
  perform public.set_complaint_status(id1, 'investigating', null, null, null);
  if exists (select 1 from public.complaint_events where complaint_id = id1 and body like 'Status changed from Reopened to Investigating%Reason%') then
    raise exception 'FAIL: the reopen reason leaked into the next change';
  end if;
  -- Closing straight away needs a summary; on a reopened case the old one stays and may be replaced.
  begin
    perform public.set_complaint_status((select id from cases where label = 'hooch_open'), 'closed', null, null, null);
    raise exception 'FAIL: closed without a resolution summary';
  exception when check_violation then null;
  end;
  perform public.set_complaint_status((select id from cases where label = 'hooch_open'), 'closed', null, 'Duplicate of an earlier case', null);
  select * into c from public.complaints where id = (select id from cases where label = 'hooch_open');
  if c.resolved_at is null or c.closed_at is null or c.first_response_at is null then raise exception 'FAIL: closing from new did not set the times'; end if;
  begin
    perform public.set_complaint_status((select id from cases where label = 'hooch_open'), 'closed', null, 'again', null);
    raise exception 'FAIL: setting the same status did not raise';
  exception when insufficient_privilege then null;
  end;
  -- Owner may change on a closed case.
  perform public.set_complaint_owner((select id from cases where label = 'hooch_open'), pg_temp.u('care'));
  raise notice 'PASS: status flow, resolve and close fields, reopen with reason, first response time';
end $$;
reset role;

-- Owners ------------------------------------------------------------------------------------------
set local role authenticated;
do $$
declare id_lexta uuid := (select id from cases where label = 'lexta_critical'); id_walk uuid := (select id from cases where label = 'hooch_walkin');
begin
  -- Customer care takes an unassigned case, but cannot give it to others or take someone else's.
  perform set_config('request.jwt.claim.sub', pg_temp.u('care2')::text, true);
  begin
    perform public.set_complaint_owner(id_lexta, pg_temp.u('care'));
    raise exception 'FAIL: customer care assigned a case to someone else';
  exception when insufficient_privilege then null;
  end;
  perform public.set_complaint_owner(id_lexta, pg_temp.u('care2'));
  if not exists (select 1 from public.complaint_events where complaint_id = id_lexta and type = 'owner_change' and body = 'Assigned to Test Care Two') then
    raise exception 'FAIL: owner change not on the timeline';
  end if;
  begin
    perform public.set_complaint_owner(id_walk, pg_temp.u('care2'));
    raise exception 'FAIL: customer care took a case owned by someone else';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_complaint_owner(id_lexta, null);
    raise exception 'FAIL: customer care cleared an owner';
  exception when insufficient_privilege then null;
  end;

  -- Management reassigns, only to admin or customer care people, and changes nothing else.
  perform set_config('request.jwt.claim.sub', pg_temp.u('mgmt')::text, true);
  perform public.set_complaint_owner(id_lexta, pg_temp.u('care'));
  perform public.set_complaint_owner(id_lexta, pg_temp.u('admin'));
  perform public.set_complaint_owner(id_lexta, null);
  if not exists (select 1 from public.complaint_events where complaint_id = id_lexta and type = 'owner_change' and body = 'Owner cleared') then
    raise exception 'FAIL: clearing the owner not on the timeline';
  end if;
  begin
    perform public.set_complaint_owner(id_lexta, pg_temp.u('rep_yazz'));
    raise exception 'FAIL: a sales rep became a complaint owner';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_owner(id_lexta, pg_temp.u('mgmt'));
    raise exception 'FAIL: management became a complaint owner';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_owner(id_lexta, pg_temp.u('care_gone'));
    raise exception 'FAIL: an inactive person became a complaint owner';
  exception when check_violation then null;
  end;
  begin
    perform public.set_complaint_status(id_lexta, 'acknowledged', null, null, null);
    raise exception 'FAIL: management changed a status';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_complaint(id_lexta, jsonb_build_object('brand_id', (select lexta from ids), 'category', 'delivery', 'severity', 'low',
      'channel', 'email', 'description', 'Management edit', 'organisation_id', 'keep'));
    raise exception 'FAIL: management edited a complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select lexta from ids), 'category', 'delivery', 'channel', 'email',
      'description', 'Management create', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: management created a complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_complaint(id_lexta);
    raise exception 'FAIL: management deleted a complaint';
  exception when insufficient_privilege then null;
  end;
  insert into public.complaint_events (complaint_id, type, body) values (id_lexta, 'note', 'Management note');
  if (select count(*) from public.complaints) < 5 then raise exception 'FAIL: management does not read every complaint'; end if;
  raise notice 'PASS: owners are admin or customer care; care takes unassigned cases; management reassigns and notes only';
end $$;
reset role;

-- Sales reps and marketing: their brands, read and notes only -----------------------------------------
set local role authenticated;
do $$
declare n int; id_yazz uuid := (select id from cases where label = 'yazz_phone'); id_hooch uuid := (select id from cases where label = 'hooch_open');
begin
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_yazz')::text, true);
  if exists (select 1 from public.complaints c where c.brand_id <> (select yazz from ids)) then raise exception 'FAIL: Yazz rep sees another brand''s complaint'; end if;
  if not exists (select 1 from public.complaints where id = id_yazz) then raise exception 'FAIL: Yazz rep cannot see a Yazz complaint'; end if;
  if exists (select 1 from public.complaint_events where complaint_id = id_hooch) then raise exception 'FAIL: Yazz rep reads a Hooch timeline'; end if;
  if (select count(*) from public.complaint_events where complaint_id = id_yazz) = 0 then raise exception 'FAIL: Yazz rep cannot read the Yazz timeline'; end if;
  insert into public.complaint_events (complaint_id, type, body) values (id_yazz, 'note', 'Shop owner confirmed the batch');
  insert into public.complaint_events (complaint_id, type, body) values (id_yazz, 'call', 'Called the shop');
  begin
    insert into public.complaint_events (complaint_id, type, body) values (id_hooch, 'note', 'Peek');
    raise exception 'FAIL: Yazz rep added a note to a Hooch complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.complaint_events (complaint_id, type, body) values (id_yazz, 'status_change', 'Status changed from New to Closed');
    raise exception 'FAIL: a person wrote a status change entry';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.complaint_events (complaint_id, type, body) values (id_yazz, 'owner_change', 'Assigned to me');
    raise exception 'FAIL: a person wrote an owner change entry';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.complaint_events (complaint_id, type, body) values (id_yazz, 'attachment_added', 'File added: fake.pdf');
    raise exception 'FAIL: a person wrote an attachment entry';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_complaint_status(id_yazz, 'closed', null, 'Rep closes it', null);
    raise exception 'FAIL: a sales rep closed a complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_complaint(id_yazz, jsonb_build_object('brand_id', (select yazz from ids), 'product_id', 'keep', 'sku_id', 'keep',
      'category', 'packaging', 'channel', 'phone', 'description', 'Rep edit'));
    raise exception 'FAIL: a sales rep edited a complaint';
  exception when insufficient_privilege then null;
  end;
  update public.complaints set status = 'closed', resolution_summary = 'x' where id = id_yazz;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: a sales rep updated a complaint directly'; end if;
  begin
    perform public.set_complaint_owner(id_yazz, pg_temp.u('care'));
    raise exception 'FAIL: a sales rep assigned a complaint';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'channel', 'phone',
      'description', 'Rep create', 'contact_id', (select yaw from ids)));
    raise exception 'FAIL: a sales rep created a complaint';
  exception when insufficient_privilege then null;
  end;
  delete from public.complaint_events where complaint_id = id_yazz;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: a sales rep deleted timeline entries'; end if;

  perform set_config('request.jwt.claim.sub', pg_temp.u('mkt_hooch')::text, true);
  if exists (select 1 from public.complaints where brand_id <> (select hooch from ids)) then raise exception 'FAIL: Hooch marketing sees another brand'; end if;
  if (select count(*) from public.complaints) <> 2 then raise exception 'FAIL: Hooch marketing should see the 2 Hooch complaints'; end if;
  insert into public.complaint_events (complaint_id, type, body) values (id_hooch, 'note', 'Marketing note');
  begin
    perform public.set_complaint_status((select id from cases where label = 'hooch_walkin'), 'acknowledged', null, null, null);
    raise exception 'FAIL: marketing changed a status';
  exception when insufficient_privilege then null;
  end;

  -- The corporate brand is a brand like the others.
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_lexta')::text, true);
  if (select count(*) from public.complaints) <> 1 or not exists (select 1 from public.complaints where id = (select id from cases where label = 'lexta_critical')) then
    raise exception 'FAIL: the Lexta rep should see only the corporate complaint';
  end if;
  raise notice 'PASS: sales reps and marketing read their brands'' complaints and add notes, nothing more';
end $$;
reset role;

-- Distributor, HR and no role: nothing --------------------------------------------------------------
set local role authenticated;
do $$
declare who text; n int; t text;
begin
  foreach who in array array['dist', 'hr', 'norole'] loop
    perform set_config('request.jwt.claim.sub', pg_temp.u(who)::text, true);
    foreach t in array array['complaints', 'complaint_events', 'complaint_files'] loop
      execute format('select count(*) from public.%I', t) into n;
      if n <> 0 then raise exception 'FAIL: % sees % rows of %', who, n, t; end if;
    end loop;
    begin
      execute 'select count(*) from public.complaint_case_counters';
      raise exception 'FAIL: % read the case counters', who;
    exception when insufficient_privilege then null;
    end;
    if public.complaint_is_owner_candidate(pg_temp.u('care')) then raise exception 'FAIL: % can probe complaint owners', who; end if;
    begin
      perform public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'channel', 'phone',
        'description', 'Outsider', 'contact_id', (select yaw from ids)));
      raise exception 'FAIL: % created a complaint', who;
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.complaint_events (complaint_id, type, body) values ((select id from cases where label = 'yazz_phone'), 'note', 'x');
      raise exception 'FAIL: % added a note', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.set_complaint_status((select id from cases where label = 'yazz_health'), 'acknowledged', null, null, null);
      raise exception 'FAIL: % changed a status', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.set_complaint_owner((select id from cases where label = 'yazz_health'), pg_temp.u('care'));
      raise exception 'FAIL: % assigned a complaint', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.delete_complaint((select id from cases where label = 'yazz_health'));
      raise exception 'FAIL: % deleted a complaint', who;
    exception when insufficient_privilege then null;
    end;
  end loop;
  raise notice 'PASS: distributors, HR and people without a role see and change nothing';
end $$;
reset role;

-- Files ---------------------------------------------------------------------------------------------
set local role authenticated;
do $$
declare
  id_yazz uuid := (select id from cases where label = 'yazz_health');
  id_hooch uuid := (select id from cases where label = 'hooch_open');
  p_yazz text := (select id from cases where label = 'yazz_health')::text || '/1700000000-photo.jpg';
  p_hooch text := (select id from cases where label = 'hooch_open')::text || '/1700000000-receipt.pdf';
  n int;
begin
  -- Sales and marketing cannot upload.
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_yazz')::text, true);
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', p_yazz);
    raise exception 'FAIL: a sales rep uploaded a complaint file';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', pg_temp.u('care')::text, true);
  begin
    insert into public.complaint_files (complaint_id, storage_path, file_name, mime_type, size_bytes)
    values (id_yazz, p_yazz, 'photo.jpg', 'image/jpeg', 1000);
    raise exception 'FAIL: a file record was added before the file was uploaded';
  exception when insufficient_privilege then null;
  end;
  insert into storage.objects (bucket_id, name) values ('complaint-files', p_yazz), ('complaint-files', p_hooch);
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', 'not-a-case/evil.jpg');
    raise exception 'FAIL: a file was uploaded outside a complaint folder';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', gen_random_uuid()::text || '/orphan.jpg');
    raise exception 'FAIL: a file was uploaded for a complaint that does not exist';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', id_yazz::text || '/sub/dir.jpg');
    raise exception 'FAIL: a file was uploaded into a sub folder';
  exception when insufficient_privilege then null;
  end;
  update storage.objects set name = p_yazz || '.bak' where name = p_yazz;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care overwrote a complaint file'; end if;
  insert into public.complaint_files (complaint_id, storage_path, file_name, mime_type, size_bytes)
  values (id_yazz, p_yazz, 'photo.jpg', 'image/jpeg', 1000), (id_hooch, p_hooch, 'receipt.pdf', 'application/pdf', 2000);
  if not exists (select 1 from public.complaint_events where complaint_id = id_yazz and type = 'attachment_added' and body = 'File added: photo.jpg' and created_by = pg_temp.u('care')) then
    raise exception 'FAIL: upload not on the timeline';
  end if;
  begin
    insert into public.complaint_files (complaint_id, storage_path, file_name, mime_type, size_bytes)
    values (id_yazz, p_hooch, 'receipt.pdf', 'application/pdf', 2000);
    raise exception 'FAIL: a file record pointed at another complaint''s file';
  exception when check_violation then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', id_yazz::text || '/page.html');
    insert into public.complaint_files (complaint_id, storage_path, file_name, mime_type, size_bytes)
    values (id_yazz, id_yazz::text || '/page.html', 'page.html', 'text/html', 10);
    raise exception 'FAIL: an HTML file record was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', id_yazz::text || '/huge.pdf');
    insert into public.complaint_files (complaint_id, storage_path, file_name, mime_type, size_bytes)
    values (id_yazz, id_yazz::text || '/huge.pdf', 'huge.pdf', 'application/pdf', 10485761);
    raise exception 'FAIL: a file over 10 MB was accepted';
  exception when check_violation then null;
  end;
  delete from storage.objects where bucket_id = 'complaint-files';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care deleted complaint files'; end if;
  delete from public.complaint_files;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care deleted file records'; end if;

  -- Who reads which file.
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_yazz')::text, true);
  if not exists (select 1 from storage.objects where name = p_yazz) or exists (select 1 from storage.objects where name = p_hooch) then
    raise exception 'FAIL: Yazz rep file access wrong';
  end if;
  if (select count(*) from public.complaint_files) <> 1 then raise exception 'FAIL: Yazz rep file records wrong'; end if;
  perform set_config('request.jwt.claim.sub', pg_temp.u('mkt_hooch')::text, true);
  if exists (select 1 from storage.objects where name = p_yazz) or not exists (select 1 from storage.objects where name = p_hooch) then
    raise exception 'FAIL: Hooch marketing file access wrong';
  end if;
  perform set_config('request.jwt.claim.sub', pg_temp.u('mgmt')::text, true);
  if (select count(*) from storage.objects where bucket_id = 'complaint-files') <> 2 then raise exception 'FAIL: management cannot read complaint files'; end if;
  foreach p_hooch in array array['dist', 'hr', 'norole', 'rep_lexta'] loop
    perform set_config('request.jwt.claim.sub', pg_temp.u(p_hooch)::text, true);
    if exists (select 1 from storage.objects where bucket_id = 'complaint-files') then raise exception 'FAIL: % reads complaint files', p_hooch; end if;
  end loop;
  raise notice 'PASS: only admin and customer care upload; files are read only by people who see the complaint';
end $$;
reset role;

set local role anon;
set local request.jwt.claim.sub = '';
do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'complaint-files') then raise exception 'FAIL: anon reads complaint files'; end if;
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', (select id from cases where label = 'yazz_health')::text || '/anon.jpg');
    raise exception 'FAIL: anon uploaded a complaint file';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: website visitors cannot read or upload complaint files';
end $$;
reset role;

-- Admin deletes -------------------------------------------------------------------------------------
set local role authenticated;
do $$
declare id_del uuid; n int;
begin
  perform set_config('request.jwt.claim.sub', pg_temp.u('care')::text, true);
  id_del := public.save_complaint(null, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'channel', 'other',
    'description', 'Entered by mistake', 'contact_id', (select yaw from ids)));
  begin
    perform public.delete_complaint(id_del);
    raise exception 'FAIL: customer care deleted a complaint';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', pg_temp.u('admin')::text, true);
  perform public.save_complaint(id_del, jsonb_build_object('brand_id', (select yazz from ids), 'category', 'other', 'severity', 'high',
    'channel', 'other', 'description', 'Admin edit'));
  perform public.set_complaint_owner(id_del, pg_temp.u('care2'));
  perform public.delete_complaint(id_del);
  if exists (select 1 from public.complaint_events where complaint_id = id_del) then raise exception 'FAIL: deleting left timeline entries'; end if;
  delete from storage.objects where bucket_id = 'complaint-files' and name like (select id from cases where label = 'hooch_open')::text || '/%';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not remove a complaint file'; end if;
  delete from public.complaint_files where complaint_id = (select id from cases where label = 'hooch_open');
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not remove a file record'; end if;
  -- A contact with complaints cannot be deleted from under them.
  begin
    perform public.delete_crm_record('contact', (select yaw from ids));
    raise exception 'FAIL: a contact with complaints was deleted';
  exception when foreign_key_violation then null;
  end;
  raise notice 'PASS: only admin deletes complaints and files; contacts with complaints stay';
end $$;
reset role;

-- Website intake -------------------------------------------------------------------------------------
create temp table before_intake as select
  (select to_jsonb(x) - 'updated_at' from public.crm_contacts x where x.id = '00000000-0000-0000-0000-000000000e11') as abena,
  (select updated_by from public.crm_contacts where id = '00000000-0000-0000-0000-000000000e12') as yaw_updated_by,
  (select count(*) from public.crm_organisations) as orgs;
create temp table refs (label text primary key, ref text);
grant select, insert on refs to anon, authenticated;

set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare r text;
begin
  r := public.submit_complaint(jsonb_build_object('brand', 'yazz', 'name', 'Esi Visitor', 'email', 'Esi.Visitor@example.com',
    'phone', '+233 50 123 4567', 'category', 'foreign_object', 'message', E'Found a hair in the paste.\nVery upset.',
    'product', 'cx-test-paste', 'sku', 'CX-PASTE-100', 'batch_number', 'L2201', 'purchase_place', 'Shop near Kaneshie market',
    'purchase_date', (current_date - 10)::text));
  insert into refs values ('new_visitor', r);
  if r !~ ('^LX-' || extract(year from now() at time zone 'UTC')::int || '-[0-9]{4}$') then raise exception 'FAIL: intake returned %', r; end if;
  -- Known email (staff typed contact): matched, nothing overwritten, blank phone filled.
  insert into refs values ('abena', public.submit_complaint(jsonb_build_object('name', 'Hacker Name', 'email', 'ABENA@test.local',
    'phone', '020 999 9999', 'category', 'health_safety', 'message', 'Burning feeling')));
  -- Known phone, written another way.
  insert into refs values ('yaw', public.submit_complaint(jsonb_build_object('brand', 'hooch', 'name', 'Yaw Again', 'phone', '00233 24 777 8888',
    'category', 'availability', 'message', 'Never in stock')));
  raise notice 'PASS: website visitors can log a complaint and get only a case number back';
end $$;
reset role;

do $$
declare c record; ct record;
begin
  select * into c from public.complaints where case_number = (select ref from refs where label = 'new_visitor');
  if c.status <> 'new' or c.channel <> 'website' or c.owner_id is not null or c.created_by is not null or c.updated_by is not null
     or c.severity <> 'normal' or c.category <> 'foreign_object' or c.brand_id <> (select yazz from ids)
     or c.product_id <> (select paste from ids) or c.sku_id <> (select paste_sku from ids) or c.batch_number <> 'L2201'
     or c.purchase_place <> 'Shop near Kaneshie market' or c.stockist_id is not null or c.organisation_id is not null
     or c.purchase_date <> current_date - 10 or c.description <> E'Found a hair in the paste.\nVery upset.' then
    raise exception 'FAIL: intake complaint saved wrong: %', to_jsonb(c);
  end if;
  select * into ct from public.crm_contacts where id = c.contact_id;
  if ct.full_name <> 'Esi Visitor' or ct.email <> 'esi.visitor@example.com' or ct.organisation_id is not null or ct.owner_id is not null
     or ct.created_by is not null or ct.consent_marketing then
    raise exception 'FAIL: intake contact saved wrong';
  end if;

  select * into c from public.complaints where case_number = (select ref from refs where label = 'abena');
  if c.contact_id <> (select abena from ids) or c.severity <> 'high' or c.brand_id <> (select lexta from ids) then
    raise exception 'FAIL: intake did not match by email, raise health to high or default to the corporate brand';
  end if;
  select * into ct from public.crm_contacts where id = (select abena from ids);
  if ct.full_name <> 'Test Abena Staff Typed' or ct.notes <> 'Prefers mornings' or ct.organisation_id <> (select org from ids)
     or ct.email <> 'abena@test.local' then
    raise exception 'FAIL: intake overwrote staff typed contact fields';
  end if;
  if ct.phone <> '020 999 9999' then raise exception 'FAIL: intake did not fill the empty phone'; end if;
  if (to_jsonb(ct) - 'updated_at' - 'phone' - 'phone_key') <> ((select abena from before_intake) - 'phone' - 'phone_key') then
    raise exception 'FAIL: intake changed more than the empty phone';
  end if;

  select * into c from public.complaints where case_number = (select ref from refs where label = 'yaw');
  if c.contact_id <> (select yaw from ids) then raise exception 'FAIL: intake did not match by phone'; end if;
  if (select updated_by from public.crm_contacts where id = (select yaw from ids)) is distinct from (select yaw_updated_by from before_intake) then
    raise exception 'FAIL: intake blanked a contact''s updated_by';
  end if;
  if (select count(*) from public.crm_organisations) <> (select orgs from before_intake) then raise exception 'FAIL: intake made an organisation'; end if;
  if not exists (select 1 from public.crm_intake_log where form = 'complaint' and reference = (select ref from refs where label = 'yaw') and phone_key = '247778888') then
    raise exception 'FAIL: intake not in the shared intake log';
  end if;
  if not exists (select 1 from public.complaint_events e join public.complaints x on x.id = e.complaint_id
                 where x.case_number = (select ref from refs where label = 'yaw') and e.body like '%Channel: Website' and e.created_by is null) then
    raise exception 'FAIL: website complaint has no opening entry';
  end if;
  raise notice 'PASS: intake creates or matches contacts without overwriting, links no organisation, saves a new website complaint';
end $$;

set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare bad record; before_count int;
begin
  for bad in select * from (values
    ('unknown field', '{"name":"A","email":"a@b.co","category":"other","message":"m","owner_id":"x"}'::jsonb),
    ('status spoof', '{"name":"A","email":"a@b.co","category":"other","message":"m","status":"closed"}'),
    ('severity spoof', '{"name":"A","email":"a@b.co","category":"other","message":"m","severity":"low"}'),
    ('organisation', '{"name":"A","email":"a@b.co","category":"other","message":"m","organisation_name":"Big Co"}'),
    ('no name', '{"email":"a@b.co","category":"other","message":"m"}'),
    ('no contact', '{"name":"A","category":"other","message":"m"}'),
    ('bad email', '{"name":"A","email":"not an email","category":"other","message":"m"}'),
    ('bad phone', '{"name":"A","phone":"call me","category":"other","message":"m"}'),
    ('no category', '{"name":"A","email":"a@b.co","message":"m"}'),
    ('bad category', '{"name":"A","email":"a@b.co","category":"angry","message":"m"}'),
    ('no message', '{"name":"A","email":"a@b.co","category":"other"}'),
    ('bad brand', '{"name":"A","email":"a@b.co","category":"other","message":"m","brand":"acme"}'),
    ('other brand product', '{"name":"A","email":"a@b.co","category":"other","message":"m","brand":"yazz","product":"cx-test-oil"}'),
    ('unpublished product', '{"name":"A","email":"a@b.co","category":"other","message":"m","brand":"yazz","product":"cx-test-draft"}'),
    ('sku without product', '{"name":"A","email":"a@b.co","category":"other","message":"m","brand":"yazz","sku":"CX-PASTE-100"}'),
    ('inactive sku', '{"name":"A","email":"a@b.co","category":"other","message":"m","brand":"yazz","product":"cx-test-paste","sku":"CX-PASTE-OLD"}'),
    ('bad date', '{"name":"A","email":"a@b.co","category":"other","message":"m","purchase_date":"2026-02-30"}'),
    ('date words', '{"name":"A","email":"a@b.co","category":"other","message":"m","purchase_date":"yesterday"}'),
    ('old date', '{"name":"A","email":"a@b.co","category":"other","message":"m","purchase_date":"1999-12-31"}'),
    ('number name', '{"name":5,"email":"a@b.co","category":"other","message":"m"}'),
    ('array payload', '[]')
  ) as t(label, payload) loop
    begin
      perform public.submit_complaint(bad.payload);
      raise exception 'FAIL: intake accepted %', bad.label;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  begin
    perform public.submit_complaint(jsonb_build_object('name', 'A', 'email', 'a@b.co', 'category', 'other', 'message', 'm',
      'purchase_date', (current_date + 1)::text));
    raise exception 'FAIL: intake accepted a purchase date in the future';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.submit_complaint(jsonb_build_object('name', 'A', 'email', 'a@b.co', 'category', 'other', 'message', repeat('x', 3001)));
    raise exception 'FAIL: intake accepted a message over 3000 characters';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.submit_complaint(jsonb_build_object('name', 'A', 'email', 'a@b.co', 'category', 'other', 'message', 'm',
      'purchase_place', repeat('x', 201)));
    raise exception 'FAIL: intake accepted a long purchase place';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.submit_complaint(jsonb_build_object('name', 'A', 'email', 'a@b.co', 'category', 'other', 'message', repeat('€', 3000)));
    raise exception 'FAIL: intake accepted a payload over 8000 bytes';
  exception when invalid_parameter_value then null;
  end;
  raise notice 'PASS: intake refuses unknown or spoofed fields, missing or malformed fields, other brands'' or unpublished products, long fields and big payloads';
end $$;
reset role;

-- Honeypot: a case number shaped answer, nothing saved.
create temp table counts as select (select count(*) from public.complaints) as complaints, (select count(*) from public.crm_contacts) as contacts,
  (select count(*) from public.crm_intake_log) as log;
set local role anon;
do $$
declare r text;
begin
  r := public.submit_complaint(jsonb_build_object('name', 'Bot', 'email', 'bot@spam.test', 'category', 'other', 'message', 'Buy now', 'honeypot', 'x'));
  if r !~ '^LX-[0-9]{4}-[0-9]{4}$' then raise exception 'FAIL: honeypot answer % does not look like a case number', r; end if;
end $$;
reset role;
do $$
begin
  if (select count(*) from public.complaints) <> (select complaints from counts) or (select count(*) from public.crm_contacts) <> (select contacts from counts)
     or (select count(*) from public.crm_intake_log) <> (select log from counts) then
    raise exception 'FAIL: the honeypot saved something';
  end if;
  raise notice 'PASS: a filled honeypot gets a case number shaped answer and nothing is saved';
end $$;

-- Rate limit, shared with the other website forms.
set local role anon;
do $$
declare i int;
begin
  for i in 1..3 loop
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Flood', 'email', 'cx.flood@test.local', 'message', 'Enquiry ' || i));
  end loop;
  for i in 1..2 loop
    perform public.submit_complaint(jsonb_build_object('name', 'Flood', 'email', 'cx.flood@test.local', 'category', 'other', 'message', 'Complaint ' || i));
  end loop;
  begin
    perform public.submit_complaint(jsonb_build_object('name', 'Flood', 'email', 'CX.FLOOD@test.local', 'category', 'other', 'message', 'Sixth'));
    raise exception 'FAIL: a sixth submission in an hour was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  for i in 1..5 loop
    perform public.submit_complaint(jsonb_build_object('name', 'Phone flood', 'phone', '+233 27 999 0000', 'email', 'cxp' || i || '@flood.test',
      'category', 'other', 'message', 'm'));
  end loop;
  begin
    perform public.submit_complaint(jsonb_build_object('name', 'Phone flood', 'phone', '027 999 0000', 'email', 'cxp9@flood.test', 'category', 'other', 'message', 'm'));
    raise exception 'FAIL: a sixth submission from one phone was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  raise notice 'PASS: at most 5 website submissions per email or phone per hour, complaints and enquiries counted together';
end $$;
reset role;

do $$
begin
  if not exists (select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid() and classid = 61)
     or not exists (select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid() and classid = 62) then
    raise exception 'FAIL: the intake did not lock the email and phone before counting';
  end if;
  raise notice 'PASS: the complaint intake takes the same advisory locks as the enquiry intake';
end $$;

-- Website complaints appear for the right people.
set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_yazz')::text, true);
  if not exists (select 1 from public.complaints where case_number = (select ref from refs where label = 'new_visitor')) then
    raise exception 'FAIL: Yazz rep cannot see a Yazz website complaint';
  end if;
  if exists (select 1 from public.complaints where case_number = (select ref from refs where label = 'yaw')) then
    raise exception 'FAIL: Yazz rep sees a Hooch website complaint';
  end if;
  perform set_config('request.jwt.claim.sub', pg_temp.u('care')::text, true);
  if (select count(*) from public.complaints where channel = 'website') < 3 then raise exception 'FAIL: customer care cannot see website complaints'; end if;
  raise notice 'PASS: website complaints follow the brand rules';
end $$;
reset role;

rollback;
