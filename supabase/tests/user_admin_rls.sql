-- Users and access (0019): the admin list of logins, changing a login, the last admin rule, brands and distributor
-- links, the audit trail, and who may do any of it.
-- Run with: bash supabase/tests/local/run.sh user_admin_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000a501'
    when 'admin2' then '00000000-0000-0000-0000-00000000a502'
    when 'mgmt' then '00000000-0000-0000-0000-00000000a503'
    when 'mkt' then '00000000-0000-0000-0000-00000000a504'
    when 'dist' then '00000000-0000-0000-0000-00000000a505'
    when 'invitee' then '00000000-0000-0000-0000-00000000a506'
    when 'rep' then '00000000-0000-0000-0000-00000000a507'
    when 'org' then '00000000-0000-0000-0000-00000000a5f1'
  end::uuid;
$$;

create function pg_temp.login(label text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', case when label = 'anon' then '' else pg_temp.u(label)::text end, true),
         set_config('role', case when label = 'anon' then 'anon' else 'authenticated' end, true);
$$;

create function pg_temp.owner() returns void language sql as $$
  select set_config('request.jwt.claim.sub', '', true), set_config('role', 'postgres', true);
$$;

create function pg_temp.fails(stmt text, code text default null) returns boolean language plpgsql as $$
begin
  execute stmt;
  return false;
exception when others then
  if code is null or sqlstate = code then return true; end if;
  raise notice 'unexpected error % (%) for: %', sqlstate, sqlerrm, left(stmt, 200);
  return false;
end;
$$;

create function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', msg; end if;
end;
$$;

create function pg_temp.audits(target text, act text) returns integer language sql stable as $$
  select count(*)::int from public.user_admin_audit where target_id = pg_temp.u(target) and action = act;
$$;

-- Schema ----------------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'user_admin_audit'),
    'the audit table has Row Level Security on');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('admin_users_list', 'admin_update_user', 'admin_apply_user')
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=""')),
    'the user admin functions set search_path to empty');
  perform pg_temp.ok(not has_function_privilege('anon', 'public.admin_users_list()', 'execute'), 'anon cannot list logins');
  perform pg_temp.ok(not has_function_privilege('anon', 'public.admin_update_user(uuid,text,text,app_role,text[],boolean,uuid)', 'execute'),
    'anon cannot change logins');
  perform pg_temp.ok(not has_function_privilege('authenticated', 'public.admin_apply_user(uuid,uuid,text,text,app_role,text[],boolean,uuid,boolean)', 'execute'),
    'signed in people cannot call the inner function (only the Edge Function can)');
  perform pg_temp.ok(has_function_privilege('service_role', 'public.admin_apply_user(uuid,uuid,text,text,app_role,text[],boolean,uuid,boolean)', 'execute'),
    'the service role can call the inner function');
  perform pg_temp.ok(not has_table_privilege('authenticated', 'public.user_admin_audit', 'insert')
      and not has_table_privilege('authenticated', 'public.user_admin_audit', 'update')
      and not has_table_privilege('authenticated', 'public.user_admin_audit', 'delete'),
    'nobody signed in writes the audit directly');
  raise notice 'PASS: RLS on, search_path set, functions closed to anon, inner function for the service role only';
end $$;

-- Fixtures --------------------------------------------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, last_sign_in_at, invited_at) values
  (pg_temp.u('admin'), 'admin@lexta.test', '{"role":"admin"}', '{"full_name":"Akua Admin"}', now(), now(), null),
  (pg_temp.u('mgmt'), 'mgmt@lexta.test', '{"role":"management"}', '{"full_name":"Kwame Manager"}', now(), now(), null),
  (pg_temp.u('mkt'), 'mkt@lexta.test', '{"role":"marketing"}', '{"full_name":"Ama Mensah"}', now(), null, null),
  (pg_temp.u('dist'), 'dist@lexta.test', '{"role":"distributor"}', '{}', now(), now(), null),
  (pg_temp.u('invitee'), 'new@lexta.test', '{}', '{}', null, null, now()),
  (pg_temp.u('rep'), 'rep@lexta.test', '{"role":"sales_rep"}', '{}', now(), now(), null);
insert into public.profile_brands (profile_id, brand_id) select pg_temp.u('mkt'), id from public.brands where slug = 'yazz';
insert into public.crm_organisations (id, name, kind) values (pg_temp.u('org'), 'Accra Wholesale Ltd', 'distributor');

