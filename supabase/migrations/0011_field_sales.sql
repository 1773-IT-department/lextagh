-- 0011_field_sales: the field sales app (scoreboard item 24). Sales reps log shop visits on their phone: the shop, the
-- time, where they were, what happened, notes, photos and an optional quick stock check. Managers see every visit.
-- Creates new objects. Changes to existing objects, all listed under "Changes to existing objects" below: two trigger
-- functions are replaced (set_stockist_authors from 0005, set_crm_activity_author from 0006) so that deleting a rep who
-- added a shop or logged a visit on the CRM never fails, and one new trigger is added on public.stockists (it only acts
-- on shops added from a field visit). Nothing is dropped. Nothing is seeded except the four starting visit outcomes (a
-- lookup list like the regions in 0005), which an admin can rename, add to or switch off.
--
-- Tables
--   field_visit_outcomes       the outcome list (Order taken, No order, Follow up needed, Shop closed). Admin edits it
--   field_visits               one shop visit. Its id is the nonce the phone makes, so a retried save never saves twice.
--                              Shop name, town, region and brands are copied from the stockist when the visit is made,
--                              so the visit still reads correctly if the shop is changed or deleted later
--   field_visit_stock_checks   optional: which SKUs were on the shelf, with an optional facing count
--   field_visit_photos         photos in the private field-visit-photos bucket. Only the portal's server adds a
--                              record, after checking the file's first bytes, with a signature only it can make
--   field_new_shops            shops added from a visit, until admin or marketing confirm them
--
-- The shop is a stockist (0005). A shop the rep finds that is not listed yet is added as a draft stockist: inactive,
-- so it is not on Where to Buy, carrying the rep's brands, with a staff note saying it came from a field visit, and
-- listed in field_new_shops. Only admin or marketing can switch such a shop on in Stockists (the trigger
-- stockists_field_draft_check refuses anyone else, the rep who added it included); switching it on confirms it. The
-- visit is marked new_shop so managers see which shops need confirming. Stockists created any other way follow 0005
-- unchanged.
-- When a CRM organisation is linked to the stockist (crm_organisations.stockist_id), the visit is also written on that
-- organisation's CRM timeline as a 'visit' activity, through the CRM's own rules (0006).
--
-- Who can do what:
--   sales_rep                    log visits of their own (the rep is always the signed in person), see only their own
--                                visits and photos, visit only stockists carrying one of their brands (or a draft shop
--                                they added that has no brand yet), check stock only of their brands' SKUs, change the
--                                outcome, notes, stock check and photos of their own visit for 24 hours
--   management                   see every visit and photo; log visits of their own at any shop
--   admin                        everything management does, change any visit at any time, manage outcomes, delete
--                                visits and photos (the only role that deletes)
--   distributor, customer_care,  nothing at all
--   hr, marketing, no role,
--   website visitors
-- Location (latitude, longitude, accuracy in metres) comes from the phone's Geolocation API. It is optional: when the
-- rep refuses or the phone cannot tell, location_status says so ('denied' or 'unavailable') and the numbers stay empty.
-- Deleting a person never fails: their visits stay, with the rep link cleared (same rule as order_author_kept, 0010).

-- Changes to existing objects (the only ones) ---------------------------------------------------------------------
-- Field sales makes sales reps the authors of stockists (new shops) and CRM activities (visits on the timeline). The
-- author triggers of both (0005, 0006) put the old author back on every update, so deleting a person who created a
-- stockist or a CRM activity failed: the on delete set null was undone and the foreign key refused it. They now keep
-- the old author only while that person still exists, the rule order_author_kept brought in for orders (0010).
-- set_stockist_authors also passes updated_by (the signed in person) through order_author_kept, so a person being
-- deleted is never written back either. Nothing else about them changes. The third change, a new trigger on
-- public.stockists for draft shops from field visits, is with field_new_shops below.
create or replace function public.set_stockist_authors()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = public.order_author_kept(old.created_by);
  end if;
  -- Checked too: the person being deleted may be the one signed in.
  new.updated_by = public.order_author_kept((select auth.uid()));
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
    new.created_by = public.order_author_kept(old.created_by);
  end if;
  return new;
end;
$$;

-- Helpers -------------------------------------------------------------------------------------------------------
-- Field sales roles: admin, management and sales reps.
create function public.field_sales_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'sales_rep'), false);
$$;

