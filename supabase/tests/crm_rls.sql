-- CRM: Row Level Security, privileges, triggers, save functions and the website intake function.
-- Run with: bash supabase/tests/local/run.sh crm_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- The migration seeds nothing --------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.crm_organisations) or exists (select 1 from public.crm_contacts)
     or exists (select 1 from public.crm_leads) or exists (select 1 from public.crm_activities) then
    raise exception 'FAIL: the CRM migration must not seed any records';
  end if;
  raise notice 'PASS: no CRM records seeded';
end $$;

-- Fixtures (as the database owner) ---------------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000006a1', 'crm.admin@test.local',     '{"role":"admin"}'),
  ('00000000-0000-0000-0000-0000000006a2', 'crm.mgmt@test.local',      '{"role":"management"}'),
  ('00000000-0000-0000-0000-0000000006a3', 'crm.rep.yazz@test.local',  '{"role":"sales_rep"}'),
  ('00000000-0000-0000-0000-0000000006a4', 'crm.mkt.hooch@test.local', '{"role":"marketing"}'),
  ('00000000-0000-0000-0000-0000000006a5', 'crm.care@test.local',      '{"role":"customer_care"}'),
  ('00000000-0000-0000-0000-0000000006a6', 'crm.dist@test.local',      '{"role":"distributor"}'),
  ('00000000-0000-0000-0000-0000000006a7', 'crm.norole@test.local',    '{}'),
  ('00000000-0000-0000-0000-0000000006a8', 'crm.hr@test.local',        '{"role":"hr"}'),
  ('00000000-0000-0000-0000-0000000006a9', 'crm.rep.hooch@test.local', '{"role":"sales_rep"}'),
  ('00000000-0000-0000-0000-0000000006b0', 'crm.rep.yl@test.local',    '{"role":"sales_rep"}');

insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000006a3', id from public.brands where slug = 'yazz';
insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000006a4', id from public.brands where slug = 'hooch';
insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000006a9', id from public.brands where slug = 'hooch';
insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000006b0', id from public.brands where slug in ('yazz', 'linzzy');

create temp table ids as select
  (select id from public.brands where slug = 'yazz') as yazz,
  (select id from public.brands where slug = 'hooch') as hooch,
  (select id from public.brands where slug = 'linzzy') as linzzy,
  (select id from public.brands where slug = 'lexta') as lexta,
  (select id from public.regions where slug = 'greater-accra') as accra,
  (select id from public.regions where slug = 'ashanti') as ashanti;
grant select on ids to anon, authenticated;

-- o1 Yazz, o2 Hooch, o3 unbranded and unowned, o4 Hooch owned by the Yazz rep, o5 Linzzy.
insert into public.crm_organisations (id, name, kind, region_id, town, notes, owner_id) values
  ('00000000-0000-0000-0000-000000000601', 'Test Yazz org',      'retailer',    (select accra from ids), 'Accra', 'Staff note on Yazz org', null),
  ('00000000-0000-0000-0000-000000000602', 'Test Hooch org',     'distributor', (select accra from ids), null,    null, null),
  ('00000000-0000-0000-0000-000000000604', 'Test owned Hooch',   'pharmacy',    null, null, null, '00000000-0000-0000-0000-0000000006a3'),
  ('00000000-0000-0000-0000-000000000605', 'Test Linzzy org',    'supermarket_chain', null, null, null, null);
-- o3: unbranded, unowned, added by management. o6: unbranded, no owner and no creator (as the website makes them).
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a2', true);
insert into public.crm_organisations (id, name, kind) values ('00000000-0000-0000-0000-000000000603', 'Test unbranded org', 'institution');
select set_config('request.jwt.claim.sub', '', true);
insert into public.crm_organisations (id, name, kind) values ('00000000-0000-0000-0000-000000000606', 'Test website org', 'other');
insert into public.crm_organisation_brands (organisation_id, brand_id) values
  ('00000000-0000-0000-0000-000000000601', (select yazz from ids)),
  ('00000000-0000-0000-0000-000000000602', (select hooch from ids)),
  ('00000000-0000-0000-0000-000000000604', (select hooch from ids)),
  ('00000000-0000-0000-0000-000000000605', (select linzzy from ids));

insert into public.crm_contacts (id, full_name, organisation_id, job_title, phone, email, notes) values
  ('00000000-0000-0000-0000-000000000611', 'Test Ama Staff Typed', '00000000-0000-0000-0000-000000000601', 'Buyer', '+233 20 111 2222', 'ama@test.local', 'Staff typed note'),
  ('00000000-0000-0000-0000-000000000612', 'Test Kofi', null, null, '024 555 6666', null, null),
  ('00000000-0000-0000-0000-000000000613', 'Test Hooch buyer', '00000000-0000-0000-0000-000000000602', null, null, 'hooch.buyer@test.local', null);

-- l1 Yazz unowned, l2 Hooch unowned, l3 unbranded unowned, l4 Hooch owned by the Yazz rep, l5 Linzzy owned by the
-- Hooch rep, l6 corporate Lexta unowned, l7 unbranded unowned (takeover tests).
insert into public.crm_leads (id, title, contact_id, organisation_id, brand_id, source, owner_id, next_action_date) values
  ('00000000-0000-0000-0000-000000000621', 'Test Yazz lead',      '00000000-0000-0000-0000-000000000611', null, (select yazz from ids),   'phone',     null, current_date + 3),
  ('00000000-0000-0000-0000-000000000622', 'Test Hooch lead',     null, '00000000-0000-0000-0000-000000000602', (select hooch from ids), 'event', null, current_date + 1),
  ('00000000-0000-0000-0000-000000000623', 'Test unbranded lead', '00000000-0000-0000-0000-000000000612', null, null,                    'walk_in',   null, null),
  ('00000000-0000-0000-0000-000000000624', 'Test owned Hooch',    null, '00000000-0000-0000-0000-000000000604', (select hooch from ids), 'referral',  '00000000-0000-0000-0000-0000000006a3', null),
  ('00000000-0000-0000-0000-000000000625', 'Test Linzzy owned',   '00000000-0000-0000-0000-000000000612', null, (select linzzy from ids), 'email',    '00000000-0000-0000-0000-0000000006a9', null),
  ('00000000-0000-0000-0000-000000000626', 'Test corporate lead', '00000000-0000-0000-0000-000000000611', null, (select lexta from ids),  'other',     null, null),
  ('00000000-0000-0000-0000-000000000627', 'Test takeover lead',  '00000000-0000-0000-0000-000000000612', null, null,                    'field_visit', null, null);

insert into public.crm_activities (id, lead_id, organisation_id, type, body) values
  ('00000000-0000-0000-0000-000000000631', '00000000-0000-0000-0000-000000000622', null, 'note', 'Hooch lead note'),
  ('00000000-0000-0000-0000-000000000632', null, '00000000-0000-0000-0000-000000000602', 'call', 'Hooch org call');

create temp table outsiders (id uuid, label text);
insert into outsiders values
  ('00000000-0000-0000-0000-0000000006a6', 'distributor'),
  ('00000000-0000-0000-0000-0000000006a8', 'hr'),
  ('00000000-0000-0000-0000-0000000006a7', 'no role');
grant select on outsiders to authenticated;

