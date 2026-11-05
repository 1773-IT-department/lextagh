-- 0009_live_chat: live chat on the websites, answered by Lexta staff in one inbox (scoreboard item 22).
-- A HUMAN chat: no automated replies are stored or sent by the database. The website widget shows two fixed lines
-- of its own (a member of the team will reply shortly; the out of hours note), nothing else is automatic.
--
-- Tables
--   chat_conversations   one per visitor chat: brand (which site), visitor name, email and phone, status, who it is
--                        assigned to, activity times for the inbox, links to a CRM lead or complaint made from it.
--                        The visitor's token is never stored, only its SHA-256 hash (token_hash), which staff
--                        cannot read either.
--   chat_messages        the thread: visitor messages, staff replies and staff internal notes (is_internal).
--   chat_rate_events     one row per conversation started and per visitor message, with the hashed visitor
--                        address, only for the rate limits. Kept 2 days. Nobody reads it over the API.
--   private.chat_intake_secret   the website server's shared secret (see below).
--
-- Who can do what:
--   admin                         read every conversation and message; reply, add internal notes, assign, close,
--                                 reopen, edit the visitor's details, make a CRM lead or complaint from a chat; the
--                                 only role that deletes a conversation (for example an erasure request)
--   management, customer_care     the same, without delete. Making a lead or complaint also needs the CRM and
--                                 complaints rights of 0006 and 0007 (the conversion runs as the person, so those
--                                 tables' Row Level Security decides): management cannot create complaints there,
--                                 so management can make leads but not complaints from a chat.
--   sales_rep, marketing, hr,     nothing at all
--   distributor, no role
--   website visitors (anon)       no table access at all. Only through the website's server (the publishable key
--                                 plus a signature only that server can make): public.chat_start (name, optional
--                                 email or phone, first message; returns the conversation id and a new random
--                                 token), public.chat_send (needs the token) and public.chat_read (needs the
--                                 token; returns that conversation's visitor messages and staff replies with the
--                                 staff member's first name only, never internal notes, emails or other chats).
--
-- The website server signs every call with CHAT_INTAKE_SECRET (shared only with the database): HMAC SHA-256 over
-- "chat.<new uuid>.<unix seconds>.<visitor IP hash>". The IP hash is an HMAC of the visitor's address (IPv6 grouped
-- by /64) with the same secret, made on the server, so the raw address never leaves it. Without the secret nobody
-- can start, send or read by calling the API directly. The nonce becomes the new conversation's or message's id,
-- so a retried call can never save twice.
--
-- Limits (all refused with PT429, which PostgREST answers as HTTP 429):
--   per visitor address (IP hash)   10 new conversations an hour and 30 a day; 200 visitor messages an hour. A
--                                   throwaway conversation or token does not reset these.
--   per token (one conversation)    8 visitor messages a minute and 60 an hour; 300 visitor messages in all.
--   site wide circuit breaker       300 new conversations an hour, 3000 visitor messages an hour (logged as a
--                                   warning). One address cannot reach these alone: its own limits stop it first.
--   input                           name 1 to 80, email up to 254, phone up to 24, message 1 to 2000 characters,
--                                   page path up to 300, the whole start payload up to 6000 bytes, unknown fields
--                                   refused, and a honeypot field (anything in it: a reply shaped like a real one,
--                                   nothing saved).
--
-- Status: open (the visitor wrote last and waits for a reply), waiting (staff replied, waiting for the visitor),
-- closed (staff closed it). A visitor message makes a conversation open again, closed or not; a staff reply makes
-- it waiting. Staff cannot reply on a closed conversation (reopen first) but can add internal notes.
-- Unread: a visitor message newer than the last time anyone on the team opened the conversation (staff_read_at).
-- activity_at changes on every message and every staff change except a read, so the inbox can poll one cheap
-- value (public.chat_inbox_pulse) to know when to refresh.

set client_min_messages = warning;

-- Helpers ------------------------------------------------------------------------------------------
-- Admin, management and customer care: the people who answer the chat.
create or replace function public.chat_staff_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'customer_care'), false);
$$;

revoke all on function public.chat_staff_role() from public, anon;
grant execute on function public.chat_staff_role() to authenticated;

-- People who answer the chat, for names and the assign list. Empty for everyone else.
create or replace function public.chat_staff()
returns table (id uuid, display_name text, role public.app_role, is_active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email), p.role, p.is_active
  from public.profiles p
  where public.chat_staff_role()
    and p.role in ('admin', 'management', 'customer_care')
  order by 2;
$$;

revoke all on function public.chat_staff() from public, anon;
grant execute on function public.chat_staff() to authenticated;

