# Yazz: content taken from the original website

Source: Yazz's original WordPress website, https://yazzproducts.com, read on 13 November 2026 (pages, the WordPress
REST API at `/wp-json/wp/v2/pages`, `/posts`, `/product`, the WooCommerce store API `/wp-json/wc/store/v1/products`,
and `/sitemap.xml`). Read only: no form was submitted and nothing was logged into.

Desmond's rule: Lexta's Drive content always wins. The original site was used **only to fill gaps** (placeholders and
empty image slots), never to replace Drive wording. Where the two disagree, the Drive version stays and the difference
is listed below. Punctuation was reworded where needed (no em dashes or spaced hyphens). The new site never links to or
hotlinks yazzproducts.com: images were downloaded, optimised with sharp (WebP, at most 800px) and are served from
`apps/yazz/public/images/original/`.

## Filled from the original site

| Item | Source URL | Used in |
| --- | --- | --- |
| Facebook link `https://www.facebook.com/yazzghana/` | https://yazzproducts.com/ (footer), https://yazzproducts.com/contact/ | `lib/site.ts` `socials`: footer Follow Us and Contact page Follow Yazz |
| Instagram link `https://www.instagram.com/yazz_products/` | same | same |
| TikTok link `https://www.tiktok.com/@yazzproducts` | same | same |
| Lavender baby wipes pack size: 80 pieces (printed "80 pcs" on the Lavender pack photo) | https://yazzproducts.com/product/yazz-baby-wipe-lavender/ | `content/catalogue.ts`, baby wipes, Lavender |
| Fluoride toothpaste pack size: 150g ("NET WT:150g" on the pack photo) | https://yazzproducts.com/product/yazz-toothpaste-fluoride/ | `content/catalogue.ts`, Fluoride toothpaste |
| News story "Yazz Is the Preferred Sanitary and Hygiene Brand in 2022" (Home Builders Africa Awards), reworded, citation quoted | https://yazzproducts.com/yazz-is-the-preferred-sanitary-and-hygiene-brand-in-2022/ | `content/articles.ts`, News category, `/tips/yazz-preferred-sanitary-and-hygiene-brand-2022` (date December 2022). Its photo was not used (the award backdrop shows other brands' logos), so the article shows the photo placeholder |

### Images (all in `apps/yazz/public/images/original/`)

Pack shots fill the product cards and product windows of the fallback catalogue (`content/catalogue.ts`, shown when the
database cannot be reached). The live site shows the photos in Product Management; staff can upload these same files
there. Two also fill the empty range photos.

| File | Original image | Product page on the original site | Used in |
| --- | --- | --- | --- |
| `sanitary-pad-extra-long.webp` | /wp-content/uploads/2026/07/Yazz-sanitary-pad-Extra-Long.png | /product/yazz-sanitary-pad-extra-long-free-panty-liner-disposable-bag/ | Sanitary pads (1st) |
| `sanitary-pad-minty.webp` | /wp-content/uploads/2026/07/Yazz-Minty-flow-sanitary-pad.png | /product/yazz-sanitary-pad-minty/ | Sanitary pads |
| `sanitary-pad-heavy-flow.webp` | /wp-content/uploads/2026/07/Yazz-heavy-flow-sanitary-pad.png | /product/yazz-sanitary-pad-pink-heavy-free-panty-liner/ | Sanitary pads |
| `sanitary-pad-green.webp` | /wp-content/uploads/2021/05/Yazz-sanitary-pad-green.jpg | /product/yazz-sanitary-pad-green/ | Sanitary pads |
| `sanitary-pad-extra-long-minty.webp` | /wp-content/uploads/2022/08/WhatsApp-Image-2022-08-30-at-19.09.47-e1661943416559.jpeg | /product/yazz-sanitary-pad-extra-long-minty/ | Sanitary pads |
| `panty-liner.webp` | /wp-content/uploads/2021/05/Yazz-Panty-Liner.jpg (225px, small) | /product/yazz-panty-liner/ | Panty liners |
| `baby-diapers.webp` | /wp-content/uploads/2023/07/Yazz-baby-diaper-new.jpg | /product/yazz-baby-diaper-super-absorbency/ | Baby diapers (1st); Baby Care range photo (`lib/ranges.ts`, range page hero, Products page band) |
| `baby-diapers-super-absorbency.webp` | /wp-content/uploads/2018/12/Yazz-Baby-Diaper-1.jpg | /product/yazz-baby-diaper/ | Baby diapers |
| `toothpaste-herbal.webp` | /wp-content/uploads/2018/12/Yazz-Tooth-Paste-Herbal.jpg | /product/yazz-toothpaste-herbal/ | Herbal toothpaste |
| `toothpaste-whitening.webp` | /wp-content/uploads/2018/12/Yazz-Tooth-Paste-Whitening.jpg | /product/whitening-toothpaste/ | Whitening toothpaste |
| `toothpaste-fluoride.webp` | /wp-content/uploads/2026/08/New-Yazz-Flouride-Toothpaste-e1787744539801.jpg | /product/yazz-toothpaste-fluoride/ | Fluoride toothpaste |
| `toothpaste-charcoal.webp` | /wp-content/uploads/2026/08/New-Yazz-charcoal-Toothpaste-e1787744429757.jpg | /product/yazz-toothpaste-charcoal/ | Charcoal toothpaste |
| `toothpaste-total-care.webp` | /wp-content/uploads/2018/12/Yazz-Tooth-Paste-Total-Care.jpg | /product/total-care-toothpaste/ | Total Care toothpaste |
| `toothbrush-princess.webp` | /wp-content/uploads/2018/10/Yazz-Tooth-Brush-Princess.jpg | /product/princess-tooth-brush/ | Toothbrushes (1st) |
| `toothbrush-monarch.webp` | /wp-content/uploads/2018/10/Yazz-Tooth-Brush-Monarch.jpg | /product/tooth-brush-monarch/ | Toothbrushes |
| `toothbrush-duke.webp` | /wp-content/uploads/2018/10/Yazz-Tooth-Brush-Duke.jpg | /product/tooth-brush-duke/ | Toothbrushes |
| `washing-powder.webp` | /wp-content/uploads/2018/10/Yazz-Washing-Powder.jpg | /product/yazz-washing-powder-500g-200g-5kg-2kg/ | Yazz Activ washing powder; Home Care range photo |
| `mama-yazz-1.webp`, `mama-yazz-2.webp` | /wp-content/uploads/2026/07/Mama-Yazz-Kitchen-Towel1.png, ...Towel2.png | /product/mama-yazz-kitchen-tissue-towel/, /product/mama-yazz-medium/ | Mama Yazz |
| `luxury-toilet-tissue.webp` | /wp-content/uploads/2019/09/tissue3a.jpg | /product/yazz-toilet-tissue/ | Individual wrap luxury toilet tissue |
| `tissue-napkin-blue.webp`, `-green`, `-purple` | /wp-content/uploads/2026/07/Yazz-tissue-napkins1.png, 2, 3 | /product/yazz-tissue-napkin/ | Tissue napkin |

