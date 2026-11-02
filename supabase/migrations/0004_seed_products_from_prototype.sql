-- 0004_seed_products_from_prototype: the products named on the approved Our Brands prototype
-- (apps/lexta/public/our-brands.html), so the websites have real data from day one.
-- Only facts printed on that page are used. Anything the page does not state is a marked placeholder
-- for Lexta to confirm in the portal: pack sizes "[PLACEHOLDER: pack size from Lexta]",
-- SKU codes "TBC-<BRAND>-<NNN>". Image links and alt text are copied from the page.
-- Idempotent: running it again adds nothing and changes nothing.

-- Products ----------------------------------------------------------------------
insert into public.products
  (brand_id, slug, name, category, short_description, long_description, key_features, ingredients, is_published, sort_order)
select b.id, v.slug, v.name, v.category, v.short_description, v.long_description, v.key_features, v.ingredients, true, v.sort_order
from (values
  -- Yazz
  ('yazz', 'sanitary-pads-and-panty-liners', 'Sanitary pads and panty liners', 'Personal care',
   'Winged, high absorbency pads engineered for security and comfort through a full day.',
   'Winged, high absorbency pads engineered for security and comfort through a full day. Available across regular, heavy flow and extra long formats, with panty liners for everyday freshness.',
   array['Winged, high absorbency pads', 'Security and comfort through a full day', 'Regular, heavy flow and extra long formats', 'Panty liners for everyday freshness'],
   null, 10),
  ('yazz', 'toothpaste', 'Toothpaste', 'Oral care',
   'The new Yazz range comes in three variants: Charcoal, Herbal and Fluoride.',
   'The new Yazz range comes in three variants: Charcoal, Herbal and Fluoride. Formulated with calcium carbonate, fluoride and sodium to strengthen enamel and guard against plaque, cavities, bleeding gums and bad breath. The Herbal variant carries a blend of herbs that soothes the gums.',
   array['Three variants: Charcoal, Herbal and Fluoride', 'Strengthens enamel', 'Guards against plaque, cavities, bleeding gums and bad breath', 'Herbal variant carries a blend of herbs that soothes the gums'],
   'Calcium carbonate, fluoride and sodium. The Herbal variant also carries a blend of herbs.', 20),
  ('yazz', 'toothbrushes', 'Toothbrushes', 'Oral care',
   'Designed to pair with the range, built to last longer than the month you bought them for.',
   'Designed to pair with the range, built to last longer than the month you bought them for.',
   array['Designed to pair with the Yazz toothpaste range'],
   null, 30),
  ('yazz', 'washing-powder', 'Washing powder', 'Cleaning',
   'Active enzymes formulated to lift the toughest stains. Tough on stains, kind on fabric.',
   'Active enzymes formulated to lift the toughest stains, with perfumed blue speckles that leave clothes smelling fresh. Clinically tested to be gentle on hands. Tough on stains, kind on fabric.',
   array['Active enzymes lift the toughest stains', 'Perfumed blue speckles leave clothes smelling fresh', 'Clinically tested to be gentle on hands'],
   null, 40),
  ('yazz', 'baby-wipes', 'Baby wipes', 'Baby care',
   'Alcohol free, gently scented wipes that clean and care for delicate skin.',
   'Alcohol free, gently scented wipes that clean and care for delicate skin, leaving it fresh and smooth. Available in three variants.',
   array['Alcohol free', 'Gently scented', 'Leaves delicate skin fresh and smooth', 'Available in three variants'],
   null, 50),
  ('yazz', 'baby-diapers', 'Baby diapers', 'Baby care',
   'Absorbent, secure and comfortable, for the long nights and the longer days.',
   'Absorbent, secure and comfortable, for the long nights and the longer days.',
   array['Absorbent', 'Secure', 'Comfortable'],
   null, 60),
  ('yazz', 'tissue', 'Tissue', 'Tissue and kitchen towels',
   'Pocket tissues and toilet rolls.',
   'Pocket tissues and toilet rolls from Yazz.',
   array['Pocket tissues', 'Toilet rolls'],
   null, 70),
  ('yazz', 'mama-yazz-kitchen-towel', 'Mama Yazz kitchen towel', 'Tissue and kitchen towels',
   'Mama Yazz, our two ply kitchen towel.',
   'Mama Yazz, our two ply kitchen towel, named for the number of jobs it ends up doing in a Ghanaian kitchen.',
   array['Two ply kitchen towel'],
   null, 80),
  -- Linzzy
  ('linzzy', 'sanitary-napkins', 'Sanitary napkins', 'Personal care',
   'A full portfolio including Cool Mint, Heavy Flow and Extra Long.',
   'A full portfolio including Cool Mint, Heavy Flow and Extra Long, each with clinical anti leak barriers and structured absorption designed for a specific need rather than an average one.',
   array['Cool Mint, Heavy Flow and Extra Long', 'Clinical anti leak barriers', 'Structured absorption designed for a specific need'],
   null, 10),
  ('linzzy', 'baby-wipes', 'Baby wipes', 'Baby care',
   'Ultra mild, fragrance free wipes in 80 piece packs.',
   'Ultra mild, fragrance free wipes in 80 piece packs, formulated for sensitive skin and built to hold up to the job.',
   array['Ultra mild', 'Fragrance free', 'Formulated for sensitive skin', '80 piece packs'],
   null, 20),
  ('linzzy', 'baby-care', 'Baby care', 'Baby care',
   'A growing range of everyday essentials for the youngest members of the household.',
   'A growing range of everyday essentials for the youngest members of the household.',
   array['Everyday essentials for the youngest members of the household'],
   null, 30),
  -- Hooch
  ('hooch', 'super-crunchy-corn-flakes', 'Super Crunchy Corn Flakes', 'Breakfast cereal',
   'Traditional, crisp, sun ripened corn flakes toasted for a crunch that survives the milk.',
   'Traditional, crisp, sun ripened corn flakes toasted for a crunch that survives the milk, fortified with essential vitamins.',
   array['Sun ripened corn flakes', 'Toasted for a crunch that survives the milk', 'Fortified with essential vitamins'],
   null, 10),
  ('hooch', 'frosted-flakes', 'Frosted Flakes', 'Breakfast cereal',
   'A measured balance of sweetness and high energy grain, low in fat.',
   'A measured balance of sweetness and high energy grain, low in fat, made for active mornings and small people with strong opinions.',
   array['Balance of sweetness and high energy grain', 'Low in fat'],
   null, 20),
  ('hooch', 'choco-flakes', 'Choco Flakes', 'Breakfast cereal',
   'The same fortified grain base, finished with cocoa.',
   'The same fortified grain base, finished with cocoa. Available in 375g.',
   array['Fortified grain base', 'Finished with cocoa'],
   null, 30)
) as v(brand_slug, slug, name, category, short_description, long_description, key_features, ingredients, sort_order)
join public.brands b on b.slug = v.brand_slug
on conflict (brand_id, slug) do nothing;

