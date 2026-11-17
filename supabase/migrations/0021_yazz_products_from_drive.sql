-- 0021_yazz_products_from_drive: Lexta's real Yazz catalogue in Product Management, replacing the prototype rows.
--
-- WRITTEN, NOT APPLIED. Desmond approved the content rewrite; the lead applies it after review.
--
-- Why: the Yazz site, the Lexta Our Brands page and the portal read the Yazz products from this table. The 7 published
-- Yazz rows were seeded from the Lexta design prototype (0004) and carry text no Lexta document gives, some of it
-- product and health claims: washing powder "Clinically tested to be gentle on hands" and "perfumed blue speckles";
-- toothpaste "three variants" (Lexta lists five) "to strengthen enamel and guard against plaque, cavities, bleeding
-- gums and bad breath", with an ingredient line that matches none of Lexta's five; pads "high absorbency ... through a
-- full day"; diapers "for the long nights and the longer days"; toothbrushes "built to last longer than the month you
-- bought them for"; "Mama Yazz, our two ply kitchen towel" (Lexta: a jumbo size tissue); pocket tissues shown as on
-- sale (Lexta: coming soon); and wipes variants shown as "[PLACEHOLDER: variant 1 name from Lexta]" although Lexta
-- names them. Lexta's Drive content ("yazz website content.docx", Yazz Tab Content, Tab 3 Products; extracted in
-- docs/content/yazz/products.md) gives 16 products on sale and 2 coming soon. They are structured in
-- apps/yazz/content/catalogue.ts; this migration writes the same words, SKU codes, pack sizes and pack shots.
--
-- What it changes (Yazz rows only; no other brand, table, policy or function is touched):
--   1. Unpublishes the prototype umbrella rows "Sanitary pads and panty liners", "Toothpaste" and "Tissue and kitchen
--      towels" (slugs sanitary-pads-and-panty-liners, toothpaste, tissue), and replaces their invented wording, and
--      that of the already unpublished "Mama Yazz kitchen towel" (mama-yazz-kitchen-towel), with a short archive note,
--      so no invented claim is left in Product Management. The rows are kept, with their images, so past orders,
--      complaints and leads that point at them stay intact.
--   2. Switches off the prototype SKUs TBC-YAZZ-001 to 016 (variant names and "[PLACEHOLDER: pack size from Lexta]"
--      labels the Drive does not list) in favour of Lexta's own variants below. Nothing is deleted.
--   3. Writes Lexta's 16 products on sale, published, in the catalogue's order. Toothbrushes, washing-powder,
--      baby-wipes and baby-diapers have the same slug as a prototype row, so they are corrected in place (same id).
--      The other twelve are new rows. Coming soon items (Yazz dental floss, Yazz pocket tissue) get no row: the Yazz
--      site adds them from its catalogue with a Coming soon badge (apps/yazz/lib/products.ts), and that only works
--      while no live row names them. Step 1 and 2 remove the "Pocket tissues" row and SKU that hid the Pocket Tissue
--      card until now.
--   4. Their SKUs and pack sizes as Lexta wrote them (codes TBC-YAZZ-101 to 143, as in the catalogue, until Lexta sends
--      real codes). Where the Drive gives no pack size the label is "[PLACEHOLDER: pack size from Lexta]"; two pack
--      sizes come from the pack photos on Yazz's original website (Lavender wipes 80 pieces, Fluoride toothpaste 150g;
--      docs/content/yazz/ORIGINAL-SITE.md).
--   5. Pack shots from Yazz's original website already shipped in the Yazz site (/images/original/...). Only the Yazz
--      site serves those files; the Lexta site and the portal treat them as no picture (isBrandSiteImage in packages/db).
--      A product keeps its existing main photo; a new photo becomes the main one only where there is none.
--
-- Staff edits are never overwritten: every product write is guarded by "updated_by is null" (the trigger from 0003
-- records who saved a row in Product Management, and it is null for rows written only by migrations). A row staff
-- have saved keeps its wording, its published state and its SKUs. A read-only check on 2026-11-16 showed all 8 Yazz
-- rows unsaved by staff and no TBC-YAZZ-1xx codes in use.
--
-- Placeholders written here (also listed in docs/content/yazz/PLACEHOLDERS.md): the ISO certification line on pads and
-- liners, the Lavender wipes description, the Large diaper weight range, and the pack sizes the Drive does not give.
-- Lexta asked for QA on pad specs, diaper weight ranges, wipes ingredients and toothpaste claims before publication;
-- the wording here is Lexta's own, and that QA still applies.
--
-- Row Level Security is unchanged: the existing product policies (0003) cover every row written here.
-- Idempotent: running it again changes nothing more.
-- Side effects to expect: the Yazz cards on the Lexta Our Brands page follow these rows (16 products instead of 7),
-- and any test that expects the 8 prototype Yazz rows needs updating.
-- Before applying to the live project, check the live Yazz rows read-only:
--   select slug, is_published, updated_at, updated_by from public.products
--   where brand_id = (select id from public.brands where slug = 'yazz') order by sort_order;

