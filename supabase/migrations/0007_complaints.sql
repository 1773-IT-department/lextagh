-- 0007_complaints: the complaints tracker (scoreboard item 7).
-- Every complaint gets a case number from the database (LX-<year>-0001, counting from 1 again each year), a brand,
-- a CRM contact, a category, a severity with response and resolution targets, an owner, a status and a timeline.
-- Files (photos, receipts, lab reports) live in the private complaint-files bucket. Website complaints come in only
-- through public.submit_complaint(), which returns the case number and nothing else. Nothing is seeded.
--
-- Who can do what:
--   admin                          read, create, edit, change status, assign anyone, upload files; the only role that
--                                  deletes (complaints, timeline entries and files)
--   customer_care                  read every complaint; create, edit, change status (acknowledge, investigate,
--                                  resolve, close, reopen); upload files; take an unassigned case ("Assign to me")
--   management                     read every complaint; assign or reassign the owner; add notes. Nothing else.
--   sales_rep, marketing           read the complaints of the brands they work on (the corporate Lexta brand counts
--                                  as a brand) and their files; add notes, calls and emails to the timeline. They
--                                  cannot edit, change status, close or assign.
--   hr, distributor, no role       nothing at all
--   website visitors (anon)        nothing at all; they can only call public.submit_complaint()
-- Owners are active admin or customer care people (the people who work cases).
-- Database set, never typed: case_number, response_due_at, resolution_due_at, first_response_at, resolved_at,
-- closed_at, created_at, updated_at, created_by, updated_by. A health or safety concern is always at least high
-- severity. Resolving needs a resolution summary and the root cause; closing needs a resolution summary; reopening
-- needs a reason and clears resolved_at and closed_at. Status and owner changes are written to the timeline by the
-- database only (people write notes, calls and emails; uploads write "attachment added").
-- Status flow: new, acknowledged, investigating and awaiting customer are open and can move to any other open status
-- (never back to new), to resolved or to closed. Resolved goes to closed or reopened; closed only to reopened;
-- reopened works like an open status. A closed case cannot be edited until it is reopened.
-- Targets from the time the complaint was received, in calendar hours:
--   critical: respond in 4 hours, resolve in 2 days     high: 1 day, 5 days
--   normal:   2 days, 10 days                            low:  3 days, 15 days
-- The first response is the first move out of New.

-- Helper functions ----------------------------------------------------------------------
-- Reads complaints: admin, management, customer care (all brands), sales and marketing (their brands).
create or replace function public.complaint_can_see(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'customer_care'), false)
      or (
        coalesce(public.current_app_role() in ('sales_rep', 'marketing'), false)
        and public.has_brand_access(target_brand)
      );
$$;

-- Works cases: create, edit, change status, upload files.
create or replace function public.complaint_works()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'customer_care'), false);
$$;

-- Assigns and reassigns owners.
create or replace function public.complaint_reassigns()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management'), false);
$$;

