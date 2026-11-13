# Lexta website: content gaps, design requests not built, and items to confirm

> Desmond's rule for this branch: content only. The layout, sections, components, styles and images stay exactly as they are. Anything in Lexta's documents that needs a new section, a design change, a new page or a new feature is listed here and was **not** built.
> Each item should also be logged on Trello by Desmond or Kofi (this session does not touch Trello).
> Date: 13 November 2026.

## 1. Design requests and new features in Lexta's documents (not built)

| # | Request (Lexta's documents) | Where it would go | Why not built |
| --- | --- | --- | --- |
| D1 | Brand cards link out to yazzproducts.com, linzzyproducts.com, hoochfoods.com (Lexta wireframe) | Home, Our Brands | Real domains may not be used before go-live (CLAUDE.md). The Our Brands page already has "Visit yazzproducts.com" and "Visit linzzyproducts.com" buttons from the prototype; Hooch has none. Desmond to decide at go-live. |
| D2 | CSR grid of six initiative cards, each linking to a programme section and a proposal form | CSR page | The approved CSR page has its own structure (five focus areas, flagship programmes, four programme cards). A sixth card and per-card proposal forms would be a design change. |
| D3 | New CSR initiative "Lexta Legacy Project (Lexta Foundation): supporting deprived communities with education, clean and safe water, one community at a time" | CSR page | No slot for it; adding a card or section changes the layout. Needs a design decision (and fuller copy, partners and photos). |
| D4 | Mission and vision as their own items | About Us | The design has no mission/vision block. Placed in the existing Our Story paragraph instead (see the changes log). If Lexta wants a dedicated block, that is a design change. |
| D5 | Breadcrumb navigation and related-category links on every page | All pages | New navigation component; design change. |
| D6 | Top bar order "Home, About, Brands, People, News, CSR, Careers, Contact" | Header | The approved header order differs slightly (CSR before News; Contact is a button). Reordering is a design change. |
| D7 | Distributor / Wholesaler / Modern Trade "select your partnership type and share your region" form | Partner With Us | The existing Partner With Us form already has routes and region; no change made. Check that "Modern trade" is one of the route options Lexta expects. |
| D8 | Forms "create an acknowledgement… and retain a ticket in the shared thread" | All forms | Behaviour of the form systems (portal/CRM), not website copy. Outside this content task. |
| D9 | Yazz "Choosing My Yazz®" interactive pad selector ("LET'S FIND YOUR YAZZ®") | Yazz site | Out of scope: product finder quizzes (CLAUDE.md). Lexta's own note says "avoid automated product matching until approved". |
| D10 | Yazz "What's Inside My Yazz®?" interactive diagram of pad layers | Yazz site | New interactive feature; also needs verified material data Lexta has not supplied. |
| D11 | Yazz parenting tools: diaper planner, diaper finder, saved reminders, pregnancy calendar | Yazz site | Out of scope: parenting tools (CLAUDE.md); Lexta marks them Phase 2. |
| D12 | Hooch Games & Library, online checkout, merchandise, comics | Hooch site | Out of scope (games/library, shop); Lexta marks them Phase 2. |
| D13 | Hooch "Share Your Hooch® Recipe" with public uploads published after admin approval | Hooch site | New moderated publishing feature; a staff-editable content CMS is out of scope. Needs Desmond's decision. |
| D14 | Linzzy Parent Corner story submission form with photo upload, moderation and monthly spotlight | Linzzy site | New form and moderation workflow; needs Desmond's decision on scope. |
| D15 | Hooch menu item 7 "Meet hochiro, coming soon" | Hooch site | Would exceed six pages per brand site (CLAUDE.md). |
| D16 | Yazz "blog post backend" access for Lexta to add article images | Yazz site | A staff-editable news CMS is out of scope (CLAUDE.md). Images can be supplied to Desmond instead. |
| D17 | "All red texts remain as hyperlinks for read more", many "hyperlinked" and "make clickable" notes in the Yazz articles | Brand sites | To be handled when the brand sites are built (internal links between existing articles are fine). |

## 2. Text trimmed to fit (full version kept here)

| Where | Shown on the site | Full approved text |
| --- | --- | --- |
| Home, hero slide 1 body | Quality, affordability and everyday care, proudly from Ghana. | Quality, affordability and everyday care, proudly from Ghana. Discover the Lexta family of brands serving personal care, feminine care, oral care, home and tissue needs, baby care and food. (With the second button, the full text pushed the buttons onto the slide dots at 390 px.) |
| CSR, hero paragraph | First two sentences of Lexta's CSR paragraph | …more sustainable communities. **Explore initiatives by brand, submit a partnership proposal or request information about a programme.** (The hero already has its own buttons for these actions.) |
| Careers, hero paragraph | Grow with a company… marketing and administration. Here is where we are hiring right now. | Lexta's paragraph continues: "To enquire about careers, use the Careers form. For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details." (The careers form and Partner With Us already say this.) |

## 3. Content to confirm with Lexta

