# Hooch® site: placeholders, removals and sources (strict source sweep)

Branch `content/hooch-strict-sources`, 17 November 2026. Desmond's rule: every piece of visible copy comes from Lexta's
Drive (`docs/content/hooch/`: website-copy.md, products.md, recipes.md, articles/*.md, and the Hooch rows of
`docs/content/lexta/website-copy.md`) or from the current website. hoochfoods.com serves no content
(`original-site/README.md`), and the lextagh.com Hooch lines carry the "low-fat" and "sugar crash" claims removed earlier,
so no current website text is used. Nothing from the Claude Design prototype and nothing 1773 wrote itself, even from
source facts. Copy that could go without changing the layout was removed; copy whose slot would look empty was replaced
with a Drive quote. Pure interface text (nav, buttons, form labels, errors, page and short section names) is allowed.
Layout, styles, images, animations, the 3D boxes and the chat icon are unchanged.

Check: every page of a production build (16 pages: Home, About, Products, both product pages, Recipes and all four
recipes, Nutrition and all four articles, Contact) was read in a browser, text node by text node, and every sentence over
six words was matched against the sources (normalised, fuzzy). 114 distinct sentences checked, 112 matched; the two left
are the Contact page title and the "could not load the stockist list" status message (session scratchpad,
`strict-hooch/unmatched.txt`).

## Placeholders on the site

No new placeholders were needed: every slot that lost 1773 copy could be filled with Lexta's own words. These stay,
because no source has the fact.

| Page | Slot | Placeholder | Who at Lexta knows |
| --- | --- | --- | --- |
| Both product pages, Nutrition "Nutrition & ingredients" panel | Allergen notice | `[PLACEHOLDER: allergen statement from Lexta]` (Lexta's PDF: nutrition and allergen details "will be worked on and shared separately") | Quality assurance / regulatory, product manager |
| Frosted Flakes product page (and DB `ingredients`) | Sugar figure | `[PLACEHOLDER: confirm the sugar figure and unit, given as "23"]` | Quality assurance / product manager |
| Both product pages | Product code table | `TBC-HOOCH-101` / `TBC-HOOCH-102 [PLACEHOLDER: product code from Lexta]` | Sales / supply chain |
| Recipes, Yoghurt Crunch and After-School Crunch (cards and pages) | Recipe photo | `[PLACEHOLDER: photo of Hooch® Yoghurt Crunch from Lexta]`, `[PLACEHOLDER: photo of The Hooch® After-School Crunch from Lexta]` | Marketing |
| All four Nutrition & Family Tips articles | Article body | `[PLACEHOLDER: full article text from Lexta]` (Drive gives summaries only) | Marketing |
| Contact (Contact Details box), live chat out of hours message | Consumer care hours | `[PLACEHOLDER: Hooch consumer care hours]` | Consumer care / customer service lead |
| Contact (Stay Connected), footer | Hooch social links | `[PLACEHOLDER: link from Lexta]` (Facebook, Instagram, TikTok), footer `[PLACEHOLDER: Hooch Facebook, Instagram and TikTok links from Lexta]` | Marketing / social media team |

The product films are still our stand-ins made from Lexta's Hooch artwork (content/videos.ts, CONTENT-NEEDED.md item 5);
they have no visible title or caption, only a screen reader description of what the film shows.

## Removed (no source; the layout works without it)

| Page | What was removed | Note |
| --- | --- | --- |
| Contact, Product Questions card | "Ask about our cereals, packs, ingredients and how to enjoy them." | The card keeps Drive's "Have a question about Hooch® products?" |
| Contact, Where to Buy | "Choose your region, search by town or shop, then tap a shop to see it on the map." | Form intro |
| Contact, Where to Buy (arriving from a product) | "These shops stock Hooch products; call ahead to check the pack you need." | Now just "Looking for Hooch® Cornflakes?" |
| Contact, Where to Buy | "Shops are listed by Lexta Ghana Limited. Your shop stocks Hooch® and is not listed? Tell us." | |
| Contact, beside the form | The "Reporting a concern?" box: "Where you can, include the product name, pack size, batch number, and where and when you bought it. Your report goes to our consumer care team." | The side column keeps Contact Details and Stay Connected. Lead: Lexta may want guidance for complaints here; it needs Lexta's words |
| Contact, Send Us a Message | "An email address or a phone number, so we can reply." | Form hint (the validation message still says so if both are empty) |
| Contact, Send Us a Message | "Please do not share sensitive health details in this form. We use your details only to answer you." | Form hint. To request from Lexta (Desmond, 17 November 2026): complaint guidance and a privacy line in Lexta's words |
| Contact, both forms | Textarea placeholders "Tell us what you need, or what happened." and "Storage capacity, delivery needs, products and quantities." | |
| Contact, topic hints | "A concern about a Hooch® product. Your report goes to our consumer care team." (Report a problem), "Partnerships, sponsorships and community opportunities with Hooch®." (Partnership), "Tell us the shop's name and town." (My shop does not stock Hooch®), "Any other question for the Hooch® team." (Something else) | No hint shows for those four topics |

## Replaced with Lexta's own words

| Page | Before (1773 or prototype) | Now (source) |
| --- | --- | --- |
| Home and Products cards, product page lead and meta description (catalogue `short`, DB `short_description`) | "The golden crunch of Hooch® Cornflakes: 500g, in 10 convenient packs of 50g." / "A sweet frosted finish on a crispy flake: 375g, in 10 convenient packs of 37.5g." | First sentence of each Drive description: "Start your morning with the golden crunch of Hooch® Cornflakes." / "Add a little sweetness to your breakfast routine with Hooch® Frosted Flakes." (products.md). Migration 0024 (written, not applied) puts the same words in the database |
| Site default meta description | "Hooch® Cornflakes and Hooch® Frosted Flakes, breakfast cereals from Lexta Ghana Limited in 10 convenient individual packs. Breakfast ideas, family tips and where to buy." | "With two delicious cereal options and 10 convenient individual packs per product, there's a Hooch® breakfast moment for everyone." (Home) |
| Meta descriptions: Products, Recipes, Nutrition, Contact | 1773 summaries | Drive sentences from the same tab (products.md title plus Home line; recipes.md intro; Nutrition hub lines; Contact Us opening lines) |
| Home hero sticker | "10 packs inside!" | "10 individual packs" (Home product highlights) |
| About, values heading | "What Hooch® Stands For" (eyebrow "Our Values") | Heading "Our Values" (Drive); eyebrow "About Hooch®" (page name) |
| Products, FAQ panel | Heading "Questions About Our Cereals?", three paraphrased questions | Heading "Product FAQs" and the four Drive questions as a list (products.md, Product FAQs). The list also fills the panel, which looked empty |
| Nutrition, FAQ heading | "Your Questions, Answered" | "Product FAQs" (products.md) |
| Nutrition, pack panel | "On the pack": "Both Hooch® cereals are enriched with vitamins. You will find the full ingredient list for each cereal on its product page." | "Nutrition & ingredients": "Enriched with vitamins. Vitamins: Vit E, Thiamine B1, ... Folic Acid." (products.md, both cereals) |
| Nutrition, under the FAQs | "More ideas for the kitchen are on Beyond the Bowl." | Link "Beyond the Bowl: Get Creative with Hooch®!" (products.md heading) |
| Recipe pages, "You need" tick list | Completion message "Ready? Pour, add and enjoy!" | "Make Every Morning a Hooch® Moment!" (recipes.md) |
| Recipe photos and 3D boxes, tap bursts | "Crunch!", "Yum!", "Munch!", "Pop!" | "Crunch!", "Delicious!", "Sweet Crunch!", "Happy Mornings!" (Drive straplines "Simple. Crunchy. Delicious.", "Sweet Crunch. Happy Mornings.") |
| Contact, help cards | Complaints, Distribution and Partnerships bodies written by 1773 | Drive contact lines: "Consumer Reports: +233 50 996 7400", "Enquiries: info@hoochfoods.com", "Partnerships/sponsorships: marketing@hoochfoods.com" |
| Contact, help cards heading | "How Can We Help You?" (Linzzy copy) | "Get in Touch" (Hooch Home section name); the contact box beside the form is now "Contact Details" |
| Contact, Where to Buy heading (and Home button) | "Find Hooch® Near You" (prototype) | "Find a Stockist" (interface name, as on the hero button) |
| Contact, trade section | Eyebrow "Distributors and business enquiries", heading "Stock Hooch® in Your Shop or Region", 1773 paragraph | Eyebrow "Trade enquiries", heading "Distribution Enquiries" (Drive "distribution enquiry"), and "For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details." (Lexta's revised PDF, People, careers and contact) |
| Contact, closing band | "Before You Write" / "Questions about our cereals, recipes and family breakfast tips may already be answered here." | "Quick Links" / "Our Nutrition & Family Tips hub shares practical, easy-to-understand guidance for households." (Nutrition tab) |
| Contact, topic hints | Product question and feedback hints written by 1773 | "Have a question about Hooch® products?" and "Want to share your breakfast experience?" (Contact Us) |
| Products and product pages, section headings | "Hooch® in Action", "See the Crunch" | "Product Videos", "Packs and Product Video" (interface names) |
| Classic Hooch® Bowl, "You need" | "Banana, sliced" | "Sliced banana" (the method's words) |

## Kept, with source

| Page | Copy | Source |
| --- | --- | --- |
| Home | Hero (eyebrow, title, sub, body), marquee lines, section headings, two choices line, packs line, family guide, recipe cards, Frosted spotlight (portions, tagline, description), article cards, Who We Are, Community (three programmes), Get in Touch line | website-copy.md (six tab Home, short draft Who We Are and Community), products.md, recipes.md, articles/ |
| About | Story, Brand Promise, Our Values (four), Proudly a Lexta Ghana Limited Brand, Community, "Partner With Hooch", closing "Two Delicious Choices. One Hooch® Family." with the story's "the classic crunch of Hooch® Cornflakes and the sweet delight of Hooch® Frosted Flakes" | website-copy.md (About, short draft), products.md |
| Products, product pages | Names, taglines, portions, descriptions, Key benefits, How to enjoy, ingredients and vitamins, pack labels, family guide, Drive packaging line | products.md, website-copy.md (Nutrition Promise) |
| Recipes | Intro, four recipes (name, strapline, method, "Preparation: approximately N minutes"), "You need" items (words of each method, no quantities), Beyond the Bowl (8 questions and answers), Have a Hooch® Breakfast Idea? | recipes.md, products.md |
| Nutrition | Hub title and lines, four article titles and summaries, Nutrition Promise, four Product FAQs | website-copy.md (Nutrition & Family Tips), articles/, products.md |
| Contact | Hero lines, five help card titles, Share Your Breakfast Experience body, form intro, Hooch® Foods "a brand of Lexta Ghana Limited", phones, WhatsApp Customer Care, Consumer Reports, three emails, WhatsApp channel line | website-copy.md (Contact Us, footer); office address from the Lexta contact block in lexta/website-copy.md (Linzzy document) |
| Footer | "Good Nutrition, Brighter Tomorrow.", "Bringing delicious breakfast moments to families, one crunchy bowl at a time.", "Hooch® is a brand of Lexta Ghana Limited.", © line | website-copy.md (Footer content) |

Not counted as copy and unchanged: image alt text and the film descriptions for screen readers, form labels and
options (including the neutral trade volume bands Small to Very large and the "I am a" choices), form confirmations and
errors, the Where to Buy empty and error states, the 3D hint "Tap a box to shake out the flakes, or drag to spin it!",
the chat team name "Hooch® customer care team" (from Drive "WhatsApp Customer Care"), the 404 page.

## Facts shown that need Lexta to confirm

| Slot | What is shown | Note |
| --- | --- | --- |
| Emails (Contact, About, footer, forms, chat) | info@, marketing@, support@hoochfoods.com | **Decided by Desmond, 17 November 2026: use the Hooch Drive addresses.** The Hooch Drive document gives these (Contact Us tab, and the short draft "[Partner With Hooch] marketing@hoochfoods.com"). Lexta's revised PDF routes Hooch partnerships to marketing@linzzyproducts.com and complaints to support@linzzyproducts.com, and its wireframe proposes marketing@lextagh.com for proposals. The site keeps the Hooch Drive addresses; hoochfoods.com does not serve a working site, so the mailboxes must be confirmed live |
| First phone | +233 302 235 296 | Drive gives "+233 02235296" (malformed); read as Lexta's +233 (0) 302 235 296 |
| Office address | Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra | From the Linzzy document (Lexta contact block); the Hooch document gives none |

## Not added (listed for Desmond)

- **Desserts recipe group**: none of the four six tab draft recipes is a dessert. The short draft's "Crunchy Dessert
  Topper" and "Celebration Fruit Cups" (no times, no photos) would need Lexta to confirm they still apply.
- "Meet hochiro, coming soon" (seventh menu item; brand sites are capped at six pages).