-- 1. The prototype umbrella rows leave the websites -------------------------------------------------------------------
update public.products p
set is_published = false,
    short_description = v.note,
    long_description = v.note,
    key_features = '{}',
    usage_instructions = null,
    ingredients = null
from public.brands b,
  (values
    ('sanitary-pads-and-panty-liners', 'Archived prototype row (0021). Lexta''s products: Yazz sanitary pads and Yazz panty liners.'),
    ('toothpaste', 'Archived prototype row (0021). Lexta''s products: Yazz Herbal, Whitening, Fluoride, Charcoal and Total Care toothpaste.'),
    ('tissue', 'Archived prototype row (0021). Lexta''s products: Mama Yazz jumbo tissue, Yazz individual wrap luxury toilet tissue, Yazz tissue napkin and Yazz individual tissue; Yazz pocket tissue is coming soon.'),
    ('mama-yazz-kitchen-towel', 'Archived prototype row (0021). Lexta''s product: Mama Yazz jumbo tissue. [PLACEHOLDER: Yazz kitchen towel description, from Lexta]')
  ) as v(slug, note)
where b.id = p.brand_id and b.slug = 'yazz' and p.slug = v.slug and p.updated_by is null
  and (p.is_published or p.long_description is distinct from v.note);

-- 2. The prototype SKUs are switched off -------------------------------------------------------------------------------
update public.product_skus s
set is_active = false
from public.products p join public.brands b on b.id = p.brand_id
where s.product_id = p.id and b.slug = 'yazz' and p.updated_by is null and s.is_active
  and s.sku_code in (
    'TBC-YAZZ-001', 'TBC-YAZZ-002', 'TBC-YAZZ-003', 'TBC-YAZZ-004', 'TBC-YAZZ-005', 'TBC-YAZZ-006', 'TBC-YAZZ-007',
    'TBC-YAZZ-008', 'TBC-YAZZ-009', 'TBC-YAZZ-010', 'TBC-YAZZ-011', 'TBC-YAZZ-012', 'TBC-YAZZ-013', 'TBC-YAZZ-014',
    'TBC-YAZZ-015', 'TBC-YAZZ-016'
  );

-- 3. Lexta's 16 Yazz products on sale ------------------------------------------------------------------------------------
insert into public.products
  (brand_id, slug, name, category, short_description, long_description, key_features, usage_instructions, ingredients, is_published, sort_order)
