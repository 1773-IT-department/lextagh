-- Stockists for Where to Buy: Row Level Security, privilege and save function tests.
-- Run with: bash supabase/tests/local/run.sh stockists_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Fixtures (as the database owner) ---------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', 'st.admin@test.local',    '{"role":"admin"}'),
  ('00000000-0000-0000-0000-0000000005a2', 'st.mgmt@test.local',     '{"role":"management"}'),
  ('00000000-0000-0000-0000-0000000005a3', 'st.rep.yazz@test.local', '{"role":"sales_rep"}'),
  ('00000000-0000-0000-0000-0000000005a4', 'st.mkt.hooch@test.local','{"role":"marketing"}'),
  ('00000000-0000-0000-0000-0000000005a5', 'st.care@test.local',     '{"role":"customer_care"}'),
  ('00000000-0000-0000-0000-0000000005a6', 'st.dist@test.local',     '{"role":"distributor"}'),
  ('00000000-0000-0000-0000-0000000005a7', 'st.norole@test.local',   '{}'),
  ('00000000-0000-0000-0000-0000000005a8', 'st.rep.none@test.local', '{"role":"sales_rep"}'),
  ('00000000-0000-0000-0000-0000000005a9', 'st.hr@test.local',       '{"role":"hr"}');

insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000005a3', id from public.brands where slug = 'yazz';
insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000005a4', id from public.brands where slug = 'hooch';

insert into public.brands (id, slug, name, is_active)
values ('00000000-0000-0000-0000-0000000005b1', 'retired-stockist-test', 'Retired stockist test brand', false);

create temp table ids as select
  (select id from public.brands where slug = 'yazz') as yazz,
  (select id from public.brands where slug = 'hooch') as hooch,
  (select id from public.brands where slug = 'linzzy') as linzzy,
  (select id from public.brands where slug = 'lexta') as lexta,
  (select id from public.regions where slug = 'greater-accra') as accra,
  (select id from public.regions where slug = 'ashanti') as ashanti;
grant select on ids to anon, authenticated;

-- s1 Yazz only, s2 Yazz and Hooch, s3 inactive Hooch, s4 no brands (made by nobody in particular),
-- s5 linked to an inactive brand, s6 Hooch only.
insert into public.stockists (id, name, outlet_type, region_id, town, address, phone, latitude, longitude, is_active) values
  ('00000000-0000-0000-0000-000000000501', 'Test Yazz shop',     'general_trade', (select accra from ids),   'Accra',  'Test street 1', '+233 20 000 0000', 5.6037, -0.1870, true),
  ('00000000-0000-0000-0000-000000000502', 'Test shared market', 'supermarket',   (select accra from ids),   'Tema',   null, null, null, null, true),
  ('00000000-0000-0000-0000-000000000503', 'Test closed Hooch',  'pharmacy',      (select ashanti from ids), 'Kumasi', null, null, null, null, false),
  ('00000000-0000-0000-0000-000000000504', 'Test no brands',     'other',         (select ashanti from ids), 'Obuasi', null, null, null, null, true),
  ('00000000-0000-0000-0000-000000000505', 'Test retired brand', 'open_market',   (select ashanti from ids), 'Kumasi', null, null, null, null, true),
  ('00000000-0000-0000-0000-000000000506', 'Test Hooch shop',    'distributor',   (select accra from ids),   'Accra',  null, null, null, null, true);

insert into public.stockist_brands (stockist_id, brand_id) values
  ('00000000-0000-0000-0000-000000000501', (select yazz from ids)),
  ('00000000-0000-0000-0000-000000000502', (select yazz from ids)),
  ('00000000-0000-0000-0000-000000000502', (select hooch from ids)),
  ('00000000-0000-0000-0000-000000000503', (select hooch from ids)),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-0000000005b1'),
  ('00000000-0000-0000-0000-000000000506', (select hooch from ids));

insert into public.stockist_notes (stockist_id, notes) values
  ('00000000-0000-0000-0000-000000000501', 'Staff only: owner prefers calls after 4pm'),
  ('00000000-0000-0000-0000-000000000503', 'Staff only: closed for renovation');

