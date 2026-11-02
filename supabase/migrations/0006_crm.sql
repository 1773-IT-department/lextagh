-- 0006_crm: the one shared Lexta CRM (scoreboard item 6).
-- Organisations, contacts, leads with source, stage and owner, and an activity timeline. One CRM for Lexta and
-- every brand: a lead or organisation carries a brand, and people see the brands they work on. It is also where
-- every website form lands later (item 19), through public.submit_website_enquiry(). Nothing is seeded.
-- No prices anywhere: estimated monthly volume is free text.
--
-- Who can do what (CRM roles are admin, management, sales_rep, marketing and customer_care):
--   admin                          read and change everything; reassign owners; the only role that deletes
--   management                     read everything; create and edit everything; reassign owners; no delete
--   sales_rep, marketing           read and work (create, edit, change stage, add activities) the leads and
--                                  organisations of the brands they have access to, anything unbranded, and
--                                  anything they own. Contacts carry no brand, so every CRM role reads them.
--                                  They cannot reassign, except that they may take an unowned lead they can see
--                                  ("Assign to me"). On a lead they do not own they may work the stage and next
--                                  action but not change its brand (claim it first), so nobody can hide an
--                                  unowned lead from another brand's team. They add a brand to an organisation
--                                  only if it already has a brand, or they own it (or added it and nobody owns it),
--                                  and remove only brands they work on. They can only link records they can see.
--   customer_care                  read everything; create contacts, leads and activities (owner empty or
--                                  themselves); no edits, no reassigning, no deletes
--   distributor, hr, no role       nothing at all
--   website visitors (anon)        nothing at all; they can only call public.submit_website_enquiry(), which
--                                  returns a reference string and nothing else
-- created_by and updated_by always come from the session. closed_at is set by the database when a lead is won
-- or lost. A stage change writes a 'status_change' activity automatically; people cannot write that type.

-- Helper functions ----------------------------------------------------------------------
create or replace function public.crm_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'sales_rep', 'marketing', 'customer_care'), false);
$$;

-- Admin, management and customer care read every CRM record.
create or replace function public.crm_reads_all()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'customer_care'), false);
$$;

-- Admin and management edit everything and reassign owners.
create or replace function public.crm_manages()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management'), false);
$$;

-- Sales reps and marketing work the records of their brands, unbranded records and their own.
create or replace function public.crm_works()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('sales_rep', 'marketing'), false);
$$;

revoke all on function public.crm_role() from public, anon;
revoke all on function public.crm_reads_all() from public, anon;
revoke all on function public.crm_manages() from public, anon;
revoke all on function public.crm_works() from public, anon;
grant execute on function public.crm_role() to authenticated;
grant execute on function public.crm_reads_all() to authenticated;
grant execute on function public.crm_manages() to authenticated;
grant execute on function public.crm_works() to authenticated;