-- Website visitors (anon) --------------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare t text;
begin
  foreach t in array array['crm_organisations', 'crm_organisation_brands', 'crm_contacts', 'crm_leads', 'crm_activities', 'crm_intake_log'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon read %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  begin
    insert into public.crm_contacts (full_name) values ('Anon');
    raise exception 'FAIL: anon inserted a contact';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_leads (title, contact_id, source) values ('Anon', '00000000-0000-0000-0000-000000000611', 'other');
    raise exception 'FAIL: anon inserted a lead';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_leads set title = 'Hacked';
    raise exception 'FAIL: anon updated leads';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_lead(null, '{"title":"x","source":"other"}'::jsonb);
    raise exception 'FAIL: anon called save_crm_lead';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_contact(null, '{"full_name":"x"}'::jsonb);
    raise exception 'FAIL: anon called save_crm_contact';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_organisation(null, '{"name":"x"}'::jsonb, null);
    raise exception 'FAIL: anon called save_crm_organisation';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000621', null);
    raise exception 'FAIL: anon called set_crm_owner';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.crm_staff();
    raise exception 'FAIL: anon called crm_staff';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.crm_can_see_org('00000000-0000-0000-0000-000000000601');
    raise exception 'FAIL: anon called a CRM helper';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.crm_intake_text('{}'::jsonb, 'x', 1);
    raise exception 'FAIL: anon called crm_intake_text';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon cannot read or write any CRM table nor call CRM functions other than the intake';
end $$;
reset role;

-- Distributor, HR and no role: see nothing, write nothing -------------------------------------
do $$
declare who record; n int; t text;
begin
  for who in select id, label from outsiders loop
    perform set_config('request.jwt.claim.sub', who.id::text, true);
    set local role authenticated;
    foreach t in array array['crm_organisations', 'crm_organisation_brands', 'crm_contacts', 'crm_leads', 'crm_activities', 'crm_intake_log'] loop
      execute format('select count(*) from public.%I', t) into n;
      if n <> 0 then raise exception 'FAIL: % sees % rows of %', who.label, n, t; end if;
    end loop;
    if exists (select 1 from public.crm_staff()) then raise exception 'FAIL: % got the CRM staff list', who.label; end if;
    if public.crm_is_staff('00000000-0000-0000-0000-0000000006a3') then raise exception 'FAIL: % can probe who is CRM staff', who.label; end if;
    begin
      perform public.save_crm_contact(null, '{"full_name":"Outsider contact"}'::jsonb);
      raise exception 'FAIL: % created a contact', who.label;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.save_crm_lead(null, jsonb_build_object('title', 'Outsider lead', 'source', 'other', 'contact_id', '00000000-0000-0000-0000-000000000611'));
      raise exception 'FAIL: % created a lead', who.label;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.save_crm_organisation(null, '{"name":"Outsider org"}'::jsonb, null);
      raise exception 'FAIL: % created an organisation', who.label;
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.crm_activities (contact_id, type, body) values ('00000000-0000-0000-0000-000000000611', 'note', 'x');
      raise exception 'FAIL: % added an activity', who.label;
    exception when insufficient_privilege then null;
    end;
    update public.crm_leads set title = 'Hacked';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: % updated leads', who.label; end if;
    begin
      perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'won', null);
      raise exception 'FAIL: % changed a stage', who.label;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000623', who.id);
      raise exception 'FAIL: % took a lead', who.label;
    exception when insufficient_privilege then null;
    end;
    reset role;
  end loop;
  raise notice 'PASS: distributor, HR and no role see no CRM rows and cannot write';
end $$;

-- Admin ---------------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a1';
do $$
declare n int;
begin
  if (select count(*) from public.crm_leads where title like 'Test %') <> 7 then raise exception 'FAIL: admin should see all 7 test leads'; end if;
  if (select count(*) from public.crm_organisations where name like 'Test %') <> 6 then raise exception 'FAIL: admin should see all 6 test organisations'; end if;
  if (select count(*) from public.crm_activities) < 2 then raise exception 'FAIL: admin should see every activity'; end if;
  if (select count(*) from public.crm_staff() s where s.role = 'sales_rep') < 2 then raise exception 'FAIL: admin cannot list CRM staff'; end if;
  if exists (select 1 from public.crm_staff() s where s.role in ('distributor', 'hr') or s.role is null) then
    raise exception 'FAIL: crm_staff lists people without a CRM role';
  end if;
  raise notice 'PASS: admin reads every CRM record and the staff list';
end $$;
reset role;

-- Management: read all, edit, reassign, never delete -------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a2';
do $$
declare n int; new_id uuid;
begin
  if (select count(*) from public.crm_leads where title like 'Test %') <> 7 then raise exception 'FAIL: management should see all 7 test leads'; end if;
  if (select count(*) from public.crm_organisations where name like 'Test %') <> 6 then raise exception 'FAIL: management should see all 6 test organisations'; end if;

  perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-0000000006a4');
  if (select owner_id from public.crm_leads where id = '00000000-0000-0000-0000-000000000622') <> '00000000-0000-0000-0000-0000000006a4' then
    raise exception 'FAIL: management could not reassign a lead';
  end if;
  perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000622', null);
  perform public.set_crm_owner('organisation', '00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-0000000006a9');
  perform public.set_crm_owner('organisation', '00000000-0000-0000-0000-000000000605', null);
  perform public.set_crm_owner('contact', '00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-0000000006a3');
  perform public.set_crm_owner('contact', '00000000-0000-0000-0000-000000000612', null);

  -- Owners must be active people with a CRM role.
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-0000000006a6');
    raise exception 'FAIL: a distributor was made owner of a lead';
  exception when check_violation then null;
  end;
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-0000000006a8');
    raise exception 'FAIL: an HR person was made owner of a lead';
  exception when check_violation then null;
  end;

  new_id := public.save_crm_lead(null, jsonb_build_object('title', 'Mgmt lead', 'source', 'event', 'organisation_id', '00000000-0000-0000-0000-000000000605',
                                                           'brand_id', (select linzzy from ids), 'owner_id', '00000000-0000-0000-0000-0000000006a9'));
  if (select owner_id from public.crm_leads where id = new_id) <> '00000000-0000-0000-0000-0000000006a9' then
    raise exception 'FAIL: management could not create a lead for someone else';
  end if;

  delete from public.crm_leads where id = '00000000-0000-0000-0000-000000000621';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management deleted a lead'; end if;
  begin
    perform public.delete_crm_record('contact', '00000000-0000-0000-0000-000000000612');
    raise exception 'FAIL: management deleted a contact';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_crm_record('organisation', '00000000-0000-0000-0000-000000000603');
    raise exception 'FAIL: management deleted an organisation';
  exception when insufficient_privilege then null;
  end;
  delete from public.crm_activities;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management deleted activities'; end if;
  raise notice 'PASS: management reads all, creates, reassigns (CRM staff only) and cannot delete';
end $$;
reset role;