-- A conversation can be assigned to an active admin, management or customer care person. Only answers for chat
-- staff (or database work without a signed in person), so nobody else can probe who answers the chat.
create or replace function public.chat_is_agent(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (public.chat_staff_role() or (select auth.uid()) is null)
     and exists (
       select 1 from public.profiles p
       where p.id = target_profile and p.is_active and p.role in ('admin', 'management', 'customer_care')
     );
$$;

revoke all on function public.chat_is_agent(uuid) from public, anon;
grant execute on function public.chat_is_agent(uuid) to authenticated;

-- What a visitor sees as the name of a staff member: the first word of their name, or "Lexta team". Never an email.
-- Answers for the website functions (no signed in person) and for chat staff; everyone else gets "Lexta team".
create or replace function public.chat_staff_first_name(target_profile uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select nullif(left(split_part(btrim(p.full_name), ' ', 1), 40), '') from public.profiles p
      where p.id = target_profile and (public.chat_staff_role() or (select auth.uid()) is null)),
    'Lexta team'
  );
$$;

revoke all on function public.chat_staff_first_name(uuid) from public, anon;
grant execute on function public.chat_staff_first_name(uuid) to authenticated;

-- The website's shared secret -------------------------------------------------------------------------
-- The website server (env CHAT_INTAKE_SECRET) signs every chat call with it; the database checks the signature.
-- Kept in the private schema, which the Data API does not expose, with Row Level Security on and no policies, so
-- only the security definer functions below read it.
-- One time set up (the same value as CHAT_INTAKE_SECRET on the website's Vercel project, at least 32 characters):
--   insert into private.chat_intake_secret (secret) values ('<value>')
--   on conflict (id) do update set secret = excluded.secret, updated_at = now();
-- Until it is set every chat call is refused and the widget says chat is not available, with the email address.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.chat_intake_secret (
  id boolean primary key default true check (id),
  secret text not null check (length(secret) >= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.chat_intake_secret enable row level security;
revoke all on private.chat_intake_secret from public, anon, authenticated;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Conversations ------------------------------------------------------------------------------------
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  -- What staff quote, e.g. LC-7F3A09C2.
  reference text not null unique check (reference ~ '^LC-[0-9A-F]{8}$'),
  -- Which site the chat came from (the corporate Lexta brand for the Lexta site).
  brand_id uuid not null references public.brands (id) on delete restrict,
  -- SHA-256 (hex) of the visitor's token. The token itself is never stored.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  visitor_name text not null check (length(btrim(visitor_name)) between 1 and 80),
  visitor_email text check (visitor_email is null or (length(visitor_email) <= 254 and visitor_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  visitor_phone text check (visitor_phone is null or visitor_phone ~ '^\+?[0-9][0-9 ()-]{5,22}$'),
  -- The page the chat was started on, e.g. /our-brands.
  start_page text check (start_page is null or (length(start_page) <= 300 and start_page ~ '^/')),
  status text not null default 'open' check (status in ('open', 'waiting', 'closed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz not null default now(),
  last_message_preview text check (last_message_preview is null or length(last_message_preview) <= 160),
  last_visitor_message_at timestamptz,
  last_staff_message_at timestamptz,
  -- The last time anyone on the team opened the conversation.
  staff_read_at timestamptz,
  -- Changes on every message and every staff change except a read (the inbox polls it).
  activity_at timestamptz not null default now(),
  visitor_message_count integer not null default 0 check (visitor_message_count >= 0),
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  lead_id uuid references public.crm_leads (id) on delete set null,
  complaint_id uuid references public.complaints (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  check ((status = 'closed') = (closed_at is not null))
);

create index chat_conversations_status_idx on public.chat_conversations (status, last_message_at desc);
create index chat_conversations_last_message_idx on public.chat_conversations (last_message_at desc);
create index chat_conversations_activity_idx on public.chat_conversations (activity_at desc);
create index chat_conversations_brand_idx on public.chat_conversations (brand_id);
create index chat_conversations_assigned_idx on public.chat_conversations (assigned_to);
create index chat_conversations_closed_by_idx on public.chat_conversations (closed_by);
create index chat_conversations_lead_idx on public.chat_conversations (lead_id);
create index chat_conversations_complaint_idx on public.chat_conversations (complaint_id);
create index chat_conversations_updated_by_idx on public.chat_conversations (updated_by);

-- Messages ------------------------------------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  -- Order and the visitor's read cursor.
  seq bigint generated always as identity unique,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender text not null check (sender in ('visitor', 'staff')),
  author_id uuid references public.profiles (id) on delete set null,
  -- Staff only notes: never shown to the visitor.
  is_internal boolean not null default false,
  body text not null check (length(btrim(body)) between 1 and 2000),
  -- The moment of the insert (not the transaction start), so order and unread are exact.
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default now(),
  check (sender = 'staff' or (author_id is null and not is_internal))
);

create index chat_messages_conversation_idx on public.chat_messages (conversation_id, seq);
create index chat_messages_visitor_idx on public.chat_messages (conversation_id, created_at) where sender = 'visitor';
create index chat_messages_author_idx on public.chat_messages (author_id);

-- Rate limit events ------------------------------------------------------------------------------------
create table public.chat_rate_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('start', 'message')),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_rate_events_ip_idx on public.chat_rate_events (ip_hash, kind, created_at);
create index chat_rate_events_kind_idx on public.chat_rate_events (kind, created_at);

-- updated_at ------------------------------------------------------------------------------------------
create trigger chat_conversations_set_updated_at before update on public.chat_conversations
  for each row execute function public.set_updated_at();
create trigger chat_messages_set_updated_at before update on public.chat_messages
  for each row execute function public.set_updated_at();
create trigger chat_rate_events_set_updated_at before update on public.chat_rate_events
  for each row execute function public.set_updated_at();

-- Conversation changes ------------------------------------------------------------------------------
-- Security invoker on purpose: current_user is the caller's role. Staff (role authenticated) may only assign chat
-- staff and link leads and complaints they can see; the website functions and the message trigger run as the
-- database owner. For everyone: closing records when and who, reopening clears it, and activity_at moves on every
-- change but a read.
create or replace function public.check_chat_conversation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if current_user = 'authenticated' then
    if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null and not public.chat_is_agent(new.assigned_to) then
      raise exception 'a chat can only be assigned to an active admin, management or customer care person' using errcode = '23514';
    end if;
    if new.lead_id is distinct from old.lead_id and new.lead_id is not null and not public.crm_can_see_lead_id(new.lead_id) then
      raise exception 'lead not found' using errcode = '42501';
    end if;
    if new.complaint_id is distinct from old.complaint_id and new.complaint_id is not null and not public.complaint_can_see_id(new.complaint_id) then
      raise exception 'complaint not found' using errcode = '42501';
    end if;
    new.updated_by := me;
  end if;

  if new.status = 'closed' and old.status <> 'closed' then
    new.closed_at := now();
    new.closed_by := me;
  elsif new.status <> 'closed' then
    new.closed_at := null;
    new.closed_by := null;
  end if;

  if (to_jsonb(new) - array['staff_read_at', 'updated_at', 'updated_by', 'activity_at'])
     is distinct from (to_jsonb(old) - array['staff_read_at', 'updated_at', 'updated_by', 'activity_at']) then
    new.activity_at := clock_timestamp();
  else
    new.activity_at := old.activity_at;
  end if;
  return new;
end;
$$;

create trigger chat_conversations_check before update on public.chat_conversations
  for each row execute function public.check_chat_conversation();

-- Messages: staff messages always carry the signed in person as author; a reply needs an open conversation.
create or replace function public.check_chat_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.body := btrim(regexp_replace(replace(new.body, E'\r\n', E'\n'), E'[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]+', ' ', 'g'));
  if current_user = 'authenticated' then
    new.author_id := (select auth.uid());
    if not new.is_internal and exists (
      select 1 from public.chat_conversations c where c.id = new.conversation_id and c.status = 'closed'
    ) then
      raise exception 'this chat is closed, reopen it before replying' using errcode = '55000';
    end if;
  end if;
  return new;
end;
$$;

create trigger chat_messages_check before insert on public.chat_messages
  for each row execute function public.check_chat_message();

-- After a message: the conversation's times, status, preview and counts. Security definer: staff cannot write
-- these columns themselves.
create or replace function public.chat_message_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  preview text := left(regexp_replace(new.body, '\s+', ' ', 'g'), 160);
begin
  if new.sender = 'visitor' then
    update public.chat_conversations c set
      status = 'open',
      last_message_at = new.created_at,
      last_visitor_message_at = new.created_at,
      last_message_preview = preview,
      visitor_message_count = c.visitor_message_count + 1
    where c.id = new.conversation_id;
  elsif new.is_internal then
    -- A note is activity for the team (the inbox refreshes) but not a message in the thread's order.
    update public.chat_conversations c set activity_at = clock_timestamp() where c.id = new.conversation_id;
  else
    update public.chat_conversations c set
      status = case when c.status = 'closed' then 'closed' else 'waiting' end,
      last_message_at = new.created_at,
      last_staff_message_at = new.created_at,
      last_message_preview = preview,
      -- Replying means the team has read it.
      staff_read_at = greatest(coalesce(c.staff_read_at, new.created_at), new.created_at)
    where c.id = new.conversation_id;
  end if;
  return null;
end;
$$;

revoke all on function public.chat_message_added() from public, anon, authenticated;

create trigger chat_messages_added after insert on public.chat_messages
  for each row execute function public.chat_message_added();

-- Row Level Security --------------------------------------------------------------------------------
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_rate_events enable row level security;

revoke all on public.chat_conversations from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;
revoke all on public.chat_rate_events from anon, authenticated;

-- Staff read every column but the token hash; they change only these.
grant select (id, reference, brand_id, visitor_name, visitor_email, visitor_phone, start_page, status, assigned_to,
              last_message_at, last_message_preview, last_visitor_message_at, last_staff_message_at, staff_read_at,
              activity_at, visitor_message_count, closed_at, closed_by, lead_id, complaint_id, created_at, updated_at,
              updated_by)
  on public.chat_conversations to authenticated;
grant update (status, assigned_to, staff_read_at, visitor_name, visitor_email, visitor_phone, lead_id, complaint_id)
  on public.chat_conversations to authenticated;
grant delete on public.chat_conversations to authenticated;
grant select on public.chat_messages to authenticated;
grant insert (conversation_id, sender, body, is_internal) on public.chat_messages to authenticated;
-- chat_rate_events: no grants and no policies; only the website functions below touch it.

create policy "chat staff read conversations"
  on public.chat_conversations for select to authenticated
  using ((select public.chat_staff_role()));

create policy "chat staff update conversations"
  on public.chat_conversations for update to authenticated
  using ((select public.chat_staff_role())) with check ((select public.chat_staff_role()));

create policy "admins delete conversations"
  on public.chat_conversations for delete to authenticated
  using ((select public.is_admin()));
-- No insert policy: conversations are only started by public.chat_start.

create policy "chat staff read messages"
  on public.chat_messages for select to authenticated
  using ((select public.chat_staff_role()));

create policy "chat staff add replies and notes"
  on public.chat_messages for insert to authenticated
  with check ((select public.chat_staff_role()) and sender = 'staff');
-- No update or delete policies: the thread is a record. Deleting the conversation removes its messages.

-- Website calls -----------------------------------------------------------------------------------------
-- Checks a website server signature. Raises 55000 when the secret is not set up, 22023 when the signature, the
-- address hash or the time is wrong (5 minutes old at most, 1 minute ahead at most).
create or replace function public.chat_check_request(nonce uuid, issued_at bigint, ip_hash text, signature text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select s.secret into v_secret from private.chat_intake_secret s where s.id;
  if v_secret is null then
    raise exception 'chat is not set up' using errcode = '55000';
  end if;
  if nonce is null or issued_at is null or ip_hash is null or ip_hash !~ '^[0-9a-f]{64}$'
     or signature is null or signature !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  -- Compared as HMACs of both values, so the time the comparison takes says nothing about the expected signature.
  if extensions.hmac(encode(extensions.hmac('chat.' || nonce::text || '.' || issued_at::text || '.' || ip_hash, v_secret, 'sha256'), 'hex'), v_secret, 'sha256')
     <> extensions.hmac(signature, v_secret, 'sha256') then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  if issued_at < extract(epoch from now())::bigint - 300 or issued_at > extract(epoch from now())::bigint + 60 then
    raise exception 'invalid field: issued_at' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.chat_check_request(uuid, bigint, text, text) from public, anon, authenticated;

-- The conversation a token opens, or PT403 (wrong, missing or malformed token, or no such conversation).
create or replace function public.chat_conversation_for(conversation_id uuid, token text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if conversation_id is null or token is null or token !~ '^[0-9a-f]{64}$' then
    raise exception 'conversation not found' using errcode = 'PT403';
  end if;
  select c.id into v_id from public.chat_conversations c
   where c.id = chat_conversation_for.conversation_id
     and c.token_hash = encode(extensions.digest(chat_conversation_for.token, 'sha256'), 'hex');
  if v_id is null then
    raise exception 'conversation not found' using errcode = 'PT403';
  end if;
  return v_id;
end;
$$;

revoke all on function public.chat_conversation_for(uuid, text) from public, anon, authenticated;

-- One trimmed message body: 1 to 2000 characters, control characters removed (line breaks kept).
create or replace function public.chat_clean_body(body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text;
begin
  s := btrim(regexp_replace(replace(coalesce(body, ''), E'\r\n', E'\n'), E'[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]+', ' ', 'g'));
  if s = '' or length(s) > 2000 then
    raise exception 'invalid field: message' using errcode = '22023';
  end if;
  return s;
end;
$$;

revoke all on function public.chat_clean_body(text) from public, anon, authenticated;

-- The visitor address limits and the site wide breaker for one kind of event. Raises PT429 when over.
create or replace function public.chat_check_limits(kind text, ip_hash text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  if kind = 'start' then
    select count(*) into recent from public.chat_rate_events e
     where e.ip_hash = chat_check_limits.ip_hash and e.kind = 'start' and e.created_at > now() - interval '1 hour';
    if recent >= 10 then
      raise exception 'too many chats started, please try again later' using errcode = 'PT429';
    end if;
    select count(*) into recent from public.chat_rate_events e
     where e.ip_hash = chat_check_limits.ip_hash and e.kind = 'start' and e.created_at > now() - interval '1 day';
    if recent >= 30 then
      raise exception 'too many chats started, please try again tomorrow' using errcode = 'PT429';
    end if;
    select count(*) into recent from public.chat_rate_events e
     where e.kind = 'start' and e.created_at > now() - interval '1 hour';
    if recent >= 300 then
      raise warning 'LEXTA CHAT CIRCUIT BREAKER: new chats stopped, % started in the last hour (limit 300)', recent;
      raise exception 'chat is very busy, please try again later' using errcode = 'PT429';
    end if;
  end if;

  select count(*) into recent from public.chat_rate_events e
   where e.ip_hash = chat_check_limits.ip_hash and e.kind = 'message' and e.created_at > now() - interval '1 hour';
  if recent >= 200 then
    raise exception 'too many messages, please try again later' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.chat_rate_events e
   where e.kind = 'message' and e.created_at > now() - interval '1 hour';
  if recent >= 3000 then
    raise warning 'LEXTA CHAT CIRCUIT BREAKER: visitor messages stopped, % in the last hour (limit 3000)', recent;
    raise exception 'chat is very busy, please try again later' using errcode = 'PT429';
  end if;
end;
$$;

revoke all on function public.chat_check_limits(text, text) from public, anon, authenticated;

-- Starts a conversation. payload (text fields; unknown fields are refused; at most 6000 bytes):
--   honeypot  leave empty; anything in it means a bot: a reply shaped like a real one comes back, nothing is saved
--   brand     slug of the site: lexta, yazz, linzzy or hooch (default lexta)
--   name      required, 1 to 80
--   email     optional, up to 254
--   phone     optional, up to 24
--   message   required, 1 to 2000 (the first message)
--   page      optional, the path the chat started on, up to 300, starting with /
-- Returns { conversation_id, token, reference }. The token is shown once, here; only its hash is kept.
create or replace function public.chat_start(nonce uuid, issued_at bigint, ip_hash text, signature text, payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  k text;
  v_name text;
  v_email text;
  v_phone text;
  v_message text;
  v_page text;
  v_brand_slug text;
  v_brand uuid;
  v_token text;
  v_ref text;
begin
  perform public.chat_check_request(nonce, issued_at, ip_hash, signature);
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'invalid field: payload' using errcode = '22023';
  end if;
  if octet_length(payload::text) > 6000 then
    raise exception 'payload too large' using errcode = '22023';
  end if;
  for k in select jsonb_object_keys(payload) loop
    if k <> all (array['honeypot', 'brand', 'name', 'email', 'phone', 'message', 'page']) then
      raise exception 'invalid field: %', left(k, 40) using errcode = '22023';
    end if;
  end loop;

  -- A bot filled the hidden field: answer like a success, save nothing.
  if public.crm_intake_text(payload, 'honeypot', 500) is not null then
    return jsonb_build_object(
      'conversation_id', gen_random_uuid(),
      'token', encode(extensions.gen_random_bytes(32), 'hex'),
      'reference', 'LC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    );
  end if;

  v_name := public.crm_intake_text(payload, 'name', 80);
  v_email := lower(public.crm_intake_text(payload, 'email', 254));
  v_phone := public.crm_intake_text(payload, 'phone', 24);
  v_message := public.crm_intake_text(payload, 'message', 2000);
  v_page := public.crm_intake_text(payload, 'page', 300);
  v_brand_slug := coalesce(lower(public.crm_intake_text(payload, 'brand', 60)), 'lexta');

  if v_name is null then
    raise exception 'invalid field: name' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9][0-9 ()-]{5,22}$' then
    raise exception 'invalid field: phone' using errcode = '22023';
  end if;
  if v_message is null then
    raise exception 'invalid field: message' using errcode = '22023';
  end if;
  if v_page is not null and v_page !~ '^/[^[:space:]]*$' then
    v_page := null;
  end if;
  select b.id into v_brand from public.brands b where b.slug = v_brand_slug and b.is_active;
  if v_brand is null then
    raise exception 'invalid field: brand' using errcode = '22023';
  end if;

  -- One at a time per visitor address, so parallel requests cannot slip past the counts.
  perform pg_advisory_xact_lock(91, hashtext(ip_hash));
  perform public.chat_check_limits('start', ip_hash);
  if exists (select 1 from public.chat_conversations c where c.id = nonce) then
    raise exception 'invalid field: nonce' using errcode = '22023';
  end if;
  -- The events are only for the limits; old rows are not needed.
  delete from public.chat_rate_events e where e.created_at < now() - interval '2 days';

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  loop
    v_ref := 'LC-' || upper(encode(extensions.gen_random_bytes(4), 'hex'));
    exit when not exists (select 1 from public.chat_conversations c where c.reference = v_ref);
  end loop;

  insert into public.chat_conversations (id, reference, brand_id, token_hash, visitor_name, visitor_email, visitor_phone, start_page)
  values (nonce, v_ref, v_brand, encode(extensions.digest(v_token, 'sha256'), 'hex'), v_name, v_email, v_phone, v_page);
  insert into public.chat_messages (conversation_id, sender, body) values (nonce, 'visitor', v_message);
  insert into public.chat_rate_events (kind, ip_hash) values ('start', ip_hash), ('message', ip_hash);

  return jsonb_build_object('conversation_id', nonce, 'token', v_token, 'reference', v_ref);
end;
$$;

revoke all on function public.chat_start(uuid, bigint, text, text, jsonb) from public, authenticated;
grant execute on function public.chat_start(uuid, bigint, text, text, jsonb) to anon;

-- Sends a visitor message. The nonce becomes the message id: the same nonce twice returns the first message.
-- Returns { id, seq, created_at }.
create or replace function public.chat_send(nonce uuid, issued_at bigint, ip_hash text, signature text,
                                            conversation_id uuid, token text, body text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conv uuid;
  v_body text;
  v_count integer;
  recent integer;
  v_msg record;
begin
  perform public.chat_check_request(nonce, issued_at, ip_hash, signature);
  v_conv := public.chat_conversation_for(conversation_id, token);
  v_body := public.chat_clean_body(body);

  -- One at a time per conversation, then per address (always in that order, so two calls cannot deadlock).
  select c.visitor_message_count into v_count from public.chat_conversations c where c.id = v_conv for update;
  perform pg_advisory_xact_lock(91, hashtext(ip_hash));

  select m.id, m.seq, m.created_at, m.conversation_id into v_msg from public.chat_messages m where m.id = nonce;
  if found then
    if v_msg.conversation_id <> v_conv then
      raise exception 'invalid field: nonce' using errcode = '22023';
    end if;
    return jsonb_build_object('id', v_msg.id, 'seq', v_msg.seq, 'created_at', v_msg.created_at);
  end if;

  if v_count >= 300 then
    raise exception 'this chat has reached its message limit, please start a new chat' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.chat_messages m
   where m.conversation_id = v_conv and m.sender = 'visitor' and m.created_at > now() - interval '1 minute';
  if recent >= 8 then
    raise exception 'too many messages, please wait a moment' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.chat_messages m
   where m.conversation_id = v_conv and m.sender = 'visitor' and m.created_at > now() - interval '1 hour';
  if recent >= 60 then
    raise exception 'too many messages, please try again later' using errcode = 'PT429';
  end if;
  perform public.chat_check_limits('message', ip_hash);

  insert into public.chat_messages (id, conversation_id, sender, body) values (nonce, v_conv, 'visitor', v_body)
  returning id, seq, created_at into v_msg;
  insert into public.chat_rate_events (kind, ip_hash) values ('message', ip_hash);
  return jsonb_build_object('id', v_msg.id, 'seq', v_msg.seq, 'created_at', v_msg.created_at);
end;
$$;

revoke all on function public.chat_send(uuid, bigint, text, text, uuid, text, text) from public, authenticated;
grant execute on function public.chat_send(uuid, bigint, text, text, uuid, text, text) to anon;

-- Reads a visitor's own conversation: messages after after_seq (0 for all), at most 200, oldest first. Internal
-- notes are never included; a staff reply carries only the staff member's first name.
-- Returns { reference, status, messages: [{ id, seq, sender, body, created_at, staff_name }] }.
create or replace function public.chat_read(nonce uuid, issued_at bigint, ip_hash text, signature text,
                                            conversation_id uuid, token text, after_seq bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conv uuid;
  v_out jsonb;
begin
  perform public.chat_check_request(nonce, issued_at, ip_hash, signature);
  v_conv := public.chat_conversation_for(conversation_id, token);
  select jsonb_build_object(
    'reference', c.reference,
    'status', c.status,
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'seq', m.seq, 'sender', m.sender, 'body', m.body, 'created_at', m.created_at,
        'staff_name', case when m.sender = 'staff' then public.chat_staff_first_name(m.author_id) end
      ) order by m.seq)
      from (
        select * from public.chat_messages m
        where m.conversation_id = v_conv and not m.is_internal and m.seq > greatest(coalesce(after_seq, 0), 0)
        order by m.seq limit 200
      ) m
    ), '[]'::jsonb)
  ) into v_out
  from public.chat_conversations c where c.id = v_conv;
  return v_out;
end;
$$;

revoke all on function public.chat_read(uuid, bigint, text, text, uuid, text, bigint) from public, authenticated;
grant execute on function public.chat_read(uuid, bigint, text, text, uuid, text, bigint) to anon;

-- Staff calls -------------------------------------------------------------------------------------------
-- The inbox's poll: changes whenever a conversation the person can see gets a message or a staff change (not a
-- read), or one is added or deleted. Empty for everyone without chat access (Row Level Security).
create or replace function public.chat_inbox_pulse()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(max(c.activity_at)::text, '') || '|' || count(*)::text from public.chat_conversations c;
$$;

revoke all on function public.chat_inbox_pulse() from public, anon;
grant execute on function public.chat_inbox_pulse() to authenticated;

-- Marks a conversation read by the team (only writes when there is something new to read).
create or replace function public.chat_mark_read(target_id uuid)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.chat_conversations c set staff_read_at = clock_timestamp()
   where c.id = target_id
     and c.last_visitor_message_at is not null
     and (c.staff_read_at is null or c.staff_read_at < c.last_visitor_message_at);
$$;

revoke all on function public.chat_mark_read(uuid) from public, anon;
grant execute on function public.chat_mark_read(uuid) to authenticated;

-- Staff changes go through these (security invoker: Row Level Security, the column grants and the triggers decide).
-- Each raises 42501 when nothing was changed because the person may not, or the chat is gone.
create or replace function public.chat_reply(target_id uuid, body text, internal boolean)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.chat_messages (conversation_id, sender, body, is_internal)
  values (target_id, 'staff', btrim(coalesce(body, '')), coalesce(internal, false))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.chat_set_status(target_id uuid, new_status text)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  if new_status is null or new_status not in ('open', 'waiting', 'closed') then
    raise exception 'invalid field: status' using errcode = '22023';
  end if;
  update public.chat_conversations c set status = new_status where c.id = target_id and c.status <> new_status;
  get diagnostics changed = row_count;
  if changed = 0 and not exists (select 1 from public.chat_conversations c where c.id = target_id and c.status = new_status) then
    raise exception 'not allowed to change this chat' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.chat_assign(target_id uuid, new_assignee uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.chat_conversations c set assigned_to = new_assignee where c.id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change this chat' using errcode = '42501';
  end if;
end;
$$;

-- The visitor's details as staff learn them in the chat (needed for a complaint). Empty text clears a field.
create or replace function public.chat_save_visitor(target_id uuid, new_name text, new_email text, new_phone text)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.chat_conversations c set
    visitor_name = btrim(coalesce(new_name, '')),
    visitor_email = nullif(lower(btrim(coalesce(new_email, ''))), ''),
    visitor_phone = nullif(btrim(coalesce(new_phone, '')), '')
  where c.id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change this chat' using errcode = '42501';
  end if;
end;
$$;

-- Admin only (the delete policy decides): removes a conversation and its messages for good.
create or replace function public.chat_delete(target_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  delete from public.chat_conversations c where c.id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to delete this chat' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.chat_reply(uuid, text, boolean) from public, anon;
revoke all on function public.chat_delete(uuid) from public, anon;
revoke all on function public.chat_set_status(uuid, text) from public, anon;
revoke all on function public.chat_assign(uuid, uuid) from public, anon;
revoke all on function public.chat_save_visitor(uuid, text, text, text) from public, anon;
grant execute on function public.chat_reply(uuid, text, boolean) to authenticated;
grant execute on function public.chat_delete(uuid) to authenticated;
grant execute on function public.chat_set_status(uuid, text) to authenticated;
grant execute on function public.chat_assign(uuid, uuid) to authenticated;
grant execute on function public.chat_save_visitor(uuid, text, text, text) to authenticated;

-- The conversation as plain text for a lead or complaint (internal notes left out), newest last, cut to max_len.
create or replace function public.chat_transcript(target_id uuid, max_len integer)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select left(coalesce(string_agg(
    to_char(m.created_at at time zone 'Africa/Accra', 'DD Mon HH24:MI') || ' ' ||
    case when m.sender = 'visitor' then c.visitor_name else public.chat_staff_first_name(m.author_id) || ' (Lexta)' end ||
    ': ' || m.body, E'\n' order by m.seq), ''), max_len)
  from public.chat_messages m join public.chat_conversations c on c.id = m.conversation_id
  where m.conversation_id = target_id and not m.is_internal;
$$;

revoke all on function public.chat_transcript(uuid, integer) from public, anon;
grant execute on function public.chat_transcript(uuid, integer) to authenticated;

-- A CRM contact for the visitor: an existing one with that email (or phone) is used as it is, otherwise one is
-- created. Same matching as the website intake (0006) and save_complaint (0007). Runs as the person.
create or replace function public.chat_contact_for(target_id uuid)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  c record;
  v_contact uuid;
begin
  select cc.visitor_name, cc.visitor_email, cc.visitor_phone into c from public.chat_conversations cc where cc.id = target_id;
  if c.visitor_email is not null then
    select x.id into v_contact from public.crm_contacts x where lower(x.email) = lower(c.visitor_email) order by x.created_at, x.id limit 1;
  end if;
  if v_contact is null and c.visitor_phone is not null then
    select x.id into v_contact from public.crm_contacts x
     where x.phone_key = public.crm_phone_key(c.visitor_phone)
       and (x.email is null or c.visitor_email is null or lower(x.email) = lower(c.visitor_email))
     order by x.created_at, x.id limit 1;
  end if;
  if v_contact is null then
    insert into public.crm_contacts (full_name, phone, email) values (c.visitor_name, c.visitor_phone, c.visitor_email)
    returning id into v_contact;
  end if;
  return v_contact;
end;
$$;

revoke all on function public.chat_contact_for(uuid) from public, anon;
grant execute on function public.chat_contact_for(uuid) to authenticated;

-- Live chat is a lead source (item 19's sources plus this one).
alter table public.crm_leads drop constraint crm_leads_source_check;
alter table public.crm_leads add constraint crm_leads_source_check check (source in (
  'website_contact_form', 'website_partner_form', 'website_newsletter', 'website_live_chat', 'complaint_escalation',
  'field_visit', 'phone', 'email', 'walk_in', 'referral', 'event', 'other'
));

-- Makes a CRM lead from a conversation: the visitor as a contact (found or created), a lead at stage New, source
-- website_live_chat, brand of the site, no owner, the transcript as its description; then links it to the chat
-- and notes it on the thread. Runs as the person, so the CRM's own rules decide (admin, management and customer
-- care may). Returns the lead id. PT409 when the chat already has a lead.
create or replace function public.chat_create_lead(target_id uuid)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  c record;
  v_contact uuid;
  v_lead uuid;
begin
  select cc.id, cc.reference, cc.brand_id, cc.visitor_name, cc.lead_id into c
    from public.chat_conversations cc where cc.id = target_id for update;
  if c.id is null then
    raise exception 'chat not found' using errcode = '42501';
  end if;
  if c.lead_id is not null then
    raise exception 'this chat already has a lead' using errcode = 'PT409';
  end if;
  v_contact := public.chat_contact_for(target_id);
  insert into public.crm_leads (title, description, contact_id, brand_id, source, stage)
  values (
    left('Live chat with ' || c.visitor_name, 160),
    left('From live chat ' || c.reference || E'.\n\n' || public.chat_transcript(target_id, 4800), 5000),
    v_contact, c.brand_id, 'website_live_chat', 'new'
  )
  returning id into v_lead;
  update public.chat_conversations set lead_id = v_lead where id = target_id;
  insert into public.chat_messages (conversation_id, sender, body, is_internal)
  values (target_id, 'staff', 'Made a CRM lead from this chat.', true);
  return v_lead;
end;
$$;

revoke all on function public.chat_create_lead(uuid) from public, anon;
grant execute on function public.chat_create_lead(uuid) to authenticated;

-- Makes a complaint from a conversation through public.save_complaint (0007), so the complaints tracker's rules
-- decide (admin and customer care may): brand of the site, the category given, channel website, the visitor as
-- the customer (needs an email or phone on the chat), the transcript as the description. Then links it and notes
-- it on the thread. Returns the complaint id. PT409 when the chat already has a complaint.
create or replace function public.chat_create_complaint(target_id uuid, category text)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  c record;
  v_complaint uuid;
  v_case text;
begin
  select cc.id, cc.reference, cc.brand_id, cc.visitor_name, cc.visitor_email, cc.visitor_phone, cc.complaint_id into c
    from public.chat_conversations cc where cc.id = target_id for update;
  if c.id is null then
    raise exception 'chat not found' using errcode = '42501';
  end if;
  if c.complaint_id is not null then
    raise exception 'this chat already has a complaint' using errcode = 'PT409';
  end if;
  v_complaint := public.save_complaint(null, jsonb_build_object(
    'brand_id', c.brand_id,
    'category', category,
    'channel', 'website',
    'description', left('From live chat ' || c.reference || E'.\n\n' || public.chat_transcript(target_id, 4800), 5000),
    'new_contact', jsonb_build_object('full_name', c.visitor_name, 'phone', c.visitor_phone, 'email', c.visitor_email)
  ));
  update public.chat_conversations set complaint_id = v_complaint where id = target_id;
  select x.case_number into v_case from public.complaints x where x.id = v_complaint;
  insert into public.chat_messages (conversation_id, sender, body, is_internal)
  values (target_id, 'staff', 'Logged complaint ' || coalesce(v_case, '') || ' from this chat.', true);
  return v_complaint;
end;
$$;

revoke all on function public.chat_create_complaint(uuid, text) from public, anon;
grant execute on function public.chat_create_complaint(uuid, text) to authenticated;

reset client_min_messages;
