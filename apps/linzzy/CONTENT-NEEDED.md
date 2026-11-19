# Linzzy site: content still needed

The site is built from Lexta's Linzzy content on Google Drive ("Linzzy Website Content.docx", Linzzy Tab Content), as
saved in `docs/content/linzzy/`: the website copy (Home, About Us, Contact Us), the products page, the twelve Tips & Advice
articles with the six quick tips, and the Parent Corner editorial text. The original linzzyproducts.com
(`docs/content/linzzy/original-site/`) only filled gaps: pack shots, lifestyle artwork, the logo and the Facebook and
Instagram links. Drive wording was never changed (dashes only). Since the strict source sweep (17 November 2026) no
copy 1773 wrote itself is shown; see `docs/content/linzzy/PLACEHOLDERS.md`. Everything below is marked
`[PLACEHOLDER: ...]` on the site or listed here for Desmond to confirm.

## Lexta's instructions (yellow highlights), and how they were handled

- The "Linzzy, visual wireframe / click & email routes" table is an instruction, not copy. Nothing from it is printed.
  Routes built: Home, About, Products (Feminine Care and Baby Care), Tips & Advice, Where to Buy and Contact; feminine
  care tips and baby tips as article cards that link to the relevant product range; enquiries into the shared CRM
  (brand Linzzy); complaints into the complaints tracker; footer with the Lexta family, privacy, terms and social links.
- Separate "Feminine Care" and "Baby Care" menu entries (built 17 November 2026, item Z7) were taken out again on
  19 November 2026 at Desmond's request: the menu has one Products entry, in the order Home, About Us, Products,
  Tips & Advice, FAQs, Contact & Where to Buy. Feminine Care and Baby Care stay as the two bands of /products and in
  the page's "On this page" list and the footer.
- Not built as the wireframe asks, because it conflicts with the agreed 6 page design or scope:
  - "Community Impact" tab: no CSR page on brand sites. The footer of every page ("Community Impact (CSR)") links to
    the Lexta site's CSR page, and the contact page's CSR card sends proposals to the partnerships email. Since
    17 November 2026 (Z3) the home page carries Lexta's "Caring Beyond Our Products" block with its Explore Our
    Community Initiatives button, and the About page a "Learn about the Safe Bottoms Initiative" link, both out to the
    Lexta CSR page.
  - "Where to Buy" as its own tab: it is part of Contact & Where to Buy, with a Where to Buy button in the header.
  - Hero "Shop the Range": there is no shop, so the button says "Explore Our Products".
  - "Enquiry → marketing@lextagh.com (proposed interim)" and "complaints → designated customer-care inbox (confirm)":
    the forms go into the Business System, so no inbox is needed for them. The site shows the @linzzyproducts.com
    addresses from Lexta's Contact page; please confirm which addresses Lexta wants (see Contact below).
- Status notes ("verified catalogue", "(proposed interim)", "(confirm)") are not shown anywhere.
- Lexta's own "insert distributor catalogue and location indicators already on our website" (Contact page) is read as
  an instruction too: the Where to Buy finder (stockist list and map) and the product range are on the same page.

## Photos

- Pack shots from the original site (`public/images/original`): Heavy Flow, Cool Mint, Extra Long, Panty Liner, Baby
  Diapers (size L) and Baby Wipes (yellow, pink and blue). The four pad and liner shots are small on the original site
  (about 240 px wide) and look soft when shown large; sharper originals are welcome, and the same files should be
  uploaded in Product Management (the portal) so the site and the Lexta Our Brands page update together.
- Lifestyle artwork from the original site: the "on the go" banner, the yoga ("Flow. Focus. Grow.") artwork and the
  mother and daughter image (the original site used it for its Safe Bottoms post).
