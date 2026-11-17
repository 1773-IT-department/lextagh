-- Website complaint attachments (0027): signed one time upload tickets, the storage policy, the claim in
-- submit_complaint, staff visibility and the cleanup list.
-- Run with: bash supabase/tests/local/run.sh complaint_attachments
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Fixtures (as the database owner) ---------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-000000000a71'
    when 'care' then '00000000-0000-0000-0000-000000000a72'
    when 'rep_yazz' then '00000000-0000-0000-0000-000000000a73'
    when 'rep_hooch' then '00000000-0000-0000-0000-000000000a74'
    when 'hr' then '00000000-0000-0000-0000-000000000a75'
  end::uuid;
$$;

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),     'ca.admin@test.local',     '{"role":"admin"}',         '{"full_name":"Test Admin"}'),
  (pg_temp.u('care'),      'ca.care@test.local',      '{"role":"customer_care"}', '{"full_name":"Test Care"}'),
  (pg_temp.u('rep_yazz'),  'ca.rep.yazz@test.local',  '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('rep_hooch'), 'ca.rep.hooch@test.local', '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('hr'),        'ca.hr@test.local',        '{"role":"hr"}',            '{}');
insert into public.profile_brands (profile_id, brand_id) select pg_temp.u('rep_yazz'), id from public.brands where slug = 'yazz';
insert into public.profile_brands (profile_id, brand_id) select pg_temp.u('rep_hooch'), id from public.brands where slug = 'hooch';

-- The chat secret every website already has (a test value here). Uploads reuse it with their own "complaint-file:" text.
insert into private.chat_intake_secret (secret) values ('harness-chat-secret-0123456789abcdef0123');

create function pg_temp.sig(nonce uuid, ts bigint, ip text, mime text, size integer,
                            secret text default 'harness-chat-secret-0123456789abcdef0123') returns text
language sql immutable as $$
  select encode(extensions.hmac('complaint-file:' || nonce::text || '.' || ts::text || '.' || ip || '.' || mime || '.' || size::text,
                                secret, 'sha256'), 'hex');
$$;
-- What live chat signs with the same secret, to show it can never pass as an upload ticket.
create function pg_temp.chat_sig(nonce uuid, ts bigint, ip text) returns text language sql immutable as $$
  select encode(extensions.hmac('chat.' || nonce::text || '.' || ts::text || '.' || ip, 'harness-chat-secret-0123456789abcdef0123', 'sha256'), 'hex');
$$;
create function pg_temp.ip(tag text) returns text language sql immutable as $$ select md5(tag) || md5(tag || '2'); $$;
create function pg_temp.now_s() returns bigint language sql stable as $$ select extract(epoch from now())::bigint; $$;

create temp table t_paths (label text primary key, path text not null, nonce uuid not null);
grant select, insert, update on t_paths to anon, authenticated;
create temp table t_cases (label text primary key, case_number text not null);
grant select, insert on t_cases to anon, authenticated;

-- Shape and Row Level Security ----------------------------------------------------------------------------------------
do $$
begin
  if not (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'complaint_upload_tickets') then
    raise exception 'FAIL: complaint_upload_tickets has Row Level Security off';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'complaint_upload_tickets') then
    raise exception 'FAIL: complaint_upload_tickets must have no policies';
  end if;
  if has_table_privilege('anon', 'public.complaint_upload_tickets', 'select')
     or has_table_privilege('authenticated', 'public.complaint_upload_tickets', 'select') then
    raise exception 'FAIL: tickets are readable over the API';
  end if;
  if has_function_privilege('authenticated', 'public.begin_complaint_file_upload(uuid, bigint, text, text, integer, text, text)', 'execute')
     or not has_function_privilege('anon', 'public.begin_complaint_file_upload(uuid, bigint, text, text, integer, text, text)', 'execute') then
    raise exception 'FAIL: begin_complaint_file_upload grants';
  end if;
  if has_function_privilege('anon', 'public.unclaimed_website_complaint_files(interval)', 'execute') then
    raise exception 'FAIL: anon may list unclaimed uploads';
  end if;
  if (select file_size_limit from storage.buckets where id = 'complaint-files') <> 10485760 then
    raise exception 'FAIL: the complaint-files bucket limit changed';
  end if;
  raise notice 'PASS: tickets table has RLS on and no policies, no API reads; grants as designed; bucket unchanged';