select b.id, v.slug, v.name, v.category, v.short_description, v.long_description, v.key_features, v.usage_instructions, v.ingredients, true, v.sort_order
from (values
  ('sanitary-pads', 'Yazz sanitary pads', 'Feminine care',
   'Ultra-thin pads with soft flexible wings and a wide adhesive back, in normal and heavy flow lengths.',
   'Yazz sanitary pads are ultra-thin, with soft flexible wings for maximum side protection and a wide adhesive on the back that holds the pad firmly in place. A soft dry web cover gives a natural feeling, round edges give you comfort and a wider pad gives maximum coverage against leakage.',
   array['Soft flexible wings provide maximum side protection', 'Wide adhesive on the back holds the pad firmly in place', 'Ultra-thin', 'Soft dry web cover for a natural feeling', 'Round edges give you comfort', 'Wider pad for maximum coverage against leakage', 'Specially designed wings protect your panties', 'Convenient resealable pack', '[PLACEHOLDER: confirm current ISO certification and year]', 'Passed strict quality inspection'],
   'Pad lengths: normal flow 270mm, heavy flow 290mm and heavy flow 330mm. In the highly unlikely event of irritation, please discontinue use and report it on +233 50 996 7400 (WhatsApp) or support@yazzproducts.com. Warning: to avoid danger of suffocation, keep the product away from infants and children.',
   'Developed with a pearl cotton sheet for your comfort.', 10),
  ('panty-liners', 'Yazz panty liners', 'Feminine care',
   'New and improved thick panty liners with 24 hours protection.',
   'New and improved thick Yazz panty liners give 24 hours protection, in the regular liner (yellow pack), the pink panty liner and the extra long and thick minty liner.',
   array['24 hours protection', 'New and improved thick panty liner', 'Lengths of 150mm and 180mm', '[PLACEHOLDER: confirm current ISO certification and year]', 'Passed strict quality inspection'],
   'In the highly unlikely event of irritation, please discontinue use and report it on +233 50 996 7400 (WhatsApp) or support@yazzproducts.com. Warning: to avoid danger of suffocation, keep the product away from infants and children.',
   null, 20),
  ('baby-diapers', 'Yazz baby diapers', 'Baby care',
   'Cottony soft, super absorbent taped diapers with an elastic waist and up to 12 hours leakage protection.',
   'Yazz baby diapers are cottony soft and super absorbent, with an elastic waist and up to 12 hours leakage protection.',
   array['Elastic waist', 'Up to 12 hours leakage protection', 'Cottony soft', 'Super absorbent'],
   'How to use: place baby on the diaper with the two back tapes at the back. Attach the two back tapes on the refastenable area to fit your baby. Pull the elastic leg bands towards the side to prevent leakage. Pull up the tape to check whether the diaper is wet. Do not flush. Caution: wash your hands before changing your baby''s diaper. Make sure your baby is clean and dry before putting on a fresh diaper. Change used diapers to keep the baby comfortable and throw them away immediately. Plastic bags are dangerous for children and must be kept out of reach.',
   null, 30),
  ('baby-pull-up-pants', 'Yazz pull up pants', 'Baby care',
   'Pull up diapers with a 360 elastic waist and up to 12 hours leakage protection.',
   'Yazz pull up pants have a 360 elastic waist, a soft and dry skin climate and up to 12 hours leakage protection.',
   array['360 elastic waist', 'Up to 12 hours leakage protection', 'Soft and dry skin climate', 'Super absorbent'],
   'Caution: wash your hands before changing your baby''s diaper. Make sure your baby is clean and dry before putting on a fresh diaper. Change used diapers to keep the baby comfortable and throw them away immediately. Plastic bags are dangerous for children and must be kept out of reach. Do not flush in the WC.',
   null, 40),
  ('baby-wipes', 'Yazz baby wipes', 'Baby care',
   'Alcohol free, multi-purpose baby wipes in Lavender, Castor Oil and Aloe Vera.',
   'Gentle, alcohol free wipes for delicate skin. Aloe Vera: super soft for sensitive skin, gently cleanses while helping soothe and hydrate. Castor Oil: deep moisture, soft skin and a gentle clean that helps protect skin from dryness. Lavender: [PLACEHOLDER: Lavender wipes description; Lexta''s text repeats the Aloe Vera copy].',
   array['Multi-purpose cleaning', 'Alcohol free', 'Leaves skin soft and nourished', 'Gentle, effective cleansing', 'Suitable for everyday use'],
   'Keep out of reach of children. Avoid contact with the eyes; if this occurs, rinse well with plenty of water. Do not flush down the toilet. Dispose of with normal household waste.',
   'Lavender: benzalkonium chloride, methylchloroisothiazolinone, methylisothiazolinone, PEG-75 lanolin, fragrance, PEG-40, hydrogenated lavender extract, propylene glycol, water. Castor Oil and Aloe Vera: benzalkonium chloride, methylchloroisothiazolinone, methylisothiazolinone, PEG-75 lanolin, fragrance, PEG-40, hydrogenated castor oil, propylene glycol, water.', 50),
  ('toothpaste-herbal', 'Yazz Herbal toothpaste', 'Oral care',
   'For natural fresh breath, clean and healthy teeth, with a unique blend of herbs.',
   'For natural fresh breath, clean and healthy teeth, with protection against unpleasant sensations from hot and cold foods and drinks. The unique blend of herbs helps promote proper hygiene in the mouth, makes the gums strong and helps prevent cavities.',
   array['Helps reduce tooth pain', 'Makes the gums strong and helps prevent cavities', 'Helps reduce bad breath', 'Gently breaks up stains to get teeth whiter', 'Helps maintain strong teeth and healthy gums'],
   'Brush your teeth twice daily. As with other toothpastes, if irritation occurs discontinue use and report it on WhatsApp +233 50 996 7400 or support@yazzproducts.com.',
   'Sorbitol, silica, water, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, titanium dioxide, sodium saccharin, honeysuckle, sodium fluoride, CI 74260.', 60),
  ('toothpaste-whitening', 'Yazz Whitening toothpaste', 'Oral care',
   'For a whiter, brighter and healthier smile, with a special polishing agent.',
   'Yazz Whitening toothpaste has a special polishing agent that removes stains lodged on the teeth from food, with a cool, refreshing mint fragrance that keeps your mouth smelling good.',
   array['Special polishing agent for extra stain removal', 'Cool, refreshing mint', 'Helps prevent deposits that attract stains', 'Helps maintain strong teeth and healthy gums'],
   'Brush your teeth twice daily. As with other toothpastes, if irritation occurs discontinue use and report it on WhatsApp +233 50 996 7400 or support@yazzproducts.com.',
   'Calcium carbonate, aqua, sorbitol, glycerin, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, hydroxyethylcellulose, flavour, sodium saccharin, calcium phosphate, sodium pyrophosphate, sodium phytate, methylparaben.', 70),
  ('toothpaste-fluoride', 'Yazz Fluoride toothpaste', 'Oral care',
   'Long lasting protection, for brilliant white teeth.',
   'Long lasting protection, for brilliant white teeth. Brush twice daily with Yazz Fluoride toothpaste.',
   array['Long lasting protection', 'For brilliant white teeth'],
   'Brush your teeth twice daily. As with other toothpastes, if irritation occurs discontinue use and report it on WhatsApp +233 50 996 7400 or support@yazzproducts.com.',
   'Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, cellulose gum, aroma, sodium fluoride, sodium benzoate, CI 77891, CI 16255.', 80),
  ('toothpaste-charcoal', 'Yazz Charcoal toothpaste', 'Oral care',
   'Deep clean: removes stains and whitens teeth with activated charcoal.',
   'Activated charcoal particles help cleanse your mouth and remove deep stains and discolouration. The highly absorbent particles draw out stubborn stains, trap colour particles, fight bad breath and whiten tooth enamel.',
   array['Deep clean', 'Removes stains', 'Whitens teeth', 'Fights bad breath'],
   'Brush your teeth twice daily. As with other toothpastes, if irritation occurs discontinue use and report it on WhatsApp +233 50 996 7400 or support@yazzproducts.com.',
   'Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, sodium saccharin, charcoal powder, mica, CI 77266, lanthanide gum, methylparaben, sodium fluoride.', 90),
  ('toothpaste-total-care', 'Yazz Total Care toothpaste', 'Oral care',
   'Everyday protection and care for your teeth.',
   'Cares for your teeth and refreshes your breath, protecting against cavities, foul smell, yellow teeth, plaque and bleeding or swollen gums. Cleans tartar and stains, stimulates the gums and leaves a pleasantly refreshing taste.',
   array['Protects against cavities and plaque', 'Refreshes your breath', 'Cleans tartar and stains', 'Stimulates the gums'],
   'Brush your teeth twice daily. As with other toothpastes, if irritation occurs discontinue use and report it on WhatsApp +233 50 996 7400 or support@yazzproducts.com.',
   'Sorbitol, aqua, hydrated silica, sodium lauryl sulfate, sodium carboxymethyl cellulose, flavour, sodium saccharin, mica, pigment, triclosan, methylparaben, sodium fluoride.', 100),
  ('toothbrushes', 'Yazz toothbrushes', 'Oral care',
   'Your best smiles: a unique bristle that helps remove plaque, with a tongue cleaner and a flexible rubber grip.',
   'Yazz toothbrushes have a unique bristle that is more effective in helping remove plaque and stains, an innovative tongue cleaner designed to gently clean the tongue and a flexible rubber handle for an easy grip. Dentist recommendation: change your toothbrush at least once every three months.',
   array['Easy cleaning and massage', 'Removes plaque, protects enamel', 'Gentle on gums, cleans between the teeth', 'Flexible rubber handle for an easy grip'],
   'Brush twice a day. Hold the brush with your elbow raised to shoulder level and brush in a circular, up and down motion. Change the brush every 3 months and visit the dentist regularly.',
   null, 110),
  ('washing-powder', 'Yazz Activ washing powder', 'Home care',
   'Yazz Activ detergent with enzymes removes stubborn stains, for brighter and fresher clothes.',
   'The newly improved Yazz Activ detergent with enzymes has been specially formulated to give you brighter and fresher clothes all the time, free from every stain. Stay bright, fresher and stain free.',
   array['Detergent with enzymes', 'Removes stubborn stains', 'Brighter and fresher clothes', 'Suitable for cotton, linen, polyester and mixtures'],
   'Dissolve Yazz Activ detergent in water and soak clothes for 15 to 20 minutes before washing. For heavy dirt or more clothes, soak longer and use more detergent. Separate coloured clothes from white. Do not use for silk or wool. Keep in a dry place, out of reach of children. In case of eye contact, flush with plenty of water. If swallowed, drink plenty of clean water or milk and seek medical assistance. Check the pack for directions at all times.',
   'LAS, phosphate, enzymes, optical brightener, sodium sulphate, SCMC, perfume, sodium carbonate.', 120),
  ('mama-yazz-jumbo-tissue', 'Mama Yazz jumbo tissue', 'Tissue',
   'Big on care. Made for family needs: a jumbo size tissue for busy households.',
   'Meet Mama Yazz®, the jumbo size tissue created with busy households in mind. Its larger format offers a practical choice for families and spaces where tissue is used frequently.',
   array['Jumbo size format', 'Family focused convenience', 'Practical for frequent household use'],
   null,
   null, 130),
  ('toilet-tissue-individual-wrap', 'Yazz individual wrap luxury toilet tissue', 'Tissue',
   'A little luxury in everyday care, individually wrapped.',
   'Experience everyday comfort with Yazz® Individual Wrap Luxury Toilet Tissue. Packaged as a single roll, it is a practical and hygienic solution for personal use, family bathrooms and guest facilities.',
   array['Individually wrapped', 'Convenient storage', 'Everyday bathroom essential'],
   null,
   null, 140),
  ('tissue-napkin', 'Yazz tissue napkin', 'Tissue',
   'Every sheet, a touch of care: 150 sheets per roll.',
   'From family meals to everyday clean-ups, Yazz® Tissue Napkin offers convenience when you need it. With 150 sheets in a roll, it is a handy addition to dining areas, kitchens and everyday household routines.',
   array['150 sheets per roll', 'Convenient single roll format', 'Suitable for everyday household use'],
   null,
   null, 150),
  ('individual-tissue', 'Yazz individual tissue', 'Tissue',
   'Simple care. Everyday convenience.',
   'Yazz® Individual Tissue brings practical personal hygiene into your daily routine. Its single roll format makes it an easy choice for home bathrooms, workplaces and other everyday spaces.',
   array['Single roll convenience', 'Easy to store', 'Suitable for everyday personal hygiene'],
   null,
   null, 160)
) as v(slug, name, category, short_description, long_description, key_features, usage_instructions, ingredients, sort_order)
join public.brands b on b.slug = 'yazz'
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

