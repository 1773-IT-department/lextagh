-- 0025_product_availability_and_page_fields: availability status and the brand product page fields in Product Management.
--
-- Why (Desmond approved 17 November 2026, Drive requests P2): Lexta's Drive asks that "all product cards ... pull from the
-- shared Lexta catalogue ... with brand, category, variant, pack size, approved description, image and availability
-- status" (lexta/website-copy.md:52), and the Linzzy Drive product pages carry a headline, recommended use, skin
-- sensitivity precautions, a "Linzzy says" line and related articles. Until now those lived only in code
-- (apps/linzzy/content/catalogue.ts; the Yazz coming soon items in apps/yazz/content/catalogue.ts).
--
-- Adds to public.products:
--   availability       available | coming_soon | discontinued (default available, so every existing row keeps showing as today)
--   headline           the product page headline
--   recommended_use    who or when the product is for
--   precautions        sensitivity and safety precautions
--   brand_says         the brand's sign off line ("Linzzy says")
--   related_articles   slugs of the brand site's articles that go with the product (Linzzy Tips & Advice)
-- Backfills the six Linzzy Drive rows from apps/linzzy/content/catalogue.ts (generated from the catalogue, so the database
-- and the site's fallback match exactly). Rows staff have saved in Product Management are never overwritten
-- ("updated_by is null"), as in 0022 to 0024. Idempotent.
--
-- Row Level Security: unchanged. The existing products policies cover every column (visitors read published rows of
-- active brands; admin and marketing edit their brands; management reads). No view or function selects a fixed column
-- list that this changes. Not applied by this branch: the lead applies it.

alter table public.products
  add column if not exists availability text not null default 'available',
  add column if not exists headline text,
  add column if not exists recommended_use text,
  add column if not exists precautions text,
  add column if not exists brand_says text,
  add column if not exists related_articles text[] not null default '{}';

alter table public.products drop constraint if exists products_availability_check;
alter table public.products add constraint products_availability_check
  check (availability in ('available', 'coming_soon', 'discontinued'));

alter table public.products drop constraint if exists products_page_fields_check;
alter table public.products add constraint products_page_fields_check check (
  (headline is null or length(btrim(headline)) between 1 and 200)
  and (recommended_use is null or length(recommended_use) <= 1000)
  and (precautions is null or length(precautions) <= 3000)
  and (brand_says is null or length(btrim(brand_says)) between 1 and 300)
);

-- Up to 12 article slugs, each in the same form as a product slug; no empty or null entries.
-- Immutable helper, so the check can look at every entry. Callable by everyone: it only tests the text it is given.
create or replace function public.is_slug_list(items text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(s is not null and length(s) <= 120 and s ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), true)
  from unnest(items) as s;
$$;

grant execute on function public.is_slug_list(text[]) to anon, authenticated;

alter table public.products drop constraint if exists products_related_articles_check;
alter table public.products add constraint products_related_articles_check check (
  cardinality(related_articles) <= 12 and public.is_slug_list(related_articles)
);

comment on column public.products.availability is 'available, coming_soon (badge, no Where to buy) or discontinued (hidden on the websites)';
comment on column public.products.related_articles is 'Slugs of brand site articles shown with the product (Linzzy Tips & Advice)';

-- Linzzy backfill: generated from apps/linzzy/content/catalogue.ts (headline, recommended, sensitivity, says, reads).
update public.products p
set headline = v.headline,
    recommended_use = v.recommended_use,
    precautions = v.precautions,
    brand_says = v.brand_says,
    related_articles = v.related_articles
from public.brands b,
  (values
  ('heavy-flow-sanitary-towels', 'Extra Care for Your Heavier Days', 'Heavier menstrual flow, subject to individual absorbency needs.', 'Discontinue use if itching, burning, redness or irritation develops. Individuals with known sensitivities to adhesives, fragrances or other materials should review the product''s ingredient and material information before use.', 'Your heavier days deserve thoughtful care.', array['know-your-flow', 'period-hygiene-101']::text[]),
  ('cool-mint-sanitary-towels', 'A Refreshing Choice for Your Period Routine', 'Menstrual care for consumers who prefer this variant and tolerate its cooling sensation.', 'Cooling ingredients or sensations may cause discomfort in sensitive individuals. Stop use immediately if irritation, burning or an uncomfortable cooling sensation occurs. Do not use on already irritated or broken skin.', 'A little freshness, a little more confidence.', array['know-your-flow', 'period-care-in-warm-weather']::text[]),
  ('extra-long-sanitary-towels', 'Extended Coverage for the Moments That Matter', 'Menstrual care when extended coverage is preferred, including rest and overnight routines. Change as needed and do not rely on a single towel for prolonged periods.', 'Stop use if discomfort, irritation or skin reactions occur. Check the product materials if you have known sensitivities.', 'More coverage for greater peace of mind.', array['long-days-busy-schedules', 'know-your-flow']::text[]),
  ('panty-liners', 'Little Essentials for Everyday Care', 'Light spotting or occasional everyday moisture management. Not intended to replace sanitary towels during moderate or heavy menstrual bleeding.', 'Prolonged moisture exposure or sensitivity to product materials may cause irritation. Change liners when needed and discontinue use if discomfort occurs.', 'Everyday care, made simple.', array['panty-liners-explained']::text[]),
  ('baby-diapers', 'Made for Little Moves and Everyday Comfort', null, 'A baby''s skin can react to moisture, friction or certain product materials. Check the diaper area regularly and change wet or soiled diapers promptly. Discontinue use if a suspected product-related reaction develops. Consult a healthcare professional for persistent or worsening irritation. Never leave your baby unattended during a diaper change.', 'Little moves, loving care, brighter beginnings.', array['is-your-baby-wearing-the-right-diaper-size', 'diaper-changing-made-easier']::text[]),
  ('baby-wipes', 'A Fresh Touch for Everyday Baby Care', null, 'Some babies may be sensitive to fragrances, preservatives or other ingredients in wipes. Always review the product''s ingredient information. For babies with sensitive or irritated skin, plain water and a soft cloth may be preferable. Discontinue use if redness, itching or irritation occurs. Avoid contact with eyes, mouth and broken skin. Never flush wipes down the toilet.', 'A gentle touch for life''s little messes.', array['baby-wipes-101', 'the-perfect-diaper-bag']::text[])
  ) as v(slug, headline, recommended_use, precautions, brand_says, related_articles)
where b.id = p.brand_id and b.slug = 'linzzy' and p.slug = v.slug and p.updated_by is null;
