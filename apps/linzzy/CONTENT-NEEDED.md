# Linzzy site: content still needed

The site is built from Lexta's Linzzy content on Google Drive ("Linzzy Website Content.docx", Linzzy Tab Content), as
saved in `docs/content/linzzy/`: the website copy (Home, About Us, Contact Us), the products page, the twelve Tips & Advice
articles with the six quick tips, and the Parent Corner editorial text. The original linzzyproducts.com
(`docs/content/linzzy/original-site/`) only filled gaps: pack shots, lifestyle artwork, the logo and the Facebook and
Instagram links. Drive wording was never changed (dashes only). Everything below is marked `[PLACEHOLDER: ...]` on the
site or listed here for Desmond to confirm.

## Lexta's instructions (yellow highlights), and how they were handled

- The "Linzzy, visual wireframe / click & email routes" table is an instruction, not copy. Nothing from it is printed.
  Routes built: Home, About, Products (Feminine Care and Baby Care), Tips & Advice, Where to Buy and Contact; feminine
  care tips and baby tips as article cards that link to the relevant product range; enquiries into the shared CRM
  (brand Linzzy); complaints into the complaints tracker; footer with the Lexta family, privacy, terms and social links.
- Not built as the wireframe asks, because it conflicts with the agreed 6 page design or scope:
  - Separate "Feminine Care" and "Baby Care" top menu tabs: they are under one Products tab with a dropdown, so the
    nav keeps exactly the 6 approved pages (Home, Products, About Us, Tips & Advice, FAQs, Contact).
  - "Community Impact" tab: no CSR page on brand sites. The footer, the home page ("Explore Our Community
    Initiatives") and the contact page link to the Lexta site's CSR page instead.
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

- The database still holds the 3 Linzzy products seeded from the Lexta prototype (migration 0004): "Sanitary
  napkins", "Baby wipes" and "Baby care", with invented claims ("clinical anti leak barriers", "fragrance free") and
  photos hotlinked from lextagh.com. The site no longer shows any of that: Lexta's Drive catalogue
  (`content/catalogue.ts`, 6 products) wins for every product wording, the two umbrella rows without a Drive product
  are skipped, products the database lacks are shown from the catalogue, and no image from lextagh.com,
  yazzproducts.com, linzzyproducts.com or hoochfoods.com is ever shown (`lib/products.ts`).
- Migration `supabase/migrations/0016_linzzy_catalogue_products.sql` is written but **not applied**: it unpublishes the
  two umbrella rows, corrects the "Baby wipes" row in place and writes the six Drive products with their pack sizes and
  pack shots. Desmond decides whether to apply it. It also changes the Lexta site's Our Brands page (see the PR notes).
- SKU codes for every product (all `TBC-LINZZY-...` in the catalogue).
- Diaper sizes: only Medium (42, 6 to 9 kg) and Large (40, 9 to 13 kg) are confirmed by Lexta. The original site also
  lists Small (44, 3 to 6 kg) and Extra Large (38, over 13 kg): please confirm against current packaging.
- Complete ingredient lists for each wipes variant, and material and fragrance information for the towels and liners
  (Lexta's "Required verification" table). The "0% alcohol and parabens" pack claim is not shown until verified.

## Contact and social

- Emails: Lexta's Contact page gives info@, marketing@ and support@linzzyproducts.com, and its last block repeats the
  Yazz addresses (a copy error, not used). The original linzzyproducts.com shows Lexta addresses only. Please confirm
  the @linzzyproducts.com mailboxes exist before go-live, or say which addresses to use.
- Linzzy consumer care hours (also the live chat office hours).
- TikTok and X links for @Linzzyproducts (Facebook and Instagram come from the original site).
- The phone number written "+233 02235296" is shown as +233 302 235 296; please confirm.
- The Lexta head office pin on the map is placed approximately at Dzorwulu; exact coordinates welcome.
- Lexta's Contact form asks for an optional product photo or document upload. The complaint intake has no attachment
  field, so it is not built; the care team can ask for a photo by email or WhatsApp. Adding uploads would need a
  database change (not written).

## Words still to come

- FAQs: Lexta sent no Linzzy FAQ list. The FAQs page uses Lexta's own wording from the product page, the articles and
  the About and Contact pages. More questions can be added to `content/faqs.ts` on request.
- Article dates: none given, so none are shown.

## In Lexta's documents but outside the agreed scope (not built)

- The CSR page ("Linzzy Cares": The Safe Bottoms Initiative, menstrual health education, parenting education,
  partnerships, transparency and impact reporting) and the "Empowered Periods / Flawless Flow" programme with its
  "Submit a Community Proposal" button. Brand sites have no CSR pages; links go to the Lexta site's CSR page, and
  proposals to the partnerships email.
- Linzzy Parent Corner submissions: the "Share Your Story" form, story spotlight, photo upload with child photo consent,
  "Submit Your Question" and the expert reviewed Q&A. Only the editorial text is on Tips & Advice (welcome, this
  month's question from Lexta's monthly themes, the topics). The home page button "Join Linzzy Parent Corner" opens it.
- Shop, cart and prices (the original site's store notice and 0 GHS prices are not reused).
- Product finder, quizzes, parenting tools, diaper planner or finder, games, an AI chatbot and a news CMS.
