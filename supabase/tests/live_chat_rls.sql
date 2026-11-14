-- Live chat (item 22): tables, Row Level Security for every role, the website calls (signature, token, honeypot,
-- input limits, rate limits, circuit breaker) and the staff inbox (replies, notes, assign, close, reopen, leads and
-- complaints made from a chat).
-- Run with: bash supabase/tests/local/run.sh live_chat_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Tables and set up ---------------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_tables where (schemaname = 'public' and tablename like 'chat_%' or schemaname = 'private') and not rowsecurity) then
    raise exception 'FAIL: a chat table has Row Level Security off';
  end if;
  if (select count(*) from pg_tables where schemaname = 'public' and tablename like 'chat_%') <> 3 then
    raise exception 'FAIL: expected chat_conversations, chat_messages and chat_rate_events';
  end if;
  if exists (select 1 from private.chat_intake_secret) then raise exception 'FAIL: the chat secret must not be seeded'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name like 'chat_%'
             and column_name in ('token', 'ip', 'ip_address')) then
    raise exception 'FAIL: a chat table stores a raw token or address';
  end if;
  -- Every website function is security definer with an empty search path; staff functions are security invoker.
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname in ('chat_start', 'chat_send', 'chat_read')
               and (not p.prosecdef or not (p.proconfig @> array['search_path=""']))) then
    raise exception 'FAIL: a website chat function is not security definer with search_path empty';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname in ('chat_reply', 'chat_delete', 'chat_set_status', 'chat_assign', 'chat_save_visitor',
               'chat_create_lead', 'chat_create_complaint', 'chat_mark_read', 'chat_inbox_pulse', 'chat_transcript', 'chat_contact_for')
               and p.prosecdef) then
    raise exception 'FAIL: a staff chat function is security definer';
  end if;
  raise notice 'PASS: three chat tables and the private secret, RLS on all, no raw token or address columns, no secret seeded';
end $$;

create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-000000000c01'
    when 'mgmt' then '00000000-0000-0000-0000-000000000c02'
    when 'care' then '00000000-0000-0000-0000-000000000c03'
    when 'care2' then '00000000-0000-0000-0000-000000000c04'
    when 'rep' then '00000000-0000-0000-0000-000000000c05'
    when 'mkt' then '00000000-0000-0000-0000-000000000c06'
    when 'hr' then '00000000-0000-0000-0000-000000000c07'
    when 'dist' then '00000000-0000-0000-0000-000000000c08'
    when 'norole' then '00000000-0000-0000-0000-000000000c09'
    when 'care_gone' then '00000000-0000-0000-0000-000000000c0a'
  end::uuid;