-- The list ---------------------------------------------------------------------------------------------------------
do $$
declare r record;
begin
  perform pg_temp.login('admin');
  perform pg_temp.ok((select count(*) from public.admin_users_list()) = 6, 'an admin sees every login');
  select * into r from public.admin_users_list() where id = pg_temp.u('invitee');
  perform pg_temp.ok(r.status = 'invited', 'an invite not yet accepted shows as invited');
  select * into r from public.admin_users_list() where id = pg_temp.u('mkt');
  perform pg_temp.ok(r.status = 'never_signed_in' and r.brand_slugs = array['yazz'], 'accepted but never signed in, with brands');
  select * into r from public.admin_users_list() where id = pg_temp.u('admin');
  perform pg_temp.ok(r.status = 'active' and r.last_sign_in_at is not null, 'active with a last sign in');

  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.admin_users_list()) = 0, 'management gets no rows');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_update_user('00000000-0000-0000-0000-00000000a504', 'x', null, 'marketing', '{}', true)$q$, '42501'),
    'management cannot change logins');
  perform pg_temp.ok((select count(*) from public.user_admin_audit) = 0, 'management reads no audit rows');
  perform pg_temp.login('mkt');
  perform pg_temp.ok((select count(*) from public.admin_users_list()) = 0, 'marketing gets no rows');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_apply_user('00000000-0000-0000-0000-00000000a501', '00000000-0000-0000-0000-00000000a504', 'x', null, 'admin', '{}', true)$q$, '42501'),
    'nobody signed in can call the inner function, even naming an admin as the actor');
  perform pg_temp.owner();
  raise notice 'PASS: admins list every login with status and brands; nobody else lists or changes logins';
end $$;

-- Changing logins ----------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('admin');
  -- Role, brands, name and phone in one go.
  perform public.admin_update_user(pg_temp.u('mkt'), 'Ama Mensah-Boateng', '+233 24 123 4567', 'customer_care', array['yazz', 'linzzy'], true);
  perform pg_temp.owner();
  perform pg_temp.ok((select role from public.profiles where id = pg_temp.u('mkt')) = 'customer_care', 'role changed');
  perform pg_temp.ok((select array_agg(b.slug order by b.slug) from public.profile_brands pb join public.brands b on b.id = pb.brand_id
                       where pb.profile_id = pg_temp.u('mkt')) = array['linzzy', 'yazz'], 'brands replaced');
  perform pg_temp.ok(pg_temp.audits('mkt', 'role_changed') = 1 and pg_temp.audits('mkt', 'brands_changed') = 1
      and pg_temp.audits('mkt', 'details_changed') = 1, 'one audit row per kind of change');
  perform pg_temp.ok((select actor_id from public.user_admin_audit where target_id = pg_temp.u('mkt') limit 1) = pg_temp.u('admin'),
    'the audit names the admin who did it');

  perform pg_temp.login('admin');
  -- Management sees every brand, so their brand rows are cleared.
  perform public.admin_update_user(pg_temp.u('mkt'), 'Ama Mensah-Boateng', '+233 24 123 4567', 'management', array['yazz'], true);
  perform pg_temp.owner();
  perform pg_temp.ok(not exists (select 1 from public.profile_brands where profile_id = pg_temp.u('mkt')), 'management keeps no brand rows');

  perform pg_temp.login('admin');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_update_user('00000000-0000-0000-0000-00000000a507', null, null, 'sales_rep', array['nope'], true)$q$, '22023'),
    'an unknown brand is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_update_user('00000000-0000-0000-0000-00000000a507', null, 'call me', 'sales_rep', '{}', true)$q$, '22023'),
    'a bad phone number is refused');

  -- Switch off and on again.
  perform public.admin_update_user(pg_temp.u('rep'), null, null, 'sales_rep', '{}', false);
  perform pg_temp.ok((select status from public.admin_users_list() where id = pg_temp.u('rep')) = 'deactivated', 'switched off shows as deactivated');
  perform public.admin_update_user(pg_temp.u('rep'), null, null, 'sales_rep', '{}', true);
  perform pg_temp.owner();
  perform pg_temp.ok(pg_temp.audits('rep', 'deactivated') = 1 and pg_temp.audits('rep', 'reactivated') = 1, 'switching off and on is audited');

  -- A switched off person loses access at once.
  perform pg_temp.login('admin');
  perform public.admin_update_user(pg_temp.u('mgmt'), 'Kwame Manager', null, 'management', '{}', false);
  perform pg_temp.login('mgmt');
  perform pg_temp.ok(public.current_app_role() is null, 'a switched off login has no role');
  perform pg_temp.owner();
  raise notice 'PASS: role, brands, details and switching off change together and are audited; switched off means no access';