-- An owner must be an active admin or customer care person. Only answers for people who read complaints (or
-- database work without a signed in person), so nobody else can probe who works complaints.
create or replace function public.complaint_is_owner_candidate(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (coalesce(public.current_app_role() in ('admin', 'management', 'customer_care', 'sales_rep', 'marketing'), false)
          or (select auth.uid()) is null)
     and exists (
       select 1 from public.profiles p
       where p.id = target_profile and p.is_active and p.role in ('admin', 'customer_care')
     );
$$;

-- Storage paths are <complaint id>/<file name>. Null when the path is not in that shape.
create or replace function public.complaint_id_from_path(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,119}$'
      then split_part(object_name, '/', 1)::uuid
  end;
$$;

revoke all on function public.complaint_can_see(uuid) from public, anon;
revoke all on function public.complaint_works() from public, anon;
revoke all on function public.complaint_reassigns() from public, anon;
revoke all on function public.complaint_is_owner_candidate(uuid) from public, anon;
revoke all on function public.complaint_id_from_path(text) from public, anon;
grant execute on function public.complaint_can_see(uuid) to authenticated;
grant execute on function public.complaint_works() to authenticated;
grant execute on function public.complaint_reassigns() to authenticated;
grant execute on function public.complaint_is_owner_candidate(uuid) to authenticated;
grant execute on function public.complaint_id_from_path(text) to authenticated;

-- Case numbers --------------------------------------------------------------------------------
-- One row per year. Taking a number updates the year's row, which locks it until the transaction ends, so two
-- complaints saved at the same moment always get different numbers. Nobody reads or writes this table over the API.
create table public.complaint_case_counters (
  year integer primary key check (year between 2000 and 9999),
  last_number integer not null check (last_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger complaint_case_counters_set_updated_at before update on public.complaint_case_counters
  for each row execute function public.set_updated_at();

create or replace function public.next_complaint_case_number(case_year integer)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.complaint_case_counters as cc (year, last_number)
  values (case_year, 1)
  on conflict (year) do update set last_number = cc.last_number + 1
  returning cc.last_number into n;
  -- Four digits at least; a year with more than 9999 complaints simply gets longer numbers.
  return 'LX-' || case_year::text || '-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end;
end;
$$;

revoke all on function public.next_complaint_case_number(integer) from public, anon, authenticated;

-- Complaints ------------------------------------------------------------------------------------
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique check (case_number ~ '^LX-[0-9]{4}-[0-9]{4,}$'),
  -- A product brand, or the corporate Lexta brand for anything not about one brand.
  brand_id uuid not null references public.brands (id) on delete restrict,
  product_id uuid references public.products (id) on delete set null,
  sku_id uuid references public.product_skus (id) on delete set null,
  batch_number text check (batch_number is null or length(btrim(batch_number)) between 1 and 60),
  -- Where it was bought: a stockist from Where to Buy, or what the customer said.
  stockist_id uuid references public.stockists (id) on delete set null,
  purchase_place text check (purchase_place is null or length(btrim(purchase_place)) between 1 and 200),
  purchase_date date check (purchase_date is null or purchase_date >= date '2000-01-01'),
  category text not null check (category in (
    'product_quality', 'packaging', 'foreign_object', 'health_safety', 'availability', 'pricing_in_shop',
    'staff_service', 'delivery', 'other'
  )),
  severity text not null default 'normal' check (severity in ('low', 'normal', 'high', 'critical')),
  channel text not null check (channel in (
    'website', 'phone', 'email', 'walk_in', 'social_media', 'field_visit', 'distributor', 'other'
  )),
  description text not null check (length(btrim(description)) between 1 and 5000),
  contact_id uuid not null references public.crm_contacts (id) on delete restrict,
  organisation_id uuid references public.crm_organisations (id) on delete restrict,
  status text not null default 'new' check (status in (
    'new', 'acknowledged', 'investigating', 'awaiting_customer', 'resolved', 'closed', 'reopened'
  )),
  owner_id uuid references public.profiles (id) on delete set null,
  response_due_at timestamptz not null,
  resolution_due_at timestamptz not null,
  first_response_at timestamptz,
  resolution_summary text check (resolution_summary is null or length(btrim(resolution_summary)) between 1 and 3000),
  root_cause text check (root_cause is null or length(btrim(root_cause)) between 1 and 2000),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  check (sku_id is null or product_id is not null),
  check (status not in ('resolved', 'closed') or resolution_summary is not null),
  check (status <> 'resolved' or root_cause is not null),
  check ((status = 'closed') = (closed_at is not null)),
  check (category <> 'health_safety' or severity in ('high', 'critical'))
);

create index complaints_status_idx on public.complaints (status, created_at desc);
create index complaints_brand_idx on public.complaints (brand_id);
create index complaints_owner_idx on public.complaints (owner_id);
create index complaints_contact_idx on public.complaints (contact_id);
create index complaints_organisation_idx on public.complaints (organisation_id);
create index complaints_product_idx on public.complaints (product_id);
create index complaints_sku_idx on public.complaints (sku_id);
create index complaints_stockist_idx on public.complaints (stockist_id);
create index complaints_resolution_due_idx on public.complaints (resolution_due_at);
create index complaints_created_by_idx on public.complaints (created_by);
create index complaints_updated_by_idx on public.complaints (updated_by);

create or replace function public.complaint_can_see_id(target_complaint uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select public.complaint_can_see(c.brand_id) from public.complaints c where c.id = target_complaint),
    false
  );
$$;

revoke all on function public.complaint_can_see_id(uuid) from public, anon;
grant execute on function public.complaint_can_see_id(uuid) to authenticated;

-- Timeline ------------------------------------------------------------------------------------
create table public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  type text not null check (type in ('note', 'call', 'email', 'status_change', 'owner_change', 'attachment_added')),
  body text not null check (length(btrim(body)) between 1 and 4000),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index complaint_events_complaint_idx on public.complaint_events (complaint_id, occurred_at desc);
create index complaint_events_created_by_idx on public.complaint_events (created_by);

-- Files ---------------------------------------------------------------------------------------
create table public.complaint_files (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(btrim(file_name)) between 1 and 200),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (public.complaint_id_from_path(storage_path) = complaint_id)
);

create index complaint_files_complaint_idx on public.complaint_files (complaint_id, created_at);
create index complaint_files_created_by_idx on public.complaint_files (created_by);

-- updated_at and authors --------------------------------------------------------------------------
create trigger complaints_set_updated_at before update on public.complaints
  for each row execute function public.set_updated_at();
create trigger complaint_events_set_updated_at before update on public.complaint_events
  for each row execute function public.set_updated_at();
create trigger complaint_files_set_updated_at before update on public.complaint_files
  for each row execute function public.set_updated_at();

