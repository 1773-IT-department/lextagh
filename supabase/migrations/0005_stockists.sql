-- 0005_stockists: stockists for Where to Buy (scoreboard item 5).
-- Shops, supermarkets, pharmacies, markets and distributors that carry Yazz, Linzzy or Hooch, with region,
-- town and an optional map position. Staff manage them in the portal; the websites read active ones.
-- No shops are seeded: Lexta has not sent its stockist list yet. Load it with the portal's CSV import.
--
-- Who can do what:
--   website visitors (anon)                      read active stockists (public columns only), the brands they
--                                                carry (active, non corporate brands) and the regions list
--   any signed in person                         the same as website visitors
--   admin, management, sales_rep, marketing,     read every stockist, active or not, with staff notes
--   customer_care
--   admin                                        create, edit, deactivate and delete any stockist; manage regions
--   sales_rep, marketing                         create stockists; edit, deactivate and delete a stockist only
--                                                when every brand it carries is one of their brands (a stockist
--                                                carrying no brands yet: only the person who created it);
--                                                add or remove links for their own brands on any stockist,
--                                                so a rep can add their brand to a shop another brand listed
--   management, customer_care                    read only
-- Brand links never point at the corporate Lexta brand. created_by and updated_by always come from the session.

-- Regions ---------------------------------------------------------------------------
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  name text not null unique check (length(btrim(name)) between 1 and 80),
  is_in_ghana boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger regions_set_updated_at
  before update on public.regions
  for each row execute function public.set_updated_at();

-- Ghana's 16 regions, plus Monrovia, where the prototype says Lexta has operated since 2010.
insert into public.regions (slug, name, is_in_ghana, sort_order) values
  ('ahafo', 'Ahafo', true, 10),
  ('ashanti', 'Ashanti', true, 20),
  ('bono', 'Bono', true, 30),
  ('bono-east', 'Bono East', true, 40),
  ('central', 'Central', true, 50),
  ('eastern', 'Eastern', true, 60),
  ('greater-accra', 'Greater Accra', true, 70),
  ('north-east', 'North East', true, 80),
  ('northern', 'Northern', true, 90),
  ('oti', 'Oti', true, 100),
  ('savannah', 'Savannah', true, 110),
  ('upper-east', 'Upper East', true, 120),
  ('upper-west', 'Upper West', true, 130),
  ('volta', 'Volta', true, 140),
  ('western', 'Western', true, 150),
  ('western-north', 'Western North', true, 160),
  ('liberia-monrovia', 'Liberia (Monrovia)', false, 900)
on conflict (slug) do nothing;

-- Stockists -------------------------------------------------------------------------
create table public.stockists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  outlet_type text not null check (outlet_type in ('supermarket', 'pharmacy', 'open_market', 'general_trade', 'distributor', 'other')),
  region_id uuid not null references public.regions (id) on delete restrict,
  town text not null check (length(btrim(town)) between 1 and 80),
  address text check (address is null or length(btrim(address)) between 1 and 300),
  phone text check (phone is null or phone ~ '^\+?[0-9][0-9 ()-]{5,22}$'),
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  opening_hours text check (opening_hours is null or length(btrim(opening_hours)) between 1 and 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  -- A map position needs both numbers.
  check ((latitude is null) = (longitude is null))
);

-- The same shop at the same address cannot be listed twice (protects against importing a file twice).
create unique index stockists_unique_outlet_idx
  on public.stockists (lower(btrim(name)), region_id, lower(btrim(town)), lower(btrim(coalesce(address, ''))));
create index stockists_region_active_idx on public.stockists (region_id, is_active);
create index stockists_created_by_idx on public.stockists (created_by);
create index stockists_updated_by_idx on public.stockists (updated_by);

create trigger stockists_set_updated_at
  before update on public.stockists
  for each row execute function public.set_updated_at();

-- created_by and updated_by always come from the session, never from the browser.
create or replace function public.set_stockist_authors()
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

revoke all on function public.set_stockist_authors() from public, anon, authenticated;

create trigger stockists_set_authors
  before insert or update on public.stockists
  for each row execute function public.set_stockist_authors();

-- Brands carried --------------------------------------------------------------------
create table public.stockist_brands (
  id uuid primary key default gen_random_uuid(),
  stockist_id uuid not null references public.stockists (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stockist_id, brand_id)
);

create index stockist_brands_brand_idx on public.stockist_brands (brand_id);

create trigger stockist_brands_set_updated_at
  before update on public.stockist_brands
  for each row execute function public.set_updated_at();

-- Only product brands (Yazz, Linzzy, Hooch, ...) can be carried, never the corporate Lexta brand.
create or replace function public.check_stockist_brand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.brands b where b.id = new.brand_id and not b.is_corporate) then
    raise exception 'stockists can only carry product brands, not the corporate brand' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.check_stockist_brand() from public, anon, authenticated;

create trigger stockist_brands_check_brand
  before insert or update on public.stockist_brands
  for each row execute function public.check_stockist_brand();