Every image shows Yazz packaging only and has its own alt text in `content/catalogue.ts` or `lib/ranges.ts`.

## Checked but not used

- **Baby wipes photos** (Aloe Vera, Castor Oil, Lavender packs): the packs show Disney characters (Mickey and Minnie
  Mouse), i.e. another brand's property, so they were not used. Baby wipes and pull up pants still need pack shots.
- **News photo** for the 2022 award: other companies' logos on the backdrop. Not used.
- **Other news posts** (cervical cancer screenings, Empowered Periods, Cook Art competitions, police partnerships,
  MX24 TV CroxItOut tour, Safe Bottoms, Bright Smiles, Clean Hands Green Land): CSR content, out of scope for brand sites.
- **"Your Trust, Our Priority: An Update on Yazz Products"** (April 2026, /your-trust-our-priority-an-update-on-yazz-products/):
  a statement on 2025 supply problems and a quality investigation. Sensitive; for Lexta to decide. It also names pad
  variants differently from Drive (Heavy Pink, Minty Blue, Herbal Green, Mauve Minty Extra Long, Purple Extra Long).
- **Several old blog posts contain injected spam text** (pharmacy adverts inside "Cook Art Competition", "Menstrual
  Hygiene Day", "Yazz End of Year Award"). The original site appears to have been compromised; worth telling Lexta.
  None of that text was used.
- **Customer care hours**: not on the original site.
- **Minimum bulk order quantities**: not on the original site (the Distributors page is only a stockist finder).
- **YouTube and X**: the original site links to no Yazz YouTube or X account.
- **SKUs**: WooCommerce shows "YSPM" (Yazz Sanitary Pads, one parent product) and "YBW" (one baby wipe). These are
  product level codes, not one per pack, so the `TBC-YAZZ-...` codes stay until Lexta sends real ones.
- **Prices, cart, checkout, My Account**: the original site has a shop; not used (no shop on the new site).
- **"My Period & Me"** (Tips Just 4 You page on the original site): only the same introduction and sub-topic list that
  Drive has, no article text. "Choosing My Yazz" on that page is template filler text.

## Differences from Drive (Drive kept)

| Topic | Drive (on the site) | Original site |
| --- | --- | --- |
| Consumer support email | support@yazzproducts.com | Contact page: Support@lextagh.com (complaints) and Marketing@lextagh.com (partnerships); product pages use support@yazzproducts.com |
| Mama Yazz | "Jumbo size tissue" for busy households | Sold as "Mama Yazz Kitchen Tissue Towel" / "2 Ply Kitchen Towel", a multipurpose kitchen towel, plus a "Mama Yazz Medium" product (no details). The photos used show the Mama Yazz kitchen towel packs. Please confirm the product description and whether a Medium size exists |
| Toilet tissue | Individual wrap luxury toilet tissue, single roll | Also a "Yazz Toilet Tissue / Toilet Tissue" pack of 10 rolls, 100% virgin pulp, made in Ghana. Not added (not in Drive's catalogue) |
| Toothbrushes | Princess, Monarch, Duchess, Duke, Kids, Double, Hanger | Also a "Prince" toothbrush with its own photo. Not added |
| Pink panty liner | Pack size to come | The Pink liner page repeats the extra long minty text ("24 minty liners"), probably copied, so not used |
| Lavender wipes ingredients | "hydrogenated lavender extract" | "hydrogenated castor oil" (same list as the other wipes) |
| Panty liner pack sizes and pad variants | As in Drive | Woo attribute list also names "Extra Long Maxxi" and "Extra Long Minty Maxxi" variants. Not added |
| Customer care phone | +233 544 351 010 (and the other Drive numbers) | Same number, +233544351010: no conflict |

## Also noticed

The database seed (migration 0004, Product Management) points some Yazz product photos at
`https://yazzproducts.com/wp-content/uploads/...` and `https://lextagh.com/...` URLs. Those are hotlinks to Lexta's live
sites; when staff update the products in the portal they can upload the files in `public/images/original/` instead.
(Not changed here: no Supabase work in this pass.)
