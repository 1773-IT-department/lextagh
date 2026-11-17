-- 0024_hooch_products_strict_drive_text: the Hooch product rows use Lexta's own words, sentence for sentence.
--
-- Why: the strict source sweep (Desmond, 17 November 2026: only the Drive and the current website, nothing 1773
-- wrote) changed apps/hooch/content/catalogue.ts so every product line quotes docs/content/hooch/products.md.
-- The card summary (short_description) written by 0017 was 1773's own one line summary ("The golden crunch of Hooch®
-- Cornflakes: 500g, in 10 convenient packs of 50g."); it is now the first sentence of Lexta's description. The other
-- four text columns are rewritten from the same catalogue so the database and the site's fallback match exactly (they
-- already carry Lexta's words). Generated from the catalogue by a script, so the two cannot drift.
--
-- Only the two Hooch Drive rows, only these five columns. Rows staff have saved in Product Management are never
-- overwritten ("updated_by is null"). Idempotent. RLS unchanged. Not applied: Desmond applies it.
update public.products p
set short_description = v.short_description,
    long_description = v.long_description,
    key_features = v.key_features,
    usage_instructions = v.usage_instructions,
    ingredients = v.ingredients
from public.brands b,
  (values
  ('cornflakes', 'Start your morning with the golden crunch of Hooch® Cornflakes.', 'Start your morning with the golden crunch of Hooch® Cornflakes. With its enjoyable crispy texture and convenient individual portions, it''s an easy breakfast option for the whole family. Each 500g product contains 10 smaller packs of 50g, allowing family members to prepare their own cereal portions with less measuring.', array['Convenient individual portions', 'Quick and simple to prepare', 'Enjoyable crunchy texture', 'Easy to combine with milk and fruit', 'Practical for family breakfast planning']::text[], 'Pour one individual pack into a bowl, add your preferred milk and enjoy. Add fruit or other toppings for variety.', 'Enriched with vitamins. Corn grits 92%, sugar, salt, acidity regulator: sodium phosphates, malt extract powder from barley. Vitamins: Vit E, Thiamine B1, Riboflavin B2, Niacin B3, Pantothenic Acid B5, Vit B6, Vit B12, Folic Acid.'),
  ('frosted-flakes', 'Add a little sweetness to your breakfast routine with Hooch® Frosted Flakes.', 'Add a little sweetness to your breakfast routine with Hooch® Frosted Flakes. Combining a crispy texture with a sweet frosted finish, it''s a delightful choice for families who enjoy a sweeter cereal. Each 375g product contains 10 smaller packs of 37.5g, conveniently portioned for everyday breakfast preparation.', array['Sweet frosted taste', 'Crispy, enjoyable texture', 'Convenient individual packs', 'Quick preparation for busy mornings', 'Enjoyable as cereal or a snack']::text[], 'Pour one pack into a bowl, add milk and serve. Pair with fresh fruit to create a more varied breakfast.', 'Enriched with vitamins. Corn grits 75%, sugar [PLACEHOLDER: confirm the sugar figure and unit, given as "23"], salt, acidity regulator: sodium phosphates, malt extract powder from barley. Vitamins: Vit E, Thiamine B1, Riboflavin B2, Niacin B3, Pantothenic Acid B5, Vit B6, Vit B12, Folic Acid.')
  ) as v(slug, short_description, long_description, key_features, usage_instructions, ingredients)
where b.id = p.brand_id and b.slug = 'hooch' and p.slug = v.slug and p.updated_by is null;