-- Same author rules as the CRM (0006): from the session; the website intake keeps updated_by as it was.
create trigger complaints_set_authors before insert or update on public.complaints
  for each row execute function public.set_crm_authors();
create trigger complaint_events_set_author before insert or update on public.complaint_events
  for each row execute function public.set_crm_activity_author();
create trigger complaint_files_set_author before insert or update on public.complaint_files
  for each row execute function public.set_crm_activity_author();

-- Case number, targets and status times --------------------------------------------------------------
-- Triggers on a table fire in name order: complaints_a_number, complaints_b_check, complaints_c_derive, then the
-- shared updated_at and author triggers.
-- Security definer so it can take a number; people cannot call next_complaint_case_number() themselves.
create or replace function public.set_complaint_case_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    -- Ghana time is UTC all year, so the year of the complaint is the UTC year.
    new.case_number := public.next_complaint_case_number(extract(year from new.created_at at time zone 'UTC')::integer);
  else
    new.case_number := old.case_number;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger complaints_a_number before insert or update on public.complaints
  for each row execute function public.set_complaint_case_number();

-- Rules for every write. Status flow and the reopen reason apply to everyone; the rules for people apply to signed
-- in API calls (role "authenticated"). Security invoker on purpose: current_user is then the caller's role.
create or replace function public.check_complaint()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  my_role public.app_role := public.current_app_role();
  open_statuses text[] := array['new', 'acknowledged', 'investigating', 'awaiting_customer', 'reopened'];
  owner_changed boolean := tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id;
  status_changed boolean := tg_op = 'INSERT' or new.status is distinct from old.status;
  others_changed boolean := false;
begin
  if tg_op = 'UPDATE' then
    others_changed := (to_jsonb(new) - array['owner_id', 'updated_at', 'updated_by'])
                      is distinct from (to_jsonb(old) - array['owner_id', 'updated_at', 'updated_by']);
  end if;

  -- Status flow.
  if tg_op = 'INSERT' then
    if new.status <> 'new' then
      raise exception 'a complaint starts as new' using errcode = '23514';
    end if;
  elsif status_changed then
    if not (
      (old.status = any (open_statuses) and new.status in ('acknowledged', 'investigating', 'awaiting_customer', 'resolved', 'closed'))
      or (old.status = 'resolved' and new.status in ('closed', 'reopened'))
      or (old.status = 'closed' and new.status = 'reopened')
    ) then
      raise exception 'a complaint cannot move from % to %', old.status, new.status using errcode = '23514';
    end if;
    if new.status = 'reopened' and coalesce(btrim(current_setting('lexta.complaint_note', true)), '') = '' then
      raise exception 'give a reason to reopen the complaint' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.status = 'closed' and new.status = 'closed' and others_changed then
    raise exception 'reopen the complaint before changing it' using errcode = '23514';
  end if;

  -- Owners are active admin or customer care people.
  if owner_changed and new.owner_id is not null and not public.complaint_is_owner_candidate(new.owner_id) then
    raise exception 'the owner must be an active admin or customer care person' using errcode = '23514';
  end if;

  -- Product, SKU and brand belong together.
  if new.product_id is not null and (tg_op = 'INSERT' or new.product_id is distinct from old.product_id
                                     or new.brand_id is distinct from old.brand_id) then
    if not public.complaint_product_matches(new.product_id, new.brand_id) then
      raise exception 'the product is not one of this brand''s products' using errcode = '23514';
    end if;
  end if;
  if new.sku_id is not null and (tg_op = 'INSERT' or new.sku_id is distinct from old.sku_id
                                 or new.product_id is distinct from old.product_id) then
    if not public.complaint_sku_matches(new.sku_id, new.product_id) then
      raise exception 'the SKU is not one of this product''s SKUs' using errcode = '23514';
    end if;
  end if;
  if new.purchase_date is not null and new.purchase_date > (now() at time zone 'UTC')::date
     and (tg_op = 'INSERT' or new.purchase_date is distinct from old.purchase_date) then
    raise exception 'the purchase date is in the future' using errcode = '23514';
  end if;

  if current_user <> 'authenticated' then
    return new;
  end if;

  -- People. Management only (re)assigns; changing anything else needs admin or customer care.
  if tg_op = 'INSERT' then
    if not public.complaint_works() then
      raise exception 'only admin and customer care create complaints' using errcode = '42501';
    end if;
  else
    if (others_changed or status_changed) and not public.complaint_works() then
      raise exception 'only admin and customer care change complaints' using errcode = '42501';
    end if;
  end if;

  if owner_changed and not public.complaint_reassigns() then
    -- Customer care may create a case for themselves or take an unassigned one.
    if not (my_role = 'customer_care' and new.owner_id = me and (tg_op = 'INSERT' or old.owner_id is null))
       and not (tg_op = 'INSERT' and new.owner_id is null) then
      raise exception 'only admin and management can assign complaints to other people' using errcode = '42501';
    end if;
  end if;

  if (tg_op = 'INSERT' or new.contact_id is distinct from old.contact_id) and not public.crm_can_see_contact(new.contact_id) then
    raise exception 'contact not found' using errcode = '42501';
  end if;
  if new.organisation_id is not null and (tg_op = 'INSERT' or new.organisation_id is distinct from old.organisation_id)
     and not public.crm_can_see_org(new.organisation_id) then
    raise exception 'organisation not found' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.complaint_product_matches(target_product uuid, target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.products p where p.id = target_product and p.brand_id = target_brand);
