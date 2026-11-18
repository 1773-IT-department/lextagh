-- Newsletter unsubscribe (0028): tokens, the anon unsubscribe RPC, the signed token RPC, Row Level Security.
-- Run with: bash supabase/tests/local/run.sh newsletter_unsubscribe
-- Everything happens inside one transaction that is rolled back at the end.

begin;

insert into private.chat_intake_secret (secret) values ('harness-chat-secret-newsletter-0123456789')
on conflict (id) do update set secret = excluded.secret;

create function pg_temp.sig(email text, ts bigint, secret text default 'harness-chat-secret-newsletter-0123456789') returns text
language sql immutable as $$
  select encode(extensions.hmac('newsletter-token:' || lower(email) || '.' || ts::text, secret, 'sha256'), 'hex');
$$;
create function pg_temp.now_s() returns bigint language sql stable as $$ select extract(epoch from now())::bigint; $$;

create temp table t_tokens (label text primary key, token text);
grant select, insert on t_tokens to anon, authenticated;

-- Shape ----------------------------------------------------------------------------------------------------------------
do $$
begin
  if not (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'crm_newsletter_tokens') then
    raise exception 'FAIL: crm_newsletter_tokens has Row Level Security off';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'crm_newsletter_tokens') then
    raise exception 'FAIL: crm_newsletter_tokens must have no policies';
  end if;
  if has_table_privilege('anon', 'public.crm_newsletter_tokens', 'select') or has_table_privilege('authenticated', 'public.crm_newsletter_tokens', 'select') then
    raise exception 'FAIL: tokens readable over the API';
  end if;
  if has_column_privilege('authenticated', 'public.crm_contacts', 'marketing_unsubscribed_at', 'update')
     or has_column_privilege('authenticated', 'public.crm_contacts', 'marketing_unsubscribed_at', 'insert') then
    raise exception 'FAIL: staff can type marketing_unsubscribed_at';
  end if;
  if not has_function_privilege('anon', 'public.newsletter_unsubscribe(text)', 'execute')
     or has_function_privilege('authenticated', 'public.newsletter_unsubscribe(text)', 'execute') then
    raise exception 'FAIL: newsletter_unsubscribe grants';
  end if;
  raise notice 'PASS: tokens table has RLS on, no policies, no API reads; marketing_unsubscribed_at is database set';
end $$;

-- Sign ups through the real intake get a token; contacts without consent do not ----------------------------------------
set local role anon;
do $$
begin
  perform public.submit_website_enquiry('newsletter', jsonb_build_object('brand', 'yazz', 'email', 'nl.one@test.local', 'consent_marketing', true));
  perform public.submit_website_enquiry('newsletter', jsonb_build_object('brand', 'lexta', 'email', 'nl.two@test.local', 'consent_marketing', true));
  perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'No Consent', 'email', 'nl.none@test.local', 'message', 'Hi'));
end $$;
reset role;

do $$
begin
  if (select count(*) from public.crm_newsletter_tokens t join public.crm_contacts c on c.id = t.contact_id
      where c.email in ('nl.one@test.local', 'nl.two@test.local')) <> 2 then
    raise exception 'FAIL: newsletter sign ups have no token';
  end if;
  if exists (select 1 from public.crm_newsletter_tokens t join public.crm_contacts c on c.id = t.contact_id where c.email = 'nl.none@test.local') then
    raise exception 'FAIL: a contact without consent got a token';
  end if;
  if (select count(distinct token) from public.crm_newsletter_tokens) <> (select count(*) from public.crm_newsletter_tokens) then
    raise exception 'FAIL: tokens are not unique';
  end if;
  raise notice 'PASS: each newsletter contact gets its own token, contacts without consent none';
end $$;

-- The website server gets the token with a signed request; nobody else does --------------------------------------------
set local role anon;
do $$
declare
  t bigint := pg_temp.now_s();
  tok text;
