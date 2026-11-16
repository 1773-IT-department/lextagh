-- 0018_original_stockists: the stockists Lexta already publishes on the original Yazz website, in Where to Buy.
--
-- WRITTEN, NOT APPLIED. Desmond decides whether and when to apply it to the live project.
--
-- Source: https://yazzproducts.com/distributors/ ("Distributors, Wholesale and Modern Trade"), read on 16 November 2026.
-- The page's store locator (plugin "store-locator-whatsapp") embeds its 16 published shops in the page; the same 16
-- appear on https://yazzproducts.com/contact/. lextagh.com, linzzyproducts.com and hoochfoods.com publish no stockists.
-- Full list, mapping notes and data quality issues: docs/content/stockists/ORIGINAL-STOCKISTS.md (CSV beside it, in the
-- portal's import format, so the same list can be loaded through Stockists > Import instead of this migration).
--
-- What it changes: adds the 16 shops as active stockists, each linked to the Yazz brand (the only brand the source
-- names). Nothing else: no table, policy or function is touched, other brands' rows and existing stockists are left
-- alone. Idempotent: the unique outlet index (name, region, town, address) makes a second run add nothing, and the
-- brand links use the unique (stockist, brand) pair. A shop that staff have already entered with the same name, region,
-- town and address is left exactly as it is.
--
-- Opening hours are left empty: the source shows the plugin's default "Mon to Sun 9:00 to 18:00" on every shop.

with v(name, outlet_type, region_slug, town, address, phone, latitude, longitude) as (values
  ('Yazz Pro', 'distributor', 'upper-west', 'Upper West Region', null, '0544 350 828', 10.366953, -2.092143),
  ('Richard Baayeh', 'distributor', 'eastern', 'Eastern Region', null, '0501 553 264', 6.446877, -0.377096),
  ('Yazz Pro', 'distributor', 'northern', 'Northern Region', null, '0544 350 828', 9.660001, -0.39438),
  ('Richard Akrong', 'distributor', 'central', 'Central Region', null, '0501553263', 5.724415, -1.376175),
  ('Michael Ampofo', 'distributor', 'greater-accra', 'Accra', 'North Kaneshie', '0205 029 511', 5.581649, -0.234703),
  ('Mr. Padi Batsah', 'distributor', 'greater-accra', 'Accra', 'Agbogbloshie', '0501619590', 5.554534, -0.227484),
  ('Mr. Padi Batsah', 'distributor', 'greater-accra', 'Accra', 'Makola', '0501619590', 5.548074, -0.206932),
  ('Coja B (William)', 'distributor', 'greater-accra', 'Accra', 'Achimota', '0507136465', 5.624202, -0.227681),
  ('Coja B (William)', 'distributor', 'central', 'Kasoa', null, '0507136465', 5.532573, -0.437491),
  ('Coja B (William)', 'distributor', 'greater-accra', 'Accra', 'Adentan', '0507136465', 5.708193, -0.165157),
  ('Coja B (William)', 'distributor', 'greater-accra', 'Accra', 'Madina', '0507136465', 5.676217, -0.155648),
  ('Coja B (William)', 'distributor', 'greater-accra', 'Accra', 'Accra East', '0244938923', 5.661815, -0.166419),
  ('Yazmad', 'distributor', 'ashanti', 'Kumasi', 'Adum, PZ Area', '0501 390 338', 6.694293, -1.623332),
  ('Mr. Amankwah', 'distributor', 'ashanti', 'Kumasi', 'Kumasi Metropolitan Assembly (KMA) area', '0244596943', 6.686532, -1.623039),
  ('Yazz Pro', 'distributor', 'ashanti', 'Kumasi', null, '0544 350 828', 6.698561, -1.623309),
  ('Shoprite Accra Mall', 'supermarket', 'greater-accra', 'Accra', 'Accra Mall, Tetteh Quarshie Avenue', '0508444218', 5.563219, -0.210213)
)
insert into public.stockists (name, outlet_type, region_id, town, address, phone, latitude, longitude, is_active)
select v.name, v.outlet_type, r.id, v.town, v.address, v.phone, v.latitude, v.longitude, true
from v join public.regions r on r.slug = v.region_slug
on conflict do nothing;

with v(name, region_slug, town, address) as (values
  ('Yazz Pro', 'upper-west', 'Upper West Region', null),
  ('Richard Baayeh', 'eastern', 'Eastern Region', null),
  ('Yazz Pro', 'northern', 'Northern Region', null),
  ('Richard Akrong', 'central', 'Central Region', null),
  ('Michael Ampofo', 'greater-accra', 'Accra', 'North Kaneshie'),
  ('Mr. Padi Batsah', 'greater-accra', 'Accra', 'Agbogbloshie'),
  ('Mr. Padi Batsah', 'greater-accra', 'Accra', 'Makola'),
  ('Coja B (William)', 'greater-accra', 'Accra', 'Achimota'),
  ('Coja B (William)', 'central', 'Kasoa', null),
  ('Coja B (William)', 'greater-accra', 'Accra', 'Adentan'),
  ('Coja B (William)', 'greater-accra', 'Accra', 'Madina'),
  ('Coja B (William)', 'greater-accra', 'Accra', 'Accra East'),
  ('Yazmad', 'ashanti', 'Kumasi', 'Adum, PZ Area'),
  ('Mr. Amankwah', 'ashanti', 'Kumasi', 'Kumasi Metropolitan Assembly (KMA) area'),
  ('Yazz Pro', 'ashanti', 'Kumasi', null),
  ('Shoprite Accra Mall', 'greater-accra', 'Accra', 'Accra Mall, Tetteh Quarshie Avenue')
)
insert into public.stockist_brands (stockist_id, brand_id)
select s.id, b.id
from v
join public.regions r on r.slug = v.region_slug
join public.stockists s
  on lower(btrim(s.name)) = lower(btrim(v.name)) and s.region_id = r.id and lower(btrim(s.town)) = lower(btrim(v.town))
  and lower(btrim(coalesce(s.address, ''))) = lower(btrim(coalesce(v.address, '')))
join public.brands b on b.slug = 'yazz'
where s.created_by is null
on conflict (stockist_id, brand_id) do nothing;