$$;

create or replace function public.complaint_sku_matches(target_sku uuid, target_product uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.product_skus s where s.id = target_sku and s.product_id = target_product);
$$;

revoke all on function public.complaint_product_matches(uuid, uuid) from public, anon;
revoke all on function public.complaint_sku_matches(uuid, uuid) from public, anon;
grant execute on function public.complaint_product_matches(uuid, uuid) to authenticated;
grant execute on function public.complaint_sku_matches(uuid, uuid) to authenticated;

create trigger complaints_b_check before insert or update on public.complaints
  for each row execute function public.check_complaint();

-- Severity floor, targets and status times.
create or replace function public.set_complaint_derived()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category = 'health_safety' and new.severity in ('low', 'normal') then
    new.severity := 'high';
  end if;

  new.response_due_at := new.created_at + case new.severity
    when 'critical' then interval '4 hours' when 'high' then interval '1 day'
    when 'normal' then interval '2 days' else interval '3 days' end;
  new.resolution_due_at := new.created_at + case new.severity
    when 'critical' then interval '2 days' when 'high' then interval '5 days'
    when 'normal' then interval '10 days' else interval '15 days' end;

  if tg_op = 'INSERT' then
    new.first_response_at := null;
    new.resolved_at := null;
    new.closed_at := null;
    return new;
  end if;

  new.first_response_at := old.first_response_at;
  new.resolved_at := old.resolved_at;
  new.closed_at := old.closed_at;
  if new.status is distinct from old.status then
    if old.status = 'new' and new.first_response_at is null then
      new.first_response_at := now();
    end if;
    if new.status = 'resolved' then
      new.resolved_at := now();
      new.closed_at := null;
    elsif new.status = 'closed' then
      new.resolved_at := coalesce(old.resolved_at, now());
      new.closed_at := now();
    elsif new.status = 'reopened' then
      new.resolved_at := null;
      new.closed_at := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger complaints_c_derive before insert or update on public.complaints
  for each row execute function public.set_complaint_derived();

-- Timeline entries the database writes: opening, status changes, owner changes and uploads.
create or replace function public.complaint_staff_name(target_profile uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.full_name), ''), p.email) from public.profiles p where p.id = target_profile;
$$;

revoke all on function public.complaint_staff_name(uuid) from public, anon, authenticated;

