-- Website lead managers (0012): who chooses them, who reads them, who can be one, how new website leads get their
-- owner (brand manager, then default, then nobody), skipping people who no longer qualify, staff leads untouched,
-- the history, and deleting a manager or a brand.
-- Run with: bash supabase/tests/local/run.sh website_lead_managers
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Helpers ----------------------------------------------------------------------------------------------
create function pg_temp.u(label text) returns uuid language sql immutable as $$
  select case label
    when 'admin' then '00000000-0000-0000-0000-00000000a201'
    when 'admin2' then '00000000-0000-0000-0000-00000000a202'
    when 'mgmt' then '00000000-0000-0000-0000-00000000a203'
    when 'rep_yazz' then '00000000-0000-0000-0000-00000000a204'
    when 'rep_hooch' then '00000000-0000-0000-0000-00000000a205'
    when 'mkt' then '00000000-0000-0000-0000-00000000a206'
    when 'care' then '00000000-0000-0000-0000-00000000a207'
    when 'hr' then '00000000-0000-0000-0000-00000000a208'
    when 'dist' then '00000000-0000-0000-0000-00000000a209'
    when 'norole' then '00000000-0000-0000-0000-00000000a20a'
    when 'rep_off' then '00000000-0000-0000-0000-00000000a20b'
    when 'conv' then '00000000-0000-0000-0000-00000000a2c1'
  end::uuid;
$$;

create function pg_temp.brand(slug text) returns uuid language sql stable as $$
  select id from public.brands where brands.slug = brand.slug;
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

-- The managers as the current person would save them: default plus {brand slug: person label or null}.
create function pg_temp.save(default_label text, brands jsonb default '{}') returns void language plpgsql as $$
declare
  obj jsonb := '{}';
  k text;
  v text;
begin
  for k, v in select e.key, e.value #>> '{}' from jsonb_each(brands) e loop
    obj := obj || jsonb_build_object(pg_temp.brand(k)::text, case when v is null then null else pg_temp.u(v)::text end);
  end loop;
  perform public.save_crm_website_lead_managers(case when default_label is null then null else pg_temp.u(default_label) end, obj);
end;
$$;

-- A website contact form as an anonymous visitor; returns the new lead's owner.
create function pg_temp.enquiry(brand_slug text, email text) returns uuid language plpgsql as $$
declare
  r text;
  o uuid;
begin
  perform pg_temp.login('anon');
  r := public.submit_website_enquiry('contact', jsonb_strip_nulls(jsonb_build_object(
    'name', 'Visitor ' || email, 'email', email, 'message', 'Hello from the website', 'brand', brand_slug)));
  perform pg_temp.owner();
  select l.owner_id into o from public.crm_leads l where l.intake_reference = r;
  if not found then raise exception 'FAIL: no lead for %', r; end if;
  return o;
end;
$$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- Schema checks ------------------------------------------------------------------------------------------
do $$
begin
  perform pg_temp.ok(not exists (select 1 from pg_tables where schemaname = 'public' and tablename like 'crm_website_lead_manager%' and not rowsecurity),
    'both tables have Row Level Security on');
  perform pg_temp.ok((select count(*) from pg_tables where schemaname = 'public' and tablename like 'crm_website_lead_manager%') = 2, 'two tables');
  perform pg_temp.ok(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('crm_website_lead_manager_ok', 'crm_profile_label', 'check_crm_website_lead_manager', 'log_crm_website_lead_manager',
                          'crm_website_lead_manager_for', 'set_crm_website_lead_owner', 'save_crm_website_lead_managers', 'crm_website_lead_manager_put')
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=""')),
    'every new function sets search_path to empty');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers) and not exists (select 1 from public.crm_website_lead_manager_changes),
    'nothing is seeded');
  perform pg_temp.ok((select string_agg(tgname, ',' order by tgname) from pg_trigger where tgrelid = 'public.crm_leads'::regclass
      and not tgisinternal and tgtype & 2 = 2 and tgtype & 4 = 4) = 'crm_leads_check,crm_leads_set_authors,crm_leads_set_stage_fields,crm_leads_website_owner',
    'the website owner trigger runs last of the before insert triggers on crm_leads');
  raise notice 'PASS: RLS on, search_path set, nothing seeded, trigger order';
