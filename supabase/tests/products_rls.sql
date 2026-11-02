-- Product management: Row Level Security and storage policy tests.
-- Run with: bash supabase/tests/local/run.sh products_rls
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Fixtures (as the database owner) ---------------------------------------------------
-- People. Profiles are created by the auth trigger from 0001 using app_metadata.role.
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local',     '{"role":"admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'mgmt@test.local',      '{"role":"management"}'),
  ('00000000-0000-0000-0000-00000000000c', 'mkt.yazz@test.local',  '{"role":"marketing"}'),
  ('00000000-0000-0000-0000-00000000000d', 'rep@test.local',       '{"role":"sales_rep"}'),
  ('00000000-0000-0000-0000-00000000000e', 'norole@test.local',    '{}'),
  ('00000000-0000-0000-0000-00000000000f', 'mkt.none@test.local',  '{"role":"marketing"}');

insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-00000000000c', id from public.brands where slug = 'yazz';

-- An inactive brand with a published product (must stay hidden from the public).
insert into public.brands (id, slug, name, is_active)
values ('00000000-0000-0000-0000-0000000000b1', 'retired-test', 'Retired test brand', false);

insert into public.products (id, brand_id, slug, name, is_published) values
  ('00000000-0000-0000-0000-000000000101', (select id from public.brands where slug = 'yazz'),  'draft-yazz-test',  'Draft Yazz test',  false),
  ('00000000-0000-0000-0000-000000000102', (select id from public.brands where slug = 'hooch'), 'draft-hooch-test', 'Draft Hooch test', false),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-0000000000b1', 'retired-published', 'Retired published', true);

insert into public.product_skus (product_id, sku_code, pack_size_label, is_active) values
  ('00000000-0000-0000-0000-000000000101', 'TEST-DRAFT-1', '1 pack', true),
  ((select id from public.products where slug = 'toothpaste'), 'TEST-INACTIVE-1', '1 tube', false);

insert into public.product_images (product_id, external_url, alt_text) values
  ('00000000-0000-0000-0000-000000000101', 'https://example.com/draft.png', 'Draft image');

insert into storage.objects (bucket_id, name) values
  ('product-images', 'hooch/00000000-0000-0000-0000-000000000102/existing.png');

-- Seed sanity ------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from public.products p join public.brands b on b.id = p.brand_id
   where b.slug in ('yazz', 'linzzy', 'hooch') and p.is_published;
  if n <> 14 then raise exception 'FAIL: expected 14 seeded published products, got %', n; end if;
  if exists (select 1 from public.product_images i where i.product_id in (select id from public.products where slug not like '%test%' and slug <> 'retired-published') and btrim(i.alt_text) = '') then
    raise exception 'FAIL: seeded image without alt text';
  end if;
  if not exists (select 1 from storage.buckets where id = 'product-images' and public) then
    raise exception 'FAIL: product-images bucket missing or not public';
  end if;
  raise notice 'PASS: seed has 14 published products and a public product-images bucket';
end $$;

-- The seed is idempotent: applying it again adds nothing.
create temp table seed_counts as
  select (select count(*) from public.products) p, (select count(*) from public.product_skus) s, (select count(*) from public.product_images) i;
\ir ../migrations/0004_seed_products_from_prototype.sql
do $$
begin
  if (select p from seed_counts) <> (select count(*) from public.products)
     or (select s from seed_counts) <> (select count(*) from public.product_skus)
     or (select i from seed_counts) <> (select count(*) from public.product_images) then
    raise exception 'FAIL: running the seed twice added rows';
  end if;
  raise notice 'PASS: seed migration is idempotent';
end $$;

-- Website visitors (anon) --------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';

do $$
begin
  if exists (select 1 from public.products where not is_published) then
    raise exception 'FAIL: anon sees unpublished products';
  end if;
  if exists (select 1 from public.products where slug = 'retired-published') then
    raise exception 'FAIL: anon sees products of an inactive brand';
  end if;
  if (select count(*) from public.products) <> 14 then
    raise exception 'FAIL: anon should see the 14 published products, sees %', (select count(*) from public.products);
  end if;
  if exists (select 1 from public.product_skus where sku_code in ('TEST-DRAFT-1', 'TEST-INACTIVE-1')) then
    raise exception 'FAIL: anon sees SKUs of drafts or inactive SKUs';
  end if;
  if exists (select 1 from public.product_images where external_url = 'https://example.com/draft.png') then
    raise exception 'FAIL: anon sees images of draft products';
  end if;
  if (select count(*) from public.product_skus) = 0 or (select count(*) from public.product_images) = 0 then
    raise exception 'FAIL: anon cannot see SKUs or images of published products';
  end if;
  if exists (select 1 from storage.objects where bucket_id = 'product-images') then
    raise exception 'FAIL: anon can list the product-images bucket';
  end if;
  raise notice 'PASS: anon reads only published products of active brands, their active SKUs and images';
end $$;

do $$
declare n int;
begin
  begin
    insert into public.products (brand_id, slug, name) values ((select id from public.brands where slug = 'yazz'), 'anon-insert', 'Anon');
    raise exception 'FAIL: anon inserted a product';
  exception when insufficient_privilege then null;
  end;
  update public.products set name = 'Hacked' where slug = 'toothpaste';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: anon updated a product'; end if;
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', 'yazz/00000000-0000-0000-0000-000000000101/anon.png');
    raise exception 'FAIL: anon uploaded a file';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon cannot write products or upload files';
end $$;

reset role;

-- Marketing with Yazz access ----------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';

do $$
declare n int;
begin
  if not exists (select 1 from public.products where id = '00000000-0000-0000-0000-000000000101') then
    raise exception 'FAIL: marketing (Yazz) cannot see a Yazz draft';
  end if;
  if exists (select 1 from public.products where id = '00000000-0000-0000-0000-000000000102') then
    raise exception 'FAIL: marketing (Yazz) sees a Hooch draft';
  end if;
  if not exists (select 1 from public.product_skus where sku_code = 'TEST-INACTIVE-1') then
    raise exception 'FAIL: marketing (Yazz) cannot see an inactive Yazz SKU';
  end if;

  update public.products set short_description = 'Edited by marketing' where id = '00000000-0000-0000-0000-000000000101';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: marketing (Yazz) could not edit a Yazz product'; end if;
  if (select updated_by from public.products where id = '00000000-0000-0000-0000-000000000101') <> '00000000-0000-0000-0000-00000000000c' then
    raise exception 'FAIL: updated_by not set from the session';
  end if;

  insert into public.products (brand_id, slug, name) values ((select id from public.brands where slug = 'yazz'), 'mkt-new', 'New by marketing');
  insert into public.product_skus (product_id, sku_code, pack_size_label) values ('00000000-0000-0000-0000-000000000101', 'TEST-MKT-1', '2 packs');
  insert into public.product_images (product_id, storage_path, alt_text)
    values ('00000000-0000-0000-0000-000000000101', 'yazz/00000000-0000-0000-0000-000000000101/a.png', 'Test');

  -- Hooch: published product is readable, but no writes.
  update public.products set name = 'Hacked' where slug = 'choco-flakes';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing (Yazz) edited a Hooch product'; end if;
  delete from public.products where slug = 'choco-flakes';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing (Yazz) deleted a Hooch product'; end if;
  begin
    insert into public.products (brand_id, slug, name) values ((select id from public.brands where slug = 'hooch'), 'mkt-hooch', 'Nope');
    raise exception 'FAIL: marketing (Yazz) created a Hooch product';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.product_skus (product_id, sku_code, pack_size_label)
      values ((select id from public.products where slug = 'choco-flakes'), 'TEST-MKT-HOOCH', '1');
    raise exception 'FAIL: marketing (Yazz) added a SKU to a Hooch product';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.products set brand_id = (select id from public.brands where slug = 'hooch') where id = '00000000-0000-0000-0000-000000000101';
    raise exception 'FAIL: marketing (Yazz) moved a product to Hooch';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: marketing with Yazz access edits Yazz and cannot touch Hooch';
end $$;

-- Storage as marketing (Yazz)
do $$
declare n int;
begin
  insert into storage.objects (bucket_id, name) values ('product-images', 'yazz/00000000-0000-0000-0000-000000000101/photo.png');
  if not exists (select 1 from storage.objects where name = 'yazz/00000000-0000-0000-0000-000000000101/photo.png') then
    raise exception 'FAIL: marketing (Yazz) cannot list its own upload';
  end if;
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', 'hooch/00000000-0000-0000-0000-000000000102/photo.png');
    raise exception 'FAIL: marketing (Yazz) uploaded into a Hooch folder';
  exception when insufficient_privilege then null;
  end;
  begin
    -- Yazz folder but a Hooch product id: the path must match the product's real brand.
    insert into storage.objects (bucket_id, name) values ('product-images', 'yazz/00000000-0000-0000-0000-000000000102/photo.png');
    raise exception 'FAIL: marketing (Yazz) uploaded for a Hooch product under the yazz folder';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', 'yazz/not-a-uuid/photo.png');
    raise exception 'FAIL: upload with a malformed path was accepted';
  exception when insufficient_privilege then null;
  end;
  delete from storage.objects where name = 'hooch/00000000-0000-0000-0000-000000000102/existing.png';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing (Yazz) deleted a Hooch file'; end if;
  delete from storage.objects where name = 'yazz/00000000-0000-0000-0000-000000000101/photo.png';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: marketing (Yazz) could not delete its own file'; end if;
  raise notice 'PASS: storage lets marketing manage Yazz product files only';
end $$;

reset role;

-- Marketing with no brand access -------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
do $$
declare n int;
begin
  if exists (select 1 from public.products where not is_published) then
    raise exception 'FAIL: marketing without brands sees drafts';
  end if;
  update public.products set name = 'Hacked' where slug = 'toothpaste';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: marketing without brands edited a product'; end if;
  raise notice 'PASS: marketing without brand access is read only on published products';
end $$;
reset role;

-- Management: reads everything, writes nothing -------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
declare n int;
begin
  if not exists (select 1 from public.products where id = '00000000-0000-0000-0000-000000000102') then
    raise exception 'FAIL: management cannot see a Hooch draft';
  end if;
  if not exists (select 1 from public.products where id = '00000000-0000-0000-0000-000000000101') then
    raise exception 'FAIL: management cannot see a Yazz draft';
  end if;
  update public.products set name = 'Hacked' where id = '00000000-0000-0000-0000-000000000101';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management updated a product'; end if;
  update public.product_skus set pack_size_label = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management updated SKUs'; end if;
  delete from public.product_images;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management deleted images'; end if;
  begin
    insert into public.products (brand_id, slug, name) values ((select id from public.brands where slug = 'yazz'), 'mgmt-new', 'Nope');
    raise exception 'FAIL: management created a product';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', 'yazz/00000000-0000-0000-0000-000000000101/mgmt.png');
    raise exception 'FAIL: management uploaded a file';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: management reads all products and cannot write';
end $$;
reset role;

-- Sales rep: published only, no writes ----------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
do $$
declare n int;
begin
  if (select count(*) from public.products) <> 14 or exists (select 1 from public.products where not is_published) then
    raise exception 'FAIL: sales rep should see exactly the 14 published products';
  end if;
  update public.products set name = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: sales rep updated products'; end if;
  raise notice 'PASS: sales rep reads published products only and cannot write';
end $$;
reset role;

-- Signed in with no role: nothing unpublished ---------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
do $$
declare n int;
begin
  if exists (select 1 from public.products where not is_published) then
    raise exception 'FAIL: user with no role sees unpublished products';
  end if;
  if exists (select 1 from public.product_skus where sku_code in ('TEST-DRAFT-1', 'TEST-INACTIVE-1')) then
    raise exception 'FAIL: user with no role sees draft or inactive SKUs';
  end if;
  if exists (select 1 from public.products where slug = 'retired-published') then
    raise exception 'FAIL: user with no role sees products of an inactive brand';
  end if;
  update public.products set name = 'Hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user with no role updated products'; end if;
  raise notice 'PASS: user with no role sees nothing unpublished and cannot write';
end $$;
reset role;

-- Admin: everything, every brand ----------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare n int;
begin
  update public.products set is_published = true where id = '00000000-0000-0000-0000-000000000102';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not publish a Hooch product'; end if;
  insert into storage.objects (bucket_id, name) values ('product-images', 'hooch/00000000-0000-0000-0000-000000000102/admin.png');
  raise notice 'PASS: admin can edit and upload for any brand';
end $$;
reset role;

-- Helper functions are not callable by anon --------------------------------------------------
do $$
begin
  if has_function_privilege('anon', 'public.can_edit_brand_products(uuid)', 'execute')
     or has_function_privilege('anon', 'public.can_view_brand_products(uuid)', 'execute')
     or has_function_privilege('anon', 'public.can_manage_product_object(text)', 'execute') then
    raise exception 'FAIL: anon can execute product helper functions';
  end if;
  raise notice 'PASS: product helper functions are closed to anon';
end $$;

rollback;
