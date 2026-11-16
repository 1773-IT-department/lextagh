# Lexta corporate site: placeholders and 1773-written copy

> Branch `content/lexta-source-rewrite` (16 November 2026). Source order per Desmond's brief: Lexta's Drive content
> (`docs/content/lexta/website-copy.md`, `docs/content/yazz/csr.md`, brand documents) first, then lextagh.com
> (`ORIGINAL-SITE.md`) and yazzproducts.com, then copy written by 1773 from those facts only.
> Every slot that needs a fact neither source gives shows a visible `[PLACEHOLDER: ...]`. Paths are under `apps/lexta/`.

## 1. Placeholders left on the site

"Why" codes: **NS** = no source (not in Drive, not on lextagh.com); **C2** = the prototype had a figure or promise written by 1773 that was removed; **LEG** = legal text needing Lexta's legal adviser.

### Home `/`

| Slot | Placeholder | Why | Who at Lexta likely knows |
| --- | --- | --- | --- |
| Proof bar, 3rd figure (`app/(site)/page.tsx`) | `[PLACEHOLDER: number of distribution partners]` | C2 ("200+" removed) | Sales / commercial lead |
| Impact in Numbers, Employees | `[PLACEHOLDER: number of employees]` | C2 ("500+" removed) | HR |
| Impact in Numbers, Lives Impacted | `[PLACEHOLDER: lives impacted figure]` | C2 ("10M+" removed) | Marketing |
| Lexta Videos (existing) | `[PLACEHOLDER: Lexta brand video file]` | NS | Marketing |

### About Us `/about-us`

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| CSR band figure 1 | `[PLACEHOLDER: lives touched figure]` | C2 ("10M+" removed) | Marketing |
| CSR band figure 2 | `[PLACEHOLDER: number of schools reached]` | C2 ("100+" removed) | Marketing / CSR |
| Journey, Liberia milestone (`components/about/Journey.tsx`) | `[PLACEHOLDER: year the Monrovia subsidiary opened]` | C2 ("2010" had no source; lextagh.com gives no year). The year bar now reads "Liberia" | Management / Finance |

### Corporate Social Responsibility `/corporate-social-responsibility`

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Our approach figure 3 | `[PLACEHOLDER: Empowered Periods reach figure]` | C2 ("19 locations, 28 May 2026" came from press) | Marketing (Yazz brand team) |
| Our approach figure 4 | `[PLACEHOLDER: number of partner organisations]` | C2 ("10" counted the grid, including the unconfirmed GDA) | Marketing / CSR |
| Partners grid, former Ghana Dental Association slot | `[PLACEHOLDER: oral health partner, to be confirmed by Lexta]` (name slot reads "TBC") | Drive calls Bright Smiles proposed; GDA partnership not evidenced | Marketing / CSR |

### People & Culture `/people-and-culture`

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Flexible paths, 5th chip | `[PLACEHOLDER: confirm engagement types Lexta offers]` | C2 ("Remote" unverified) | HR |
| Area of work photos (code comment, existing) | `[PLACEHOLDER: one photo per area of work from Lexta]` | NS | Marketing / HR |

### Careers `/careers`

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Hero figure 3 | `[PLACEHOLDER: typical time to first reply]` | C2 ("2 wks") | HR |
| Hero figure 4 | `[PLACEHOLDER: number of locations]` | C2 ("4 locations") | HR / Management |
| Benefits: Health cover | `[PLACEHOLDER: medical cover offered to staff and dependants]` | C2 | HR |
| Benefits: Pension | `[PLACEHOLDER: any pension benefits beyond the statutory scheme]` (statutory SSNIT stays) | C2 | HR |
| Benefits: Training and development | `[PLACEHOLDER: training programmes or budget offered]` | C2 | HR |
| Benefits: Pay and reward | `[PLACEHOLDER: bonus or reward scheme, if any]` | C2 ("performance bonus") | HR |
| Benefits: Staff products | `[PLACEHOLDER: staff product allowance, if any]` | C2 ("monthly allocation") | HR |
| Benefits: Moving within Lexta | `[PLACEHOLDER: internal vacancy and transfer policy]` | C2 ("advertised internally first") | HR |
| How we hire, intro line | `[PLACEHOLDER: typical length of the hiring process]` | C2 ("three to four weeks") | HR |