end $$;

-- Fixtures (as the database owner) -----------------------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  (pg_temp.u('admin'),     'wl.admin@test.local',  '{"role":"admin"}',         '{"full_name":"Web Admin"}'),
  (pg_temp.u('admin2'),    'wl.admin2@test.local', '{"role":"admin"}',         '{"full_name":"Second Admin"}'),
  (pg_temp.u('mgmt'),      'wl.mgmt@test.local',   '{"role":"management"}',    '{"full_name":"Mary Manager"}'),
  (pg_temp.u('rep_yazz'),  'wl.repy@test.local',   '{"role":"sales_rep"}',     '{"full_name":"Yaw Yazz Rep"}'),
  (pg_temp.u('rep_hooch'), 'wl.reph@test.local',   '{"role":"sales_rep"}',     '{"full_name":"Esi Hooch Rep"}'),
  (pg_temp.u('mkt'),       'wl.mkt@test.local',    '{"role":"marketing"}',     '{"full_name":"Kwesi Marketing"}'),
  (pg_temp.u('care'),      'wl.care@test.local',   '{"role":"customer_care"}', '{"full_name":"Adjoa Care"}'),
  (pg_temp.u('hr'),        'wl.hr@test.local',     '{"role":"hr"}',            '{}'),
  (pg_temp.u('dist'),      'wl.dist@test.local',   '{"role":"distributor"}',   '{}'),
  (pg_temp.u('norole'),    'wl.norole@test.local', '{}',                       '{}'),
  (pg_temp.u('rep_off'),   'wl.repoff@test.local', '{"role":"sales_rep"}',     '{}');
update public.profiles set is_active = false where id = pg_temp.u('rep_off');
insert into public.profile_brands (profile_id, brand_id) values
  (pg_temp.u('rep_yazz'), pg_temp.brand('yazz')),
  (pg_temp.u('rep_hooch'), pg_temp.brand('hooch')),
  (pg_temp.u('rep_off'), pg_temp.brand('yazz')),
  (pg_temp.u('mkt'), pg_temp.brand('linzzy'));

-- Who may change and read the managers ---------------------------------------------------------------------
do $$
declare who text;
begin
  -- Nobody but an admin can save, through the function or straight into the table.
  foreach who in array array['mgmt', 'rep_yazz', 'mkt', 'care', 'hr', 'dist', 'norole', 'rep_off'] loop
    perform pg_temp.login(who);
    perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('mgmt')$q$, '42501'), who || ' cannot save the managers');
    perform pg_temp.ok(pg_temp.fails(format('insert into public.crm_website_lead_managers (brand_id, manager_id) values (null, %L)', pg_temp.u('mgmt')), '42501'),
      who || ' cannot insert a manager');
    perform pg_temp.ok(pg_temp.fails(format('select public.crm_website_lead_manager_put(null, %L)', pg_temp.u('mgmt')), '42501'),
      who || ' cannot put a manager');
  end loop;
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('mgmt')$q$, '42501'), 'anon cannot save the managers');
  perform pg_temp.ok(pg_temp.fails('select 1 from public.crm_website_lead_managers', '42501'), 'anon cannot read the managers');
  perform pg_temp.ok(pg_temp.fails('select 1 from public.crm_website_lead_manager_changes', '42501'), 'anon cannot read the history');
  perform pg_temp.owner();
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers), 'nothing was saved');
  raise notice 'PASS: only admins save; anon reads nothing';
end $$;