-- Seed sanity: regions, and no invented shops ----------------------------------------
do $$
begin
  if (select count(*) from public.regions where is_in_ghana) <> 16 then
    raise exception 'FAIL: expected 16 Ghana regions, got %', (select count(*) from public.regions where is_in_ghana);
  end if;
  if not exists (select 1 from public.regions where slug = 'liberia-monrovia' and not is_in_ghana) then
    raise exception 'FAIL: Liberia (Monrovia) missing or not flagged as outside Ghana';
  end if;
  if (select count(*) from public.stockists where name not like 'Test %') <> 0 then
    raise exception 'FAIL: the migration must not seed any stockists';
  end if;
  raise notice 'PASS: 16 Ghana regions plus Liberia (Monrovia); no stockists seeded';
end $$;

-- Website visitors (anon) --------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';

do $$
declare n int;
begin
  if exists (select 1 from public.stockists where not is_active) or exists (select 1 from public.stockists where id = '00000000-0000-0000-0000-000000000503') then
    raise exception 'FAIL: anon sees an inactive stockist';
  end if;
  if (select count(*) from public.stockists where name like 'Test %') <> 5 then
    raise exception 'FAIL: anon should see 5 active test stockists, sees %', (select count(*) from public.stockists where name like 'Test %');
  end if;
  if exists (select 1 from public.stockist_brands where stockist_id = '00000000-0000-0000-0000-000000000503') then
    raise exception 'FAIL: anon sees brands of an inactive stockist';
  end if;
  if exists (select 1 from public.stockist_brands where brand_id = '00000000-0000-0000-0000-0000000005b1') then
    raise exception 'FAIL: anon sees a link to an inactive brand';
  end if;
  if (select count(*) from public.stockist_brands where stockist_id = '00000000-0000-0000-0000-000000000502') <> 2 then
    raise exception 'FAIL: anon cannot see the brands of an active stockist';
  end if;
  if (select count(*) from public.regions) <> 17 then
    raise exception 'FAIL: anon cannot read the regions list';
  end if;
  -- Public columns work, including the map position.
  if (select latitude from public.stockists where id = '00000000-0000-0000-0000-000000000501') is null then
    raise exception 'FAIL: anon cannot read the map position';
  end if;
  raise notice 'PASS: anon reads active stockists, their active brands and the regions list';
end $$;

do $$
begin
  begin
    perform notes from public.stockist_notes;
    raise exception 'FAIL: anon read staff notes';
  exception when insufficient_privilege then null;
  end;
  begin
    perform created_by from public.stockists;
    raise exception 'FAIL: anon read created_by';
  exception when insufficient_privilege then null;
  end;
  begin
    perform updated_by from public.stockists;
    raise exception 'FAIL: anon read updated_by';
  exception when insufficient_privilege then null;
  end;
  begin
    perform s.* from public.stockists s;
    raise exception 'FAIL: anon read every column with select *';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon cannot read staff notes or staff only columns';
end $$;

do $$
begin
  begin
    insert into public.stockists (name, outlet_type, region_id, town) values ('Anon shop', 'other', (select accra from ids), 'Accra');
    raise exception 'FAIL: anon created a stockist';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.stockists set name = 'Hacked' where id = '00000000-0000-0000-0000-000000000501';
    raise exception 'FAIL: anon updated a stockist';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.stockist_brands;
    raise exception 'FAIL: anon deleted brand links';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.regions set name = 'Hacked';
    raise exception 'FAIL: anon renamed a region';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_stockist(null, '{"name":"x"}'::jsonb, '{}');
    raise exception 'FAIL: anon called save_stockist';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.import_stockists('[]'::jsonb);
    raise exception 'FAIL: anon called import_stockists';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon cannot write stockists, links or regions, nor call the save functions';
end $$;

reset role;

-- Signed in without a stockist role (distributor, HR, no role): like a visitor ------------
create temp table outsiders (id uuid);
insert into outsiders values ('00000000-0000-0000-0000-0000000005a6'), ('00000000-0000-0000-0000-0000000005a9'), ('00000000-0000-0000-0000-0000000005a7');
grant select on outsiders to authenticated;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a6';
do $$
declare n int;
begin
  if exists (select 1 from public.stockists where not is_active) then raise exception 'FAIL: distributor sees inactive stockists'; end if;
  if exists (select 1 from public.stockist_notes) then raise exception 'FAIL: distributor sees staff notes'; end if;
  if exists (select 1 from public.stockist_brands where brand_id = '00000000-0000-0000-0000-0000000005b1') then raise exception 'FAIL: distributor sees an inactive brand link'; end if;
  update public.stockists set name = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: distributor updated stockists'; end if;
  begin
    perform public.save_stockist(null, jsonb_build_object('name','Dist shop','outlet_type','other','region_id',(select accra from ids),'town','Accra'), '{}');
    raise exception 'FAIL: distributor created a stockist';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: distributor reads like a visitor and cannot write';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a7';