end $$;

-- Website visitors (anon) ------------------------------------------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';

-- Without a ticket nothing goes into complaint-files.
do $$
begin
  begin
    insert into storage.objects (bucket_id, name, metadata)
    values ('complaint-files', gen_random_uuid() || '/photo.jpg', '{"size": 1000, "mimetype": "image/jpeg"}');
    raise exception 'FAIL: anon uploaded without a ticket';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: no ticket, no upload';
end $$;

-- A signed request gets a ticket for one cleaned path, at most 5 MB, JPG, PNG or PDF.
do $$
declare
  nonce uuid := gen_random_uuid();
  t bigint := pg_temp.now_s();
  ip text := pg_temp.ip('visitor-1');
  p text;
begin
  p := public.begin_complaint_file_upload(nonce, t, ip, 'image/jpeg', 2048, pg_temp.sig(nonce, t, ip, 'image/jpeg', 2048), '../Torn pack <front>!.JPEG');
  if p <> nonce || '/Torn-pack-front.jpg' then raise exception 'FAIL: ticket path was %', p; end if;
  insert into t_paths values ('good', p, nonce);

  -- Wrong size or wrong type for this ticket: Storage refuses it.
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', p, '{"size": 9000000, "mimetype": "image/jpeg"}');
    raise exception 'FAIL: oversize upload taken at a ticketed path';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', p, '{"size": 2048, "mimetype": "text/html"}');
    raise exception 'FAIL: wrong type taken at a ticketed path';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', nonce || '/other.jpg', '{"size": 2048, "mimetype": "image/jpeg"}');
    raise exception 'FAIL: second file in a ticketed folder';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('job-cvs', p, '{"size": 2048, "mimetype": "image/jpeg"}');
    raise exception 'FAIL: ticket used for another bucket';
  exception when insufficient_privilege then null;
  end;
  -- The right file goes in once.
  insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', p, '{"size": 2048, "mimetype": "image/jpeg"}');
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', p, '{"size": 2048, "mimetype": "image/jpeg"}');
    raise exception 'FAIL: second upload at the same path';
  exception when unique_violation then null;
  end;

  -- A reused nonce is refused.
  begin
    perform public.begin_complaint_file_upload(nonce, t, ip, 'image/jpeg', 2048, pg_temp.sig(nonce, t, ip, 'image/jpeg', 2048), 'again.jpg');
    raise exception 'FAIL: a nonce was reused';
  exception when sqlstate '22023' then
    if sqlerrm not like '%nonce%' then raise exception 'FAIL: reuse error was %', sqlerrm; end if;
  end;
  raise notice 'PASS: one ticket, one cleaned path, exact size and type only, once; a reused nonce is refused';
end $$;

-- Forged, tampered, replayed chat, stale, wrong type and oversize requests are refused.
do $$
declare
  n uuid := gen_random_uuid();
  t bigint := pg_temp.now_s();
  ip text := pg_temp.ip('attacker');
  bad record;
