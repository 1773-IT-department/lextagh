-- 0008_recruitment: the recruitment tracker (scoreboard item 21).
-- Open roles (job_openings) that the Careers page lists, applications from the Careers page with a CV
-- (job_applications), each application's history (job_application_events), and the private job-cvs bucket.
--
-- Who can do what:
--   admin                     everything below, and the only role that deletes applications
--   management, hr            read and manage every role and application: create, edit, open, close and delete roles
--                             (a role with applications cannot be deleted, close it instead), move applications
--                             through the stages with notes, assign owners, keep staff notes, open CVs through
--                             their own login, remove unclaimed CV uploads
--   every other role          nothing at all
--   website visitors (anon)   read the public columns of live roles (status open, opened, not past the closing
--                             date). Through the website's server only (the publishable key plus a signature
--                             only that server can make): upload a CV at the one path a ticket allows, and send an
--                             application with public.submit_job_application(), which returns the application
--                             reference and nothing else. They never read applications or CVs, and never list the bucket.
--
-- CV uploads go through the website's server only, never straight from a browser. The Careers server action takes
-- the form with the file, checks its size (at most 4 MB, under Vercel's 4.5 MB request limit), its type and its
-- first bytes, then asks for a one time ticket with public.begin_job_cv_upload: a request signed with a secret only
-- the website server and the database know (HMAC SHA-256 over a fresh uuid, the time and a hash of the visitor's IP
-- address; at most 5 minutes old; 5 tickets an hour and 10 a day per IP hash; a circuit breaker at 2000 a day site
-- wide). The ticket names the path, incoming/<that uuid>/<cleaned file name>. Storage takes a website upload only at
-- the path of an unused ticket within 15 minutes (and never twice: Storage refuses a second object at the same
-- path), with the content type the server set from the checked bytes. submit_job_application then claims the
-- ticketed upload once (the ticket row is locked while it does), checks size and type as Storage recorded them and
-- applies the per email and phone limits. Without the secret nobody can get a ticket, so nobody can upload or apply
-- by calling the API directly. The bucket enforces 4 MB and the three types too.
-- Cleanup: uploads nobody claimed (a visitor who gave up, or refused applications) can be removed by recruitment
-- staff at any age; public.unclaimed_job_cvs() lists those over an hour old by default and the portal's "Remove
-- unclaimed uploads" button removes them through the Storage API. A scheduled job can do the same later with the service role (not set up here).
--
-- Application references come from the database: LX-APP-<year>-0001, counting from 1 again each year.
-- Stages: new, screening, shortlisted, interview, offer, hired, rejected, withdrawn; any stage may move to any other.
-- Stage and owner changes are written to job_application_events by the database (who, when, from, to, note); staff
-- add notes. Seeded: the 12 roles of the approved prototype's Careers page, as drafts (their dates have passed), for
-- HR to review, date and open. No applications are seeded.
-- Dates: opens_at and closes_at are calendar dates in Ghana (Africa/Accra, which is UTC all year). A role takes
-- applications from opens_at through the whole of closes_at; no closing date means open until HR closes it.

-- Quiet "does not exist, skipping" notices from the idempotent drops below.
set client_min_messages = warning;

-- Helpers ------------------------------------------------------------------------------------------
create or replace function public.ghana_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Accra')::date;
$$;

grant execute on function public.ghana_today() to anon, authenticated;

-- Admin, management and hr: the people who work recruitment.
create or replace function public.recruitment_staff_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'hr'), false);
$$;

revoke all on function public.recruitment_staff_role() from public, anon;
grant execute on function public.recruitment_staff_role() to authenticated;

-- People who can own applications, for names and the assign list. Empty for everyone without a recruitment role.
create or replace function public.recruitment_staff()
returns table (id uuid, display_name text, role public.app_role, is_active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email), p.role, p.is_active
  from public.profiles p
  where public.recruitment_staff_role()
    and p.role in ('admin', 'management', 'hr')
  order by 2;
$$;

revoke all on function public.recruitment_staff() from public, anon;
grant execute on function public.recruitment_staff() to authenticated;

-- A list of short texts (duties, requirements): at most max_items, each 1 to max_len characters after trimming.
create or replace function public.job_text_list_ok(items text[], max_items integer, max_len integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(items, 1), 0) <= max_items
     and not exists (select 1 from unnest(items) t where t is null or length(btrim(t)) not between 1 and max_len);
$$;

grant execute on function public.job_text_list_ok(text[], integer, integer) to anon, authenticated;