do $$
declare n int;
begin
  if exists (select 1 from public.stockists where not is_active) or exists (select 1 from public.stockist_notes) then
    raise exception 'FAIL: user with no role sees inactive stockists or notes';
  end if;
  delete from public.stockists;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user with no role deleted stockists'; end if;
  raise notice 'PASS: user with no role reads like a visitor and cannot write';
end $$;
reset role;

-- Read only staff: management and customer care --------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a2';
do $$
declare n int;
begin
  if not exists (select 1 from public.stockists where id = '00000000-0000-0000-0000-000000000503') then raise exception 'FAIL: management cannot see an inactive stockist'; end if;
  if (select count(*) from public.stockist_notes) < 2 then raise exception 'FAIL: management cannot read staff notes'; end if;
  update public.stockists set name = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management updated stockists'; end if;
  delete from public.stockist_brands;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management removed brand links'; end if;
  begin
    insert into public.stockists (name, outlet_type, region_id, town) values ('Mgmt shop', 'other', (select accra from ids), 'Accra');
    raise exception 'FAIL: management created a stockist';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-000000000504', (select yazz from ids));
    raise exception 'FAIL: management linked a brand';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: management reads every stockist with notes and cannot write';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a5';
do $$
declare n int;
begin
  if not exists (select 1 from public.stockists where id = '00000000-0000-0000-0000-000000000503') then raise exception 'FAIL: customer care cannot see an inactive stockist'; end if;
  if not exists (select 1 from public.stockist_notes) then raise exception 'FAIL: customer care cannot read staff notes'; end if;
  update public.stockists set is_active = false;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care updated stockists'; end if;
  update public.stockist_notes set notes = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer care edited notes'; end if;
  raise notice 'PASS: customer care reads every stockist with notes and cannot write';
end $$;
reset role;

-- Marketing with Hooch access -----------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a4';
do $$
declare n int;
begin
  update public.stockists set is_active = true where id = '00000000-0000-0000-0000-000000000503';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: marketing (Hooch) could not reactivate a Hooch only stockist'; end if;
  update public.stockists set is_active = false where id = '00000000-0000-0000-0000-000000000503';
  update public.stockists set town = 'Hacked' where id = '00000000-0000-0000-0000-000000000501';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing (Hooch) edited a Yazz stockist'; end if;
  update public.stockists set town = 'Hacked' where id = '00000000-0000-0000-0000-000000000502';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing (Hooch) edited a stockist that also carries Yazz'; end if;
  update public.stockist_notes set notes = 'Hacked' where stockist_id = '00000000-0000-0000-0000-000000000501';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing (Hooch) edited notes of a Yazz stockist'; end if;
  raise notice 'PASS: marketing with Hooch access manages Hooch only stockists and nothing else';
end $$;
reset role;

-- Sales rep with Yazz access ---------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a3';

