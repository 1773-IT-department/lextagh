-- 0019_user_admin_audit: Users and access (the admin screen in the Business System).
--
-- WRITTEN, NOT APPLIED. Desmond decides whether and when to apply it to the live project (with the admin-users Edge
-- Function deployed at the same time).
--
-- What it adds:
--   1. public.user_admin_audit: one row per change an admin makes to a login (invite, resend, role, brands, details,
--      switch off, switch on, password reset email). Admins read it; nobody writes it directly. Rows come only from
--      public.admin_update_user (below) and from the admin-users Edge Function (service role).
--   2. public.admin_users_list(): every login with its role, brands, distributor organisation and sign in state, for
--      admins only (everyone else gets no rows). Security definer, because the sign in dates live in auth.users.
--   3. public.admin_update_user(...): an admin changes a person's name, phone, role, brands and whether the login is
--      on, in one go. Refuses to leave the system without an active admin. Writes the audit rows.
--
-- The privileged parts that need the Auth admin API (sending the invite email, resending it, the password reset email,
-- blocking sign in for a switched off login) live in the admin-users Edge Function (supabase/functions/admin-users),
-- which runs inside Supabase with the service role key. No service role key is ever given to the portal.
-- Row Level Security: on for the new table, admin read only.

-- 1. Audit table --------------------------------------------------------------------------------------------------
create table public.user_admin_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,
  target_id uuid references public.profiles (id) on delete set null,
  target_email text not null,
  action text not null check (action in (
    'invited', 'invite_resent', 'password_reset_sent', 'role_changed', 'brands_changed', 'details_changed',
    'deactivated', 'reactivated', 'distributor_linked', 'distributor_unlinked'
  )),
  details jsonb not null default '{}'::jsonb
);

create index user_admin_audit_target_idx on public.user_admin_audit (target_id, created_at desc);
create index user_admin_audit_actor_idx on public.user_admin_audit (actor_id);
create index user_admin_audit_created_idx on public.user_admin_audit (created_at desc);

alter table public.user_admin_audit enable row level security;

revoke all on public.user_admin_audit from anon, authenticated;
grant select on public.user_admin_audit to authenticated;

create policy "admins read the user audit"
  on public.user_admin_audit for select to authenticated
  using ((select public.is_admin()));
-- No insert, update or delete policy and no grants for them: rows come only from the functions below and the
-- admin-users Edge Function (service role).

