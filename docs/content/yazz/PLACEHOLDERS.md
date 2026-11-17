# Yazz site: placeholders, removals and sources

Strict source sweep of 17 November 2026 (branch `content/yazz-strict-sources`). Desmond's rule: nothing from the
prototype; every piece of visible copy comes from Lexta's Drive content (`docs/content/yazz/`, `docs/content/lexta/website-copy.md`)
or from Yazz's current website yazzproducts.com (`ORIGINAL-SITE.md`, `original-site/yazzproducts-com.md`), quoted or very
lightly adapted (casing, grammar, length, list joins). Copy 1773 wrote itself, even from source facts, is gone: removed where
the layout survives without it, replaced by a source line or a visible `[PLACEHOLDER: ...]` where a slot would be empty.
Interface text (navigation, buttons, form labels and options, validation and error messages, page and short section names,
image alt text) needs no source. Paths are relative to `apps/yazz/` unless they start with `docs/` or `supabase/`.

Check used: every visible sentence over 6 words on every built page (product windows and FAQ answers included) is compared
with the sources, case and punctuation insensitive, fuzzy (word trigram coverage 0.75). Result: 5 lines unmatched, all data or
interface (a pack variant label, an ingredient list with "flavour" for "Flavor", a toothbrush variant label, a photo
placeholder label, the phone number list).

## 1. Placeholders on the site