do $$
declare n int;
begin
  if (select count(*) from public.stockists where name like 'Test %') <> 6 then raise exception 'FAIL: sales rep should read every test stockist'; end if;
  if not exists (select 1 from public.stockist_notes where stockist_id = '00000000-0000-0000-0000-000000000503') then
    raise exception 'FAIL: sales rep cannot read notes of other brands'' stockists';
  end if;

  update public.stockists set opening_hours = 'Mon to Sat, 8am to 6pm' where id = '00000000-0000-0000-0000-000000000501';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: sales rep (Yazz) could not edit a Yazz only stockist'; end if;

  -- updated_by and created_by come from the session, whatever is sent.
  update public.stockists
     set updated_by = '00000000-0000-0000-0000-0000000005a1', created_by = '00000000-0000-0000-0000-0000000005a1'
   where id = '00000000-0000-0000-0000-000000000501';
  if (select updated_by from public.stockists where id = '00000000-0000-0000-0000-000000000501') is distinct from '00000000-0000-0000-0000-0000000005a3' then
    raise exception 'FAIL: updated_by was spoofed';
  end if;
  if (select created_by from public.stockists where id = '00000000-0000-0000-0000-000000000501') is not null then
    raise exception 'FAIL: created_by was changed by an update';
  end if;

  update public.stockists set town = 'Hacked' where id in ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000506');
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: sales rep (Yazz) edited a stockist carrying another brand, or with no brands made by someone else'; end if;
  delete from public.stockists where id = '00000000-0000-0000-0000-000000000502';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: sales rep (Yazz) deleted a shared stockist'; end if;

  -- Links: own brand only, on any stockist.
  delete from public.stockist_brands where stockist_id = '00000000-0000-0000-0000-000000000502' and brand_id = (select hooch from ids);
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: sales rep (Yazz) removed Hooch from a stockist'; end if;
  insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-000000000506', (select yazz from ids));
  begin
    insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-000000000504', (select linzzy from ids));
    raise exception 'FAIL: sales rep (Yazz) linked Linzzy';
  exception when insufficient_privilege then null;
  end;
  -- Adding Yazz to a Hooch shop does not let the rep edit the shop's details.
  update public.stockists set town = 'Hacked' where id = '00000000-0000-0000-0000-000000000506';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: sales rep (Yazz) edited a Hooch shop after adding Yazz to it'; end if;
  raise notice 'PASS: sales rep (Yazz) edits Yazz only stockists, links only Yazz, and created_by/updated_by cannot be spoofed';
end $$;

do $$
declare new_id uuid; before_count int; n int;
begin
  -- Create through save_stockist: details, notes and brands in one go.
  new_id := public.save_stockist(
    null,
    jsonb_build_object('name', 'Rep new shop', 'outlet_type', 'general_trade', 'region_id', (select accra from ids), 'town', 'Madina',
                       'latitude', '5.68', 'longitude', '-0.165', 'notes', 'Met the owner on Monday', 'created_by', '00000000-0000-0000-0000-0000000005a1'),
    array[(select yazz from ids)]
  );
  if (select created_by from public.stockists where id = new_id) is distinct from '00000000-0000-0000-0000-0000000005a3' then
    raise exception 'FAIL: created_by not taken from the session';
  end if;
  if (select notes from public.stockist_notes where stockist_id = new_id) <> 'Met the owner on Monday' then
    raise exception 'FAIL: notes not saved with the stockist';
  end if;
  if (select count(*) from public.stockist_brands where stockist_id = new_id) <> 1 then
    raise exception 'FAIL: brands not saved with the stockist';
  end if;

  -- A refused brand undoes the whole save: no half stockist left behind.
  select count(*) into before_count from public.stockists;
  begin
    perform public.save_stockist(
      null,
      jsonb_build_object('name', 'Rep Hooch shop', 'outlet_type', 'pharmacy', 'region_id', (select accra from ids), 'town', 'Madina'),
      array[(select yazz from ids), (select hooch from ids)]
    );
    raise exception 'FAIL: sales rep (Yazz) created a stockist carrying Hooch';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.stockists) <> before_count then
    raise exception 'FAIL: a refused save left a stockist behind';
  end if;

  -- Editing a shared stockist's details is refused as a whole.
  begin
    perform public.save_stockist(
      '00000000-0000-0000-0000-000000000502',
      jsonb_build_object('name', 'Hacked', 'outlet_type', 'supermarket', 'region_id', (select accra from ids), 'town', 'Tema'),
      array[(select yazz from ids), (select hooch from ids)]
    );
    raise exception 'FAIL: sales rep (Yazz) saved a shared stockist';
  exception when insufficient_privilege then null;
  end;
  -- But brand only changes are allowed for the rep's own brand: take Yazz off the shared stockist.
  perform public.save_stockist('00000000-0000-0000-0000-000000000502', null, array[(select hooch from ids)]);
  if exists (select 1 from public.stockist_brands where stockist_id = '00000000-0000-0000-0000-000000000502' and brand_id = (select yazz from ids)) then
    raise exception 'FAIL: brand only save did not remove Yazz';
  end if;
  -- Trying to drop Hooch is refused and nothing changes.
  begin
    perform public.save_stockist('00000000-0000-0000-0000-000000000502', null, array[(select yazz from ids)]);
    raise exception 'FAIL: sales rep (Yazz) removed Hooch through save_stockist';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.stockist_brands where stockist_id = '00000000-0000-0000-0000-000000000502') <> 1 then
    raise exception 'FAIL: a refused brand change was half applied';
  end if;

  -- A stockist with no brands yet stays editable by the person who created it.
  new_id := public.save_stockist(null, jsonb_build_object('name', 'Rep unbranded', 'outlet_type', 'other', 'region_id', (select ashanti from ids), 'town', 'Ejisu'), '{}');
  update public.stockists set town = 'Ejisu town' where id = new_id;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: creator could not edit their stockist with no brands'; end if;

  -- Delete a Yazz only stockist: links and notes go with it.
  delete from public.stockists where id = '00000000-0000-0000-0000-000000000501';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: sales rep (Yazz) could not delete a Yazz only stockist'; end if;
  raise notice 'PASS: save_stockist saves details, notes and brands together and undoes refused saves';