### Contact Us `/contact-us`

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Head office card note; Visit us "Postal address" | `[PLACEHOLDER: Lexta postal address (P. O. Box)]` | C2 ("P. O. Box AN 19064" not in Drive or lextagh.com) | Admin / Finance |
| Call us card note | `[PLACEHOLDER: phone line opening hours]` | C2 ("Monday to Friday, 8am to 5pm") | Admin / customer care |
| Visit us "Office hours" | `[PLACEHOLDER: Lexta office hours]` | C2 | Admin |
| Visit us "Deliveries and collections" | `[PLACEHOLDER: trade collection hours and point]` | C2 ("8am to 3pm at the goods gate") | Sales / logistics |
| FAQ "How do I become a Lexta distributor?" (`components/contact/data.ts`) | `[PLACEHOLDER: distributor appointment process and terms]` | C2 | Sales |
| FAQ "Do you supply institutions…" | `[PLACEHOLDER: how Lexta handles institutional and hospitality supply]` | C2 ("key accounts team") | Sales |
| FAQ "Can I visit Lexta?" | `[PLACEHOLDER: visitor and site tour policy]` | C2 ("protective equipment… a week ahead") | Admin |
| Lexta Square photo (code comment, existing) | `[PLACEHOLDER: photo of Lexta Square from Lexta]` | NS | Marketing |
| Live chat (existing, `lib/chat/hours.ts`) | `[PLACEHOLDER: Lexta chat office hours]` | NS | Customer care |

### Partner With Us `/partner-with-us` (`components/partner/data.ts`)

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Hero figure 1 | `[PLACEHOLDER: number of regions covered]` | C2 ("16") | Sales |
| Hero figure 3 | `[PLACEHOLDER: typical response time]` | C2 ("48h") | Sales |
| Route: Distributor | `[PLACEHOLDER: distributor trade terms, credit and territory policy]` | C2 | Sales / Finance |
| Route: Wholesale & modern trade | `[PLACEHOLDER: wholesale and modern trade terms and merchandising support]` | C2 | Sales |
| Route: Institutional & bulk | `[PLACEHOLDER: institutional supply terms]` | C2 | Sales |
| Route: Private label & export | `[PLACEHOLDER: whether Lexta offers private label or contract manufacturing, and for which lines]` | C2 | Management / Operations |
| Route: Raw material suppliers | `[PLACEHOLDER: supplier onboarding, audit and payment terms]` | C2 ("Tema and Accra plants") | Procurement |
| Benefit: Supply | `[PLACEHOLDER: supply, warehouse and lead time details]` | C2 ("Tema warehouse") | Logistics |
| Benefit: Terms | `[PLACEHOLDER: pricing, rebates and credit terms]` | C2 | Sales / Finance |
| Benefit: Field | `[PLACEHOLDER: field sales and merchandising support for partners]` | C2 | Sales |
| Benefit: Training | `[PLACEHOLDER: onboarding and training offered to partners]` | C2 | Sales |
| Benefit: Data | `[PLACEHOLDER: performance reviews and reporting for partners]` | C2 | Sales |
| Steps 02, 03, 04 time labels | `[PLACEHOLDER: timing]` | C2 ("Within 48 hours", "1 to 2 weeks", "From week 3") | Sales |

### FAQs `/faqs` (`components/faqs/data.ts`)

| Question | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Are your products made in Ghana? | `[PLACEHOLDER: where each product line is made, and whether any lines are imported]` | C2 ("own plants in Accra and Tema") | Operations |
| Do you offer product samples? | `[PLACEHOLDER: Lexta sample policy]` | C2 | Sales |
| Minimum order | `[PLACEHOLDER: minimum order quantities for distributors and bulk buyers]` | C2 | Sales |
| Credit terms | `[PLACEHOLDER: credit terms and opening order terms for trade partners]` | C2 ("pro-forma") | Finance |
| Delivery | `[PLACEHOLDER: delivery lead times by region]` | C2 ("Tema warehouse within 48 hours") | Logistics |
| Own brand manufacturing | `[PLACEHOLDER: whether Lexta offers private label or contract manufacturing, and for which lines]` | C2 | Management |
| How do I become a distributor? | `[PLACEHOLDER: documents Lexta requires from distributors]` | C2 ("two trade references…") | Sales |
| How long does an application take? | `[PLACEHOLDER: how long a distributor application takes]` | C2 | Sales |
| Interns / national service | `[PLACEHOLDER: whether Lexta takes interns and national service personnel, and in which areas]` | C2 | HR |

