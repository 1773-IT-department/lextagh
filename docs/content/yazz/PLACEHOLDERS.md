# Yazz site: placeholders and 1773-written copy

Content rewrite of 16 November 2026 (branch `content/yazz-source-rewrite`), approved by Desmond. Source order: Lexta's
Drive content (`docs/content/yazz/`), then Yazz's original website (`ORIGINAL-SITE.md`), then copy written by 1773 from
facts in those two sources. A slot that needs a fact neither source gives shows `[PLACEHOLDER: ...]`.
Paths are relative to `apps/yazz/` unless they start with `docs/` or `supabase/`.

## 1. Placeholders left on the site

| Page | Slot | Exact placeholder | Why it is not filled | Who at Lexta likely knows |
| --- | --- | --- | --- | --- |
| Products, range pages, product windows (pads and liners) | Quality line in the features | `[PLACEHOLDER: confirm current ISO certification and year]` | Drive writes "Certified ISO09001:2000" and flags it to check; the 2000 edition of ISO 9001 is withdrawn, so it cannot be shown as a current certification | Quality / QA manager |
| Baby Care, product window (Yazz baby wipes) | Lavender description | `[PLACEHOLDER: Lavender wipes description; Lexta's text repeats the Aloe Vera copy]` | Drive's Lavender text is a copy of the Aloe Vera text ("Aloe Vera-enriched") | Marketing (Yazz brand manager) |
| Baby Care, product window (Yazz baby diapers) | Large size weight | `[PLACEHOLDER: weight range]` (variant "Large, [PLACEHOLDER: weight range]") | Drive gives 11 pieces but no weight for Large | QA / product team |
| Feminine Care, product window (panty liners) | Regular (yellow pack) pack size | `[PLACEHOLDER: pack size from Lexta]` | Drive gives no details for the regular liner | Product / sales team |
| Oral Care, product window | Total Care toothpaste pack size | `[PLACEHOLDER: pack size from Lexta]` | Not in Drive; the original site shows no size | Product / sales team |
| Oral Care, product window | Pack size of each toothbrush (Princess, Monarch, Duchess, Duke, Kids, Double, Hanger): 7 SKUs | `[PLACEHOLDER: pack size from Lexta]` | Not in Drive or on the original site | Product / sales team |
| Home & Tissue, product windows | Mama Yazz jumbo tissue, individual wrap luxury toilet tissue, individual tissue pack sizes | `[PLACEHOLDER: pack size from Lexta]` | Not in Drive | Product / sales team |
| All product windows | SKU codes `TBC-YAZZ-101` to `143` | (codes marked TBC, internal) | Lexta has not sent real codes | Sales / ERP team |
| Contact, footer | YouTube link | `[PLACEHOLDER: link from Lexta]`, `[PLACEHOLDER: YouTube link from Lexta]` | Not in Drive; the original site links no YouTube | Marketing / social media |
| Contact, live chat | Consumer care hours | `[PLACEHOLDER: Yazz consumer care hours]` | Not in Drive or on the original site | Consumer care team |
| FAQs, Where to Buy | Minimum bulk order | `[PLACEHOLDER: minimum order quantities for retailers, wholesalers and distributors, from Lexta]` | Trade terms are not in either source | Sales manager |
| Tips & Advice, News (empty state, not shown while the 2022 story exists) | More news | `[PLACEHOLDER: Yazz news stories and press releases from Lexta]` | Lexta sent no news | Marketing |
| About, articles | Photo blocks (factory personnel in Yazz outfits, production line or quality team, family with Yazz products, one thumbnail per article) | `[PLACEHOLDER: <photo needed>]` | No photos supplied (unchanged in this rewrite) | Marketing |
| Product Management only (unpublished archive row, not on any site) | Kitchen towel | `[PLACEHOLDER: Yazz kitchen towel description, from Lexta]` | Drive's menu lists "Kitchen Towel" with no description; the original site sells Mama Yazz as a kitchen towel | Marketing |

The same product placeholders are written into Product Management by `supabase/migrations/0021_yazz_products_from_drive.sql`
(written, not applied).

## 2. Changed to match the sources

