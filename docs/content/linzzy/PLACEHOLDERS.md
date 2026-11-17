# Linzzy site: placeholders, removals and sources (strict source sweep)

Branch `content/linzzy-strict-sources`, 17 November 2026. Desmond's rule: every piece of visible copy comes from Lexta's
Drive (`docs/content/linzzy/`: website-copy.md, products.md, parent-corner.md, tips-and-advice/*.md, and the Linzzy rows
of `docs/content/lexta/website-copy.md`) or from the current linzzyproducts.com (`docs/content/linzzy/original-site/`).
Nothing from the Claude Design prototype and nothing 1773 wrote itself, even from source facts. Copy that could go
without changing the layout was removed; copy whose slot would look empty was replaced with a Drive quote, or with a
visible `[PLACEHOLDER: ...]`. Pure interface text (nav, buttons, form labels, errors, page and short section names) is
allowed. Layout, styles, images, animations and the chat icon are unchanged.

Check: every page of a production build (21 pages, all 12 articles, a product details panel) was read in a browser and
every visible sentence over six words was matched against the sources (normalised, fuzzy). 701 sentences checked; what
is left over is interface text, source text the extractor joined across elements, and image alt text (list kept in the
session scratchpad, `strict-linzzy/unmatched.txt`).

## Placeholders on the site

No new placeholders were needed: every slot that lost 1773 copy could be filled with Lexta's own words. The ones from
before stay, because no source has the fact.

| Page | Slot | Placeholder | Who at Lexta knows |
| --- | --- | --- | --- |
| Every page (footer) | Social links after WhatsApp, Facebook, Instagram | `[PLACEHOLDER: TikTok and X links from Lexta]` | Marketing / social media team |
| Contact, Get in Touch box; live chat office hours | Consumer care hours | `[PLACEHOLDER: Linzzy consumer care hours]` | Consumer care / customer service lead |
| Contact, trade enquiry form | "Expected monthly volume" option | `[PLACEHOLDER: monthly volume bands, from Lexta's sales team]` | Sales / commercial manager |
| Tips & Advice and article page, "Period Hygiene 101" | Article photo | `[PLACEHOLDER: clean bathroom vanity with Linzzy Heavy Flow (Lexta's thumbnail guide)]` | Marketing (thumbnail guide owner) |
| Tips & Advice and article page, "Keeping Your Baby Comfortable in Ghana's Warm Weather" | Article photo | `[PLACEHOLDER: warm weather baby care scene with Linzzy Baby Diapers]` | Marketing |
| Products (data, not rendered) | Diaper sizes other than M and L | `[PLACEHOLDER: other sizes and pack quantities, confirmed against current packaging]` | Product / brand manager |
| Products, Linzzy Baby Wipes details panel, "Usage, Ingredients & Skin Sensitivity" row (shown since Z1) | Wipes ingredients | `[PLACEHOLDER: complete ingredient list for each wipes variant, from Lexta]` | Product / quality assurance |

## Removed (no source; the layout works without it)

| Page | What was removed | Note |
| --- | --- | --- |
| Tips & Advice cards, Home tips cards, article pages, "Keep Reading" cards | Reading times on 10 articles ("1 min read", "2 min read") | 1773's word count estimates. The two articles where the Drive gives a time keep "3 min read" |
| Tips & Advice, Stay Connected | "Opt in to receive Linzzy educational updates by email." | Heading (Drive) and the sign up form stay; the heading sits alone, which reads fine |
| Tips & Advice, Parent Corner question card | "... through the Contact page" | Now Drive's two lines word for word, followed by the link label "Contact Linzzy →" |
| Every article, Community corner box | "Share your answer with us through the Contact page." | Replaced by the link label "Contact Linzzy →" (Drive CTA) |
| Contact, Where to Buy | "Choose your region, search by town or shop, then tap a shop to see it on the map." | Form intro |
| Contact, Where to Buy | "Your shop stocks Linzzy and is not listed? Tell us." | |
| Contact, Send Us a Message | "An email address or a phone number, so we can reply." | Form hint (the validation message still says so if both are empty) |
| Contact, Send Us a Message | "Please do not share sensitive health details in this form. We use your details only to answer you." | Form hint. Lead: Lexta may want a privacy line here; it needs Lexta's words |
| Contact, both forms | Textarea placeholders "Tell us what you need, or what happened." and "Storage capacity, delivery needs, products and quantities." | |
| Contact, topic hints | "Tell us the shop's name and town." (My shop does not stock Linzzy) and "Any other question for the Linzzy team." (Something else) | No hint shows for those two topics |
| FAQs | "Where can I buy Linzzy products?" and "Can I buy Linzzy on this website?" with their answers | 1773 questions and answers; the "Where to Buy" FAQ group went with them and its one remaining question moved to About Linzzy |
| FAQs | "Is a longer towel more absorbent?" | Its answer is now part of "How to make the right choice" (same Drive paragraph) |
| FAQs | "Linzzy Medium (M) is for 6 to 9 kg and Large (L) for 9 to 13 kg." | 1773 sentence; the answer is now baby-03's paragraph word for word |

## Replaced with Lexta's own words

| Page | Before (1773 or prototype) | Now (source) |
| --- | --- | --- |
| Home featured cards, Products cards (DB short_description and content/catalogue.ts) | Six 1773 summaries, e.g. "Higher-absorbency towels for heavier days: 12 towels of 290 mm, plus 2 complimentary panty liners." | The sentence of each Drive description that names the product, e.g. "Linzzy Heavy Flow Sanitary Towels are designed for women who prefer higher absorbency during heavier menstrual flow." (products.md). Migration 0023 (written, not applied) puts the same words in the database |
| Meta descriptions (site default, Home, About, Products, Tips, FAQs, Contact) | 1773 summaries | Drive sentences from the same page (website-copy.md, products.md) |
| FAQs, all questions | 1773 questions ("Which Linzzy sanitary towel should I choose?" ...) | Lexta's own headings: article subheadings ("When might a panty liner be useful?", "How Should Baby Wipes Be Stored?" ...), article habit lines ("Change your sanitary towel regularly"), product page labels ("Linzzy Cool Mint: Skin Sensitivity & Allergy Precautions") and Contact page lines ("Interested in distributing or stocking Linzzy products?", "Consumer Feedback and Complaints") |
| FAQs, answers | Several 1773 composites (diaper bag list, size signs, sensitive skin, product concern) | The Drive text under each heading, word for word (lists joined as sentences) |
| FAQs, hero intro | "Answers on our sanitary towels, panty liners, baby diapers and baby wipes, and where to buy Linzzy." | "Have questions about our sanitary towels, panty liners, baby diapers or baby wipes?" (Contact) |
| FAQs, side box heading | "Still have a question?" | "How Can We Help You?" (Contact) |
| About, commitment eyebrows | "For women", "For babies and families" | "Feminine Care", "Baby Care" (brand positioning) |
| Contact, Where to Buy heading | "Find Linzzy Near You" (prototype) | "Find a Stockist" (interface name of the section, as on the hero button) |
| Contact, complaint checklist heading | "Reporting a concern?" | "Consumer Feedback and Complaints" (Contact) |
| Contact, trade section | Eyebrow "Distributors and business enquiries", heading "Stock Linzzy in Your Shop or Region" | Eyebrow "Trade enquiries" (section name), heading "Distributors and Business Enquiries" (Contact) |
| Contact, closing band | "Before You Write" / "Many questions about our products, periods, baby care and where to buy Linzzy are answered in our FAQs." | "Your Voice Matters." / "Let's Keep the Conversation Going." (Contact; this Drive line had no slot before) |
| Contact, topic hints | Product information, Report a problem, Partnership hints written by 1773 | Contact page lines: "Have questions about our sanitary towels ...?", "If you have a concern about a Linzzy product, please contact our customer support team directly.", "For brand partnerships, media enquiries, educational campaigns and promotional collaborations, please contact our team." |

## Kept, with source

| Page | Copy | Source |
| --- | --- | --- |
| Home | Hero, Welcome, Care That Grows, Feminine and Baby chapters, Why Families Choose Linzzy (4 cards), Tips & Advice, Parent Corner, Stay Connected, Connect With Our Community, marquee lines | website-copy.md (Home, Contact); products.md sign offs ("Everyday care, made simple."); quick tips campaign line; "Absorb, Lock, Breathe" (Drive and linzzyproducts.com) |
| About | Every block (hero, story, vision, mission, six values, commitments, Lexta family, promise) | website-copy.md (About) |
| Products | Hero, band intros, product names, pack contents, details panel description | products.md |
| Tips & Advice | Hero, section titles and taglines, 12 article cards (title, topic, lede), notices, Six Quick Tips, Parent Corner text, featured question, expert topics | tips-and-advice/*.md, quick-tips-and-thumbnail-guide.md, parent-corner.md |
| Articles | All 12 bodies, headings, lists, tip boxes, "Linzzy Says", Community Corner questions; reading time on 2 | tips-and-advice/*.md (matched sentence by sentence) |
| FAQs | Hero heading "Got a question? Let's explore it together.", side box line, all answers | parent-corner.md, website-copy.md, tips-and-advice/*.md, products.md |
| Contact | Hero, How Can We Help (5 cards), Send Us a Message intro, checklist, Get in Touch block, trade intro | website-copy.md (Contact) |
| Footer | Sign off, brand line, positioning, @Linzzyproducts, contact lines, Facebook and Instagram links | website-copy.md; original-site/contacts.md |

Not counted as copy and unchanged: image alt text (describes each photo), the newsletter consent checkbox label (a form
label; it states the opt in and unsubscribe Lexta's master copy requires), form confirmations and errors, the 404 page.

## Built 17 November 2026 (Desmond approved the Drive requests; branch `feature/linzzy-drive-requests`)

No new placeholders. Every new sentence is Lexta's Drive text; new labels are interface text.

| Item | What | Source |
| --- | --- | --- |
| Z1 | Product details panel: headline above the name, "Key product features" tick list, one expandable "Usage, Ingredients & Skin Sensitivity" row (Recommended Use, How to Use, Skin Sensitivity & Allergy Precautions, Ingredients where given), "Linzzy says" line above the buttons | products.md (each product; the expandable section at :302) |
| Z2 | Panel "Read more" with up to two related articles (catalogue `reads`); article pages link to their product (`/products?p=<slug>`) when exactly one product lists the article | products.md:20; website-copy.md:23; parent-corner.md:191 |
| Z3 | Home band "Caring Beyond Our Products" (heading, two lines, Explore our community initiatives) between Parent Corner and Connect; About "Learn about the Safe Bottoms Initiative" link in the Lexta Family block; both to the Lexta CSR page | website-copy.md:150-156, :302 |
| Z4 | Contact form "Subject (optional)" field, server checked (150 characters), sent as "Subject: ..." at the top of the lead or complaint text | website-copy.md:464-480 |
| Z5 | Tips baby section: intro text (lightly adapted from "The Linzzy Tips & Advice page will serve as ..."), filter chips for the four baby content categories with their descriptions. The intro line "Little Moments, Loving Care, Bright Beginnings." and the feminine theme "Your Comfort. Your Confidence. Your Everyday Care." were already the two sections' taglines | tips-and-advice/00-section-intro-and-structure.md |
| Z7 | Menu: Feminine Care and Baby Care in place of Products (`/products#fem`, `/products#baby`) | website-copy.md:19 |

## Not done: needs a decision

1. **Contact form "Optional Product Photograph or Supporting Document"**: uploads need a database change.
2. **Parent Corner participation** (Share Your Parenting Story, How it Works, submission form, expert reviewed Q&A):
   needs a scope decision (LEXTA-CONTENT-GAPS D14).

Filled in this change: Contact's "Your Voice Matters. Let's Keep the Conversation Going." now has a slot (the closing
band).

## Not rendered, left as is

`lib/ranges.ts` still holds copy for the old range pages, which now only redirect to /products; only the range names
are used (form labels). The live chat strings are in `packages/chat` (shared, not edited here); "A real person from our
team will answer." remains an unconfirmed service promise for the lead.