do $$
begin
  perform pg_temp.login('admin');
  -- People who cannot work CRM leads are refused.
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('care')$q$, '23514'), 'customer care cannot be a manager while it cannot work leads');
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('hr')$q$, '23514'), 'hr cannot be a manager');
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('dist')$q$, '23514'), 'a distributor cannot be a manager');
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('norole')$q$, '23514'), 'a person without a role cannot be a manager');
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('rep_off')$q$, '23514'), 'an inactive person cannot be a manager');
  -- A brand manager who is a sales rep or marketer must work that brand.
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save(null, '{"hooch":"rep_yazz"}')$q$, '23514'), 'a Yazz rep cannot manage Hooch leads');
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save(null, '{"yazz":"mkt"}')$q$, '23514'), 'a Linzzy marketer cannot manage Yazz leads');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_crm_website_lead_managers(null, %L)', jsonb_build_object('nope', pg_temp.u('mgmt')::text)), '22023'),
    'a brand that is not an id is refused');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_crm_website_lead_managers(null, %L)', jsonb_build_object(gen_random_uuid()::text, pg_temp.u('mgmt')::text)), '22023'),
    'an unknown brand is refused');
  perform pg_temp.ok(pg_temp.fails(format('select public.save_crm_website_lead_managers(null, %L)', jsonb_build_object(pg_temp.brand('yazz')::text, 5)), '22023'),
    'a manager that is not an id is refused');
  perform pg_temp.ok(pg_temp.fails($q$select public.save_crm_website_lead_managers(null, '[]')$q$, '22023'), 'brand managers must be an object');
  perform pg_temp.owner();
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers) and not exists (select 1 from public.crm_website_lead_manager_changes),
    'refused saves leave nothing behind');

  -- The admin sets a default (management) and two brand managers.
  perform pg_temp.login('admin');
  perform pg_temp.save('mgmt', '{"yazz":"rep_yazz","hooch":"rep_hooch","linzzy":null}');
  perform pg_temp.ok((select manager_id from public.crm_website_lead_managers where brand_id is null) = pg_temp.u('mgmt'), 'admin sets the default manager');
  perform pg_temp.ok((select manager_id from public.crm_website_lead_managers where brand_id = pg_temp.brand('yazz')) = pg_temp.u('rep_yazz'), 'admin sets the Yazz manager');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_managers) = 3, 'three settings, Linzzy uses the default');
  perform pg_temp.ok((select bool_and(updated_by = pg_temp.u('admin')) from public.crm_website_lead_managers), 'updated_by is the admin');
  -- Saving the same again changes nothing.
  perform pg_temp.save('mgmt', '{"yazz":"rep_yazz","hooch":"rep_hooch","linzzy":null}');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) = 3, 'only real changes are logged');
  -- An admin can also be a manager (any brand), and so can a marketer of their own brand.
  perform pg_temp.save('admin2', '{"linzzy":"mkt"}');
  perform pg_temp.ok((select manager_id from public.crm_website_lead_managers where brand_id is null) = pg_temp.u('admin2'), 'admin changes the default');
  perform pg_temp.ok((select manager_id from public.crm_website_lead_managers where brand_id = pg_temp.brand('linzzy')) = pg_temp.u('mkt'), 'marketer manages their brand');
  -- The brand of a setting never moves.
  perform pg_temp.ok(pg_temp.fails(format('update public.crm_website_lead_managers set brand_id = %L where brand_id = %L', pg_temp.brand('lexta'), pg_temp.brand('linzzy')), '42501'),
    'the brand of a setting cannot change');
  -- Direct table writes follow the same rules as the function.
  perform pg_temp.ok(pg_temp.fails(format('update public.crm_website_lead_managers set manager_id = %L where brand_id is null', pg_temp.u('hr')), '23514'),
    'a direct update to someone unqualified is refused');
  perform pg_temp.ok(pg_temp.fails(format('update public.crm_website_lead_managers set updated_at = now() - interval ''1 day'' where brand_id is null'), '42501'),
    'updated_at cannot be written');
  perform pg_temp.save('mgmt', '{"linzzy":null}');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers where brand_id = pg_temp.brand('linzzy')), 'use default clears the brand row');

  -- Management reads; other roles see nothing.
  perform pg_temp.login('mgmt');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_managers) = 3, 'management reads the managers');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) > 0, 'management reads the history');
  perform pg_temp.ok(pg_temp.fails(format('insert into public.crm_website_lead_manager_changes (scope, reason) values (%L, %L)', 'default', 'changed'), '42501'),
    'nobody writes the history directly');
  perform pg_temp.login('rep_yazz');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers), 'a rep reads no settings');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_manager_changes), 'a rep reads no history');
  perform pg_temp.login('care');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers), 'customer care reads no settings');
  perform pg_temp.login('admin');
  perform pg_temp.ok(pg_temp.fails('delete from public.crm_website_lead_manager_changes', '42501'), 'the history cannot be deleted');
  perform pg_temp.ok(pg_temp.fails('update public.crm_website_lead_manager_changes set new_manager_name = ''x''', '42501'), 'the history cannot be changed');
  perform pg_temp.owner();
  raise notice 'PASS: admin sets default and brand managers; refused people; management reads; history is read only';