-- Sales rep with Yazz access --------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a3';
do $$
declare n int;
begin
  -- Leads: Yazz, unbranded and owned. Not Hooch, Linzzy or corporate ones owned by others or nobody.
  if not exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000621') then raise exception 'FAIL: Yazz rep cannot see a Yazz lead'; end if;
  if not exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000623') then raise exception 'FAIL: Yazz rep cannot see an unbranded lead'; end if;
  if not exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000624') then raise exception 'FAIL: Yazz rep cannot see a Hooch lead they own'; end if;
  if exists (select 1 from public.crm_leads where id in ('00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-000000000625', '00000000-0000-0000-0000-000000000626')) then
    raise exception 'FAIL: Yazz rep sees a Hooch, Linzzy or corporate lead they do not own';
  end if;
  -- Organisations: Yazz, unbranded, owned. Not Hooch or Linzzy.
  if (select count(*) from public.crm_organisations where id in ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000604')) <> 3 then
    raise exception 'FAIL: Yazz rep cannot see the Yazz, unbranded and owned organisations';
  end if;
  if exists (select 1 from public.crm_organisations where id in ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000605')) then
    raise exception 'FAIL: Yazz rep sees a Hooch or Linzzy organisation';
  end if;
  if exists (select 1 from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000602') then
    raise exception 'FAIL: Yazz rep sees brands of a hidden organisation';
  end if;
  -- Contacts carry no brand: every CRM role reads them.
  if (select count(*) from public.crm_contacts where full_name like 'Test %') <> 3 then raise exception 'FAIL: Yazz rep cannot read contacts'; end if;
  -- Activities of hidden records stay hidden.
  if exists (select 1 from public.crm_activities where id in ('00000000-0000-0000-0000-000000000631', '00000000-0000-0000-0000-000000000632')) then
    raise exception 'FAIL: Yazz rep sees activities of Hooch records';
  end if;
  -- Staff names for owners are available.
  if not exists (select 1 from public.crm_staff() s where s.id = '00000000-0000-0000-0000-0000000006a9') then
    raise exception 'FAIL: Yazz rep cannot see CRM staff names';
  end if;
  raise notice 'PASS: Yazz rep sees Yazz, unbranded and owned leads and organisations, every contact, nothing else';
end $$;

do $$
declare n int; act record;
begin
  -- Works a visible lead without owning it: stage and next action.
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'contacted', null);
  select * into act from public.crm_activities where lead_id = '00000000-0000-0000-0000-000000000621' and type = 'status_change';
  if act.body <> 'Stage changed from New to Contacted' then raise exception 'FAIL: stage change activity body is %', act.body; end if;
  if act.created_by <> '00000000-0000-0000-0000-0000000006a3' then raise exception 'FAIL: stage change activity not attributed to the session'; end if;
  perform public.save_crm_lead('00000000-0000-0000-0000-000000000621', jsonb_build_object(
    'title', 'Test Yazz lead', 'source', 'phone', 'contact_id', '00000000-0000-0000-0000-000000000611',
    'brand_id', (select yazz from ids), 'next_action', 'Call back about samples', 'next_action_date', (current_date + 2)::text));
  if (select next_action from public.crm_leads where id = '00000000-0000-0000-0000-000000000621') <> 'Call back about samples' then
    raise exception 'FAIL: next action not saved';
  end if;

  -- Hidden lead: no update, no stage change, no notes.
  update public.crm_leads set title = 'Hacked' where id = '00000000-0000-0000-0000-000000000622';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Yazz rep updated a Hooch lead'; end if;
  begin
    perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000622', 'won', null);
    raise exception 'FAIL: Yazz rep moved a Hooch lead';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_activities (lead_id, type, body) values ('00000000-0000-0000-0000-000000000622', 'note', 'Sneaky');
    raise exception 'FAIL: Yazz rep added a note to a Hooch lead';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_activities (organisation_id, type, body) values ('00000000-0000-0000-0000-000000000602', 'note', 'Sneaky');
    raise exception 'FAIL: Yazz rep added a note to a Hooch organisation';
  exception when insufficient_privilege then null;
  end;

  -- Assign to me: allowed on an unowned lead they can see.
  perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000623', '00000000-0000-0000-0000-0000000006a3');
  if (select owner_id from public.crm_leads where id = '00000000-0000-0000-0000-000000000623') <> '00000000-0000-0000-0000-0000000006a3' then
    raise exception 'FAIL: Yazz rep could not take an unowned lead';
  end if;
  -- ...but never reassign or let go.
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000623', '00000000-0000-0000-0000-0000000006a9');
    raise exception 'FAIL: Yazz rep reassigned a lead to someone else';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000623', null);
    raise exception 'FAIL: Yazz rep unassigned a lead';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-0000000006a3');
    raise exception 'FAIL: Yazz rep took a Hooch lead they cannot see';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_owner('organisation', '00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-0000000006a3');
    raise exception 'FAIL: Yazz rep took an organisation';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_owner('contact', '00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-0000000006a3');
    raise exception 'FAIL: Yazz rep took a contact';
  exception when insufficient_privilege then null;
  end;

  -- No takeover: an unowned unbranded lead cannot be branded (hidden from other teams) without taking it first.
  begin
    update public.crm_leads set brand_id = (select yazz from ids) where id = '00000000-0000-0000-0000-000000000627';
    raise exception 'FAIL: Yazz rep branded an unowned lead';
  exception when insufficient_privilege then null;
  end;
  -- Own lead: brand only to a brand they work on.
  begin
    update public.crm_leads set brand_id = (select hooch from ids) where id = '00000000-0000-0000-0000-000000000623';
    raise exception 'FAIL: Yazz rep gave their lead the Hooch brand';
  exception when insufficient_privilege then null;
  end;
  update public.crm_leads set brand_id = (select yazz from ids) where id = '00000000-0000-0000-0000-000000000623';
  update public.crm_leads set brand_id = null where id = '00000000-0000-0000-0000-000000000623';

  -- Cannot point a lead or contact at an organisation they cannot see (that would reveal it).
  begin
    update public.crm_leads set organisation_id = '00000000-0000-0000-0000-000000000602' where id = '00000000-0000-0000-0000-000000000623';
    raise exception 'FAIL: Yazz rep linked a lead to a hidden organisation';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_contacts set organisation_id = '00000000-0000-0000-0000-000000000605' where id = '00000000-0000-0000-0000-000000000612';
    raise exception 'FAIL: Yazz rep linked a contact to a hidden organisation';
  exception when insufficient_privilege then null;
  end;

  -- Deleting is admin only.
  delete from public.crm_leads where id = '00000000-0000-0000-0000-000000000623';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Yazz rep deleted a lead'; end if;
  begin
    perform public.delete_crm_record('lead', '00000000-0000-0000-0000-000000000623');
    raise exception 'FAIL: delete_crm_record let a rep delete';
  exception when insufficient_privilege then null;
  end;
  delete from public.crm_contacts where id = '00000000-0000-0000-0000-000000000612';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Yazz rep deleted a contact'; end if;
  raise notice 'PASS: Yazz rep works visible leads, takes unowned ones, cannot reassign, brand-hide, link hidden records or delete';
end $$;

do $$
declare n int; new_lead uuid; new_org uuid; new_contact uuid; before_count int;
begin
  -- Creating leads: own brands or none, owner empty or themselves.
  new_lead := public.save_crm_lead(null, jsonb_build_object('title', 'Rep lead', 'source', 'field_visit',
                                   'organisation_id', '00000000-0000-0000-0000-000000000601', 'brand_id', (select yazz from ids),
                                   'owner_id', '00000000-0000-0000-0000-0000000006a3', 'estimated_monthly_volume', 'About 40 cartons'));
  if (select stage from public.crm_leads where id = new_lead) <> 'new' then raise exception 'FAIL: a new lead does not start at New'; end if;
  begin
    perform public.save_crm_lead(null, jsonb_build_object('title', 'Rep Hooch lead', 'source', 'phone',
                                 'contact_id', '00000000-0000-0000-0000-000000000611', 'brand_id', (select hooch from ids)));
    raise exception 'FAIL: Yazz rep created a Hooch lead';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_lead(null, jsonb_build_object('title', 'Rep lead for someone', 'source', 'phone',
                                 'contact_id', '00000000-0000-0000-0000-000000000611', 'owner_id', '00000000-0000-0000-0000-0000000006a9'));
    raise exception 'FAIL: Yazz rep created a lead owned by someone else';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_lead(null, jsonb_build_object('title', 'Rep lead hidden org', 'source', 'phone',
                                 'organisation_id', '00000000-0000-0000-0000-000000000602'));
    raise exception 'FAIL: Yazz rep created a lead on a hidden organisation';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_lead(null, jsonb_build_object('title', 'Rep lead with nobody', 'source', 'phone'));
    raise exception 'FAIL: a lead without contact or organisation was saved';
  exception when check_violation then null;
  end;

  -- Organisations: create with their brand; the creator may brand an unowned organisation they added.
  new_org := public.save_crm_organisation(null, jsonb_build_object('name', 'Rep new org', 'kind', 'retailer', 'town', 'Madina',
                                          'owner_id', '00000000-0000-0000-0000-0000000006a3'), array[(select yazz from ids)]);
  if (select count(*) from public.crm_organisation_brands where organisation_id = new_org) <> 1 then raise exception 'FAIL: organisation brands not saved'; end if;
  new_org := public.save_crm_organisation(null, jsonb_build_object('name', 'Rep unowned org'), null);
  perform public.save_crm_organisation(new_org, null, array[(select yazz from ids)]);
  begin
    perform public.save_crm_organisation(null, jsonb_build_object('name', 'Rep corporate org'), array[(select lexta from ids)]);
    raise exception 'FAIL: an organisation was linked to the corporate brand';
  exception when insufficient_privilege or check_violation then null;
  end;

  -- No takeover of an unbranded organisation somebody else added: adding a brand would hide it from other teams.
  begin
    insert into public.crm_organisation_brands (organisation_id, brand_id) values ('00000000-0000-0000-0000-000000000603', (select yazz from ids));
    raise exception 'FAIL: Yazz rep branded an unowned organisation added by someone else';
  exception when insufficient_privilege then null;
  end;
  -- Owned Hooch organisation: may add Yazz (only adds visibility), may not remove Hooch.
  insert into public.crm_organisation_brands (organisation_id, brand_id) values ('00000000-0000-0000-0000-000000000604', (select yazz from ids));
  delete from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000604' and brand_id = (select hooch from ids);
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Yazz rep removed Hooch from an organisation'; end if;
  select count(*) into before_count from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000604';
  begin
    perform public.save_crm_organisation('00000000-0000-0000-0000-000000000604', null, array[(select yazz from ids)]);
    raise exception 'FAIL: save_crm_organisation removed a brand the rep does not work on';
  exception when insufficient_privilege then null;
  end;
  -- Hidden organisation: no edits, and a refused save changes nothing.
  update public.crm_organisations set notes = 'Hacked' where id = '00000000-0000-0000-0000-000000000602';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Yazz rep edited a Hooch organisation'; end if;
  begin
    perform public.save_crm_organisation('00000000-0000-0000-0000-000000000605', jsonb_build_object('name', 'Hacked'), null);
    raise exception 'FAIL: save_crm_organisation changed a hidden organisation';
  exception when insufficient_privilege then null;
  end;
  -- Contact linked to an organisation the rep cannot see: the link is kept ('keep'), cannot be dropped, may be
  -- replaced by one they can see.
  perform public.save_crm_contact('00000000-0000-0000-0000-000000000613', jsonb_build_object('full_name', 'Test Hooch buyer',
                                  'email', 'hooch.buyer@test.local', 'job_title', 'Buyer', 'organisation_id', 'keep'));
  if (select organisation_id from public.crm_contacts where id = '00000000-0000-0000-0000-000000000613') is distinct from '00000000-0000-0000-0000-000000000602'
     or (select job_title from public.crm_contacts where id = '00000000-0000-0000-0000-000000000613') <> 'Buyer' then
    raise exception 'FAIL: keep marker lost the hidden organisation link or did not save the edit';
  end if;
  begin
    perform public.save_crm_contact('00000000-0000-0000-0000-000000000613', jsonb_build_object('full_name', 'Test Hooch buyer', 'organisation_id', ''));
    raise exception 'FAIL: Yazz rep dropped a link to an organisation they cannot see';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_contacts set organisation_id = null where id = '00000000-0000-0000-0000-000000000613';
    raise exception 'FAIL: Yazz rep dropped a hidden organisation link with a plain update';
  exception when insufficient_privilege then null;
  end;
  -- Leads: 'keep' leaves contact and organisation links alone.
  perform public.save_crm_lead('00000000-0000-0000-0000-000000000624', jsonb_build_object('title', 'Test owned Hooch', 'source', 'referral',
                               'contact_id', 'keep', 'organisation_id', 'keep', 'brand_id', (select hooch from ids)));
  if (select organisation_id from public.crm_leads where id = '00000000-0000-0000-0000-000000000624') is distinct from '00000000-0000-0000-0000-000000000604' then
    raise exception 'FAIL: keep marker changed a lead organisation link';
  end if;
  -- Unbranded organisation someone else added: details are editable (unbranded records are shared work)...
  update public.crm_organisations set town = 'Tamale' where id = '00000000-0000-0000-0000-000000000603';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: Yazz rep could not edit the details of an unbranded organisation'; end if;
  perform public.save_crm_organisation('00000000-0000-0000-0000-000000000603', jsonb_build_object('name', 'Test unbranded org', 'kind', 'institution', 'town', 'Tamale'), '{}');
  -- ...but it cannot be branded by them (that would hide it from the other teams); the test below checks the insert.
  begin
    perform public.save_crm_organisation('00000000-0000-0000-0000-000000000603', null, array[(select yazz from ids)]);
    raise exception 'FAIL: Yazz rep branded an unbranded organisation management added (through save)';
  exception when insufficient_privilege then null;
  end;
  -- An unbranded organisation the website made (no owner, no creator): any rep may add one of their own brands.
  begin
    insert into public.crm_organisation_brands (organisation_id, brand_id) values ('00000000-0000-0000-0000-000000000606', (select linzzy from ids));
    raise exception 'FAIL: Yazz rep added a brand they do not work on to a website organisation';
  exception when insufficient_privilege then null;
  end;
  perform public.save_crm_organisation('00000000-0000-0000-0000-000000000606', null, array[(select yazz from ids)]);
  if not exists (select 1 from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000606' and brand_id = (select yazz from ids)) then
    raise exception 'FAIL: Yazz rep could not add Yazz to a website organisation';
  end if;
  -- Visible organisation details can be edited.
  perform public.save_crm_organisation('00000000-0000-0000-0000-000000000601', jsonb_build_object('name', 'Test Yazz org', 'kind', 'retailer',
                                       'region_id', (select accra from ids), 'town', 'Accra', 'notes', 'Staff note on Yazz org', 'phone', '+233 30 222 3333'), null);

  -- Contacts: create, edit; owner only self on create.
  new_contact := public.save_crm_contact(null, jsonb_build_object('full_name', 'Rep contact', 'phone', '055 123 4567',
                                         'organisation_id', '00000000-0000-0000-0000-000000000601', 'consent_marketing', true, 'consent_source', 'Said yes on a visit'));
  if (select consent_at from public.crm_contacts where id = new_contact) is null then raise exception 'FAIL: consent time not recorded'; end if;
  begin
    perform public.save_crm_contact(null, jsonb_build_object('full_name', 'Rep contact 2', 'owner_id', '00000000-0000-0000-0000-0000000006a9'));
    raise exception 'FAIL: Yazz rep created a contact owned by someone else';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_contact(null, jsonb_build_object('full_name', 'Consent without source', 'consent_marketing', true));
    raise exception 'FAIL: consent saved without its source';
  exception when check_violation then null;
  end;
  begin
    perform public.save_crm_contact(null, jsonb_build_object('job_title', 'Nobody'));
    raise exception 'FAIL: a contact without name, phone or email was saved';
  exception when check_violation then null;
  end;
  raise notice 'PASS: Yazz rep creates leads, organisations and contacts within the rules';
end $$;

-- created_by, updated_by, closed_at and consent_at cannot be spoofed --------------------------------
do $$
declare new_id uuid;
begin
  begin
    insert into public.crm_contacts (full_name, created_by) values ('Spoof', '00000000-0000-0000-0000-0000000006a1');
    raise exception 'FAIL: created_by accepted from the browser';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_leads set updated_by = '00000000-0000-0000-0000-0000000006a1' where id = '00000000-0000-0000-0000-000000000621';
    raise exception 'FAIL: updated_by accepted from the browser';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_leads set closed_at = now() where id = '00000000-0000-0000-0000-000000000621';
    raise exception 'FAIL: closed_at accepted from the browser';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_contacts set consent_at = now() - interval '1 year' where id = '00000000-0000-0000-0000-000000000611';
    raise exception 'FAIL: consent_at accepted from the browser';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_activities (lead_id, type, body, created_by)
    values ('00000000-0000-0000-0000-000000000621', 'note', 'Spoof', '00000000-0000-0000-0000-0000000006a1');
    raise exception 'FAIL: activity created_by accepted from the browser';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.crm_activities set body = 'Rewritten';
    raise exception 'FAIL: an activity was edited';
  exception when insufficient_privilege then null;
  end;
  -- Through the save functions extra keys are ignored and the session decides.
  new_id := public.save_crm_contact(null, jsonb_build_object('full_name', 'Spoof via save', 'created_by', '00000000-0000-0000-0000-0000000006a1',
                                    'updated_by', '00000000-0000-0000-0000-0000000006a1'));
  if (select created_by from public.crm_contacts where id = new_id) <> '00000000-0000-0000-0000-0000000006a3'
     or (select updated_by from public.crm_contacts where id = new_id) <> '00000000-0000-0000-0000-0000000006a3' then
    raise exception 'FAIL: created_by or updated_by not taken from the session';
  end if;
  insert into public.crm_activities (lead_id, type, body) values ('00000000-0000-0000-0000-000000000621', 'call', 'Rang the buyer');
  if (select created_by from public.crm_activities where body = 'Rang the buyer') <> '00000000-0000-0000-0000-0000000006a3' then
    raise exception 'FAIL: activity author not taken from the session';
  end if;
  -- Nobody writes status_change activities by hand.
  begin
    insert into public.crm_activities (lead_id, type, body) values ('00000000-0000-0000-0000-000000000621', 'status_change', 'Stage changed from New to Won');
    raise exception 'FAIL: a status_change activity was written by hand';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: created_by, updated_by, closed_at, consent_at and activity authors come from the database';
end $$;

-- Stage changes: activity, lost reason, closed_at --------------------------------------------------
do $$
declare first_closed timestamptz; n int;
begin
  begin
    perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'lost', '  ');
    raise exception 'FAIL: a lead was lost without a reason';
  exception when check_violation then null;
  end;
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'lost', 'Bought from a competitor');
  if (select closed_at from public.crm_leads where id = '00000000-0000-0000-0000-000000000621') is null then raise exception 'FAIL: closed_at not set when lost'; end if;
  if not exists (select 1 from public.crm_activities where lead_id = '00000000-0000-0000-0000-000000000621' and type = 'status_change'
                 and body = 'Stage changed from Contacted to Lost. Reason: Bought from a competitor') then
    raise exception 'FAIL: lost stage activity missing or wrong';
  end if;
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'qualified', null);
  if (select closed_at from public.crm_leads where id = '00000000-0000-0000-0000-000000000621') is not null then raise exception 'FAIL: closed_at kept after reopening'; end if;
  if (select lost_reason from public.crm_leads where id = '00000000-0000-0000-0000-000000000621') is not null then raise exception 'FAIL: lost_reason kept after reopening'; end if;
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'won', null);
  select closed_at into first_closed from public.crm_leads where id = '00000000-0000-0000-0000-000000000621';
  if first_closed is null then raise exception 'FAIL: closed_at not set when won'; end if;
  -- Saving other fields keeps the stage, closed_at and writes no stage activity.
  select count(*) into n from public.crm_activities where lead_id = '00000000-0000-0000-0000-000000000621' and type = 'status_change';
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'won', null);
  update public.crm_leads set next_action = 'Send thank you note' where id = '00000000-0000-0000-0000-000000000621';
  if (select count(*) from public.crm_activities where lead_id = '00000000-0000-0000-0000-000000000621' and type = 'status_change') <> n then
    raise exception 'FAIL: a stage activity was written without a stage change';
  end if;
  if (select closed_at from public.crm_leads where id = '00000000-0000-0000-0000-000000000621') <> first_closed then raise exception 'FAIL: closed_at moved without a stage change'; end if;
  if (select count(*) from public.crm_activities where lead_id = '00000000-0000-0000-0000-000000000621' and type = 'status_change') <> 4 then
    raise exception 'FAIL: expected 4 stage activities (contacted, lost, qualified, won)';
  end if;
  begin
    perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000621', 'archived', null);
    raise exception 'FAIL: an unknown stage was accepted';
  exception when check_violation then null;
  end;
  raise notice 'PASS: stage changes write activities, need a reason when lost, and set or clear closed_at';