| Page | Before | After | Source |
| --- | --- | --- | --- |
| Products, Home, range pages (live data) | 7 prototype rows with invented claims (clinically tested washing powder, three toothpastes with "bleeding gums", "high absorbency ... full day" pads, "long nights" diapers, "last longer than the month" toothbrushes, Mama Yazz "two ply kitchen towel", pocket tissues on sale, wipes variant placeholders) | Migration 0021 writes Lexta's 16 products, their variants and pack sizes, and archives the prototype rows | Drive `products.md`, `content/catalogue.ts` |
| Fallback catalogue | Pink liner pack placeholder; Large diaper with no weight marker; XXL pull ups "15kg and over"; XL "over 13kg"; Lavender description written by 1773; "methyichloroisthiazolinone" | "24 minty liners"; weight placeholder; "15kg"; "13kg and above"; placeholder; spelling corrected as in `products.md` | Drive `products.md` |
| About, Home (promise cards) | Accessibility: "Making Yazz® products available"; Innovation: "changing needs" | "Working to make Yazz® products available"; "changing consumer needs" | Drive website-copy, The Yazz® Promise |
| About, community impact | "programmes ... are run by Lexta Ghana Limited" | Programmes "set out" by Lexta, "several of them are still proposed" | Drive `csr.md` (Forest Project, Clean Hands Green Land, Bright Smiles are proposed) |
| Products overview | Badge "Available Across Ghana" | "Find Yazz Near You" | Drive: "working to make ... available" |
| Home & Tissue (Home band, range hero) | "Mama Yazz, tissue napkins and toilet rolls" | "Mama Yazz, kitchen towels and toilet rolls" | Drive Home & Tissue landing copy |
| Home & Tissue range body | Second tissue paragraph only | Adds Drive's tissue intro sentence | Drive `products.md` Tissue intro |
| Tips Just 4 You, Just 4 Parents | One merged health note on every article | Just 4 You: "A Note From Yazz®" word for word; Just 4 Parents: "Important Health Information" word for word | Drive tips 06b and 07b |
| Tips Just 4 You hub | Blurb without the sign off | Adds "Know Your Body. Know Your Flow. Own Your Day." | Drive tips 00-intro |
| Articles | Dropped sentences | Restored in the ledes: "Imagine seeing unexpected blood...", "Bodies develop. Skin changes...", "Good hygiene isn't about trying to look perfect.", "Let's replace myths with reliable information." | Drive articles parents-02, parents-08, puberty-06, parents-09 |
| Articles | Byline "Yazz Care Team" | "Yazz®" (with the month where Lexta dated the article) | No author or reviewer named in any source |
| News, 2022 award | Story reworded by 1773, with 1773 headings and tip box | Word for word as published on the original site on 2 December 2022 (title, every paragraph, citation; the original's own wording and spelling kept, including "A citation to celebrate the achievements of read as follows:") | Original site post (secondary source, allowed) |
| FAQs, Ask Yazz® | 9 of Lexta's 13 questions | All 13, in Lexta's order; the 4 new answers quote Lexta's articles and tips | Drive tips 11 (questions); answers from tips 01, 02, 03, 04, puberty-02, puberty-10, parents-09 |
| Contact | Hero dropped Drive's photographs line | "To send photographs where appropriate, email support@yazzproducts.com." (the form has no upload field) | Drive Contact, consumer support |
| Contact, Consumer Care card | "a pack that did not meet our standard" | "Product questions, complaints, feedback and product reviews." | Drive Contact block |

## 3. Service promises reworded (brief rule 6)

| Where | Before | After |
| --- | --- | --- |
| Products, Contact (partner card, trade section), FAQs (stockist answer, bulk box) | "our trade team will come back to you (with terms)" | "Your enquiry goes to Lexta Ghana Limited." |
| FAQs, report a problem | "our consumer care team handles every report and gives you a case number" | "Your report goes to our consumer care team, and the form shows you a case number for it." |
| Contact form hint (report a problem) | "A pack that did not meet our standard. You will get a case number." | "A problem with a Yazz pack. Your report goes to our consumer care team." |
| Complaint thank-you message | "our consumer care team will contact you" | "Your report has gone to our consumer care team." |
| Article sidebar | "happy to help, privately and without judgement" | "Send us your question. It goes to our consumer care team." |
| Range trade cards | "Order Yazz ... in bulk" | "Send a trade enquiry for Yazz ..." |
| Where to Buy note | "Shops are listed by Lexta's sales team." | "Shops are listed by Lexta Ghana Limited." |
| Newsletter band | "straight to your inbox" | "Leave your email address to hear about new Yazz® tips, products and announcements." |

## 4. Expanded by 1773 (written by us from source facts)

| Page | Slot | Text | Source facts used |
| --- | --- | --- | --- |
| Home hero slide 1 | Third button | "Where to Buy" | Drive asks for [Explore Products] [Tips Just 4 You] [Where to Buy] |
| Home hero slide 1 | Script note | "Comfort. Confidence. Protection." | Drive "Yazz®, Comfort. Confidence. Protection. Period." |
| Home hero slide 2 | Headline | "Know Your Flow. Own Your Day." | Drive tips 00-intro |
| Home hero slide 3 | Headline | "Your Best Smiles, Every Day." | Drive toothbrushes "Your best smiles"; oral landing "part of every day" |
| Home | Trust strip | "Quality Products You Can Trust" and three more | Drive: "solutions consumers can trust", "Caring brand for caring families", Proudly Ghanaian |
| Home, About | Promise heading | "Quality You Can Count On" | Drive Quality: "standards that consumers can depend on" |
| Home | Featured line | "Practical care for everyday living, from every Yazz range." | Drive Home intro |
| Products | Hero | "Everyday Essentials for Every Home." | Drive tissue headline "Made for Every Home" |
| Products | Script note | "Caring brand for caring families." | Drive |
| Feminine Care | Hero, range title | "Comfort. Confidence. Protection. Period." / "Every Flow Is Different" | Drive |
| Oral Care | Hero, range title, trade script | "Simple Habits. For the whole family." / "For the Whole Family" / "Your Best Smiles." | Drive oral landing copy, toothbrush headline |
| Home & Tissue | Trade card title | "Stocking for a shop, office or hotel?" | Same pattern as the other ranges (replaces "Complete Home Care. All in One Brand.") |
| Baby Care | Range body, feature | "Taped diapers in four sizes, pull up pants in five sizes ..." / "Cottony soft, super absorbent diapers with an elastic waist." | Drive size tables and features |
| About | Headings | "A Ghanaian Brand With a Big Purpose", "Everyday Quality. Made for You.", eyebrows | Drive About copy (kept, no fact claimed) |
| Footer | Values line | "Quality \| Reliability \| Value" (was "Healthier Families", a soft health claim) | Drive promise |
| Footer, Contact | Scripts | "More Products. More Smiles." (kept) | Prototype slogan, no fact claimed |
| Range pages | Guide and trade scripts, feature titles | e.g. "Simple protection. Everyday confidence.", "Happy Babies. More Smiles." (kept) | Prototype slogans, no fact claimed |
| Care Tips articles | Titles, kickers, headings | "Tips for a Healthy Smile", "Laundry Care with Yazz® Activ" (kicker now Drive's "Stay Bright, Fresher and Stain Free"), "Diaper Changing Routines" | Every sentence is from Drive `products.md` |
| All articles | Read times | "N min read" | Estimated from article length (Drive asks for a reading time) |
| Common Puberty Questions | Lede | "You asked. Yazz® answers: thirteen questions about puberty and periods, answered simply." | Drive kicker "You Asked. Yazz® Answers." and the 13 questions |
| Choosing My Yazz® | Last sentence | "You can see the Yazz® pads and panty liners on our Feminine Care page." | Replaces "lists every Yazz® pad", untrue until 0021 is applied |
| FAQs | 4 new answers | see section 2 | Lexta's own sentences, lightly joined |
| Contact | Hero title, channel cards, "Before You Write", trade form volume bands ("Under 10 cartons a month" ...) | Kept as UI copy; bands are answer options, not terms | None needed; bands for Lexta to confirm |