end $$;

-- History ----------------------------------------------------------------------------------------------------
do $$
declare h record;
begin
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) = 7, 'seven changes so far');
  select * into h from public.crm_website_lead_manager_changes where scope = 'default' order by created_at, id limit 1;
  perform pg_temp.ok(h.old_manager_id is null and h.new_manager_id = pg_temp.u('mgmt') and h.new_manager_name = 'Mary Manager'
    and h.changed_by = pg_temp.u('admin') and h.changed_by_name = 'Web Admin' and h.reason = 'changed' and h.brand_id is null, 'first default row');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where scope = 'default'
    and old_manager_id = pg_temp.u('mgmt') and new_manager_id = pg_temp.u('admin2') and old_manager_name = 'Mary Manager' and new_manager_name = 'Second Admin'),
    'a default change records old and new');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where scope = 'brand' and brand_id = pg_temp.brand('linzzy')
    and brand_name = 'Linzzy' and old_manager_id = pg_temp.u('mkt') and new_manager_id is null and new_manager_name is null),
    'clearing a brand records the old manager and no new one');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where scope = 'brand' and brand_id = pg_temp.brand('yazz')
    and new_manager_name = 'Yaw Yazz Rep'), 'a brand row names the brand manager');
  raise notice 'PASS: every change writes a history row with who, when, brand, old and new';
end $$;

-- Website leads get their owner ---------------------------------------------------------------------------------
-- Now: default mgmt, Yazz rep_yazz, Hooch rep_hooch, Linzzy and Lexta use the default.
do $$
begin
  perform pg_temp.ok(pg_temp.enquiry('yazz', 'a1@visitor.test') = pg_temp.u('rep_yazz'), 'a Yazz enquiry goes to the Yazz manager');
  perform pg_temp.ok(pg_temp.enquiry('hooch', 'a2@visitor.test') = pg_temp.u('rep_hooch'), 'a Hooch enquiry goes to the Hooch manager');
  perform pg_temp.ok(pg_temp.enquiry('linzzy', 'a3@visitor.test') = pg_temp.u('mgmt'), 'a Linzzy enquiry falls back to the default');
  perform pg_temp.ok(pg_temp.enquiry(null, 'a4@visitor.test') = pg_temp.u('mgmt'), 'an enquiry with no brand goes to the default');

  -- A partner form too.
  perform pg_temp.login('anon');
  perform public.submit_website_enquiry('partner', jsonb_build_object('name', 'Partner P', 'organisation_name', 'Partner Org WL', 'email', 'p@visitor.test', 'brand', 'yazz'));
  perform pg_temp.owner();
  perform pg_temp.ok((select owner_id from public.crm_leads where source = 'website_partner_form' and submitted_organisation_name = 'Partner Org WL') = pg_temp.u('rep_yazz'),
    'a partner enquiry gets the brand manager');

  -- The Yazz rep is deactivated: Yazz leads fall back to the default.
  update public.profiles set is_active = false where id = pg_temp.u('rep_yazz');
  perform pg_temp.ok(pg_temp.enquiry('yazz', 'a5@visitor.test') = pg_temp.u('mgmt'), 'an inactive brand manager is skipped for the default');
  update public.profiles set is_active = true where id = pg_temp.u('rep_yazz');
  -- The Hooch rep loses the Hooch brand: skipped too.
  delete from public.profile_brands where profile_id = pg_temp.u('rep_hooch') and brand_id = pg_temp.brand('hooch');
  perform pg_temp.ok(pg_temp.enquiry('hooch', 'a6@visitor.test') = pg_temp.u('mgmt'), 'a brand manager who no longer works the brand is skipped');
  insert into public.profile_brands (profile_id, brand_id) values (pg_temp.u('rep_hooch'), pg_temp.brand('hooch'));
  -- The default manager is deactivated as well: nobody.
  update public.profiles set is_active = false where id in (pg_temp.u('mgmt'), pg_temp.u('rep_yazz'));
  perform pg_temp.ok(pg_temp.enquiry('yazz', 'a7@visitor.test') is null, 'no qualifying manager leaves the lead unowned');
  -- The default manager's role changes to one that cannot work leads: skipped.
  update public.profiles set is_active = true, role = 'hr' where id = pg_temp.u('mgmt');
  perform pg_temp.ok(pg_temp.enquiry('linzzy', 'a8@visitor.test') is null, 'a default manager who lost the CRM role is skipped');
  update public.profiles set role = 'management' where id = pg_temp.u('mgmt');
  update public.profiles set is_active = true where id = pg_temp.u('rep_yazz');
  raise notice 'PASS: website enquiries get the brand manager, else the default, else nobody; people who no longer qualify are skipped';