end $$;
reset role;

-- Rep with Yazz and Linzzy: moves an organisation from one of their brands to the other in one save ------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006b0';
do $$
declare new_org uuid;
begin
  new_org := public.save_crm_organisation(null, jsonb_build_object('name', 'YL org'), array[(select yazz from ids)]);
  perform public.save_crm_organisation(new_org, null, array[(select linzzy from ids)]);
  if (select array_agg(brand_id) from public.crm_organisation_brands where organisation_id = new_org) <> array[(select linzzy from ids)] then
    raise exception 'FAIL: moving an organisation from Yazz to Linzzy in one save did not work';
  end if;
  -- And on an organisation they do not own or create, carrying only Yazz: same move works.
  perform public.save_crm_organisation('00000000-0000-0000-0000-000000000601', null, array[(select linzzy from ids)]);
  if (select array_agg(brand_id) from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000601') <> array[(select linzzy from ids)] then
    raise exception 'FAIL: moving a Yazz organisation they do not own to Linzzy did not work';
  end if;
  perform public.save_crm_organisation('00000000-0000-0000-0000-000000000601', null, array[(select yazz from ids)]);
  raise notice 'PASS: a rep moves an organisation between their own brands in one save';
end $$;
reset role;

-- Marketing with Hooch access ----------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a4';
do $$
declare n int;
begin
  if not exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000622') then raise exception 'FAIL: Hooch marketing cannot see a Hooch lead'; end if;
  if not exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000627') then raise exception 'FAIL: Hooch marketing cannot see an unbranded lead'; end if;
  if exists (select 1 from public.crm_leads where id in ('00000000-0000-0000-0000-000000000621', '00000000-0000-0000-0000-000000000625', '00000000-0000-0000-0000-000000000626')) then
    raise exception 'FAIL: Hooch marketing sees a Yazz, Linzzy or corporate lead';
  end if;
  if not exists (select 1 from public.crm_activities where id = '00000000-0000-0000-0000-000000000631') then raise exception 'FAIL: Hooch marketing cannot see a Hooch lead note'; end if;
  if not exists (select 1 from public.crm_organisations where id = '00000000-0000-0000-0000-000000000604') then raise exception 'FAIL: Hooch marketing cannot see a Hooch organisation another rep owns'; end if;
  if exists (select 1 from public.crm_organisations where id = '00000000-0000-0000-0000-000000000601') then raise exception 'FAIL: Hooch marketing sees a Yazz organisation'; end if;
  -- The Yazz rep's unowned organisation got a Yazz brand from its creator, so it is now Yazz only.
  if exists (select 1 from public.crm_organisations where name = 'Rep unowned org') then raise exception 'FAIL: Hooch marketing sees a Yazz organisation'; end if;
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000622', 'qualified', null);
  -- The Yazz rep's own lead (Hooch brand) is visible to the Hooch team too, but marketing cannot take it.
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000624', '00000000-0000-0000-0000-0000000006a4');
    raise exception 'FAIL: Hooch marketing took a lead someone owns';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: Hooch marketing sees Hooch and unbranded records only and cannot take owned leads';
end $$;
reset role;

-- Hooch rep: sees the Linzzy lead they own -----------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a9';
do $$
declare n int;
begin
  if not exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000625') then raise exception 'FAIL: Hooch rep cannot see the Linzzy lead they own'; end if;
  if not exists (select 1 from public.crm_leads where title = 'Mgmt lead') then raise exception 'FAIL: Hooch rep cannot see the Linzzy lead management gave them'; end if;
  -- The organisation of a lead they own becomes visible through the lead.
  if not exists (select 1 from public.crm_organisations where id = '00000000-0000-0000-0000-000000000605') then
    raise exception 'FAIL: Hooch rep cannot see the organisation of a lead they own';
  end if;
  perform public.set_crm_lead_stage('00000000-0000-0000-0000-000000000625', 'proposal', null);
  -- ...read only: no edits, no brands, no notes.
  update public.crm_organisations set notes = 'Hacked' where id = '00000000-0000-0000-0000-000000000605';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Hooch rep edited an organisation seen only through a lead'; end if;
  begin
    perform public.save_crm_organisation('00000000-0000-0000-0000-000000000605', jsonb_build_object('name', 'Hacked'), null);
    raise exception 'FAIL: save_crm_organisation edited an organisation seen only through a lead';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_organisation_brands (organisation_id, brand_id) values ('00000000-0000-0000-0000-000000000605', (select hooch from ids));
    raise exception 'FAIL: Hooch rep added a brand to an organisation seen only through a lead';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.crm_activities (organisation_id, type, body) values ('00000000-0000-0000-0000-000000000605', 'note', 'x');
    raise exception 'FAIL: Hooch rep logged an activity on an organisation seen only through a lead';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: ownership gives access to leads of other brands; their organisation is read only';
end $$;
reset role;

-- Customer care: reads everything, creates contacts, leads and activities, nothing else -----------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a5';
do $$
declare n int; new_contact uuid; new_lead uuid;
begin
  if (select count(*) from public.crm_leads where title like 'Test %') <> 7 then raise exception 'FAIL: customer care should see all 7 test leads'; end if;
  if (select count(*) from public.crm_organisations where name like 'Test %') <> 6 then raise exception 'FAIL: customer care should see all test organisations'; end if;
  new_contact := public.save_crm_contact(null, jsonb_build_object('full_name', 'Care contact', 'email', 'care.contact@test.local'));
  -- Customer care only adds new leads: never straight into a later or closed stage.
  if public.crm_care_may_edit() then raise exception 'FAIL: crm_care_may_edit() should be false until Desmond decides'; end if;
  foreach n in array array[1, 2, 3] loop
    begin
      perform public.save_crm_lead(null, jsonb_build_object('title', 'Care closed lead', 'source', 'phone', 'contact_id', new_contact,
                                   'stage', (array['won', 'lost', 'qualified'])[n], 'lost_reason', 'x'));
      raise exception 'FAIL: customer care created a lead at a later or closed stage';
    exception when insufficient_privilege then null;
    end;
  end loop;
  if not public.crm_is_staff('00000000-0000-0000-0000-0000000006a3') then raise exception 'FAIL: crm_is_staff refuses CRM staff'; end if;
  new_lead := public.save_crm_lead(null, jsonb_build_object('title', 'Escalated complaint', 'source', 'complaint_escalation',
                                   'contact_id', new_contact, 'brand_id', (select hooch from ids), 'owner_id', '00000000-0000-0000-0000-0000000006a5'));
  insert into public.crm_activities (lead_id, type, body) values (new_lead, 'call', 'Customer called about a damaged pack');
  insert into public.crm_activities (lead_id, type, body) values ('00000000-0000-0000-0000-000000000626', 'note', 'Corporate lead note');
  begin
    perform public.save_crm_lead(null, jsonb_build_object('title', 'Care for someone', 'source', 'phone', 'contact_id', new_contact,
                                 'owner_id', '00000000-0000-0000-0000-0000000006a3'));
    raise exception 'FAIL: customer care assigned a new lead to someone else';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_crm_organisation(null, jsonb_build_object('name', 'Care org'), null);
    raise exception 'FAIL: customer care created an organisation';
  exception when insufficient_privilege then null;
  end;
  update public.crm_leads set title = 'Changed by care';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care edited leads'; end if;
  update public.crm_contacts set full_name = 'Changed by care';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care edited contacts'; end if;
  begin
    perform public.save_crm_contact(new_contact, jsonb_build_object('full_name', 'Changed by care'));
    raise exception 'FAIL: save_crm_contact let customer care edit';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_lead_stage(new_lead, 'contacted', null);
    raise exception 'FAIL: customer care changed a stage';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_crm_owner('lead', '00000000-0000-0000-0000-000000000627', '00000000-0000-0000-0000-0000000006a5');
    raise exception 'FAIL: customer care took or reassigned a lead';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_crm_record('lead', new_lead);
    raise exception 'FAIL: customer care deleted a lead';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: customer care reads all, creates contacts, leads and activities, and cannot edit, reassign or delete';
end $$;
reset role;

-- Admin deletes ---------------------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a1';
do $$
begin
  perform public.delete_crm_record('lead', '00000000-0000-0000-0000-000000000627');
  if exists (select 1 from public.crm_leads where id = '00000000-0000-0000-0000-000000000627') then raise exception 'FAIL: admin could not delete a lead'; end if;
  -- An organisation with leads cannot be deleted until its leads are moved or deleted.
  begin
    perform public.delete_crm_record('organisation', '00000000-0000-0000-0000-000000000602');
    raise exception 'FAIL: an organisation with leads was deleted';
  exception when foreign_key_violation then null;
  end;
  perform public.delete_crm_record('organisation', '00000000-0000-0000-0000-000000000603');
  begin
    perform public.delete_crm_record('lead', '00000000-0000-0000-0000-000000000627');
    raise exception 'FAIL: deleting a missing lead did not raise';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: admin deletes; deletes that touch nothing raise';
end $$;
reset role;

-- Website intake ---------------------------------------------------------------------------------------
create temp table before_intake as select
  (select to_jsonb(o) from public.crm_organisations o where o.id = '00000000-0000-0000-0000-000000000601') as yazz_org,
  (select array_agg(brand_id order by brand_id) from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000601') as yazz_org_brands,
  (select updated_by from public.crm_contacts where id = '00000000-0000-0000-0000-000000000612') as kofi_updated_by;
do $$
begin
  if (select kofi_updated_by from before_intake) is null then raise exception 'FAIL: fixture: Kofi should have a staff updated_by before intake'; end if;
end $$;
create temp table refs (label text, ref text);
grant all on refs to anon, authenticated;

set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare r text;
begin
  r := public.submit_website_enquiry('contact', jsonb_build_object(
    'name', 'Esi Visitor', 'email', 'Esi.Visitor@Example.com', 'phone', '+233 26 000 1111', 'message', E'Hello\nDo you deliver to Tamale?',
    'reason', 'distribution', 'organisation_name', 'Esi Trading', 'region', 'northern', 'brand', 'yazz', 'consent_marketing', false, 'honeypot', ''));
  if r !~ '^ENQ-[0-9A-F]{10}$' then raise exception 'FAIL: contact form reference looks wrong: %', r; end if;
  insert into refs values ('contact1', r);

  -- Same person again (email in other case): matched, not duplicated.
  r := public.submit_website_enquiry('contact', jsonb_build_object('name', 'Esi V', 'email', 'esi.visitor@example.com', 'message', 'Second message'));
  insert into refs values ('contact2', r);

  -- An existing staff contact: only blanks are filled.
  r := public.submit_website_enquiry('contact', jsonb_build_object('name', 'Hacker Name', 'email', 'AMA@test.local', 'phone', '020 999 9999',
                                     'message', 'Please call me', 'reason', 'general', 'organisation_name', 'Ama New Venture'));
  insert into refs values ('ama', r);

  -- Matched by phone (written differently) when that contact has no email: the email is filled in.
  r := public.submit_website_enquiry('contact', jsonb_build_object('name', 'Kofi Again', 'email', 'kofi@test.local', 'phone', '+233 (0)24 555 6666', 'message', 'Hi',
                                     'organisation_name', 'Kofi Shop'));
  insert into refs values ('kofi', r);

  r := public.submit_website_enquiry('partner', jsonb_build_object(
    'name', 'Yaw Partner', 'organisation_name', 'test yazz org', 'email', 'yaw@partner.test', 'partner_type', 'distributor',
    'location', 'Kumasi', 'years_trading', '6', 'estimated_monthly_volume', '200 cartons a month', 'message', 'We cover Ashanti', 'brand', 'hooch',
    'organisation_website', 'https://attacker.example'));
  if r !~ '^PTN-[0-9A-F]{10}$' then raise exception 'FAIL: partner form reference looks wrong: %', r; end if;
  insert into refs values ('partner_existing_org', r);

  r := public.submit_website_enquiry('partner', jsonb_build_object(
    'name', 'Abena Partner', 'organisation_name', 'Abena Wholesale', 'phone', '050 777 8888', 'partner_type', 'retail',
    'region', 'ashanti', 'location', 'Obuasi', 'organisation_website', 'https://abena.example', 'job_title', 'Owner', 'brand', 'hooch',
    'consent_marketing', true));
  insert into refs values ('partner_new_org', r);

  r := public.submit_website_enquiry('newsletter', jsonb_build_object('email', 'news@test.local', 'brand', 'linzzy', 'consent_marketing', true));
  if r !~ '^NWS-[0-9A-F]{10}$' then raise exception 'FAIL: newsletter reference looks wrong: %', r; end if;
  insert into refs values ('newsletter', r);
  r := public.submit_website_enquiry('newsletter', jsonb_build_object('email', 'ama@test.local', 'consent_marketing', true));
  insert into refs values ('newsletter_ama', r);

  -- Visitors still cannot read anything back.
  begin
    perform 1 from public.crm_leads;
    raise exception 'FAIL: anon read leads after submitting';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.crm_intake_log;
    raise exception 'FAIL: anon read the intake log';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon submits contact, partner and newsletter forms and only gets a reference back';
end $$;

-- Validation and size limits.
do $$
declare
  bad record;
begin
  for bad in
    select * from (values
      ('unknown form',      'quote',      '{"name":"A","email":"a@b.co","message":"m"}'::jsonb),
      ('payload not object','contact',    '["name"]'::jsonb),
      ('unknown field',     'contact',    '{"name":"A","email":"a@b.co","message":"m","price":"10"}'::jsonb),
      ('newsletter extra',  'newsletter', '{"email":"a@b.co","consent_marketing":true,"message":"m"}'::jsonb),
      ('missing name',      'contact',    '{"email":"a@b.co","message":"m"}'::jsonb),
      ('no email or phone', 'contact',    '{"name":"A","message":"m"}'::jsonb),
      ('missing message',   'contact',    '{"name":"A","email":"a@b.co"}'::jsonb),
      ('missing org',       'partner',    '{"name":"A","email":"a@b.co"}'::jsonb),
      ('bad email',         'contact',    '{"name":"A","email":"not an email","message":"m"}'::jsonb),
      ('bad phone',         'contact',    '{"name":"A","phone":"call me maybe","message":"m"}'::jsonb),
      ('bad brand',         'contact',    '{"name":"A","email":"a@b.co","message":"m","brand":"crox"}'::jsonb),
      ('bad region',        'contact',    '{"name":"A","email":"a@b.co","message":"m","region":"mars"}'::jsonb),
      ('bad reason',        'contact',    '{"name":"A","email":"a@b.co","message":"m","reason":"bribe"}'::jsonb),
      ('bad partner type',  'partner',    '{"name":"A","email":"a@b.co","organisation_name":"O","partner_type":"spy"}'::jsonb),
      ('bad website',       'partner',    '{"name":"A","email":"a@b.co","organisation_name":"O","organisation_website":"javascript:alert(1)"}'::jsonb),
      ('number not text',   'contact',    '{"name":42,"email":"a@b.co","message":"m"}'::jsonb),
      ('consent not bool',  'newsletter', '{"email":"a@b.co","consent_marketing":"yes"}'::jsonb),
      ('no consent',        'newsletter', '{"email":"a@b.co"}'::jsonb),
      ('consent false',     'newsletter', '{"email":"a@b.co","consent_marketing":false}'::jsonb)
    ) as t(label, form, payload)
  loop
    begin
      perform public.submit_website_enquiry(bad.form, bad.payload);
      raise exception 'FAIL: intake accepted %', bad.label;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', repeat('x', 121), 'email', 'a@b.co', 'message', 'm'));
    raise exception 'FAIL: intake accepted a name that is too long';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'A', 'email', 'a@b.co', 'message', repeat('x', 3001)));
    raise exception 'FAIL: intake accepted a message that is too long';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'A', 'email', 'a@b.co', 'message', 'm', 'detail', repeat('x', 300),
                                          'organisation_name', repeat('y', 160), 'reason', 'general', 'region', 'ashanti', 'phone', '+233 20 000 0000',
                                          'honeypot', '', 'brand', 'yazz', 'consent_marketing', false) || jsonb_build_object('message', repeat('z', 3000)));
    -- Each field is within its limit; the whole payload is still under 8000 bytes, so this one is accepted.
  exception when invalid_parameter_value then
    raise exception 'FAIL: intake refused a payload within every limit';
  end;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'A', 'email', 'a@b.co', 'message', repeat('€', 3000)));
    raise exception 'FAIL: intake accepted a payload over 8000 bytes';
  exception when invalid_parameter_value then null;
  end;
  raise notice 'PASS: intake refuses unknown forms and fields, missing or malformed fields, long fields and big payloads';