begin
  for bad in select * from (values
      ('other secret', n, t, ip, 'image/png', 100, pg_temp.sig(n, t, ip, 'image/png', 100, 'an-attacker-guess-that-is-long-enough-000'), 'signature'),
      ('chat signature replayed', n, t, ip, 'image/png', 100, pg_temp.chat_sig(n, t, ip), 'signature'),
      ('size changed after signing', n, t, ip, 'image/png', 5000, pg_temp.sig(n, t, ip, 'image/png', 100), 'signature'),
      ('type changed after signing', n, t, ip, 'application/pdf', 100, pg_temp.sig(n, t, ip, 'image/png', 100), 'signature'),
      ('other visitor', n, t, pg_temp.ip('someone'), 'image/png', 100, pg_temp.sig(n, t, ip, 'image/png', 100), 'signature'),
      ('not hex', n, t, ip, 'image/png', 100, 'nothex', 'signature'),
      ('stale', n, t - 400, ip, 'image/png', 100, pg_temp.sig(n, t - 400, ip, 'image/png', 100), 'issued_at'),
      ('future', n, t + 600, ip, 'image/png', 100, pg_temp.sig(n, t + 600, ip, 'image/png', 100), 'issued_at'),
      ('wrong type', n, t, ip, 'text/html', 100, pg_temp.sig(n, t, ip, 'text/html', 100), 'attachment_type'),
      ('webp not offered', n, t, ip, 'image/webp', 100, pg_temp.sig(n, t, ip, 'image/webp', 100), 'attachment_type'),
      ('oversize', n, t, ip, 'application/pdf', 5242881, pg_temp.sig(n, t, ip, 'application/pdf', 5242881), 'attachment_size'),
      ('empty', n, t, ip, 'application/pdf', 0, pg_temp.sig(n, t, ip, 'application/pdf', 0), 'attachment_size')
    ) as x(label, nonce, ts, ip, mime, size, sig, field) loop
    begin
      perform public.begin_complaint_file_upload(bad.nonce, bad.ts, bad.ip, bad.mime, bad.size, bad.sig, 'x.pdf');
      raise exception 'FAIL: accepted a bad request (%)', bad.label;
    exception when sqlstate '22023' then
      if sqlerrm not like '%' || bad.field || '%' then raise exception 'FAIL: % expected %, got %', bad.label, bad.field, sqlerrm; end if;
    end;
  end loop;
  -- Exactly 5 MB is fine.
  perform public.begin_complaint_file_upload(n, t, ip, 'application/pdf', 5242880, pg_temp.sig(n, t, ip, 'application/pdf', 5242880), 'receipt.pdf');
  raise notice 'PASS: forged, chat replayed, tampered, other visitor, stale, future, wrong type and oversize requests refused; 5 MB taken';
end $$;

-- Per visitor limit: 5 tickets an hour.
do $$
declare ip text := pg_temp.ip('busy'); n uuid; t bigint := pg_temp.now_s(); i int;
begin
  for i in 1..5 loop
    n := gen_random_uuid();
    perform public.begin_complaint_file_upload(n, t, ip, 'image/png', 10, pg_temp.sig(n, t, ip, 'image/png', 10), 'p.png');
  end loop;
  n := gen_random_uuid();
  begin
    perform public.begin_complaint_file_upload(n, t, ip, 'image/png', 10, pg_temp.sig(n, t, ip, 'image/png', 10), 'p.png');
    raise exception 'FAIL: sixth ticket in an hour';
  exception when sqlstate 'PT429' then null;
  end;
  raise notice 'PASS: 5 tickets an hour per visitor';
end $$;

-- Visitors never read, rename or delete files or tickets.
do $$
declare n int;
begin
  if exists (select 1 from storage.objects where bucket_id = 'complaint-files') then raise exception 'FAIL: anon reads complaint files'; end if;
  update storage.objects set name = name || '.bak' where bucket_id = 'complaint-files';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: anon renamed a complaint file'; end if;
  delete from storage.objects where bucket_id = 'complaint-files';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: anon deleted a complaint file'; end if;
  begin
    perform 1 from public.complaint_upload_tickets;
    raise exception 'FAIL: anon read tickets';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.unclaimed_website_complaint_files();
    raise exception 'FAIL: anon listed unclaimed uploads';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon cannot read, rename or delete complaint files, read tickets or list unclaimed uploads';
end $$;

-- The complaint claims the file -------------------------------------------------------------------------------------------
do $$
declare
  p text := (select path from t_paths where label = 'good');
  base jsonb := jsonb_build_object('brand', 'yazz', 'name', 'Test Attach Visitor', 'email', 'attach.visitor@test.local',
                                   'category', 'other', 'message', 'The pack was torn.');
  c text;