| Page | Slot | Exact placeholder | Who at Lexta likely knows |
| --- | --- | --- | --- |
| Tips & Advice, News category | Intro line under "Yazz® News" (was 1773's "News and announcements from Yazz® and Lexta Ghana Limited.") | `[PLACEHOLDER: one line introducing Yazz news, from Lexta marketing]` | Marketing (Yazz brand manager) |
| FAQs, Where to Buy | Answer under "Distributors, Wholesale and Modern Trade" (replaces 1773's "Can I order online?", "How do I become a stockist?" and the old minimum order question) | `[PLACEHOLDER: how retailers, wholesalers and distributors buy Yazz, with minimum order quantities, from Lexta]` | Sales manager |
| Products, product windows (pads and liners) | Quality line | `[PLACEHOLDER: confirm current ISO certification and year]` | Quality / QA manager |
| Baby Care, Yazz baby wipes window | Lavender description | `[PLACEHOLDER: Lavender wipes description; Lexta's text repeats the Aloe Vera copy]` | Marketing |
| Baby Care, Yazz baby diapers window | Large size weight | `[PLACEHOLDER: weight range]` | QA / product team |
| Feminine Care, panty liners window | Regular (yellow pack) pack size | `[PLACEHOLDER: pack size from Lexta]` | Product / sales team |
| Oral Care, windows | Total Care toothpaste and the 7 toothbrush pack sizes | `[PLACEHOLDER: pack size from Lexta]` | Product / sales team |
| Home & Tissue, windows | Mama Yazz, individual wrap toilet tissue, individual tissue pack sizes | `[PLACEHOLDER: pack size from Lexta]` | Product / sales team |
| Contact, footer | YouTube link | `[PLACEHOLDER: link from Lexta]`, `[PLACEHOLDER: YouTube link from Lexta]` | Marketing / social media |
| Contact, live chat | Consumer care hours | `[PLACEHOLDER: Yazz consumer care hours]` | Consumer care team |
| About, articles, product cards | Photos (factory personnel in Yazz outfits, production line, family with Yazz products, article thumbnails, missing pack shots) | `[PLACEHOLDER: <photo needed>]` | Marketing |
| Tips & Advice, News (empty state, hidden while the 2022 story exists) | More news | `[PLACEHOLDER: Yazz news stories and press releases from Lexta]` | Marketing |
| Tips & Advice, Just 4 You, "What's Inside My Yazz®?" (Y8) | "What is a Yazz® sanitary pad made from?" | `[PLACEHOLDER: a clear breakdown of the materials used in each Yazz® pad, verified by Lexta]` | Quality / QA manager, product team |
| Same, "What does each layer do?" (Y9, opens on tap) | Layer names and what each does, four rows | `[PLACEHOLDER: layer 1 name]` to `[PLACEHOLDER: layer 4 name]`; `[PLACEHOLDER: what layer N does, from the actual construction of the Yazz® pad confirmed by Lexta]` (the number of layers is to confirm too) | Quality / QA manager, product team |
| Same, "How is Yazz® quality checked?" | Body | `[PLACEHOLDER: Lexta Ghana Limited's actual quality-control and manufacturing processes]` | Quality / QA manager |
| Same, "Product Safety" | Body | `[PLACEHOLDER: verified information about product testing, applicable standards, manufacturing and consumer safety]` | Quality / QA manager |
| Same, "Packaging Information" | Body | `[PLACEHOLDER: what the product information and directions on Yazz® packaging mean]` | Marketing, product team |
| All product windows | SKU codes `TBC-YAZZ-101` to `143` (internal, not shown as copy) | (marked TBC) | Sales / ERP team |

## 2. Removed (1773 or prototype copy, layout unchanged without it)

| Page | Removed |
| --- | --- |
| Home, Featured Products | "Practical care for everyday living, from every Yazz range." |
| Products, Our Complete Range | "Everything you need, all in one place." (the interface line "Open a product for its pack sizes..." stays) |
| Products, badges | Sub lines "Products", "Everyday use", "Your Family", "Near You" (badges now read Quality, Reliability, Value, Accessibility) |
| Tips & Advice hub | "Browse Tips Just 4 You on periods, puberty and confidence, guides Just 4 Parents & Caregivers, and care tips for the home." |
| Newsletter band | "Leave your email address to hear about new Yazz® tips, products and announcements." |
| Article sidebar | "See the range and find a stockist near you." |
| Choosing My Yazz® article | "Compare the Yazz® options using the details on their approved packaging: pad lengths, pack contents and flow. You can see the Yazz® pads and panty liners on our Feminine Care page." |
| FAQs, Ask Yazz® answers | 1773 additions: "A period kit in your school bag helps.", "Create a small Yazz® Period Kit for your school bag...", "...with a period tracker or calendar" (answers now quote the articles word for word) |
| FAQs | Questions written by 1773: "Who makes Yazz®?", "How do I know a Yazz® product is genuine?", "What should I do if a product irritates my skin?", "How do I report a problem with a product?", "Can I order Yazz® online?", "How do I become a Yazz® stockist or distributor?", "What is the minimum bulk order?" (their sourced answers now sit under Lexta's own headings, section 3) |
| Contact | "Become a Yazz Partner" card text ("Distributor, wholesaler, shop or institution? ..."); "Shops are listed by Lexta Ghana Limited."; "We use your details only to answer you."; form topic hints for question, feedback, stockist and other ("Ask us anything about a Yazz product." and so on); "To send photographs where appropriate, email ..." |
| Care Tips articles | 1773 headings ("Look After Your Toothbrush", "Sort Your Laundry", "Dissolve and Soak", "Use the Right Amount", "Store It Safely", "Before You Change", "After the Change"); "for two minutes, with fluoride toothpaste where age-appropriate"; "and many come with a tongue cleaner" |
| Fallback catalogue (`content/catalogue.ts`) | Every 1773 summary ("Ultra-thin pads with soft flexible wings ... in normal and heavy flow lengths.", "Pull up diapers with ...", "Gentle, alcohol free wipes for delicate skin.", "...is coming soon to the Yazz oral care range.", "a handy companion for school, work and travel" and the rest); 1773 feature lines ("Lengths of 150mm and 180mm", "Flexible rubber handle for an easy grip", "Protects against cavities and plaque", "Refreshes your breath", "Stimulates the gums"); "Brush your teeth twice daily." on toothpastes other than Fluoride |
| Range pages | 1773 guide and habit step bodies (all replaced by Drive sentences); "for every household"; "morning and night" |

## 3. Replaced with a source line (a slot that cannot be empty)

| Page | Slot | Was | Now | Source |
| --- | --- | --- | --- | --- |
| Home hero, slide 3 | Headline | "Your Best Smiles, Every Day." | "Yazz Brushes. Your Best Smiles." | products.md "Yazz brushes: Your best smiles" |
| Home | Trust strip | "Quality Products You Can Trust", "Everyday Care For Every Home", "Proudly Ghanaian From Lexta Ghana Limited" | "Trusted Quality, Made for Everyday Living", "One Brand, Everyday Possibilities", "Proudly From Lexta Ghana Limited" | website-copy.md Home, A Brand for Generations, Proudly From Lexta Ghana Limited |
| Home, About | Promise heading | "Quality You Can Count On" | eyebrow "Our promise", heading "The Yazz® Promise" | website-copy.md |
| Home, footer | Script notes | "Proudly Ghanaian", "More Products. More Smiles." | "100% Ghanaian", "Trusted Quality. Made for Everyday Living." | website-copy.md ("a 100% Ghanaian consumer goods company"; Home) |
| Products | Hero title | "Everyday Essentials for Every Home." | "Trusted Quality. Made for Everyday Living." | website-copy.md Home |
| Products | Stock up band | "Ready to Stock Up?" + 1773 line; script "More Products. More Smiles." | "Stockist Enquiry", "Contact Yazz Products for all inquiries."; "One brand. Everyday possibilities." | website-copy.md wireframe and Contact block; A Brand for Generations |
| Range pages (all five) | Trade band | "Stocking for a shop or school?" and similar, 1773 body, prototype scripts ("More Comfort. More Smiles.", "Happy Babies. More Smiles.", "More Care for Your Home", "Fresher Cleaner Brighter") | "Stockist Enquiry", "Contact Yazz Products for all inquiries."; scripts "Own Your Confidence.", "Your Best Smiles.", "Every Sheet, a Touch of Care.", "Soothe. Hydrate. Protect.", "Brighter and Fresher Clothes." | website-copy.md; tips 00-landing-page; products.md |
| Range pages | Range lead lines | 1773 summaries ("Taped diapers in four sizes...", etc.) | Lexta's product menu lists, e.g. "Diapers (Regular, Pull-Ups); Wipes (Lavender, Castor Oil, Aloe Vera)." | website-copy.md "Our products" |
| Oral Care | Hero, range title, guide | "Simple Habits. For the whole family.", "For the Whole Family", "Two minutes, twice a day", "Fresh start. Every day." | "Make good oral hygiene part of every day.", "Our Oral Care Range", "Tips for a Healthy Smile", "Brush twice a day." | website-copy.md Oral Care landing; products.md |
| Baby Care | Guide, habits, note | "Putting on a Yazz® diaper", "Safe changing habits", "Clean, dry, comfortable." | "How to Use Yazz Baby Diaper", "Caution", "Cottony soft. Super absorbent." | products.md |
| Home Care | Guide title, hero note | "Washing with Yazz® Activ", "Fresher Cleaner Brighter" | "Check Pack for Direction", "Removes stubborn stains." | products.md |
| Range pages | Feature cards and step titles | 1773 bodies and titles ("Three Wipe Variants", "Four Pack Sizes", "Back tapes behind", "Bin it straight away"...) | Drive sentences and fragments ("Specially designed wings ensure protection of your panties.", "500g / 200g / 5kg / 2kg.", "Place baby on diaper", "Plastic bags"...) | products.md, tips 03 and 05 |
| Range pages | Meta descriptions | 1773 summaries | Each range's Drive landing copy | website-copy.md |
| About | Headings | "A Ghanaian Brand With a Big Purpose", "Made for every generation", "Rooted in Our Communities." + 1773 paragraph, "Everyday Quality. Made for You." | "A Growing Ghanaian Brand", "Generations of trust", "Community Impact" + the six initiative names, "Caring Brand for Caring Families." | website-copy.md About; csr.md |
| About | FAQ card line | "Answers on periods and puberty, our products..." | "Frequently asked period and product questions." | tips 00-landing-page (Ask Yazz® card) |
| Tips | Newsletter heading | "Never Miss a Yazz Headline." | "Yazz® Tips & News." | website-copy.md tab name |
| Tips | Care Tips blurb, article sidebar line | 1773 lines | "Helpful ideas for everyday living, created around the real questions families ask.", "We are here to listen, serve and support." | website-copy.md |
| Care Tips articles | Titles, kickers, ledes | "Laundry Care with Yazz® Activ", "Diaper Changing Routines", "Clean, Dry and Comfortable", 1773 ledes | "Home Care Tips", "Baby Care Tips" (Lexta's topic names), "Everyday Care for Growing Families", Drive topic lines as ledes | website-copy.md Tips & Advice topics |
| Common Puberty Questions | Lede | "thirteen questions about puberty and periods, answered simply." | The article's first three questions | articles/puberty-10 |
| FAQs | Products and Where to Buy items | 1773 questions (section 2) | Lexta headings "Proudly From Lexta Ghana Limited", "Look for the Yazz® Mark", "Consumer Reports", "Consumer Support", "Stockist Enquiry" with quoted answers | website-copy.md About and Contact; products.md |
| FAQs | Hero line, help and bulk boxes | 1773 lines | "You Have Questions. We Have Tips Just 4 You.", "We are here to listen, serve and support.", "Contact Yazz Products for all inquiries." | tips 11-ask-yazz; website-copy.md Contact |
| Contact | Hero title, channel cards, trade intro, quick answers | "Talk to Yazz, or Find Us on a Shelf Near You", 1773 card lines, "Stock Yazz in Your Shop or Region" + 1773 line, "Before You Write" + 1773 line | "Contact Yazz Products for All Inquiries"; card lines from Lexta's contact block and the original Contact page ("Wholesaler / Modern Trade Onboarding.", "Distributors, Wholesale and Modern Trade.", "Partnerships / sponsorships, marketing partnerships and CSR proposals."); "Wholesaler / Modern Trade Onboarding"; "Ask Yazz®" + "Frequently asked period and product questions." | website-copy.md; lexta/website-copy.md; original-site/yazzproducts-com.md (Contact, Distributors) |
| Every page | Meta descriptions (layout, Home, About, Products, Tips, FAQs, Contact) | 1773 summaries | Drive sentences | website-copy.md |

## 4. Kept, with source

| Copy | Source |
| --- | --- |
| Brand copy in `content/brand.ts` (intro, about, promise, Proudly From Lexta, A Brand for Generations, vision, mission, mark, trademark notice, consumer support) | website-copy.md Home, About, Contact (consumer support now ends with the support address instead of 1773's photographs line) |
| Home slides 1 and 2, range hero titles and bodies (Feminine "Comfort. Confidence. Protection. Period.", Home & Tissue "Everyday Softness. Thoughtful Care.", Baby "Everyday Care. For growing families.", Home Care "Brighter. Fresher. Stain free.", lightly adapted from "Stay bright, fresher and stain-free") | website-copy.md landing copy; products.md; tips 00 |
| Feminine Care guide "Using your Yazz® pad", note "Simple protection. Everyday confidence.", habits "Feeling fresh every day" | tips 03 and 05 (sentences now word for word) |
| Fallback catalogue product text, features, usage, ingredients | products.md word for word (casing and list joins only); "xanthan gum" as products.md corrects it |
| Tips Just 4 You and Just 4 Parents articles | Drive articles; four list items restored to Lexta's wording (period kit underwear and tracker, leaks at school, heavy bleeding, severe pain) and the body comments list restored as a list |
| Article bylines "Yazz®" (no author), month dates, "N min read" | No author or reviewer in any source; dates as Lexta asked; reading time is computed from length (interface) |
| News: "Yazz is the preferred Sanitary and Hygiene brand in 2022" | yazzproducts.com post of 2 December 2022, now captured word for word in `original-site/yazzproducts-com.md` |
| Topic tiles, health notes, category titles and blurbs (Just 4 You, Just 4 Parents) | tips 00-landing-page, 06b, 07, 07b |
| FAQ Ask Yazz® questions and answers | tips 11 (questions); articles puberty-02, puberty-08, puberty-10, tips 01, 02, 03, 04, parents-09 (answers, word for word) |
| Contact details, socials | website-copy.md Contact block; ORIGINAL-SITE.md (Facebook, Instagram, TikTok) |
| Interface text kept without a source | Nav and footer labels, buttons, "Explore Our Product Categories", "Our Complete Range", "Our ... Range", "The range", "Good to know", "How Can We Help?", "Help centre", "Questions & Answers", "Trade & Stockists", "Find Yazz Near You", map and form instructions, form fields and answer options (trade volume bands still for Lexta to confirm), validation and thank-you messages, empty and error states, image alt text |

## 5. Drive requests built 17 November 2026 (Desmond approved; branch `feature/yazz-drive-requests`)

Every new sentence is Lexta's Drive text, quoted or shortened; new labels are interface text. The only new placeholders
are the What's Inside My Yazz® facts (section 1).

| Item | What | Source |
| --- | --- | --- |
| Y5 | Range pages: third, outlined hero button to the range's tips (`tipsCta` in `lib/ranges.ts`): Tips Just 4 You, Oral Hygiene Tips, Read Home Tips, Parenting Guides (to Baby Care Tips), Home-Care Advice | website-copy.md:57-65 |
| Y6 | Range pages: one line "SDG n: ..., initiative." strip linking out to the Lexta CSR page (`csr` in `lib/ranges.ts`) | products.md:55, 133, 185, 239, 266 |
| Y1 | Tips Just 4 You: Lexta's ten cards (adds My Period & Me, Just 4 Parents, What's Inside My Yazz®?, Ask Yazz®); My Period & Me link list on the Just 4 You view (7 of Lexta's 8 topics; "Common changes you may notice during your cycle" has no fitting article) | tips 00-landing-page, 01-my-period-and-me |
| Y3 | Category view intros and closings: Welcome to Tips Just 4 You, My First Period Checklist, You're Growing. We're Listening. (with Explore more), Start With a Conversation (with the parents topic list), The Conversation Starts at Home | tips 00-intro, 02, 06b, 07, 07b |
| Y2 | Inline links in article text (`[words](/path)`, internal only): parents topics to their articles, pad mentions to the sanitary pads window, brush and dental care mentions to the toothbrushes window or Tips for a Healthy Smile, "menarche" to "When Will My First Period Start?" (Yazz's own article, not Google) | lexta/website-copy.md:33; tips 07:25, 04:28; articles puberty-06:46, puberty-02:30 |
| Y4 | Products menu (desktop dropdown and phone menu): two or three second level links per range (product windows and tips) | website-copy.md:20, :47-53 |
| Y7 | Optional article `reviewer` and `reviewDate`, shown only when set; none set (waits on Lexta) | website-copy.md:134 |
| Y8, Y9 | What's Inside My Yazz®? section on the Just 4 You view, layers as a tap-to-open list | tips 10-whats-inside-my-yazz |
| Y10 | "Parenting & Baby Care" category, hidden until an article has it | website-copy.md:24, :52, :155 |

## 6. For the lead (not changed here)

- **Database copy**: the live product cards come from the Supabase products table (migration 0021), which holds the earlier
  wording of `content/catalogue.ts`. The fallback catalogue now quotes products.md word for word, so the two have drifted;
  to apply the strict rule to the live site, a follow up migration should copy the new `short`, `long`, `features` and
  `usage` text from `content/catalogue.ts` into the Yazz rows (no Supabase change in this pass).
- **Shared chat widget** (`packages/chat`): its interface text is shared with the Lexta site and was not checked here.
- The original site's own Contact page uses @lextagh.com addresses; Drive's @yazzproducts.com addresses stay (Drive wins).
