-- 0017_hooch_catalogue_products: Lexta's real Hooch catalogue in Product Management, replacing the prototype rows.
--
-- Applied to the live project (Lexta Gh) on 2026-11-14 with Desmond's approval, after a read-only check showed the
-- 3 prototype Hooch rows unedited by staff and codes TBC-HOOCH-101/102 unused.
--
-- Why: the Hooch products seeded from the Lexta prototype (0004) carry claims no Lexta document makes ("sun ripened",
-- "toasted for a crunch that survives the milk", "low in fat", "high energy grain") and photos hotlinked from a
-- third-party shop (chopboxonline.com). Lexta's Drive content ("Hooch Foods website content.docx", Hooch Tab Content,
-- Our Products) gives two products: Hooch® Cornflakes (500g, 10 x 50g) and Hooch® Frosted Flakes (375g, 10 x 37.5g).
-- They are structured in apps/hooch/content/catalogue.ts; this migration writes the same words.
--
-- What it changes (Hooch rows only; no other brand, table, policy or function is touched):
--   1. Unpublishes the prototype rows "Super Crunchy Corn Flakes" (super-crunchy-corn-flakes) and "Choco Flakes"
--      (choco-flakes, in no Lexta document: to be confirmed with Lexta). They are kept, with their SKUs and images, so
--      past orders, complaints and leads that point at them stay intact. A row staff have saved is left as it is.
--   2. Writes Lexta's two cereals, published, in Lexta's order. The prototype "Frosted Flakes" row has the same slug,
--      so it is corrected in place (same id). A row with one of these slugs that staff have already saved in Product
--      Management (updated_by is set; the trigger from 0003 records who saved it, and it is null for rows written only
--      by migrations) is left exactly as it is: its wording and its published state are not overwritten.
--   3. Their SKUs and pack sizes as Lexta wrote them (codes TBC-HOOCH-101 and 102 until Lexta sends real codes). The
--      prototype Frosted Flakes SKU TBC-HOOCH-002 (pack size "[PLACEHOLDER: ...]") is switched off in favour of 102.
--   4. One picture each, a shared photo file (/images/hooch/...; 0016 already allows site paths): a pack shot of the
--      real Hooch box made from Lexta's own Hooch artwork (Desmond, 14 November 2026: realistic, with the actual product,
--      until Lexta sends their images), shipped in the public folder of the Lexta site, the portal and the Hooch site.
--
-- Row Level Security is unchanged: the existing product policies (0003) cover every row written here.
-- Idempotent: running it again changes nothing more, and it never overwrites a product row staff have saved.
-- Before applying to the live project, check the live Hooch rows read-only:
--   select slug, is_published, updated_at, updated_by from public.products
--   where brand_id = (select id from public.brands where slug = 'hooch') order by sort_order;

-- 1. The prototype rows leave the websites ------------------------------------------------------------------------
update public.products p
set is_published = false
from public.brands b
where b.id = p.brand_id and b.slug = 'hooch' and p.slug in ('super-crunchy-corn-flakes', 'choco-flakes')
  and p.is_published and p.updated_by is null;

-- 2. Lexta's two Hooch cereals -------------------------------------------------------------------------------------
insert into public.products
  (brand_id, slug, name, category, short_description, long_description, key_features, usage_instructions, ingredients, is_published, sort_order)
