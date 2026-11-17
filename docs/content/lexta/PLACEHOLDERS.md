# Lexta corporate site: placeholders, removals and sources

> Branch `content/lexta-strict-sources` (17 November 2026). Desmond's rule: "don't use anything from the prototype, only
> content from the current website and the drive, strictly; if taking something out will affect the design then leave
> a placeholder". This replaces the 16 November list, including its section of copy "expanded by 1773": every one of
> those slots is now removed, replaced with Lexta's own wording, or a placeholder.
>
> Sources (the only ones used for visible copy):
> - **Drive**: `docs/content/lexta/website-copy.md` (Lexta's master PDF), and for brand facts `docs/content/{yazz,linzzy,hooch}/website-copy.md`, `products.md`, `yazz/csr.md`.
> - **lextagh.com**: `docs/content/lexta/original-site/lextagh-com.md` (new: full text of every lextagh.com page and post, read from its public WordPress API on 17 November 2026) and `ORIGINAL-SITE.md`. `yazz/ORIGINAL-SITE.md` for Yazz facts only.
>
> Allowed without a source: navigation, button and form labels, validation, consent and privacy notes, empty states,
> image alt text that only describes a photo, page names and section names. Paths are under `apps/lexta/`.
> Placeholder format: `[PLACEHOLDER: what Lexta should put here]`, visible on the page.

## 1. Placeholders on the site

| Page | Slot | Placeholder | Who at Lexta likely knows |
| --- | --- | --- | --- |
| Home | Proof bar, 3rd figure | number of distribution partners | Sales |
| Home | Impact in Numbers, Employees | number of employees | HR |
| Home | Impact in Numbers, Lives Impacted | lives impacted figure | Marketing |
| Home | Lexta Videos | Lexta brand video file | Marketing |
| About Us | CSR band, 3 figures | lives touched figure; number of schools reached; number of free screening clinics held with MWAG (the old "Free" figure had no source) | Marketing / CSR |
| About Us | Journey, Liberia milestone | year the Monrovia subsidiary opened | Management |
| Our Brands | "At Lexta, we ask" band photo (code) | real factory floor or production line photo | Marketing |
| People & Culture | Areas of work, 5 cards (Production, Sales, Logistics, Marketing, Administration) | short description of each area's roles | HR |
| People & Culture | Growth, 3 cards (Continuous training, Mentorship, Clear career pathways) | training offered; how mentorship works; how career progression works | HR |
| People & Culture | How we hire, step 2 "Next steps" | Lexta's hiring steps after an application, and typical timing | HR |
| People & Culture | Area photos (code) | one photo per area of work | Marketing / HR |
| CSR | Approach figures 3 and 4 | Empowered Periods reach figure; number of partner organisations | Marketing (Yazz) |
| CSR | Cervical cancer band, 3rd card "Screening stories" (cards 1 and 2 are sourced, see section 5) | Lexta's own cervical cancer screening stories (place, date, partners, one line each) | Marketing (Yazz) |
| CSR | Partners grid, 2 slots | oral health partner, to be confirmed; other CSR partners Lexta wants listed, with logos | Marketing / CSR |
| CSR | SDG 4 card | which initiative, if any, Lexta links to SDG 4 | Marketing / CSR |
| CSR | Get involved, "Request an outreach visit" card | how schools and institutions can request an outreach session | Marketing / CSR |
| Careers | Hero figures 3 and 4 | typical time to first reply; number of locations | HR |
| Careers | Benefits, 2nd card | staff benefits (medical cover, pension, reward, staff products, internal moves) | HR |
| Careers | How we hire, step 2 | Lexta's hiring steps after an application, and typical timing | HR |
| Contact Us | Head office note; Visit us "Postal address" | Lexta postal address (P. O. Box) | Admin |
| Contact Us | Call us note | phone line opening hours | Customer care |
| Contact Us | Visit us "Office hours", "Deliveries and collections" | Lexta office hours; trade collection hours and point | Admin / Logistics |
| Contact Us | FAQ "How do I become a Lexta distributor?" | distributor appointment process and terms | Sales |
| Contact Us | Lexta Square photo (code) | photo of Lexta Square | Marketing |
| Partner With Us | Hero figures 1 and 3 | number of regions covered; typical response time | Sales |
| Partner With Us | Routes (data.ts) | distributor terms; wholesale and modern trade terms; what Lexta looks for in each partner type (3) | Sales |
| Partner With Us | "What you get", 2nd card | support Lexta offers trade partners (supply, terms, field support, training, reporting) | Sales |
| Partner With Us | How it works, step 2 and its timing | Lexta's steps from application to first delivery; timing | Sales |
| Partner With Us | "Have these ready", 4th item "Supporting documents" (items 1 to 3 are sourced, see section 5) | which supporting documents Lexta requires from partners | Sales |
| FAQs | "Are your products made in Ghana?" | where each product line is made, and whether any lines are imported | Operations |
| FAQs | "How do I become a distributor?" | documents Lexta requires from distributors | Sales |
| Privacy Policy | Last updated | approval date; Lexta legal to review the lextagh.com text now on the page (section 5) | Lexta legal adviser |
| Terms & Conditions | Last updated | approval date; Lexta legal to review the lextagh.com text now on the page (section 5) | Lexta legal adviser |
| Site wide | Footer social badges | Lexta Facebook, Instagram, LinkedIn, TikTok addresses | Marketing |
| Site wide | Live chat | Lexta chat office hours (`lib/chat/hours.ts`) | Customer care |

## 2. Removed (no Lexta source, and the layout works without it)

- **Home**: hero slides 2, 3, 5, 6 ("Two decades on Ghana's shelves", "Yazz. Hooch. Linzzy.", "Care shouldn't cost the earth", "Built to reach further"); five story cards summarised from held press stories (Tamale, Mamprobi, women doctors, Korle Bu, Kumasi); "For Business" cards "Bulk and institutional buyers" and "Export and regional partners"; partner logos GES, Ghana Health Service, Korle Bu, SOFPOG (only in held press stories; GHS in none); Yazz award line on the Yazz card; intro lines under Impact in Numbers, Lexta Videos and Stay Connected; the stockists claim above the finder; the MWAG/Tamale/GES/Police CSR paragraph.
- **About Us**: "Affordable, accessible, and made with care." line; second leadership paragraph ("trusted Ghanaian consumer-goods company"); Journey intro line; "Request a bulk quote" button (now Partner with Us); all 1773 paraphrases of the board biographies (replaced by lextagh.com text, see section 3).
- **Our Brands**: "Here is what each of them does."; "That is the whole idea. Care, at a standard..." line; "Buying in volume for a school, hospital..." paragraph; "Request a bulk quote" button (now Partner with Us); stockist claim.
- **People & Culture**: Quality assurance card; hiring steps 3 to 5 (Interview, Assessment, Offer); second Growth paragraph; "If that kind of work matters to you..." line; the screening/period poverty/GES/Police paragraph.
- **CSR**: CroxItOut High School Tour section (MX24 TV, held press story); GES Cook Art block; screening carousel (five press summaries; `components/csr/ScreeningCarousel.tsx` kept, not rendered); the MWAG screening paragraph (Tamale, Kumasi, Mamprobi, Korle Bu, SOFPOG, Ablekuma); Teen Care statistics paragraph; approach callout and three philosophy paragraphs; partners GES, Ghana Health Service, Korle Bu, Tamale Teaching Hospital, SOFPOG, MX24 TV; partners intro line; "Read every story" text.
- **News**: hero intro line; subscribe box intro ("Occasional updates..."); in the seven live stories every 1773 sentence and subhead (programme, "Working with the right people", "Status", "Why it matters", "Women in leadership", "Who was there"...), and the Teen Care St. Mary's SHS paragraph (that lextagh.com page is not in the capture). The eight press stories stay held (`content/news/held.ts`).
- **Careers**: benefit cards Health cover, Pension (incl. the SSNIT line), Pay and reward, Staff products, Moving within Lexta (merged into one placeholder card); hiring steps 3 and 4; "Details vary by role..." line; "Takes about two minutes."; "Here is where we are hiring right now."
- **Contact Us**: reasons "Bulk orders" and "Media" (the server keeps both mappings in `lib/forms/core.ts`; the forms test passes); FAQs "Do you supply institutions, hotels and hospitals directly?" and "Can I visit Lexta?"; "Visitors are welcome by appointment" ("Book an appointment" button is now "Email us"); "If you already know who you need..." line; enquiry intro claims.
- **Partner With Us**: benefit cards Supply, Terms, Field, Training, Data (one placeholder card instead); steps 03 and 04 (one placeholder step); "Day 1"; the four "Have these ready" items; "Missing something? Apply anyway..." line.
- **FAQs**: questions on samples, minimum order, credit terms, delivery, own brand manufacturing, application time, interns and national service, recruitment fees; with them the whole "Trade and bulk orders" group.
- **Privacy Policy and Terms**: all section text written by 1773 (10 privacy sections, 10 terms sections). Privacy kept one sourced point. Note for Lexta legal: lextagh.com has its own short template Privacy Policy and Terms of Use (in `original-site/lextagh-com.md`); not used, per the brief. (Superseded by the gap fill, section 5: both are now on the pages.)

## 3. Kept, with source

| Page / slot | Source |
| --- | --- |
| Home hero slide 1; meta description; footer tagline; Brands heading and intro; Our Brands and site meta descriptions | Drive, Homepage hero ("Caring for You Every Day. Quality, affordability...", "Discover the Lexta family of brands...") |
| Home hero slide "What is care without quality?", Quality section heading, intro and 3 cards; About pillars; Our Brands "At Lexta, we ask" band | lextagh.com About Us ("What is Care Without Quality?", Corporate Pillars, "At Lexta, We Ask") |
| Home and About "Our care extends beyond our products" blocks, CSR hero, CSR / Community Impact heading | Drive, CSR / Community Impact |
| Home values strip; About core values | lextagh.com About Us, Our Core Values |
| Home Who We Are paragraph 1; About meta and hero intro; news "About Lexta Ghana" boilerplate | Drive, About Lexta |
| Home Who We Are paragraph 2; About Our History paragraphs; Journey 2002 and Today milestones; proof bar labels | lextagh.com About Us, Our History |
| Home Activities intro; CSR approach paragraph | lextagh.com CSR/News/Blog intro |
| Home brand cards | Drive brand groupings; linzzy/website-copy.md ("Discover Linzzy Cool Mint...") |
| Home News cards; CSR programme cards and pillar cards | yazz/csr.md; Drive CSR cards; lextagh.com posts (15 July 2026) |
| Home and About careers band, People "Ready to make your mark?" and "Explore our flexible career paths" | lextagh.com People / Home (Current Opportunities) |
| Careers text everywhere ("Grow with a company...", "Explore opportunities in production...", "To enquire about careers, use the Careers form.") | Drive, People, careers and contact |
| Distributor / wholesale / modern trade wording on Home, About, Our Brands, Contact, Partner, FAQs | Drive ("For distributors, wholesalers and modern trade, select your partnership type...") |
| CSR proposal wording ("Explore initiatives by brand, submit a partnership proposal...") | Drive, CSR / Community Impact |
| About founder welcome and signature | lextagh.com About Us, Welcome Message from the Founder & Managing Director |
| About board biographies (7) | lextagh.com About Us, word for word (grammar lightly fixed, e.g. "skills have seen"); roles kept as Board Member where lextagh.com wrongly repeats "Board Chairman" |
| About leadership paragraph, "Guided by vision, driven by excellence" | lextagh.com About Us |
| About Reach cards | Drive office address; lextagh.com About (Monrovia); Drive vision |
| Our Brands eyebrows (Champion of the Everyday, Sophisticated protection, Fuelled by integrity); Yazz Core Philosophy / Value Proposition | lextagh.com Brands |
| Our Brands Yazz lead; award line | yazz/website-copy.md (Home); yazz/ORIGINAL-SITE.md (Home Builders Africa Awards 2022 story) |
| Our Brands Linzzy lead and two points; Hooch lead | linzzy/website-copy.md; hooch/website-copy.md |
| Our Brands Hooch points | hooch/products.md (vitamins), hooch/website-copy.md (Convenience) |
| Our Brands product cards | Supabase products (not changed; the fallback copy in `components/brands/data.ts` is the prototype's and shows only when the database is unreachable) |
| People & Culture: hero and meta, "Why our people come first" paragraphs, five pillars, D&I, Growth heading and line | lextagh.com People, word for word |
| CSR Dignity Project, cervical cancer text, Safe Bottoms, Forest, Clean Hands, Bright Smiles | yazz/csr.md and Drive CSR cards |
| CSR Empowered Periods Campaign | lextagh.com post "The Empowered Periods Campaign" |
| CSR Teen Care, Mawuko, Unity blocks; partners MWAG and Domite Foundation | lextagh.com posts (2017, 2019) |
| CSR partner Ghana Police Service | yazz/ORIGINAL-SITE.md (yazzproducts.com "police partnerships" posts) |
| CSR SDG cards | yazz/csr.md table |
| News: the 7 live stories | lextagh.com posts (Teen Care, Mawuko, Unity, word for word with typo fixes) and yazz/csr.md + Drive cards (Bright Smiles, Safe Bottoms, Lexta Forest, Clean Hands; the Forest body uses the lextagh.com post) |
| News "Media enquiries" | Drive email routing ("Lexta Partnerships / Corporate Affairs: marketing@lextagh.com") |
| Contact hero, General enquiry note; FAQs closing | lextagh.com Contact Us ("Contact Lexta Ghana for all inquiries...") |
| Contact reasons and direct lines | Drive email routing and forms table; lextagh.com Contact Us (Complaints & product reviews, Partnerships/sponsorships) |
| Phone numbers, WhatsApp, Consumer Reports, address | Drive contact block; lextagh.com footer and Contact Us |
| Careers form equal opportunities line | lextagh.com People, Diversity & Inclusion |
| Privacy Policy and Terms & Conditions text (since the gap fill, section 5) | lextagh.com Privacy Policy and Terms & Conditions |

## 4. For the lead

- FAQ questions (Contact Us and FAQs) are 1773 wording: neither source has a Lexta FAQ. They are kept only where the answer is sourced, as labels; Desmond may prefer Lexta to supply its own questions.
- `components/brands/data.ts` fallback product copy (prototype text) only shows when Supabase is unreachable; the live cards come from the database.
- `packages/chat` widget text is interface text only; its default office hours (Mon to Fri 8 to 17) are used for availability, not shown.
- The home page partner logo strip has 2 logos (MWAG, Ghana Police Service); since the gap fill each shows its name under it and the two share the box.

## 5. Gap fill: spots that looked empty after the sweep (17 November 2026, branch `content/lexta-fill-gaps`)

Screenshots of every page at 1440 and 390 wide, before and after, were checked for areas that looked empty or broken.
Each spot was filled from the sources above, tightened in layout (no redesign, same colours, fonts and imagery) or left as a placeholder.

| Page / section | Problem | What changed | Source |
| --- | --- | --- | --- |
| Home, Current Opportunities perks | Diversity & Inclusion card had no text (Growth and Team Cohesion had); on phones the 3 cards wrapped 2 + 1 | Line added; cards always 3 across on desktop, stacked on phones | lextagh.com People, Diversity & Inclusion ("We champion equal opportunities for everyone, regardless of gender, background, or physical ability.") |
| Home, Partners box | 2 small logos in a 3-column grid, a third of the box empty | Logos share the box and show their names | Partner names: lextagh.com post (MWAG); yazz/ORIGINAL-SITE.md (Ghana Police Service) |
| About Us, "Work with us" band | Two identical "Contact us" buttons, the second wrapping onto its own line | Duplicate removed | Layout only |
| Our Brands, "At Lexta, we ask" band | Only 2 of Lexta's 3 questions, no answer; band looked cut short | Third question and the pledge added | lextagh.com About Us, "At Lexta, We Ask" and "Our Pledge" |
| People & Culture, Where you could work | 5 area cards wrapped 4 + 1 (Administration alone) | Grid fits all 5 on one row at desktop | Layout only |
| People & Culture, Flexible paths | 5th chip was a placeholder | "Remote" chip | lextagh.com Careers, "Filter by type": Contract, Full-Time, Internship, Part-Time, Remote |
| CSR, Initiatives by brand | 5 cards wrapped 4 + 1 (Clean Hands alone) | 5 across at desktop, as the pillars above | Layout only |
| CSR, Cervical cancer band | Heading, one paragraph and a placeholder line in a large dark band | Three cards: Mawuko Girls SHS (February 2019), Lexta Teen Care Campaign (since February 2017), and a placeholder card for screening stories | lextagh.com posts "Lexta Ghana Limited Visits Mawuko girls SHS, Ho" and "Lexta Teen Care Campaign" (cervical cancer paragraph, lightly adapted) |
| News, All stories | 6 cards wrapped 4 + 2 | 3 per row (two full rows) | Layout only |
| Contact Us, Email us card | Only 2 addresses beside 3 phone lines | support@lextagh.com added | lextagh.com Contact Us ("Complaints & product reviews: Support@lextagh.com") |
| Partner With Us, partnership type cards and What you get | Cards stopped short of the panel below (narrower 1100px row) | Rows span the full content width | Layout only |
| Partner With Us, Have these ready | One placeholder line | Company details (company name, business type, business address); Registration (Trade License / Registration No.); Tax (Tax ID (TIN/VAT)); Supporting documents stays a placeholder | lextagh.com Contact Us, "Wholesaler / Modern Trade Onboarding" form fields |
| Privacy Policy | Placeholder intro and one developer rule ("Minimise personal information...") | lextagh.com Privacy Policy, word for word (list run into its sentence; "accessible at https://www.lextagh.com" reads "accessible on this website"); the Drive developer rule is no longer shown | lextagh.com Privacy Policy (`original-site/lextagh-com.md`) |
| Terms & Conditions | Placeholder intro and no sections | lextagh.com Terms of Use, word for word ("the https://www.lextagh.com website" reads "the Lexta Ghana Ltd. website"; doubled and stray full stops fixed) | lextagh.com Terms & Conditions (`original-site/lextagh-com.md`) |

Note for the lead: section 2 recorded that lextagh.com's own Privacy Policy and Terms of Use were "not used, per the brief".
They are now on the pages because the two pages were otherwise empty and this is the text Lexta publishes today; the
"Last updated" placeholder asks Lexta legal to review and date it. The change is in its own commit, so it can be dropped.

Looked at and left as they are: Home "Lexta Videos" (lextagh.com has only the heading and "More Videos"); short news
article bodies (Bright Smiles, Safe Bottoms, Forest, Clean Hands: their sourced text is one or two sentences); About
"Our History" timeline (milestones appear as the visitor scrolls, so full-page captures show a gap); Careers hero "0
roles open" figures (live from the database); Our Brands Yazz range wrapping 3 + 3 + 1 (product data from Supabase);
Contact Us Lexta Square photo slot (no photo of the building exists in either source).
