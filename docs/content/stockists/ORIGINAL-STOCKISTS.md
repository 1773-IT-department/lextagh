# Stockists on Lexta's original websites

Read on 16 November 2026, read only. Source: https://yazzproducts.com/distributors/ ("Distributors, Wholesale and Modern Trade"). The page's store locator (WordPress plugin "store-locator-whatsapp") embeds its shops in the page as `SLW_DATA`; the same 16 shops appear on https://yazzproducts.com/contact/.

Other sites checked, none with stockist data: lextagh.com (pages, posts and REST search for stockist, distributor, where to buy), linzzyproducts.com (no distributors or store locator page), hoochfoods.com (serves raw PHP source, no pages). No store locator plugin endpoints (WP Store Locator, Agile Store Locator) exist on any of them.

## What the new sites showed before

Where to Buy on the Lexta site and the Yazz, Linzzy and Hooch sites reads `public.stockists` live (packages/db getStockists, active rows only). The live database has 0 stockists, so the finder shows no shops; there is no static or demo shop list on any site. Only the static list of regions is a fallback. The demo shops in `supabase/tests/local/browser/demo-seed.mjs` are test data and never reach the live database.

## The 16 shops (all carry Yazz; the source names no other brand)

| # | Name | Type | Region | Town | Address | Phone | GPS | Source text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Yazz Pro | distributor | Upper West | Upper West Region |  | 0544 350 828 | 10.366953, -2.092143 | Upper West Region, Ghana |
| 2 | Richard Baayeh | distributor | Eastern | Eastern Region |  | 0501 553 264 | 6.446877, -0.377096 | Eastern Region, Ghana |
| 3 | Yazz Pro | distributor | Northern | Northern Region |  | 0544 350 828 | 9.660001, -0.39438 | Northern Region, Ghana |
| 4 | Richard Akrong | distributor | Central | Central Region |  | 0501553263 | 5.724415, -1.376175 | Central Region, Ghana |
| 5 | Michael Ampofo | distributor | Greater Accra | Accra | North Kaneshie | 0205 029 511 | 5.581649, -0.234703 | North Kaneshie, Accra, Ghana |
| 6 | Mr. Padi Batsah | distributor | Greater Accra | Accra | Agbogbloshie | 0501619590 | 5.554534, -0.227484 | Agbogbloshie, Accra, Ghana |
| 7 | Mr. Padi Batsah | distributor | Greater Accra | Accra | Makola | 0501619590 | 5.548074, -0.206932 | Makola, Accra, Ghana |
| 8 | Coja B (William) | distributor | Greater Accra | Accra | Achimota | 0507136465 | 5.624202, -0.227681 | Achimota, Accra, Ghana |
| 9 | Coja B (William) | distributor | Central | Kasoa |  | 0507136465 | 5.532573, -0.437491 | Kasoa, Ghana |
| 10 | Coja B (William) | distributor | Greater Accra | Accra | Adentan | 0507136465 | 5.708193, -0.165157 | Adentan, Accra, Ghana |
| 11 | Coja B (William) | distributor | Greater Accra | Accra | Madina | 0507136465 | 5.676217, -0.155648 | Madina, Accra, Ghana |
| 12 | Coja B (William) | distributor | Greater Accra | Accra | Accra East | 0244938923 | 5.661815, -0.166419 | Accra East |
| 13 | Yazmad | distributor | Ashanti | Kumasi | Adum, PZ Area | 0501 390 338 | 6.694293, -1.623332 | Adum PZ Area, Kumasi, Ghana |
| 14 | Mr. Amankwah | distributor | Ashanti | Kumasi | Kumasi Metropolitan Assembly (KMA) area | 0244596943 | 6.686532, -1.623039 | KMA. Ashanti region, Ghana |
| 15 | Yazz Pro | distributor | Ashanti | Kumasi |  | 0544 350 828 | 6.698561, -1.623309 | Kumasi, Ashanti Region, Ghana |
| 16 | Shoprite Accra Mall | supermarket | Greater Accra | Accra | Accra Mall, Tetteh Quarshie Avenue | 0508444218 | 5.563219, -0.210213 | Tetteh Quarshie Ave, Accra |

By region: Greater Accra 8 (7 distributors and Shoprite Accra Mall), Ashanti 3, Central 2 (Central Region and Kasoa), Northern 1, Upper West 1, Eastern 1. By type: 15 distributors, 1 supermarket (the source's "Modern Trade").

## Mapping and data quality

- **Region only, no town**: 4 entries give only a region ("Upper West Region, Ghana" and so on). The town is stored as the region text ("Upper West Region") because the database requires a town. [PLACEHOLDER: real town for Yazz Pro (Upper West), Richard Baayeh (Eastern), Yazz Pro (Northern), Richard Akrong (Central)]. Their map pins sit in open country, not in a town centre.
- **Kasoa** is listed as "Kasoa, Ghana"; it is in the Central Region, so it is filed there.
- **Same distributor, several places**: Yazz Pro (3 regions), Mr. Padi Batsah (Agbogbloshie and Makola), Coja B (William) (5 places). These are kept as separate shops because each has its own location. Not duplicates by the database's rule (name, region, town, address).
- **Names cleaned**: the source spells Coja B as the name with an en dash once and "Coja B- William" four times; all five are "Coja B (William)" here (house style has no spaced dashes).
- **Phone and WhatsApp numbers disagree** for some entries: Coja B Accra East phone 0244938923 vs WhatsApp 0507136465 (and the other Coja B entries the reverse), Mr. Amankwah phone 0244596943 vs WhatsApp 0501390337. The phone field is used. Lexta should confirm.
- **Opening hours**: every shop shows "Mon to Sun 9:00 AM to 6:00 PM", which is the plugin's default; left empty.
- **Email**: only Shoprite Accra Mall has one (a personal Gmail address); the stockists table has no email column, so it is not stored.
- **Personal names and numbers**: most distributors are individuals. Lexta publishes them publicly already, but Lexta should confirm they are still current and happy to be listed.
- **Linzzy and Hooch**: no stockists exist for them anywhere on the original sites, so their Where to Buy stays empty until staff add shops in the Business System.

## Loading

Either apply `supabase/migrations/0018_original_stockists.sql` (written, not applied), or import `original-stockists.csv` in the Business System under Stockists > Import. Do one, not both (the import would report all 16 as already in the system).