### Privacy Policy `/privacy-policy` (standard text written by 1773, fact free)

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Hero intro | `[PLACEHOLDER: Lexta legal review before go-live]` | LEG (Desmond) | Lexta legal adviser |
| Last updated | `[PLACEHOLDER: date Lexta approves this policy]` | LEG | Legal |
| 1. Who we are | `[PLACEHOLDER: Lexta's registration details with the Data Protection Commission, if any]` | LEG / NS | Legal / Admin |
| 2. Information we collect | `[PLACEHOLDER: analytics or other tracking tools used on the site, if any]` | NS | 1773 IT with Lexta |
| 5. Who we share it with | `[PLACEHOLDER: any other recipients, and whether information is transferred outside Ghana]` | LEG | Legal |
| 6. How long we keep it | `[PLACEHOLDER: retention periods for enquiries, complaints, chat conversations, job applications and CVs, partner applications and newsletter subscriptions]` | LEG (old "24 months / 6 months / six years" removed) | Legal / HR |
| 8. Your rights | `[PLACEHOLDER: how and within what time Lexta responds to data requests, and the contact for data protection questions]` | LEG (old "30 days" removed) | Legal |
| 9. Cookies | `[PLACEHOLDER: any analytics or other cookies used, and how visitors can control them]` | NS | 1773 IT with Lexta |

### Terms & Conditions `/terms-and-conditions` (standard website terms written by 1773, fact free)

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Hero intro | `[PLACEHOLDER: Lexta legal review before go-live]` | LEG (Desmond) | Lexta legal adviser |
| Last updated | `[PLACEHOLDER: date Lexta approves these terms]` | LEG | Legal |
| 5. Trade, partner and supplier applications | `[PLACEHOLDER: Lexta's terms of supply for trade customers, or a reference to where they are set out]` | LEG (old VAT, pro-forma, 30 day quote, 7 day claims terms removed) | Legal / Finance |
| 8. Liability | `[PLACEHOLDER: any limit of Lexta's liability, as confirmed by Lexta's legal adviser]` | LEG (old "limited to the invoice value" removed) | Legal |
| 10. Governing law | `[PLACEHOLDER: dispute resolution and jurisdiction wording, as confirmed by Lexta's legal adviser]` | LEG | Legal |

### Site wide

| Slot | Placeholder | Why | Who |
| --- | --- | --- | --- |
| Footer social badges f / ig / in / tk (`components/SiteFooter.tsx`) | `[PLACEHOLDER: Lexta Facebook page address]`, `[PLACEHOLDER: Lexta Instagram address]`, `[PLACEHOLDER: Lexta LinkedIn page address]`, `[PLACEHOLDER: Lexta TikTok address]` (shown as the badge tooltip and accessible label; badges are no longer links) | NS (old "lextagh" handles unverified; lextagh.com linked only Yazz accounts) | Marketing |

## 2. News stories held back (not deleted)

Per Desmond, the eight stories summarised from press coverage stay in `content/news/articles.ts` but are listed in
`content/news/held.ts`, so they do not appear on the News page, the Home teasers, "More stories", newer/older links or
CSR page links, and `/news/<slug>` returns 404: Empowered Periods 19 locations; Yazz x MX24 TV CroxItOut; SOFPOG/MWAG/Korle Bu
screening; Tuesday Market Park Mamprobi; Women doctors encourage screening; Tamale launch 2024; GES Cook Art; Kumasi screening.
Live stories (7): the three lextagh.com stories (Unity High JHS, Mawuko Girls SHS, Teen Care) and the four CSR programme stories,
which have both a lextagh.com post and a Drive narrative (Bright Smiles, Safe Bottoms, Lexta Forest Project, Clean Hands, Green Land).
The CSR screening strip still shows its five yazzproducts.com cards, without links.

## 3. Copy written by 1773 ("expanded by 1773") and the source facts used

