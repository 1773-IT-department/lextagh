-- Recruitment: roles, applications, history, the job-cvs bucket, the website intake and the cleanup list.
-- Run with: bash supabase/tests/local/run.sh recruitment_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Seed and bucket --------------------------------------------------------------------------------------
do $$
begin
  if (select count(*) from public.job_openings) <> 12 or exists (select 1 from public.job_openings where status <> 'draft') then
    raise exception 'FAIL: the 12 prototype roles must be seeded as drafts';
  end if;
  if not exists (select 1 from public.job_openings where reference = 'LX-PRD-114' and title = 'Production Line Supervisor' and urgent
                 and opens_at = date '2026-09-02' and closes_at = date '2026-09-30' and employment_type = 'full_time'
                 and array_length(duties, 1) = 4 and array_length(requirements, 1) = 4) then
    raise exception 'FAIL: LX-PRD-114 was not seeded as in the prototype';
  end if;
  if (select string_agg(reference, ',' order by sort) from public.job_openings) <>
     'LX-PRD-114,LX-PRD-118,LX-QA-051,LX-SLS-207,LX-SLS-212,LX-MKT-088,LX-MKT-093,LX-SCM-039,LX-SCM-044,LX-FIN-072,LX-HR-021,LX-GRD-006' then
    raise exception 'FAIL: seeded roles are not in the prototype order';
  end if;
  if exists (select 1 from public.job_applications) or exists (select 1 from public.job_application_counters) then
    raise exception 'FAIL: no applications may be seeded';
  end if;
  if not exists (select 1 from storage.buckets where id = 'job-cvs' and not public and file_size_limit = 5242880
                 and allowed_mime_types @> array['application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                 and array_length(allowed_mime_types, 1) = 3) then
    raise exception 'FAIL: job-cvs must be private, 5 MB, PDF, DOC and DOCX only';
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename like 'job_%' and not rowsecurity) then
    raise exception 'FAIL: a recruitment table has Row Level Security off';
  end if;
  raise notice 'PASS: 12 prototype roles seeded as drafts in order, nothing else; job-cvs private with size and type limits; RLS on';
end $$;

-- Fixtures -----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-000000000f01'
    when 'mgmt' then '00000000-0000-0000-0000-000000000f02'
    when 'hr' then '00000000-0000-0000-0000-000000000f03'
    when 'hr2' then '00000000-0000-0000-0000-000000000f04'
    when 'rep' then '00000000-0000-0000-0000-000000000f05'
    when 'care' then '00000000-0000-0000-0000-000000000f06'
    when 'mkt' then '00000000-0000-0000-0000-000000000f07'
    when 'dist' then '00000000-0000-0000-0000-000000000f08'
    when 'norole' then '00000000-0000-0000-0000-000000000f09'
    when 'hr_gone' then '00000000-0000-0000-0000-000000000f0a'
  end::uuid;
$$;

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),   'rc.admin@test.local', '{"role":"admin"}',         '{"full_name":"Test Admin"}'),
  (pg_temp.u('mgmt'),    'rc.mgmt@test.local',  '{"role":"management"}',    '{}'),
  (pg_temp.u('hr'),      'rc.hr@test.local',    '{"role":"hr"}',            '{"full_name":"Test HR One"}'),
  (pg_temp.u('hr2'),     'rc.hr2@test.local',   '{"role":"hr"}',            '{"full_name":"Test HR Two"}'),
  (pg_temp.u('rep'),     'rc.rep@test.local',   '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('care'),    'rc.care@test.local',  '{"role":"customer_care"}', '{}'),
  (pg_temp.u('mkt'),     'rc.mkt@test.local',   '{"role":"marketing"}',     '{}'),
  (pg_temp.u('dist'),    'rc.dist@test.local',  '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),  'rc.norole@test.local','{}',                       '{}'),
  (pg_temp.u('hr_gone'), 'rc.gone@test.local',  '{"role":"hr"}',            '{}');
update public.profiles set is_active = false where id = pg_temp.u('hr_gone');

-- A CV as Storage would record it (as the database owner, for set up only).
create function pg_temp.put_cv(object_name text, size_bytes bigint default 120000, mime text default 'application/pdf',
                               age interval default interval '0') returns void language sql as $$
  insert into storage.objects (bucket_id, name, metadata, created_at)
  values ('job-cvs', object_name, jsonb_build_object('size', size_bytes, 'mimetype', mime), now() - age);
$$;

create function pg_temp.cv(tag text) returns text language sql immutable as $$
  select 'incoming/' || md5(tag)::uuid::text || '/cv.pdf';
$$;

-- Two live roles, one closing today, one draft, one closed, one past its closing date.
insert into public.job_openings (reference, title, department, location, employment_type, level, summary, duties, requirements,
                                 status, opens_at, closes_at, urgent, sort) values
  ('LX-TST-001', 'Test Live Role', 'Quality', 'Accra', 'full_time', 'Mid level', 'Live summary', array['Duty one'], array['Need one'],
   'open', public.ghana_today() - 3, public.ghana_today() + 20, true, 1),
  ('LX-TST-002', 'Test Closing Today', 'Sales', 'Kumasi', 'contract', 'Senior', 'Today summary', '{}', '{}',
   'open', public.ghana_today() - 10, public.ghana_today(), false, 2),
  ('LX-TST-003', 'Test Draft', 'Sales', 'Tema', 'internship', 'Graduate', 'Draft summary', '{}', '{}',
   'draft', null, null, false, 3),
  ('LX-TST-004', 'Test Closed', 'Sales', 'Tema', 'full_time', 'Senior', 'Closed summary', '{}', '{}',
   'closed', public.ghana_today() - 30, public.ghana_today() + 5, false, 4),
  ('LX-TST-006', 'Test Not Yet Open', 'Sales', 'Tema', 'full_time', 'Senior', 'Future summary', '{}', '{}',
   'open', public.ghana_today() + 2, null, false, 6);
-- Past its closing date while still marked open (what happens when nobody closes it): the trigger refuses to set
-- that up, so it is made with triggers off.
set local session_replication_role = replica;
insert into public.job_openings (reference, title, department, location, employment_type, level, summary, status, opens_at, closes_at)
values ('LX-TST-005', 'Test Expired', 'Sales', 'Tema', 'full_time', 'Senior', 'Expired summary', 'open',
        public.ghana_today() - 30, public.ghana_today() - 1);
set local session_replication_role = origin;

create temp table refs (label text primary key, ref text not null);
grant select, insert on refs to anon, authenticated;

-- Website visitors: roles -------------------------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare t text;
begin
  if (select string_agg(reference, ',' order by sort) from public.job_openings) <> 'LX-TST-001,LX-TST-002' then
    raise exception 'FAIL: anon sees roles %', (select string_agg(reference, ',' order by sort) from public.job_openings);
  end if;
  begin
    perform created_by from public.job_openings;
    raise exception 'FAIL: anon read created_by of a role';
  exception when insufficient_privilege then null;
  end;
  begin
    perform created_at from public.job_openings;
    raise exception 'FAIL: anon read created_at of a role';
  exception when insufficient_privilege then null;
  end;
  foreach t in array array['job_applications', 'job_application_events', 'job_application_counters'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon read %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  begin
    insert into public.job_openings (reference, title, department, location, employment_type, level, summary)
    values ('LX-BAD-001', 'Bad', 'X', 'Y', 'full_time', 'Z', 'S');
    raise exception 'FAIL: anon created a role';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.job_openings set title = 'Hacked';
    raise exception 'FAIL: anon updated a role';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.job_applications (reference, full_name, email, interest) values ('LX-APP-2026-9999', 'x', 'x@test.local', 'x');
    raise exception 'FAIL: anon inserted an application directly';
  exception when insufficient_privilege then null;
  end;
  foreach t in array array['select public.recruitment_staff_role()', 'select * from public.recruitment_staff()',
      'select * from public.unclaimed_job_cvs()', $q$select public.set_job_application_stage(gen_random_uuid(), 'hired', null)$q$,
      'select public.set_job_application_owner(gen_random_uuid(), null)', 'select public.next_job_application_reference(2026)',
      $q$select public.job_cv_unclaimed('x')$q$] loop
    begin
      execute t;
      raise exception 'FAIL: anon ran %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  raise notice 'PASS: anon reads only the public columns of live roles (open, opened, closing date not passed) and nothing else';
end $$;

-- Website visitors: CV uploads -----------------------------------------------------------------------------
do $$
declare n int;
begin
  insert into storage.objects (bucket_id, name, metadata) values ('job-cvs', pg_temp.cv('anon-ok'), '{"size": 1000, "mimetype": "application/pdf"}');
  insert into storage.objects (bucket_id, name, metadata)
  values ('job-cvs', 'incoming/' || gen_random_uuid() || '/My_CV-2026.DOCX', '{"size": 1000, "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}');
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', 'cvs/' || gen_random_uuid() || '/cv.pdf');
    raise exception 'FAIL: anon uploaded outside incoming/';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', 'incoming/' || gen_random_uuid() || '/cv.html');
    raise exception 'FAIL: anon uploaded an HTML file';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', 'incoming/' || gen_random_uuid() || '/sub/cv.pdf');
    raise exception 'FAIL: anon uploaded into a sub folder';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', 'incoming/not-a-uuid/cv.pdf');
    raise exception 'FAIL: anon uploaded into a folder that is not a uuid';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', 'incoming/' || gen_random_uuid() || '/../cv.pdf');
    raise exception 'FAIL: anon uploaded with a dotted path';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', replace(pg_temp.cv('anon-ok'), 'cv.pdf', 'second.pdf'));
    raise exception 'FAIL: anon uploaded a second file into a used folder';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('complaint-files', gen_random_uuid() || '/x.pdf');
    raise exception 'FAIL: anon uploaded to another bucket';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from storage.objects where bucket_id = 'job-cvs') then raise exception 'FAIL: anon lists or reads CVs'; end if;
  update storage.objects set name = name || '.bak' where bucket_id = 'job-cvs';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: anon renamed a CV'; end if;
  delete from storage.objects where bucket_id = 'job-cvs';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: anon deleted a CV'; end if;
  raise notice 'PASS: anon uploads only into a new incoming/<uuid>/ folder, only PDF, DOC or DOCX names; cannot list, read, rename or delete';
end $$;
reset role;

-- Upload caps: 20 unclaimed in an hour, 100 in a day, site wide.
do $$
declare i int;
begin
  -- Two are already there from anon above.
  for i in 1..17 loop perform pg_temp.put_cv(pg_temp.cv('cap-' || i)); end loop;
  set local role anon;
  insert into storage.objects (bucket_id, name) values ('job-cvs', pg_temp.cv('cap-20th'));
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', pg_temp.cv('cap-21st'));
    raise exception 'FAIL: a 21st unclaimed upload in an hour was allowed';
  exception when insufficient_privilege then null;
  end;
  reset role;
  -- Older than an hour: only the daily cap counts.
  update storage.objects set created_at = now() - interval '2 hours' where bucket_id = 'job-cvs';
  for i in 1..79 loop perform pg_temp.put_cv(pg_temp.cv('day-' || i), 1000, 'application/pdf', interval '3 hours'); end loop;
  set local role anon;
  insert into storage.objects (bucket_id, name) values ('job-cvs', pg_temp.cv('day-100th'));
  begin
    insert into storage.objects (bucket_id, name) values ('job-cvs', pg_temp.cv('day-101st'));
    raise exception 'FAIL: a 101st unclaimed upload in a day was allowed';
  exception when insufficient_privilege then null;
  end;
  reset role;
  delete from storage.objects where bucket_id = 'job-cvs';
  raise notice 'PASS: unclaimed uploads are capped at 20 an hour and 100 a day site wide';
end $$;

-- Website intake ------------------------------------------------------------------------------------------
do $$ begin perform pg_temp.put_cv(pg_temp.cv('ama'), 250000, 'application/pdf'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('kofi'), 90000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('esi'), 5242880, 'application/msword'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('big'), 5242881, 'application/pdf'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('html'), 1000, 'text/html'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('old'), 1000, 'application/pdf', interval '25 hours'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('zero'), 0, 'application/pdf'); end $$;
do $$ declare i int; begin for i in 1..7 loop perform pg_temp.put_cv(pg_temp.cv('rate-' || i)); end loop; end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('closed')); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('trap')); end $$;