end $$;

-- Honeypot: a reference comes back, nothing is saved.
reset role;
create temp table counts as select
  (select count(*) from public.crm_contacts) as contacts,
  (select count(*) from public.crm_leads) as leads,
  (select count(*) from public.crm_organisations) as orgs,
  (select count(*) from public.crm_intake_log) as log;
grant select on counts to anon;
set local role anon;
do $$
declare r text;
begin
  r := public.submit_website_enquiry('contact', jsonb_build_object('name', 'Bot', 'email', 'bot@spam.test', 'message', 'Buy now', 'honeypot', 'http://spam'));
  if r !~ '^LX-[0-9A-F]{10}$' then raise exception 'FAIL: honeypot answer looks wrong: %', r; end if;
  r := public.submit_website_enquiry('partner', jsonb_build_object('name', 'Bot', 'email', 'bot@spam.test', 'organisation_name', 'Spam Ltd', 'honeypot', 'x'));
  raise notice 'PASS: honeypot submissions get a reference';
end $$;
reset role;
do $$
begin
  if (select count(*) from public.crm_contacts) <> (select contacts from counts)
     or (select count(*) from public.crm_leads) <> (select leads from counts)
     or (select count(*) from public.crm_organisations) <> (select orgs from counts)
     or (select count(*) from public.crm_intake_log) <> (select log from counts) then
    raise exception 'FAIL: a honeypot submission saved something';
  end if;
  raise notice 'PASS: honeypot submissions save nothing';