- Lexta's AI made Linzzy nursery images from Drive ("LINZZY ARTICLES"): diaper bag, joyful baby, baby wipes, mother
  changing a diaper, father at playtime. **Lexta must check the packaging shown in them**: Lexta's own thumbnail guide
  says AI reconstructed packaging must be replaced with the exact product artwork (logos, quantities, sizes and claims,
  for example the "0% Alcohol Parabens" drop on the wipes packs, which Lexta says still needs verifying).
- Two article covers were made from the real pack shots, following Lexta's thumbnail guide: "Know Your Flow"
  (three product comparison) and "Panty Liners Explained" (soft lavender product display).
- Still needed, shown as marked placeholders: a photo for "Period Hygiene 101" (guide: clean bathroom vanity with Heavy
  Flow) and for "Keeping Your Baby Comfortable in Ghana's Warm Weather".
- The logo is the original site's PNG. A vector logo (SVG) is welcome.
- Not used: the original site's theme demo photos, the "yara" cartoon, the Yazz distributors graphic, campaign posters
  with text claims ("Ghana's Newest Sanitary Pads", "Flow Fearless Campaign" for Empowered Periods, which is CSR).

## Product data (Product Management)

- Migration `supabase/migrations/0016_linzzy_catalogue_products.sql` is **applied**: the six Drive products are
  published in Product Management with Lexta's wording, pack sizes and pack shots, the seeded "Baby wipes" row was
  corrected in place, and the two prototype umbrella rows ("Sanitary napkins" and "Baby care", with invented claims
  such as "clinical anti leak barriers") are unpublished, so the site cannot show them. Product Management now decides
  what shows and how it reads; `content/catalogue.ts` is the fallback if the database cannot be reached and supplies
  the product page extras the database has no column for (headline, recommended use, skin sensitivity, "Linzzy Says").
  No image from lextagh.com, yazzproducts.com, linzzyproducts.com or hoochfoods.com is ever shown (`lib/products.ts`).
- The product cards show the database's short description, which is now the sentence of Lexta's own description that
  names the product (strict source sweep; migration `0023_linzzy_products_strict_drive_text.sql` is written, **not
  applied**: until Desmond applies it, the live site still shows the old 1773 one line summaries from 0016). The
  product details panel shows Lexta's full description and, since 17 November 2026 (Z1, Z2), Lexta's headline, key
  features, one expandable "Usage, Ingredients & Skin Sensitivity" row (recommended use, how to use, skin sensitivity
  and allergy precautions, ingredients where given), a Read more line with up to two related articles and the
  "Linzzy Says" line. Each article links back to its product when exactly one product lists it.
- SKU codes for every product (all `TBC-LINZZY-...` in the catalogue).
- Diaper sizes: only Medium (42, 6 to 9 kg) and Large (40, 9 to 13 kg) are confirmed by Lexta. The original site also
  lists Small (44, 3 to 6 kg) and Extra Large (38, over 13 kg): please confirm against current packaging.
- Complete ingredient lists for each wipes variant, and material and fragrance information for the towels and liners
  (Lexta's "Required verification" table). The wipes ingredients placeholder is now visible in the product panel's
  usage row; the towels and liners show no ingredients row until Lexta gives them. The "0% alcohol and parabens" pack
  claim is not shown until verified.

## Contact and social

- Emails: Lexta's Contact page gives info@, marketing@ and support@linzzyproducts.com, and its last block repeats the
  Yazz addresses (a copy error, not used). The original linzzyproducts.com shows Lexta addresses only. Please confirm
  the @linzzyproducts.com mailboxes exist before go-live, or say which addresses to use.
- Linzzy consumer care hours (also the live chat office hours).
- TikTok and X links for @Linzzyproducts (Facebook and Instagram come from the original site).
- The phone number written "+233 02235296" is shown as +233 302 235 296 (as on the original linzzyproducts.com);
  please confirm.
- Trade enquiry form: Lexta gave no volume bands, so the expected monthly volume list shows a marked placeholder
  option until Lexta's sales team gives them. The "I am a" options follow Lexta's segments (distributor or
  wholesaler, modern trade or supermarket, other business).
- The Lexta head office pin on the map is placed approximately at Dzorwulu; exact coordinates welcome.
- Lexta's Contact form "Subject" field is built (Z4): optional, up to 150 characters, sent at the top of the CRM lead
  or complaint text ("Subject: ...") as neither has a subject column.
- Lexta's Contact form asks for an optional product photo or document upload. The complaint intake has no attachment
  field, so it is not built; the care team can ask for a photo by email or WhatsApp. Adding uploads would need a
  database change (not written).

## Words still to come

- FAQs: Lexta sent no Linzzy FAQ list. Every question is now one of Lexta's own headings (article subheadings, product
  page labels, Contact page lines) and every answer is the Drive text under it; only the grouping is 1773's. A list of
  real customer questions from Lexta's care team would make the page better. More can be added to
  `components/linzzy/faq-data.ts` on request.