-- 4. SKUs and pack sizes -------------------------------------------------------------------------------------------------
insert into public.product_skus (product_id, sku_code, variant_name, pack_size_label, sort_order)
select p.id, v.sku_code, v.variant_name, v.pack_size_label, v.sort_order
from (values
  ('sanitary-pads', 'TBC-YAZZ-101', 'Extra Long Minty', '9 extra long pads + 2 normal flow pads', 10),
  ('sanitary-pads', 'TBC-YAZZ-102', 'Extra Long, free panty liner and disposable bag', '9 extra long pads + 2 normal flow pads', 20),
  ('sanitary-pads', 'TBC-YAZZ-103', 'Minty', '6 normal flow pads + 6 heavy flow pads', 30),
  ('sanitary-pads', 'TBC-YAZZ-104', 'Green, free panty liner', '6 normal flow pads + 6 heavy flow pads', 40),
  ('sanitary-pads', 'TBC-YAZZ-105', 'Pink (Heavy), free panty liner', '6 normal flow pads + 6 heavy flow pads', 50),
  ('panty-liners', 'TBC-YAZZ-106', 'Regular (yellow pack)', '[PLACEHOLDER: pack size from Lexta]', 10),
  ('panty-liners', 'TBC-YAZZ-107', 'Pink', '24 minty liners', 20),
  ('panty-liners', 'TBC-YAZZ-108', 'Extra long and thick, minty (pink)', '24 minty liners', 30),
  ('baby-diapers', 'TBC-YAZZ-109', 'Small, 3 to 6kg', '15 pieces', 10),
  ('baby-diapers', 'TBC-YAZZ-110', 'Medium, 6 to 9kg', '12 pieces', 20),
  ('baby-diapers', 'TBC-YAZZ-111', 'Large, [PLACEHOLDER: weight range]', '11 pieces', 30),
  ('baby-diapers', 'TBC-YAZZ-112', 'Extra large, 13kg and above', '8 pieces', 40),
  ('baby-pull-up-pants', 'TBC-YAZZ-113', 'Small, 4 to 8kg', '54 pieces', 10),
  ('baby-pull-up-pants', 'TBC-YAZZ-114', 'Medium, 6 to 11kg', '52 pieces', 20),
  ('baby-pull-up-pants', 'TBC-YAZZ-115', 'Large, 9 to 14kg', '50 pieces', 30),
  ('baby-pull-up-pants', 'TBC-YAZZ-116', 'Extra large, 12 to 17kg', '48 pieces', 40),
  ('baby-pull-up-pants', 'TBC-YAZZ-117', 'Extra extra large, 15kg', '46 pieces', 50),
  ('baby-wipes', 'TBC-YAZZ-118', 'Lavender', '80 pieces', 10),
  ('baby-wipes', 'TBC-YAZZ-119', 'Castor Oil', '80 pieces', 20),
  ('baby-wipes', 'TBC-YAZZ-120', 'Castor Oil', '40 pieces', 30),
  ('baby-wipes', 'TBC-YAZZ-121', 'Aloe Vera', '80 pieces', 40),
  ('baby-wipes', 'TBC-YAZZ-122', 'Aloe Vera', '40 pieces', 50),
  ('toothpaste-herbal', 'TBC-YAZZ-123', null, '150g', 10),
  ('toothpaste-whitening', 'TBC-YAZZ-124', null, '150g', 10),
  ('toothpaste-fluoride', 'TBC-YAZZ-125', null, '150g', 10),
  ('toothpaste-charcoal', 'TBC-YAZZ-126', null, '150g', 10),
  ('toothpaste-charcoal', 'TBC-YAZZ-127', null, '50g', 20),
  ('toothpaste-total-care', 'TBC-YAZZ-128', null, '[PLACEHOLDER: pack size from Lexta]', 10),
  ('toothbrushes', 'TBC-YAZZ-129', 'Princess, medium bristle', '[PLACEHOLDER: pack size from Lexta]', 10),
  ('toothbrushes', 'TBC-YAZZ-130', 'Monarch, medium bristle with tongue cleaner', '[PLACEHOLDER: pack size from Lexta]', 20),
  ('toothbrushes', 'TBC-YAZZ-131', 'Duchess, medium bristle with tongue cleaner', '[PLACEHOLDER: pack size from Lexta]', 30),
  ('toothbrushes', 'TBC-YAZZ-132', 'Duke, medium bristle with tongue cleaner', '[PLACEHOLDER: pack size from Lexta]', 40),
  ('toothbrushes', 'TBC-YAZZ-133', 'Kids, medium bristle with tongue cleaner', '[PLACEHOLDER: pack size from Lexta]', 50),
  ('toothbrushes', 'TBC-YAZZ-134', 'Double (his & hers), medium bristle with tongue cleaner', '[PLACEHOLDER: pack size from Lexta]', 60),
  ('toothbrushes', 'TBC-YAZZ-135', 'Hanger (Princess, Duchess, Duke, Monarch)', '[PLACEHOLDER: pack size from Lexta]', 70),
  ('washing-powder', 'TBC-YAZZ-136', null, '200g', 10),
  ('washing-powder', 'TBC-YAZZ-137', null, '500g', 20),
  ('washing-powder', 'TBC-YAZZ-138', null, '2kg', 30),
  ('washing-powder', 'TBC-YAZZ-139', null, '5kg', 40),
  ('mama-yazz-jumbo-tissue', 'TBC-YAZZ-140', 'Jumbo size', '[PLACEHOLDER: pack size from Lexta]', 10),
  ('toilet-tissue-individual-wrap', 'TBC-YAZZ-141', 'Single roll', '[PLACEHOLDER: pack size from Lexta]', 10),
  ('tissue-napkin', 'TBC-YAZZ-142', null, '1 roll, 150 sheets', 10),
  ('individual-tissue', 'TBC-YAZZ-143', 'Single roll', '[PLACEHOLDER: pack size from Lexta]', 10)
) as v(product_slug, sku_code, variant_name, pack_size_label, sort_order)
join public.brands b on b.slug = 'yazz'
join public.products p on p.brand_id = b.id and p.slug = v.product_slug and p.updated_by is null
on conflict (sku_code) do nothing;