create or replace function public.complaint_status_label(status text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case status
    when 'new' then 'New' when 'acknowledged' then 'Acknowledged' when 'investigating' then 'Investigating'
    when 'awaiting_customer' then 'Awaiting customer' when 'resolved' then 'Resolved' when 'closed' then 'Closed'
    when 'reopened' then 'Reopened' else status end;
$$;

revoke all on function public.complaint_status_label(text) from public, anon;
grant execute on function public.complaint_status_label(text) to authenticated;

create or replace function public.log_complaint_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  note text := nullif(btrim(coalesce(current_setting('lexta.complaint_note', true), '')), '');
begin
  if tg_op = 'INSERT' then
    insert into public.complaint_events (complaint_id, type, body)
    values (new.id, 'status_change', 'Case ' || new.case_number || ' opened. Channel: ' || case new.channel
      when 'website' then 'Website' when 'phone' then 'Phone' when 'email' then 'Email' when 'walk_in' then 'Walk in'
      when 'social_media' then 'Social media' when 'field_visit' then 'Field visit' when 'distributor' then 'Distributor'
      else 'Other' end);
    if new.owner_id is not null then
      insert into public.complaint_events (complaint_id, type, body)
      values (new.id, 'owner_change', 'Assigned to ' || coalesce(public.complaint_staff_name(new.owner_id), 'a team member'));
    end if;
    return null;
  end if;

  if new.status is distinct from old.status then
    insert into public.complaint_events (complaint_id, type, body)
    values (new.id, 'status_change', left(
      'Status changed from ' || public.complaint_status_label(old.status) || ' to ' || public.complaint_status_label(new.status)
      || case when new.status = 'resolved' then E'\nResolution: ' || new.resolution_summary || E'\nRoot cause: ' || new.root_cause
              when new.status = 'closed' then E'\nResolution: ' || new.resolution_summary
              else '' end
      || case when note is not null then E'\n' || case when new.status = 'reopened' then 'Reason: ' else 'Note: ' end || note else '' end,
      4000));
    -- The note belongs to this one change.
    perform set_config('lexta.complaint_note', '', true);
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into public.complaint_events (complaint_id, type, body)
    values (new.id, 'owner_change', case when new.owner_id is null then 'Owner cleared'
      else 'Assigned to ' || coalesce(public.complaint_staff_name(new.owner_id), 'a team member') end);
  end if;
  return null;
end;
$$;

create trigger complaints_log_insert after insert on public.complaints
  for each row execute function public.log_complaint_change();
create trigger complaints_log_change after update of status, owner_id on public.complaints
  for each row when (old.status is distinct from new.status or old.owner_id is distinct from new.owner_id)
  execute function public.log_complaint_change();

create or replace function public.log_complaint_file()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.complaint_events (complaint_id, type, body)
  values (new.complaint_id, 'attachment_added', 'File added: ' || new.file_name);
  return null;
end;
$$;

create trigger complaint_files_log after insert on public.complaint_files
  for each row execute function public.log_complaint_file();

-- A file record needs its file in the bucket first.
create or replace function public.complaint_file_uploaded(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from storage.objects o where o.bucket_id = 'complaint-files' and o.name = object_name);
$$;

revoke all on function public.complaint_file_uploaded(text) from public, anon;
grant execute on function public.complaint_file_uploaded(text) to authenticated;

revoke all on function public.set_complaint_case_number() from public, anon, authenticated;
revoke all on function public.check_complaint() from public, anon, authenticated;
revoke all on function public.set_complaint_derived() from public, anon, authenticated;
revoke all on function public.log_complaint_change() from public, anon, authenticated;
revoke all on function public.log_complaint_file() from public, anon, authenticated;

-- Table privileges ------------------------------------------------------------------------
-- Website visitors get nothing. Signed in people may only write the columns a person types.
revoke all on public.complaints, public.complaint_events, public.complaint_files, public.complaint_case_counters
  from anon, authenticated;

grant select, delete on public.complaints, public.complaint_events, public.complaint_files to authenticated;
grant insert (brand_id, product_id, sku_id, batch_number, stockist_id, purchase_place, purchase_date, category, severity,
              channel, description, contact_id, organisation_id, owner_id),
  update (brand_id, product_id, sku_id, batch_number, stockist_id, purchase_place, purchase_date, category, severity,
          channel, description, contact_id, organisation_id, owner_id, status, resolution_summary, root_cause)
  on public.complaints to authenticated;
grant insert (complaint_id, type, body, occurred_at) on public.complaint_events to authenticated;
grant insert (complaint_id, storage_path, file_name, mime_type, size_bytes) on public.complaint_files to authenticated;

-- Row Level Security ----------------------------------------------------------------------
alter table public.complaints enable row level security;
alter table public.complaint_events enable row level security;
alter table public.complaint_files enable row level security;
alter table public.complaint_case_counters enable row level security;
-- complaint_case_counters: no policies; only the case number function (security definer) touches it.

create policy "complaint readers read complaints of their brands"
  on public.complaints for select to authenticated
  using ((select public.complaint_can_see(brand_id)));

create policy "admin and customer care create complaints"
  on public.complaints for insert to authenticated
  with check ((select public.complaint_works()));

-- Management may update only to reassign (check_complaint refuses any other change from them).
create policy "admin and customer care work complaints, management reassigns"
  on public.complaints for update to authenticated
  using ((select public.complaint_works()) or (select public.complaint_reassigns()))
  with check ((select public.complaint_works()) or (select public.complaint_reassigns()));

create policy "admins delete complaints"
  on public.complaints for delete to authenticated
  using ((select public.is_admin()));

create policy "complaint readers read the timeline of complaints they see"
  on public.complaint_events for select to authenticated
  using ((select public.complaint_can_see_id(complaint_id)));

create policy "complaint readers add notes, calls and emails"
  on public.complaint_events for insert to authenticated
  with check (type in ('note', 'call', 'email') and (select public.complaint_can_see_id(complaint_id)));

create policy "admins delete timeline entries"
  on public.complaint_events for delete to authenticated
  using ((select public.is_admin()));
-- No update policy: the timeline is a record of what happened.

create policy "complaint readers read file records of complaints they see"
  on public.complaint_files for select to authenticated
  using ((select public.complaint_can_see_id(complaint_id)));

create policy "admin and customer care add files"
  on public.complaint_files for insert to authenticated
  with check (
    (select public.complaint_works())
    and (select public.complaint_can_see_id(complaint_id))
    and (select public.complaint_file_uploaded(storage_path))
  );

create policy "admins delete file records"
  on public.complaint_files for delete to authenticated
  using ((select public.is_admin()));

-- Storage: complaint-files bucket ----------------------------------------------------------------
-- Private: files are only ever served through short lived signed links, made for people who can see the complaint.
-- Path: <complaint id>/<file name>. Images and PDFs, up to 10 MB. No overwriting; only admins remove files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-files', 'complaint-files', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "complaint readers read complaint files"
  on storage.objects for select to authenticated
  using (bucket_id = 'complaint-files' and (select public.complaint_can_see_id(public.complaint_id_from_path(name))));

create policy "admin and customer care upload complaint files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-files'
    and (select public.complaint_works())
    and (select public.complaint_can_see_id(public.complaint_id_from_path(name)))
  );

