-- Minimal stand in for the parts of a Supabase database that our migrations and RLS tests touch.
-- Used only by supabase/tests/local/run.sh against a throwaway local Postgres. Never applied to Supabase.

-- API roles, with Supabase's default privileges ------------------------------------
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- auth schema --------------------------------------------------------------------
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Same contract as Supabase: the signed in user's id comes from the JWT "sub" claim.
create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(current_setting('request.jwt.claim.sub', true), current_setting('request.jwt.claims', true)::jsonb ->> 'sub'),
    ''
  )::uuid;
$$;

create function auth.role() returns text
language sql stable
as $$ select current_user::text; $$;

grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;

-- Supabase ships this event trigger function; 0002 revokes access to it.
create function public.rls_auto_enable() returns void language sql as $$ select $$;

-- storage schema -----------------------------------------------------------------
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null unique,
  owner uuid,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, name)
);

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

grant all on storage.buckets, storage.objects to anon, authenticated, service_role;

-- Same as Supabase: every folder of an object path, without the file name.
create function storage.foldername(name text) returns text[]
language plpgsql immutable
as $$
declare
  parts text[] := string_to_array(name, '/');
begin
  return parts[1:array_length(parts, 1) - 1];
end;
$$;

grant execute on function storage.foldername(text) to anon, authenticated, service_role;