begin
  tok := public.newsletter_unsubscribe_token(' NL.One@Test.Local ', t, pg_temp.sig('nl.one@test.local', t));
  if tok !~ '^[0-9a-f]{48}$' then raise exception 'FAIL: no token for a signed request (%)', tok; end if;
  insert into t_tokens values ('one', tok);
  if public.newsletter_unsubscribe_token('nl.none@test.local', t, pg_temp.sig('nl.none@test.local', t)) is not null then
    raise exception 'FAIL: a token for a contact without consent';
  end if;
  if public.newsletter_unsubscribe_token('nobody@test.local', t, pg_temp.sig('nobody@test.local', t)) is not null then
    raise exception 'FAIL: a token for an unknown email';
  end if;
  -- Forged, other secret, chat style, stale.
  declare bad record;
  begin
    for bad in select * from (values
        ('forged', 'nl.one@test.local', t, repeat('a', 64), 'signature'),
        ('other secret', 'nl.one@test.local', t, pg_temp.sig('nl.one@test.local', t, 'another-secret-that-is-long-enough-0000'), 'signature'),
        ('signed for another email', 'nl.one@test.local', t, pg_temp.sig('nl.two@test.local', t), 'signature'),
        ('chat prefix', 'nl.one@test.local', t, encode(extensions.hmac('chat.nl.one@test.local.' || t, 'harness-chat-secret-newsletter-0123456789', 'sha256'), 'hex'), 'signature'),
        ('stale', 'nl.one@test.local', t - 400, pg_temp.sig('nl.one@test.local', t - 400), 'issued_at')
      ) as x(label, email, ts, sig, field) loop
      begin
        perform public.newsletter_unsubscribe_token(bad.email, bad.ts, bad.sig);
        raise exception 'FAIL: token handed out for a bad request (%)', bad.label;
      exception when sqlstate '22023' then
        if sqlerrm not like '%' || bad.field || '%' then raise exception 'FAIL: % expected %, got %', bad.label, bad.field, sqlerrm; end if;
      end;
    end loop;
  end;
  begin
    perform 1 from public.crm_newsletter_tokens;
    raise exception 'FAIL: anon read tokens';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: only a signed request gets the token, only for a subscribed contact; forged, cross email, chat style and stale requests refused';
end $$;

-- Unsubscribe -------------------------------------------------------------------------------------------------------------
do $$
declare tok text := (select token from t_tokens where label = 'one');
begin
  if public.newsletter_unsubscribe('not-a-token') or public.newsletter_unsubscribe(null) or public.newsletter_unsubscribe(repeat('0', 48)) then
    raise exception 'FAIL: unsubscribe said yes to a bad token';
  end if;
  if not public.newsletter_unsubscribe(tok) then raise exception 'FAIL: unsubscribe refused a real token'; end if;
  if not public.newsletter_unsubscribe(tok) then raise exception 'FAIL: unsubscribing twice is not a yes'; end if;
  raise notice 'PASS: anon unsubscribes with a real token (twice is fine); bad tokens get false and change nothing';
end $$;
reset role;

do $$
declare c record;
begin
  select * into c from public.crm_contacts where email = 'nl.one@test.local';
  if c.consent_marketing or c.marketing_unsubscribed_at is null or c.consent_at is not null or c.consent_source is not null then
    raise exception 'FAIL: consent not withdrawn and recorded (% % % %)', c.consent_marketing, c.marketing_unsubscribed_at, c.consent_at, c.consent_source;
  end if;
  if not (select consent_marketing from public.crm_contacts where email = 'nl.two@test.local') then
    raise exception 'FAIL: another subscriber was unsubscribed';
  end if;
  raise notice 'PASS: marketing consent off, when recorded, consent time and source cleared; other subscribers untouched';
end $$;

-- Signing up again turns consent back on (the person asked); the unsubscribe history stays.
set local role anon;
select public.submit_website_enquiry('newsletter', jsonb_build_object('brand', 'yazz', 'email', 'nl.one@test.local', 'consent_marketing', true)) \g /dev/null
reset role;
do $$
begin
  if not (select consent_marketing and marketing_unsubscribed_at is not null from public.crm_contacts where email = 'nl.one@test.local') then
    raise exception 'FAIL: signing up again after unsubscribing';
  end if;
  raise notice 'PASS: a new sign up turns consent back on and keeps when they last unsubscribed';
end $$;

rollback;