create policy "admins delete complaint files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'complaint-files' and (select public.is_admin()));

-- Saving ------------------------------------------------------------------------------------
-- Security invoker: Row Level Security and the triggers decide every write, and any refused write or write that
-- touches no row raises, so the whole save is undone and the portal can tell the person.
-- details: brand_id, product_id, sku_id, batch_number, stockist_id, purchase_place, purchase_date, category,
--   severity, channel, description, contact_id, organisation_id; on a new complaint also owner_id, and new_contact
--   ({full_name, phone, email}) when contact_id is empty: an existing contact with that email (or phone) is used,
--   otherwise one is created. Existing contacts are never changed here. On an update product_id and sku_id may be
--   'keep' (the linked product is hidden from the editor's list).
create or replace function public.save_complaint(target_id uuid, details jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid := target_id;
  v_contact uuid := nullif(details ->> 'contact_id', '')::uuid;
  nc jsonb := details -> 'new_contact';
  v_name text;
  v_phone text;
  v_email text;
  changed integer;
begin
  if details is null or jsonb_typeof(details) <> 'object' then
    raise exception 'complaint details are missing' using errcode = '22023';
  end if;
  if saved_id is null then
    if v_contact is null then
      if nc is null or jsonb_typeof(nc) <> 'object' then
        raise exception 'choose a contact or enter the customer''s details' using errcode = '22023';
      end if;
      v_name := nullif(btrim(coalesce(nc ->> 'full_name', '')), '');
      v_phone := nullif(btrim(coalesce(nc ->> 'phone', '')), '');
      v_email := lower(nullif(btrim(coalesce(nc ->> 'email', '')), ''));
      if v_phone is null and v_email is null then
        raise exception 'enter a phone number or an email address for the customer' using errcode = '22023';
      end if;
      if v_email is not null then
        select c.id into v_contact from public.crm_contacts c where lower(c.email) = v_email order by c.created_at, c.id limit 1;
      end if;
      if v_contact is null and v_phone is not null then
        select c.id into v_contact from public.crm_contacts c
         where c.phone_key = public.crm_phone_key(v_phone) and (c.email is null or v_email is null or lower(c.email) = v_email)
         order by c.created_at, c.id limit 1;
      end if;
      if v_contact is null then
        insert into public.crm_contacts (full_name, phone, email) values (v_name, v_phone, v_email)
        returning id into v_contact;
      end if;
    end if;

    insert into public.complaints (brand_id, product_id, sku_id, batch_number, stockist_id, purchase_place, purchase_date,
                                   category, severity, channel, description, contact_id, organisation_id, owner_id)
    values (
      (details ->> 'brand_id')::uuid,
      nullif(details ->> 'product_id', '')::uuid,
      nullif(details ->> 'sku_id', '')::uuid,
      nullif(btrim(coalesce(details ->> 'batch_number', '')), ''),
      nullif(details ->> 'stockist_id', '')::uuid,
      nullif(btrim(coalesce(details ->> 'purchase_place', '')), ''),
      nullif(details ->> 'purchase_date', '')::date,
      details ->> 'category',
      coalesce(nullif(details ->> 'severity', ''), 'normal'),
      details ->> 'channel',
      btrim(details ->> 'description'),
      v_contact,
      nullif(details ->> 'organisation_id', '')::uuid,
      nullif(details ->> 'owner_id', '')::uuid
    )
    returning id into saved_id;
  else
    update public.complaints set
      brand_id = (details ->> 'brand_id')::uuid,
      product_id = case when details ->> 'product_id' = 'keep' then product_id else nullif(details ->> 'product_id', '')::uuid end,
      sku_id = case when details ->> 'sku_id' = 'keep' then sku_id else nullif(details ->> 'sku_id', '')::uuid end,
      batch_number = nullif(btrim(coalesce(details ->> 'batch_number', '')), ''),
      stockist_id = nullif(details ->> 'stockist_id', '')::uuid,
      purchase_place = nullif(btrim(coalesce(details ->> 'purchase_place', '')), ''),
      purchase_date = nullif(details ->> 'purchase_date', '')::date,
      category = details ->> 'category',
      severity = coalesce(nullif(details ->> 'severity', ''), 'normal'),
      channel = details ->> 'channel',
      description = btrim(details ->> 'description'),
      contact_id = coalesce(v_contact, contact_id),
      organisation_id = case when details ->> 'organisation_id' = 'keep' then organisation_id
                             else nullif(details ->> 'organisation_id', '')::uuid end
    where id = saved_id;
    get diagnostics changed = row_count;
    if changed = 0 then
      raise exception 'not allowed to change this complaint' using errcode = '42501';
    end if;
  end if;
  return saved_id;
end;
$$;

-- Moves a complaint to a status. note: optional for most moves, required to reopen (it becomes the reason on the
-- timeline). resolution_summary and root_cause replace the stored ones when given (needed to resolve or close).
create or replace function public.set_complaint_status(target_id uuid, new_status text, note text,
                                                       resolution_summary text, root_cause text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  perform set_config('lexta.complaint_note', left(coalesce(btrim(note), ''), 1000), true);
  update public.complaints c
     set status = new_status,
         resolution_summary = coalesce(nullif(btrim(coalesce(set_complaint_status.resolution_summary, '')), ''), c.resolution_summary),
         root_cause = coalesce(nullif(btrim(coalesce(set_complaint_status.root_cause, '')), ''), c.root_cause)
   where c.id = target_id and c.status is distinct from new_status;
  get diagnostics changed = row_count;
  perform set_config('lexta.complaint_note', '', true);
  if changed = 0 then
    raise exception 'not allowed to change the status of this complaint' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.set_complaint_owner(target_id uuid, new_owner uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.complaints set owner_id = new_owner where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change the owner of this complaint' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.delete_complaint(target_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  delete from public.complaints where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to delete this complaint' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.save_complaint(uuid, jsonb) from public, anon;
revoke all on function public.set_complaint_status(uuid, text, text, text, text) from public, anon;
revoke all on function public.set_complaint_owner(uuid, uuid) from public, anon;
revoke all on function public.delete_complaint(uuid) from public, anon;
grant execute on function public.save_complaint(uuid, jsonb) to authenticated;
grant execute on function public.set_complaint_status(uuid, text, text, text, text) to authenticated;
grant execute on function public.set_complaint_owner(uuid, uuid) to authenticated;
grant execute on function public.delete_complaint(uuid) to authenticated;

-- Website intake ----------------------------------------------------------------------------
-- The websites' only way to log a complaint (wired to the forms in item 19). Anyone may call it; it never returns
-- data, only the case number to show the visitor. No files through the website for now.
-- Payload fields (all text; unknown fields are refused; at most 8000 bytes in all):
--   honeypot          leave empty; anything in it means a bot: a case number shaped reply comes back, nothing is saved
--   brand             slug: lexta, yazz, linzzy or hooch (default: the corporate Lexta brand)
--   name              required, up to 120
--   email, phone      at least one
--   category          required: product_quality, packaging, foreign_object, health_safety, availability,
--                     pricing_in_shop, staff_service, delivery, other
--   message           required, up to 3000 (the complaint itself)
--   product           product slug of a published product of that brand
--   sku               SKU code of an active SKU of that product (needs product)
--   batch_number      up to 60
--   purchase_place    where it was bought, up to 200 (never linked to a stockist; staff do that)
--   purchase_date     YYYY-MM-DD, not in the future
-- The complaint is created at status new, severity normal (high for health or safety), channel website, no owner.
-- Contacts are matched the same way as public.submit_website_enquiry (by email, then by phone) and only their empty
-- fields are filled in; their organisation is never changed and no organisation is ever linked.
-- Errors: 22023 invalid input (the message names the field), PT429 too many submissions (shared with the other
-- website forms: 5 per email or phone per hour; PostgREST answers HTTP 429).
create or replace function public.submit_complaint(payload jsonb)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  allowed text[] := array['honeypot', 'brand', 'name', 'email', 'phone', 'category', 'message', 'product', 'sku',
                          'batch_number', 'purchase_place', 'purchase_date'];
  k text;
  v_name text;
  v_email text;
  v_phone text;
  v_category text;
  v_message text;
  v_brand_slug text;
  v_brand uuid;
  v_product_slug text;
  v_product uuid;
  v_sku_code text;
  v_sku uuid;
  v_batch text;
  v_place text;
  v_date_text text;
  v_date date;
  v_email_key text;
  v_phone_key text;
  v_contact uuid;
  v_case text;
  recent integer;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'invalid field: payload' using errcode = '22023';
  end if;
  if octet_length(payload::text) > 8000 then
    raise exception 'payload too large' using errcode = '22023';
  end if;
  for k in select jsonb_object_keys(payload) loop
    if k <> all (allowed) then
      raise exception 'invalid field: %', left(k, 40) using errcode = '22023';
    end if;
  end loop;

  -- A bot filled the hidden field: answer like a success, save nothing.
  if public.crm_intake_text(payload, 'honeypot', 500) is not null then
    return 'LX-' || extract(year from now() at time zone 'UTC')::integer::text || '-'
           || lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  end if;

  v_name := public.crm_intake_text(payload, 'name', 120);
  v_email := lower(public.crm_intake_text(payload, 'email', 254));
  v_phone := public.crm_intake_text(payload, 'phone', 24);
  v_category := public.crm_intake_text(payload, 'category', 40);
  v_message := public.crm_intake_text(payload, 'message', 3000);
  v_brand_slug := lower(public.crm_intake_text(payload, 'brand', 60));
  v_product_slug := lower(public.crm_intake_text(payload, 'product', 120));
  v_sku_code := public.crm_intake_text(payload, 'sku', 64);
  v_batch := public.crm_intake_text(payload, 'batch_number', 60);
  v_place := public.crm_intake_text(payload, 'purchase_place', 200);
  v_date_text := public.crm_intake_text(payload, 'purchase_date', 10);

  if v_name is null then
    raise exception 'invalid field: name' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9][0-9 ()-]{5,22}$' then
    raise exception 'invalid field: phone' using errcode = '22023';
  end if;
  if v_email is null and v_phone is null then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_category is null or v_category not in ('product_quality', 'packaging', 'foreign_object', 'health_safety',
      'availability', 'pricing_in_shop', 'staff_service', 'delivery', 'other') then
    raise exception 'invalid field: category' using errcode = '22023';
  end if;
  if v_message is null then
    raise exception 'invalid field: message' using errcode = '22023';
  end if;

  if v_brand_slug is not null then
    select b.id into v_brand from public.brands b where b.slug = v_brand_slug and b.is_active;
    if v_brand is null then
      raise exception 'invalid field: brand' using errcode = '22023';
    end if;
  else
    select b.id into v_brand from public.brands b where b.is_corporate and b.is_active order by b.created_at, b.id limit 1;
    if v_brand is null then
      raise exception 'invalid field: brand' using errcode = '22023';
    end if;
  end if;
  if v_product_slug is not null then
    select p.id into v_product from public.products p
     where p.brand_id = v_brand and p.slug = v_product_slug and p.is_published;
    if v_product is null then
      raise exception 'invalid field: product' using errcode = '22023';
    end if;
  end if;
  if v_sku_code is not null then
    if v_product is null then
      raise exception 'invalid field: sku' using errcode = '22023';
    end if;
    select s.id into v_sku from public.product_skus s where s.product_id = v_product and s.sku_code = v_sku_code and s.is_active;
    if v_sku is null then
      raise exception 'invalid field: sku' using errcode = '22023';
    end if;
  end if;
  if v_date_text is not null then
    if v_date_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'invalid field: purchase_date' using errcode = '22023';
    end if;
    begin
      v_date := v_date_text::date;
    exception when others then
      raise exception 'invalid field: purchase_date' using errcode = '22023';
    end;
    if v_date > (now() at time zone 'UTC')::date or v_date < date '2000-01-01' then
      raise exception 'invalid field: purchase_date' using errcode = '22023';
    end if;
  end if;

  -- Abuse guard, shared with the other website forms: at most 5 submissions per email or phone number in an hour.
  -- Same locks as submit_website_enquiry (email space 61 before phone space 62), so parallel requests are counted.
  v_email_key := v_email;
  v_phone_key := public.crm_phone_key(v_phone);
  if v_email_key is not null then
    perform pg_advisory_xact_lock(61, hashtext(v_email_key));
  end if;
  if v_phone_key is not null then
    perform pg_advisory_xact_lock(62, hashtext(v_phone_key));
  end if;
  select count(*) into recent from public.crm_intake_log il
   where il.created_at > now() - interval '1 hour'
     and ((v_email_key is not null and il.email_key = v_email_key) or (v_phone_key is not null and il.phone_key = v_phone_key));
  if recent >= 5 then
    raise exception 'too many submissions, please try again later' using errcode = 'PT429';
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
    insert into public.crm_contacts (full_name, phone, email) values (v_name, v_phone, v_email)
    returning id into v_contact;
  else
    update public.crm_contacts c set
      full_name = coalesce(c.full_name, v_name),
      phone = coalesce(c.phone, v_phone),
      email = coalesce(c.email, v_email)
    where c.id = v_contact
      and ((c.full_name is null and v_name is not null) or (c.phone is null and v_phone is not null)
           or (c.email is null and v_email is not null));
  end if;

  insert into public.complaints (brand_id, product_id, sku_id, batch_number, purchase_place, purchase_date, category,
                                 severity, channel, description, contact_id)
  values (v_brand, v_product, v_sku, v_batch, v_place, v_date, v_category, 'normal', 'website', v_message, v_contact)
  returning case_number into v_case;

  insert into public.crm_intake_log (form, email_key, phone_key, reference)
  values ('complaint', v_email_key, v_phone_key, v_case);

  return v_case;
end;
$$;

revoke all on function public.submit_complaint(jsonb) from public;
grant execute on function public.submit_complaint(jsonb) to anon, authenticated;
