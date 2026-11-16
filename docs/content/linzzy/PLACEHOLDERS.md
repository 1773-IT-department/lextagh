# Linzzy site: placeholders and 1773-written copy

Branch `content/linzzy-source-rewrite`. Sources, in order: Lexta's Drive ("Linzzy Website Content.docx", saved in
`docs/content/linzzy/`), then the original linzzyproducts.com (`docs/content/linzzy/original-site/`), then copy 1773
wrote from facts in those two. Every `[PLACEHOLDER: ...]` below is shown on the site so the design does not change.

## Placeholders on the site

| Page | Slot | Placeholder text | Why it could not be filled | Who at Lexta likely knows |
| --- | --- | --- | --- | --- |
| Every page (footer) | Social links after WhatsApp, Facebook, Instagram | `[PLACEHOLDER: TikTok and X links from Lexta]` | Drive lists TikTok and X for @Linzzyproducts but gives no links; the original site has none | Marketing / social media team |
| Contact, live chat | Consumer care hours (Get in Touch; chat office hours) | `[PLACEHOLDER: Linzzy consumer care hours]` | Office hours are a specific fact; no source gives them | Consumer care / customer service lead |
| Contact, trade enquiry form | "Expected monthly volume (optional)" list option (new in this change; replaces invented carton bands "Under 10 / 10 to 50 / 50 to 200 / Over 200 cartons a month") | `[PLACEHOLDER: monthly volume bands, from Lexta's sales team]` | Trade volume thresholds are commercial terms; Lexta gave none for Linzzy and the original site's form had no volume field | Sales / commercial manager |
| Tips & Advice, "Period Hygiene 101" card and article | Article photo | `[PLACEHOLDER: clean bathroom vanity with Linzzy Heavy Flow (Lexta's thumbnail guide)]` | No matching photo in Drive or on the original site | Marketing (Lexta's thumbnail guide owner) |
| Tips & Advice, "Keeping Your Baby Comfortable in Ghana's Warm Weather" card and article | Article photo | `[PLACEHOLDER: warm weather baby care scene with Linzzy Baby Diapers]` | No matching photo in Drive or on the original site | Marketing |
| Products (data, not rendered) | Diaper sizes other than M and L | `[PLACEHOLDER: other sizes and pack quantities, confirmed against current packaging]` | Drive confirms only Medium and Large; the original site's Small and Extra Large are unverified. Filtered out of "In the pack" | Product / brand manager |
| Products (data, not rendered) | Wipes ingredients | `[PLACEHOLDER: complete ingredient list for each wipes variant, from Lexta]` | Ingredients are a regulated fact; Lexta's "Required verification" table says to verify | Product / quality assurance |

To confirm (shown, not placeholders): the phone number Drive writes "+233 02235296" is shown as +233 302 235 296 (the
original site's form); the info@, marketing@ and support@linzzyproducts.com mailboxes (Drive copy, mailboxes
unconfirmed); whether Lexta wants trade enquirers asked "Years in business".

## Rewritten in this change

From the Drive (Drive wins):
- Home, closing contact block: "We're Here to Listen" + Contact page line replaced by Drive's Home block "Stay
  Connected with Linzzy / Have a question, product experience or suggestion? We would love to hear from you. Your
  feedback matters because every experience helps us understand how we can serve you better." CTA "Contact Linzzy"
  (Drive [CONTACT LINZZY]).
- Products, Feminine Care band lead: Drive's second sentence added ("Discover the Linzzy Feminine Care Collection,
  featuring sanitary towels and panty liners ...").
- Products, Baby Care band lead: Drive's second sentence added ("Explore our baby diapers and wipes, created for
  families who value comfort, cleanliness and convenient care.").
- Products, details panel: the description slot now shows Lexta's full product description (database
  long_description = Drive "3. Products Page") instead of the 1773 one line summary. Cards keep the summary.
- FAQs, "Which Linzzy sanitary towel should I choose?": Cool Mint sentence restored to Drive wording with Lexta's
  caveat "Cooling products may not suit everyone, particularly those with sensitive skin." (feminine-01).
- Tips & Advice, Parent Corner question: Drive's featured question "What's One Baby Care Tip You Wish You Had Known
  Earlier?" with its prompt ("Was it a smarter way to pack your diaper bag? ...") and "Tell us what you've learned and
  why it matters ... Your little discovery could become another parent's big help!" The hard coded November theme
  ("Family Support") and question are gone, so the card no longer goes stale.
- Tips & Advice and articles, reading times: "Long Days, Busy Schedules" 3 min and "Is Your Baby Wearing the Right
  Diaper Size?" 3 min (Drive's own figures).
- Contact, Send Us a Message intro: Drive's "Send your proposal to marketing@linzzyproducts.com." added.

Service promises reworded to what actually happens (brief rule 6):
- Consumer form, "Report a problem" hint: "You will get a case number." to "Your report goes to our consumer care team."
- Complaint confirmation: "our consumer care team will contact you" to "Your report goes to the Linzzy consumer care team."
- Message confirmation: "Our team will review it and reply by email or phone." to "Your message goes to the Linzzy team."
- Trade confirmation: "Our sales team will be in touch." to "Your enquiry goes to the Linzzy team."; server message
  "reached the Linzzy trade team" to "reached the Linzzy team".