$$;

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),     'lc.admin@test.local', '{"role":"admin"}',         '{"full_name":"Akua Admin"}'),
  (pg_temp.u('mgmt'),      'lc.mgmt@test.local',  '{"role":"management"}',    '{"full_name":"Kwesi Boss"}'),
  (pg_temp.u('care'),      'lc.care@test.local',  '{"role":"customer_care"}', '{"full_name":"Esi Mensah"}'),
  (pg_temp.u('care2'),     'lc.care2@test.local', '{"role":"customer_care"}', '{}'),
  (pg_temp.u('rep'),       'lc.rep@test.local',   '{"role":"sales_rep"}',     '{}'),
  (pg_temp.u('mkt'),       'lc.mkt@test.local',   '{"role":"marketing"}',     '{}'),
  (pg_temp.u('hr'),        'lc.hr@test.local',    '{"role":"hr"}',            '{}'),
  (pg_temp.u('dist'),      'lc.dist@test.local',  '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),    'lc.norole@test.local','{}',                       '{}'),
  (pg_temp.u('care_gone'), 'lc.gone@test.local',  '{"role":"customer_care"}', '{}');
update public.profiles set is_active = false where id = pg_temp.u('care_gone');

-- Signs in as someone (role authenticated with their id), or as a website visitor (anon), or back to the owner.
create function pg_temp.as_user(label text) returns void language plpgsql as $$
begin
  if label = 'owner' then
    reset role;
    perform set_config('request.jwt.claim.sub', '', true);
  elsif label = 'anon' then
    reset role;
    perform set_config('request.jwt.claim.sub', '', true);
    set local role anon;
  else
    reset role;
    perform set_config('request.jwt.claim.sub', pg_temp.u(label)::text, true);
    set local role authenticated;
  end if;
end;
$$;

-- What the website server signs: HMAC SHA-256 over "chat.<nonce>.<unix seconds>.<ip hash>" with the shared secret.
create function pg_temp.sig(nonce uuid, ts bigint, ip text, secret text default 'harness-chat-secret-0123456789abcdef0')
returns text language sql immutable as $$
  select encode(extensions.hmac('chat.' || nonce::text || '.' || ts::text || '.' || ip, secret, 'sha256'), 'hex');
$$;
create function pg_temp.ip(tag text) returns text language sql immutable as $$ select md5(tag) || md5(tag || '2'); $$;
create function pg_temp.now_s() returns bigint language sql stable as $$ select extract(epoch from now())::bigint; $$;

-- The three website calls, signed for a visitor address.
create function pg_temp.start(ip_tag text, payload jsonb) returns jsonb language plpgsql as $$
declare n uuid := gen_random_uuid(); t bigint := pg_temp.now_s();
begin
  return public.chat_start(n, t, pg_temp.ip(ip_tag), pg_temp.sig(n, t, pg_temp.ip(ip_tag)), payload);
end;
$$;
create function pg_temp.send(ip_tag text, conv uuid, token text, body text, n uuid default gen_random_uuid()) returns jsonb language plpgsql as $$
declare t bigint := pg_temp.now_s();
begin
  return public.chat_send(n, t, pg_temp.ip(ip_tag), pg_temp.sig(n, t, pg_temp.ip(ip_tag)), conv, token, body);
end;
$$;
create function pg_temp.read(ip_tag text, conv uuid, token text, after_seq bigint default 0) returns jsonb language plpgsql as $$
declare n uuid := gen_random_uuid(); t bigint := pg_temp.now_s();
begin
  return public.chat_read(n, t, pg_temp.ip(ip_tag), pg_temp.sig(n, t, pg_temp.ip(ip_tag)), conv, token, after_seq);
end;
$$;

-- Conversations made in this test, by label.
create temp table convs (label text primary key, id uuid not null, token text not null);
grant select, insert, update on convs to anon, authenticated;

-- Not set up yet --------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.start('a', '{"name":"Ama","message":"Hello"}');
    raise exception 'FAIL: chat started without a secret set up';
  exception when sqlstate '55000' then null;
  end;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: without the shared secret every website chat call is refused (55000)';
end $$;

-- The website server's shared secret, as Desmond sets it once (a test value here).
insert into private.chat_intake_secret (secret) values ('harness-chat-secret-0123456789abcdef0');

-- Website visitors: no table access, only the three signed calls --------------------------------------------
do $$
declare t text;
begin
  perform pg_temp.as_user('anon');
  foreach t in array array['chat_conversations', 'chat_messages', 'chat_rate_events'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon read %', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('delete from public.%I', t);
      raise exception 'FAIL: anon deleted from %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  begin
    insert into public.chat_conversations (reference, brand_id, token_hash, visitor_name)
    values ('LC-00000000', (select id from public.brands where slug = 'lexta'), repeat('a', 64), 'x');
    raise exception 'FAIL: anon inserted a conversation directly';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.chat_messages (conversation_id, sender, body) values (gen_random_uuid(), 'visitor', 'x');
    raise exception 'FAIL: anon inserted a message directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.chat_conversations set status = 'closed';
    raise exception 'FAIL: anon updated conversations';
  exception when insufficient_privilege then null;
  end;
  foreach t in array array['select public.chat_staff_role()', 'select * from public.chat_staff()',
      'select public.chat_inbox_pulse()', 'select public.chat_mark_read(gen_random_uuid())',
      $q$select public.chat_reply(gen_random_uuid(), 'x', false)$q$, $q$select public.chat_set_status(gen_random_uuid(), 'closed')$q$,
      'select public.chat_assign(gen_random_uuid(), null)', $q$select public.chat_save_visitor(gen_random_uuid(), 'x', null, null)$q$,
      'select public.chat_create_lead(gen_random_uuid())', 'select public.chat_delete(gen_random_uuid())', $q$select public.chat_create_complaint(gen_random_uuid(), 'other')$q$,
      'select public.chat_transcript(gen_random_uuid(), 100)', 'select public.chat_contact_for(gen_random_uuid())',
      'select public.chat_staff_first_name(gen_random_uuid())', 'select public.chat_is_agent(gen_random_uuid())',
      $q$select public.chat_check_request(gen_random_uuid(), 1, 'x', 'y')$q$, $q$select public.chat_check_limits('start', 'x', true)$q$, 'select public.chat_position(gen_random_uuid(), 1)',
      $q$select public.chat_conversation_for(gen_random_uuid(), 'x')$q$, $q$select public.chat_clean_body('x')$q$,
      'select count(*) from private.chat_intake_secret'] loop
    begin
      execute t;
      raise exception 'FAIL: anon ran %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: anon cannot read, write or delete any chat table and cannot run any staff or helper function';
end $$;

-- Signatures --------------------------------------------------------------------------------------------------
do $$
declare
  other uuid := gen_random_uuid();
  t bigint := pg_temp.now_s();
  bad record;
begin
  perform pg_temp.as_user('anon');
  for bad in select * from (values
      (pg_temp.sig(other, t, pg_temp.ip('v'), 'a-different-secret-that-is-long-enough'), t, pg_temp.ip('v'), 'signature'),
      (pg_temp.sig(other, t, pg_temp.ip('w')), t, pg_temp.ip('v'), 'signature'),
      (pg_temp.sig(other, t + 1, pg_temp.ip('v')), t, pg_temp.ip('v'), 'signature'),
      (encode(extensions.hmac(other::text || '.' || t::text || '.' || pg_temp.ip('v'), 'harness-chat-secret-0123456789abcdef0', 'sha256'), 'hex'), t, pg_temp.ip('v'), 'signature'),
      ('not-hex', t, pg_temp.ip('v'), 'signature'),
      (pg_temp.sig(other, t, 'raw 10.0.0.1'), t, 'raw 10.0.0.1', 'signature'),
      (pg_temp.sig(other, t - 400, pg_temp.ip('v')), t - 400, pg_temp.ip('v'), 'issued_at'),
      (pg_temp.sig(other, t + 600, pg_temp.ip('v')), t + 600, pg_temp.ip('v'), 'issued_at')
    ) as x(sig, ts, ip, field) loop
    begin
      perform public.chat_start(other, bad.ts, bad.ip, bad.sig, '{"name":"Ama","message":"Hello"}');
      raise exception 'FAIL: chat_start accepted a bad request (%)', bad.field;
    exception when sqlstate '22023' then
      if sqlerrm not like '%' || bad.field || '%' then raise exception 'FAIL: expected %, got %', bad.field, sqlerrm; end if;
    end;
    begin
      perform public.chat_read(other, bad.ts, bad.ip, bad.sig, gen_random_uuid(), repeat('a', 64), 0);
      raise exception 'FAIL: chat_read accepted a bad request (%)', bad.field;
    exception when sqlstate '22023' then null;
    end;
    begin
      perform public.chat_send(other, bad.ts, bad.ip, bad.sig, gen_random_uuid(), repeat('a', 64), 'x');
      raise exception 'FAIL: chat_send accepted a bad request (%)', bad.field;
    exception when sqlstate '22023' then null;
    end;
  end loop;
  perform pg_temp.as_user('owner');
  if exists (select 1 from public.chat_conversations) then raise exception 'FAIL: a refused call saved something'; end if;
  raise notice 'PASS: forged, tampered, unprefixed (recruitment style), stale and future signatures are refused on start, send and read';
end $$;

-- Starting a conversation, input checks and the honeypot --------------------------------------------------------
do $$
declare
  r jsonb;
  c record;
  bad record;
begin
  perform pg_temp.as_user('anon');
  r := pg_temp.start('visitor-1', jsonb_build_object('name', '  Ama Owusu ', 'email', 'Ama@Example.com', 'phone', '+233 24 555 0101',
                                                      'message', E'Hello,\r\nwhere can I buy Yazz in Kumasi?', 'page', '/our-brands', 'brand', 'lexta', 'honeypot', ''));
  if r ->> 'reference' !~ '^LC-[0-9A-F]{8}$' or r ->> 'token' !~ '^[0-9a-f]{64}$' or (r ->> 'conversation_id')::uuid is null then
    raise exception 'FAIL: chat_start returned %', r;
  end if;
  insert into convs values ('ama', (r ->> 'conversation_id')::uuid, r ->> 'token');
  perform pg_temp.as_user('owner');
  select * into c from public.chat_conversations where id = (select id from convs where label = 'ama');
  if c.visitor_name <> 'Ama Owusu' or c.visitor_email <> 'ama@example.com' or c.visitor_phone <> '+233 24 555 0101'
     or c.start_page <> '/our-brands' or c.status <> 'open' or c.visitor_message_count <> 1 or c.assigned_to is not null
     or c.brand_id <> (select id from public.brands where slug = 'lexta') or c.last_visitor_message_at is null
     or c.last_message_preview <> 'Hello, where can I buy Yazz in Kumasi?' then
    raise exception 'FAIL: conversation saved as %', row_to_json(c);
  end if;
  if c.token_hash <> encode(extensions.digest((select token from convs where label = 'ama'), 'sha256'), 'hex')
     or c.token_hash = (select token from convs where label = 'ama') then
    raise exception 'FAIL: the token must be stored only as its SHA-256 hash';
  end if;
  if (select body from public.chat_messages where conversation_id = c.id) <> E'Hello,\nwhere can I buy Yazz in Kumasi?' then
    raise exception 'FAIL: first message saved as %', (select body from public.chat_messages where conversation_id = c.id);
  end if;
  if (select count(*) from public.chat_rate_events where ip_hash = pg_temp.ip('visitor-1')) <> 2 then
    raise exception 'FAIL: expected a start and a message event';
  end if;

  -- Honeypot: a reply shaped like a real one, nothing saved, nothing counted.
  perform pg_temp.as_user('anon');
  r := pg_temp.start('bot', '{"name":"Bot","message":"Buy now","honeypot":"http://spam.example"}');
  if r ->> 'reference' !~ '^LC-[0-9A-F]{8}$' or r ->> 'token' !~ '^[0-9a-f]{64}$' then raise exception 'FAIL: honeypot reply was %', r; end if;
  begin
    perform pg_temp.read('bot', (r ->> 'conversation_id')::uuid, r ->> 'token');
    raise exception 'FAIL: the honeypot conversation can be read';
  exception when sqlstate 'PT403' then null;
  end;
  perform pg_temp.as_user('owner');
  if (select count(*) from public.chat_conversations) <> 1 or exists (select 1 from public.chat_rate_events where ip_hash = pg_temp.ip('bot')) then
    raise exception 'FAIL: the honeypot saved something';
  end if;

  -- Input limits.
  perform pg_temp.as_user('anon');
  for bad in select * from (values
      ('{"message":"Hi"}'::jsonb, 'name'),
      ('{"name":"   ","message":"Hi"}', 'name'),
      (jsonb_build_object('name', repeat('n', 81), 'message', 'Hi'), 'name'),
      ('{"name":"Ama"}', 'message'),
      (jsonb_build_object('name', 'Ama', 'message', repeat('m', 2001)), 'message'),
      ('{"name":"Ama","message":"Hi","email":"not an email"}', 'email'),
      (jsonb_build_object('name', 'Ama', 'message', 'Hi', 'email', repeat('e', 250) || '@x.co'), 'email'),
      ('{"name":"Ama","message":"Hi","phone":"call me"}', 'phone'),
      ('{"name":"Ama","message":"Hi","brand":"acme"}', 'brand'),
      ('{"name":"Ama","message":"Hi","owner":"x"}', 'owner'),
      ('{"name":"Ama","message":"Hi","status":"closed"}', 'status'),
      ('{"name":["Ama"],"message":"Hi"}', 'name'),
      (jsonb_build_object('name', 'Ama', 'message', 'Hi', 'page', repeat('p', 301)), 'page'),
      (jsonb_build_object('name', 'Ama', 'message', repeat('m', 1990), 'email', 'a@b.co', 'phone', '0244', 'page', '/' || repeat('p', 299), 'honeypot', repeat(' ', 4000)), 'payload'),
      ('"just text"'::jsonb, 'payload')
    ) as x(payload, field) loop
    begin
      perform pg_temp.start('visitor-inputs', bad.payload);
      raise exception 'FAIL: accepted a bad start (%)', bad.field;
    exception when sqlstate '22023' then
      if sqlerrm not like '%' || bad.field || '%' then raise exception 'FAIL: expected % got %', bad.field, sqlerrm; end if;
    end;
  end loop;
  -- A page that is not a path is dropped, not refused; exactly 80 and 2000 characters are fine.
  r := pg_temp.start('visitor-inputs', jsonb_build_object('name', repeat('n', 80), 'message', repeat('m', 2000), 'page', 'https://evil.example/x'));
  insert into convs values ('long', (r ->> 'conversation_id')::uuid, r ->> 'token');
  perform pg_temp.as_user('owner');
  if (select start_page from public.chat_conversations where id = (r ->> 'conversation_id')::uuid) is not null then
    raise exception 'FAIL: a page that is not a path was kept';
  end if;
  raise notice 'PASS: start saves a trimmed conversation and first message, keeps only the token hash; honeypot saves nothing; names, emails, phones, messages, brands, unknown fields and payload size are checked';
end $$;

-- Tokens: a visitor reads and writes only their own conversation ----------------------------------------------------
do $$
declare
  r jsonb;
  ama record;
  other record;
  m jsonb;
begin
  perform pg_temp.as_user('anon');
  r := pg_temp.start('visitor-2', '{"name":"Kofi","message":"My order is late","phone":"024 555 0202"}');
  insert into convs values ('kofi', (r ->> 'conversation_id')::uuid, r ->> 'token');
  select * into ama from convs where label = 'ama';
  select * into other from convs where label = 'kofi';

  r := pg_temp.read('visitor-1', ama.id, ama.token);
  if r ->> 'reference' !~ '^LC-' or r ->> 'status' <> 'open' or jsonb_array_length(r -> 'messages') <> 1
     or r -> 'messages' -> 0 ->> 'sender' <> 'visitor' then
    raise exception 'FAIL: read returned %', r;
  end if;
  -- Wrong token, someone else's token, a missing, short or malformed token, an unknown id: all PT403, nothing leaks.
  for m in select jsonb_build_array(x.id, x.tok) from (values
      (ama.id, other.token), (other.id, ama.token), (ama.id, ''), (ama.id, left(ama.token, 63)), (ama.id, upper(ama.token)),
      (ama.id, null), (gen_random_uuid(), ama.token), (null, ama.token)) as x(id, tok) loop
    begin
      perform pg_temp.read('visitor-1', (m ->> 0)::uuid, m ->> 1);
      raise exception 'FAIL: read with a wrong token %', m;
    exception when sqlstate 'PT403' then null;
    end;
    begin
      perform pg_temp.send('visitor-1', (m ->> 0)::uuid, m ->> 1, 'sneaky');
      raise exception 'FAIL: send with a wrong token %', m;
    exception when sqlstate 'PT403' then null;
    end;
  end loop;

  -- Sending: trimmed, kept in order; the nonce is the message id, so a retry does not save twice.
  declare n uuid := gen_random_uuid(); first jsonb; again jsonb;
  begin
    first := pg_temp.send('visitor-1', ama.id, ama.token, '  It is for a shop  ', n);
    again := pg_temp.send('visitor-1', ama.id, ama.token, '  It is for a shop  ', n);
    if first <> again or (first ->> 'id')::uuid <> n then raise exception 'FAIL: retry gave % then %', first, again; end if;
    begin
      perform pg_temp.send('visitor-2', other.id, other.token, 'reuse', n);
      raise exception 'FAIL: a nonce of another conversation was accepted';
    exception when sqlstate '22023' then null;
    end;
  end;
  begin
    perform pg_temp.send('visitor-1', ama.id, ama.token, '   ');
    raise exception 'FAIL: empty message accepted';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform pg_temp.send('visitor-1', ama.id, ama.token, repeat('x', 2001));
    raise exception 'FAIL: 2001 character message accepted';
  exception when sqlstate '22023' then null;
  end;
  r := pg_temp.read('visitor-1', ama.id, ama.token);
  if jsonb_array_length(r -> 'messages') <> 2 or r -> 'messages' -> 1 ->> 'body' <> 'It is for a shop' then
    raise exception 'FAIL: after sending, read returned %', r;
  end if;
  -- Reading after a seq returns only newer messages.
  if jsonb_array_length(pg_temp.read('visitor-1', ama.id, ama.token, (r -> 'messages' -> 0 ->> 'seq')::bigint) -> 'messages') <> 1 then
    raise exception 'FAIL: after_seq not applied';
  end if;
  if pg_temp.read('visitor-2', other.id, other.token)::text like '%shop%' then raise exception 'FAIL: one visitor sees another''s messages'; end if;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: a token opens only its own conversation; wrong, swapped, malformed and missing tokens get PT403; sends are trimmed, checked and idempotent';
end $$;

-- A retried start returns the same chat and token and counts nothing; a used nonce is useless to anyone else ------
do $$
declare
  n uuid := gen_random_uuid();
  t bigint := pg_temp.now_s();
  p jsonb := '{"name":"Retry","message":"Did this arrive?","honeypot":""}';
  a jsonb;
  b jsonb;
  bad record;
begin
  perform pg_temp.as_user('anon');
  a := public.chat_start(n, t, pg_temp.ip('retry'), pg_temp.sig(n, t, pg_temp.ip('retry')), p);
  b := public.chat_start(n, t + 1, pg_temp.ip('retry'), pg_temp.sig(n, t + 1, pg_temp.ip('retry')), p);
  if a <> b then raise exception 'FAIL: a retried start gave % then %', a, b; end if;
  perform pg_temp.read('retry', n, b ->> 'token');
  for bad in select * from (values
      ('other-address', p),
      ('retry', '{"name":"Retry","message":"Different text","honeypot":""}'::jsonb),
      ('retry', '{"name":"Someone else","message":"Did this arrive?","honeypot":""}'::jsonb)
    ) as x(ip_tag, payload) loop
    begin
      perform public.chat_start(n, t, pg_temp.ip(bad.ip_tag), pg_temp.sig(n, t, pg_temp.ip(bad.ip_tag)), bad.payload);
      raise exception 'FAIL: a used nonce gave a token to a different request (%)', bad.ip_tag;
    exception when sqlstate '22023' then null;
    end;
  end loop;
  perform pg_temp.as_user('owner');
  if (select count(*) from public.chat_conversations where id = n) <> 1
     or (select count(*) from public.chat_messages where conversation_id = n) <> 1
     or (select count(*) from public.chat_rate_events where ip_hash = pg_temp.ip('retry')) <> 2 then
    raise exception 'FAIL: a retried start saved or counted twice';
  end if;
  -- An old start is not handed out again.
  update public.chat_conversations set created_at = now() - interval '20 minutes' where id = n;
  perform pg_temp.as_user('anon');
  begin
    perform public.chat_start(n, t, pg_temp.ip('retry'), pg_temp.sig(n, t, pg_temp.ip('retry')), p);
    raise exception 'FAIL: a start older than 15 minutes was handed out again';
  exception when sqlstate '22023' then null;
  end;
  perform pg_temp.as_user('owner');
  delete from public.chat_conversations where id = n;
  raise notice 'PASS: a retried start (same nonce, address and details, within 15 minutes) returns the same chat and token, saves and counts once; any other use of the nonce is refused';
end $$;

-- Staff: who sees what ------------------------------------------------------------------------------------------------
do $$
declare
  who text;
  n int;
begin
  foreach who in array array['admin', 'mgmt', 'care', 'care2'] loop
    perform pg_temp.as_user(who);
    select count(*) into n from public.chat_conversations;
    if n <> 3 then raise exception 'FAIL: % sees % conversations, expected 3', who, n; end if;
    select count(*) into n from public.chat_messages;
    if n < 4 then raise exception 'FAIL: % sees % messages', who, n; end if;
    if not public.chat_staff_role() then raise exception 'FAIL: % is not chat staff', who; end if;
    if (select count(*) from public.chat_staff()) <> 5 then raise exception 'FAIL: % sees % chat staff', who, (select count(*) from public.chat_staff()); end if;
    begin
      perform token_hash from public.chat_conversations;
      raise exception 'FAIL: % read token hashes', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform start_fingerprint from public.chat_conversations;
      raise exception 'FAIL: % read start fingerprints', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform count(*) from public.chat_rate_events;
      raise exception 'FAIL: % read rate events', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform count(*) from private.chat_intake_secret;
      raise exception 'FAIL: % read the chat secret', who;
    exception when insufficient_privilege then null;
    end;
  end loop;
  foreach who in array array['rep', 'mkt', 'hr', 'dist', 'norole', 'care_gone'] loop
    perform pg_temp.as_user(who);
    if exists (select 1 from public.chat_conversations) or exists (select 1 from public.chat_messages) then
      raise exception 'FAIL: % sees chats', who;
    end if;
    if public.chat_staff_role() or exists (select 1 from public.chat_staff()) then raise exception 'FAIL: % counts as chat staff', who; end if;
    if public.chat_inbox_pulse() <> '|0' then raise exception 'FAIL: % pulse shows chats: %', who, public.chat_inbox_pulse(); end if;
    if public.chat_is_agent(pg_temp.u('care')) then raise exception 'FAIL: % can probe who answers chat', who; end if;
    if public.chat_staff_first_name(pg_temp.u('care')) <> 'Lexta team' then raise exception 'FAIL: % reads staff names', who; end if;
    update public.chat_conversations set status = 'closed';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: % closed chats', who; end if;
    delete from public.chat_conversations;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: % deleted chats', who; end if;
    begin
      perform public.chat_reply((select id from convs where label = 'ama'), 'Hello from outside', false);
      raise exception 'FAIL: % replied', who;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.chat_set_status((select id from convs where label = 'ama'), 'closed');
      raise exception 'FAIL: % changed a status', who;
    exception when sqlstate '42501' then null;
    end;
    begin
      perform public.chat_assign((select id from convs where label = 'ama'), pg_temp.u(who));
      raise exception 'FAIL: % assigned a chat', who;
    exception when sqlstate '42501' then null;
    end;
    begin
      perform public.chat_create_lead((select id from convs where label = 'ama'));
      raise exception 'FAIL: % made a lead from a chat', who;
    exception when sqlstate '42501' then null;
    end;
    -- Staff functions of the website calls are not theirs either.
    begin
      perform pg_temp.read('x', (select id from convs where label = 'ama'), (select token from convs where label = 'ama'));
      raise exception 'FAIL: % called chat_read', who;
    exception when insufficient_privilege then null;
    end;
  end loop;
  perform pg_temp.as_user('owner');
  if exists (select 1 from public.chat_messages where body = 'Hello from outside') then raise exception 'FAIL: outsider message saved'; end if;
  raise notice 'PASS: admin, management and customer care read every chat (never token hashes, rate events or the secret); sales, marketing, HR, distributors, no role and inactive people see and change nothing';
end $$;

-- Staff: replies, internal notes, what the visitor sees -------------------------------------------------------------------
do $$
declare
  ama record;
  r jsonb;
  c record;
  pulse text;
  m uuid;
begin
  select * into ama from convs where label = 'ama';
  perform pg_temp.as_user('care');
  pulse := public.chat_inbox_pulse();
  -- Opening marks it read, once; a read does not move the pulse.
  if (select staff_read_at from public.chat_conversations where id = ama.id) is not null then raise exception 'FAIL: new chat already read'; end if;
  perform public.chat_mark_read(ama.id);
  if (select staff_read_at from public.chat_conversations where id = ama.id) is null then raise exception 'FAIL: mark read did nothing'; end if;
  if public.chat_inbox_pulse() <> pulse then raise exception 'FAIL: a read moved the pulse'; end if;

  m := public.chat_reply(ama.id, '  Hello Ama, we can help.  ', false);
  perform public.chat_reply(ama.id, 'Customer seems to be a shop owner, possible distributor', true);
  -- A staff member cannot write as the visitor or as someone else.
  begin
    insert into public.chat_messages (conversation_id, sender, body) values (ama.id, 'visitor', 'Fake visitor line');
    raise exception 'FAIL: staff wrote as the visitor';
  exception when insufficient_privilege then null;
  end;
  insert into public.chat_messages (conversation_id, sender, body) values (ama.id, 'staff', 'Direct insert');
  begin
    insert into public.chat_messages (conversation_id, sender, body, author_id) values (ama.id, 'staff', 'Spoof', pg_temp.u('admin'));
    raise exception 'FAIL: staff set the author';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.chat_reply(ama.id, repeat('x', 2001), false);
    raise exception 'FAIL: a 2001 character reply was saved';
  exception when check_violation then null;
  end;
  begin
    update public.chat_messages set body = 'edited' where id = m;
    raise exception 'FAIL: staff edited a message';
  exception when insufficient_privilege then null;
  end;
  if (select author_id from public.chat_messages where id = m) <> pg_temp.u('care')
     or (select count(*) from public.chat_messages where conversation_id = ama.id and author_id = pg_temp.u('care')) <> 3 then
    raise exception 'FAIL: author not taken from the session';
  end if;
  select status, closed_at, closed_by, updated_by, last_staff_message_at, last_message_preview, last_visitor_message_at, staff_read_at, visitor_message_count into c from public.chat_conversations where id = ama.id;
  if c.status <> 'waiting' or c.last_staff_message_at is null or c.last_message_preview <> 'Direct insert' then
    raise exception 'FAIL: after a reply the chat is %', row_to_json(c);
  end if;
  if public.chat_inbox_pulse() = pulse then raise exception 'FAIL: a reply did not move the pulse'; end if;

  perform pg_temp.as_user('anon');
  r := pg_temp.read('visitor-1', ama.id, ama.token);
  if r::text like '%shop owner%' or r::text like '%@test.local%' or r::text like '%Mensah%' or r::text like '%author%' then
    raise exception 'FAIL: the visitor sees internal notes, staff emails or full names: %', r;
  end if;
  if r ->> 'status' <> 'waiting' or jsonb_array_length(r -> 'messages') <> 4
     or r -> 'messages' -> 2 ->> 'staff_name' <> 'Esi' or r -> 'messages' -> 2 ->> 'body' <> 'Hello Ama, we can help.'
     or r -> 'messages' -> 0 ? 'author_id' or r -> 'messages' -> 0 ->> 'staff_name' is not null then
    raise exception 'FAIL: visitor read %', r;
  end if;
  -- The visitor answers: open again, unread for the team.
  perform pg_temp.send('visitor-1', ama.id, ama.token, 'Great, thank you');
  perform pg_temp.as_user('owner');
  select status, closed_at, closed_by, updated_by, last_staff_message_at, last_message_preview, last_visitor_message_at, staff_read_at, visitor_message_count into c from public.chat_conversations where id = ama.id;
  if c.status <> 'open' or not (c.last_visitor_message_at > c.staff_read_at) or c.visitor_message_count <> 3 then
    raise exception 'FAIL: after the visitor answered the chat is %', row_to_json(c);
  end if;
  -- A staff member without a name shows as Lexta team.
  perform pg_temp.as_user('care2');
  perform public.chat_reply(ama.id, 'I am covering for Esi', false);
  perform pg_temp.as_user('anon');
  r := pg_temp.read('visitor-1', ama.id, ama.token);
  if r -> 'messages' -> -1 ->> 'staff_name' <> 'Lexta team' then raise exception 'FAIL: nameless staff shown as %', r -> 'messages' -> -1; end if;
  -- The visitor gets positions in their own chat (1, 2, 3...), with no gaps from notes or other chats.
  if (select string_agg(x ->> 'seq', ',' order by ord) from jsonb_array_elements(r -> 'messages') with ordinality as e(x, ord))
     <> (select string_agg(g::text, ',' order by g) from generate_series(1, jsonb_array_length(r -> 'messages')) g) then
    raise exception 'FAIL: visitor message numbers are not 1..n: %', r -> 'messages';
  end if;
  if (pg_temp.send('visitor-1', ama.id, ama.token, 'Numbered') ->> 'seq')::int <> jsonb_array_length(r -> 'messages') + 1 then
    raise exception 'FAIL: chat_send did not return the next position';
  end if;
  if jsonb_array_length(pg_temp.read('visitor-1', ama.id, ama.token, jsonb_array_length(r -> 'messages')) -> 'messages') <> 1 then
    raise exception 'FAIL: reading after a position';
  end if;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: staff reply and add internal notes as themselves only; the visitor sees replies with a first name only, never notes, emails or full names; statuses and unread follow the messages';
end $$;

-- Staff: assign, close, reopen, visitor details, delete --------------------------------------------------------------
do $$
declare
  ama record;
  c record;
  n int;
begin
  select * into ama from convs where label = 'ama';
  perform pg_temp.as_user('care');
  perform public.chat_assign(ama.id, pg_temp.u('care'));
  perform public.chat_assign(ama.id, pg_temp.u('mgmt'));
  foreach n in array array[1, 2, 3] loop
    begin
      perform public.chat_assign(ama.id, pg_temp.u((array['rep', 'care_gone', 'hr'])[n]));
      raise exception 'FAIL: assigned to a non agent';
    exception when check_violation then null;
    end;
  end loop;
  -- Columns staff may not touch.
  begin
    update public.chat_conversations set token_hash = repeat('b', 64) where id = ama.id;
    raise exception 'FAIL: staff changed a token hash';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.chat_conversations set brand_id = (select id from public.brands where slug = 'yazz'), reference = 'LC-AAAAAAAA' where id = ama.id;
    raise exception 'FAIL: staff changed brand or reference';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.chat_conversations set last_message_at = now() - interval '9 days', visitor_message_count = 0 where id = ama.id;
    raise exception 'FAIL: staff changed counters';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.chat_conversations (reference, brand_id, token_hash, visitor_name)
    values ('LC-00000001', (select id from public.brands where slug = 'lexta'), repeat('a', 64), 'x');
    raise exception 'FAIL: staff created a conversation';
  exception when insufficient_privilege then null;
  end;

  perform public.chat_set_status(ama.id, 'closed');
  select status, closed_at, closed_by, updated_by, last_staff_message_at, last_message_preview, last_visitor_message_at, staff_read_at, visitor_message_count into c from public.chat_conversations where id = ama.id;
  if c.status <> 'closed' or c.closed_at is null or c.closed_by <> pg_temp.u('care') or c.updated_by <> pg_temp.u('care') then
    raise exception 'FAIL: close saved %', row_to_json(c);
  end if;
  begin
    perform public.chat_reply(ama.id, 'Reply on a closed chat', false);
    raise exception 'FAIL: replied on a closed chat';
  exception when sqlstate '55000' then null;
  end;
  perform public.chat_reply(ama.id, 'Note on a closed chat', true);
  begin
    perform public.chat_set_status(ama.id, 'archived');
    raise exception 'FAIL: unknown status accepted';
  exception when sqlstate '22023' then null;
  end;
  perform public.chat_set_status(ama.id, 'open');
  select status, closed_at, closed_by, updated_by, last_staff_message_at, last_message_preview, last_visitor_message_at, staff_read_at, visitor_message_count into c from public.chat_conversations where id = ama.id;
  if c.status <> 'open' or c.closed_at is not null or c.closed_by is not null then raise exception 'FAIL: reopen saved %', row_to_json(c); end if;

  -- The visitor's details as learnt in the chat; the table's checks apply.
  perform public.chat_save_visitor(ama.id, 'Ama Owusu', 'ama.shop@example.com', '+233 24 555 0101');
  begin
    perform public.chat_save_visitor(ama.id, 'Ama', 'not-an-email', null);
    raise exception 'FAIL: bad email saved';
  exception when check_violation then null;
  end;
  begin
    perform public.chat_save_visitor(ama.id, '', null, null);
    raise exception 'FAIL: empty name saved';
  exception when check_violation then null;
  end;

  -- Management works the inbox too; only admins delete.
  perform pg_temp.as_user('mgmt');
  perform public.chat_set_status(ama.id, 'waiting');
  delete from public.chat_conversations where id = ama.id;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management deleted a chat'; end if;
  perform pg_temp.as_user('care');
  delete from public.chat_conversations where id = ama.id;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care deleted a chat'; end if;
  begin
    perform public.chat_delete(ama.id);
    raise exception 'FAIL: customer care deleted a chat through chat_delete';
  exception when sqlstate '42501' then null;
  end;
  perform pg_temp.as_user('admin');
  perform public.chat_delete((select id from convs where label = 'long'));
  perform pg_temp.as_user('owner');
  if exists (select 1 from public.chat_messages where conversation_id = (select id from convs where label = 'long')) then
    raise exception 'FAIL: messages of a deleted chat remain';
  end if;
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.read('visitor-inputs', (select id from convs where label = 'long'), (select token from convs where label = 'long'));
    raise exception 'FAIL: a deleted chat can still be read';
  exception when sqlstate 'PT403' then null;
  end;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: assign only to active chat staff; close records who and when, blocks replies (notes still allowed), reopen clears it; token, brand, reference and counters are out of reach; only admins delete';
end $$;

-- Staff: a CRM lead and a complaint from a chat ------------------------------------------------------------------
do $$
declare
  ama record;
  kofi record;
  lead uuid;
  complaint uuid;
  l record;
  cm record;
begin
  select * into ama from convs where label = 'ama';
  select * into kofi from convs where label = 'kofi';

  -- Management may make a lead, but not a complaint (complaints tracker rules, 0007).
  perform pg_temp.as_user('mgmt');
  begin
    perform public.chat_create_complaint(kofi.id, 'delivery');
    raise exception 'FAIL: management logged a complaint';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.as_user('care');
  lead := public.chat_create_lead(ama.id);
  select * into l from public.crm_leads where id = lead;
  if l.source <> 'website_live_chat' or l.stage <> 'new' or l.owner_id is not null or l.created_by <> pg_temp.u('care')
     or l.brand_id <> (select id from public.brands where slug = 'lexta') or l.title <> 'Live chat with Ama Owusu'
     or l.description not like 'From live chat LC-%' or l.description not like '%where can I buy Yazz in Kumasi?%'
     or l.description like '%shop owner%' or l.description not like '%Esi (Lexta): Hello Ama, we can help.%' then
    raise exception 'FAIL: lead saved as %', row_to_json(l);
  end if;
  if (select email from public.crm_contacts where id = l.contact_id) <> 'ama.shop@example.com' then raise exception 'FAIL: lead contact wrong'; end if;
  if (select lead_id from public.chat_conversations where id = ama.id) <> lead then raise exception 'FAIL: chat not linked to the lead'; end if;
  if not exists (select 1 from public.chat_messages where conversation_id = ama.id and is_internal and body = 'Made a CRM lead from this chat.') then
    raise exception 'FAIL: no note on the thread';
  end if;
  begin
    perform public.chat_create_lead(ama.id);
    raise exception 'FAIL: a second lead from one chat';
  exception when sqlstate 'PT409' then null;
  end;

  -- An existing contact with the same phone is used as it is.
  perform pg_temp.as_user('owner');
  insert into public.crm_contacts (full_name, phone, notes) values ('Kofi Existing', '+233245550202', 'Staff typed this');
  perform pg_temp.as_user('care');
  complaint := public.chat_create_complaint(kofi.id, 'delivery');
  select * into cm from public.complaints where id = complaint;
  if cm.channel <> 'website' or cm.category <> 'delivery' or cm.status <> 'new' or cm.case_number !~ '^LX-[0-9]{4}-[0-9]{4}$'
     or cm.description not like 'From live chat LC-%My order is late%'
     or (select full_name || '|' || notes from public.crm_contacts where id = cm.contact_id) <> 'Kofi Existing|Staff typed this' then
    raise exception 'FAIL: complaint saved as %', row_to_json(cm);
  end if;
  if (select complaint_id from public.chat_conversations where id = kofi.id) <> complaint then raise exception 'FAIL: chat not linked to the complaint'; end if;
  if not exists (select 1 from public.chat_messages where conversation_id = kofi.id and is_internal and body = 'Logged complaint ' || cm.case_number || ' from this chat.') then
    raise exception 'FAIL: no complaint note on the thread';
  end if;
  begin
    perform public.chat_create_complaint(kofi.id, 'delivery');
    raise exception 'FAIL: a second complaint from one chat';
  exception when sqlstate 'PT409' then null;
  end;

  -- A complaint needs a way to reach the customer.
  perform pg_temp.as_user('anon');
  declare r jsonb;
  begin
    r := pg_temp.start('visitor-3', '{"name":"No Contact","message":"The biscuits were broken"}');
    insert into convs values ('nocontact', (r ->> 'conversation_id')::uuid, r ->> 'token');
  end;
  perform pg_temp.as_user('care');
  begin
    perform public.chat_create_complaint((select id from convs where label = 'nocontact'), 'packaging');
    raise exception 'FAIL: complaint without email or phone';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.chat_create_complaint((select id from convs where label = 'nocontact'), 'not_a_category');
    raise exception 'FAIL: unknown complaint category accepted';
  exception when sqlstate '22023' or check_violation then null;
  end;
  -- Linking only to records the person can see; a lead id that does not exist is refused.
  begin
    update public.chat_conversations set lead_id = gen_random_uuid() where id = (select id from convs where label = 'nocontact');
    raise exception 'FAIL: linked an unknown lead';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: a chat becomes a CRM lead (source website_live_chat, stage New, transcript without notes) or a complaint (channel website) once each, linked both ways with a note; management cannot log complaints; contacts are matched, never changed';
end $$;

-- Rate limits ------------------------------------------------------------------------------------------------------
do $$
declare
  r jsonb;
  i int;
  conv uuid;
  tok text;
begin
  -- Per token, a minute: 8 visitor messages (the first message counts).
  perform pg_temp.as_user('anon');
  r := pg_temp.start('rate-1', '{"name":"Fast","message":"one"}');
  conv := (r ->> 'conversation_id')::uuid; tok := r ->> 'token';
  for i in 2..8 loop perform pg_temp.send('rate-1', conv, tok, 'msg ' || i); end loop;
  begin
    perform pg_temp.send('rate-1', conv, tok, 'ninth');
    raise exception 'FAIL: a ninth message in a minute was accepted';
  exception when sqlstate 'PT429' then
    if sqlerrm not like '%wait a moment%' then raise exception 'FAIL: minute limit said %', sqlerrm; end if;
  end;
  -- A new conversation from the same address is not limited by the old token's minute.
  r := pg_temp.start('rate-1', '{"name":"Fast","message":"again"}');
  perform pg_temp.send('rate-1', (r ->> 'conversation_id')::uuid, r ->> 'token', 'second chat works');

  -- Per token, an hour: 60.
  perform pg_temp.as_user('owner');
  insert into public.chat_messages (conversation_id, sender, body, created_at)
  select conv, 'visitor', 'old ' || g, now() - interval '10 minutes' from generate_series(1, 52) g;
  update public.chat_messages set created_at = now() - interval '5 minutes' where conversation_id = conv and created_at > now() - interval '1 minute';
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.send('rate-1', conv, tok, 'over the hour');
    raise exception 'FAIL: message 61 in an hour accepted';
  exception when sqlstate 'PT429' then
    if sqlerrm not like '%try again later%' then raise exception 'FAIL: hour limit said %', sqlerrm; end if;
  end;

  -- Per conversation, in all: 300 visitor messages.
  perform pg_temp.as_user('owner');
  update public.chat_messages set created_at = now() - interval '2 hours' where conversation_id = conv;
  update public.chat_conversations set visitor_message_count = 300 where id = conv;
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.send('rate-1', conv, tok, 'over the lifetime');
    raise exception 'FAIL: message 301 accepted';
  exception when sqlstate 'PT429' then
    if sqlerrm not like '%message limit%' then raise exception 'FAIL: lifetime limit said %', sqlerrm; end if;
  end;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: per token 8 messages a minute and 60 an hour, 300 per conversation; a new conversation does not reset the address limits (next test)';
end $$;

do $$
declare
  r jsonb;
  i int;
begin
  -- Per address: 10 new conversations an hour, whatever tokens or names are used.
  perform pg_temp.as_user('anon');
  for i in 1..10 loop perform pg_temp.start('rate-2', jsonb_build_object('name', 'Throwaway ' || i, 'message', 'hi')); end loop;
  begin
    perform pg_temp.start('rate-2', '{"name":"Throwaway 11","message":"hi"}');
    raise exception 'FAIL: an eleventh conversation in an hour';
  exception when sqlstate 'PT429' then null;
  end;
  -- Another visitor is not locked out by that.
  r := pg_temp.start('rate-2-neighbour', '{"name":"Neighbour","message":"hi"}');
  if r ->> 'conversation_id' is null then raise exception 'FAIL: another visitor was locked out'; end if;

  -- Per address: 30 a day.
  perform pg_temp.as_user('owner');
  insert into public.chat_rate_events (kind, ip_hash, created_at)
  select 'start', pg_temp.ip('rate-3'), now() - interval '3 hours' from generate_series(1, 30);
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.start('rate-3', '{"name":"Daily","message":"hi"}');
    raise exception 'FAIL: a 31st conversation in a day';
  exception when sqlstate 'PT429' then
    if sqlerrm not like '%tomorrow%' then raise exception 'FAIL: day limit said %', sqlerrm; end if;
  end;

  -- Per address: 200 visitor messages an hour across every conversation.
  perform pg_temp.as_user('owner');
  insert into public.chat_rate_events (kind, ip_hash, created_at)
  select 'message', pg_temp.ip('rate-4'), now() - interval '30 minutes' from generate_series(1, 200);
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.start('rate-4', '{"name":"Chatty","message":"hi"}');
    raise exception 'FAIL: a start over the address message limit';
  exception when sqlstate 'PT429' then null;
  end;
  begin
    perform pg_temp.send('rate-4', (select id from convs where label = 'kofi'), (select token from convs where label = 'kofi'), 'hi');
    raise exception 'FAIL: a send over the address message limit';
  exception when sqlstate 'PT429' then null;
  end;
  -- The same conversation from another address (a phone moving networks) still works.
  perform pg_temp.send('visitor-2', (select id from convs where label = 'kofi'), (select token from convs where label = 'kofi'), 'from my usual network');

  -- Old events are cleared by the next start (kept 2 days).
  perform pg_temp.as_user('owner');
  insert into public.chat_rate_events (kind, ip_hash, created_at) values ('start', pg_temp.ip('ancient'), now() - interval '3 days');
  perform pg_temp.as_user('anon');
  perform pg_temp.start('rate-5', '{"name":"Cleaner","message":"hi"}');
  perform pg_temp.as_user('owner');
  if exists (select 1 from public.chat_rate_events where ip_hash = pg_temp.ip('ancient')) then raise exception 'FAIL: old rate events kept'; end if;
  raise notice 'PASS: per address 10 conversations an hour, 30 a day and 200 messages an hour, whatever the token; other visitors are not locked out; events kept 2 days';
end $$;

-- Circuit breaker: only a flood from many addresses reaches it ------------------------------------------------------------
do $$
declare
  have int;
begin
  perform pg_temp.as_user('owner');
  select count(*) into have from public.chat_rate_events where kind = 'start' and created_at > now() - interval '1 hour';
  insert into public.chat_rate_events (kind, ip_hash)
  select 'start', pg_temp.ip('flood-' || g) from generate_series(1, 300 - have) g;
  perform pg_temp.as_user('anon');
  begin
    perform pg_temp.start('fresh-visitor', '{"name":"Fresh","message":"hi"}');
    raise exception 'FAIL: start accepted during a flood';
  exception when sqlstate 'PT429' then
    if sqlerrm not like '%busy%' then raise exception 'FAIL: breaker said %', sqlerrm; end if;
  end;
  -- Ongoing conversations carry on during a flood of new ones.
  perform pg_temp.send('visitor-2', (select id from convs where label = 'kofi'), (select token from convs where label = 'kofi'), 'still here');
  perform pg_temp.as_user('owner');
  delete from public.chat_rate_events where ip_hash in (select pg_temp.ip('flood-' || g) from generate_series(1, 300) g);

  select count(*) into have from public.chat_rate_events where kind = 'message' and created_at > now() - interval '1 hour';
  insert into public.chat_rate_events (kind, ip_hash)
  select 'message', pg_temp.ip('flood-' || g) from generate_series(1, 3000 - have) g;
  perform pg_temp.as_user('anon');
  -- A chat staff are already answering carries on (Ama has staff replies)...
  perform pg_temp.send('visitor-1', (select id from convs where label = 'ama'), (select token from convs where label = 'ama'), 'answered chats carry on');
  -- ...one nobody has replied in yet waits (Kofi only has internal notes).
  begin
    perform pg_temp.send('visitor-2', (select id from convs where label = 'kofi'), (select token from convs where label = 'kofi'), 'flooded');
    raise exception 'FAIL: send accepted during a message flood';
  exception when sqlstate 'PT429' then
    if sqlerrm not like '%busy%' then raise exception 'FAIL: message breaker said %', sqlerrm; end if;
  end;
  -- Reading still works, so visitors see staff replies.
  perform pg_temp.read('visitor-2', (select id from convs where label = 'kofi'), (select token from convs where label = 'kofi'));
  perform pg_temp.as_user('owner');
  delete from public.chat_rate_events where ip_hash in (select pg_temp.ip('flood-' || g) from generate_series(1, 3000) g);
  raise notice 'PASS: site wide breaker at 300 new chats and 3000 messages an hour; chats staff already replied in carry on, unanswered ones wait; reads still work';
end $$;

-- New leads can use the live chat source from the portal too, and the old sources still work.
do $$
begin
  perform pg_temp.as_user('mgmt');
  perform public.save_crm_lead(null, jsonb_build_object('title', 'Manual chat lead', 'contact_id',
    (select id from public.crm_contacts order by created_at limit 1), 'source', 'website_live_chat', 'stage', 'new'));
  perform public.save_crm_lead(null, jsonb_build_object('title', 'Manual phone lead', 'contact_id',
    (select id from public.crm_contacts order by created_at limit 1), 'source', 'phone', 'stage', 'new'));
  begin
    perform public.save_crm_lead(null, jsonb_build_object('title', 'Bad', 'contact_id',
      (select id from public.crm_contacts order by created_at limit 1), 'source', 'live_chat', 'stage', 'new'));
    raise exception 'FAIL: unknown source accepted';
  exception when check_violation then null;
  end;
  perform pg_temp.as_user('owner');
  raise notice 'PASS: website_live_chat is a lead source; other sources unchanged';
end $$;

rollback;