begin
  -- A path that is not a ticket, or not uploaded, is refused.
  begin
    perform public.submit_complaint(base || jsonb_build_object('attachment_path', gen_random_uuid() || '/x.jpg'));
    raise exception 'FAIL: claimed a path without a ticket';
  exception when sqlstate '22023' then
    if sqlerrm not like '%attachment%' then raise exception 'FAIL: got %', sqlerrm; end if;
  end;
  begin
    perform public.submit_complaint(base || jsonb_build_object('attachment_path', '../etc/passwd'));
    raise exception 'FAIL: claimed a path of the wrong shape';
  exception when sqlstate '22023' then null;
  end;
  c := public.submit_complaint(base || jsonb_build_object('attachment_path', p, 'attachment_name', 'Torn pack <front>!.JPEG'));
  if c !~ '^LX-[0-9]{4}-[0-9]{4}$' then raise exception 'FAIL: case number was %', c; end if;
  insert into t_cases values ('good', c);
  -- The same file cannot be claimed twice.
  begin
    perform public.submit_complaint(base || jsonb_build_object('attachment_path', p, 'email', 'second@test.local'));
    raise exception 'FAIL: a file was claimed twice';
  exception when sqlstate '22023' then null;
  end;
  -- Storage no longer takes anything at a claimed path.
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', split_part(p, '/', 1) || '/again.jpg', '{"size": 2048, "mimetype": "image/jpeg"}');
    raise exception 'FAIL: upload after the claim';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: submit_complaint claims a ticketed upload once; unknown and malformed paths refused';
end $$;
reset role;

do $$
declare
  c record;
  f record;
begin
  select * into c from public.complaints where case_number = (select case_number from t_cases where label = 'good');
  select * into f from public.complaint_files where complaint_id = c.id;
  if f.id is null then raise exception 'FAIL: no file record on the complaint'; end if;
  if f.storage_path <> (select path from t_paths where label = 'good') or c.id <> (select nonce from t_paths where label = 'good') then
    raise exception 'FAIL: the complaint id is not the ticket nonce';
  end if;
  if f.file_name <> 'Torn pack _front.jpg' or f.mime_type <> 'image/jpeg' or f.size_bytes <> 2048 or f.created_by is not null then
    raise exception 'FAIL: file record was % % % %', f.file_name, f.mime_type, f.size_bytes, f.created_by;
  end if;
  if not exists (select 1 from public.complaint_events e where e.complaint_id = c.id and e.type = 'attachment_added') then
    raise exception 'FAIL: no "File added" timeline entry';
  end if;
  if (select claimed_at from public.complaint_upload_tickets where id = c.id) is null then raise exception 'FAIL: ticket not claimed'; end if;
  raise notice 'PASS: the file is on the complaint like a staff file (record, timeline entry), ticket claimed';
end $$;

-- Wrong type or size in Storage (a browser that lied, or Storage not reporting at insert) is refused at the claim.
do $$
declare
  n uuid := gen_random_uuid();
  t bigint := pg_temp.now_s();
  ip text := pg_temp.ip('liar');
  p text;
begin
  p := public.begin_complaint_file_upload(n, t, ip, 'image/png', 4000, pg_temp.sig(n, t, ip, 'image/png', 4000), 'liar.png');
  -- As Storage itself would write it, skipping the policy (the metadata was not known at the policy check).
  insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', p, '{"size": 7000000, "mimetype": "image/png"}');
  begin
    perform public.submit_complaint(jsonb_build_object('brand', 'yazz', 'name', 'Liar', 'email', 'liar@test.local',
                                                       'category', 'other', 'message', 'x', 'attachment_path', p));
    raise exception 'FAIL: oversize stored file claimed';
  exception when sqlstate '22023' then
    if sqlerrm not like '%attachment%' then raise exception 'FAIL: got %', sqlerrm; end if;
  end;
  update storage.objects set metadata = '{"size": 4000, "mimetype": "text/html"}' where name = p;
  begin
    perform public.submit_complaint(jsonb_build_object('brand', 'yazz', 'name', 'Liar', 'email', 'liar@test.local',
                                                       'category', 'other', 'message', 'x', 'attachment_path', p));
    raise exception 'FAIL: wrong type stored file claimed';
  exception when sqlstate '22023' then null;
  end;
  -- An hour old ticket is too late.
  update storage.objects set metadata = '{"size": 4000, "mimetype": "image/png"}' where name = p;
  update public.complaint_upload_tickets set created_at = now() - interval '61 minutes' where id = n;
  begin
    perform public.submit_complaint(jsonb_build_object('brand', 'yazz', 'name', 'Liar', 'email', 'liar@test.local',
                                                       'category', 'other', 'message', 'x', 'attachment_path', p));
    raise exception 'FAIL: expired ticket claimed';
  exception when sqlstate '22023' then null;
  end;
  update storage.objects set created_at = now() - interval '2 hours' where name = p;
  insert into t_paths values ('unclaimed', p, n);
  -- An expired ticket no longer lets Storage take an upload.
  update public.complaint_upload_tickets set upload_by = now() - interval '1 second' where id = n;
  set local role anon;
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('complaint-files', n || '/late.png', '{"size": 4000, "mimetype": "image/png"}');
    raise exception 'FAIL: upload after the ticket expired';
  exception when insufficient_privilege then null;
  end;
  reset role;
  raise notice 'PASS: oversize or wrong type in Storage, and tickets over an hour old, are refused at the claim; expired tickets take no upload';