end $$;

-- Saving the page while a saved manager no longer qualifies ---------------------------------------------------------
do $$
declare n integer;
begin
  update public.profiles set is_active = false where id = pg_temp.u('rep_hooch');
  n := (select count(*) from public.crm_website_lead_manager_changes);
  perform pg_temp.login('admin');
  -- The page sends every picker back, the Hooch one unchanged.
  perform pg_temp.save('mgmt', '{"yazz":"rep_yazz","hooch":"rep_hooch","linzzy":null,"lexta":null}');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) = n, 'an unchanged save succeeds and logs nothing');
  -- Only the default changes.
  perform pg_temp.save('admin2', '{"yazz":"rep_yazz","hooch":"rep_hooch","linzzy":null,"lexta":null}');
  perform pg_temp.ok((select manager_id from public.crm_website_lead_managers where brand_id is null) = pg_temp.u('admin2'), 'changing only the default succeeds');
  perform pg_temp.ok((select manager_id from public.crm_website_lead_managers where brand_id = pg_temp.brand('hooch')) = pg_temp.u('rep_hooch'),
    'the unqualified Hooch manager stays saved');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) = n + 1, 'one change logged');
  -- Picking that person anew is still refused.
  perform pg_temp.ok(pg_temp.fails($q$select pg_temp.save('rep_hooch')$q$, '23514'), 'an unqualified person cannot be newly chosen');
  perform pg_temp.save('mgmt', '{"yazz":"rep_yazz","hooch":"rep_hooch"}');
  perform pg_temp.owner();
  update public.profiles set is_active = true where id = pg_temp.u('rep_hooch');
  raise notice 'PASS: saving the page works while a saved manager no longer qualifies';
end $$;

-- Live chat leads made by staff, and staff leads ------------------------------------------------------------------
insert into public.chat_conversations (id, reference, brand_id, token_hash, visitor_name, visitor_email)
values (pg_temp.u('conv'), 'LC-0000A2C1', pg_temp.brand('hooch'), repeat('a', 64), 'Chat Visitor', 'chat.visitor@example.com');

do $$
declare
  lead uuid;
begin
  -- Customer care makes a lead from a chat: it gets the Hooch manager, and the owner rules for customer care do not
  -- get in the way (the manager is filled in after crm_leads_check).
  perform pg_temp.login('care');
  lead := public.chat_create_lead(pg_temp.u('conv'));
  perform pg_temp.owner();
  perform pg_temp.ok((select owner_id = pg_temp.u('rep_hooch') and source = 'website_live_chat' and created_by = pg_temp.u('care')
    from public.crm_leads where id = lead), 'a live chat lead gets the brand manager');

  -- Staff leads with an owner keep it, website source or not.
  perform pg_temp.login('rep_yazz');
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Rep lead', 'source', 'website_contact_form', 'brand_id', pg_temp.brand('yazz'),
    'owner_id', pg_temp.u('rep_yazz'), 'description', 'x', 'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.owner();
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) = pg_temp.u('rep_yazz'), 'a staff lead with an owner keeps it');
  perform pg_temp.login('admin');
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Admin lead', 'source', 'website_partner_form', 'brand_id', pg_temp.brand('yazz'),
    'owner_id', pg_temp.u('mkt'), 'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) = pg_temp.u('mkt'), 'an admin lead keeps the owner the admin chose');
  -- Other sources with no owner stay unowned.
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Phone lead', 'source', 'phone', 'brand_id', pg_temp.brand('yazz'),
    'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) is null, 'a phone lead with no owner stays unowned');
  -- An existing lead changed later is not touched (insert only).
  update public.crm_leads set source = 'website_contact_form' where id = lead;
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) is null, 'updating a lead never assigns the website manager');
  perform pg_temp.owner();
