-- 0001_foundations: brands, profiles, roles, brand-level access, Row Level Security.
-- Lexta Business System, proposal 1773/LEX/2026-09 (Revised).

-- Roles ----------------------------------------------------------------------
create type public.app_role as enum (
  'admin', 'management', 'sales_rep', 'distributor', 'customer_care', 'hr', 'marketing'
);

-- Shared updated_at trigger --------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Brands ---------------------------------------------------------------------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  website_url text,
  is_corporate boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

insert into public.brands (slug, name, is_corporate) values
  ('lexta', 'Lexta Ghana', true),
  ('yazz', 'Yazz', false),
  ('linzzy', 'Linzzy', false),
  ('hooch', 'Hooch', false);

-- Profiles (one per staff or distributor login) -----------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role public.app_role,               -- null until an admin assigns one: no access
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Which brands a person works on. Admin and management see every brand without rows here.
create table public.profile_brands (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, brand_id)
);

create index profile_brands_brand_idx on public.profile_brands (brand_id);

create trigger profile_brands_set_updated_at
  before update on public.profile_brands
  for each row execute function public.set_updated_at();

-- Helper functions used by policies (security definer so policies do not recurse) --
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.sees_all_brands()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'management'), false);
$$;

create or replace function public.has_brand_access(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.sees_all_brands()
    or (
      public.current_app_role() is not null
      and exists (
        select 1 from public.profile_brands pb
        where pb.profile_id = (select auth.uid()) and pb.brand_id = target_brand
      )
    );
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.sees_all_brands() from public, anon;
revoke all on function public.has_brand_access(uuid) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.sees_all_brands() to authenticated;
grant execute on function public.has_brand_access(uuid) to authenticated;

-- New login creates a profile. Logins are invite only; the role comes from the
-- invite's app_metadata (set server side by an admin), never from user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited_role text := new.raw_app_meta_data ->> 'role';
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    case
      when invited_role in ('admin', 'management', 'sales_rep', 'distributor', 'customer_care', 'hr', 'marketing')
        then invited_role::public.app_role
      else null
    end
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security --------------------------------------------------------
alter table public.brands enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_brands enable row level security;

-- Brands: names are public (the websites show them). Only admins change them.
create policy "active brands are readable by website visitors"
  on public.brands for select to anon
  using (is_active);

create policy "staff read active brands, admins read all"
  on public.brands for select to authenticated
  using (is_active or (select public.is_admin()));

create policy "admins insert brands"
  on public.brands for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins update brands"
  on public.brands for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins delete brands"
  on public.brands for delete to authenticated
  using ((select public.is_admin()));

-- Profiles: you see yourself; admin and management see everyone. Only admins change roles.
create policy "read own profile or all for admin and management"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.sees_all_brands()));

create policy "admins update profiles"
  on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins delete profiles"
  on public.profiles for delete to authenticated
  using ((select public.is_admin()));
-- No insert policy: profiles are created only by the auth trigger.

-- Profile brands: you see your own; admin and management see all; admins manage.
create policy "read own brand access or all for admin and management"
  on public.profile_brands for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.sees_all_brands()));

create policy "admins insert brand access"
  on public.profile_brands for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins update brand access"
  on public.profile_brands for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admins delete brand access"
  on public.profile_brands for delete to authenticated
  using ((select public.is_admin()));

-- Self service: a person may update their own name and phone, nothing else.
create or replace function public.update_my_profile(new_full_name text, new_phone text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
     set full_name = new_full_name, phone = new_phone
   where id = (select auth.uid());
$$;

revoke all on function public.update_my_profile(text, text) from public, anon;
grant execute on function public.update_my_profile(text, text) to authenticated;