| # | Item | Detail |
| --- | --- | --- |
| C1 | Consumer care email for the Lexta site | Lexta's documents give no Lexta level consumer care address (brand complaints go to support@yazzproducts.com etc.; Linzzy/Hooch inbox "to be confirmed before go-live"). The site keeps support@lextagh.com for Consumer care. Confirm it exists, or name the address. |
| C2 | marketing@lextagh.com is "interim" | Lexta's routing says distributor/wholesale goes to marketing@lextagh.com "pending Sales confirmation". If Sales gives its own address, change SALES_EMAIL in apps/lexta/lib/forms/core.ts and the Contact/Partner pages. |
| C3 | csr@lextagh.com | Listed for "Lexta CSR affairs", but the CSR proposal route says marketing@lextagh.com. The site uses marketing@ (no CSR email slot exists). Confirm which. |
| C4 | Extra phone numbers | Lexta's contact block adds +233 (0) 302 662 970, WhatsApp Customer Care +233 (0) 544 351 010, Consumer Reports +233 (0) 509 967 400 and the WhatsApp channel link. The design has two phone lines; nothing added. "+233 02235296" in the block looks like a typo for +233 (0) 302 235 296. |
| C5 | Hooch pack sizes | Lexta PDF: Cornflakes 500g and 375g; Hooch document: Cornflakes 500g, Frosted Flakes 375g. The Our Brands corn flakes image alt still says 375g. |
| C6 | Hooch Choco Flakes | Shown on Our Brands (and seeded in Product Management) but in no Lexta document. Keep or remove? Removal is done in Product Management, not in code. |
| C7 | Hooch partnership and complaint emails | Lexta PDF says marketing@ / support@linzzyproducts.com; the Hooch document says marketing@ / support@ / info@hoochfoods.com. |
| C8 | Programme status | Lexta's Yazz CSR copy calls the Forest Project, Clean Hands, Green Land and the Bright Smiles tour "proposed"; the CSR page and news stories describe them as running (for example Bright Smiles "with the Ghana Dental Association", the Forest Project "in the Ashanti and Eastern regions"). Confirm which are live. |
| C9 | Clean Hands, Green Land news article body | Excerpt and standfirst now follow Lexta's new description, but the article body (from Lexta's earlier lextagh.com post) still describes a plastic buy back with Eco Points. Lexta to send the official story. |
| C10 | Figures with no Lexta source | Founded 2002; "24 years" (proof bar) and "25+ Years of Excellence" (impact) disagree with each other; 500+ employees; 10M+ lives impacted; 200+ distribution partners; Liberia subsidiary since 2010; factories in Accra and Tema; "all 16 regions". None appear in Lexta's documents. |
| C11 | Yazz award line | "Ghana's most preferred sanitary and hygiene brand at the 2022 Home Builders Awards" is not in Lexta's documents; confirm. |
| C12 | Product Management records | The live Our Brands page reads products from the database. The new descriptions are in the code fallback only; staff must paste them into Product Management (see LEXTA-CONTENT-CHANGES.md, product cards). Supabase was not touched on this branch. |
| C13 | Mama Yazz | Lexta: "Mama Yazz, jumbo size tissue". The prototype image file and alt call it "Mama Yazz kitchen towel". Confirm the right name for the photo. |
| C14 | Product claims awaiting QA | Lexta's PDF: sanitary pad specs, diaper weight ranges, wipes ingredients, toothpaste claims, Hooch nutrition and allergens "will be worked on and shared separately". Also: Yazz Lavender wipes copy repeats the Aloe Vera text; Aloe Vera ingredients list castor oil; Total Care lists Triclosan; "ISO09001:2000". |

## 4. Placeholders and prototype copy still on the site

| Where | Placeholder | Needed from Lexta |
| --- | --- | --- |
| Home, Careers band | `[PLACEHOLDER: team celebration photo from Lexta]` (empty image slot) | Team photo |
| Home, Lexta Videos | `[PLACEHOLDER: Lexta brand video file]` | Video files or YouTube links and cover images |
| Our Brands, "What holds them together" | `[PLACEHOLDER: real factory floor or production line photo from Lexta]` (empty image slot) | Factory photo |
| Careers, general application | Empty image slot "Recruitment team photo" | HR team photo |
| Contact Us, visit us | `[PLACEHOLDER: photo of Lexta Square from Lexta]` | Photo of Lexta Square |
| People & Culture | `[PLACEHOLDER: one photo per area of work from Lexta]` | One photo per area of work |
| Live chat | `[PLACEHOLDER: Lexta chat office hours]` | Chat office hours |
| News | All 15 stories are `draft: true` summaries of public coverage, with the interim note | Lexta's official text for each story |
| Home, About, People & Culture, CSR, Careers | Prototype copy not covered by Lexta's documents (founder welcome, story, pillars, values, leadership text, benefits, hiring steps, CSR programme detail, FAQs on trade terms, credit, delivery times, contract manufacturing) | Lexta to approve or replace; nothing in their documents contradicts it |
| Brand sites | `[PLACEHOLDER: …]` markers in docs/content/yazz, linzzy and hooch (Yazz parenting guides, regular panty liner details, kitchen towel copy, Linzzy diaper sizes and wipes ingredients, Hooch nutrition panel and full nutrition articles) | See each brand folder |