end $$;

do $$
declare lead uuid;
begin
  -- Leads people create in the portal with a website form source and owner Nobody stay unowned: only genuine intake
  -- is assigned, so the owner rules for people stand.
  perform pg_temp.login('rep_yazz');
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Rep website lead', 'source', 'website_contact_form', 'brand_id', pg_temp.brand('yazz'),
    'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) is null, 'a rep''s unowned website form lead stays unowned');
  perform pg_temp.login('care');
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Care website lead', 'source', 'website_partner_form', 'brand_id', pg_temp.brand('hooch'),
    'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) is null, 'customer care''s unowned website form lead stays unowned');
  perform pg_temp.login('admin');
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Admin website lead', 'source', 'website_newsletter', 'brand_id', pg_temp.brand('yazz'),
    'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) is null, 'an admin''s unowned website form lead stays unowned');
  -- Live chat goes by its source (the lead is always made by a person, from the chat).
  lead := public.save_crm_lead(null, jsonb_build_object('title', 'Admin chat lead', 'source', 'website_live_chat', 'brand_id', pg_temp.brand('yazz'),
    'contact_id', (select id from public.crm_contacts limit 1)));
  perform pg_temp.ok((select owner_id from public.crm_leads where id = lead) = pg_temp.u('rep_yazz'), 'an unowned live chat lead gets the manager');

  -- The lookup answers only CRM staff (and website intake).
  perform pg_temp.ok(public.crm_website_lead_manager_for(pg_temp.brand('yazz')) = pg_temp.u('rep_yazz'), 'CRM staff get the manager');
  perform pg_temp.login('hr');
  perform pg_temp.ok(public.crm_website_lead_manager_for(pg_temp.brand('yazz')) is null, 'people without a CRM role get nothing');
  perform pg_temp.login('anon');
  perform pg_temp.ok(pg_temp.fails(format('select public.crm_website_lead_manager_for(%L)', pg_temp.brand('yazz')), '42501'), 'anon cannot run the lookup');
  perform pg_temp.owner();
  raise notice 'PASS: website intake and live chat leads get the manager; staff leads keep their owner or stay unowned; other sources and updates untouched';
end $$;