end $$;

-- Rate limit: 5 per email or phone per hour.
set local role anon;
do $$
declare i int;
begin
  for i in 1..5 loop
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Flood', 'email', 'flood@test.local', 'message', 'Message ' || i));
  end loop;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Flood', 'email', 'FLOOD@test.local', 'message', 'Sixth'));
    raise exception 'FAIL: a sixth submission from the same email in an hour was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  begin
    perform public.submit_website_enquiry('newsletter', jsonb_build_object('email', 'flood@test.local', 'consent_marketing', true));
    raise exception 'FAIL: the newsletter form is not rate limited';
  exception when sqlstate 'PT429' then null;
  end;
  for i in 1..5 loop
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Phone flood', 'phone', '+233 27 123 0000', 'email', 'p' || i || '@flood.test', 'message', 'm'));
  end loop;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Phone flood', 'phone', '027 123 0000', 'email', 'p9@flood.test', 'message', 'm'));
    raise exception 'FAIL: a sixth submission from the same phone in an hour was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  -- Every way of writing the same Ghana number counts together.
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Phone flood', 'phone', '233271230000', 'email', 'p10@flood.test', 'message', 'm'));
    raise exception 'FAIL: 233... form of a rate limited number was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Phone flood', 'phone', '27 123 0000', 'email', 'p11@flood.test', 'message', 'm'));
    raise exception 'FAIL: short form of a rate limited number was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  begin
    perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Phone flood', 'phone', '00233 27 123 0000', 'email', 'p12@flood.test', 'message', 'm'));
    raise exception 'FAIL: 00233 form of a rate limited number was accepted';
  exception when sqlstate 'PT429' then null;
  end;
  -- Someone else is not affected.
  perform public.submit_website_enquiry('contact', jsonb_build_object('name', 'Other', 'email', 'other@test.local', 'message', 'm'));
  raise notice 'PASS: at most 5 submissions per email or phone per hour';
