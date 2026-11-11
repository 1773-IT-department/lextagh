-- 0013_csr_tracker: the CSR activity tracker (scoreboard item 25), one of the 8 systems of the Lexta Business System.
-- Marketing logs each CSR activity: the date, the programme, where it happened (region and town or place), how many
-- people it reached, partners, notes and photos. Managers see the list and the totals per programme.
-- Only new objects. No existing table, function, trigger or policy is changed. The new functions read
-- public.order_author_kept (0010) and the existing private.field_photo_secret (0011), and the photo record check
-- reads storage.objects, without changing them.
-- Seeded: the CSR programmes named on the Lexta website's CSR page (apps/lexta, corporate-social-responsibility), each
-- marked needs_review so the portal shows them as "from the website, check and edit". Admin renames, edits, switches
-- off or deletes them like any other programme. No activities are seeded.
--
-- Tables
--   csr_programmes        the programme list (name, optional brand, description, active flag). Admin manages it
--   csr_activities        one CSR activity: date, programme, region, town or place, people reached, partners, notes,
--                         status (planned or done)
--   csr_activity_photos   photos in the private csr-activity-photos bucket. Only the portal's server adds a record,
--                         after checking the file's first bytes, with a signature only it can make (as field sales)
--
-- Who can do what:
--   admin                        everything: programmes, activities of every programme, photos, deletes
--   marketing                    read every programme, activity and photo; log and change activities of programmes
--                                with no brand or of a brand they work on (profile_brands); add photos to those
--                                activities and remove photos they added themselves
--   management                   read everything (programmes, activities, photos, totals); no changes
--   sales_rep, customer_care,    nothing at all
--   hr, distributor, no role,
--   website visitors
-- Only admin deletes activities and programmes. A programme that has activities cannot be deleted (switch it off).
-- Totals count only activities marked done: planned activities show in the list and as "next planned" but their
-- people reached are not added up until they are marked done.
-- Deleting a person never fails: their activities and photos stay, with the author links cleared (order_author_kept).
-- Deleting a region never fails: activities keep their town or place and lose only the region link.

-- Helpers -------------------------------------------------------------------------------------------------------
-- CSR roles: admin, management and marketing read.
create function public.csr_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'marketing'), false);
$$;

-- CSR writers: admin and marketing.
create function public.csr_writer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'marketing'), false);
$$;

revoke all on function public.csr_role() from public, anon;
revoke all on function public.csr_writer() from public, anon;
grant execute on function public.csr_role() to authenticated;
grant execute on function public.csr_writer() to authenticated;

-- Programmes ----------------------------------------------------------------------------------------------------
create table public.csr_programmes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 120),
  -- Optional: a programme led by one brand. Empty for corporate Lexta programmes (and those led by several brands).
  brand_id uuid references public.brands (id) on delete set null,
  description text check (description is null or length(btrim(description)) between 1 and 2000),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  -- Seeded from the website: the portal asks admin to check it. Cleared when admin saves the programme.
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create index csr_programmes_brand_idx on public.csr_programmes (brand_id);
create index csr_programmes_created_by_idx on public.csr_programmes (created_by);
create index csr_programmes_updated_by_idx on public.csr_programmes (updated_by);

create trigger csr_programmes_set_updated_at before update on public.csr_programmes
  for each row execute function public.set_updated_at();

-- Authors come from the session. An old author is kept only while that person exists, and a person being deleted is
-- never written back, so deleting a person never fails (order_author_kept, 0010).
create function public.set_csr_programme_authors()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
    new.updated_by := (select auth.uid());
    return new;
  end if;
  new.created_by := public.order_author_kept(old.created_by);
  new.created_at := old.created_at;
  if (new.name, new.brand_id, new.description, new.is_active, new.sort_order, new.needs_review)
     is distinct from (old.name, old.brand_id, old.description, old.is_active, old.sort_order, old.needs_review)
     and (select auth.uid()) is not null then
    new.updated_by := public.order_author_kept((select auth.uid()));
  else
    new.updated_by := public.order_author_kept(old.updated_by);
  end if;
  return new;
end;
$$;

revoke all on function public.set_csr_programme_authors() from public, anon, authenticated;

create trigger csr_programmes_set_authors before insert or update on public.csr_programmes
  for each row execute function public.set_csr_programme_authors();