-- Deleting people and brands ------------------------------------------------------------------------------------
do $$
declare n integer;
begin
  n := (select count(*) from public.crm_website_lead_manager_changes);
  -- The Yazz manager's account is deleted: the setting stays, empty; Yazz falls back to the default.
  delete from auth.users where id = pg_temp.u('rep_yazz');
  perform pg_temp.ok((select manager_id is null from public.crm_website_lead_managers where brand_id = pg_temp.brand('yazz')), 'the setting is kept, empty');
  perform pg_temp.ok((select owner_id is null and created_by is null and updated_by is null from public.crm_leads where title = 'Rep website lead'),
    'the leads they created stay, without them (set_crm_authors keeps only existing authors)');
  perform pg_temp.ok((select count(*) from public.crm_leads where source = 'website_contact_form' and intake_reference is not null and owner_id is null) = 3,
    'their Yazz enquiry becomes unowned (with the two that had no manager)');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) = n + 1, 'the deletion writes a history row');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where reason = 'manager_deleted' and brand_id = pg_temp.brand('yazz')
    and old_manager_id is null and old_manager_name = 'Yaw Yazz Rep' and new_manager_id is null), 'the history keeps the deleted manager''s name');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_manager_changes where old_manager_id = pg_temp.u('rep_yazz') or new_manager_id = pg_temp.u('rep_yazz')),
    'older history rows lose the link but keep the name');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where new_manager_name = 'Yaw Yazz Rep' and new_manager_id is null),
    'older history rows keep the name');
  perform pg_temp.ok(pg_temp.enquiry('yazz', 'b1@visitor.test') = pg_temp.u('mgmt'), 'after deletion, Yazz leads go to the default');

  -- The admin who made the changes is deleted: settings and history keep working.
  delete from auth.users where id = pg_temp.u('admin');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers where updated_by is not null), 'updated_by is cleared');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where changed_by is null and changed_by_name = 'Web Admin'),
    'the history keeps the admin''s name');

  -- The default manager is deleted, by an admin signed in.
  perform pg_temp.login('admin2');
  perform pg_temp.save('mgmt', '{"yazz":null}');
  perform pg_temp.owner();
  delete from auth.users where id = pg_temp.u('mgmt');
  perform pg_temp.ok(pg_temp.enquiry('linzzy', 'b2@visitor.test') is null, 'with the default manager deleted, leads are unowned');
  perform pg_temp.ok(exists (select 1 from public.crm_website_lead_manager_changes where reason = 'manager_deleted' and scope = 'default'
    and old_manager_name = 'Mary Manager'), 'the default manager deletion is logged');

  -- A brand is deleted (a fresh one, since leads hold on to the real brands).
  insert into public.brands (slug, name) values ('wltest', 'WL Test Brand');
  insert into public.profile_brands (profile_id, brand_id) values (pg_temp.u('rep_hooch'), pg_temp.brand('wltest'));
  perform pg_temp.login('admin2');
  perform pg_temp.save('admin2', '{"wltest":"rep_hooch"}');
  perform pg_temp.save('admin2', '{"wltest":"admin2"}');
  perform pg_temp.owner();
  n := (select count(*) from public.crm_website_lead_manager_changes);
  delete from public.brands where slug = 'wltest';
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes) = n + 1, 'deleting the brand writes one history row');
  perform pg_temp.ok(not exists (select 1 from public.crm_website_lead_managers where brand_id is not null and brand_id not in (select id from public.brands)),
    'the brand''s setting goes with it');
  perform pg_temp.ok((select reason = 'brand_deleted' and brand_name = 'WL Test Brand' and brand_id is not null and old_manager_name = 'Second Admin'
      and new_manager_id is null from public.crm_website_lead_manager_changes order by created_at desc, id desc limit 1),
    'the brand deletion is logged as brand_deleted with the brand''s name');
  perform pg_temp.ok((select count(*) from public.crm_website_lead_manager_changes where brand_name = 'WL Test Brand' and brand_id is not null) = 3,
    'older rows of that brand keep its id and name');
  raise notice 'PASS: deleting a manager, an admin or a brand never fails; history keeps names';
end $$;

-- Functions closed to website visitors; internal functions closed to everyone.
do $$
declare f text;
begin
  foreach f in array array['save_crm_website_lead_managers(uuid,jsonb)', 'crm_website_lead_manager_put(uuid,uuid)', 'crm_website_lead_manager_for(uuid)'] loop
    perform pg_temp.ok(not has_function_privilege('anon', 'public.' || f, 'execute'), 'anon cannot run ' || f);
  end loop;
  foreach f in array array['crm_website_lead_manager_ok(uuid,uuid)', 'crm_profile_label(uuid)',
                           'check_crm_website_lead_manager()', 'log_crm_website_lead_manager()', 'set_crm_website_lead_owner()'] loop
    perform pg_temp.ok(not has_function_privilege('anon', 'public.' || f, 'execute') and not has_function_privilege('authenticated', 'public.' || f, 'execute'),
      f || ' is internal');
  end loop;
  perform pg_temp.ok(not has_table_privilege('anon', 'public.crm_website_lead_managers', 'select')
    and not has_table_privilege('anon', 'public.crm_website_lead_manager_changes', 'select'), 'anon has no table rights');
  perform pg_temp.ok(not has_table_privilege('authenticated', 'public.crm_website_lead_manager_changes', 'insert')
    and not has_table_privilege('authenticated', 'public.crm_website_lead_manager_changes', 'update')
    and not has_table_privilege('authenticated', 'public.crm_website_lead_manager_changes', 'delete'), 'nobody writes the history');
  perform pg_temp.ok(not has_column_privilege('authenticated', 'public.crm_website_lead_managers', 'updated_by', 'update')
    and not has_column_privilege('authenticated', 'public.crm_website_lead_managers', 'brand_id', 'update'), 'only manager_id can be updated');
  raise notice 'PASS: functions and tables closed as they should be';
end $$;

rollback;
