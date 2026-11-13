# Yazz site: content still needed

Lexta's Yazz content from Google Drive is in the site: "yazz website content.docx" (Yazz Tab Content) and
"yazz article.docx" (YAZZ ARTICLES). The "YAZZ TIPS" folder showed no readable documents when the site was built
(13 November 2026). Everything below is marked `[PLACEHOLDER: ...]` on the site or listed here for Desmond to confirm.

## Photos (no stock photos are used)

The six images on Desmond's Claude Design prototype are used where they fit (`public/images`). Still needed, each shown
as a marked placeholder block:

- About Us: factory photo of Lexta personnel at work in Yazz outfits (the content document asks for it), a production
  line or quality team photo, and a family photo with Yazz products at home.
- Baby Care: diapers, pull up pants and baby wipes pack shots (range page, Home category tile).
- Home Care: Yazz Activ washing powder pack shots (200g, 500g, 2kg, 5kg).
- A pack shot for every product, uploaded in Product Management (the portal), so the site and the Lexta Our Brands page
  update together. The 36 MB products zip on Drive was not downloaded; images go in through the portal.
- A thumbnail for each article (the article document asks for one per article): 27 articles, see `content/articles.ts`.

## Product data (Product Management)

- The database still holds the 8 Yazz products seeded from the Lexta prototype (migration 0004). Lexta's real catalogue
  (17 products: pads, liners, diapers, pull up pants, wipes, five toothpastes, toothbrushes, washing powder and five
  tissue products) is structured in `content/catalogue.ts`. Staff can enter it in the portal, or 1773 can turn it into a
  data migration on request (it would also change the Yazz cards on the Lexta Our Brands page and two harness suites
  that expect the 8 seeded products). Until then the site shows the 8 seeded products; the catalogue is what the site
  shows if the database cannot be reached.
- SKU codes for every product (all `TBC-YAZZ-...` for now).
- Pack sizes not in the document: Lavender wipes, regular (yellow) and pink panty liners, Fluoride and Total Care
  toothpaste, each toothbrush, Mama Yazz, individual wrap toilet tissue and individual tissue.
- To confirm: "Certified ISO09001:2000" as written (shown as "Certified ISO 9001:2000"); the wipes ingredient spellings
  ("methyichloroisthiazolinone" is copied as written); small spelling fixes made in the toothpaste ingredients
  ("sodium lauryl sulfate", "honeysuckle", "flavour").
- Pocket Tissue is shown as "coming soon"; Yazz Dental Floss ("coming soon" in the document) is not listed.

## Contact and social

- Yazz consumer care hours (also the live chat office hours).
- The Yazz Facebook, Instagram, TikTok and YouTube links (only the Lexta Ghana WhatsApp channel was given).
- The phone number written "+233 02235296" is shown as +233 302 235 296; please confirm.
- The Lexta head office pin on the Where to Buy map is placed approximately at Dzorwulu; exact coordinates welcome.
- The wireframe proposes marketing@lextagh.com as the interim address for stockist enquiries; the site shows the Yazz
  addresses from the Contact section (forms go into the CRM either way).

## Words still to come

- Minimum bulk order quantities (FAQ answer).
- News: no Yazz news stories yet (the News category shows a placeholder).
- "My Period & Me": the document lists its sub-topics (what is a period, cycle, flow, tracking) but no text.
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
- Separate "Where to Buy" and "Tips & Advice" mega menu tabs: Where to Buy is part of Contact & Where to Buy, and the
  Tips & Articles menu lists the article categories.