-- The programmes the Lexta website's CSR page names. Check and edit them in the portal.
insert into public.csr_programmes (name, brand_id, description, sort_order, needs_review) values
  ('The Dignity Project', (select id from public.brands where slug = 'yazz'),
   'Keeping adolescent girls in school: free product distribution, reproductive health education and sustained presence in schools.', 10, true),
  ('The Empowered Periods Campaign', null,
   'Annual nationwide activation led by Yazz and Linzzy: free sanitary products and menstrual hygiene education.', 20, true),
  ('The Lexta Teen Care Campaign', null,
   'Personal care and hygiene education for senior high school students, with school clean up competitions. Since February 2017.', 30, true),
  ('Cervical cancer awareness school tour', null,
   'School visits with the Medical Women Association of Ghana on cervical cancer and femcare.', 40, true),
  ('The Bright Smiles School Tour', null,
   'With the Ghana Dental Association: free screenings and oral hygiene workshops in rural primary schools.', 50, true),
  ('The Safe Bottoms Initiative', null,
   'Mechanised boreholes for communities facing water scarcity, funded by jumbo pack sales.', 60, true),
  ('The Lexta Forest Project', null,
   'Planting indigenous trees to restore degraded forest reserves in the Ashanti and Eastern regions.', 70, true),
  ('Clean Hands, Green Land', null,
   'Plastic buy back: consumers return empty sachet and detergent wrappers to distributors for Eco Points.', 80, true)
on conflict (name) do nothing;