set local role anon;
do $$
declare
  r text;
  base jsonb := jsonb_build_object('name', 'Ama Owusu', 'email', 'Ama.Owusu@Test.local', 'phone', '+233 24 111 2222',
                                   'message', 'I run a QA lab.', 'consent', true);
  bad record;
begin
  -- For a live role.
  r := public.submit_job_application(base || jsonb_build_object('opening', 'lx-tst-001', 'cv_path', pg_temp.cv('ama'), 'cv_name', 'Ama CV (final).pdf'));
  if r !~ ('^LX-APP-' || extract(year from now())::int || '-0001$') then raise exception 'FAIL: first reference was %', r; end if;
  insert into refs values ('ama', r);
  -- General application (no role), DOCX.
  r := public.submit_job_application(jsonb_build_object('name', 'Kofi Asante', 'email', 'kofi@test.local', 'interest', 'Quality assurance',
    'cv_path', pg_temp.cv('kofi'), 'consent', true));
  if r !~ '-0002$' then raise exception 'FAIL: second reference was %', r; end if;
  insert into refs values ('kofi', r);
  -- A role closing today still takes applications; exactly 5 MB is fine.
  r := public.submit_job_application(jsonb_build_object('name', 'Esi', 'email', 'esi@test.local', 'opening', 'LX-TST-002',
    'cv_path', pg_temp.cv('esi'), 'consent', true));
  insert into refs values ('esi', r);

  -- Refusals: (payload, field named in the error).
  for bad in select * from (values
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'opening', 'LX-TST-003', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'opening'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'opening', 'LX-TST-004', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'opening'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'opening', 'LX-TST-005', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'opening'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'opening', 'LX-TST-006', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'opening'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'opening', 'LX-NOPE-001', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'opening'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'interest'),
      (jsonb_build_object('email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'name'),
      (jsonb_build_object('name', 'X', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'email'),
      (jsonb_build_object('name', 'X', 'email', 'not an email', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'email'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'phone', 'call me', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'phone'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', false), 'consent'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', 'true'), 'consent'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed')), 'consent'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'consent', true), 'cv_path'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('missing'), 'consent', true), 'cv_path'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('ama'), 'consent', true), 'cv_path'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('old'), 'consent', true), 'cv_path'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', 'cvs/x/cv.pdf', 'consent', true), 'cv_path'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('big'), 'consent', true), 'cv_size'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('zero'), 'consent', true), 'cv_size'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('html'), 'consent', true), 'cv_type'),
      (jsonb_build_object('name', repeat('x', 121), 'email', 'x1@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'name'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'message', repeat('x', 3001), 'cv_path', pg_temp.cv('closed'), 'consent', true), 'message'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'stage', 'hired', 'cv_path', pg_temp.cv('closed'), 'consent', true), 'stage'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'owner_id', gen_random_uuid(), 'cv_path', pg_temp.cv('closed'), 'consent', true), 'owner_id'),
      (jsonb_build_object('name', 'X', 'email', 'x1@test.local', 'interest', 'Sales', 'message', repeat('😀', 2500), 'cv_path', pg_temp.cv('closed'), 'consent', true), 'payload')
    ) as t(p, field) loop
    begin
      perform public.submit_job_application(bad.p);
      raise exception 'FAIL: accepted a bad application (%)', bad.field;
    exception when sqlstate '22023' then
      if sqlerrm not like '%' || bad.field || '%' then raise exception 'FAIL: expected an error naming %, got %', bad.field, sqlerrm; end if;
    end;
  end loop;
  if (select count(*) from refs) <> 3 then raise exception 'FAIL: refused applications were counted'; end if;
  raise notice 'PASS: role and general applications get LX-APP references; closed, draft, expired, future and unknown roles, bad fields, missing consent and bad CVs are refused';
end $$;
reset role;

do $$
declare a record;
begin
  select * into a from public.job_applications where reference = (select ref from refs where label = 'ama');
  if a.email <> 'ama.owusu@test.local' or a.opening_reference_snapshot <> 'LX-TST-001' or a.opening_title_snapshot <> 'Test Live Role'
     or a.opening_id is null or a.stage <> 'new' or a.source <> 'website' or not a.consent_keep or a.consent_at is null
     or a.cv_path <> pg_temp.cv('ama') or a.cv_file_name <> 'Ama CV (final).pdf' or a.cv_size_bytes <> 250000
     or a.cv_mime_type <> 'application/pdf' or a.owner_id is not null or a.updated_by is not null then
    raise exception 'FAIL: the role application was not saved as sent: %', row_to_json(a);
  end if;
  select * into a from public.job_applications where reference = (select ref from refs where label = 'kofi');
  if a.opening_id is not null or a.interest <> 'Quality assurance' or a.cv_file_name <> 'cv.pdf'
     or a.cv_mime_type <> 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' then
    raise exception 'FAIL: the general application was not saved as sent: %', row_to_json(a);
  end if;
  if (select count(*) from public.job_application_events where type = 'received' and created_by is null) <> 3
     or not exists (select 1 from public.job_application_events e join public.job_applications j on j.id = e.application_id
                    where j.reference = (select ref from refs where label = 'ama') and e.note = 'Applied for Test Live Role (LX-TST-001)')
     or not exists (select 1 from public.job_application_events where note = 'General application: Quality assurance') then
    raise exception 'FAIL: received entries missing from the history';
  end if;
  raise notice 'PASS: applications saved with the claimed CV (size and type from Storage), consent time and a received entry';
end $$;

-- Honeypot and rate limits.
set local role anon;
do $$
declare r text; i int;
begin
  r := public.submit_job_application(jsonb_build_object('honeypot', 'http://spam', 'name', 'Bot', 'email', 'bot@test.local',
    'interest', 'x', 'cv_path', pg_temp.cv('trap'), 'consent', true));
  if r !~ '^LX-APP-[0-9]{4}-[0-9]{4}$' then raise exception 'FAIL: honeypot reference looks wrong: %', r; end if;
  -- Three per email in a day (Ama already has one; the email is matched in any case).
  r := public.submit_job_application(jsonb_build_object('name', 'Ama', 'email', 'AMA.OWUSU@test.local', 'phone', '0241112222', 'interest', 'Sales', 'cv_path', pg_temp.cv('rate-1'), 'consent', true));
  r := public.submit_job_application(jsonb_build_object('name', 'Ama', 'email', 'ama.owusu@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('rate-2'), 'consent', true));
  begin
    r := public.submit_job_application(jsonb_build_object('name', 'Ama', 'email', 'ama.owusu@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('rate-3'), 'consent', true));
    raise exception 'FAIL: a fourth application from one email in a day was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  -- Same phone number written another way, new email (two earlier applications gave this phone).
  r := public.submit_job_application(jsonb_build_object('name', 'Ama', 'email', 'ama.second@test.local', 'phone', '00233 (0)24 111 2222',
    'interest', 'Sales', 'cv_path', pg_temp.cv('rate-7'), 'consent', true));
  begin
    r := public.submit_job_application(jsonb_build_object('name', 'Ama', 'email', 'ama.other@test.local', 'phone', '024 111 2222',
      'interest', 'Sales', 'cv_path', pg_temp.cv('rate-4'), 'consent', true));
    raise exception 'FAIL: a fourth application from one phone number in a day was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  raise notice 'PASS: honeypot answers with an LX-APP reference; 3 applications per email or phone a day';
end $$;
reset role;

do $$
begin
  if exists (select 1 from public.job_applications where email = 'bot@test.local' or cv_path = pg_temp.cv('trap')) then
    raise exception 'FAIL: the honeypot saved something';
  end if;
  if (select count(*) from public.job_applications) <> 6 then raise exception 'FAIL: expected 6 applications, found %', (select count(*) from public.job_applications); end if;
  -- An application from a day ago no longer counts (created_at is fixed by a trigger, so triggers are off here).
  perform set_config('session_replication_role', 'replica', true);
  update public.job_applications set created_at = now() - interval '25 hours' where lower(email) = 'ama.owusu@test.local';
  perform set_config('session_replication_role', 'origin', true);
  set local role anon;
  perform public.submit_job_application(jsonb_build_object('name', 'Ama', 'email', 'ama.owusu@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('rate-5'), 'consent', true));
  reset role;
  perform set_config('session_replication_role', 'replica', true);
  update public.job_applications set created_at = now() where lower(email) = 'ama.owusu@test.local';
  perform set_config('session_replication_role', 'origin', true);
  begin
    update public.job_applications set created_at = now() - interval '1 year', reference = 'LX-APP-1999-0001' where lower(email) = 'ama.owusu@test.local';
    if exists (select 1 from public.job_applications where created_at < now() - interval '1 day' or reference like 'LX-APP-1999%') then
      raise exception 'FAIL: received time or reference changed';
    end if;
  end;
  raise notice 'PASS: the honeypot saved nothing; the daily limit rolls';
end $$;

-- Site wide: 200 an hour.
do $$
begin
  insert into public.job_applications (reference, full_name, email, interest)
  select 'LX-APP-2090-' || lpad(g::text, 4, '0'), 'Flood ' || g, 'flood' || g || '@test.local', 'x' from generate_series(1, 193) g;
  set local role anon;
  begin
    perform public.submit_job_application(jsonb_build_object('name', 'Late', 'email', 'late@test.local', 'interest', 'Sales', 'cv_path', pg_temp.cv('rate-6'), 'consent', true));
    raise exception 'FAIL: application 201 in an hour was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  reset role;
  delete from public.job_applications where reference like 'LX-APP-2090-%';
  raise notice 'PASS: at most 200 website applications an hour site wide';
end $$;

-- Signed in people cannot use the website intake.
do $$
begin
  if has_function_privilege('authenticated', 'public.submit_job_application(jsonb)', 'execute') then raise exception 'FAIL: authenticated may call the intake'; end if;
  if not has_function_privilege('anon', 'public.submit_job_application(jsonb)', 'execute') then raise exception 'FAIL: anon lost the intake'; end if;
end $$;

-- Staff ----------------------------------------------------------------------------------------------------
set local role authenticated;
do $$
declare
  who text;
  app_id uuid;
  n int;
  e record;
begin
  perform set_config('request.jwt.claim.sub', pg_temp.u('hr')::text, true);
  app_id := (select id from public.job_applications where reference = (select ref from refs where label = 'ama'));
  if app_id is null then raise exception 'FAIL: test set up: application not found'; end if;
  -- Outsiders see and change nothing.
  foreach who in array array['rep', 'care', 'mkt', 'dist', 'norole', 'hr_gone'] loop
    perform set_config('request.jwt.claim.sub', pg_temp.u(who)::text, true);
    if exists (select 1 from public.job_openings) or exists (select 1 from public.job_applications)
       or exists (select 1 from public.job_application_events) or exists (select 1 from storage.objects where bucket_id = 'job-cvs')
       or exists (select 1 from public.recruitment_staff()) then
      raise exception 'FAIL: % reads recruitment data', who;
    end if;
    update public.job_applications set staff_notes = 'x';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: % updated an application', who; end if;
    begin
      perform public.set_job_application_stage(app_id, 'hired', null);
      raise exception 'FAIL: % changed a stage', who;
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.job_openings (reference, title, department, location, employment_type, level, summary)
      values ('LX-BAD-002', 'Bad', 'X', 'Y', 'full_time', 'Z', 'S');
      raise exception 'FAIL: % created a role', who;
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.job_application_events (application_id, type, note) values (app_id, 'note', 'x');
      raise exception 'FAIL: % added a note', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform * from public.unclaimed_job_cvs();
      raise exception 'FAIL: % listed unclaimed CVs', who;
    exception when insufficient_privilege then null;
    end;
  end loop;

  -- HR works applications.
  perform set_config('request.jwt.claim.sub', pg_temp.u('hr')::text, true);
  if (select count(*) from public.job_applications) <> 7 or (select count(*) from public.job_openings) <> 18 then
    raise exception 'FAIL: hr does not see every role and application';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'job-cvs') < 6 then raise exception 'FAIL: hr cannot read CVs'; end if;
  if (select string_agg(display_name, ',' order by display_name) from public.recruitment_staff() where is_active) <> 'Test Admin,Test HR One,Test HR Two,rc.mgmt@test.local' then
    raise exception 'FAIL: recruitment staff list is %', (select string_agg(display_name, ',' order by display_name) from public.recruitment_staff());
  end if;
  perform public.set_job_application_stage(app_id, 'screening', 'Strong lab background');
  perform public.set_job_application_stage(app_id, 'shortlisted', null);
  select * into e from public.job_application_events where application_id = app_id and type = 'stage_change' and to_stage = 'screening';
  if e.from_stage <> 'new' or e.note <> 'Strong lab background' or e.created_by <> pg_temp.u('hr') then
    raise exception 'FAIL: stage change history wrong: %', row_to_json(e);
  end if;
  if exists (select 1 from public.job_application_events where application_id = app_id and to_stage = 'shortlisted' and note is not null) then
    raise exception 'FAIL: a note leaked into the next stage change';
  end if;
  begin
    perform public.set_job_application_stage(app_id, 'shortlisted', null);
    raise exception 'FAIL: moving to the same stage was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_job_application_stage(app_id, 'promoted', null);
    raise exception 'FAIL: an unknown stage was accepted';
  exception when check_violation then null;
  end;
  if (select stage from public.job_applications where id = app_id) <> 'shortlisted'
     or (select stage_changed_at from public.job_applications where id = app_id) is null
     or (select updated_by from public.job_applications where id = app_id) <> pg_temp.u('hr') then
    raise exception 'FAIL: stage not saved';
  end if;
  perform public.set_job_application_owner(app_id, pg_temp.u('hr2'));
  if not exists (select 1 from public.job_application_events where application_id = app_id and type = 'owner_change' and note = 'Assigned to Test HR Two') then
    raise exception 'FAIL: owner change not in the history';
  end if;
  foreach who in array array['rep', 'hr_gone', 'norole'] loop
    begin
      perform public.set_job_application_owner(app_id, pg_temp.u(who));
      raise exception 'FAIL: % was made owner', who;
    exception when check_violation then null;
    end;
  end loop;
  update public.job_applications set staff_notes = 'Call after 4pm' where id = app_id;
  insert into public.job_application_events (application_id, type, note) values (app_id, 'note', 'Phoned, left a message');
  if not exists (select 1 from public.job_application_events where note = 'Phoned, left a message' and created_by = pg_temp.u('hr')) then
    raise exception 'FAIL: note not saved with its author';
  end if;
  begin
    insert into public.job_application_events (application_id, type, from_stage, to_stage) values (app_id, 'stage_change', 'new', 'hired');
    raise exception 'FAIL: hr wrote a fake stage change';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.job_application_events (application_id, type, note) values (app_id, 'stage_change', 'x');
    raise exception 'FAIL: hr wrote a stage change entry';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.job_applications set email = 'changed@test.local' where id = app_id;
    raise exception 'FAIL: hr changed what the applicant sent';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.job_applications set reference = 'LX-APP-2026-9999' where id = app_id;
    raise exception 'FAIL: hr changed a reference';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.job_application_events set note = 'rewritten' where application_id = app_id;
    raise exception 'FAIL: hr rewrote the history';
  exception when insufficient_privilege then null;
  end;
  delete from public.job_applications where id = app_id;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: hr deleted an application'; end if;

  -- Management can do the same.
  perform set_config('request.jwt.claim.sub', pg_temp.u('mgmt')::text, true);
  perform public.set_job_application_stage(app_id, 'interview', 'Panel on Monday');
  perform public.set_job_application_owner(app_id, pg_temp.u('mgmt'));
  perform public.set_job_application_owner(app_id, null);
  if not exists (select 1 from public.job_application_events where application_id = app_id and note = 'Owner cleared') then
    raise exception 'FAIL: owner cleared not in the history';
  end if;
  raise notice 'PASS: hr and management read and work every application (stages with notes, owners, staff notes, notes); others nothing';
end $$;

-- Roles in the portal.
do $$
declare n int; rid uuid;
begin
  perform set_config('request.jwt.claim.sub', pg_temp.u('hr')::text, true);
  insert into public.job_openings (reference, title, department, location, employment_type, level, summary, duties, requirements)
  values (' lx-hr-001 ', '  HR Assistant ', 'Corporate', 'Accra', 'full_time', 'Entry level', 'Support HR.', array[' Keep files '], array['HND'])
  returning id into rid;
  if not exists (select 1 from public.job_openings where id = rid and reference = 'LX-HR-001' and title = 'HR Assistant' and status = 'draft'
                 and duties = array['Keep files'] and created_by = pg_temp.u('hr') and updated_by = pg_temp.u('hr')) then
    raise exception 'FAIL: new role not tidied and stamped';
  end if;
  begin
    update public.job_openings set status = 'open', closes_at = public.ghana_today() - 1 where id = rid;
    raise exception 'FAIL: opened a role with a closing date in the past';
  exception when check_violation then null;
  end;
  update public.job_openings set status = 'open', closes_at = public.ghana_today() + 14 where id = rid;
  if (select opens_at from public.job_openings where id = rid) <> public.ghana_today() then raise exception 'FAIL: opening did not set the opening date'; end if;
  -- A seeded draft with past dates cannot be opened until its dates are updated.
  begin
    update public.job_openings set status = 'open' where reference = 'LX-QA-051';
    raise exception 'FAIL: opened a seeded role whose closing date has passed';
  exception when check_violation then null;
  end;
  update public.job_openings set status = 'open', opens_at = public.ghana_today(), closes_at = null where reference = 'LX-QA-051';
  -- An open role past its date can still be edited (closing date unchanged), then closed.
  update public.job_openings set title = 'Test Expired (edited)' where reference = 'LX-TST-005';
  update public.job_openings set status = 'closed' where reference = 'LX-TST-005';
  begin
    insert into public.job_openings (reference, title, department, location, employment_type, level, summary)
    values ('HR-1', 'Bad ref', 'X', 'Y', 'full_time', 'Z', 'S');
    raise exception 'FAIL: accepted a malformed reference';
  exception when check_violation then null;
  end;
  begin
    insert into public.job_openings (reference, title, department, location, employment_type, level, summary, duties)
    values ('LX-HR-002', 'Bad duties', 'X', 'Y', 'full_time', 'Z', 'S', array['ok', '  ']);
    raise exception 'FAIL: accepted an empty duty';
  exception when check_violation then null;
  end;
  begin
    update public.job_openings set created_by = pg_temp.u('admin') where id = rid;
    raise exception 'FAIL: hr rewrote who created a role';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.job_openings where reference = 'LX-TST-001';
    raise exception 'FAIL: deleted a role that has applications';
  exception when foreign_key_violation then null;
  end;
  delete from public.job_openings where reference = 'LX-TST-003';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: hr could not delete a draft without applications'; end if;
  raise notice 'PASS: hr creates, edits, opens (closing date not past), closes and deletes roles; roles with applications stay';
end $$;
reset role;

set local role anon;
do $$
begin
  if (select string_agg(reference, ',' order by reference) from public.job_openings) <> 'LX-HR-001,LX-QA-051,LX-TST-001,LX-TST-002' then
    raise exception 'FAIL: after HR changes anon sees %', (select string_agg(reference, ',' order by reference) from public.job_openings);
  end if;
  raise notice 'PASS: website visitors see roles as soon as HR opens them, and no longer once closed';
end $$;
reset role;

-- CV files: who reads and removes, and the cleanup list.
do $$ begin perform pg_temp.put_cv(pg_temp.cv('stale-1'), 1000, 'application/pdf', interval '2 days'); end $$;
do $$ begin perform pg_temp.put_cv(pg_temp.cv('fresh-1'), 1000, 'application/pdf', interval '2 hours'); end $$;
update storage.objects set created_at = now() - interval '3 days' where name = pg_temp.cv('kofi');
set local role authenticated;
do $$
declare n int; listed text;
begin
  perform set_config('request.jwt.claim.sub', pg_temp.u('hr')::text, true);
  select string_agg(name, ',' order by name) into listed from public.unclaimed_job_cvs();
  -- stale-1 (2 days) and old (25 hours) are unclaimed and over a day old; kofi is claimed; fresh-1 is too new.
  if listed <> (select string_agg(x, ',' order by x) from unnest(array[pg_temp.cv('stale-1'), pg_temp.cv('old')]) x) then
    raise exception 'FAIL: cleanup list was %', listed;
  end if;
  if exists (select 1 from public.unclaimed_job_cvs(interval '1 minute') where name = pg_temp.cv('fresh-1')) then
    raise exception 'FAIL: the cleanup list went below a day';
  end if;
  delete from storage.objects where bucket_id = 'job-cvs' and name in (pg_temp.cv('kofi'), pg_temp.cv('fresh-1'));
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: hr removed a claimed or fresh CV'; end if;
  delete from storage.objects where bucket_id = 'job-cvs' and name = pg_temp.cv('stale-1');
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: hr could not remove an unclaimed CV over a day old'; end if;
  perform set_config('request.jwt.claim.sub', pg_temp.u('admin')::text, true);
  delete from storage.objects where bucket_id = 'job-cvs' and name = pg_temp.cv('kofi');
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not remove a CV'; end if;
  delete from public.job_applications where reference = (select ref from refs where label = 'kofi');
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not delete an application'; end if;
  raise notice 'PASS: staff list and remove unclaimed uploads over a day old; only admins remove claimed CVs and delete applications';
end $$;
reset role;

-- A deleted owner or author leaves an empty link, not an error.
do $$
begin
  delete from auth.users where id = pg_temp.u('hr2');
  delete from auth.users where id = pg_temp.u('hr');
  if exists (select 1 from public.job_openings where created_by is not null and created_by not in (select id from public.profiles)) then
    raise exception 'FAIL: dangling author';
  end if;
  raise notice 'PASS: deleting a staff login keeps roles, applications and history';
end $$;

rollback;

-- Staff work in a transaction of their own, as on Supabase (one request, one transaction). Postgres checks function
-- rights when a trigger's expressions are first prepared in a transaction, so a check that only ever runs after the
-- database owner has used the same triggers can miss a missing right. Set up and commit, act as hr alone, clean up.
begin;
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000e01', 'rc.fresh.hr@test.local', '{"role":"hr"}', '{"full_name":"Fresh HR"}');
insert into storage.objects (bucket_id, name, metadata)
values ('job-cvs', 'incoming/00000000-0000-0000-0000-000000000e02/fresh.pdf', '{"size": 2048, "mimetype": "application/pdf"}');
set local role anon;
create temp table if not exists fresh_ref as
  select public.submit_job_application('{"name":"Fresh Applicant","email":"fresh.applicant@test.local","interest":"Sales","consent":true,"cv_path":"incoming/00000000-0000-0000-0000-000000000e02/fresh.pdf"}') as ref;
reset role;
commit;

begin;
set local role authenticated;
do $$
declare
  app_id uuid;
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000e01', true);
  app_id := (select id from public.job_applications where email = 'fresh.applicant@test.local');
  if app_id is null then raise exception 'FAIL: fresh hr cannot see the application'; end if;
  update public.job_applications set staff_notes = 'First look' where id = app_id;
  perform public.set_job_application_stage(app_id, 'screening', 'Fresh transaction');
  perform public.set_job_application_owner(app_id, '00000000-0000-0000-0000-000000000e01');
  if (select stage || '|' || owner_id || '|' || staff_notes from public.job_applications where id = app_id)
     <> 'screening|00000000-0000-0000-0000-000000000e01|First look' then
    raise exception 'FAIL: fresh hr changes not saved';
  end if;
  raise notice 'PASS: hr changes notes, stage and owner in a transaction of their own';
end $$;
commit;

begin;
delete from public.job_applications where email = 'fresh.applicant@test.local';
delete from storage.objects where name = 'incoming/00000000-0000-0000-0000-000000000e02/fresh.pdf';
delete from auth.users where id = '00000000-0000-0000-0000-000000000e01';
drop table if exists fresh_ref;
commit;