end $$;

-- Distributor link ---------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('admin');
  perform public.admin_update_user(pg_temp.u('dist'), 'Kofi Distributor', null, 'distributor', '{}', true, pg_temp.u('org'));
  perform pg_temp.owner();
  perform pg_temp.ok((select organisation_id from public.distributor_accounts where profile_id = pg_temp.u('dist')) = pg_temp.u('org'),
    'a distributor login is linked to its organisation');
  perform pg_temp.login('admin');
  perform pg_temp.ok((select organisation_name from public.admin_users_list() where id = pg_temp.u('dist')) = 'Accra Wholesale Ltd',
    'the list shows the organisation');
  perform public.admin_update_user(pg_temp.u('dist'), 'Kofi Distributor', null, 'sales_rep', '{}', true);
  perform pg_temp.owner();
  perform pg_temp.ok(not exists (select 1 from public.distributor_accounts where profile_id = pg_temp.u('dist')),
    'moving away from the distributor role unlinks the organisation');
  perform pg_temp.ok(pg_temp.audits('dist', 'distributor_linked') = 1 and pg_temp.audits('dist', 'distributor_unlinked') = 1,
    'linking and unlinking are audited');
  raise notice 'PASS: distributor logins link to and unlink from their organisation';
end $$;

-- The last admin -----------------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.login('admin');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_update_user('00000000-0000-0000-0000-00000000a501', 'Akua Admin', null, 'management', '{}', true)$q$, 'P0001'),
    'the only active admin cannot be demoted');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_update_user('00000000-0000-0000-0000-00000000a501', 'Akua Admin', null, 'admin', '{}', false)$q$, 'P0001'),
    'the only active admin cannot be switched off');
  perform pg_temp.owner();
  insert into auth.users (id, email, raw_app_meta_data, email_confirmed_at) values (pg_temp.u('admin2'), 'admin2@lexta.test', '{"role":"admin"}', now());
  perform pg_temp.login('admin');
  perform public.admin_update_user(pg_temp.u('admin'), 'Akua Admin', null, 'management', '{}', true);
  perform pg_temp.owner();
  perform pg_temp.ok((select role from public.profiles where id = pg_temp.u('admin')) = 'management', 'with a second admin, the first can step down');
  perform pg_temp.login('admin2');
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_update_user('00000000-0000-0000-0000-00000000a502', null, null, 'admin', '{}', false)$q$, 'P0001'),
    'and the second, now alone, cannot switch themselves off');
  perform pg_temp.owner();
  raise notice 'PASS: there is always an active admin';
end $$;

-- The service role path (the Edge Function) --------------------------------------------------------------------------
do $$
begin
  set local role service_role;
  -- Just after an invite: role, brands and details set quietly, the invite itself is one audit row.
  perform public.admin_apply_user(pg_temp.u('admin2'), pg_temp.u('invitee'), 'New Person', null, 'sales_rep', array['hooch'], true, null, true);
  insert into public.user_admin_audit (actor_id, target_id, target_email, action, details)
    values (pg_temp.u('admin2'), pg_temp.u('invitee'), 'new@lexta.test', 'invited', '{"role":"sales_rep"}');
  reset role;
  perform pg_temp.ok((select role from public.profiles where id = pg_temp.u('invitee')) = 'sales_rep', 'the invite sets the role');
  perform pg_temp.ok(pg_temp.audits('invitee', 'role_changed') = 0 and pg_temp.audits('invitee', 'invited') = 1,
    'quiet: only the invite row');
  set local role service_role;
  perform pg_temp.ok(pg_temp.fails($q$select public.admin_apply_user('00000000-0000-0000-0000-00000000a504', '00000000-0000-0000-0000-00000000a506', null, null, 'admin', '{}', true)$q$, '42501'),
    'the service role path still requires the actor to be an active admin');
  reset role;
  raise notice 'PASS: the Edge Function path sets an invite quietly and still checks the actor';
end $$;

rollback;
