-- 0016_linzzy_catalogue_products: Lexta's real Linzzy catalogue in Product Management, replacing the prototype rows.
--
-- Applied to the live project (Lexta Gh) on 2026-11-14 with Desmond's approval, after a read-only check showed no
-- staff-edited Linzzy rows.
--
-- Why: the Linzzy products seeded from the Lexta prototype (0004) are umbrella cards with invented claims ("clinical anti
-- leak barriers", "fragrance free", "formulated for sensitive skin") and hotlinked photos from lextagh.com, one of them a
-- campaign poster. Lexta's Drive content ("Linzzy Website Content.docx", Linzzy Tab Content, 3. Products Page) gives six
-- real products. They are structured in apps/linzzy/content/catalogue.ts; this migration writes the same words.
--
-- What it changes (Linzzy rows only; no other brand, table policy or function is touched):
--   1. product_images.external_url may also be a path under /images/, besides an https link. The six pack shots are
--      shared photo files at /images/linzzy/<file>, shipped in the public folder of the Lexta site, the portal and the
--      Linzzy site alike, so every app shows them (SHARED_IMAGE_PATH in packages/db).
--   2. Unpublishes the prototype rows "Sanitary napkins" (sanitary-napkins) and "Baby care" (baby-care). They are kept,
--      with their SKUs and images, so past orders, complaints and leads that point at them stay intact.
--   3. Writes Lexta's six products: Heavy Flow, Cool Mint and Extra Long sanitary towels, Panty Liners, Baby Diapers and
--      Baby Wipes, published, in Lexta's order. The prototype "Baby wipes" row has the same slug as Lexta's Baby Wipes,
--      so it is corrected in place (same id): Drive name, texts and features replace the prototype wording.
--      A row with one of these slugs that staff have already saved in Product Management (updated_by is set; the
--      trigger from 0003 records who saved it, and is null for rows written only by migrations) is left exactly as
--      it is: its wording and its published state are not overwritten.
--   4. Their SKUs and pack sizes as Lexta wrote them (codes TBC-LINZZY-101 to 110, as in the catalogue, until Lexta
--      sends real codes; 107, the diaper sizes still to confirm, is left out so nobody can order a placeholder). The
--      prototype wipes SKU TBC-LINZZY-004 ("80 pieces", no variant) is switched off in favour of the three variants.
--   5. One pack shot each, a shared photo file (/images/linzzy/...), with Lexta's alt text.
--
-- Row Level Security is unchanged: the existing product policies (0003) cover every row written here.
-- Idempotent: running it again changes nothing more, and it never overwrites a product row staff have saved.
-- Before applying to the live project, check the live Linzzy rows read-only:
--   select slug, is_published, updated_at, updated_by from public.products
--   where brand_id = (select id from public.brands where slug = 'linzzy') order by sort_order;

-- 1. Images may be a site path ----------------------------------------------------------------------------------
alter table public.product_images drop constraint if exists product_images_external_url_check;
alter table public.product_images add constraint product_images_external_url_check check (
  external_url is null
  or external_url ~ '^https://'
  or (external_url ~ '^/images/[A-Za-z0-9._/-]+$' and external_url !~ '\.\.')
);

-- 2. The prototype umbrella rows leave the websites ----------------------------------------------------------------
update public.products p
set is_published = false
from public.brands b
where b.id = p.brand_id and b.slug = 'linzzy' and p.slug in ('sanitary-napkins', 'baby-care') and p.is_published;

-- 3. Lexta's six Linzzy products -----------------------------------------------------------------------------------
insert into public.products
  (brand_id, slug, name, category, short_description, long_description, key_features, usage_instructions, ingredients, is_published, sort_order)
select b.id, v.slug, v.name, v.category, v.short_description, v.long_description, v.key_features, v.usage_instructions, v.ingredients, true, v.sort_order
from (values
  ('heavy-flow-sanitary-towels', 'Linzzy Heavy Flow Sanitary Towels', 'Feminine care',
   'Higher-absorbency towels for heavier days: 12 towels of 290 mm, plus 2 complimentary panty liners.',
   'Some menstrual days require additional protection. Linzzy Heavy Flow Sanitary Towels are designed for women who prefer higher absorbency during heavier menstrual flow. Featuring the brand''s Absorb, Lock and Breathe design positioning, this variant offers a practical option for managing heavier days while supporting everyday comfort.',
   array['Higher-absorbency menstrual protection', '290 mm towel length', 'Designed for heavier-flow days', 'Includes complimentary panty liners', 'Comfort-focused design'],
   'Remove the individual wrapper, peel away the adhesive backing and position the towel securely inside clean underwear. Change regularly and whenever saturated.',
   null, 10),
  ('cool-mint-sanitary-towels', 'Linzzy Cool Mint Sanitary Towels', 'Feminine care',
   'A cooling-style option in a mixed-length pack: 260 mm and 290 mm towels, plus 3 panty liners.',
   'Every woman has different preferences when it comes to menstrual care. Linzzy Cool Mint Sanitary Towels provide a cooling-style option within the feminine care collection. The pack combines sanitary towels of different lengths, allowing consumers to choose according to their flow and coverage preferences.',
   array['Cool Mint variant', 'Two sanitary towel lengths', 'Panty liners included', 'Absorb, Lock and Breathe design positioning', 'Convenient mixed-length pack'],
   'Position the towel securely inside clean underwear and change regularly according to your menstrual flow.',
   null, 20),
  ('extra-long-sanitary-towels', 'Linzzy Extra Long Sanitary Towels', 'Feminine care',
   'Extended 330 mm coverage for rest, travel and busy days, with 290 mm towels and 2 complimentary panty liners.',
   'Whether you''re resting, travelling or managing a busy day, choosing a sanitary towel with suitable coverage can make a difference. Linzzy Extra Long Sanitary Towels offer an extended-length option for consumers who prefer additional coverage.',
   array['Extended 330 mm coverage', 'Additional 290 mm towels', 'Complimentary panty liners', 'Designed for consumers who prefer longer towels', 'Comfort-focused design'],
   'Centre the towel inside clean underwear, secure the adhesive and ensure the product sits comfortably.',
   null, 30),
  ('panty-liners', 'Linzzy Panty Liners', 'Feminine care',
   'A compact 155 mm liner for light spotting or small amounts of moisture, 30 in a pack.',
   'Sometimes, the smallest essentials make everyday routines more convenient. Linzzy Panty Liners offer a compact option for managing light spotting or small amounts of moisture. Designed for light protection rather than regular menstrual flow, these liners can be incorporated into personal care routines according to individual preference.',
   array['Compact 155 mm design', '30 liners per pack', 'Suitable for light spotting and small amounts of moisture', 'Convenient everyday care option'],
   'Attach the liner securely inside clean underwear. Replace when damp or soiled.',
   null, 40),
  ('baby-diapers', 'Linzzy Baby Diapers', 'Baby care',
   'Unisex disposable diapers with a flexible-comfort design, in sizes for growing babies.',
   'Every baby has a world to discover. From stretching little legs to learning how to crawl, babies need diapers that fit comfortably and allow natural movement. Linzzy Baby Diapers feature a flexible-comfort design intended to support everyday diapering needs.',
   array['Flexible Comfort design', 'Unisex diaper range', 'Different sizes for growing babies', 'Disposable diaper format', 'Designed for everyday baby care'],
   'Place your baby on a clean, safe changing surface. Remove the soiled diaper and gently clean the diaper area. Allow the skin to dry. Position a fresh Linzzy diaper comfortably. Fasten securely without making it too tight. Dispose of the used diaper responsibly and wash your hands.',
   null, 50),
  ('baby-wipes', 'Linzzy Baby Wipes', 'Baby care',
   '80 wipes in a resealable pack, in Pink (Rose Perfume), Blue (Lavender Perfume) and Yellow.',
   'Little hands, tiny feet and unexpected messes are all part of raising a baby. Linzzy Baby Wipes offer a convenient cleaning option for everyday care routines at home or on the go. Available in different variants, Linzzy Baby Wipes provide parents with options to suit their preferences.',
   array['Convenient resealable packaging', '80 wipes per pack', 'Different product variants', 'Suitable for everyday external cleaning, subject to label directions', 'Portable for diaper bags and travel'],
   'Open the resealable lid. Remove a wipe with clean hands. Gently clean the intended external skin area. Use additional wipes when necessary to avoid spreading dirt. Close the packaging securely after use. Dispose of used wipes in an appropriate waste bin.',
   '[PLACEHOLDER: complete ingredient list for each wipes variant, from Lexta]', 60)
) as v(slug, name, category, short_description, long_description, key_features, usage_instructions, ingredients, sort_order)
join public.brands b on b.slug = 'linzzy'
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

-- 4. SKUs and pack sizes -------------------------------------------------------------------------------------------
update public.product_skus s
set is_active = false
from public.products p join public.brands b on b.id = p.brand_id
where s.product_id = p.id and b.slug = 'linzzy' and p.slug = 'baby-wipes' and s.sku_code = 'TBC-LINZZY-004' and s.is_active;

insert into public.product_skus (product_id, sku_code, variant_name, pack_size_label, sort_order)
select p.id, v.sku_code, v.variant_name, v.pack_size_label, v.sort_order
from (values
  ('heavy-flow-sanitary-towels', 'TBC-LINZZY-101', 'Heavy Flow', '12 Heavy Flow Sanitary Towels, 290 mm + 2 Complimentary Panty Liners, 155 mm', 10),
  ('cool-mint-sanitary-towels', 'TBC-LINZZY-102', 'Cool Mint', '6 Sanitary Towels, 260 mm + 6 Sanitary Towels, 290 mm + 3 Panty Liners, 155 mm', 10),
  ('extra-long-sanitary-towels', 'TBC-LINZZY-103', 'Extra Long', '9 Extra Long Sanitary Towels, 330 mm + 2 Sanitary Towels, 290 mm + 2 Complimentary Panty Liners, 155 mm', 10),
  ('panty-liners', 'TBC-LINZZY-104', 'Panty Liners', '30 Panty Liners, 155 mm', 10),
  ('baby-diapers', 'TBC-LINZZY-105', 'Medium (M)', '42 pieces, 6 to 9 kg', 10),
  ('baby-diapers', 'TBC-LINZZY-106', 'Large (L)', '40 pieces, 9 to 13 kg', 20),
  ('baby-wipes', 'TBC-LINZZY-108', 'Pink Pack, Rose Perfume', '80 wipes', 10),
  ('baby-wipes', 'TBC-LINZZY-109', 'Blue Pack, Lavender Perfume', '80 wipes', 20),
  ('baby-wipes', 'TBC-LINZZY-110', 'Yellow Pack', '80 wipes', 30)
) as v(product_slug, sku_code, variant_name, pack_size_label, sort_order)
join public.brands b on b.slug = 'linzzy'
join public.products p on p.brand_id = b.id and p.slug = v.product_slug
on conflict (sku_code) do nothing;

-- 5. Pack shots (shared photo files in every app) ----------------------------------------------------------------------
insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
select p.id, v.url, v.alt_text, v.sort_order,
       v.is_primary and not exists (select 1 from public.product_images i where i.product_id = p.id and i.is_primary)
from (values
('heavy-flow-sanitary-towels', '/images/linzzy/pad-heavy-flow.webp', 'Linzzy Heavy Flow sanitary towels pack: 12 towels of 290 mm plus 2 free panty liners', 10, true),
  ('cool-mint-sanitary-towels', '/images/linzzy/pad-cool-mint.webp', 'Linzzy Cool Mint sanitary towels pack: 6 towels of 260 mm, 6 of 290 mm and 3 panty liners', 10, true),
  ('extra-long-sanitary-towels', '/images/linzzy/pad-extra-long.webp', 'Linzzy Extra Long sanitary towels pack: 9 towels of 330 mm, 2 of 290 mm and 2 free panty liners', 10, true),
  ('panty-liners', '/images/linzzy/panty-liner.webp', 'Linzzy Panty Liner pack: 30 liners of 155 mm', 10, true),
  ('baby-diapers', '/images/linzzy/baby-diapers.webp', 'Linzzy Baby Diapers pack, size L, 40 pieces, with a mother and baby on the pack', 10, true),
  ('baby-wipes', '/images/linzzy/baby-wipes.webp', 'Linzzy Baby Wipes packs in yellow, pink and blue, 80 wipes each', 10, true)
) as v(product_slug, url, alt_text, sort_order, is_primary)
join public.brands b on b.slug = 'linzzy'
join public.products p on p.brand_id = b.id and p.slug = v.product_slug
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.external_url = v.url
);