end $$;

-- Without the secret nothing is ticketed.
do $$
declare n uuid := gen_random_uuid(); t bigint := pg_temp.now_s(); ip text := pg_temp.ip('noset');
begin
  delete from private.chat_intake_secret;
  set local role anon;
  begin
    perform public.begin_complaint_file_upload(n, t, ip, 'image/png', 10, pg_temp.sig(n, t, ip, 'image/png', 10), 'p.png');
    raise exception 'FAIL: ticket without a secret';
  exception when sqlstate '55000' then null;
  end;
  reset role;
  insert into private.chat_intake_secret (secret) values ('harness-chat-secret-0123456789abcdef0123');
  raise notice 'PASS: no secret, no tickets (55000)';
end $$;

-- Staff ---------------------------------------------------------------------------------------------------------------------
set local role authenticated;
do $$
declare
  p text := (select path from t_paths where label = 'good');
  u text := (select path from t_paths where label = 'unclaimed');
  n int;
begin
  -- Customer care and a Yazz rep see the file; a Hooch rep and HR do not.
  perform set_config('request.jwt.claim.sub', pg_temp.u('care')::text, true);
  if not exists (select 1 from storage.objects where bucket_id = 'complaint-files' and name = p) then raise exception 'FAIL: care cannot read the file'; end if;
  if not exists (select 1 from public.complaint_files where storage_path = p) then raise exception 'FAIL: care cannot see the file record'; end if;
  if exists (select 1 from storage.objects where name = u) then raise exception 'FAIL: care sees an unclaimed upload'; end if;
  begin
    perform public.unclaimed_website_complaint_files();
    raise exception 'FAIL: care listed unclaimed uploads';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_yazz')::text, true);
  if not exists (select 1 from storage.objects where name = p) then raise exception 'FAIL: Yazz rep cannot read the Yazz complaint file'; end if;
  perform set_config('request.jwt.claim.sub', pg_temp.u('rep_hooch')::text, true);
  if exists (select 1 from storage.objects where name = p) then raise exception 'FAIL: Hooch rep reads a Yazz complaint file'; end if;
  perform set_config('request.jwt.claim.sub', pg_temp.u('hr')::text, true);
  if exists (select 1 from storage.objects where name = p) or exists (select 1 from public.complaint_files) then
    raise exception 'FAIL: HR sees complaint files';
  end if;

  -- Admin lists the unclaimed upload (and only that one) and removes it.
  perform set_config('request.jwt.claim.sub', pg_temp.u('admin')::text, true);
  if (select array_agg(name) from public.unclaimed_website_complaint_files()) is distinct from array[u] then
    raise exception 'FAIL: unclaimed list was %', (select array_agg(name) from public.unclaimed_website_complaint_files());
  end if;
  delete from storage.objects where bucket_id = 'complaint-files' and name = u;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not remove the unclaimed upload'; end if;
  raise notice 'PASS: staff see the website file like staff files (brand rules apply); only admin lists and removes unclaimed uploads';
end $$;
reset role;

rollback;