select b.id, v.slug, v.name, v.category, v.short_description, v.long_description, v.key_features, v.usage_instructions, v.ingredients, true, v.sort_order
from (values
  ('cornflakes', 'Hooch® Cornflakes', 'Breakfast cereal',
   'The golden crunch of Hooch® Cornflakes: 500g, in 10 convenient packs of 50g.',
   'Start your morning with the golden crunch of Hooch® Cornflakes. With its enjoyable crispy texture and convenient individual portions, it''s an easy breakfast option for the whole family. Each 500g product contains 10 smaller packs of 50g, allowing family members to prepare their own cereal portions with less measuring.',
   array['Convenient individual portions', 'Quick and simple to prepare', 'Enjoyable crunchy texture', 'Easy to combine with milk and fruit', 'Practical for family breakfast planning'],
   'Pour one individual pack into a bowl, add your preferred milk and enjoy. Add fruit or other toppings for variety.',
   'Enriched with vitamins. Corn grits 92%, sugar, salt, acidity regulator: sodium phosphates, malt extract powder from barley. Vitamins: Vit E, Thiamine B1, Riboflavin B2, Niacin B3, Pantothenic Acid B5, Vit B6, Vit B12, Folic Acid.',
   10),
  ('frosted-flakes', 'Hooch® Frosted Flakes', 'Breakfast cereal',
   'A sweet frosted finish on a crispy flake: 375g, in 10 convenient packs of 37.5g.',
   'Add a little sweetness to your breakfast routine with Hooch® Frosted Flakes. Combining a crispy texture with a sweet frosted finish, it''s a delightful choice for families who enjoy a sweeter cereal. Each 375g product contains 10 smaller packs of 37.5g, conveniently portioned for everyday breakfast preparation.',
   array['Sweet frosted taste', 'Crispy, enjoyable texture', 'Convenient individual packs', 'Quick preparation for busy mornings', 'Enjoyable as cereal or a snack'],
   'Pour one pack into a bowl, add milk and serve. Pair with fresh fruit to create a more varied breakfast.',
   'Enriched with vitamins. Corn grits 75%, sugar [PLACEHOLDER: confirm the sugar figure and unit, given as "23"], salt, acidity regulator: sodium phosphates, malt extract powder from barley. Vitamins: Vit E, Thiamine B1, Riboflavin B2, Niacin B3, Pantothenic Acid B5, Vit B6, Vit B12, Folic Acid.',
   20)
) as v(slug, name, category, short_description, long_description, key_features, usage_instructions, ingredients, sort_order)
join public.brands b on b.slug = 'hooch'
on conflict (brand_id, slug) do update set
  name = excluded.name,
  category = excluded.category,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  key_features = excluded.key_features,
  usage_instructions = excluded.usage_instructions,
  ingredients = excluded.ingredients,
  is_published = true,
  sort_order = excluded.sort_order
where products.updated_by is null;

-- 3. SKUs and pack sizes -------------------------------------------------------------------------------------------
update public.product_skus s
set is_active = false
from public.products p join public.brands b on b.id = p.brand_id
where s.product_id = p.id and b.slug = 'hooch' and p.slug = 'frosted-flakes' and s.sku_code = 'TBC-HOOCH-002'
  and s.is_active and s.pack_size_label like '[PLACEHOLDER:%';

insert into public.product_skus (product_id, sku_code, variant_name, pack_size_label, sort_order)
select p.id, v.sku_code, null, v.pack_size_label, 10
from (values
  ('cornflakes', 'TBC-HOOCH-101', '500g: 10 x 50g individual packs'),
  ('frosted-flakes', 'TBC-HOOCH-102', '375g: 10 x 37.5g individual packs')
) as v(product_slug, sku_code, pack_size_label)
join public.brands b on b.slug = 'hooch'
join public.products p on p.brand_id = b.id and p.slug = v.product_slug
on conflict (sku_code) do nothing;

-- 4. Pictures (shared photo files in every app) ---------------------------------------------------------------------
insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
select p.id, v.url, v.alt_text, 10,
       not exists (select 1 from public.product_images i where i.product_id = p.id and i.is_primary)
from (values
  ('cornflakes', '/images/hooch/cornflakes-bowl.webp', 'A box of Hooch® Cornflakes, 500g, with fresh strawberries'),
  ('frosted-flakes', '/images/hooch/frosted-flakes-bowl.webp', 'A box of Hooch® Frosted Flakes with fresh strawberries')
) as v(product_slug, url, alt_text)
join public.brands b on b.slug = 'hooch'
join public.products p on p.brand_id = b.id and p.slug = v.product_slug
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.external_url = v.url
);