end $$;

reset role;
do $$
begin
  if exists (select 1 from public.stockist_brands where stockist_id = '00000000-0000-0000-0000-000000000501')
     or exists (select 1 from public.stockist_notes where stockist_id = '00000000-0000-0000-0000-000000000501') then
    raise exception 'FAIL: deleting a stockist left links or notes behind';
  end if;
  raise notice 'PASS: deleting a stockist leaves no orphan links or notes';
end $$;

-- Another rep cannot edit the first rep's unbranded stockist --------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a8';
do $$
declare n int;
begin
  update public.stockists set town = 'Hacked' where name = 'Rep unbranded';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: another rep edited a stockist with no brands they did not create'; end if;
  update public.stockists set town = 'Hacked' where id = '00000000-0000-0000-0000-000000000504';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: rep without brands edited a stockist with no brands made by someone else'; end if;
  begin
    insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-000000000504', (select yazz from ids));
    raise exception 'FAIL: rep without brands linked Yazz';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: reps cannot edit unbranded stockists they did not create, nor link brands they lack';
end $$;
reset role;

-- Brand link rules: never the corporate brand ------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a1';
do $$
declare n int;
begin
  begin
    insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-000000000504', (select lexta from ids));
    raise exception 'FAIL: the corporate Lexta brand was linked to a stockist';
  exception when check_violation then null;
  end;
  begin
    perform public.save_stockist('00000000-0000-0000-0000-000000000504', null, array[(select lexta from ids)]);
    raise exception 'FAIL: save_stockist linked the corporate brand';
  exception when check_violation then null;
  end;
  -- Admin edits and deletes any stockist and links any product brand.
  update public.stockists set town = 'Tema Community 1' where id = '00000000-0000-0000-0000-000000000502';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not edit a shared stockist'; end if;
  insert into public.stockist_brands (stockist_id, brand_id) values ('00000000-0000-0000-0000-000000000504', (select linzzy from ids));
  delete from public.stockists where id = '00000000-0000-0000-0000-000000000505';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not delete a stockist'; end if;
  raise notice 'PASS: corporate brand is never linked; admin manages every stockist';
end $$;

-- Data checks -----------------------------------------------------------------------------
do $$
begin
  begin
    update public.stockists set latitude = 95, longitude = 0 where id = '00000000-0000-0000-0000-000000000502';
    raise exception 'FAIL: latitude 95 accepted';
  exception when check_violation then null;
  end;
  begin
    update public.stockists set latitude = 5.6, longitude = null where id = '00000000-0000-0000-0000-000000000502';
    raise exception 'FAIL: latitude without longitude accepted';
  exception when check_violation then null;
  end;
  begin
    update public.stockists set outlet_type = 'kiosk' where id = '00000000-0000-0000-0000-000000000502';
    raise exception 'FAIL: unknown outlet type accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.stockists (name, outlet_type, region_id, town) values ('test shared MARKET ', 'supermarket', (select accra from ids), 'tema community 1');
    raise exception 'FAIL: duplicate stockist accepted';
  exception when unique_violation then null;
  end;
  raise notice 'PASS: map position, outlet type and duplicate checks hold';