-- May this person log a visit at this stockist? Admin and management: any. Sales reps: a stockist carrying one of
-- their brands, or one with no brand yet that they created themselves.
create function public.field_may_visit_stockist(target_stockist uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.field_sales_role()
     and exists (select 1 from public.stockists s where s.id = target_stockist)
     and (
       public.sees_all_brands()
       or exists (
         select 1 from public.stockist_brands sb
         where sb.stockist_id = target_stockist and public.has_brand_access(sb.brand_id)
       )
       or (
         not exists (select 1 from public.stockist_brands sb where sb.stockist_id = target_stockist)
         and exists (select 1 from public.stockists s where s.id = target_stockist and s.created_by = (select auth.uid()))
       )
     );
$$;

-- Did the signed in person create this stockist? (created_by is not readable by people directly, see 0005.)
create function public.field_stockist_mine(target_stockist uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.stockists s where s.id = target_stockist and s.created_by = (select auth.uid()));
$$;

-- Straight line distance in metres between two points (haversine). Null when a point is missing.
create function public.field_distance_m(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null else
    round(2 * 6371000 * asin(least(1, sqrt(
      power(sin(radians((lat2 - lat1)::float8) / 2), 2)
      + cos(radians(lat1::float8)) * cos(radians(lat2::float8)) * power(sin(radians((lng2 - lng1)::float8) / 2), 2)
    ))))::integer
  end;
$$;

revoke all on function public.field_sales_role() from public, anon;
revoke all on function public.field_may_visit_stockist(uuid) from public, anon;
revoke all on function public.field_stockist_mine(uuid) from public, anon;
revoke all on function public.field_distance_m(numeric, numeric, numeric, numeric) from public, anon;
grant execute on function public.field_sales_role() to authenticated;
grant execute on function public.field_may_visit_stockist(uuid) to authenticated;
grant execute on function public.field_stockist_mine(uuid) to authenticated;
grant execute on function public.field_distance_m(numeric, numeric, numeric, numeric) to authenticated;

-- Outcomes ------------------------------------------------------------------------------------------------------
create table public.field_visit_outcomes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$' and length(slug) <= 40),
  label text not null unique check (length(btrim(label)) between 1 and 60),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger field_visit_outcomes_set_updated_at before update on public.field_visit_outcomes
  for each row execute function public.set_updated_at();

insert into public.field_visit_outcomes (slug, label, sort_order) values
  ('order_taken', 'Order taken', 10),
  ('no_order', 'No order', 20),
  ('follow_up', 'Follow up needed', 30),
  ('shop_closed', 'Shop closed', 40)
on conflict (slug) do nothing;

-- Visits --------------------------------------------------------------------------------------------------------
create table public.field_visits (
  -- The nonce the phone made for this visit: a retried save finds the visit instead of making a second one.
  id uuid primary key,
  rep_id uuid references public.profiles (id) on delete set null,
  stockist_id uuid references public.stockists (id) on delete set null,
  -- The rep added this shop during the visit (a draft stockist for staff to confirm).
  new_shop boolean not null default false,
  shop_name text not null check (length(btrim(shop_name)) between 1 and 160),
  region_id uuid references public.regions (id) on delete set null,
  town text check (town is null or length(btrim(town)) between 1 and 80),
  -- The brands the visit was for: the shop's brands the rep works on (every brand of the shop for admin and management).
  brand_ids uuid[] not null default '{}',
  visited_at timestamptz not null default now(),
  location_status text not null check (location_status in ('captured', 'denied', 'unavailable')),
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  accuracy_m integer check (accuracy_m is null or accuracy_m between 0 and 100000),
  outcome_id uuid not null references public.field_visit_outcomes (id) on delete restrict,
  notes text check (notes is null or length(btrim(notes)) between 1 and 2000),
  crm_activity_id uuid references public.crm_activities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  -- A location is all three numbers or none, and only when it was captured.
  check (case when location_status = 'captured' then num_nonnulls(latitude, longitude, accuracy_m) = 3
              else num_nonnulls(latitude, longitude, accuracy_m) = 0 end)
);

create index field_visits_rep_idx on public.field_visits (rep_id, visited_at desc);
create index field_visits_visited_idx on public.field_visits (visited_at desc);
create index field_visits_stockist_idx on public.field_visits (stockist_id);
create index field_visits_region_idx on public.field_visits (region_id);
create index field_visits_outcome_idx on public.field_visits (outcome_id);
create index field_visits_crm_activity_idx on public.field_visits (crm_activity_id);
create index field_visits_updated_by_idx on public.field_visits (updated_by);
create index field_visits_brand_ids_idx on public.field_visits using gin (brand_ids);

create trigger field_visits_set_updated_at before update on public.field_visits
  for each row execute function public.set_updated_at();

-- Stock checks --------------------------------------------------------------------------------------------------
create table public.field_visit_stock_checks (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.field_visits (id) on delete cascade,
  sku_id uuid references public.product_skus (id) on delete set null,
  brand_id uuid not null references public.brands (id) on delete restrict,
  product_name_snapshot text not null,
  sku_code_snapshot text not null,
  variant_snapshot text,
  pack_size_snapshot text not null,
  on_shelf boolean not null,
  -- How many facings were on the shelf (optional). None on the shelf means no facings.
  facings integer check (facings is null or facings between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (visit_id, sku_id),
  constraint field_visit_stock_facings_need_shelf check (on_shelf or facings is null or facings = 0)
);

create index field_visit_stock_checks_sku_idx on public.field_visit_stock_checks (sku_id);
create index field_visit_stock_checks_brand_idx on public.field_visit_stock_checks (brand_id);

create trigger field_visit_stock_checks_set_updated_at before update on public.field_visit_stock_checks
  for each row execute function public.set_updated_at();

-- Photos --------------------------------------------------------------------------------------------------------
-- The visit a storage path belongs to: <visit id>/<photo id>.<jpg|png|webp>. Null for any other shape.
create function public.field_visit_id_from_path(object_name text)
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

revoke all on function public.field_visit_id_from_path(text) from public, anon;
grant execute on function public.field_visit_id_from_path(text) to authenticated;

create table public.field_visit_photos (
  -- The nonce the phone made for this photo: a retried upload never adds it twice.
  id uuid primary key,
  visit_id uuid not null references public.field_visits (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (public.field_visit_id_from_path(storage_path) = visit_id),
  check (split_part(split_part(storage_path, '/', 2), '.', 1) = id::text),
  check (
    (mime_type = 'image/jpeg' and storage_path like '%.jpg')
    or (mime_type = 'image/png' and storage_path like '%.png')
    or (mime_type = 'image/webp' and storage_path like '%.webp')
  )
);

create index field_visit_photos_visit_idx on public.field_visit_photos (visit_id, created_at);
create index field_visit_photos_created_by_idx on public.field_visit_photos (created_by);

create trigger field_visit_photos_set_updated_at before update on public.field_visit_photos
  for each row execute function public.set_updated_at();

-- Visit helpers -------------------------------------------------------------------------------------------------
-- May this person see this visit? Admin and management: every visit. Sales reps: their own.
create function public.field_visit_can_see(target_visit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.field_sales_role()
     and exists (
       select 1 from public.field_visits v
       where v.id = target_visit and (public.sees_all_brands() or v.rep_id = (select auth.uid()))
     );
$$;

-- May this person change this visit (outcome, notes, stock check, photos)? Admin: any. Everyone else: their own, for
-- 24 hours after it was made.
create function public.field_visit_can_edit(target_visit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.field_sales_role()
     and exists (
       select 1 from public.field_visits v
       where v.id = target_visit
         and (public.is_admin() or (v.rep_id = (select auth.uid()) and v.created_at > now() - interval '24 hours'))
     );
$$;

revoke all on function public.field_visit_can_see(uuid) from public, anon;
revoke all on function public.field_visit_can_edit(uuid) from public, anon;
grant execute on function public.field_visit_can_see(uuid) to authenticated;
grant execute on function public.field_visit_can_edit(uuid) to authenticated;

-- Triggers ------------------------------------------------------------------------------------------------------
-- A new visit: the rep is the signed in person, the time is the database's, the shop details are copied from the
-- stockist. On a change only the outcome and notes move (and links the database clears when what they point at is
-- deleted). Security definer to read the stockist's brands and who created it.
create function public.check_field_visit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  s record;
begin
  if tg_op = 'INSERT' then
    if not public.field_sales_role() then
      raise exception 'only field sales staff log visits' using errcode = '42501';
    end if;
    if new.stockist_id is null or not public.field_may_visit_stockist(new.stockist_id) then
      raise exception 'shop not found' using errcode = '42501';
    end if;
    select st.id, st.name, st.region_id, st.town, st.is_active, st.created_by, st.created_at into s
      from public.stockists st where st.id = new.stockist_id;
    if new.new_shop and not (s.created_by = me and not s.is_active and s.created_at > now() - interval '1 hour') then
      raise exception 'only a draft shop you just added is a new shop' using errcode = '23514';
    end if;
    if not exists (select 1 from public.field_visit_outcomes o where o.id = new.outcome_id and o.is_active) then
      raise exception 'choose an outcome from the list' using errcode = '23514';
    end if;
    if new.crm_activity_id is not null and not exists (
      select 1 from public.crm_activities a
      join public.crm_organisations o on o.id = a.organisation_id
      where a.id = new.crm_activity_id and a.type = 'visit' and a.created_by = me and o.stockist_id = new.stockist_id
        and a.created_at > now() - interval '1 hour'
    ) then
      raise exception 'that CRM activity is not this visit' using errcode = '23514';
    end if;
    new.rep_id := me;
    new.updated_by := me;
    new.shop_name := s.name;
    new.region_id := s.region_id;
    new.town := s.town;
    new.brand_ids := coalesce((
      select array_agg(sb.brand_id order by sb.brand_id) from public.stockist_brands sb
      where sb.stockist_id = new.stockist_id and (public.sees_all_brands() or public.has_brand_access(sb.brand_id))
    ), '{}');
    new.visited_at := now();
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- Fixed once made. Links are only ever cleared, and only when what they point at is gone (on delete set null),
  -- so deleting a person, shop, region or CRM activity never fails and never changes anything else.
  new.id := old.id;
  new.rep_id := public.order_author_kept(old.rep_id);
  if not (new.stockist_id is null and not exists (select 1 from public.stockists st where st.id = old.stockist_id)) then
    new.stockist_id := old.stockist_id;
  end if;
  if not (new.region_id is null and not exists (select 1 from public.regions r where r.id = old.region_id)) then
    new.region_id := old.region_id;
  end if;
  if not (new.crm_activity_id is null and not exists (select 1 from public.crm_activities a where a.id = old.crm_activity_id)) then
    new.crm_activity_id := old.crm_activity_id;
  end if;
  new.new_shop := old.new_shop;
  new.shop_name := old.shop_name;
  new.town := old.town;
  new.brand_ids := old.brand_ids;
  new.visited_at := old.visited_at;
  new.location_status := old.location_status;
  new.latitude := old.latitude;
  new.longitude := old.longitude;
  new.accuracy_m := old.accuracy_m;
  new.created_at := old.created_at;

  if new.outcome_id is distinct from old.outcome_id or new.notes is distinct from old.notes then
    if not public.field_visit_can_edit(old.id) then
      raise exception 'not allowed to change this visit' using errcode = '42501';
    end if;
    if new.outcome_id is distinct from old.outcome_id
       and not exists (select 1 from public.field_visit_outcomes o where o.id = new.outcome_id and o.is_active) then
      raise exception 'choose an outcome from the list' using errcode = '23514';
    end if;
    new.updated_by := me;
  else
    -- Checked too: the person being deleted may be the one signed in.
    new.updated_by := public.order_author_kept(old.updated_by);
  end if;
  return new;
end;
$$;

revoke all on function public.check_field_visit() from public, anon, authenticated;

create trigger field_visits_check before insert or update on public.field_visits
  for each row execute function public.check_field_visit();

-- A stock check line: a SKU of a published product of a brand the person works on, on a visit they may change. The
-- product details are copied so the line still reads correctly later.
create function public.check_field_visit_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  k record;
begin
  if tg_op = 'UPDATE' then
    new.visit_id := old.visit_id;
    new.brand_id := old.brand_id;
    new.product_name_snapshot := old.product_name_snapshot;
    new.sku_code_snapshot := old.sku_code_snapshot;
    new.variant_snapshot := old.variant_snapshot;
    new.pack_size_snapshot := old.pack_size_snapshot;
    new.created_at := old.created_at;
    -- A SKU link is only ever cleared, when the SKU is deleted.
    if not (new.sku_id is null and not exists (select 1 from public.product_skus ps where ps.id = old.sku_id)) then
      new.sku_id := old.sku_id;
    end if;
    if (new.on_shelf is distinct from old.on_shelf or new.facings is distinct from old.facings)
       and not public.field_visit_can_edit(old.visit_id) then
      raise exception 'not allowed to change this visit' using errcode = '42501';
    end if;
    return new;
  end if;

  if not public.field_visit_can_edit(new.visit_id) then
    raise exception 'not allowed to change this visit' using errcode = '42501';
  end if;
  select ps.id, ps.sku_code, ps.variant_name, ps.pack_size_label, p.name as product_name, p.brand_id into k
    from public.product_skus ps join public.products p on p.id = ps.product_id
    join public.brands b on b.id = p.brand_id
    where ps.id = new.sku_id and ps.is_active and p.is_published and b.is_active;
  if k.id is null then
    raise exception 'that product is not available for a stock check' using errcode = '23514';
  end if;
  if not public.has_brand_access(k.brand_id) then
    raise exception 'you can only check stock of brands you work on' using errcode = '42501';
  end if;
  new.brand_id := k.brand_id;
  new.product_name_snapshot := k.product_name;
  new.sku_code_snapshot := k.sku_code;
  new.variant_snapshot := k.variant_name;
  new.pack_size_snapshot := k.pack_size_label;
  return new;
end;
$$;

revoke all on function public.check_field_visit_stock() from public, anon, authenticated;

create trigger field_visit_stock_checks_check before insert or update on public.field_visit_stock_checks
  for each row execute function public.check_field_visit_stock();

-- A photo's author comes from the session and is kept (cleared only when that person is deleted). At most 10 photos
-- a visit.
create function public.check_field_visit_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Lock the visit first, so two uploads at the same time cannot both pass the count.
    perform 1 from public.field_visits v where v.id = new.visit_id for update;
    if (select count(*) from public.field_visit_photos p where p.visit_id = new.visit_id) >= 10 then
      raise exception 'at most 10 photos a visit' using errcode = '23514';
    end if;
    new.created_by := (select auth.uid());
    return new;
  end if;
  new.id := old.id;
  new.visit_id := old.visit_id;
  new.storage_path := old.storage_path;
  new.mime_type := old.mime_type;
  new.size_bytes := old.size_bytes;
  new.created_at := old.created_at;
  new.created_by := public.order_author_kept(old.created_by);
  return new;
end;
$$;

revoke all on function public.check_field_visit_photo() from public, anon, authenticated;

create trigger field_visit_photos_check before insert or update on public.field_visit_photos
  for each row execute function public.check_field_visit_photo();

-- Table privileges ----------------------------------------------------------------------------------------------
-- Website visitors get nothing. Signed in people write only the columns a person chooses; the rest come from the
-- database.
revoke all on public.field_visit_outcomes, public.field_visits, public.field_visit_stock_checks, public.field_visit_photos
  from anon, authenticated;

grant select on public.field_visit_outcomes, public.field_visits, public.field_visit_stock_checks, public.field_visit_photos
  to authenticated;
grant insert (slug, label, sort_order, is_active), update (label, sort_order, is_active), delete
  on public.field_visit_outcomes to authenticated;
grant insert (id, stockist_id, new_shop, location_status, latitude, longitude, accuracy_m, outcome_id, notes, crm_activity_id),
  update (outcome_id, notes), delete
  on public.field_visits to authenticated;
grant insert (visit_id, sku_id, on_shelf, facings), update (on_shelf, facings), delete
  on public.field_visit_stock_checks to authenticated;
-- Photo records: no insert for people. Only public.record_field_visit_photo adds them (see Photos below).
grant delete on public.field_visit_photos to authenticated;

-- Row Level Security --------------------------------------------------------------------------------------------
alter table public.field_visit_outcomes enable row level security;
alter table public.field_visits enable row level security;
alter table public.field_visit_stock_checks enable row level security;
alter table public.field_visit_photos enable row level security;

create policy "field sales read outcomes"
  on public.field_visit_outcomes for select to authenticated
  using ((select public.field_sales_role()));

create policy "admins add outcomes"
  on public.field_visit_outcomes for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins change outcomes"
  on public.field_visit_outcomes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- An outcome that visits use cannot be deleted (on delete restrict): switch it off instead.
create policy "admins delete outcomes"
  on public.field_visit_outcomes for delete to authenticated
  using ((select public.is_admin()));

create policy "reps read their visits, managers read all"
  on public.field_visits for select to authenticated
  using ((select public.field_sales_role()) and ((select public.sees_all_brands()) or rep_id = (select auth.uid())));

-- The rest of the rules (the rep, the shop, the outcome) are in check_field_visit().
create policy "field sales log their own visits"
  on public.field_visits for insert to authenticated
  with check ((select public.field_sales_role()));

create policy "reps change their visits for a day, admins any"
  on public.field_visits for update to authenticated
  using ((select public.field_visit_can_edit(id)))
  with check ((select public.field_sales_role()));

create policy "admins delete visits"
  on public.field_visits for delete to authenticated
  using ((select public.is_admin()));

create policy "read stock checks of visits you see"
  on public.field_visit_stock_checks for select to authenticated
  using ((select public.field_visit_can_see(visit_id)));

create policy "add stock checks to visits you may change"
  on public.field_visit_stock_checks for insert to authenticated
  with check ((select public.field_visit_can_edit(visit_id)));

create policy "change stock checks of visits you may change"
  on public.field_visit_stock_checks for update to authenticated
  using ((select public.field_visit_can_edit(visit_id)))
  with check ((select public.field_visit_can_edit(visit_id)));

create policy "remove stock checks of visits you may change"
  on public.field_visit_stock_checks for delete to authenticated
  using ((select public.field_visit_can_edit(visit_id)));

create policy "read photos of visits you see"
  on public.field_visit_photos for select to authenticated
  using ((select public.field_visit_can_see(visit_id)));

create policy "admins delete photo records"
  on public.field_visit_photos for delete to authenticated
  using ((select public.is_admin()));
-- No insert policy (records come from public.record_field_visit_photo) and no update policy: a photo is added or
-- removed, never changed.

-- Storage: field-visit-photos bucket ----------------------------------------------------------------------------
-- A file in the bucket is not a photo of the visit until the portal records it (record_field_visit_photo), and only
-- recorded photos are ever shown. Files nobody recorded (a failed upload, or someone sending bytes straight to the
-- Storage API) are limited to 15 files a visit in all: the 10 photos a visit may have and 5 spare for retries. They
-- can only be added in the visit's first 24 hours, are never shown, and admin can remove them.
create function public.field_photo_room(target_visit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from storage.objects o
          where o.bucket_id = 'field-visit-photos' and public.field_visit_id_from_path(o.name) = target_visit) < 15;
$$;

revoke all on function public.field_photo_room(uuid) from public, anon;
grant execute on function public.field_photo_room(uuid) to authenticated;

-- Private. Photos are only ever served through the portal, which reads them with the person's own session (these
-- policies decide) and checks the file really is an image. Path: <visit id>/<photo id>.<jpg|png|webp>. JPEG, PNG and
-- WebP up to 5 MB. No overwriting; only admins remove photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('field-visit-photos', 'field-visit-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "field sales read photos of visits they see"
  on storage.objects for select to authenticated
  using (bucket_id = 'field-visit-photos' and (select public.field_visit_can_see(public.field_visit_id_from_path(name))));

create policy "field sales upload photos to visits they may change"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'field-visit-photos'
    and (select public.field_visit_can_edit(public.field_visit_id_from_path(name)))
    and (select public.field_photo_room(public.field_visit_id_from_path(name)))
  );

create policy "admins delete field visit photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'field-visit-photos' and (select public.is_admin()));

-- Recording photos ----------------------------------------------------------------------------------------------
-- The portal's shared secret. The portal server (env FIELD_PHOTO_SECRET, never sent to the browser) signs each photo
-- it has checked by its first bytes and uploaded itself; the database only records a photo with a valid signature.
-- Kept in the private schema with Row Level Security on and no policies, like private.chat_intake_secret (0009).
-- One time set up (the same value as FIELD_PHOTO_SECRET on the portal's Vercel project, at least 32 characters):
--   insert into private.field_photo_secret (secret) values ('<value>')
--   on conflict (id) do update set secret = excluded.secret, updated_at = now();
-- Until it is set, visits save but photos are refused and the phone says photo uploads are not set up.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.field_photo_secret (
  id boolean primary key default true check (id),
  secret text not null check (length(secret) >= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.field_photo_secret enable row level security;
revoke all on private.field_photo_secret from public, anon, authenticated;

-- Records a photo the portal's server checked. The server signs, with the shared secret, the text
--   field-photo.<photo id>.<visit id>.<mime type>.<size in bytes>.<issued at, unix seconds>
-- after checking the file's first bytes and uploading it with the person's own session. The database checks the
-- signature (10 minutes old at most), that the person may still change the visit, and that the file at
-- <visit id>/<photo id>.<ext> exists, was uploaded by this person and has exactly that size and type in Storage.
-- Recording the same photo again (a retry) returns false and changes nothing. Security definer because people have
-- no insert rights on field_visit_photos and cannot read the secret.
-- Errors: 55000 not set up, 22023 bad signature or time, 42501 not allowed, 23514 file missing or different.
create function public.record_field_visit_photo(photo_id uuid, visit_id uuid, mime_type text, size_bytes integer,
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
  if photo_id is null or visit_id is null or issued_at is null or signature is null or signature !~ '^[0-9a-f]{64}$'
     or size_bytes is null or size_bytes not between 1 and 5242880 then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  v_ext := case mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' end;
  if v_ext is null then
    raise exception 'invalid field: mime_type' using errcode = '22023';
  end if;
  -- Compared as HMACs of both values, so the time the comparison takes says nothing about the expected signature.
  if extensions.hmac(encode(extensions.hmac('field-photo.' || photo_id::text || '.' || visit_id::text || '.' || mime_type
       || '.' || size_bytes::text || '.' || issued_at::text, v_secret, 'sha256'), 'hex'), v_secret, 'sha256')
     <> extensions.hmac(signature, v_secret, 'sha256') then
    raise exception 'invalid field: signature' using errcode = '22023';
  end if;
  if issued_at < extract(epoch from now())::bigint - 600 or issued_at > extract(epoch from now())::bigint + 60 then
    raise exception 'invalid field: issued_at' using errcode = '22023';
  end if;
  if not public.field_visit_can_edit(visit_id) then
    raise exception 'not allowed to change this visit' using errcode = '42501';
  end if;

  select p.visit_id into v_existing from public.field_visit_photos p where p.id = photo_id;
  if v_existing is not null then
    if v_existing <> visit_id then
      raise exception 'invalid field: photo_id' using errcode = '22023';
    end if;
    return false;
  end if;

  v_path := visit_id::text || '/' || photo_id::text || '.' || v_ext;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'field-visit-photos' and o.name = v_path and o.owner = (select auth.uid())
      and (o.metadata ->> 'size')::bigint = size_bytes and o.metadata ->> 'mimetype' = mime_type
  ) then
    raise exception 'the photo file is missing or different' using errcode = '23514';
  end if;

  insert into public.field_visit_photos (id, visit_id, storage_path, mime_type, size_bytes)
  values (photo_id, visit_id, v_path, mime_type, size_bytes);
  return true;
end;
$$;

revoke all on function public.record_field_visit_photo(uuid, uuid, text, integer, bigint, text) from public, anon;
grant execute on function public.record_field_visit_photo(uuid, uuid, text, integer, bigint, text) to authenticated;

-- New shops from field visits ----------------------------------------------------------------------------------
-- A shop a rep added during a visit stays a draft until admin or marketing switch it on in Stockists. Rows are added by
-- save_field_visit only; confirmed_at is set by the trigger below when the shop is switched on.
create table public.field_new_shops (
  stockist_id uuid primary key references public.stockists (id) on delete cascade,
  visit_id uuid references public.field_visits (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index field_new_shops_visit_idx on public.field_new_shops (visit_id);
create index field_new_shops_created_by_idx on public.field_new_shops (created_by);
create index field_new_shops_confirmed_by_idx on public.field_new_shops (confirmed_by);

create trigger field_new_shops_set_updated_at before update on public.field_new_shops
  for each row execute function public.set_updated_at();

-- Only for a draft shop the person just added during their own visit; the author comes from the session. On a change
-- (only the database changes these rows) the links are kept or cleared, never put back.
create function public.check_field_new_shop()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null and not exists (
      select 1 from public.field_visits v join public.stockists s on s.id = v.stockist_id
      where v.id = new.visit_id and v.stockist_id = new.stockist_id and v.new_shop and v.rep_id = (select auth.uid())
        and not s.is_active and s.created_by = (select auth.uid())
    ) then
      raise exception 'only a draft shop you just added is a new shop' using errcode = '23514';
    end if;
    new.created_by := (select auth.uid());
    new.confirmed_at := null;
    new.confirmed_by := null;
    return new;
  end if;
  new.stockist_id := old.stockist_id;
  new.created_by := public.order_author_kept(old.created_by);
  new.confirmed_by := public.order_author_kept(new.confirmed_by);
  new.created_at := old.created_at;
  return new;
end;
$$;

revoke all on function public.check_field_new_shop() from public, anon, authenticated;

create trigger field_new_shops_check before insert or update on public.field_new_shops
  for each row execute function public.check_field_new_shop();

-- Change to an existing object: a new trigger on public.stockists. It acts only when a draft shop from a field visit
-- is switched on: admin and marketing may (and it is then confirmed); anyone else, the rep who added it included, is
-- refused. Database work without a signed in person is left alone. Every other stockist is untouched.
create function public.check_stockist_field_draft()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active and not old.is_active and (select auth.uid()) is not null
     and exists (select 1 from public.field_new_shops f where f.stockist_id = new.id and f.confirmed_at is null) then
    if coalesce(public.current_app_role() in ('admin', 'marketing'), false) then
      update public.field_new_shops set confirmed_at = now(), confirmed_by = (select auth.uid()) where stockist_id = new.id;
    else
      raise exception 'only admin or marketing can switch on a shop added from a field visit' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.check_stockist_field_draft() from public, anon, authenticated;

create trigger stockists_field_draft_check before update of is_active on public.stockists
  for each row execute function public.check_stockist_field_draft();

revoke all on public.field_new_shops from anon, authenticated;
grant select on public.field_new_shops to authenticated;
grant insert (stockist_id, visit_id) on public.field_new_shops to authenticated;
alter table public.field_new_shops enable row level security;

create policy "field sales and stockist staff read new shops"
  on public.field_new_shops for select to authenticated
  using ((select public.field_sales_role()) or (select public.can_view_stockists()));

-- The rest of the rule (the person's own visit and draft) is in check_field_new_shop().
create policy "field sales record their new shops"
  on public.field_new_shops for insert to authenticated
  with check ((select public.field_sales_role()));

-- Saving --------------------------------------------------------------------------------------------------------
-- Saves a visit in one transaction: the new shop (when there is one), the CRM activity (when the shop has a CRM
-- organisation the person may log on), the visit and its stock check. Security invoker: Row Level Security, the
-- column grants and the triggers of every table decide, and any refused write undoes the whole save.
--   nonce     made by the phone; becomes the visit id. Saving again with the same nonce returns the saved visit and
--             changes nothing, so a retry after a dropped connection never saves twice
--   details   stockist_id, or new_shop {name, outlet_type, region_id, town, address, phone, brand_ids};
--             location {status: captured|denied|unavailable, latitude, longitude, accuracy}; outcome_id; notes;
--             stock [{sku_id, on_shelf, facings}]; log_to_crm (boolean, default true)
-- Returns {id, created, stockist_id, crm_logged}.
create function public.save_field_visit(nonce uuid, details jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing record;
  v_stockist uuid;
  v_new_shop jsonb := details -> 'new_shop';
  v_loc jsonb := coalesce(details -> 'location', '{}'::jsonb);
  v_status text := coalesce(v_loc ->> 'status', 'unavailable');
  v_lat numeric;
  v_lng numeric;
  v_acc integer;
  v_outcome uuid;
  v_outcome_label text;
  v_notes text := nullif(btrim(coalesce(details ->> 'notes', '')), '');
  v_brands uuid[];
  v_org uuid;
  v_activity uuid;
  v_body text;
  v_line jsonb;
begin
  if nonce is null then
    raise exception 'invalid field: nonce' using errcode = '22023';
  end if;
  if not public.field_sales_role() then
    raise exception 'only field sales staff log visits' using errcode = '42501';
  end if;
  -- One save per nonce at a time: a retry that arrives while the first save is still running waits for it, then finds
  -- the saved visit below instead of failing on the primary key or the new shop's name.
  perform pg_advisory_xact_lock(hashtextextended('field_visit:' || nonce::text, 0));

  -- A retry of a save that went through: the visit is already there (and only its own rep sees it under Row Level
  -- Security, or a manager; anyone else gets a refusal from the primary key below).
  select v.id, v.stockist_id, v.crm_activity_id, v.rep_id into v_existing from public.field_visits v where v.id = nonce;
  if v_existing.id is not null then
    if v_existing.rep_id is distinct from (select auth.uid()) then
      raise exception 'invalid field: nonce' using errcode = '22023';
    end if;
    return jsonb_build_object('id', v_existing.id, 'created', false, 'stockist_id', v_existing.stockist_id,
      'crm_logged', v_existing.crm_activity_id is not null);
  end if;

  if v_status not in ('captured', 'denied', 'unavailable') then
    raise exception 'invalid field: location' using errcode = '22023';
  end if;
  if v_status = 'captured' then
    begin
      v_lat := round((v_loc ->> 'latitude')::numeric, 6);
      v_lng := round((v_loc ->> 'longitude')::numeric, 6);
      v_acc := least(100000, greatest(0, round((v_loc ->> 'accuracy')::numeric)))::integer;
    exception when others then
      raise exception 'invalid field: location' using errcode = '22023';
    end;
    if v_lat is null or v_lng is null or v_acc is null then
      raise exception 'invalid field: location' using errcode = '22023';
    end if;
  end if;

  begin
    v_outcome := (details ->> 'outcome_id')::uuid;
  exception when others then
    raise exception 'invalid field: outcome' using errcode = '22023';
  end;
  select o.label into v_outcome_label from public.field_visit_outcomes o where o.id = v_outcome and o.is_active;
  if v_outcome_label is null then
    raise exception 'choose an outcome from the list' using errcode = '23514';
  end if;

  if coalesce(jsonb_typeof(v_new_shop) = 'object', false) then
    v_brands := array(select jsonb_array_elements_text(coalesce(v_new_shop -> 'brand_ids', '[]'::jsonb))::uuid);
    if cardinality(v_brands) = 0 then
      raise exception 'choose at least one brand for the new shop' using errcode = '22023';
    end if;
    v_stockist := public.save_stockist(
      null,
      jsonb_build_object(
        'name', v_new_shop ->> 'name', 'outlet_type', v_new_shop ->> 'outlet_type', 'region_id', v_new_shop ->> 'region_id',
        'town', v_new_shop ->> 'town', 'address', v_new_shop ->> 'address', 'phone', v_new_shop ->> 'phone',
        'latitude', coalesce(v_lat::text, ''), 'longitude', coalesce(v_lng::text, ''),
        'notes', 'Added from a field visit on ' || to_char(now(), 'DD Mon YYYY')
          || '. Check the details, then activate it to show it on Where to Buy.'
      ),
      v_brands
    );
    -- A draft until staff confirm it: not on Where to Buy.
    perform public.set_stockist_active(v_stockist, false);
  else
    begin
      v_stockist := (details ->> 'stockist_id')::uuid;
    exception when others then
      raise exception 'invalid field: stockist' using errcode = '22023';
    end;
    if v_stockist is null then
      raise exception 'choose a shop or add a new one' using errcode = '22023';
    end if;
  end if;

  -- Write the visit on the shop's CRM timeline, when it has an organisation this person may log on.
  if coalesce((details ->> 'log_to_crm')::boolean, true) then
    select o.id into v_org from public.crm_organisations o
     where o.stockist_id = v_stockist and public.crm_can_note_org(o.id)
     order by o.created_at, o.id limit 1;
    if v_org is not null then
      v_body := left('Shop visit (field sales): ' || v_outcome_label || '.' || coalesce(' ' || v_notes, ''), 4000);
      insert into public.crm_activities (organisation_id, type, body) values (v_org, 'visit', v_body)
      returning id into v_activity;
    end if;
  end if;

  insert into public.field_visits (id, stockist_id, new_shop, location_status, latitude, longitude, accuracy_m,
    outcome_id, notes, crm_activity_id)
  values (nonce, v_stockist, coalesce(jsonb_typeof(v_new_shop) = 'object', false), v_status, v_lat, v_lng, v_acc, v_outcome, v_notes,
    v_activity);

  for v_line in select value from jsonb_array_elements(coalesce(details -> 'stock', '[]'::jsonb)) loop
    insert into public.field_visit_stock_checks (visit_id, sku_id, on_shelf, facings)
    values (nonce, (v_line ->> 'sku_id')::uuid, (v_line ->> 'on_shelf')::boolean, nullif(v_line ->> 'facings', '')::integer);
  end loop;

  if coalesce(jsonb_typeof(v_new_shop) = 'object', false) then
    insert into public.field_new_shops (stockist_id, visit_id) values (v_stockist, nonce);
  end if;

  return jsonb_build_object('id', nonce, 'created', true, 'stockist_id', v_stockist, 'crm_logged', v_activity is not null);
end;
$$;

-- Changes the outcome, notes and stock check of a visit (the whole stock check is replaced). Raises when the visit
-- cannot be changed, so the portal can tell the person.
create function public.update_field_visit(target_id uuid, details jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
  v_line jsonb;
begin
  if not public.field_visit_can_edit(target_id) then
    raise exception 'not allowed to change this visit' using errcode = '42501';
  end if;
  update public.field_visits set
    outcome_id = (details ->> 'outcome_id')::uuid,
    notes = nullif(btrim(coalesce(details ->> 'notes', '')), '')
  where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to change this visit' using errcode = '42501';
  end if;
  if details ? 'stock' then
    delete from public.field_visit_stock_checks where visit_id = target_id;
    for v_line in select value from jsonb_array_elements(coalesce(details -> 'stock', '[]'::jsonb)) loop
      insert into public.field_visit_stock_checks (visit_id, sku_id, on_shelf, facings)
      values (target_id, (v_line ->> 'sku_id')::uuid, (v_line ->> 'on_shelf')::boolean, nullif(v_line ->> 'facings', '')::integer);
    end loop;
  end if;
end;
$$;

-- Deletes a visit with its stock check and photo records (admin only). Remove the photo files through the Storage
-- API first; the portal does.
create function public.delete_field_visit(target_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  delete from public.field_visits where id = target_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    raise exception 'not allowed to delete this visit' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.save_field_visit(uuid, jsonb) from public, anon;
revoke all on function public.update_field_visit(uuid, jsonb) from public, anon;
revoke all on function public.delete_field_visit(uuid) from public, anon;
grant execute on function public.save_field_visit(uuid, jsonb) to authenticated;
grant execute on function public.update_field_visit(uuid, jsonb) to authenticated;
grant execute on function public.delete_field_visit(uuid) to authenticated;

-- Reading -------------------------------------------------------------------------------------------------------
-- Shops a person may visit, nearest first when a position is given, else by name. Active shops, plus draft shops the
-- person added. Each row says whether the shop has a CRM organisation this person may log on, and when this person
-- last visited it. Security invoker: Row Level Security of stockists, regions and the CRM decides what is read.
create function public.field_sales_shops(
  p_lat numeric default null, p_lng numeric default null, p_q text default null, p_limit integer default 40)
returns table (id uuid, name text, outlet_type text, town text, address text, region_id uuid, region_name text,
               latitude numeric, longitude numeric, is_active boolean, distance_m integer, brand_ids uuid[],
               crm_organisation_name text, my_last_visit_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, s.name, s.outlet_type, s.town, s.address, s.region_id, r.name, s.latitude, s.longitude, s.is_active,
    public.field_distance_m(p_lat, p_lng, s.latitude, s.longitude),
    coalesce((select array_agg(sb.brand_id order by sb.brand_id) from public.stockist_brands sb where sb.stockist_id = s.id), '{}'),
    (select o.name from public.crm_organisations o where o.stockist_id = s.id and public.crm_can_note_org(o.id)
      order by o.created_at, o.id limit 1),
    (select max(v.visited_at) from public.field_visits v where v.stockist_id = s.id and v.rep_id = (select auth.uid()))
  from public.stockists s
  join public.regions r on r.id = s.region_id
  where public.field_may_visit_stockist(s.id)
    and (s.is_active or public.field_stockist_mine(s.id))
    and (coalesce(btrim(p_q), '') = '' or s.name ilike '%' || btrim(p_q) || '%' or s.town ilike '%' || btrim(p_q) || '%')
  order by public.field_distance_m(p_lat, p_lng, s.latitude, s.longitude) nulls last, s.name, s.id
  limit least(greatest(coalesce(p_limit, 40), 1), 200);
$$;

-- Visits with filters, newest first, with the total for paging (p_id: one visit). Sales reps get their own visits
-- only (Row Level Security). Dates are days in Ghana time (UTC). distance_from_shop_m: how far the phone was from the
-- shop's map position, when both are known.
create function public.field_visit_list(
  p_rep uuid default null, p_from date default null, p_to date default null, p_region uuid default null,
  p_brand uuid default null, p_outcome uuid default null, p_q text default null,
  p_limit integer default 50, p_offset integer default 0, p_id uuid default null)
returns table (id uuid, visited_at timestamptz, rep_id uuid, rep_name text, stockist_id uuid, shop_name text,
               new_shop boolean, shop_is_active boolean, region_id uuid, region_name text, town text, brand_ids uuid[],
               outcome_id uuid, outcome_label text, notes text, location_status text, latitude numeric,
               longitude numeric, accuracy_m integer, distance_from_shop_m integer, photo_count integer,
               stock_count integer, on_shelf_count integer, crm_logged boolean, created_at timestamptz, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.id, v.visited_at, v.rep_id, coalesce(nullif(btrim(p.full_name), ''), p.email), v.stockist_id, v.shop_name,
    v.new_shop, s.is_active, v.region_id, r.name, v.town, v.brand_ids, v.outcome_id, o.label, v.notes,
    v.location_status, v.latitude, v.longitude, v.accuracy_m,
    public.field_distance_m(v.latitude, v.longitude, s.latitude, s.longitude),
    (select count(*)::integer from public.field_visit_photos ph where ph.visit_id = v.id),
    (select count(*)::integer from public.field_visit_stock_checks c where c.visit_id = v.id),
    (select count(*)::integer from public.field_visit_stock_checks c where c.visit_id = v.id and c.on_shelf),
    v.crm_activity_id is not null, v.created_at,
    count(*) over ()
  from public.field_visits v
  join public.field_visit_outcomes o on o.id = v.outcome_id
  left join public.profiles p on p.id = v.rep_id
  left join public.stockists s on s.id = v.stockist_id
  left join public.regions r on r.id = v.region_id
  where (p_id is null or v.id = p_id)
    and (p_rep is null or v.rep_id = p_rep)
    and (p_from is null or v.visited_at >= p_from::timestamp at time zone 'UTC')
    and (p_to is null or v.visited_at < (p_to + 1)::timestamp at time zone 'UTC')
    and (p_region is null or v.region_id = p_region)
    and (p_brand is null or p_brand = any (v.brand_ids))
    and (p_outcome is null or v.outcome_id = p_outcome)
    and (coalesce(btrim(p_q), '') = '' or v.shop_name ilike '%' || btrim(p_q) || '%' or v.town ilike '%' || btrim(p_q) || '%')
  order by v.visited_at desc, v.id
  limit least(greatest(coalesce(p_limit, 50), 1), 5000) offset greatest(coalesce(p_offset, 0), 0);
$$;

-- People who logged visits, for the rep filter: everyone with a field sales role for managers, yourself for a rep.
create function public.field_sales_people()
returns table (id uuid, display_name text, role public.app_role, is_active boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email), p.role, p.is_active
  from public.profiles p
  where public.field_sales_role() and p.role in ('admin', 'management', 'sales_rep')
  order by 2;
$$;

revoke all on function public.field_sales_shops(numeric, numeric, text, integer) from public, anon;
revoke all on function public.field_visit_list(uuid, date, date, uuid, uuid, uuid, text, integer, integer, uuid) from public, anon;
revoke all on function public.field_sales_people() from public, anon;
grant execute on function public.field_sales_shops(numeric, numeric, text, integer) to authenticated;
grant execute on function public.field_visit_list(uuid, date, date, uuid, uuid, uuid, text, integer, integer, uuid) to authenticated;
grant execute on function public.field_sales_people() to authenticated;