-- Activities ----------------------------------------------------------------------------------------------------
create table public.csr_activities (
  id uuid primary key default gen_random_uuid(),
  -- A programme with activities cannot be deleted: switch it off instead.
  programme_id uuid not null references public.csr_programmes (id) on delete restrict,
  activity_date date not null check (activity_date >= date '2000-01-01'),
  status text not null default 'done' check (status in ('planned', 'done')),
  -- Required when an activity is saved; cleared only when the region itself is deleted.
  region_id uuid references public.regions (id) on delete set null,
  place text not null check (length(btrim(place)) between 1 and 160),
  people_reached integer not null default 0 check (people_reached between 0 and 10000000),
  partners text check (partners is null or length(btrim(partners)) between 1 and 500),
  notes text check (notes is null or length(btrim(notes)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create index csr_activities_date_idx on public.csr_activities (activity_date desc);
create index csr_activities_programme_idx on public.csr_activities (programme_id, activity_date desc);
create index csr_activities_region_idx on public.csr_activities (region_id);
create index csr_activities_created_by_idx on public.csr_activities (created_by);
create index csr_activities_updated_by_idx on public.csr_activities (updated_by);

create trigger csr_activities_set_updated_at before update on public.csr_activities
  for each row execute function public.set_updated_at();

-- May the signed in person log or change activities of this programme? Admin: any. Marketing: a programme with no
-- brand, or of a brand they work on.
create function public.csr_may_write_programme(target_programme uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.csr_writer()
     and exists (
       select 1 from public.csr_programmes p
       where p.id = target_programme
         and (public.is_admin() or p.brand_id is null or public.has_brand_access(p.brand_id))
     );
$$;

-- May this person see this activity (and its photos)? Every CSR role sees every activity.
create function public.csr_activity_can_see(target_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.csr_role() and exists (select 1 from public.csr_activities a where a.id = target_activity);
$$;

-- May this person change this activity (details and photos)? Same rule as csr_may_write_programme, by its programme.
create function public.csr_activity_can_edit(target_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.csr_writer()
     and exists (
       select 1 from public.csr_activities a
       where a.id = target_activity and public.csr_may_write_programme(a.programme_id)
     );
$$;

revoke all on function public.csr_may_write_programme(uuid) from public, anon;
revoke all on function public.csr_activity_can_see(uuid) from public, anon;
revoke all on function public.csr_activity_can_edit(uuid) from public, anon;
grant execute on function public.csr_may_write_programme(uuid) to authenticated;
grant execute on function public.csr_activity_can_see(uuid) to authenticated;
grant execute on function public.csr_activity_can_edit(uuid) to authenticated;

-- A new activity: an active programme the person may write, a region, authors from the session. A change: a new
-- programme must also be active and writable, the region stays required while it exists, authors are kept (and
-- cleared only when that person is deleted). Security definer to read programmes and regions whatever the policies.
create function public.check_csr_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' or new.programme_id is distinct from old.programme_id then
    if me is not null and not public.csr_may_write_programme(new.programme_id) then
      raise exception 'you cannot log activities for that programme' using errcode = '42501';
    end if;
    if not exists (select 1 from public.csr_programmes p where p.id = new.programme_id and p.is_active) then
      raise exception 'choose an active programme' using errcode = '23514';
    end if;
  end if;
  if new.status = 'done' and new.activity_date > current_date + 1 then
    raise exception 'an activity in the future is planned, not done' using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    if new.region_id is null then
      raise exception 'choose a region' using errcode = '23514';
    end if;
    new.created_by := me;
    new.updated_by := me;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- The region link is only cleared by the database, when the region is deleted.
  if new.region_id is null and exists (select 1 from public.regions r where r.id = old.region_id) then
    raise exception 'choose a region' using errcode = '23514';
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  new.created_by := public.order_author_kept(old.created_by);
  if (new.programme_id, new.activity_date, new.status, new.region_id, new.place, new.people_reached, new.partners, new.notes)
     is distinct from (old.programme_id, old.activity_date, old.status, old.region_id, old.place, old.people_reached, old.partners, old.notes)
     and me is not null and new.region_id is not null then
    -- Checked too: the person being deleted may be the one signed in.
    new.updated_by := public.order_author_kept(me);
  else
    new.updated_by := public.order_author_kept(old.updated_by);
  end if;
  return new;
end;
$$;

revoke all on function public.check_csr_activity() from public, anon, authenticated;

create trigger csr_activities_check before insert or update on public.csr_activities
  for each row execute function public.check_csr_activity();

-- Photos --------------------------------------------------------------------------------------------------------
-- The activity a storage path belongs to: <activity id>/<photo id>.<jpg|png|webp>. Null for any other shape.
create function public.csr_activity_id_from_path(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

revoke all on function public.csr_activity_id_from_path(text) from public, anon;
grant execute on function public.csr_activity_id_from_path(text) to authenticated;

create table public.csr_activity_photos (
  -- Made by the browser for this photo: a retried upload never adds it twice.
  id uuid primary key,
  activity_id uuid not null references public.csr_activities (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (public.csr_activity_id_from_path(storage_path) = activity_id),
  check (split_part(split_part(storage_path, '/', 2), '.', 1) = id::text),
  check (
    (mime_type = 'image/jpeg' and storage_path like '%.jpg')
    or (mime_type = 'image/png' and storage_path like '%.png')
    or (mime_type = 'image/webp' and storage_path like '%.webp')
  )
);

create index csr_activity_photos_activity_idx on public.csr_activity_photos (activity_id, created_at);
create index csr_activity_photos_created_by_idx on public.csr_activity_photos (created_by);

create trigger csr_activity_photos_set_updated_at before update on public.csr_activity_photos
  for each row execute function public.set_updated_at();

-- A photo's author comes from the session and is kept (cleared only when that person is deleted). At most 20 photos
-- an activity. A photo is never changed otherwise.
create function public.check_csr_activity_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Lock the activity first, so two uploads at the same time cannot both pass the count.
    perform 1 from public.csr_activities a where a.id = new.activity_id for update;
    if (select count(*) from public.csr_activity_photos p where p.activity_id = new.activity_id) >= 20 then
      raise exception 'at most 20 photos an activity' using errcode = '23514';
    end if;
    new.created_by := (select auth.uid());
    return new;
  end if;
  new.id := old.id;
  new.activity_id := old.activity_id;
  new.storage_path := old.storage_path;
  new.mime_type := old.mime_type;
  new.size_bytes := old.size_bytes;
  new.created_at := old.created_at;
  new.created_by := public.order_author_kept(old.created_by);
  return new;
end;
$$;

revoke all on function public.check_csr_activity_photo() from public, anon, authenticated;

create trigger csr_activity_photos_check before insert or update on public.csr_activity_photos
  for each row execute function public.check_csr_activity_photo();

-- Table privileges ----------------------------------------------------------------------------------------------
-- Website visitors get nothing. Signed in people write only the columns a person chooses; the rest come from the
-- database.
revoke all on public.csr_programmes, public.csr_activities, public.csr_activity_photos from anon, authenticated;
grant select on public.csr_programmes, public.csr_activities, public.csr_activity_photos to authenticated;
grant insert (name, brand_id, description, is_active, sort_order, needs_review),
  update (name, brand_id, description, is_active, sort_order, needs_review), delete
  on public.csr_programmes to authenticated;
grant insert (programme_id, activity_date, status, region_id, place, people_reached, partners, notes),
  update (programme_id, activity_date, status, region_id, place, people_reached, partners, notes), delete
  on public.csr_activities to authenticated;
-- Photo records: no insert for people. Only public.record_csr_activity_photo adds them (see Recording photos below).
grant delete on public.csr_activity_photos to authenticated;

-- Row Level Security --------------------------------------------------------------------------------------------
alter table public.csr_programmes enable row level security;
alter table public.csr_activities enable row level security;
alter table public.csr_activity_photos enable row level security;

create policy "csr roles read programmes"
  on public.csr_programmes for select to authenticated
  using ((select public.csr_role()));

create policy "admins add programmes"
  on public.csr_programmes for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins change programmes"
  on public.csr_programmes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- A programme with activities cannot be deleted (on delete restrict): switch it off instead.
create policy "admins delete programmes"
  on public.csr_programmes for delete to authenticated
  using ((select public.is_admin()));

create policy "csr roles read activities"
  on public.csr_activities for select to authenticated
  using ((select public.csr_role()));

-- The programme rule (active, brand) is in check_csr_activity().
create policy "admin and marketing log activities"
  on public.csr_activities for insert to authenticated
  with check ((select public.csr_writer()));

create policy "admin and marketing change activities of their programmes"
  on public.csr_activities for update to authenticated
  using ((select public.csr_activity_can_edit(id)))
  with check ((select public.csr_writer()));

create policy "admins delete activities"
  on public.csr_activities for delete to authenticated
  using ((select public.is_admin()));

create policy "csr roles read photo records"
  on public.csr_activity_photos for select to authenticated
  using ((select public.csr_activity_can_see(activity_id)));

create policy "admins and the person who added it remove a photo record"
  on public.csr_activity_photos for delete to authenticated
  using (
    (select public.is_admin())
    or (created_by = (select auth.uid()) and (select public.csr_activity_can_edit(activity_id)))
  );
-- No insert policy (records come from public.record_csr_activity_photo) and no update policy: a photo is added or
-- removed, never changed.

-- Storage: csr-activity-photos bucket ---------------------------------------------------------------------------
-- A file in the bucket is not a photo of the activity until the portal records it (record_csr_activity_photo), and
-- only recorded photos are ever shown. Files nobody recorded (a failed upload, or bytes sent straight to the Storage
-- API) are limited to 25 files an activity in all: the 20 photos an activity may have and 5 spare for retries.
create function public.csr_photo_room(target_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from storage.objects o
          where o.bucket_id = 'csr-activity-photos' and public.csr_activity_id_from_path(o.name) = target_activity) < 25;
$$;

revoke all on function public.csr_photo_room(uuid) from public, anon;
grant execute on function public.csr_photo_room(uuid) to authenticated;

-- Private. Photos are only ever served through short lived signed links the portal makes with the person's own
-- session (these policies decide). Path: <activity id>/<photo id>.<jpg|png|webp>. JPEG, PNG and WebP up to 5 MB.
-- No overwriting. Admin removes any file; the person who uploaded a file removes it while they may change the activity.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('csr-activity-photos', 'csr-activity-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "csr roles read csr activity photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'csr-activity-photos' and (select public.csr_activity_can_see(public.csr_activity_id_from_path(name))));

create policy "csr writers upload photos to activities they may change"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'csr-activity-photos'
    and (select public.csr_activity_can_edit(public.csr_activity_id_from_path(name)))
    and (select public.csr_photo_room(public.csr_activity_id_from_path(name)))
  );

create policy "admins and uploaders delete csr activity photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'csr-activity-photos'
    and (
      (select public.is_admin())
      or (owner = (select auth.uid()) and (select public.csr_activity_can_edit(public.csr_activity_id_from_path(name))))
    )
  );

-- Recording photos ----------------------------------------------------------------------------------------------
-- Uses the portal's existing photo secret, private.field_photo_secret (0011; env FIELD_PHOTO_SECRET on the portal),
-- so there is nothing new to set up. The signed text starts with 'csr-photo.' (field sales signs 'field-photo.'), so a
-- signature made for one can never be used for the other.
-- The server signs, with the shared secret, the text
--   csr-photo.<photo id>.<activity id>.<mime type>.<size in bytes>.<issued at, unix seconds>
-- after checking the file's first bytes and uploading it with the person's own session. The database checks the
-- signature (10 minutes old at most), that the person may still change the activity, and that the file at
-- <activity id>/<photo id>.<ext> exists, was uploaded by this person, has exactly that size and type in Storage and
-- was stored no later than the signature's time (the server rounds that time up to the next second).
-- Recording the same photo again (a retry) returns false and changes nothing. Security definer because people have
-- no insert rights on csr_activity_photos and cannot read the secret.
-- Errors: 55000 not set up, 22023 bad signature or time, 42501 not allowed, 23514 file missing or different.
create function public.record_csr_activity_photo(photo_id uuid, activity_id uuid, mime_type text, size_bytes integer,
  issued_at bigint, signature text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_ext text;
  v_path text;
  v_existing uuid;
begin
  select s.secret into v_secret from private.field_photo_secret s where s.id;
  if v_secret is null then
    raise exception 'photo uploads are not set up' using errcode = '55000';
  end if;
  if photo_id is null or activity_id is null or issued_at is null or signature is null or signature !~ '^[0-9a-f]{64}$'
     or size_bytes is null or size_bytes not between 1 and 5242880 then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  v_ext := case mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' end;
  if v_ext is null then
    raise exception 'invalid field: mime_type' using errcode = '22023';
  end if;
  -- Compared as HMACs of both values, so the time the comparison takes says nothing about the expected signature.
  if extensions.hmac(encode(extensions.hmac('csr-photo.' || photo_id::text || '.' || activity_id::text || '.' || mime_type
       || '.' || size_bytes::text || '.' || issued_at::text, v_secret, 'sha256'), 'hex'), v_secret, 'sha256')
     <> extensions.hmac(signature, v_secret, 'sha256') then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  if issued_at < extract(epoch from now())::bigint - 600 or issued_at > extract(epoch from now())::bigint + 60 then
    raise exception 'invalid field: issued_at' using errcode = '22023';
  end if;
  if not public.csr_activity_can_edit(activity_id) then
    raise exception 'not allowed to change this activity' using errcode = '42501';
  end if;
  select p.activity_id into v_existing from public.csr_activity_photos p where p.id = photo_id;
  if v_existing is not null then
    if v_existing <> activity_id then
      raise exception 'invalid field: photo_id' using errcode = '22023';
    end if;
    return false;
  end if;
  v_path := activity_id::text || '/' || photo_id::text || '.' || v_ext;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'csr-activity-photos' and o.name = v_path and o.owner = (select auth.uid())
      and (o.metadata ->> 'size')::bigint = size_bytes and o.metadata ->> 'mimetype' = mime_type
      -- The server signs after its upload, so a file put there after the signature (a swap) is refused.
      and o.created_at <= to_timestamp(issued_at) + interval '5 seconds'
  ) then
    raise exception 'the photo file is missing or different' using errcode = '23514';
  end if;
  insert into public.csr_activity_photos (id, activity_id, storage_path, mime_type, size_bytes)
  values (photo_id, activity_id, v_path, mime_type, size_bytes);
  return true;
end;
$$;

revoke all on function public.record_csr_activity_photo(uuid, uuid, text, integer, bigint, text) from public, anon;
grant execute on function public.record_csr_activity_photo(uuid, uuid, text, integer, bigint, text) to authenticated;

-- Reading -------------------------------------------------------------------------------------------------------
-- A staff member's display name for "logged by", for CSR roles only (marketing cannot read other people's profiles),
-- and only for the caller or someone who authored a CSR programme, activity or photo: never a name lookup for anyone.
create function public.csr_person_name(target_profile uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.full_name), ''), p.email) from public.profiles p
  where p.id = target_profile and public.csr_role()
    and (
      p.id = (select auth.uid())
      or exists (select 1 from public.csr_activities a where a.created_by = p.id or a.updated_by = p.id)
      or exists (select 1 from public.csr_activity_photos ph where ph.created_by = p.id)
      or exists (select 1 from public.csr_programmes pr where pr.created_by = p.id or pr.updated_by = p.id)
    );
$$;

revoke all on function public.csr_person_name(uuid) from public, anon;
grant execute on function public.csr_person_name(uuid) to authenticated;

-- Activities with filters, newest first, with the total for paging (p_id: one activity). Dates are calendar days.
-- Security invoker: Row Level Security decides what is read.
create function public.csr_activity_list(
  p_programme uuid default null, p_region uuid default null, p_from date default null, p_to date default null,
  p_status text default null, p_q text default null, p_limit integer default 50, p_offset integer default 0,
  p_id uuid default null)
returns table (id uuid, activity_date date, status text, programme_id uuid, programme_name text, brand_id uuid,
               region_id uuid, region_name text, place text, people_reached integer, partners text, notes text,
               photo_count integer, created_by uuid, created_by_name text, updated_by_name text,
               created_at timestamptz, updated_at timestamptz, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select a.id, a.activity_date, a.status, a.programme_id, pr.name, pr.brand_id, a.region_id, r.name, a.place,
    a.people_reached, a.partners, a.notes,
    (select count(*)::integer from public.csr_activity_photos ph where ph.activity_id = a.id),
    a.created_by, public.csr_person_name(a.created_by), public.csr_person_name(a.updated_by),
    a.created_at, a.updated_at,
    count(*) over ()
  from public.csr_activities a
  join public.csr_programmes pr on pr.id = a.programme_id
  left join public.regions r on r.id = a.region_id
  where (p_id is null or a.id = p_id)
    and (p_programme is null or a.programme_id = p_programme)
    and (p_region is null or a.region_id = p_region)
    and (p_from is null or a.activity_date >= p_from)
    and (p_to is null or a.activity_date <= p_to)
    and (p_status is null or a.status = p_status)
    and (coalesce(btrim(p_q), '') = '' or a.place ilike '%' || btrim(p_q) || '%'
         or a.partners ilike '%' || btrim(p_q) || '%' or a.notes ilike '%' || btrim(p_q) || '%')
  order by a.activity_date desc, a.created_at desc, a.id
  limit least(greatest(coalesce(p_limit, 50), 1), 5000) offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Totals per programme for a date range and region (all optional): activities done, people reached by those,
-- the last done date, planned activities and the next planned date (today or later). Every programme the person
-- sees is listed (p_programme: one), with zeros when nothing matches; switched off programmes only when they have
-- matching activities. Security invoker: Row Level Security decides what is counted.
create function public.csr_programme_totals(
  p_from date default null, p_to date default null, p_region uuid default null, p_programme uuid default null)
returns table (programme_id uuid, programme_name text, brand_id uuid, is_active boolean, sort_order integer,
               activities_done bigint, people_reached bigint, last_activity_date date,
               activities_planned bigint, next_planned_date date)
language sql
stable
security invoker
set search_path = ''
as $$
  select pr.id, pr.name, pr.brand_id, pr.is_active, pr.sort_order,
    count(a.id) filter (where a.status = 'done'),
    coalesce(sum(a.people_reached) filter (where a.status = 'done'), 0)::bigint,
    max(a.activity_date) filter (where a.status = 'done'),
    count(a.id) filter (where a.status = 'planned'),
    min(a.activity_date) filter (where a.status = 'planned' and a.activity_date >= current_date)
  from public.csr_programmes pr
  left join public.csr_activities a on a.programme_id = pr.id
    and (p_region is null or a.region_id = p_region)
    and (p_from is null or a.activity_date >= p_from)
    and (p_to is null or a.activity_date <= p_to)
  where (p_programme is null or pr.id = p_programme)
  group by pr.id
  having pr.is_active or count(a.id) > 0
  order by pr.sort_order, pr.name;
$$;

-- Deletes an activity with its photo records (admin only). Remove the photo files through the Storage API first;
-- the portal does.
create function public.delete_csr_activity(target_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  delete from public.csr_activities where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to delete this activity' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.csr_activity_list(uuid, uuid, date, date, text, text, integer, integer, uuid) from public, anon;
revoke all on function public.csr_programme_totals(date, date, uuid, uuid) from public, anon;
revoke all on function public.delete_csr_activity(uuid) from public, anon;
grant execute on function public.csr_activity_list(uuid, uuid, date, date, text, text, integer, integer, uuid) to authenticated;
grant execute on function public.csr_programme_totals(date, date, uuid, uuid) to authenticated;
grant execute on function public.delete_csr_activity(uuid) to authenticated;
