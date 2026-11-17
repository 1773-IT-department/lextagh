-- Product availability and product page fields (0025): defaults, constraints, Linzzy backfill and who can edit them.
-- Run with: bash supabase/tests/local/run.sh products_page_fields
-- Everything happens inside one transaction that is rolled back at the end.

begin;

-- Fixtures (as the database owner) ---------------------------------------------------
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-0000000025a1', 'admin.pf@test.local',     '{"role":"admin"}'),
  ('00000000-0000-0000-0000-0000000025a2', 'mgmt.pf@test.local',      '{"role":"management"}'),
  ('00000000-0000-0000-0000-0000000025a3', 'mkt.yazz.pf@test.local',  '{"role":"marketing"}'),
  ('00000000-0000-0000-0000-0000000025a4', 'rep.pf@test.local',       '{"role":"sales_rep"}');

insert into public.profile_brands (profile_id, brand_id)
select '00000000-0000-0000-0000-0000000025a3', id from public.brands where slug = 'yazz';

insert into public.products (id, brand_id, slug, name, is_published) values
  ('00000000-0000-0000-0000-000000002501', (select id from public.brands where slug = 'yazz'),  'pf-yazz-test',  'PF Yazz test',  true),
  ('00000000-0000-0000-0000-000000002502', (select id from public.brands where slug = 'hooch'), 'pf-hooch-test', 'PF Hooch test', true);

-- Columns and defaults -----------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.products where availability <> 'available') then
    raise exception 'FAIL: existing products should all be available after 0025';
  end if;
  if exists (select 1 from public.products where related_articles is null) then
    raise exception 'FAIL: related_articles should default to an empty list';
  end if;
  if (select availability from public.products where id = '00000000-0000-0000-0000-000000002501') <> 'available' then
    raise exception 'FAIL: a new product should default to available';
  end if;
  raise notice 'PASS: every product defaults to available with no related articles';
end $$;

-- Linzzy backfill (matches apps/linzzy/content/catalogue.ts) -----------------------------
do $$
declare r record;
begin
  select p.* into r from public.products p join public.brands b on b.id = p.brand_id
   where b.slug = 'linzzy' and p.slug = 'heavy-flow-sanitary-towels';
  if r.headline is distinct from 'Extra Care for Your Heavier Days'
     or r.recommended_use is distinct from 'Heavier menstrual flow, subject to individual absorbency needs.'
     or r.brand_says is distinct from 'Your heavier days deserve thoughtful care.'
     or r.related_articles is distinct from array['know-your-flow', 'period-hygiene-101']
     or r.precautions not like 'Discontinue use if itching, burning, redness or irritation develops. Individuals with known%' then
    raise exception 'FAIL: Heavy Flow page fields do not match the catalogue: %', row_to_json(r);
  end if;
  select p.* into r from public.products p join public.brands b on b.id = p.brand_id
   where b.slug = 'linzzy' and p.slug = 'baby-diapers';
  if r.recommended_use is not null or r.headline is distinct from 'Made for Little Moves and Everyday Comfort' then
    raise exception 'FAIL: Baby Diapers page fields do not match the catalogue';
  end if;
  if (select count(*) from public.products p join public.brands b on b.id = p.brand_id
       where b.slug = 'linzzy' and p.headline is not null) <> 6 then
    raise exception 'FAIL: expected six Linzzy rows with a headline';
  end if;
  if exists (select 1 from public.products p join public.brands b on b.id = p.brand_id
              where b.slug <> 'linzzy' and (p.headline is not null or p.brand_says is not null or cardinality(p.related_articles) > 0)) then
    raise exception 'FAIL: the backfill touched another brand';
  end if;
  raise notice 'PASS: the six Linzzy rows carry the catalogue page fields, other brands untouched';
end $$;

-- The backfill never overwrites a row staff have saved, and running it again changes nothing.
update public.products set headline = 'Staff headline', updated_by = '00000000-0000-0000-0000-0000000025a1'
 where slug = 'panty-liners' and brand_id = (select id from public.brands where slug = 'linzzy');
-- updated_by comes from the session trigger, so set it again as the owner without the trigger.
alter table public.products disable trigger products_set_updated_by;
update public.products set updated_by = '00000000-0000-0000-0000-0000000025a1'
 where slug = 'panty-liners' and brand_id = (select id from public.brands where slug = 'linzzy');