| Page / slot | What was written | Source facts used |
| --- | --- | --- |
| Home, Who We Are h2 and paragraphs | "A Ghanaian consumer-goods company"; About paragraph; founder line | Drive About Lexta; lextagh.com (2002, Martin Brobbey, Monrovia subsidiary, "single-category supplier to a leader in home and personal care") |
| Home, Hooch card | "Hooch® Cornflakes and Hooch® Frosted Flakes, enriched with vitamins, with 10 individual packs…" | `hooch/products.md` ("Enriched with vitamins"), `hooch/website-copy.md` (10 individual packs per product) |
| Home, For Business cards | Distributor / bulk / export text | Drive (Distributor / Wholesaler / Modern Trade, "select your partnership type and share your region"), lextagh.com Monrovia, Drive "serve families throughout Africa" |
| Home, hero slides 2, 4, 6 | Body lines | lextagh.com (2002, home care supplier origin, Monrovia; corporate pillar "stringent international hygiene and regulatory benchmarks… every batch meets defined safety criteria"), Drive ambition line |
| Home, quality cards | Manufacturing, Distribution, R&D | lextagh.com corporate pillars |
| Home, news teasers | Bright Smiles, Safe Bottoms, Forest | `yazz/csr.md` |
| About, hero h1 and story paragraph 2, quality band, leadership line, Reach cards | Rewritten without "manufacturer / pan-African / since 2010" | Drive About; lextagh.com board bio and About |
| Journey, Liberia and Today milestones | Text | lextagh.com (Monrovia subsidiary); lextagh.com R&D pillar and "What is care…" questions |
| Our Brands, hero, intro, Yazz intro, "one company" band, Sell our brands | Text | Drive Yazz groupings; yazzproducts.com award (Home Builders Africa Awards 2022); lextagh.com R&D pillar; Drive partnership wording |
| People & Culture, hero, people first, growth, logistics card, hiring steps, closing | Text | lextagh.com Growth pillar; Drive careers sentence; form behaviour (acknowledgement with reference) |
| Careers, intro lines, benefits titles, hiring step 1, general application | Text | Drive careers sentence and Careers form instruction; SSNIT is statutory; consent wording of the form |
| Contact, hero line, department texts, email note, Visit us, FAQs, closing | Text | Drive routing (marketing@, hr@, "designated monitored inbox"), Drive contact block (302 235 296, 302 662 970, 501 619 588, WhatsApp Customer Care 544 351 010, Consumer Reports 509 967 400), lextagh.com support@lextagh.com |
| Contact form region list | Ghana's 16 regions plus Outside Ghana | Region slugs already in `public.regions` (0005_stockists.sql) |
| Partner With Us, hero, routes, Brand benefit, steps | Text; "Retail & trade" retitled "Wholesale & modern trade" | Drive Distributor / Wholesaler / Modern Trade and CSR proposal fields; lextagh.com Monrovia |
| FAQs | Answers above, without terms | Drive routing; Consumer Reports line; lextagh.com 2002; Drive CSR proposal fields |
| CSR, meta, hero sentence, approach, pillars 01, 03 to 05, Dignity Project, Empowered Periods lead, CroxItOut body, cervical cancer band, programme cards (incl. new Lexta Legacy Project card), SDGs, Get involved | Text | Drive CSR intro and six cards (Lexta Legacy Project, Empowered Periods / Dignity Project, Safe Bottoms, Bright Smiles, Yazz Forest, Clean Hands); `yazz/csr.md` narratives, statuses ("proposed") and SDG mapping; lextagh.com (Teen Care 2017, Empowered Periods "thousands of schoolgirls annually"); yazzproducts.com posts (MWAG screenings in Tamale, Kumasi, Mamprobi, Korle Bu; MX24 TV partnership; Yazz supporting the Cook Art competition) |
| News, Bright Smiles, Safe Bottoms, Lexta Forest Project, Clean Hands, Green Land (bodies, excerpts, standfirsts) | Rewritten; Clean Hands body placeholder replaced | `yazz/csr.md` and the Lexta PDF CSR cards only (statuses, funding by Yazz and Linzzy diapers and wipes, 10 trees per 1,000 rolls, SDGs, CTAs) |
| News, "About Lexta Ghana" boilerplate, media note, interim note | Text | Drive About and mission; lextagh.com (2002, founder, Monrovia); Drive routing |
| Privacy Policy and Terms | Standard fact-free text | Data Protection Act, 2012 (Act 843) named generally; Drive privacy rules (minimise data, consent, restricted CV access, publish notices); Drive "no checkout, enquiry only" |
| Footer, Subscribe box, application forms | Microcopy ("Occasional updates…", "Your application goes to the Lexta HR team / trade desk") | Drive routing and newsletter rules |