-- Staff notes (kept in their own table so they can never reach the websites) ----------
create table public.stockist_notes (
  id uuid primary key default gen_random_uuid(),
  stockist_id uuid not null unique references public.stockists (id) on delete cascade,
  notes text not null check (length(btrim(notes)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger stockist_notes_set_updated_at
  before update on public.stockist_notes
  for each row execute function public.set_updated_at();

-- Helper functions ------------------------------------------------------------------
create or replace function public.can_view_stockists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management', 'sales_rep', 'marketing', 'customer_care'), false);
$$;

create or replace function public.can_create_stockists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'sales_rep', 'marketing'), false);
$$;

-- May this person add or remove the link between a stockist and this brand?
create or replace function public.can_link_stockist_brand(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_create_stockists() and public.has_brand_access(target_brand);
$$;

-- May this person change this stockist's details, deactivate it or delete it?
create or replace function public.can_edit_stockist(target_stockist uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_create_stockists()
     and exists (select 1 from public.stockists s where s.id = target_stockist)
     and (
       public.is_admin()
       or (
         exists (select 1 from public.stockist_brands sb where sb.stockist_id = target_stockist)
         and not exists (
           select 1 from public.stockist_brands sb
           where sb.stockist_id = target_stockist and not public.has_brand_access(sb.brand_id)
         )
       )
       or (
         not exists (select 1 from public.stockist_brands sb where sb.stockist_id = target_stockist)
         and exists (
           select 1 from public.stockists s
           where s.id = target_stockist and s.created_by = (select auth.uid())
         )
       )
     );
$$;

revoke all on function public.can_view_stockists() from public, anon;
revoke all on function public.can_create_stockists() from public, anon;
revoke all on function public.can_link_stockist_brand(uuid) from public, anon;
revoke all on function public.can_edit_stockist(uuid) from public, anon;
grant execute on function public.can_view_stockists() to authenticated;
grant execute on function public.can_create_stockists() to authenticated;
grant execute on function public.can_link_stockist_brand(uuid) to authenticated;
grant execute on function public.can_edit_stockist(uuid) to authenticated;

-- Table privileges ------------------------------------------------------------------
-- Website visitors only ever read; they get the public columns of stockists and nothing of the notes.
-- (Supabase grants everything to anon by default; Row Level Security below still applies on top.)
revoke all on public.regions, public.stockists, public.stockist_brands, public.stockist_notes from anon;
grant select on public.regions, public.stockist_brands to anon;
grant select (
  id, name, outlet_type, region_id, town, address, phone, latitude, longitude, opening_hours, is_active, created_at, updated_at
) on public.stockists to anon;

-- Row Level Security ----------------------------------------------------------------
alter table public.regions enable row level security;
alter table public.stockists enable row level security;
alter table public.stockist_brands enable row level security;
alter table public.stockist_notes enable row level security;

-- Regions: a public lookup list; only admins change it.
create policy "everyone reads regions"
  on public.regions for select to anon, authenticated
  using (true);

create policy "admins insert regions"
  on public.regions for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins update regions"
  on public.regions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins delete regions"
  on public.regions for delete to authenticated
  using ((select public.is_admin()));

-- Stockists: read
create policy "visitors read active stockists"
  on public.stockists for select to anon
  using (is_active);

create policy "signed in read active stockists, staff read all"
  on public.stockists for select to authenticated
  using (is_active or (select public.can_view_stockists()));

-- Stockists: write
create policy "admin, sales and marketing create stockists"
  on public.stockists for insert to authenticated
  with check ((select public.can_create_stockists()));

create policy "editors update stockists they may manage"
  on public.stockists for update to authenticated
  using ((select public.can_edit_stockist(id)))
  with check ((select public.can_edit_stockist(id)));

create policy "editors delete stockists they may manage"
  on public.stockists for delete to authenticated
  using ((select public.can_edit_stockist(id)));

-- Brand links: visible when the stockist is visible (the subquery runs under the stockists policies)
-- and, for the public, only for active product brands.
create policy "visitors read brands of active stockists"
  on public.stockist_brands for select to anon
  using (
    exists (select 1 from public.stockists s where s.id = stockist_id)
    and exists (select 1 from public.brands b where b.id = brand_id and b.is_active and not b.is_corporate)
  );

create policy "signed in read brands of visible stockists"
  on public.stockist_brands for select to authenticated
  using (
    exists (select 1 from public.stockists s where s.id = stockist_id)
    and (
      (select public.can_view_stockists())
      or exists (select 1 from public.brands b where b.id = brand_id and b.is_active and not b.is_corporate)
    )
  );

create policy "editors link their own brands"
  on public.stockist_brands for insert to authenticated
  with check (
    (select public.can_link_stockist_brand(brand_id))
    and exists (select 1 from public.stockists s where s.id = stockist_id)
  );

create policy "editors unlink their own brands"
  on public.stockist_brands for delete to authenticated
  using ((select public.can_link_stockist_brand(brand_id)));
-- No update policy: a link is removed and added again, never moved.

-- Staff notes
create policy "staff read stockist notes"
  on public.stockist_notes for select to authenticated
  using ((select public.can_view_stockists()));

create policy "editors add stockist notes"
  on public.stockist_notes for insert to authenticated
  with check ((select public.can_edit_stockist(stockist_id)));

create policy "editors update stockist notes"
  on public.stockist_notes for update to authenticated
  using ((select public.can_edit_stockist(stockist_id)))
  with check ((select public.can_edit_stockist(stockist_id)));

create policy "editors delete stockist notes"
  on public.stockist_notes for delete to authenticated
  using ((select public.can_edit_stockist(stockist_id)));

-- Saving ----------------------------------------------------------------------------
-- Saves a stockist, its staff notes and the brands it carries in one transaction, so a failed step never
-- leaves half a stockist behind. Security invoker: Row Level Security decides every write, and any write
-- that is refused (or touches no row) undoes the whole save.
--   target_id      null to create, or the stockist to change
--   details        jsonb with name, outlet_type, region_id, town, address, phone, latitude, longitude,
--                  opening_hours, notes; null to change only the brand links of an existing stockist
--   brand_ids      the complete list of brands the stockist carries after the save
create or replace function public.save_stockist(target_id uuid, details jsonb, brand_ids uuid[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid := target_id;
  wanted uuid[] := coalesce(brand_ids, '{}');
  note text := nullif(btrim(coalesce(details ->> 'notes', '')), '');
  expected integer;
  changed integer;
begin
  if details is not null then
    if saved_id is null then
      insert into public.stockists (name, outlet_type, region_id, town, address, phone, latitude, longitude, opening_hours)
      values (
        btrim(details ->> 'name'),
        details ->> 'outlet_type',
        (details ->> 'region_id')::uuid,
        btrim(details ->> 'town'),
        nullif(btrim(coalesce(details ->> 'address', '')), ''),
        nullif(btrim(coalesce(details ->> 'phone', '')), ''),
        nullif(details ->> 'latitude', '')::numeric,
        nullif(details ->> 'longitude', '')::numeric,
        nullif(btrim(coalesce(details ->> 'opening_hours', '')), '')
      )
      returning id into saved_id;
    else
      update public.stockists set
        name = btrim(details ->> 'name'),
        outlet_type = details ->> 'outlet_type',
        region_id = (details ->> 'region_id')::uuid,
        town = btrim(details ->> 'town'),
        address = nullif(btrim(coalesce(details ->> 'address', '')), ''),
        phone = nullif(btrim(coalesce(details ->> 'phone', '')), ''),
        latitude = nullif(details ->> 'latitude', '')::numeric,
        longitude = nullif(details ->> 'longitude', '')::numeric,
        opening_hours = nullif(btrim(coalesce(details ->> 'opening_hours', '')), '')
      where id = saved_id;
      get diagnostics changed = row_count;
      if changed = 0 then
        raise exception 'not allowed to change this stockist' using errcode = '42501';
      end if;
    end if;

    if note is null then
      delete from public.stockist_notes where stockist_id = saved_id;
    else
      insert into public.stockist_notes (stockist_id, notes) values (saved_id, note)
      on conflict (stockist_id) do update set notes = excluded.notes;
    end if;
  elsif saved_id is null then
    raise exception 'a new stockist needs its details' using errcode = '22023';
  end if;

  -- Brands taken out: every one of them must really go, or nothing is saved.
  select count(*) into expected from public.stockist_brands sb
   where sb.stockist_id = saved_id and sb.brand_id <> all (wanted);
  delete from public.stockist_brands sb where sb.stockist_id = saved_id and sb.brand_id <> all (wanted);
  get diagnostics changed = row_count;
  if changed <> expected then
    raise exception 'not allowed to remove a brand from this stockist' using errcode = '42501';
  end if;

  insert into public.stockist_brands (stockist_id, brand_id)
  select saved_id, b from unnest(wanted) as b
  -- Only the new ones: brands already carried (maybe other people's) are left untouched.
  where not exists (select 1 from public.stockist_brands sb where sb.stockist_id = saved_id and sb.brand_id = b)
  on conflict (stockist_id, brand_id) do nothing;

  return saved_id;
end;
$$;

-- Adds many new stockists at once (the portal's CSV import). All or nothing: if any row is refused, no row
-- is added and the error names the row. items: jsonb array of { line, details, brand_ids }.
create or replace function public.import_stockists(items jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item jsonb;
  added integer := 0;
begin
  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'rows must be a list' using errcode = '22023';
  end if;
  if jsonb_array_length(items) > 2000 then
    raise exception 'import at most 2000 rows at a time' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(items) loop
    begin
      perform public.save_stockist(
        null,
        item -> 'details',
        array(select jsonb_array_elements_text(coalesce(item -> 'brand_ids', '[]'::jsonb))::uuid)
      );
    exception when others then
      raise exception 'row %: %', coalesce(item ->> 'line', '?'), sqlerrm using errcode = sqlstate;
    end;
    added := added + 1;
  end loop;
  return added;
end;
$$;

revoke all on function public.save_stockist(uuid, jsonb, uuid[]) from public, anon;
revoke all on function public.import_stockists(jsonb) from public, anon;
grant execute on function public.save_stockist(uuid, jsonb, uuid[]) to authenticated;
grant execute on function public.import_stockists(jsonb) to authenticated;