-- Job openings -------------------------------------------------------------------------------------
create table if not exists public.job_openings (
  id uuid primary key default gen_random_uuid(),
  -- What the website shows and applicants quote, e.g. LX-HR-001 or LX-PRD-114.
  reference text not null unique check (reference ~ '^LX-[A-Z]{2,5}-[0-9]{2,5}$'),
  title text not null check (length(btrim(title)) between 2 and 160),
  department text not null check (length(btrim(department)) between 1 and 80),
  location text not null check (length(btrim(location)) between 1 and 80),
  employment_type text not null check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
  level text not null check (length(btrim(level)) between 1 and 60),
  summary text not null check (length(btrim(summary)) between 1 and 2000),
  duties text[] not null default '{}' check (public.job_text_list_ok(duties, 20, 400)),
  requirements text[] not null default '{}' check (public.job_text_list_ok(requirements, 20, 400)),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  opens_at date,
  closes_at date,
  -- Shows "Closing soon" on the website.
  urgent boolean not null default false,
  -- Lower first on the website; then by opening date, newest first.
  sort integer not null default 0 check (sort between -100000 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  constraint job_openings_dates check (closes_at is null or opens_at is null or closes_at >= opens_at),
  constraint job_openings_open_has_date check (status <> 'open' or opens_at is not null)
);

create index if not exists job_openings_status_idx on public.job_openings (status, sort, opens_at desc);
create index if not exists job_openings_created_by_idx on public.job_openings (created_by);
create index if not exists job_openings_updated_by_idx on public.job_openings (updated_by);

drop trigger if exists job_openings_set_updated_at on public.job_openings;
create trigger job_openings_set_updated_at before update on public.job_openings
  for each row execute function public.set_updated_at();

-- Tidies what people typed, stamps the authors, and keeps an open role honest: opening a role (or editing an open
-- one) needs a closing date that is not in the past; an open role without an opening date opens today.
create or replace function public.check_job_opening()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reference := upper(btrim(new.reference));
  new.title := btrim(new.title);
  new.department := btrim(new.department);
  new.location := btrim(new.location);
  new.level := btrim(new.level);
  new.summary := btrim(new.summary);
  new.duties := coalesce((select array_agg(btrim(t) order by o) from unnest(new.duties) with ordinality as u(t, o)), '{}');
  new.requirements := coalesce((select array_agg(btrim(t) order by o) from unnest(new.requirements) with ordinality as u(t, o)), '{}');
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  end if;
  new.updated_by := coalesce((select auth.uid()), new.updated_by);
  if new.status = 'open' then
    new.opens_at := coalesce(new.opens_at, public.ghana_today());
    if new.closes_at is not null and new.closes_at < public.ghana_today()
       and (tg_op = 'INSERT' or old.status <> 'open' or new.closes_at is distinct from old.closes_at) then
      raise exception 'the closing date of an open role cannot be in the past' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.check_job_opening() from public, anon, authenticated;

drop trigger if exists job_openings_check on public.job_openings;
create trigger job_openings_check before insert or update on public.job_openings
  for each row execute function public.check_job_opening();

-- Application references --------------------------------------------------------------------------
create table if not exists public.job_application_counters (
  year integer primary key check (year between 2000 and 9999),
  last_number integer not null check (last_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists job_application_counters_set_updated_at on public.job_application_counters;
create trigger job_application_counters_set_updated_at before update on public.job_application_counters
  for each row execute function public.set_updated_at();

-- Same scheme as complaint case numbers: the year's row is locked until the transaction ends, so parallel
-- applications always get different numbers.
create or replace function public.next_job_application_reference(ref_year integer)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.job_application_counters as c (year, last_number)
  values (ref_year, 1)
  on conflict (year) do update set last_number = c.last_number + 1
  returning c.last_number into n;
  return 'LX-APP-' || ref_year::text || '-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end;
end;
$$;

revoke all on function public.next_job_application_reference(integer) from public, anon, authenticated;

-- Applications ---------------------------------------------------------------------------------------
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^LX-APP-[0-9]{4}-[0-9]{4,}$'),
  -- Empty for a general application. A role with applications cannot be deleted (close it instead).
  opening_id uuid references public.job_openings (id) on delete restrict,
  -- What the role was called when the person applied.
  opening_reference_snapshot text,
  opening_title_snapshot text,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  email text not null check (length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (phone is null or (length(phone) <= 24 and phone ~ '^\+?[0-9][0-9 ()-]{5,22}$')),
  -- Area of interest (general applications) or what the applicant wrote about the role.
  interest text check (interest is null or length(btrim(interest)) between 1 and 120),
  message text check (message is null or length(message) <= 3000),
  -- The claimed object in the job-cvs bucket, and what Storage recorded about it.
  cv_path text unique,
  cv_file_name text check (cv_file_name is null or length(cv_file_name) between 1 and 200),
  cv_size_bytes integer check (cv_size_bytes is null or cv_size_bytes between 1 and 4194304),
  cv_mime_type text check (cv_mime_type is null or cv_mime_type in (
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  -- The applicant agreed that Lexta keeps their details for this and future roles.
  consent_keep boolean not null default false,
  consent_at timestamptz,
  stage text not null default 'new' check (stage in ('new', 'screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  stage_changed_at timestamptz not null default now(),
  owner_id uuid references public.profiles (id) on delete set null,
  staff_notes text check (staff_notes is null or length(staff_notes) <= 4000),
  source text not null default 'website' check (source in ('website')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint job_applications_cv_complete check (
    (cv_path is null and cv_file_name is null and cv_size_bytes is null and cv_mime_type is null)
    or (cv_path is not null and cv_file_name is not null and cv_size_bytes is not null and cv_mime_type is not null)),
  constraint job_applications_role_or_interest check (opening_id is not null or opening_reference_snapshot is not null or interest is not null)
);

create index if not exists job_applications_opening_idx on public.job_applications (opening_id, created_at desc);
create index if not exists job_applications_stage_idx on public.job_applications (stage, created_at desc);
create index if not exists job_applications_owner_idx on public.job_applications (owner_id);
create index if not exists job_applications_updated_by_idx on public.job_applications (updated_by);
create index if not exists job_applications_created_idx on public.job_applications (created_at desc);
-- Rate limits look applicants up by email and phone in the last day.
create index if not exists job_applications_email_idx on public.job_applications (lower(email), created_at);
create index if not exists job_applications_phone_idx on public.job_applications (public.crm_phone_key(phone), created_at);

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();

-- Stage history and notes.
create table if not exists public.job_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications (id) on delete cascade,
  type text not null check (type in ('received', 'stage_change', 'owner_change', 'note')),
  from_stage text,
  to_stage text,
  note text check (note is null or length(note) <= 4000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_application_events_note check (type <> 'note' or length(btrim(coalesce(note, ''))) >= 1)
);

create index if not exists job_application_events_application_idx on public.job_application_events (application_id, created_at desc);
create index if not exists job_application_events_created_by_idx on public.job_application_events (created_by);

drop trigger if exists job_application_events_set_updated_at on public.job_application_events;
create trigger job_application_events_set_updated_at before update on public.job_application_events
  for each row execute function public.set_updated_at();

-- Who may own an application: an active admin, management or hr person.
create or replace function public.recruitment_is_owner_candidate(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target_profile and p.is_active and p.role in ('admin', 'management', 'hr')
  );
$$;

revoke all on function public.recruitment_is_owner_candidate(uuid) from public, anon, authenticated;

create or replace function public.recruitment_staff_name(target_profile uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.full_name), ''), p.email) from public.profiles p where p.id = target_profile;
$$;

revoke all on function public.recruitment_staff_name(uuid) from public, anon, authenticated;

-- Keeps the database set fields database set, and checks the owner. Security definer: it calls
-- recruitment_is_owner_candidate, which signed in people may not call themselves (Postgres checks that right whenever
-- the trigger's expression is first prepared in a transaction, even when the owner did not change).
create or replace function public.check_job_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- Fixed once received (also for staff: their column grants do not include these).
    new.reference := old.reference;
    new.created_at := old.created_at;
    new.source := old.source;
    if new.stage is distinct from old.stage then
      new.stage_changed_at := now();
    else
      new.stage_changed_at := old.stage_changed_at;
    end if;
    new.updated_by := coalesce((select auth.uid()), new.updated_by);
  end if;
  if new.owner_id is not null and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id)
     and not public.recruitment_is_owner_candidate(new.owner_id) then
    raise exception 'the owner must be an active admin, management or hr person' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.check_job_application() from public, anon, authenticated;

drop trigger if exists job_applications_check on public.job_applications;
create trigger job_applications_check before insert or update on public.job_applications
  for each row execute function public.check_job_application();

-- Writes the history: received, stage changes (with the note given to set_job_application_stage) and owner changes.
create or replace function public.log_job_application_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  note text := nullif(btrim(coalesce(current_setting('lexta.job_application_note', true), '')), '');
begin
  if tg_op = 'INSERT' then
    insert into public.job_application_events (application_id, type, to_stage, note, created_by)
    values (new.id, 'received', new.stage,
      case when new.opening_title_snapshot is not null
        then 'Applied for ' || new.opening_title_snapshot || ' (' || new.opening_reference_snapshot || ')'
        else 'General application' || coalesce(': ' || new.interest, '') end,
      null);
    return null;
  end if;
  if new.stage is distinct from old.stage then
    insert into public.job_application_events (application_id, type, from_stage, to_stage, note)
    values (new.id, 'stage_change', old.stage, new.stage, left(note, 4000));
    perform set_config('lexta.job_application_note', '', true);
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into public.job_application_events (application_id, type, note)
    values (new.id, 'owner_change', case when new.owner_id is null then 'Owner cleared'
      else 'Assigned to ' || coalesce(public.recruitment_staff_name(new.owner_id), 'a team member') end);
  end if;
  return null;
end;
$$;

revoke all on function public.log_job_application_change() from public, anon, authenticated;

drop trigger if exists job_applications_log_insert on public.job_applications;
create trigger job_applications_log_insert after insert on public.job_applications
  for each row execute function public.log_job_application_change();
drop trigger if exists job_applications_log_change on public.job_applications;
create trigger job_applications_log_change after update of stage, owner_id on public.job_applications
  for each row when (old.stage is distinct from new.stage or old.owner_id is distinct from new.owner_id)
  execute function public.log_job_application_change();

-- Table privileges -----------------------------------------------------------------------------------
revoke all on public.job_openings, public.job_applications, public.job_application_events, public.job_application_counters
  from anon, authenticated;

-- Website visitors: the public columns of job openings only (Row Level Security limits the rows to live roles).
grant select (id, reference, title, department, location, employment_type, level, summary, duties, requirements, status,
              opens_at, closes_at, urgent, sort)
  on public.job_openings to anon;

grant select, delete on public.job_openings, public.job_applications, public.job_application_events to authenticated;
grant insert (reference, title, department, location, employment_type, level, summary, duties, requirements, status,
              opens_at, closes_at, urgent, sort),
  update (reference, title, department, location, employment_type, level, summary, duties, requirements, status,
          opens_at, closes_at, urgent, sort)
  on public.job_openings to authenticated;
grant update (stage, owner_id, staff_notes) on public.job_applications to authenticated;
grant insert (application_id, type, note) on public.job_application_events to authenticated;

-- Row Level Security ----------------------------------------------------------------------------------
alter table public.job_openings enable row level security;
alter table public.job_applications enable row level security;
alter table public.job_application_events enable row level security;
alter table public.job_application_counters enable row level security;
-- job_application_counters: no policies; only the reference function (security definer) touches it.

drop policy if exists "website visitors read live roles" on public.job_openings;
create policy "website visitors read live roles"
  on public.job_openings for select to anon
  using (
    status = 'open'
    and (opens_at is null or opens_at <= (select public.ghana_today()))
    and (closes_at is null or closes_at >= (select public.ghana_today()))
  );

drop policy if exists "recruitment staff read roles" on public.job_openings;
create policy "recruitment staff read roles"
  on public.job_openings for select to authenticated
  using ((select public.recruitment_staff_role()));

drop policy if exists "recruitment staff create roles" on public.job_openings;
create policy "recruitment staff create roles"
  on public.job_openings for insert to authenticated
  with check ((select public.recruitment_staff_role()));

drop policy if exists "recruitment staff edit roles" on public.job_openings;
create policy "recruitment staff edit roles"
  on public.job_openings for update to authenticated
  using ((select public.recruitment_staff_role())) with check ((select public.recruitment_staff_role()));

drop policy if exists "recruitment staff delete roles" on public.job_openings;
create policy "recruitment staff delete roles"
  on public.job_openings for delete to authenticated
  using ((select public.recruitment_staff_role()));

drop policy if exists "recruitment staff read applications" on public.job_applications;
create policy "recruitment staff read applications"
  on public.job_applications for select to authenticated
  using ((select public.recruitment_staff_role()));

drop policy if exists "recruitment staff work applications" on public.job_applications;
create policy "recruitment staff work applications"
  on public.job_applications for update to authenticated
  using ((select public.recruitment_staff_role())) with check ((select public.recruitment_staff_role()));

drop policy if exists "admins delete applications" on public.job_applications;
create policy "admins delete applications"
  on public.job_applications for delete to authenticated
  using ((select public.is_admin()));
-- No insert policy: applications come in only through public.submit_job_application().

drop policy if exists "recruitment staff read application history" on public.job_application_events;
create policy "recruitment staff read application history"
  on public.job_application_events for select to authenticated
  using ((select public.recruitment_staff_role()));

drop policy if exists "recruitment staff add notes" on public.job_application_events;
create policy "recruitment staff add notes"
  on public.job_application_events for insert to authenticated
  with check (type = 'note' and created_by = (select auth.uid()) and (select public.recruitment_staff_role()));

drop policy if exists "admins delete application history" on public.job_application_events;
create policy "admins delete application history"
  on public.job_application_events for delete to authenticated
  using ((select public.is_admin()));
-- No update policy: the history is a record of what happened.

-- Storage: job-cvs bucket -------------------------------------------------------------------------------
-- Private: CVs are only ever read by recruitment staff with their own login.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-cvs', 'job-cvs', false, 4194304,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The shape of every website upload: incoming/<uuid>/<file name ending .pdf, .doc or .docx>.
create or replace function public.job_cv_path_ok(object_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(object_name ~ '^incoming/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.([Pp][Dd][Ff]|[Dd][Oo][Cc]|[Dd][Oo][Cc][Xx])$', false);
$$;

revoke all on function public.job_cv_path_ok(text) from public, anon;
grant execute on function public.job_cv_path_ok(text) to authenticated;

-- The website's shared secret. The Careers server (env RECRUITMENT_INTAKE_SECRET) signs every upload request with
-- it; the database checks the signature. Kept in the private schema, which the Data API does not expose, with Row
-- Level Security on and no policies, so only the security definer functions below read it.
-- One time set up (the same value as RECRUITMENT_INTAKE_SECRET on the website's Vercel project, at least 32 characters):
--   insert into private.recruitment_intake_secret (secret) values ('<value>')
--   on conflict (id) do update set secret = excluded.secret, updated_at = now();
-- Until it is set, every upload request is refused and the Careers form says it could not send.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.recruitment_intake_secret (
  id boolean primary key default true check (id),
  secret text not null check (length(secret) >= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.recruitment_intake_secret enable row level security;
revoke all on private.recruitment_intake_secret from public, anon, authenticated;

-- HMAC for the signatures.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- One time upload tickets. The Careers server asks for one (begin_job_cv_upload) before it uploads a CV; Storage
-- only takes a website upload at the path of an unused ticket, and an application only claims a ticketed upload.
-- The visitor's IP address is never stored: ip_hash is an HMAC of it with the shared secret, made on the website
-- server. Tickets are removed after 7 days.
create table if not exists public.job_cv_upload_tickets (
  id uuid primary key,
  object_name text not null unique,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Storage takes the upload until then (15 minutes).
  upload_by timestamptz not null,
  -- Set when an application claims the upload.
  claimed_at timestamptz
);

create index if not exists job_cv_upload_tickets_ip_idx on public.job_cv_upload_tickets (ip_hash, created_at);
create index if not exists job_cv_upload_tickets_created_idx on public.job_cv_upload_tickets (created_at);

drop trigger if exists job_cv_upload_tickets_set_updated_at on public.job_cv_upload_tickets;
create trigger job_cv_upload_tickets_set_updated_at before update on public.job_cv_upload_tickets
  for each row execute function public.set_updated_at();

alter table public.job_cv_upload_tickets enable row level security;
revoke all on public.job_cv_upload_tickets from anon, authenticated;
-- No policies: only the security definer functions below touch tickets.

-- Ticket limits: 5 an hour and 10 a day per IP hash; above 2000 a day site wide the intake stops (a circuit
-- breaker, logged as a warning), which only a flood can reach.
create or replace function public.begin_job_cv_upload(nonce uuid, issued_at bigint, ip_hash text, signature text, file_name text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_ext text;
  v_stem text;
  v_path text;
  recent integer;
begin
  select s.secret into v_secret from private.recruitment_intake_secret s where s.id;
  if v_secret is null then
    raise exception 'recruitment intake is not set up' using errcode = '55000';
  end if;
  if nonce is null or issued_at is null or ip_hash is null or ip_hash !~ '^[0-9a-f]{64}$'
     or signature is null or signature !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  -- Compared as HMACs of both values, so the time the comparison takes says nothing about the expected signature.
  if extensions.hmac(encode(extensions.hmac(nonce::text || '.' || issued_at::text || '.' || ip_hash, v_secret, 'sha256'), 'hex'), v_secret, 'sha256')
     <> extensions.hmac(signature, v_secret, 'sha256') then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  if issued_at < extract(epoch from now())::bigint - 300 or issued_at > extract(epoch from now())::bigint + 60 then
    raise exception 'invalid field: issued_at' using errcode = '22023';
  end if;

  v_ext := lower(substring(coalesce(file_name, '') from '\.([A-Za-z]+)$'));
  if v_ext is null or v_ext not in ('pdf', 'doc', 'docx') then
    raise exception 'invalid field: cv_type' using errcode = '22023';
  end if;
  v_stem := regexp_replace(left(file_name, 300), '\.[A-Za-z]+$', '');
  v_stem := regexp_replace(v_stem, '[^A-Za-z0-9._-]+', '-', 'g');
  v_stem := regexp_replace(v_stem, '^[^A-Za-z0-9]+', '');
  v_stem := regexp_replace(left(v_stem, 80), '[._-]+$', '');
  v_path := 'incoming/' || nonce::text || '/' || coalesce(nullif(v_stem, ''), 'cv') || '.' || v_ext;
  if not public.job_cv_path_ok(v_path) then
    raise exception 'invalid field: cv_name' using errcode = '22023';
  end if;

  -- One at a time, so the counts below and the nonce check cannot race.
  perform pg_advisory_xact_lock(64, 0);
  delete from public.job_cv_upload_tickets t where t.created_at < now() - interval '7 days';
  if exists (select 1 from public.job_cv_upload_tickets t where t.id = nonce) then
    raise exception 'invalid field: nonce' using errcode = '22023';
  end if;
  select count(*) into recent from public.job_cv_upload_tickets t
   where t.ip_hash = begin_job_cv_upload.ip_hash and t.created_at > now() - interval '1 hour';
  if recent >= 5 then
    raise exception 'too many uploads, please try again later' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.job_cv_upload_tickets t
   where t.ip_hash = begin_job_cv_upload.ip_hash and t.created_at > now() - interval '1 day';
  if recent >= 10 then
    raise exception 'too many uploads, please try again tomorrow' using errcode = 'PT429';
  end if;
  select count(*) into recent from public.job_cv_upload_tickets t where t.created_at > now() - interval '1 day';
  if recent >= 2000 then
    raise warning 'LEXTA RECRUITMENT CIRCUIT BREAKER: CV uploads stopped, % upload tickets in the last day (limit 2000)', recent;
    raise exception 'too many uploads, please try again later' using errcode = 'PT429';
  end if;

  insert into public.job_cv_upload_tickets (id, object_name, ip_hash, upload_by)
  values (nonce, v_path, begin_job_cv_upload.ip_hash, now() + interval '15 minutes');
  return v_path;
end;
$$;

revoke all on function public.begin_job_cv_upload(uuid, bigint, text, text, text) from public, authenticated;
grant execute on function public.begin_job_cv_upload(uuid, bigint, text, text, text) to anon;

-- Storage's check for a website upload: the path has a ticket that is unused and not past its 15 minutes. Website
-- visitors need to run it (Storage applies the policy as them); it only answers for a path, and ticketed paths
-- contain a random uuid the server got from the database, so it reveals nothing useful.
create or replace function public.job_cv_ticket_open(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.job_cv_upload_tickets t
    where t.object_name = job_cv_ticket_open.object_name and t.claimed_at is null and t.upload_by > now()
  );
$$;

revoke all on function public.job_cv_ticket_open(text) from public, authenticated;
grant execute on function public.job_cv_ticket_open(text) to anon;

-- An upload no application claimed: recruitment staff may remove it at any age (the portal button waits an hour,
-- see unclaimed_job_cvs). False for everyone else, so it tells nobody else anything.
create or replace function public.job_cv_unclaimed(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.recruitment_staff_role() and exists (
    select 1 from storage.objects o
    where o.bucket_id = 'job-cvs' and o.name = object_name
      and not exists (select 1 from public.job_applications a where a.cv_path = o.name)
  );
$$;

revoke all on function public.job_cv_unclaimed(text) from public, anon;
grant execute on function public.job_cv_unclaimed(text) to authenticated;

-- The cleanup list: unclaimed uploads older than older_than (default 1 hour, so someone applying right now is never
-- caught; pass interval '0' for every unclaimed upload), oldest first. Recruitment staff
-- and the service role only. Remove the files through the Storage API (supabase.storage.from('job-cvs')
-- .remove(names)); deleting rows from storage.objects directly would leave the bytes behind. The portal's
-- "Remove unclaimed uploads" button does exactly that; a scheduled job can do the same later (not set up here).
create or replace function public.unclaimed_job_cvs(older_than interval default interval '1 hour')
returns table (name text, created_at timestamptz, size_bytes bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.recruitment_staff_role() or coalesce((select auth.role()) = 'service_role', false)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select o.name, o.created_at, nullif(o.metadata ->> 'size', '')::bigint
    from storage.objects o
    where o.bucket_id = 'job-cvs'
      and o.created_at <= now() - greatest(coalesce(older_than, interval '1 hour'), interval '0')
      and not exists (select 1 from public.job_applications a where a.cv_path = o.name)
    order by o.created_at
    limit 1000;
end;
$$;

revoke all on function public.unclaimed_job_cvs(interval) from public, anon;
grant execute on function public.unclaimed_job_cvs(interval) to authenticated, service_role;

drop policy if exists "website visitors upload CVs into incoming" on storage.objects;
drop policy if exists "website visitors upload ticketed CVs" on storage.objects;
create policy "website visitors upload ticketed CVs"
  on storage.objects for insert to anon
  with check (bucket_id = 'job-cvs' and (select public.job_cv_ticket_open(name)));
drop function if exists public.job_cv_upload_allowed(text);

drop policy if exists "recruitment staff read CVs" on storage.objects;
create policy "recruitment staff read CVs"
  on storage.objects for select to authenticated
  using (bucket_id = 'job-cvs' and (select public.recruitment_staff_role()));

drop policy if exists "recruitment staff remove unclaimed CVs, admins remove any" on storage.objects;
create policy "recruitment staff remove unclaimed CVs, admins remove any"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'job-cvs'
    and ((select public.is_admin()) or ((select public.recruitment_staff_role()) and (select public.job_cv_unclaimed(name))))
  );
-- No update policy: nobody overwrites or renames a CV.

-- Portal actions ---------------------------------------------------------------------------------------
-- Security invoker: Row Level Security and the triggers decide; a write that touches no row raises.
create or replace function public.set_job_application_stage(target_id uuid, new_stage text, note text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  perform set_config('lexta.job_application_note', left(coalesce(btrim(note), ''), 4000), true);
  update public.job_applications a set stage = new_stage
   where a.id = target_id and a.stage is distinct from new_stage;
  get diagnostics changed = row_count;
  perform set_config('lexta.job_application_note', '', true);
  if changed = 0 then
    raise exception 'not allowed to change the stage of this application' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.set_job_application_owner(target_id uuid, new_owner uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.job_applications set owner_id = new_owner where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change the owner of this application' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.set_job_application_stage(uuid, text, text) from public, anon;
revoke all on function public.set_job_application_owner(uuid, uuid) from public, anon;
grant execute on function public.set_job_application_stage(uuid, text, text) to authenticated;
grant execute on function public.set_job_application_owner(uuid, uuid) to authenticated;

-- Website intake -----------------------------------------------------------------------------------------
-- The Careers page's only way in. Anyone may call it; it never returns data, only the application reference.
-- Payload fields (unknown fields are refused; at most 8000 bytes in all):
--   honeypot   leave empty; anything in it means a bot: an LX-APP shaped reference comes back, nothing is saved
--   opening    reference of a live role (status open, opened, closing date not passed); leave out for a general
--              application
--   name       required, up to 120
--   email      required, up to 254
--   phone      optional, up to 24
--   interest   area of interest, up to 120; required for a general application
--   message    optional, up to 3000
--   cv_path    required: the path begin_job_cv_upload gave the website server, uploaded to job-cvs, its ticket not
--              yet claimed, at most a day old, at most 4 MB, PDF, DOC or DOCX as the website server stored it (the
--              server checks the file's first bytes and sets the type itself; Storage records that type)
--   cv_name    the file name as the applicant had it, up to 200 (defaults to the stored name); saved cleaned:
--              letters, digits, spaces, dots, dashes, underscores and brackets, anything else becomes _, at most
--              100 characters before the extension, which always comes from cv_path
--   consent    boolean, must be true: Lexta may keep the details for this and future roles
-- Errors: 22023 invalid input (the message names the field), PT429 too many applications (3 per email or phone in
-- a day; PostgREST answers HTTP 429).
create or replace function public.submit_job_application(payload jsonb)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  allowed text[] := array['honeypot', 'opening', 'name', 'email', 'phone', 'interest', 'message', 'cv_path', 'cv_name', 'consent'];
  k text;
  v_opening_ref text;
  v_opening public.job_openings%rowtype;
  v_name text;
  v_email text;
  v_phone text;
  v_phone_key text;
  v_interest text;
  v_message text;
  v_cv_path text;
  v_cv_name text;
  v_size bigint;
  v_type text;
  v_object_created timestamptz;
  v_ticket_id uuid;
  v_ext text;
  v_ref text;
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
    return 'LX-APP-' || extract(year from now() at time zone 'Africa/Accra')::integer::text || '-'
           || lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
  end if;

  v_opening_ref := upper(public.crm_intake_text(payload, 'opening', 20));
  v_name := public.crm_intake_text(payload, 'name', 120);
  v_email := lower(public.crm_intake_text(payload, 'email', 254));
  v_phone := public.crm_intake_text(payload, 'phone', 24);
  v_interest := public.crm_intake_text(payload, 'interest', 120);
  v_message := public.crm_intake_text(payload, 'message', 3000);
  v_cv_path := public.crm_intake_text(payload, 'cv_path', 200);
  v_cv_name := public.crm_intake_text(payload, 'cv_name', 200);

  if v_name is null then
    raise exception 'invalid field: name' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid field: email' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9][0-9 ()-]{5,22}$' then
    raise exception 'invalid field: phone' using errcode = '22023';
  end if;
  if not (payload ? 'consent') or jsonb_typeof(payload -> 'consent') <> 'boolean' or not (payload ->> 'consent')::boolean then
    raise exception 'invalid field: consent' using errcode = '22023';
  end if;

  if v_opening_ref is not null then
    select * into v_opening from public.job_openings o
     where o.reference = v_opening_ref and o.status = 'open'
       and (o.opens_at is null or o.opens_at <= public.ghana_today())
       and (o.closes_at is null or o.closes_at >= public.ghana_today());
    if v_opening.id is null then
      raise exception 'invalid field: opening' using errcode = '22023';
    end if;
    -- A role application has no area of interest (a form may still send one).
    v_interest := null;
  elsif v_interest is null then
    raise exception 'invalid field: interest' using errcode = '22023';
  end if;

  -- The CV: uploaded just now to incoming/, not claimed by another application, within the limits Storage recorded.
  if v_cv_path is null or not public.job_cv_path_ok(v_cv_path) then
    raise exception 'invalid field: cv_path' using errcode = '22023';
  end if;
  -- Only an upload the website server asked for (a ticket), claimed once: the ticket row stays locked until the
  -- application is saved, so two applications cannot claim the same file.
  select t.id into v_ticket_id from public.job_cv_upload_tickets t
   where t.object_name = v_cv_path and t.claimed_at is null
   for update;
  if v_ticket_id is null then
    raise exception 'invalid field: cv_path' using errcode = '22023';
  end if;
  select nullif(o.metadata ->> 'size', '')::bigint, lower(o.metadata ->> 'mimetype'), o.created_at
    into v_size, v_type, v_object_created
    from storage.objects o where o.bucket_id = 'job-cvs' and o.name = v_cv_path;
  if v_object_created is null or v_object_created < now() - interval '1 day'
     or exists (select 1 from public.job_applications a where a.cv_path = v_cv_path) then
    raise exception 'invalid field: cv_path' using errcode = '22023';
  end if;
  if v_size is null or v_size < 1 or v_size > 4194304 then
    raise exception 'invalid field: cv_size' using errcode = '22023';
  end if;
  if v_type is null or v_type not in ('application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document') then
    raise exception 'invalid field: cv_type' using errcode = '22023';
  end if;
  -- The name staff see and download under: a safe character set only, the extension of the stored file.
  v_ext := lower(substring(v_cv_path from '\.([A-Za-z]+)$'));
  v_cv_name := regexp_replace(coalesce(v_cv_name, split_part(v_cv_path, '/', 3)), '\.[A-Za-z0-9]{1,5}$', '');
  v_cv_name := regexp_replace(v_cv_name, '[^A-Za-z0-9 ._()-]', '_', 'g');
  v_cv_name := btrim(regexp_replace(regexp_replace(v_cv_name, '_{2,}', '_', 'g'), '\s{2,}', ' ', 'g'), ' ._-');
  v_cv_name := btrim(left(v_cv_name, 100), ' ._-');
  v_cv_name := coalesce(nullif(v_cv_name, ''), 'cv') || '.' || v_ext;

  -- Abuse guard: at most 3 applications per email or phone number in a day. There is no site wide cap here: every
  -- application needs a ticketed upload, and tickets are limited per visitor and by the circuit breaker.
  v_phone_key := public.crm_phone_key(v_phone);
  perform pg_advisory_xact_lock(65, hashtext(v_email));
  if v_phone_key is not null then
    perform pg_advisory_xact_lock(66, hashtext(v_phone_key));
  end if;
  select count(*) into recent from public.job_applications a
   where a.created_at > now() - interval '1 day'
     and (lower(a.email) = v_email or (v_phone_key is not null and public.crm_phone_key(a.phone) = v_phone_key));
  if recent >= 3 then
    raise exception 'too many applications, please try again tomorrow' using errcode = 'PT429';
  end if;

  v_ref := public.next_job_application_reference(extract(year from now() at time zone 'Africa/Accra')::integer);
  insert into public.job_applications (reference, opening_id, opening_reference_snapshot, opening_title_snapshot, full_name,
                                       email, phone, interest, message, cv_path, cv_file_name, cv_size_bytes, cv_mime_type,
                                       consent_keep, consent_at, source)
  values (v_ref, v_opening.id, v_opening.reference, v_opening.title, v_name, v_email, v_phone, v_interest, v_message,
          v_cv_path, v_cv_name, v_size, v_type, true, now(), 'website');
  update public.job_cv_upload_tickets set claimed_at = now() where id = v_ticket_id;
  return v_ref;
end;
$$;

revoke all on function public.submit_job_application(jsonb) from public, authenticated;
grant execute on function public.submit_job_application(jsonb) to anon;

-- Seed: the 12 roles of the approved prototype Careers page (apps/lexta/components/careers/data.ts), as drafts.
-- Their dates have passed, so none is public until HR updates the dates and opens it. Nothing new is invented.
insert into public.job_openings (reference, title, department, location, employment_type, level, summary, duties, requirements,
                                 status, opens_at, closes_at, urgent, sort)
values
  ('LX-PRD-114', 'Production Line Supervisor', 'Manufacturing', 'Accra', 'full_time', 'Mid level',
   'Own the output, safety and discipline of one converting line across a shift, working with planning, maintenance and QA to hit volume without compromising standards.',
   array['Run daily shift briefings and allocate operators across the line.', 'Track output, downtime and waste against targets and report on causes.', 'Enforce hygiene, safety and GMP procedures without exception.', 'Work with maintenance to plan changeovers and preventive work.']::text[],
   array['HND or degree in engineering, production or a related field.', 'Three or more years on a manufacturing line, at least one supervising a team.', 'Practical understanding of GMP and workplace safety in FMCG.', 'Comfortable with shift work and with holding a team to a standard.']::text[],
   'draft', date '2026-09-02', date '2026-09-30', true, 10),
  ('LX-PRD-118', 'Machine Operator (Tissue Converting)', 'Manufacturing', 'Accra', 'full_time', 'Entry level',
   'Operate and monitor converting machinery, carry out first-line checks and keep the line running to specification through the shift.',
   array['Set up, run and shut down assigned machinery to standard procedure.', 'Carry out in-process quality checks and log results accurately.', 'Report faults early and support basic maintenance tasks.', 'Keep the work area to hygiene and 5S standards.']::text[],
   array['WASSCE or technical certificate; NVTI qualification an advantage.', 'One year or more operating industrial machinery, or strong technical aptitude.', 'Attention to detail and willingness to work rotating shifts.']::text[],
   'draft', date '2026-08-28', date '2026-09-26', false, 20),
  ('LX-QA-051', 'Quality Assurance Officer', 'Quality', 'Accra', 'full_time', 'Mid level',
   'Decide whether a batch leaves the building. You will run the sampling, testing and documentation that keeps our brands where their reputation is.',
   array['Sample and test raw materials, in-process product and finished goods.', 'Maintain batch records and support FDA and standards audits.', 'Investigate deviations and drive corrective action with production.', 'Train line staff on quality checkpoints and specifications.']::text[],
   array['Degree in chemistry, biochemistry, food science or a related discipline.', 'Two or more years in QA or QC within manufacturing.', 'Working knowledge of Ghana Standards Authority and FDA requirements.', 'The confidence to hold a decision under pressure.']::text[],
   'draft', date '2026-09-01', date '2026-09-29', false, 30),
  ('LX-SLS-207', 'Area Sales Manager, Northern Sector', 'Sales', 'Tamale', 'full_time', 'Senior',
   'Take ownership of distribution, coverage and revenue across the northern sector, building the wholesaler and retailer base for all three brands.',
   array['Deliver monthly volume and value targets across the assigned territory.', 'Recruit, develop and manage distributors and field representatives.', 'Drive numeric distribution and shelf presence in general trade.', 'Report on market conditions, pricing and competitor activity.']::text[],
   array['Degree in marketing, business or a related field.', 'Five or more years in FMCG sales, with team management experience.', 'Proven route-to-market experience in the northern regions.', 'Valid driving licence and willingness to travel extensively.']::text[],
   'draft', date '2026-08-25', date '2026-09-24', true, 40),
  ('LX-SLS-212', 'Field Sales Representative', 'Sales', 'Kumasi', 'full_time', 'Entry level',
   'Work a defined route, keep our brands on the shelf and grow the outlets you own. The most direct way to learn how this business really works.',
   array['Visit outlets on a fixed journey plan and take orders.', 'Merchandise product and execute point-of-sale activations.', 'Open new outlets and recover dormant ones.', 'Report daily sales and stock positions accurately.']::text[],
   array['HND or degree in any discipline.', 'One year or more in field sales, ideally FMCG.', 'Strong local knowledge of the Ashanti region trade.']::text[],
   'draft', date '2026-08-30', date '2026-09-28', false, 50),
  ('LX-MKT-088', 'Brand Manager, Femcare', 'Marketing', 'Accra', 'full_time', 'Senior',
   'Lead the Yazz and Linzzy portfolios end to end, from pricing and pack architecture to the national outreach campaigns that carry them.',
   array['Own the brand plan, budget and performance for the femcare portfolio.', 'Develop campaigns across ATL, trade and digital with agency partners.', 'Lead consumer research and turn it into product and pack decisions.', 'Work with the CSR team on menstrual health education programmes.']::text[],
   array['Degree in marketing or a related field; postgraduate qualification an advantage.', 'Five or more years in brand management, preferably FMCG.', 'Track record of launching or relaunching a consumer brand.', 'Genuine interest in women’s health advocacy.']::text[],
   'draft', date '2026-08-20', date '2026-09-19', false, 60),
  ('LX-MKT-093', 'Digital Marketing Executive', 'Marketing', 'Accra', 'full_time', 'Mid level',
   'Run the day-to-day digital presence of three brands: content calendars, paid social, community management and reporting that someone actually reads.',
   array['Plan and publish content across brand social channels.', 'Run and optimise paid campaigns on Meta, Google and TikTok.', 'Manage community engagement and escalate consumer issues.', 'Report on reach, engagement and conversion monthly.']::text[],
   array['Degree or professional certification in marketing or communications.', 'Two or more years running social and paid digital for a brand or agency.', 'Hands-on with Meta Business Suite and Google Ads.', 'A portfolio of work you can walk us through.']::text[],
   'draft', date '2026-09-03', date '2026-10-03', false, 70),
  ('LX-SCM-039', 'Warehouse and Inventory Officer', 'Supply chain', 'Tema', 'full_time', 'Mid level',
   'Keep stock accurate and product available. You will run receipts, storage, picking and dispatch, and be the reason the numbers reconcile.',
   array['Manage inward receipt, storage and dispatch of finished goods.', 'Run cycle counts and reconcile physical stock to system records.', 'Coordinate with transport on loading and delivery schedules.', 'Maintain warehouse safety and housekeeping standards.']::text[],
   array['HND or degree in supply chain, logistics or accounting.', 'Two or more years in warehouse or inventory management.', 'Strong ERP or inventory system experience and confident with spreadsheets.']::text[],
   'draft', date '2026-08-27', date '2026-09-25', false, 80),
  ('LX-SCM-044', 'Procurement Officer', 'Supply chain', 'Accra', 'contract', 'Mid level',
   'Source raw materials and packaging on time, on spec and on cost, and build supplier relationships that hold up when the schedule tightens.',
   array['Raise and track purchase orders against production plans.', 'Evaluate suppliers on price, quality, lead time and reliability.', 'Negotiate terms and maintain the approved supplier list.', 'Support import documentation and clearing where required.']::text[],
   array['Degree in procurement, supply chain or business administration.', 'Three or more years in procurement, ideally manufacturing inputs.', 'Familiarity with import processes and Ghanaian clearing requirements.']::text[],
   'draft', date '2026-08-18', date '2026-09-17', false, 90),
  ('LX-FIN-072', 'Management Accountant', 'Corporate', 'Accra', 'full_time', 'Senior',
   'Turn factory and sales data into decisions: product costing, variance analysis, budgets and the monthly numbers leadership runs the business on.',
   array['Prepare monthly management accounts and variance commentary.', 'Own product costing and margin analysis by brand and SKU.', 'Lead the annual budget and quarterly reforecast process.', 'Support statutory audit and tax compliance.']::text[],
   array['Degree in accounting or finance; ICAG or ACCA qualified or finalist.', 'Four or more years in a manufacturing finance role.', 'Strong costing experience and advanced spreadsheet skills.']::text[],
   'draft', date '2026-08-22', date '2026-09-21', false, 100),
  ('LX-HR-021', 'HR Officer, Learning and Development', 'Corporate', 'Accra', 'full_time', 'Mid level',
   'Build the training and onboarding that make our growth-from-within promise real, from technical certification to first-week induction.',
   array['Design and run the annual training calendar across functions.', 'Manage onboarding for new joiners end to end.', 'Coordinate mentorship pairings and track development plans.', 'Maintain training records and measure programme impact.']::text[],
   array['Degree in human resources, psychology or a related field.', 'Two or more years in L&D or generalist HR, ideally in manufacturing.', 'Confident facilitating a room of mixed seniority.']::text[],
   'draft', date '2026-09-04', date '2026-10-04', false, 110),
  ('LX-GRD-006', 'Graduate Trainee Programme 2027', 'Corporate', 'Accra', 'internship', 'Graduate',
   'An eighteen-month rotation across production, quality, sales and marketing, with a permanent role at the end for those who earn it.',
   array['Complete four supervised rotations with real deliverables in each.', 'Run an improvement project in your final rotation and present it to leadership.', 'Work alongside an assigned mentor throughout.']::text[],
   array['First degree completed within the last two years, second class upper or better.', 'National service completed or in progress.', 'Evidence of initiative outside the classroom.', 'Open to being placed in any function based on fit.']::text[],
   'draft', date '2026-09-01', date '2026-10-31', false, 120)
on conflict (reference) do nothing;