-- Phone numbers are matched on their digits, with +233 and 00233 written as a leading 0, so
-- "+233 20 123 4567" and "020 123 4567" are the same number.
create or replace function public.crm_phone_key(phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d = '' then null
    when d ~ '^233[0-9]{9}$' then '0' || substr(d, 4)
    else d
  end
  from (select regexp_replace(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '^00', '') as d) x;
$$;

revoke all on function public.crm_phone_key(text) from public, anon;
grant execute on function public.crm_phone_key(text) to authenticated;

-- Organisations ---------------------------------------------------------------------------
create table public.crm_organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  kind text not null default 'other' check (kind in (
    'distributor', 'retailer', 'supermarket_chain', 'pharmacy', 'institution', 'partner', 'media', 'supplier', 'other'
  )),
  region_id uuid references public.regions (id) on delete set null,
  town text check (town is null or length(btrim(town)) between 1 and 120),
  address text check (address is null or length(btrim(address)) between 1 and 300),
  phone text check (phone is null or phone ~ '^\+?[0-9][0-9 ()-]{5,22}$'),
  email text check (email is null or (length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  website text check (website is null or (length(website) <= 300 and website ~ '^https?://[^[:space:]]+$')),
  stockist_id uuid references public.stockists (id) on delete set null,
  notes text check (notes is null or length(notes) <= 4000),
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create index crm_organisations_name_idx on public.crm_organisations (lower(btrim(name)));
create index crm_organisations_owner_idx on public.crm_organisations (owner_id);
create index crm_organisations_region_idx on public.crm_organisations (region_id);
create index crm_organisations_stockist_idx on public.crm_organisations (stockist_id);
create index crm_organisations_created_by_idx on public.crm_organisations (created_by);
create index crm_organisations_updated_by_idx on public.crm_organisations (updated_by);

-- Brands an organisation is interested in. Product brands only, never the corporate Lexta brand.
create table public.crm_organisation_brands (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.crm_organisations (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, brand_id)
);

create index crm_organisation_brands_brand_idx on public.crm_organisation_brands (brand_id);

-- Contacts ----------------------------------------------------------------------------------
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text check (full_name is null or length(btrim(full_name)) between 1 and 120),
  organisation_id uuid references public.crm_organisations (id) on delete set null,
  job_title text check (job_title is null or length(btrim(job_title)) between 1 and 120),
  phone text check (phone is null or phone ~ '^\+?[0-9][0-9 ()-]{5,22}$'),
  phone_key text generated always as (public.crm_phone_key(phone)) stored,
  email text check (email is null or (length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  preferred_channel text check (preferred_channel is null or preferred_channel in ('phone', 'whatsapp', 'sms', 'email', 'in_person')),
  consent_marketing boolean not null default false,
  consent_at timestamptz,
  consent_source text check (consent_source is null or length(btrim(consent_source)) between 1 and 160),
  notes text check (notes is null or length(notes) <= 4000),
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  -- Someone we can name or reach.
  check (num_nonnulls(full_name, phone, email) >= 1),
  -- Marketing consent always records when and where it was given.
  check (not consent_marketing or (consent_at is not null and consent_source is not null))
);

create index crm_contacts_email_idx on public.crm_contacts (lower(email));
create index crm_contacts_phone_key_idx on public.crm_contacts (phone_key);
create index crm_contacts_organisation_idx on public.crm_contacts (organisation_id);
create index crm_contacts_owner_idx on public.crm_contacts (owner_id);
create index crm_contacts_created_by_idx on public.crm_contacts (created_by);
create index crm_contacts_updated_by_idx on public.crm_contacts (updated_by);

-- Leads -------------------------------------------------------------------------------------
create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text check (description is null or length(description) <= 5000),
  contact_id uuid references public.crm_contacts (id) on delete restrict,
  organisation_id uuid references public.crm_organisations (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete restrict,
  source text not null check (source in (
    'website_contact_form', 'website_partner_form', 'website_newsletter', 'complaint_escalation', 'field_visit',
    'phone', 'email', 'walk_in', 'referral', 'event', 'other'
  )),
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  lost_reason text check (lost_reason is null or length(btrim(lost_reason)) between 1 and 500),
  owner_id uuid references public.profiles (id) on delete set null,
  next_action text check (next_action is null or length(btrim(next_action)) between 1 and 300),
  next_action_date date,
  -- Free text, never a price: for example "about 200 cartons a month".
  estimated_monthly_volume text check (estimated_monthly_volume is null or length(btrim(estimated_monthly_volume)) between 1 and 200),
  intake_reference text unique,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  check (num_nonnulls(contact_id, organisation_id) >= 1),
  check (stage <> 'lost' or lost_reason is not null)
);

create index crm_leads_stage_idx on public.crm_leads (stage);
create index crm_leads_next_action_idx on public.crm_leads (next_action_date);
create index crm_leads_owner_idx on public.crm_leads (owner_id);
create index crm_leads_brand_idx on public.crm_leads (brand_id);
create index crm_leads_contact_idx on public.crm_leads (contact_id);
create index crm_leads_organisation_idx on public.crm_leads (organisation_id);
create index crm_leads_created_by_idx on public.crm_leads (created_by);
create index crm_leads_updated_by_idx on public.crm_leads (updated_by);

-- Activities (the timeline) ---------------------------------------------------------------
create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads (id) on delete cascade,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  organisation_id uuid references public.crm_organisations (id) on delete cascade,
  type text not null check (type in ('note', 'call', 'email', 'meeting', 'visit', 'status_change')),
  body text not null check (length(btrim(body)) between 1 and 4000),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  -- Each activity belongs to exactly one lead, contact or organisation.
  check (num_nonnulls(lead_id, contact_id, organisation_id) = 1)
);

create index crm_activities_lead_idx on public.crm_activities (lead_id, occurred_at desc);
create index crm_activities_contact_idx on public.crm_activities (contact_id, occurred_at desc);
create index crm_activities_organisation_idx on public.crm_activities (organisation_id, occurred_at desc);
create index crm_activities_created_by_idx on public.crm_activities (created_by);

-- Website submissions, kept only to limit abuse (who sent how many in the last hour). Admin reads it.
create table public.crm_intake_log (
  id uuid primary key default gen_random_uuid(),
  form text not null,
  email_key text,
  phone_key text,
  reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_intake_log_email_idx on public.crm_intake_log (email_key, created_at);
create index crm_intake_log_phone_idx on public.crm_intake_log (phone_key, created_at);
create index crm_intake_log_created_idx on public.crm_intake_log (created_at);

-- updated_at ----------------------------------------------------------------------------------
create trigger crm_organisations_set_updated_at before update on public.crm_organisations
  for each row execute function public.set_updated_at();
create trigger crm_organisation_brands_set_updated_at before update on public.crm_organisation_brands
  for each row execute function public.set_updated_at();
create trigger crm_contacts_set_updated_at before update on public.crm_contacts
  for each row execute function public.set_updated_at();
create trigger crm_leads_set_updated_at before update on public.crm_leads
  for each row execute function public.set_updated_at();
create trigger crm_activities_set_updated_at before update on public.crm_activities
  for each row execute function public.set_updated_at();
create trigger crm_intake_log_set_updated_at before update on public.crm_intake_log
  for each row execute function public.set_updated_at();

-- Visibility helpers (security definer, so policies can use them without recursing) -----------
create or replace function public.crm_can_see_lead(target_brand uuid, target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.crm_reads_all()
      or (
        public.crm_works()
        and (
          target_owner = (select auth.uid())
          or target_brand is null
          or public.has_brand_access(target_brand)
        )
      );
$$;

create or replace function public.crm_can_see_lead_id(target_lead uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select public.crm_can_see_lead(l.brand_id, l.owner_id) from public.crm_leads l where l.id = target_lead),
    false
  );
$$;

-- An organisation is visible to a sales rep or marketer when they own it, it has no brand, one of its brands is
-- theirs, or a lead they can see points at it. The row version takes the owner from the row itself, so a policy can
-- use it on a row that is being inserted (insert ... returning checks the new row against the read policy).
create or replace function public.crm_can_see_org_row(target_org uuid, target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.crm_reads_all()
      or (
        public.crm_works()
        and (
          target_owner = (select auth.uid())
          or not exists (select 1 from public.crm_organisation_brands ob where ob.organisation_id = target_org)
          or exists (
            select 1 from public.crm_organisation_brands ob
            where ob.organisation_id = target_org and public.has_brand_access(ob.brand_id)
          )
          or exists (
            select 1 from public.crm_leads l
            where l.organisation_id = target_org and public.crm_can_see_lead(l.brand_id, l.owner_id)
          )
        )
      );
$$;

create or replace function public.crm_can_see_org(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select public.crm_can_see_org_row(o.id, o.owner_id) from public.crm_organisations o where o.id = target_org),
    false
  );
$$;

-- Contacts carry no brand: every CRM role reads them.
create or replace function public.crm_can_see_contact(target_contact uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.crm_role() and exists (select 1 from public.crm_contacts c where c.id = target_contact);
$$;

create or replace function public.crm_can_see_activity(target_lead uuid, target_contact uuid, target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_lead is not null then public.crm_can_see_lead_id(target_lead)
    when target_contact is not null then public.crm_can_see_contact(target_contact)
    when target_org is not null then public.crm_can_see_org(target_org)
    else false
  end;
$$;

-- May this person add this brand to this organisation? Never on an unbranded organisation someone else owns
-- (or added), because that would hide it from every other brand's team.
create or replace function public.crm_can_add_org_brand(target_org uuid, target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.crm_organisations o where o.id = target_org)
     and (
       public.crm_manages()
       or (
         public.crm_works()
         and public.has_brand_access(target_brand)
         and public.crm_can_see_org(target_org)
         and (
           exists (select 1 from public.crm_organisation_brands ob where ob.organisation_id = target_org)
           or exists (
             select 1 from public.crm_organisations o
             where o.id = target_org
               and (o.owner_id = (select auth.uid()) or (o.owner_id is null and o.created_by = (select auth.uid())))
           )
         )
       )
     );
$$;

create or replace function public.crm_can_remove_org_brand(target_org uuid, target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.crm_manages()
      or (public.crm_works() and public.has_brand_access(target_brand) and public.crm_can_see_org(target_org));
$$;

-- An owner must be an active person with a CRM role.
create or replace function public.crm_is_staff(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target_profile and p.is_active
      and p.role in ('admin', 'management', 'sales_rep', 'marketing', 'customer_care')
  );
$$;

-- People who can own CRM records, for owner names and the assign list. Empty for everyone without a CRM role.
create or replace function public.crm_staff()
returns table (id uuid, display_name text, role public.app_role, is_active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email), p.role, p.is_active
  from public.profiles p
  where public.crm_role()
    and p.role in ('admin', 'management', 'sales_rep', 'marketing', 'customer_care')
  order by 2;
$$;

revoke all on function public.crm_can_see_lead(uuid, uuid) from public, anon;
revoke all on function public.crm_can_see_lead_id(uuid) from public, anon;
revoke all on function public.crm_can_see_org(uuid) from public, anon;
revoke all on function public.crm_can_see_org_row(uuid, uuid) from public, anon;
revoke all on function public.crm_can_see_contact(uuid) from public, anon;
revoke all on function public.crm_can_see_activity(uuid, uuid, uuid) from public, anon;
revoke all on function public.crm_can_add_org_brand(uuid, uuid) from public, anon;
revoke all on function public.crm_can_remove_org_brand(uuid, uuid) from public, anon;
revoke all on function public.crm_is_staff(uuid) from public, anon;
revoke all on function public.crm_staff() from public, anon;
grant execute on function public.crm_can_see_lead(uuid, uuid) to authenticated;
grant execute on function public.crm_can_see_lead_id(uuid) to authenticated;
grant execute on function public.crm_can_see_org(uuid) to authenticated;
grant execute on function public.crm_can_see_org_row(uuid, uuid) to authenticated;
grant execute on function public.crm_can_see_contact(uuid) to authenticated;
grant execute on function public.crm_can_see_activity(uuid, uuid, uuid) to authenticated;
grant execute on function public.crm_can_add_org_brand(uuid, uuid) to authenticated;
grant execute on function public.crm_can_remove_org_brand(uuid, uuid) to authenticated;
grant execute on function public.crm_is_staff(uuid) to authenticated;
grant execute on function public.crm_staff() to authenticated;

-- Triggers --------------------------------------------------------------------------------
-- created_by and updated_by always come from the session, never from the browser.
create or replace function public.set_crm_authors()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = old.created_by;
  end if;
  new.updated_by = (select auth.uid());
  return new;
end;
$$;

create or replace function public.set_crm_activity_author()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = old.created_by;
  end if;
  return new;
end;
$$;

create trigger crm_organisations_set_authors before insert or update on public.crm_organisations
  for each row execute function public.set_crm_authors();
create trigger crm_contacts_set_authors before insert or update on public.crm_contacts
  for each row execute function public.set_crm_authors();
create trigger crm_leads_set_authors before insert or update on public.crm_leads
  for each row execute function public.set_crm_authors();
create trigger crm_activities_set_author before insert or update on public.crm_activities
  for each row execute function public.set_crm_activity_author();

-- Owners and links. The rules for people apply to signed in API calls (role "authenticated"); the website intake
-- function runs as the database owner and only ever creates unowned records.
-- Security invoker on purpose: current_user is then the caller's role.
create or replace function public.check_crm_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  owner_changed boolean := true;
  brand_changed boolean := true;
  org_changed boolean := true;
  contact_changed boolean := true;
begin
  if tg_op = 'UPDATE' then
    owner_changed := new.owner_id is distinct from old.owner_id;
    if tg_table_name = 'crm_leads' then
      brand_changed := new.brand_id is distinct from old.brand_id;
      contact_changed := new.contact_id is distinct from old.contact_id;
    end if;
    if tg_table_name in ('crm_leads', 'crm_contacts') then
      org_changed := new.organisation_id is distinct from old.organisation_id;
    end if;
  end if;

  if owner_changed and new.owner_id is not null and not public.crm_is_staff(new.owner_id) then
    raise exception 'the owner must be an active person with a CRM role' using errcode = '23514';
  end if;

  if current_user <> 'authenticated' or public.crm_manages() then
    return new;
  end if;

  -- Owners: only admin and management assign other people. Anyone may create a record for themselves, and sales
  -- and marketing may take an unowned lead they can see.
  if tg_op = 'INSERT' then
    if new.owner_id is not null and new.owner_id is distinct from me then
      raise exception 'only admin and management can assign records to other people' using errcode = '42501';
    end if;
  elsif owner_changed then
    if not (tg_table_name = 'crm_leads' and old.owner_id is null and new.owner_id = me and public.crm_works()) then
      raise exception 'only admin and management can reassign owners' using errcode = '42501';
    end if;
  end if;

  if tg_table_name = 'crm_leads' then
    -- A lead's brand decides who sees it: on an existing lead only its owner may change it, and sales and
    -- marketing only ever pick brands they work on.
    if tg_op = 'UPDATE' and brand_changed and new.owner_id is distinct from me then
      raise exception 'take the lead first (Assign to me) before changing its brand' using errcode = '42501';
    end if;
    if brand_changed and public.crm_works() and new.brand_id is not null and not public.has_brand_access(new.brand_id) then
      raise exception 'you can only use brands you work on' using errcode = '42501';
    end if;
    if org_changed and new.organisation_id is not null and not public.crm_can_see_org(new.organisation_id) then
      raise exception 'organisation not found' using errcode = '42501';
    end if;
    if contact_changed and new.contact_id is not null and not public.crm_can_see_contact(new.contact_id) then
      raise exception 'contact not found' using errcode = '42501';
    end if;
  elsif tg_table_name = 'crm_contacts' then
    if org_changed and new.organisation_id is not null and not public.crm_can_see_org(new.organisation_id) then
      raise exception 'organisation not found' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger crm_organisations_check before insert or update on public.crm_organisations
  for each row execute function public.check_crm_record();
create trigger crm_contacts_check before insert or update on public.crm_contacts
  for each row execute function public.check_crm_record();
create trigger crm_leads_check before insert or update on public.crm_leads
  for each row execute function public.check_crm_record();

-- Consent: the time is set by the database when consent is given, and cleared when it is withdrawn.
create or replace function public.set_crm_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.consent_marketing then
    new.consent_at = now();
    if tg_op = 'UPDATE' then
      if old.consent_marketing then
        new.consent_at = old.consent_at;
      end if;
    end if;
  else
    new.consent_at = null;
    new.consent_source = null;
  end if;
  return new;
end;
$$;

create trigger crm_contacts_set_consent before insert or update on public.crm_contacts
  for each row execute function public.set_crm_consent();

-- Stage bookkeeping: closed_at when won or lost, cleared when reopened; lost_reason only on lost leads.
create or replace function public.set_crm_lead_stage_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage in ('won', 'lost') then
    new.closed_at = now();
    if tg_op = 'UPDATE' then
      if new.stage = old.stage then
        new.closed_at = old.closed_at;
      end if;
    end if;
  else
    new.closed_at = null;
  end if;
  if new.stage <> 'lost' then
    new.lost_reason = null;
  end if;
  return new;
end;
$$;

create trigger crm_leads_set_stage_fields before insert or update on public.crm_leads
  for each row execute function public.set_crm_lead_stage_fields();

-- Every stage change writes a status_change activity on the lead's timeline.
create or replace function public.log_crm_lead_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  label jsonb := '{"new":"New","contacted":"Contacted","qualified":"Qualified","proposal":"Proposal","won":"Won","lost":"Lost"}';
begin
  insert into public.crm_activities (lead_id, type, body)
  values (
    new.id,
    'status_change',
    'Stage changed from ' || (label ->> old.stage) || ' to ' || (label ->> new.stage)
      || case when new.stage = 'lost' then '. Reason: ' || new.lost_reason else '' end
  );
  return null;
end;
$$;

create trigger crm_leads_log_stage_change after update of stage on public.crm_leads
  for each row when (old.stage is distinct from new.stage)
  execute function public.log_crm_lead_stage_change();

-- Organisations are only interested in product brands, never the corporate Lexta brand.
create or replace function public.check_crm_org_brand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.brands b where b.id = new.brand_id and not b.is_corporate) then
    raise exception 'organisations can only be linked to product brands, not the corporate brand' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger crm_organisation_brands_check before insert or update on public.crm_organisation_brands
  for each row execute function public.check_crm_org_brand();

revoke all on function public.set_crm_authors() from public, anon, authenticated;
revoke all on function public.set_crm_activity_author() from public, anon, authenticated;
revoke all on function public.check_crm_record() from public, anon, authenticated;
revoke all on function public.set_crm_consent() from public, anon, authenticated;
revoke all on function public.set_crm_lead_stage_fields() from public, anon, authenticated;
revoke all on function public.log_crm_lead_stage_change() from public, anon, authenticated;
revoke all on function public.check_crm_org_brand() from public, anon, authenticated;

-- Table privileges ------------------------------------------------------------------------
-- Website visitors get nothing. Signed in people may only write the columns a person types; ids, timestamps,
-- authors, closed_at, consent_at, phone_key and intake_reference are set by the database.
revoke all on public.crm_organisations, public.crm_organisation_brands, public.crm_contacts, public.crm_leads,
  public.crm_activities, public.crm_intake_log from anon, authenticated;

grant select, delete on public.crm_organisations, public.crm_organisation_brands, public.crm_contacts,
  public.crm_leads, public.crm_activities to authenticated;
grant select on public.crm_intake_log to authenticated;

grant insert (name, kind, region_id, town, address, phone, email, website, stockist_id, notes, owner_id),
  update (name, kind, region_id, town, address, phone, email, website, stockist_id, notes, owner_id)
  on public.crm_organisations to authenticated;
grant insert (organisation_id, brand_id) on public.crm_organisation_brands to authenticated;
grant insert (full_name, organisation_id, job_title, phone, email, preferred_channel, consent_marketing, consent_source, notes, owner_id),
  update (full_name, organisation_id, job_title, phone, email, preferred_channel, consent_marketing, consent_source, notes, owner_id)
  on public.crm_contacts to authenticated;
grant insert (title, description, contact_id, organisation_id, brand_id, source, stage, lost_reason, owner_id, next_action, next_action_date, estimated_monthly_volume),
  update (title, description, contact_id, organisation_id, brand_id, source, stage, lost_reason, owner_id, next_action, next_action_date, estimated_monthly_volume)
  on public.crm_leads to authenticated;
grant insert (lead_id, contact_id, organisation_id, type, body, occurred_at) on public.crm_activities to authenticated;

-- Row Level Security ----------------------------------------------------------------------
alter table public.crm_organisations enable row level security;
alter table public.crm_organisation_brands enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_intake_log enable row level security;

-- Organisations
create policy "crm roles read organisations they may see"
  on public.crm_organisations for select to authenticated
  using ((select public.crm_can_see_org_row(id, owner_id)));

create policy "managers, sales and marketing create organisations"
  on public.crm_organisations for insert to authenticated
  with check ((select public.crm_manages()) or (select public.crm_works()));

create policy "managers edit all, sales and marketing edit visible orgs"
  on public.crm_organisations for update to authenticated
  using ((select public.crm_manages()) or ((select public.crm_works()) and (select public.crm_can_see_org_row(id, owner_id))))
  with check ((select public.crm_manages()) or ((select public.crm_works()) and (select public.crm_can_see_org_row(id, owner_id))));

create policy "admins delete organisations"
  on public.crm_organisations for delete to authenticated
  using ((select public.is_admin()));

-- Organisation brands
create policy "crm roles read brands of organisations they see"
  on public.crm_organisation_brands for select to authenticated
  using ((select public.crm_can_see_org(organisation_id)));

create policy "add brands to organisations"
  on public.crm_organisation_brands for insert to authenticated
  with check ((select public.crm_can_add_org_brand(organisation_id, brand_id)));

create policy "remove own brands from organisations"
  on public.crm_organisation_brands for delete to authenticated
  using ((select public.crm_can_remove_org_brand(organisation_id, brand_id)));
-- No update policy: a link is removed and added again, never moved.

-- Contacts
create policy "crm roles read contacts"
  on public.crm_contacts for select to authenticated
  using ((select public.crm_role()));

create policy "crm roles create contacts"
  on public.crm_contacts for insert to authenticated
  with check ((select public.crm_role()));

create policy "managers, sales and marketing edit contacts"
  on public.crm_contacts for update to authenticated
  using ((select public.crm_manages()) or (select public.crm_works()))
  with check ((select public.crm_manages()) or (select public.crm_works()));

create policy "admins delete contacts"
  on public.crm_contacts for delete to authenticated
  using ((select public.is_admin()));

-- Leads
create policy "crm roles read leads they may see"
  on public.crm_leads for select to authenticated
  using ((select public.crm_can_see_lead(brand_id, owner_id)));

create policy "crm roles create leads"
  on public.crm_leads for insert to authenticated
  with check (
    (select public.crm_reads_all())
    or ((select public.crm_works()) and (brand_id is null or (select public.has_brand_access(brand_id))))
  );

create policy "managers edit all, sales and marketing edit leads they see"
  on public.crm_leads for update to authenticated
  using ((select public.crm_manages()) or ((select public.crm_works()) and (select public.crm_can_see_lead(brand_id, owner_id))))
  with check ((select public.crm_manages()) or ((select public.crm_works()) and (select public.crm_can_see_lead(brand_id, owner_id))));

create policy "admins delete leads"
  on public.crm_leads for delete to authenticated
  using ((select public.is_admin()));

-- Activities: people write notes, calls, emails, meetings and visits; status changes come from the database.
create policy "crm roles read activities of records they see"
  on public.crm_activities for select to authenticated
  using ((select public.crm_can_see_activity(lead_id, contact_id, organisation_id)));

create policy "crm roles add activities to records they see"
  on public.crm_activities for insert to authenticated
  with check (
    type <> 'status_change'
    and (select public.crm_role())
    and (select public.crm_can_see_activity(lead_id, contact_id, organisation_id))
  );

create policy "admins delete activities"
  on public.crm_activities for delete to authenticated
  using ((select public.is_admin()));
-- No update policy: the timeline is a record of what happened.

-- Intake log
create policy "admins read the intake log"
  on public.crm_intake_log for select to authenticated
  using ((select public.is_admin()));

-- Saving ------------------------------------------------------------------------------------
-- Security invoker: Row Level Security and the triggers decide every write, and any refused write or write that
-- touches no row raises, so the whole save is undone and the portal can tell the person.
create or replace function public.save_crm_organisation(target_id uuid, details jsonb, brand_ids uuid[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid := target_id;
  wanted uuid[] := coalesce(brand_ids, '{}');
  expected integer;
  changed integer;
  t text;
begin
  if details is not null then
    if saved_id is null then
      insert into public.crm_organisations (name, kind, region_id, town, address, phone, email, website, stockist_id, notes, owner_id)
      values (
        btrim(details ->> 'name'),
        coalesce(nullif(details ->> 'kind', ''), 'other'),
        nullif(details ->> 'region_id', '')::uuid,
        nullif(btrim(coalesce(details ->> 'town', '')), ''),
        nullif(btrim(coalesce(details ->> 'address', '')), ''),
        nullif(btrim(coalesce(details ->> 'phone', '')), ''),
        lower(nullif(btrim(coalesce(details ->> 'email', '')), '')),
        nullif(btrim(coalesce(details ->> 'website', '')), ''),
        nullif(details ->> 'stockist_id', '')::uuid,
        nullif(btrim(coalesce(details ->> 'notes', '')), ''),
        nullif(details ->> 'owner_id', '')::uuid
      )
      returning id into saved_id;
    else
      update public.crm_organisations set
        name = btrim(details ->> 'name'),
        kind = coalesce(nullif(details ->> 'kind', ''), 'other'),
        region_id = nullif(details ->> 'region_id', '')::uuid,
        town = nullif(btrim(coalesce(details ->> 'town', '')), ''),
        address = nullif(btrim(coalesce(details ->> 'address', '')), ''),
        phone = nullif(btrim(coalesce(details ->> 'phone', '')), ''),
        email = lower(nullif(btrim(coalesce(details ->> 'email', '')), '')),
        website = nullif(btrim(coalesce(details ->> 'website', '')), ''),
        stockist_id = nullif(details ->> 'stockist_id', '')::uuid,
        notes = nullif(btrim(coalesce(details ->> 'notes', '')), '')
      where id = saved_id;
      get diagnostics changed = row_count;
      if changed = 0 then
        raise exception 'not allowed to change this organisation' using errcode = '42501';
      end if;
    end if;
  elsif saved_id is null then
    raise exception 'a new organisation needs its details' using errcode = '22023';
  end if;

  if brand_ids is not null then
    select count(*) into expected from public.crm_organisation_brands ob
     where ob.organisation_id = saved_id and ob.brand_id <> all (wanted);
    delete from public.crm_organisation_brands ob where ob.organisation_id = saved_id and ob.brand_id <> all (wanted);
    get diagnostics changed = row_count;
    if changed <> expected then
      raise exception 'not allowed to remove a brand from this organisation' using errcode = '42501';
    end if;
    insert into public.crm_organisation_brands (organisation_id, brand_id)
    select saved_id, b from unnest(wanted) as b
    where not exists (select 1 from public.crm_organisation_brands ob where ob.organisation_id = saved_id and ob.brand_id = b)
    on conflict (organisation_id, brand_id) do nothing;
  end if;

  return saved_id;
end;
$$;

create or replace function public.save_crm_contact(target_id uuid, details jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid := target_id;
  changed integer;
  consent boolean := coalesce((details ->> 'consent_marketing')::boolean, false);
begin
  if details is null then
    raise exception 'contact details are missing' using errcode = '22023';
  end if;
  if saved_id is null then
    insert into public.crm_contacts (full_name, organisation_id, job_title, phone, email, preferred_channel, consent_marketing, consent_source, notes, owner_id)
    values (
      nullif(btrim(coalesce(details ->> 'full_name', '')), ''),
      nullif(details ->> 'organisation_id', '')::uuid,
      nullif(btrim(coalesce(details ->> 'job_title', '')), ''),
      nullif(btrim(coalesce(details ->> 'phone', '')), ''),
      lower(nullif(btrim(coalesce(details ->> 'email', '')), '')),
      nullif(details ->> 'preferred_channel', ''),
      consent,
      case when consent then nullif(btrim(coalesce(details ->> 'consent_source', '')), '') end,
      nullif(btrim(coalesce(details ->> 'notes', '')), ''),
      nullif(details ->> 'owner_id', '')::uuid
    )
    returning id into saved_id;
  else
    update public.crm_contacts set
      full_name = nullif(btrim(coalesce(details ->> 'full_name', '')), ''),
      organisation_id = nullif(details ->> 'organisation_id', '')::uuid,
      job_title = nullif(btrim(coalesce(details ->> 'job_title', '')), ''),
      phone = nullif(btrim(coalesce(details ->> 'phone', '')), ''),
      email = lower(nullif(btrim(coalesce(details ->> 'email', '')), '')),
      preferred_channel = nullif(details ->> 'preferred_channel', ''),
      consent_marketing = consent,
      consent_source = case when consent then nullif(btrim(coalesce(details ->> 'consent_source', '')), '') end,
      notes = nullif(btrim(coalesce(details ->> 'notes', '')), '')
    where id = saved_id;
    get diagnostics changed = row_count;
    if changed = 0 then
      raise exception 'not allowed to change this contact' using errcode = '42501';
    end if;
  end if;
  return saved_id;
end;
$$;

create or replace function public.save_crm_lead(target_id uuid, details jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid := target_id;
  changed integer;
begin
  if details is null then
    raise exception 'lead details are missing' using errcode = '22023';
  end if;
  if saved_id is null then
    insert into public.crm_leads (title, description, contact_id, organisation_id, brand_id, source, stage, lost_reason, owner_id,
                                  next_action, next_action_date, estimated_monthly_volume)
    values (
      btrim(details ->> 'title'),
      nullif(btrim(coalesce(details ->> 'description', '')), ''),
      nullif(details ->> 'contact_id', '')::uuid,
      nullif(details ->> 'organisation_id', '')::uuid,
      nullif(details ->> 'brand_id', '')::uuid,
      details ->> 'source',
      coalesce(nullif(details ->> 'stage', ''), 'new'),
      nullif(btrim(coalesce(details ->> 'lost_reason', '')), ''),
      nullif(details ->> 'owner_id', '')::uuid,
      nullif(btrim(coalesce(details ->> 'next_action', '')), ''),
      nullif(details ->> 'next_action_date', '')::date,
      nullif(btrim(coalesce(details ->> 'estimated_monthly_volume', '')), '')
    )
    returning id into saved_id;
  else
    -- Stage and owner have their own functions (set_crm_lead_stage, set_crm_owner).
    update public.crm_leads set
      title = btrim(details ->> 'title'),
      description = nullif(btrim(coalesce(details ->> 'description', '')), ''),
      contact_id = nullif(details ->> 'contact_id', '')::uuid,
      organisation_id = nullif(details ->> 'organisation_id', '')::uuid,
      brand_id = nullif(details ->> 'brand_id', '')::uuid,
      source = details ->> 'source',
      next_action = nullif(btrim(coalesce(details ->> 'next_action', '')), ''),
      next_action_date = nullif(details ->> 'next_action_date', '')::date,
      estimated_monthly_volume = nullif(btrim(coalesce(details ->> 'estimated_monthly_volume', '')), '')
    where id = saved_id;
    get diagnostics changed = row_count;
    if changed = 0 then
      raise exception 'not allowed to change this lead' using errcode = '42501';
    end if;
  end if;
  return saved_id;
end;
$$;

-- Moves a lead to a stage (and sets the next action in the same step when given). The stage change activity
-- and closed_at come from the triggers.
create or replace function public.set_crm_lead_stage(target_id uuid, new_stage text, reason text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.crm_leads
     set stage = new_stage,
         lost_reason = case when new_stage = 'lost' then nullif(btrim(coalesce(reason, '')), '') end
   where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change this lead' using errcode = '42501';
  end if;
end;
$$;

-- Sets or clears the owner of a lead, contact or organisation. The triggers decide who may.
create or replace function public.set_crm_owner(kind text, target_id uuid, new_owner uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  if kind = 'lead' then
    update public.crm_leads set owner_id = new_owner where id = target_id;
  elsif kind = 'contact' then
    update public.crm_contacts set owner_id = new_owner where id = target_id;
  elsif kind = 'organisation' then
    update public.crm_organisations set owner_id = new_owner where id = target_id;
  else
    raise exception 'unknown record type' using errcode = '22023';
  end if;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change the owner of this record' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.delete_crm_record(kind text, target_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  if kind = 'lead' then
    delete from public.crm_leads where id = target_id;
  elsif kind = 'contact' then
    delete from public.crm_contacts where id = target_id;
  elsif kind = 'organisation' then
    delete from public.crm_organisations where id = target_id;
  else
    raise exception 'unknown record type' using errcode = '22023';
  end if;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to delete this record' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.save_crm_organisation(uuid, jsonb, uuid[]) from public, anon;
revoke all on function public.save_crm_contact(uuid, jsonb) from public, anon;
revoke all on function public.save_crm_lead(uuid, jsonb) from public, anon;
revoke all on function public.set_crm_lead_stage(uuid, text, text) from public, anon;
revoke all on function public.set_crm_owner(text, uuid, uuid) from public, anon;
revoke all on function public.delete_crm_record(text, uuid) from public, anon;
grant execute on function public.save_crm_organisation(uuid, jsonb, uuid[]) to authenticated;
grant execute on function public.save_crm_contact(uuid, jsonb) to authenticated;
grant execute on function public.save_crm_lead(uuid, jsonb) to authenticated;
grant execute on function public.set_crm_lead_stage(uuid, text, text) to authenticated;
grant execute on function public.set_crm_owner(text, uuid, uuid) to authenticated;
grant execute on function public.delete_crm_record(text, uuid) to authenticated;

-- Website intake ----------------------------------------------------------------------------
-- One trimmed text field from a website payload: null when missing or blank; refused when not text or too long.
create or replace function public.crm_intake_text(payload jsonb, field text, max_len integer)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v jsonb := payload -> field;
  s text;
begin
  if v is null or jsonb_typeof(v) = 'null' then
    return null;
  end if;
  if jsonb_typeof(v) <> 'string' then
    raise exception 'invalid field: %', field using errcode = '22023';
  end if;
  -- Control characters go, except line breaks and tabs (messages keep their paragraphs).
  s := btrim(regexp_replace(replace(v #>> '{}', E'\r\n', E'\n'), E'[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]+', ' ', 'g'));
  if s = '' then
    return null;
  end if;
  if length(s) > max_len then
    raise exception 'field too long: %', field using errcode = '22023';
  end if;
  return s;
end;
$$;

revoke all on function public.crm_intake_text(jsonb, text, integer) from public, anon, authenticated;

-- The websites' only way into the CRM (wired to the forms in item 19). Anyone may call it; it never returns data,
-- only a reference string to show the visitor.
--   form 'contact'     website contact form: a contact (found or created) and a lead, source website_contact_form
--   form 'partner'     website partner form: a contact, an organisation (found by name or created) and a lead,
--                      source website_partner_form
--   form 'newsletter'  newsletter sign up: a contact with marketing consent, no lead
-- Payload fields (all text unless said otherwise; unknown fields are refused; at most 8000 bytes in all):
--   every form   honeypot (leave empty; anything in it means a bot: a reference comes back but nothing is saved),
--                brand (slug: lexta, yazz, linzzy, hooch), consent_marketing (boolean)
--   contact      name (required), email and/or phone (one required), message (required, up to 3000),
--                reason (general, distribution, bulk_orders, consumer_care, media, careers), organisation_name,
--                detail (the form's extra field, e.g. products and quantities or batch code), region (slug, or
--                outside-ghana)
--   partner      name (required), organisation_name (required), email and/or phone (one required),
--                partner_type (distributor, retail, institutional, private_label, csr, supplier), location,
--                region (slug), years_trading, estimated_monthly_volume, job_title, organisation_website, message
--   newsletter   email (required), name, consent_marketing (must be true)
-- Existing contacts and organisations are matched (contact by email, then by phone; organisation by name) and
-- only their empty fields are filled in: nothing staff typed is ever overwritten.
-- Errors: 22023 invalid input (the message names the field), PT429 too many submissions (5 per email or phone
-- per hour; PostgREST answers HTTP 429).
create or replace function public.submit_website_enquiry(form text, payload jsonb)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  allowed text[];
  k text;
  v_name text;
  v_email text;
  v_phone text;
  v_message text;
  v_reason text;
  v_org_name text;
  v_detail text;
  v_region_slug text;
  v_region uuid;
  v_region_name text;
  v_partner_type text;
  v_location text;
  v_years text;
  v_volume text;
  v_job text;
  v_org_website text;
  v_brand_slug text;
  v_brand uuid;
  v_brand_name text;
  v_consent boolean := false;
  v_email_key text;
  v_phone_key text;
  v_contact uuid;
  v_org uuid;
  v_ref text;
  v_title text;
  v_desc text;
  v_source_label text;
  v_kind text;
  recent integer;
begin
  if form is null or form not in ('contact', 'partner', 'newsletter') then
    raise exception 'invalid field: form' using errcode = '22023';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'invalid field: payload' using errcode = '22023';
  end if;
  if octet_length(payload::text) > 8000 then
    raise exception 'payload too large' using errcode = '22023';
  end if;

  allowed := case form
    when 'contact' then array['honeypot', 'brand', 'consent_marketing', 'name', 'email', 'phone', 'message', 'reason',
                              'organisation_name', 'detail', 'region']
    when 'partner' then array['honeypot', 'brand', 'consent_marketing', 'name', 'email', 'phone', 'message', 'organisation_name',
                              'partner_type', 'location', 'region', 'years_trading', 'estimated_monthly_volume', 'job_title',
                              'organisation_website']
    else array['honeypot', 'brand', 'consent_marketing', 'name', 'email']
  end;
  for k in select jsonb_object_keys(payload) loop
    if k <> all (allowed) then
      raise exception 'invalid field: %', left(k, 40) using errcode = '22023';
    end if;
  end loop;

  -- A bot filled the hidden field: answer like a success, save nothing.
  if public.crm_intake_text(payload, 'honeypot', 500) is not null then
    return 'LX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  end if;

  if payload ? 'consent_marketing' then
    if jsonb_typeof(payload -> 'consent_marketing') <> 'boolean' then
      raise exception 'invalid field: consent_marketing' using errcode = '22023';
    end if;
    v_consent := (payload ->> 'consent_marketing')::boolean;
  end if;

  v_name := public.crm_intake_text(payload, 'name', 120);
  v_email := lower(public.crm_intake_text(payload, 'email', 254));
  v_phone := public.crm_intake_text(payload, 'phone', 24);
  v_message := public.crm_intake_text(payload, 'message', 3000);
  v_reason := public.crm_intake_text(payload, 'reason', 40);
  v_org_name := public.crm_intake_text(payload, 'organisation_name', 160);
  v_detail := public.crm_intake_text(payload, 'detail', 300);
  v_region_slug := lower(public.crm_intake_text(payload, 'region', 60));
  v_partner_type := public.crm_intake_text(payload, 'partner_type', 40);
  v_location := public.crm_intake_text(payload, 'location', 120);
  v_years := public.crm_intake_text(payload, 'years_trading', 20);
  v_volume := public.crm_intake_text(payload, 'estimated_monthly_volume', 200);
  v_job := public.crm_intake_text(payload, 'job_title', 120);
  v_org_website := public.crm_intake_text(payload, 'organisation_website', 300);
  v_brand_slug := lower(public.crm_intake_text(payload, 'brand', 60));

  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9][0-9 ()-]{5,22}$' then
    raise exception 'invalid field: phone' using errcode = '22023';
  end if;
  if v_org_website is not null and v_org_website !~ '^https?://[^[:space:]]+$' then
    raise exception 'invalid field: organisation_website' using errcode = '22023';
  end if;
  if v_reason is not null and v_reason not in ('general', 'distribution', 'bulk_orders', 'consumer_care', 'media', 'careers') then
    raise exception 'invalid field: reason' using errcode = '22023';
  end if;
  if v_partner_type is not null and v_partner_type not in ('distributor', 'retail', 'institutional', 'private_label', 'csr', 'supplier') then
    raise exception 'invalid field: partner_type' using errcode = '22023';
  end if;
  if v_brand_slug is not null then
    select b.id, b.name into v_brand, v_brand_name from public.brands b where b.slug = v_brand_slug and b.is_active;
    if v_brand is null then
      raise exception 'invalid field: brand' using errcode = '22023';
    end if;
  end if;
  if v_region_slug is not null and v_region_slug <> 'outside-ghana' then
    select r.id, r.name into v_region, v_region_name from public.regions r where r.slug = v_region_slug;
    if v_region is null then
      raise exception 'invalid field: region' using errcode = '22023';
    end if;
  elsif v_region_slug = 'outside-ghana' then
    v_region_name := 'Outside Ghana';
  end if;

  if form = 'newsletter' then
    if v_email is null then
      raise exception 'invalid field: email' using errcode = '22023';
    end if;
    if not v_consent then
      raise exception 'invalid field: consent_marketing' using errcode = '22023';
    end if;
  else
    if v_name is null then
      raise exception 'invalid field: name' using errcode = '22023';
    end if;
    if v_email is null and v_phone is null then
      raise exception 'invalid field: email' using errcode = '22023';
    end if;
    if form = 'contact' and v_message is null then
      raise exception 'invalid field: message' using errcode = '22023';
    end if;
    if form = 'partner' and v_org_name is null then
      raise exception 'invalid field: organisation_name' using errcode = '22023';
    end if;
  end if;

  -- Abuse guard: at most 5 submissions per email or phone number in an hour.
  v_email_key := v_email;
  v_phone_key := public.crm_phone_key(v_phone);
  select count(*) into recent from public.crm_intake_log il
   where il.created_at > now() - interval '1 hour'
     and ((v_email_key is not null and il.email_key = v_email_key) or (v_phone_key is not null and il.phone_key = v_phone_key));
  if recent >= 5 then
    raise exception 'too many submissions, please try again later' using errcode = 'PT429';
  end if;
  -- The log is only for the guard; old rows are not needed.
  delete from public.crm_intake_log il where il.created_at < now() - interval '30 days';

  v_ref := case form when 'contact' then 'ENQ-' when 'partner' then 'PTN-' else 'NWS-' end
           || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_source_label := case form
    when 'contact' then 'Website contact form'
    when 'partner' then 'Website partner form'
    else 'Website newsletter'
  end || coalesce(' (' || v_brand_name || ')', '');

  -- Organisation (partner form, or a contact form that names one): matched by name, else created unowned.
  if v_org_name is not null and form <> 'newsletter' then
    select o.id into v_org from public.crm_organisations o
     where lower(btrim(o.name)) = lower(v_org_name)
     order by o.created_at, o.id limit 1;
    v_kind := case v_partner_type
      when 'distributor' then 'distributor'
      when 'retail' then 'retailer'
      when 'institutional' then 'institution'
      when 'private_label' then 'partner'
      when 'csr' then 'partner'
      when 'supplier' then 'supplier'
      else case when v_reason = 'media' then 'media' when v_reason = 'distribution' then 'distributor' else 'other' end
    end;
    if v_org is null then
      insert into public.crm_organisations (name, kind, region_id, town, website)
      values (v_org_name, v_kind, v_region, v_location, v_org_website)
      returning id into v_org;
    else
      update public.crm_organisations o set
        region_id = coalesce(o.region_id, v_region),
        town = coalesce(o.town, v_location),
        website = coalesce(o.website, v_org_website)
      where o.id = v_org
        and ((o.region_id is null and v_region is not null) or (o.town is null and v_location is not null)
             or (o.website is null and v_org_website is not null));
    end if;
    if v_brand is not null and v_brand_slug <> 'lexta' then
      insert into public.crm_organisation_brands (organisation_id, brand_id)
      select v_org, v_brand where exists (select 1 from public.brands b where b.id = v_brand and not b.is_corporate)
      on conflict (organisation_id, brand_id) do nothing;
    end if;
  end if;

  -- Contact: by email first, then by phone (when that contact has no other email). Only blanks are filled.
  if v_email_key is not null then
    select c.id into v_contact from public.crm_contacts c
     where lower(c.email) = v_email_key
     order by c.created_at, c.id limit 1;
  end if;
  if v_contact is null and v_phone_key is not null then
    select c.id into v_contact from public.crm_contacts c
     where c.phone_key = v_phone_key and (c.email is null or v_email_key is null or lower(c.email) = v_email_key)
     order by c.created_at, c.id limit 1;
  end if;

  if v_contact is null then
    insert into public.crm_contacts (full_name, organisation_id, job_title, phone, email, consent_marketing, consent_source)
    values (v_name, v_org, v_job, v_phone, v_email, v_consent, case when v_consent then v_source_label end)
    returning id into v_contact;
  else
    update public.crm_contacts c set
      full_name = coalesce(c.full_name, v_name),
      organisation_id = coalesce(c.organisation_id, v_org),
      job_title = coalesce(c.job_title, v_job),
      phone = coalesce(c.phone, v_phone),
      email = coalesce(c.email, v_email),
      -- New consent is recorded; an existing yes or no from staff is never turned off from a website form.
      consent_marketing = c.consent_marketing or v_consent,
      consent_source = case when not c.consent_marketing and v_consent then v_source_label else c.consent_source end
    where c.id = v_contact
      and ((c.full_name is null and v_name is not null) or (c.organisation_id is null and v_org is not null)
           or (c.job_title is null and v_job is not null) or (c.phone is null and v_phone is not null)
           or (c.email is null and v_email is not null) or (not c.consent_marketing and v_consent));
  end if;

  if form <> 'newsletter' then
    v_title := case form
      when 'partner' then 'Partner enquiry: ' || coalesce((select o.name from public.crm_organisations o where o.id = v_org), v_org_name)
      else 'Website enquiry from ' || coalesce(v_name, 'a visitor')
    end;
    v_desc := concat_ws(E'\n',
      case v_reason
        when 'general' then 'Reason: General enquiry'
        when 'distribution' then 'Reason: Distribution'
        when 'bulk_orders' then 'Reason: Bulk orders'
        when 'consumer_care' then 'Reason: Consumer care'
        when 'media' then 'Reason: Media'
        when 'careers' then 'Reason: Careers'
      end,
      case v_partner_type
        when 'distributor' then 'Partnership: Distributor'
        when 'retail' then 'Partnership: Retail and trade'
        when 'institutional' then 'Partnership: Institutional and bulk'
        when 'private_label' then 'Partnership: Private label and export'
        when 'csr' then 'Partnership: CSR and community'
        when 'supplier' then 'Partnership: Raw material supplier'
      end,
      'Organisation: ' || v_org_name,
      'Detail: ' || v_detail,
      'Region: ' || v_region_name,
      'Trading location: ' || v_location,
      'Years trading: ' || v_years,
      case when v_message is not null then E'\n' || v_message end
    );
    insert into public.crm_leads (title, description, contact_id, organisation_id, brand_id, source, stage,
                                  estimated_monthly_volume, intake_reference)
    values (
      left(v_title, 160),
      nullif(left(v_desc, 5000), ''),
      v_contact,
      v_org,
      v_brand,
      case form when 'partner' then 'website_partner_form' else 'website_contact_form' end,
      'new',
      v_volume,
      v_ref
    );
  end if;

  insert into public.crm_intake_log (form, email_key, phone_key, reference)
  values (form, v_email_key, v_phone_key, v_ref);

  return v_ref;
end;
$$;

revoke all on function public.submit_website_enquiry(text, jsonb) from public;
grant execute on function public.submit_website_enquiry(text, jsonb) to anon, authenticated;
