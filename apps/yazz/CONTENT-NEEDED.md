# Yazz site: content still needed

Lexta's Yazz content from Google Drive is in the site: "yazz website content.docx" (Yazz Tab Content) and
"yazz article.docx" (YAZZ ARTICLES). The "YAZZ TIPS" folder showed no readable documents when the site was built
(13 November 2026). Everything below is marked `[PLACEHOLDER: ...]` on the site or listed here for Desmond to confirm.

Some gaps were filled on 13 November 2026 from Yazz's original website (yazzproducts.com): Facebook, Instagram and
TikTok links, pack shots, the Baby Care and Home Care range photos, two pack sizes and one news story. Each item, its
source and the differences from Drive are in `docs/content/yazz/ORIGINAL-SITE.md`. Drive wording was not changed.

## Photos (no stock photos are used)

The six images on Desmond's Claude Design prototype are used where they fit (`public/images`). Still needed, each shown
as a marked placeholder block:

- About Us: factory photo of Lexta personnel at work in Yazz outfits (the content document asks for it), a production
  line or quality team photo, and a family photo with Yazz products at home.
- Baby Care and Home Care range photos: filled for now with pack shots from the original site (diapers; the Yazz Activ
  range). A proper range photo is still welcome.
- Pack shots still missing: pull up pants, baby wipes (the original site's wipes photos show Disney characters, so they
  were not used), Yazz Activ by pack size (200g, 500g, 2kg, 5kg), individual tissue, pocket tissue and dental floss.
- A pack shot for every product, uploaded in Product Management (the portal), so the site and the Lexta Our Brands page
  update together. The fallback catalogue now has pack shots from the original site for most products
  (`public/images/original`); staff can upload the same files in the portal. The 36 MB products zip on Drive was not
  downloaded; images go in through the portal.
- A thumbnail for each article (the article document asks for one per article): 28 articles, see `content/articles.ts`.
  The original site has no article photos to reuse.

## Product data (Product Management)

- The database still holds the 8 Yazz products seeded from the Lexta prototype (migration 0004). Lexta's real catalogue
  (17 products: pads, liners, diapers, pull up pants, wipes, five toothpastes, toothbrushes, washing powder and five
  tissue products) is structured in `content/catalogue.ts`. Staff can enter it in the portal, or 1773 can turn it into a
  data migration on request (it would also change the Yazz cards on the Lexta Our Brands page and two harness suites
  that expect the 8 seeded products). Until then the site shows the 8 seeded products; the catalogue is what the site
  shows if the database cannot be reached.
- SKU codes for every product (all `TBC-YAZZ-...` for now).
- Pack sizes not in the document: regular (yellow) and pink panty liners, Total Care toothpaste, each toothbrush, Mama
  Yazz, individual wrap toilet tissue and individual tissue. (Lavender wipes, 80 pieces, and Fluoride toothpaste, 150g,
  were filled from the original site's pack photos.)
- To confirm against the original site (see ORIGINAL-SITE.md): Mama Yazz is sold there as a 2 ply kitchen towel with a
  "Medium" size; a 10 roll toilet tissue pack and a "Prince" toothbrush are listed there but not in Drive.
- To confirm: "Certified ISO09001:2000" as written (shown as "Certified ISO 9001:2000"); the wipes ingredient spellings
  ("methyichloroisthiazolinone" is copied as written); small spelling fixes made in the toothpaste ingredients
  ("sodium lauryl sulfate", "honeysuckle", "flavour").
- Pocket Tissue and Yazz Dental Floss are shown with a Coming soon badge and no Where to buy link. They come from the
  static catalogue, so they show even when Product Management has no row for them. Dental Floss needs a pack shot and
  a description when it launches.
- Yazz Activ: the "Note" (dissolve and soak for 15 to 20 minutes before washing) is in the fallback catalogue's How to
  use and safety text; the database row seeded from the prototype (0004) does not have it, so staff should add it in
  Product Management.

## Contact and social

- Yazz consumer care hours (also the live chat office hours). Not on the original site either.
- The Yazz YouTube link (Facebook, Instagram and TikTok now come from the original site; it links to no YouTube or X).
- The original site gives Support@lextagh.com and Marketing@lextagh.com on its Contact page; the site keeps Drive's
  @yazzproducts.com addresses. Please confirm which Lexta wants.
- The phone number written "+233 02235296" is shown as +233 302 235 296; please confirm.
- The Lexta head office pin on the Where to Buy map is placed approximately at Dzorwulu; exact coordinates welcome.
- The wireframe proposes marketing@lextagh.com as the interim address for stockist enquiries; the site shows the Yazz
  addresses from the Contact section (forms go into the CRM either way).

## Words still to come

- FAQs page (`/faqs`), answers Lexta still has to give: minimum bulk order quantities (not on the original site). Every
  other answer uses Lexta's own wording from the articles and product content; more questions can be added to
  `content/faqs.ts` on request.
- News: one story from the original site (the 2022 Home Builders Africa Award). More Yazz news stories and press
  releases are welcome; the original site's other news is CSR (out of scope) or a sensitive April 2026 product update
  for Lexta to decide on.
- "My Period & Me": the document lists its sub-topics (what is a period, cycle, flow, tracking) but no text (the original site has the same introduction only).
- Home & Tissue tips (kitchen hygiene, tissue handling, cleaning routines, waste reduction): topics only, no text.
- Parenting editorial (pregnancy, 0 to 12 months, 12 to 24 months): topics only, no text.
- The undated articles (Just 4 Parents and the topic pages) need dates if Lexta wants them shown.

## In Lexta's documents but outside the agreed scope (not built)

The contract allows 6 pages per brand site and no CSR pages, shop, quizzes, parenting tools or staff CMS. Not built:

- A "Community Impact" (CSR) tab with the six Yazz initiatives (Empowered Periods, Cervical Cancer Awareness, Forest
  Project, Clean Hands Green Land, Safe Bottoms, Bright Smiles) and the CSR proposal form with attachment. About Us and
  the footer link to the CSR page of the Lexta site instead.
- The "Find My Yazz" interactive pad selector (flow, day or night, what matters most).
- Parenting tools: diaper planner, diaper finder, saved reminders, pregnancy calendar, matchmakers and calculators.
- "What's Inside My Yazz?" with an interactive pad diagram (also needs verified material and testing information).
- "Yazz Period Talk" school and community programmes (CSR).
- Access to a blog backend for Lexta staff (articles are edited by 1773 on request).
- A separate Legal / Trademark page: the trademark notice is on About Us and the short statement in the footer.
  (The sixth page is FAQs, as Desmond chose.)
- Separate "Where to Buy" and "Tips & Advice" mega menu tabs: Where to Buy is part of Contact & Where to Buy, and the
  Tips & Advice menu lists the article categories.

- Better panty liner pack shot: the one from the original site is only 225 x 225 px and looks soft in the product window.
- Product Management: the seeded "Tissue" product lists pocket tissues while Lexta's content calls Pocket Tissue "coming soon". The site hides the coming soon card while a live product sells pocket tissues; staff should correct the product.