end $$;

-- Regions: read only for staff, managed by admin ----------------------------------------------
do $$
begin
  insert into public.regions (slug, name, is_in_ghana, sort_order) values ('test-region', 'Test region', false, 999);
  delete from public.regions where slug = 'test-region';
  begin
    delete from public.regions where slug = 'ashanti';
    raise exception 'FAIL: a region in use was deleted';
  exception when foreign_key_violation then null;
  end;
  raise notice 'PASS: admin manages regions; a region in use cannot be deleted';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000005a3';
do $$
declare n int;
begin
  update public.regions set name = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: sales rep renamed regions'; end if;
  begin
    insert into public.regions (slug, name) values ('rep-region', 'Rep region');
    raise exception 'FAIL: sales rep added a region';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: regions are read only for everyone but admin';
end $$;

-- CSV import: all or nothing, errors name the row -----------------------------------------------
do $$
declare before_count int; added int;
begin
  select count(*) into before_count from public.stockists;
  begin
    perform public.import_stockists(jsonb_build_array(
      jsonb_build_object('line', 2, 'details', jsonb_build_object('name', 'Import one', 'outlet_type', 'pharmacy', 'region_id', (select accra from ids), 'town', 'Accra'), 'brand_ids', jsonb_build_array((select yazz from ids))),
      jsonb_build_object('line', 3, 'details', jsonb_build_object('name', 'Import two', 'outlet_type', 'pharmacy', 'region_id', (select accra from ids), 'town', 'Accra'), 'brand_ids', jsonb_build_array((select hooch from ids)))
    ));
    raise exception 'FAIL: import with a refused row went through';
  exception when insufficient_privilege then
    if sqlerrm not like 'row 3:%' then raise exception 'FAIL: import error does not name the row: %', sqlerrm; end if;
  end;
  if (select count(*) from public.stockists) <> before_count then
    raise exception 'FAIL: a failed import added some rows';
  end if;

  added := public.import_stockists(jsonb_build_array(
    jsonb_build_object('line', 2, 'details', jsonb_build_object('name', 'Import one', 'outlet_type', 'pharmacy', 'region_id', (select accra from ids), 'town', 'Accra', 'latitude', '5.6', 'longitude', '-0.2'), 'brand_ids', jsonb_build_array((select yazz from ids))),
    jsonb_build_object('line', 3, 'details', jsonb_build_object('name', 'Import two', 'outlet_type', 'open_market', 'region_id', (select ashanti from ids), 'town', 'Kumasi'), 'brand_ids', jsonb_build_array((select yazz from ids)))
  ));
  if added <> 2 or (select count(*) from public.stockists) <> before_count + 2 then
    raise exception 'FAIL: valid import did not add 2 rows';
  end if;

  begin
    perform public.import_stockists(jsonb_build_array(
      jsonb_build_object('line', 4, 'details', jsonb_build_object('name', 'Import one', 'outlet_type', 'pharmacy', 'region_id', (select accra from ids), 'town', 'Accra'), 'brand_ids', jsonb_build_array((select yazz from ids)))
    ));
    raise exception 'FAIL: importing the same shop twice was accepted';
  exception when unique_violation then
    if sqlerrm not like 'row 4:%' then raise exception 'FAIL: duplicate error does not name the row: %', sqlerrm; end if;
  end;
  raise notice 'PASS: import is all or nothing and names the failing row';
end $$;
reset role;

-- Helper functions are closed to anon -------------------------------------------------------
do $$
begin
  if has_function_privilege('anon', 'public.can_edit_stockist(uuid)', 'execute')
     or has_function_privilege('anon', 'public.can_view_stockists()', 'execute')
     or has_function_privilege('anon', 'public.can_link_stockist_brand(uuid)', 'execute')
     or has_function_privilege('anon', 'public.save_stockist(uuid, jsonb, uuid[])', 'execute')
     or has_function_privilege('authenticated', 'public.check_stockist_brand()', 'execute')
     or has_function_privilege('authenticated', 'public.set_stockist_authors()', 'execute') then
    raise exception 'FAIL: a stockist helper function is callable by anon or a trigger function by authenticated';
  end if;
  raise notice 'PASS: stockist helper functions are closed to anon';
end $$;

rollback;