-- 2. The list of logins -------------------------------------------------------------------------------------------
-- status: deactivated (switched off), invited (has not accepted the invite yet), no_role (signed in but no role),
--         never_signed_in (accepted but never signed in), active.
create function public.admin_users_list()
returns table (
  id uuid, email text, full_name text, phone text, role public.app_role, is_active boolean, status text,
  brand_slugs text[], organisation_id uuid, organisation_name text,
  invited_at timestamptz, email_confirmed_at timestamptz, last_sign_in_at timestamptz, created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.email, p.full_name, p.phone, p.role, p.is_active,
         case
           when not p.is_active then 'deactivated'
           when u.email_confirmed_at is null and u.last_sign_in_at is null then 'invited'
           when p.role is null then 'no_role'
           when u.last_sign_in_at is null then 'never_signed_in'
           else 'active'
         end,
         coalesce((select array_agg(b.slug order by b.slug) from public.profile_brands pb
                   join public.brands b on b.id = pb.brand_id where pb.profile_id = p.id), '{}'),
         da.organisation_id, o.name,
         u.invited_at, u.email_confirmed_at, u.last_sign_in_at, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.distributor_accounts da on da.profile_id = p.id
  left join public.crm_organisations o on o.id = da.organisation_id
  where public.is_admin()
  order by lower(coalesce(nullif(btrim(p.full_name), ''), p.email));
$$;

revoke all on function public.admin_users_list() from public, anon;
grant execute on function public.admin_users_list() to authenticated;

-- 3. Changing a login ---------------------------------------------------------------------------------------------
-- Brands are brand slugs. They are kept only for roles that work on chosen brands; admin and management see every
-- brand, so their brand list is cleared. A distributor's organisation comes from the CRM link (distributor_accounts):
-- new_organisation links it (or moves the link), null leaves it, and changing the role away from distributor unlinks.
--
-- public.admin_apply_user does the work for a given acting admin. It is only for the admin-users Edge Function
-- (service role, after it has checked the caller's token) and for public.admin_update_user below; nobody signed in can
-- call it directly. quiet = true skips the per field audit rows (used right after an invite, which has its own row).
create function public.admin_apply_user(
  actor uuid,
  target uuid,
  new_full_name text,
  new_phone text,
  new_role public.app_role,
  new_brands text[],
  new_active boolean,
  new_organisation uuid default null,
  quiet boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old public.profiles%rowtype;
  old_brands text[];
  want_brands text[];
  old_org uuid;
  bad text;
  other_admins int;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'admin' and is_active) then
    raise exception 'only an admin can change logins' using errcode = '42501';
  end if;

  select * into old from public.profiles where id = target for update;
  if not found then
    raise exception 'that login does not exist' using errcode = 'P0002';
  end if;

  new_full_name := nullif(btrim(coalesce(new_full_name, '')), '');
  new_phone := nullif(btrim(coalesce(new_phone, '')), '');
  if new_full_name is not null and length(new_full_name) > 120 then
    raise exception 'the name is too long (120 characters at most)' using errcode = '22001';
  end if;
  if new_phone is not null and new_phone !~ '^\+?[0-9][0-9 ()-]{5,22}$' then
    raise exception 'the phone number does not look right' using errcode = '22023';
  end if;
  new_active := coalesce(new_active, old.is_active);

  -- Never leave the system without an active admin.
  if old.role = 'admin' and old.is_active and (new_role is distinct from 'admin' or not new_active) then
    select count(*) into other_admins from public.profiles
      where role = 'admin' and is_active and id <> target;
    if other_admins = 0 then
      raise exception 'this is the only active admin: make someone else an admin first' using errcode = 'P0001';
    end if;
  end if;

  -- Brands: only known brand slugs, and only for roles that work on chosen brands.
  if new_role in ('admin', 'management') or new_role is null then
    want_brands := '{}';
  else
    select coalesce(array_agg(distinct s order by s), '{}') into want_brands
      from unnest(coalesce(new_brands, '{}')) s where btrim(s) <> '';
    select s into bad from unnest(want_brands) s
      where not exists (select 1 from public.brands b where b.slug = s) limit 1;
    if bad is not null then
      raise exception 'unknown brand: %', bad using errcode = '22023';
    end if;
  end if;

  select coalesce(array_agg(b.slug order by b.slug), '{}') into old_brands
    from public.profile_brands pb join public.brands b on b.id = pb.brand_id where pb.profile_id = target;
  select organisation_id into old_org from public.distributor_accounts where profile_id = target;

  update public.profiles
     set full_name = new_full_name, phone = new_phone, role = new_role, is_active = new_active
   where id = target;

  if old_brands is distinct from want_brands then
    delete from public.profile_brands where profile_id = target;
    insert into public.profile_brands (profile_id, brand_id)
      select target, b.id from public.brands b where b.slug = any (want_brands);
    if not quiet then
      insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
        values (actor, target, old.email, 'brands_changed', jsonb_build_object('from', old_brands, 'to', want_brands));
    end if;
  end if;

  -- The distributor's organisation.
  if new_role is distinct from 'distributor' and old_org is not null then
    delete from public.distributor_accounts where profile_id = target;
    insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
      values (actor, target, old.email, 'distributor_unlinked', jsonb_build_object('organisation_id', old_org));
  elsif new_role = 'distributor' and new_organisation is not null and new_organisation is distinct from old_org then
    if not exists (select 1 from public.crm_organisations where id = new_organisation) then
      raise exception 'that organisation does not exist in the CRM' using errcode = '22023';
    end if;
    delete from public.distributor_accounts where profile_id = target;
    insert into public.distributor_accounts (profile_id, organisation_id) values (target, new_organisation);
    insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
      values (actor, target, old.email, 'distributor_linked', jsonb_build_object('from', old_org, 'to', new_organisation));
  end if;

  if quiet then
    return;
  end if;
  if old.role is distinct from new_role then
    insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
      values (actor, target, old.email, 'role_changed', jsonb_build_object('from', old.role, 'to', new_role));
  end if;
  if old.full_name is distinct from new_full_name or old.phone is distinct from new_phone then
    insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
      values (actor, target, old.email, 'details_changed', jsonb_build_object(
        'full_name', jsonb_build_object('from', old.full_name, 'to', new_full_name),
        'phone', jsonb_build_object('from', old.phone, 'to', new_phone)));
  end if;
  if old.is_active and not new_active then
    insert into public.user_admin_audit (actor_id, target_id, target_email, action)
      values (actor, target, old.email, 'deactivated');
  elsif not old.is_active and new_active then
    insert into public.user_admin_audit (actor_id, target_id, target_email, action)
      values (actor, target, old.email, 'reactivated');
  end if;
end;
$$;

revoke all on function public.admin_apply_user(uuid, uuid, text, text, public.app_role, text[], boolean, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_apply_user(uuid, uuid, text, text, public.app_role, text[], boolean, uuid, boolean)
  to service_role;

-- The portal's way in: the signed in admin changes a login (Row Level Security does not apply inside; the admin check
-- in admin_apply_user does).
create function public.admin_update_user(
  target uuid,
  new_full_name text,
  new_phone text,
  new_role public.app_role,
  new_brands text[],
  new_active boolean,
  new_organisation uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'only an admin can change logins' using errcode = '42501';
  end if;
  perform public.admin_apply_user((select auth.uid()), target, new_full_name, new_phone, new_role, new_brands, new_active,
    new_organisation, false);
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, public.app_role, text[], boolean, uuid) from public, anon;
grant execute on function public.admin_update_user(uuid, text, text, public.app_role, text[], boolean, uuid) to authenticated;

-- The Edge Function writes its own audit rows (invite, resend, password reset) as the service role.
grant insert on public.user_admin_audit to service_role;