alter table public.products enable trigger products_set_updated_by;
create temp table pf_before as select id, headline, recommended_use, precautions, brand_says, related_articles from public.products;
\ir ../migrations/0025_product_availability_and_page_fields.sql
do $$
begin
  if (select headline from public.products where slug = 'panty-liners'
        and brand_id = (select id from public.brands where slug = 'linzzy')) <> 'Staff headline' then
    raise exception 'FAIL: the backfill overwrote a row staff saved';
  end if;
  if exists (
    select 1 from public.products p join pf_before b using (id)
     where (p.headline, p.recommended_use, p.precautions, p.brand_says, p.related_articles)
           is distinct from (b.headline, b.recommended_use, b.precautions, b.brand_says, b.related_articles)) then
    raise exception 'FAIL: running 0025 twice changed product page fields';
  end if;
  raise notice 'PASS: 0025 is idempotent and keeps staff edits';
end $$;

-- Constraints ---------------------------------------------------------------------------
do $$
declare bad text;
begin
  foreach bad in array array[
    $q$update public.products set availability = 'sold_out' where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set availability = null where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set headline = '   ' where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set headline = repeat('h', 201) where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set brand_says = repeat('s', 301) where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set recommended_use = repeat('r', 1001) where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set precautions = repeat('p', 3001) where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set related_articles = null where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set related_articles = array['Know Your Flow'] where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set related_articles = array['', 'know-your-flow'] where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set related_articles = array['know-your-flow', null] where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set related_articles = array['a,b'] where id = '00000000-0000-0000-0000-000000002501'$q$,
    $q$update public.products set related_articles = (select array_agg('a' || g) from generate_series(1, 13) g) where id = '00000000-0000-0000-0000-000000002501'$q$
  ] loop
    begin
      execute bad;
      raise exception 'FAIL: accepted %', bad;
    exception when check_violation or not_null_violation then null;
    end;
  end loop;
  update public.products set availability = 'coming_soon', related_articles = array['know-your-flow', 'a1']
   where id = '00000000-0000-0000-0000-000000002501';
  update public.products set availability = 'discontinued', related_articles = '{}'
   where id = '00000000-0000-0000-0000-000000002501';
  update public.products set availability = 'available' where id = '00000000-0000-0000-0000-000000002501';
  raise notice 'PASS: availability and page field constraints hold';
end $$;

-- Website visitors (anon) ----------------------------------------------------------------
set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare n int;
begin
  if (select availability from public.products where id = '00000000-0000-0000-0000-000000002501') <> 'available' then
    raise exception 'FAIL: anon cannot read availability of a published product';
  end if;
  update public.products set availability = 'discontinued' where id = '00000000-0000-0000-0000-000000002501';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: anon changed availability'; end if;
  raise notice 'PASS: visitors read availability and page fields but cannot change them';
end $$;
reset role;

-- Marketing (Yazz) edits Yazz only --------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000025a3';
do $$
declare n int;
begin
  update public.products set availability = 'coming_soon', headline = 'Soon', brand_says = 'Yazz says hello',
         related_articles = array['some-article']
   where id = '00000000-0000-0000-0000-000000002501';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: Yazz marketing could not set availability and page fields'; end if;
  update public.products set availability = 'discontinued' where id = '00000000-0000-0000-0000-000000002502';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: Yazz marketing changed a Hooch product'; end if;
  raise notice 'PASS: marketing edits availability and page fields of its own brands only';
end $$;
reset role;

-- Management and sales reps read only ---------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000025a2';
do $$
declare n int;
begin
  if (select availability from public.products where id = '00000000-0000-0000-0000-000000002501') <> 'coming_soon' then
    raise exception 'FAIL: management cannot read availability';
  end if;
  update public.products set availability = 'available', headline = null where id = '00000000-0000-0000-0000-000000002501';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: management changed availability'; end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000025a4', true);
  update public.products set availability = 'available' where id = '00000000-0000-0000-0000-000000002501';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: a sales rep changed availability'; end if;
  raise notice 'PASS: management and sales reps cannot change availability or page fields';
end $$;
reset role;

-- Admin edits any brand --------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000025a1';
do $$
declare n int;
begin
  update public.products set availability = 'discontinued', precautions = 'Keep dry.' where id = '00000000-0000-0000-0000-000000002502';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin could not change a Hooch product''s availability'; end if;
  raise notice 'PASS: admin edits availability and page fields';
end $$;
reset role;

-- Row Level Security still on ---------------------------------------------------------------
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.products'::regclass) then
    raise exception 'FAIL: products lost Row Level Security';
  end if;
  raise notice 'PASS: products keeps Row Level Security';
end $$;

rollback;
