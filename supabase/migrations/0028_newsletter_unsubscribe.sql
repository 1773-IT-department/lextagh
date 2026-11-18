-- 0028_newsletter_unsubscribe: newsletter unsubscribe (Drive requests P4, approved by Desmond 17 November 2026).
--
-- Why: Lexta's routing table says "Newsletter / educational updates: Opt-in only; marketing list, unsubscribe and
-- privacy notice required" (lexta/website-copy.md:46). Sign ups already land in the CRM as contacts with marketing
-- consent (submit_website_enquiry('newsletter'), 0006); this adds the way out.
--
-- What it adds:
--   public.crm_newsletter_tokens            one unguessable token per newsletter contact (48 hex characters, 192
--                                           random bits). Every contact with marketing consent gets one: those there
--                                           today now, new ones by trigger. Nobody reads the table over the API.
--   public.crm_contacts.marketing_unsubscribed_at
--                                           when the person last used an unsubscribe link. Set by the database only
--                                           (no column privilege for anyone). Kept when consent is given again later,
--                                           as history; "unsubscribed" means no consent and this set.
--   public.newsletter_unsubscribe(token)    anon: turns marketing consent off (0006's trigger clears consent_at and
--                                           consent_source) and records when. True for a known token (again true if
--                                           already unsubscribed), false otherwise. Nothing else is revealed.
--   public.newsletter_unsubscribe_token(email, issued_at, signature)
--                                           anon, but only for the website servers: the signature is an HMAC of
--                                           "newsletter-token:<lower case email>.<unix seconds>" with the
--                                           CHAT_INTAKE_SECRET every website already has (private.chat_intake_secret,
--                                           0009). The "newsletter-token:" prefix keeps it apart from chat ("chat.",
--                                           "chat-token.") and complaint uploads ("complaint-file:"). Returns the
--                                           token of a subscribed contact with that email, or null. The sites ask
--                                           for it only to put the link in the newsletter acknowledgement email.
--
-- Row Level Security: on for the new table, with no policies. crm_contacts policies are unchanged.
-- Not applied by this branch: the lead applies it.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.crm_contacts add column if not exists marketing_unsubscribed_at timestamptz;
comment on column public.crm_contacts.marketing_unsubscribed_at is
  'When the person last used a newsletter unsubscribe link (0028). Set by the database only.';

create table if not exists public.crm_newsletter_tokens (
  contact_id uuid primary key references public.crm_contacts (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex') check (token ~ '^[0-9a-f]{48}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists crm_newsletter_tokens_set_updated_at on public.crm_newsletter_tokens;
create trigger crm_newsletter_tokens_set_updated_at before update on public.crm_newsletter_tokens
  for each row execute function public.set_updated_at();

alter table public.crm_newsletter_tokens enable row level security;
revoke all on public.crm_newsletter_tokens from public, anon, authenticated;
-- No policies: only the security definer functions below touch tokens.

-- Every contact with marketing consent has a token: those there today, and new ones as consent is given.
insert into public.crm_newsletter_tokens (contact_id)
select c.id from public.crm_contacts c where c.consent_marketing
on conflict (contact_id) do nothing;

create or replace function public.give_newsletter_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.consent_marketing then
    insert into public.crm_newsletter_tokens (contact_id) values (new.id) on conflict (contact_id) do nothing;
  end if;
  return null;
end;
$$;

revoke all on function public.give_newsletter_token() from public, anon, authenticated;

drop trigger if exists crm_contacts_newsletter_token on public.crm_contacts;
create trigger crm_contacts_newsletter_token after insert or update of consent_marketing on public.crm_contacts
  for each row when (new.consent_marketing) execute function public.give_newsletter_token();

-- Unsubscribe ------------------------------------------------------------------------------------------------------
create or replace function public.newsletter_unsubscribe(token text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_contact uuid;
begin
  if token is null or token !~ '^[0-9a-f]{48}$' then
    return false;
  end if;
  select t.contact_id into v_contact from public.crm_newsletter_tokens t where t.token = newsletter_unsubscribe.token;
  if v_contact is null then
    return false;
  end if;
  update public.crm_contacts c
     set consent_marketing = false, marketing_unsubscribed_at = now()
   where c.id = v_contact and (c.consent_marketing or c.marketing_unsubscribed_at is null);
  return true;
end;
$$;

revoke all on function public.newsletter_unsubscribe(text) from public, authenticated;
grant execute on function public.newsletter_unsubscribe(text) to anon;

-- The token for the acknowledgement email. Errors: 55000 not set up (no chat secret), 22023 bad signature or time.
create or replace function public.newsletter_unsubscribe_token(email text, issued_at bigint, signature text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_email text := lower(btrim(coalesce(email, '')));
  v_contact uuid;
  v_token text;
begin
  select s.secret into v_secret from private.chat_intake_secret s where s.id;
  if v_secret is null then
    raise exception 'newsletter tokens are not set up' using errcode = '55000';
  end if;
  if v_email = '' or length(v_email) > 254 or issued_at is null or signature is null or signature !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  -- Compared as HMACs of both values, so the time the comparison takes says nothing about the expected signature.
  if extensions.hmac(encode(extensions.hmac('newsletter-token:' || v_email || '.' || issued_at::text, v_secret, 'sha256'), 'hex'), v_secret, 'sha256')
     <> extensions.hmac(signature, v_secret, 'sha256') then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  if issued_at < extract(epoch from now())::bigint - 300 or issued_at > extract(epoch from now())::bigint + 60 then
    raise exception 'invalid field: issued_at' using errcode = '22023';
  end if;
  -- The contact the newsletter intake matched (0006: by email, oldest first), only while subscribed.
  select c.id into v_contact from public.crm_contacts c
   where lower(c.email) = v_email and c.consent_marketing
   order by c.created_at, c.id limit 1;
  if v_contact is null then
    return null;
  end if;
  insert into public.crm_newsletter_tokens (contact_id) values (v_contact) on conflict (contact_id) do nothing;
  select t.token into v_token from public.crm_newsletter_tokens t where t.contact_id = v_contact;
  return v_token;
end;
$$;

revoke all on function public.newsletter_unsubscribe_token(text, bigint, text) from public, authenticated;
grant execute on function public.newsletter_unsubscribe_token(text, bigint, text) to anon;