- Tips & Advice baby section (Z5): Lexta's intro, lightly adapted from "The Linzzy Tips & Advice page will serve as an
  educational and supportive space ...", and the four baby content categories as filter chips. Two articles were
  placed by 1773 because their topics are not one of the four: "Diaper Changing Made Easier" (Baby Hygiene & Daily
  Care) under Baby Care Essentials, and "Keeping Your Baby Comfortable in Ghana's Warm Weather" (Baby Comfort &
  Seasonal Care) under Diaper Fit & Comfort. Lexta may move them.
- Article dates: none given, so none are shown.
- Reading times: only Lexta's own figure, on the two articles that give one (3 minutes each); the other ten show none.
- Tips & Advice sign up: Lexta's master content lists "Newsletter / educational updates" (opt in, with unsubscribe
  and a privacy notice) as a shared form, so the Tips page offers Linzzy educational updates by email. Lexta gave no
  copy for it, so the block shows only its heading ("Stay Connected with Linzzy", Drive) and the form. Lexta to
  confirm what the updates will contain and who sends them, and give a line for it if wanted.
- Contact form: the privacy line under the message ("Please do not share sensitive health details ...") was 1773's and
  was removed in the strict sweep; Lexta may want one in its own words.

## In Lexta's documents but outside the agreed scope (not built)

- The CSR page ("Linzzy Cares": The Safe Bottoms Initiative, menstrual health education, parenting education,
  partnerships, transparency and impact reporting) and the "Empowered Periods / Flawless Flow" programme with its
  "Submit a Community Proposal" button. Brand sites have no CSR pages; links go to the Lexta site's CSR page, and
  proposals to the partnerships email.
- Linzzy Parent Corner submissions: the "Share Your Story" form, story spotlight, photo upload with child photo consent,
  "Submit Your Question" and the expert reviewed Q&A. Only the editorial text is on Tips & Advice (welcome, Lexta's
  featured question "What's One Baby Care Tip You Wish You Had Known Earlier?", the topics); answers go through the
  Contact page. The monthly themes are not rotated, so the page never shows a stale month. The home page button
  "Read Parent Corner" opens it.
- Shop, cart and prices (the original site's store notice and 0 GHS prices are not reused).
- Product finder, quizzes, parenting tools, diaper planner or finder, games, an AI chatbot and a news CMS.

## Drive requests built 17 November 2026 (Desmond approved)
- **Lexta family in the footer**: links to Lexta and the two sister brand sites. They use NEXT_PUBLIC_YAZZ_SITE_URL,
  NEXT_PUBLIC_LINZZY_SITE_URL and NEXT_PUBLIC_HOOCH_SITE_URL, falling back to the Vercel previews; Desmond sets the
  real domains only at go-live (.env.example).
- **Community Impact** in the menu (desktop last item, phone menu last): a link out to the Lexta CSR page, not a page.
- **Breadcrumbs** (Home > Page) on the inner pages.
- Breadcrumbs sit above the eyebrow on About, Contact, FAQs, Tips and the articles. **Products has none**: its opening
  is a pinned, animated scene with the title laid over it, where a row would clash. The old range addresses redirect.