- Where to Buy: "Shops are listed by Lexta's sales team." removed; "We are adding Linzzy stockists in X" to "No Linzzy
  stockists are listed in X yet."

## Expanded by 1773 (written from source facts)

| Page | Slot | Text | Source facts used |
| --- | --- | --- | --- |
| Tips & Advice | Sign up block body | "Opt in to receive Linzzy educational updates by email." | Lexta master copy, shared forms table: "Newsletter / educational updates: Opt-in only; marketing list, unsubscribe and privacy notice required". Heading "Stay Connected with Linzzy" is Drive (Home) |
| Tips & Advice | Sign up consent, confirmation, form label, error | "Yes, I agree to receive educational updates by email from Linzzy (Lexta Ghana Limited). I can unsubscribe at any time."; "Thank you. You have opted in to Linzzy educational updates."; "Please tick the box to agree to receive our educational updates by email." | Same Lexta row (opt in, unsubscribe required). Replaces "Linzzy news in your inbox", which no Lexta document mentions |
| Tips & Advice, articles | Reading time on the other 10 articles | 1 or 2 min | Word count of each article (title, lede, body, sign off, question) at 200 words a minute, rounded up: Period Hygiene 101 and Period Care in Warm Weather 1 min; the rest 2 min |
| Contact, trade form | "I am a" options | "Distributor or wholesaler", "Modern trade or supermarket", "Other business" | Lexta master copy "Distributor / Wholesaler / Modern Trade"; original linzzyproducts.com form Business Type "Wholesaler, Modern Trade, Supermarket, Other". Replaces "Shop, supermarket or pharmacy" and "School, clinic, hotel or office" (no source) |
| Contact, trade form | Field label | "Years in business (optional)" (was "Years trading") | Neutral question, no claim; field kept so the form structure and database column do not change |

Already 1773-written before this change and kept (faithful to source facts, no new claims): product card one line
summaries (database short_description, from Drive pack facts; staff can edit them in Product Management), the FAQ
questions and page intro (answers are Lexta's sentences; Lexta should approve the page as a whole), UI and form
microcopy, SEO descriptions, the 404 page.

## Not done: needs a design change

1. **Product details panel, Lexta's product page fields.** The approved panel (components/linzzy/views/ProductsView.tsx,
   dialog) has exactly: category label, name, one description paragraph, "In the pack", two buttons. There is no slot
   for: the headline (e.g. "Extra Care for Your Heavier Days"), Key Product Features (list), Recommended Use, How to
   Use, Skin Sensitivity & Allergy Precautions, the "Linzzy Says" line, or related articles. The data is ready
   (database key_features and usage_instructions; content/catalogue.ts headline, recommended, sensitivity, says,
   reads). Needed: below "In the pack", an expandable "Usage, Ingredients & Skin Sensitivity" block (Lexta's own
   recommendation) with four labelled short sections (Recommended use, How to use, Skin sensitivity and allergy
   precautions, Key features list), plus the headline as a line above the description and the "Linzzy Says" line
   before the buttons. **Priority: the precautions are safety copy**, e.g. Cool Mint "Do not use on already irritated
   or broken skin", Panty Liners "Not intended to replace sanitary towels during moderate or heavy menstrual bleeding",
   Diapers "Never leave your baby unattended during a diaper change", Wipes "Never flush wipes down the toilet".
2. **Home, "Caring Beyond Our Products"** (Drive Home: "At Linzzy, care extends beyond the products we provide. Through
   community-focused education, hygiene awareness and social responsibility initiatives ..." [EXPLORE OUR COMMUNITY
   INITIATIVES]). No slot on the home page. Would need a short band linking to the Lexta site's CSR page (not a CSR
   page on the brand site, which CLAUDE.md puts out of scope). Desmond to decide.
3. **Contact, "Your Voice Matters. Let's Keep the Conversation Going."** No slot; would need a line in the hero or
   above Get in Touch.
4. **Contact form fields "Subject" and "Optional Product Photograph or Supporting Document"** (Drive's suggested form
   fields). Not built: a new field, and the upload needs a database change.
5. **Tips & Advice section intro** ("The Linzzy Tips & Advice page will serve as an educational and supportive space
   ...") and Lexta's four baby content categories with descriptions. The intro is kept in content/articles.ts as the
   baby category blurb but the page has no slot for it.
6. **Parent Corner participation** ("Share Your Parenting Story", "What Can You Share?", "How Linzzy Parent Corner
   Works", submission form, expert reviewed Q&A). Needs a scope decision (LEXTA-CONTENT-GAPS D14) and new sections.

## Shared strings for the lead (packages/, not edited here)

- Live chat widget (packages/chat/src/widget/ChatPanel.tsx:310): "A real person from our team will answer." is an unconfirmed service
  promise. Suggested: "Your message goes to the Linzzy care team." (or the shared equivalent for all four sites).