end $$;
reset role;

-- Phone keys and the rate limit lock.
do $$
declare v text;
begin
  foreach v in array array['+233 (0)24 555 6666', '024 555 6666', '24 555 6666', '233245556666', '+233245556666', '0245556666', '00233 24 555 6666', '00233245556666'] loop
    if public.crm_phone_key(v) is distinct from '245556666' then raise exception 'FAIL: phone key of % is %', v, public.crm_phone_key(v); end if;
  end loop;
  if public.crm_phone_key('call me') is not null then raise exception 'FAIL: phone key of text should be empty'; end if;
  -- Submissions take a transaction advisory lock per email (space 61) and phone (space 62) before counting.
  if not exists (select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid() and classid = 61)
     or not exists (select 1 from pg_locks where locktype = 'advisory' and pid = pg_backend_pid() and classid = 62) then
    raise exception 'FAIL: the intake did not lock the email and phone before counting';
  end if;
  raise notice 'PASS: phone numbers match however they are written; the rate limit count is serialised by advisory locks';
end $$;

-- What the intake saved (checked as the database owner).
do $$
declare
  c record; l record; o record; n int;
  esi uuid;
begin
  -- Contact form: one contact for Esi (email matched case-insensitively), two leads.
  select count(*) into n from public.crm_contacts where lower(email) = 'esi.visitor@example.com';
  if n <> 1 then raise exception 'FAIL: Esi was saved % times (duplicates not matched)', n; end if;
  select * into c from public.crm_contacts where lower(email) = 'esi.visitor@example.com';
  if c.full_name <> 'Esi Visitor' or c.email <> 'esi.visitor@example.com' or c.phone_key <> '260001111' then
    raise exception 'FAIL: Esi contact saved wrongly: % % %', c.full_name, c.email, c.phone_key;
  end if;
  if c.created_by is not null or c.owner_id is not null or c.consent_marketing then raise exception 'FAIL: intake contact has an author, owner or consent'; end if;
  if (select count(*) from public.crm_leads where contact_id = c.id) <> 2 then raise exception 'FAIL: Esi should have two leads'; end if;
  select * into l from public.crm_leads where intake_reference = (select ref from refs where label = 'contact1');
  if l.source <> 'website_contact_form' or l.stage <> 'new' or l.owner_id is not null or l.created_by is not null
     or l.brand_id <> (select yazz from ids) or l.contact_id <> c.id then
    raise exception 'FAIL: contact form lead saved wrongly';
  end if;
  if l.description not like 'Reason: Distribution%' or l.description not like '%Region: Northern%' or l.description not like E'%Hello\nDo you deliver to Tamale?' then
    raise exception 'FAIL: contact form lead description wrong: %', l.description;
  end if;
  if l.organisation_id is null or (select name from public.crm_organisations where id = l.organisation_id) <> 'Esi Trading' then
    raise exception 'FAIL: contact form organisation not saved';
  end if;

  -- Staff contact Ama: nothing staff typed was overwritten.
  select * into c from public.crm_contacts where id = '00000000-0000-0000-0000-000000000611';
  if c.full_name <> 'Test Ama Staff Typed' or c.phone <> '+233 20 111 2222' or c.notes <> 'Staff typed note' or c.job_title <> 'Buyer'
     or c.organisation_id <> '00000000-0000-0000-0000-000000000601' then
    raise exception 'FAIL: intake overwrote a staff entered contact field';
  end if;
  if (select contact_id from public.crm_leads where intake_reference = (select ref from refs where label = 'ama')) <> c.id then
    raise exception 'FAIL: lead not linked to the matched staff contact';
  end if;
  -- The newsletter sign up recorded Ama's consent.
  if not c.consent_marketing or c.consent_at is null or c.consent_source <> 'Website newsletter' then
    raise exception 'FAIL: newsletter consent not recorded on the existing contact';
  end if;
  if (select count(*) from public.crm_contacts where lower(email) = 'ama@test.local') <> 1 then raise exception 'FAIL: Ama duplicated'; end if;

  -- Ama's new organisation was created for the lead, but her own organisation link did not move.
  select * into l from public.crm_leads where intake_reference = (select ref from refs where label = 'ama');
  if (select name from public.crm_organisations where id = l.organisation_id) <> 'Ama New Venture' then raise exception 'FAIL: new organisation not linked to the lead'; end if;

  -- Kofi matched by phone written as +233 (0)24...; email filled in, name kept, organisation link untouched
  -- (still none, although the form named a new organisation), updated_by kept.
  select * into c from public.crm_contacts where id = '00000000-0000-0000-0000-000000000612';
  if c.email <> 'kofi@test.local' or c.full_name <> 'Test Kofi' then raise exception 'FAIL: phone match did not fill only the blanks'; end if;
  if c.organisation_id is not null then raise exception 'FAIL: intake linked an existing contact to an organisation'; end if;
  if c.updated_by is distinct from (select kofi_updated_by from before_intake) then raise exception 'FAIL: intake blanked updated_by (now %)', c.updated_by; end if;

  -- Partner form naming an existing organisation (any case): the organisation is not touched, not branded and not
  -- linked; the typed name waits on the lead for staff.
  select * into l from public.crm_leads where intake_reference = (select ref from refs where label = 'partner_existing_org');
  if l.source <> 'website_partner_form' or l.organisation_id is not null or l.estimated_monthly_volume <> '200 cartons a month'
     or l.submitted_organisation_name <> 'test yazz org' then
    raise exception 'FAIL: partner lead for an existing organisation saved wrongly';
  end if;
  if l.title <> 'Partner enquiry: test yazz org' then raise exception 'FAIL: partner lead title is %', l.title; end if;
  if (select count(*) from public.crm_organisations where lower(name) = 'test yazz org') <> 1 then raise exception 'FAIL: partner form duplicated an organisation'; end if;
  if (select to_jsonb(x) from public.crm_organisations x where x.id = '00000000-0000-0000-0000-000000000601') <> (select yazz_org from before_intake) then
    raise exception 'FAIL: intake changed an existing organisation';
  end if;
  if (select array_agg(brand_id order by brand_id) from public.crm_organisation_brands where organisation_id = '00000000-0000-0000-0000-000000000601')
     <> (select yazz_org_brands from before_intake) then
    raise exception 'FAIL: intake changed the brands of an existing organisation';
  end if;
  if (select organisation_id from public.crm_contacts where email = 'yaw@partner.test') is not null then
    raise exception 'FAIL: a new contact was linked to an existing organisation by the website';
  end if;

  -- Partner form, new organisation: created with kind, region, town, website, brand; contact linked and consent kept.
  select * into l from public.crm_leads where intake_reference = (select ref from refs where label = 'partner_new_org');
  select * into o from public.crm_organisations where id = l.organisation_id;
  if o.name <> 'Abena Wholesale' or o.kind <> 'retailer' or o.region_id <> (select ashanti from ids) or o.town <> 'Obuasi'
     or o.website <> 'https://abena.example' or o.owner_id is not null then
    raise exception 'FAIL: new partner organisation saved wrongly';
  end if;
  if not exists (select 1 from public.crm_organisation_brands where organisation_id = o.id and brand_id = (select hooch from ids)) then
    raise exception 'FAIL: partner organisation brand not linked';
  end if;
  select * into c from public.crm_contacts where id = l.contact_id;
  if c.organisation_id <> o.id or c.job_title <> 'Owner' or not c.consent_marketing or c.consent_source <> 'Website partner form (Hooch)' then
    raise exception 'FAIL: partner contact saved wrongly';
  end if;

  -- Newsletter: contact with consent, no lead.
  select * into c from public.crm_contacts where email = 'news@test.local';
  if not c.consent_marketing or c.consent_at is null or c.consent_source <> 'Website newsletter (Linzzy)' then raise exception 'FAIL: newsletter contact saved wrongly'; end if;
  if exists (select 1 from public.crm_leads where contact_id = c.id) then raise exception 'FAIL: a newsletter sign up created a lead'; end if;
  if exists (select 1 from public.crm_leads where intake_reference = (select ref from refs where label = 'newsletter')) then
    raise exception 'FAIL: a newsletter reference is on a lead';
  end if;

  -- The intake never reaches beyond its own records: test fixtures are unchanged apart from filled blanks.
  if (select count(*) from public.crm_leads where intake_reference is not null and (owner_id is not null or created_by is not null)) <> 0 then
    raise exception 'FAIL: intake leads have an owner or author';
  end if;
  raise notice 'PASS: intake matches contacts and organisations, fills only blanks, records consent and makes the right leads';
end $$;

-- Website leads appear for the right people.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000006a4';
do $$
begin
  if not exists (select 1 from public.crm_leads where intake_reference = (select ref from refs where label = 'partner_new_org')) then
    raise exception 'FAIL: Hooch marketing cannot see a Hooch website lead';
  end if;
  if exists (select 1 from public.crm_leads where intake_reference = (select ref from refs where label = 'contact1')) then
    raise exception 'FAIL: Hooch marketing sees a Yazz website lead';
  end if;
  if not exists (select 1 from public.crm_leads where intake_reference = (select ref from refs where label = 'kofi')) then
    raise exception 'FAIL: Hooch marketing cannot see an unbranded website lead';
  end if;
  raise notice 'PASS: website leads follow the brand rules';
end $$;
reset role;

rollback;