-- SKUs and pack sizes -----------------------------------------------------------
insert into public.product_skus (product_id, sku_code, variant_name, pack_size_label, unit_quantity, unit, sort_order)
select p.id, v.sku_code, v.variant_name, v.pack_size_label, v.unit_quantity, v.unit, v.sort_order
from (values
  ('yazz', 'sanitary-pads-and-panty-liners', 'TBC-YAZZ-001', 'Regular', '[PLACEHOLDER: pack size from Lexta]', null::numeric, null, 10),
  ('yazz', 'sanitary-pads-and-panty-liners', 'TBC-YAZZ-002', 'Heavy flow', '[PLACEHOLDER: pack size from Lexta]', null, null, 20),
  ('yazz', 'sanitary-pads-and-panty-liners', 'TBC-YAZZ-003', 'Extra long', '[PLACEHOLDER: pack size from Lexta]', null, null, 30),
  ('yazz', 'sanitary-pads-and-panty-liners', 'TBC-YAZZ-004', 'Panty liners', '[PLACEHOLDER: pack size from Lexta]', null, null, 40),
  ('yazz', 'toothpaste', 'TBC-YAZZ-005', 'Charcoal', '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('yazz', 'toothpaste', 'TBC-YAZZ-006', 'Herbal', '[PLACEHOLDER: pack size from Lexta]', null, null, 20),
  ('yazz', 'toothpaste', 'TBC-YAZZ-007', 'Fluoride', '[PLACEHOLDER: pack size from Lexta]', null, null, 30),
  ('yazz', 'toothbrushes', 'TBC-YAZZ-008', null, '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('yazz', 'washing-powder', 'TBC-YAZZ-009', null, '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('yazz', 'baby-wipes', 'TBC-YAZZ-010', '[PLACEHOLDER: variant 1 name from Lexta]', '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('yazz', 'baby-wipes', 'TBC-YAZZ-011', '[PLACEHOLDER: variant 2 name from Lexta]', '[PLACEHOLDER: pack size from Lexta]', null, null, 20),
  ('yazz', 'baby-wipes', 'TBC-YAZZ-012', '[PLACEHOLDER: variant 3 name from Lexta]', '[PLACEHOLDER: pack size from Lexta]', null, null, 30),
  ('yazz', 'baby-diapers', 'TBC-YAZZ-013', 'Large', '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('yazz', 'tissue', 'TBC-YAZZ-014', 'Pocket tissues', '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('yazz', 'tissue', 'TBC-YAZZ-015', 'Toilet rolls', '[PLACEHOLDER: pack size from Lexta]', null, null, 20),
  ('yazz', 'mama-yazz-kitchen-towel', 'TBC-YAZZ-016', 'Two ply', '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('linzzy', 'sanitary-napkins', 'TBC-LINZZY-001', 'Cool Mint', '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('linzzy', 'sanitary-napkins', 'TBC-LINZZY-002', 'Heavy Flow', '[PLACEHOLDER: pack size from Lexta]', null, null, 20),
  ('linzzy', 'sanitary-napkins', 'TBC-LINZZY-003', 'Extra Long', '[PLACEHOLDER: pack size from Lexta]', null, null, 30),
  ('linzzy', 'baby-wipes', 'TBC-LINZZY-004', null, '80 pieces', 80, 'pieces', 10),
  ('linzzy', 'baby-care', 'TBC-LINZZY-005', null, '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('hooch', 'super-crunchy-corn-flakes', 'TBC-HOOCH-001', null, '375g', 375, 'g', 10),
  ('hooch', 'frosted-flakes', 'TBC-HOOCH-002', null, '[PLACEHOLDER: pack size from Lexta]', null, null, 10),
  ('hooch', 'choco-flakes', 'TBC-HOOCH-003', null, '375g', 375, 'g', 10)
) as v(brand_slug, product_slug, sku_code, variant_name, pack_size_label, unit_quantity, unit, sort_order)
join public.brands b on b.slug = v.brand_slug
join public.products p on p.brand_id = b.id and p.slug = v.product_slug
on conflict (sku_code) do nothing;

-- Images (links and alt text exactly as on the prototype page) -------------------
insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
select p.id, v.url, v.alt_text, v.sort_order, v.is_primary
from (values
  ('yazz', 'sanitary-pads-and-panty-liners', 'https://yazzproducts.com/wp-content/uploads/2026/07/Yazz-sanitary-pad-Extra-Long.png', 'Yazz sanitary pads', 10, true),
  ('yazz', 'toothpaste', 'https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-charcoal-Toothpaste-e1787744429757.jpg', 'Yazz Charcoal toothpaste', 10, true),
  ('yazz', 'toothpaste', 'https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-herbal-Toothpaste-e1787744479191.jpg', 'Yazz Herbal toothpaste', 20, false),
  ('yazz', 'toothpaste', 'https://yazzproducts.com/wp-content/uploads/2026/08/New-Yazz-Flouride-Toothpaste-e1787744539801.jpg', 'Yazz Fluoride toothpaste', 30, false),
  ('yazz', 'washing-powder', 'https://yazzproducts.com/wp-content/uploads/2026/07/EDSfdc2W4AAu3PT.jpg', 'Yazz washing powder', 10, true),
  ('yazz', 'washing-powder', 'https://lextagh.com/wp-content/uploads/2026/06/Yazz-Washing-powder1.jpg', 'Yazz washing powder pack', 20, false),
  ('yazz', 'washing-powder', 'https://yazzproducts.com/wp-content/uploads/2026/06/dirty-yazz-cloth.png', 'Cloth before washing', 30, false),
  ('yazz', 'washing-powder', 'https://yazzproducts.com/wp-content/uploads/2026/06/clean-yazz-cloth.png', 'Cloth after washing', 40, false),
  ('yazz', 'baby-wipes', 'https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-yellow.jpg', 'Yazz baby wipes', 10, true),
  ('yazz', 'baby-wipes', 'https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/70195_1_1.jpg', 'Yazz baby wipes, 80 pieces', 20, false),
  ('yazz', 'baby-wipes', 'https://yazzproducts.com/wp-content/uploads/2021/05/Yazz-baby-wipes-new-green.jpg', 'Yazz baby wipes', 30, false),
  ('yazz', 'baby-diapers', 'https://melcom.com/media/catalog/product/cache/8757aa1374eaaf34b9fd32f9e760ba0b/7/0/7018.png', 'Yazz baby diapers, large', 10, true),
  ('yazz', 'tissue', 'https://yazzproducts.com/wp-content/uploads/2026/07/unnamed-1.png', 'Yazz tissue', 10, true),
  ('yazz', 'mama-yazz-kitchen-towel', 'https://yazzproducts.com/wp-content/uploads/2026/07/Mama-Yazz-Kitchen-Towel2.png', 'Mama Yazz kitchen towel', 10, true),
  ('linzzy', 'sanitary-napkins', 'https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Your-trusted-partner-copy.jpg.jpeg', 'Linzzy sanitary napkins', 10, true),
  ('linzzy', 'baby-care', 'https://lextagh.com/wp-content/uploads/2026/06/Linzzy-Baby-Diaper-copy.jpg-1.jpeg', 'Linzzy baby care', 10, true),
  ('hooch', 'super-crunchy-corn-flakes', 'https://www.chopboxonline.com/wp-content/uploads/2022/08/NewBookImages-53-1.png', 'Hooch Super Crunchy Corn Flakes, 375g', 10, true),
  ('hooch', 'choco-flakes', 'https://www.chopboxonline.com/wp-content/uploads/2022/08/18-7.png', 'Hooch Choco Flakes, 375g', 10, true)
) as v(brand_slug, product_slug, url, alt_text, sort_order, is_primary)
join public.brands b on b.slug = v.brand_slug
join public.products p on p.brand_id = b.id and p.slug = v.product_slug
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.external_url = v.url
);