-- 5. Pack shots (files in the Yazz site only) ------------------------------------------------------------------------------
insert into public.product_images (product_id, external_url, alt_text, sort_order, is_primary)
select p.id, v.url, v.alt_text, v.sort_order,
       v.is_primary and not exists (select 1 from public.product_images i where i.product_id = p.id and i.is_primary)
from (values
  ('sanitary-pads', '/images/original/sanitary-pad-extra-long.webp', 'Yazz Extra Long sanitary pad pack, free panty liner and disposable bag', 10, true),
  ('sanitary-pads', '/images/original/sanitary-pad-minty.webp', 'Yazz Minty sanitary pad pack, 6 normal flow and 6 heavy flow pads', 20, false),
  ('sanitary-pads', '/images/original/sanitary-pad-heavy-flow.webp', 'Yazz Heavy Flow sanitary pad pack in pink', 30, false),
  ('sanitary-pads', '/images/original/sanitary-pad-green.webp', 'Yazz sanitary pad pack in green, 6 normal flow and 6 heavy flow pads', 40, false),
  ('sanitary-pads', '/images/original/sanitary-pad-extra-long-minty.webp', 'Yazz Minty Extra Long sanitary pad pack, 9 extra long and 2 normal flow pads', 50, false),
  ('panty-liners', '/images/original/panty-liner.webp', 'Yazz panty liner pack in yellow', 10, true),
  ('baby-diapers', '/images/original/baby-diapers.webp', 'Yazz baby diapers, medium and large packs', 10, true),
  ('baby-diapers', '/images/original/baby-diapers-super-absorbency.webp', 'Yazz baby diapers pack, super absorbency, size L', 20, false),
  ('toothpaste-herbal', '/images/original/toothpaste-herbal.webp', 'Yazz Herbal toothpaste tube and box', 10, true),
  ('toothpaste-whitening', '/images/original/toothpaste-whitening.webp', 'Yazz Whitening toothpaste tube and box', 10, true),
  ('toothpaste-fluoride', '/images/original/toothpaste-fluoride.webp', 'Yazz Fluoride toothpaste tube and box, 150g', 10, true),
  ('toothpaste-charcoal', '/images/original/toothpaste-charcoal.webp', 'Yazz Charcoal toothpaste tube, 150g', 10, true),
  ('toothpaste-total-care', '/images/original/toothpaste-total-care.webp', 'Yazz Total Care toothpaste tube and box', 10, true),
  ('toothbrushes', '/images/original/toothbrush-princess.webp', 'Yazz Princess toothbrush display box and pack', 10, true),
  ('toothbrushes', '/images/original/toothbrush-monarch.webp', 'Yazz Monarch toothbrush display box and pack', 20, false),
  ('toothbrushes', '/images/original/toothbrush-duke.webp', 'Yazz Duke toothbrush display box and pack', 30, false),
  ('washing-powder', '/images/original/washing-powder.webp', 'The Yazz Activ washing powder range: box, tub and sachets', 10, true),
  ('mama-yazz-jumbo-tissue', '/images/original/mama-yazz-1.webp', 'Two rolls of Mama Yazz', 10, true),
  ('mama-yazz-jumbo-tissue', '/images/original/mama-yazz-2.webp', 'Two rolls of Mama Yazz, red pack', 20, false),
  ('toilet-tissue-individual-wrap', '/images/original/luxury-toilet-tissue.webp', 'Yazz Luxury Toilet Tissue rolls, individually wrapped', 10, true),
  ('tissue-napkin', '/images/original/tissue-napkin-blue.webp', 'Yazz Tissue Napkins pack in blue', 10, true),
  ('tissue-napkin', '/images/original/tissue-napkin-green.webp', 'Yazz Tissue Napkins pack in green', 20, false),
  ('tissue-napkin', '/images/original/tissue-napkin-purple.webp', 'Yazz Tissue Napkins pack in purple', 30, false)
) as v(product_slug, url, alt_text, sort_order, is_primary)
join public.brands b on b.slug = 'yazz'
join public.products p on p.brand_id = b.id and p.slug = v.product_slug and p.updated_by is null
where not exists (
  select 1 from public.product_images i where i.product_id = p.id and i.external_url = v.url
);
