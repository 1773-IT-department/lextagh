# Lexta website: what was taken from the original lextagh.com

> Read only crawl on 13 November 2026 (curl, about two requests per second at most; no forms submitted, no logins).
> Crawled: `/sitemap.xml` (WordPress sitemap index: 8 posts, 16 pages, 1 job), `/wp-json/wp/v2/pages`, `/wp-json/wp/v2/posts`, `/wp-json/wp/v2/media` (79 items) and the rendered Home, About Us, People, Careers, Brands, CSR/News/Blog, News and Contact Us pages, plus their Elementor stylesheets (for background images).
> Desmond's rules applied: Lexta's Drive content wins; the original site only fills placeholders and gaps; no design change; no links to the real domains; images downloaded, never hotlinked.
> Branch: content/lexta-gap-fill.

## 1. Items used on the site

| # | Item | Source URL | Where it is used | Notes |
| --- | --- | --- | --- | --- |
| O1 | News story body: International Women's Day at Unity High JHS, Kotobabi | https://lextagh.com/2019/03/08/lexta-ghana-limited-spent-time-with-the-girls-of-unity-high-jhs-in-kotobabi-in-commemoration-of-the-internal-womens-day/ | `/news/international-womens-day-with-the-girls-of-unity-high-jhs-kotobabi` (body in `apps/lexta/content/news/articles.ts`) | Body now follows Lexta's own post (hygiene routines, Domite Foundation, Mr Seth Ntiamoah-Asare Jnr's remarks on women in leadership, who attended). Replaces the earlier summary's general paragraphs ("Why junior high matters", "Part of a longer commitment"), which were not in any Lexta source. Typos fixed ("internal women's day", "in all the do"); punctuation reworded. Standfirst, excerpt, title, image and `draft: true` unchanged (the interim note says the story comes from earlier Lexta posts, pending Lexta's official version, which is still true). |
| O2 | News story body: Lexta Ghana visits Mawuko Girls SHS, Ho | https://lextagh.com/2019/02/04/lexta-ghana-limited-visits-mawuko-girls-shs-ho/ | `/news/lexta-ghana-visits-mawuko-girls-shs-ho` | Body now follows Lexta's post. Dropped the earlier summary's unsourced additions (general cervical cancer facts, "a partnership with MWAG that has continued for close to a decade", the January screening claim). `draft: true` kept. |
| O3 | News story body: The Lexta Teen Care Campaign launches | https://lextagh.com/2017/05/30/lexta-teen-care-campaign/ | `/news/the-lexta-teen-care-campaign-launches` | Body now follows Lexta's post in full (aims, launch in February 2017, cervical cancer, menstrual hygiene, oral care, clean up competitions, with the WASH United 2014, WHO and 2012 FDI figures as Lexta published them). The St. Mary's SHS paragraph from the earlier draft is kept (its source is an earlier Lexta post). Reading time changed from 2 to 3 minutes. `draft: true` kept. |
| O4 | Team photo for the Home "Current Opportunities" band | https://lextagh.com/wp-content/uploads/2026/06/KAKEL-9864-scaled.jpg (media id 571, alt "Lexta Ghana", used on the original About Us page) | Home, Careers band background (`ImageSlot` "Team celebration photo") | Downloaded, centre cropped to the slot's 16:9 desktop shape at 2560 x 1440 (the source is 2560 px wide, so the guide's 2880 is not reachable), 307 KB. File: `apps/lexta/public/assets/original/lexta-team-hampers-2560x1440.jpg`. Alt: "Lexta team members with Yazz gift hampers in a meeting room". |
| O5 | Recruitment photo for Careers, general application | https://lextagh.com/wp-content/uploads/2026/06/KAKEL-9871-scaled.jpg (media id 1339, alt "Career at Lexta", the background of the original Careers page) | Careers, "Nothing open that fits?" (`ImageSlot` "Recruitment team photo") | Downloaded, centre cropped to 1600 x 1200 (4:3, the guide's landscape size), 186 KB. File: `apps/lexta/public/assets/original/lexta-careers-team-1600x1200.jpg`. Alt: "Lexta colleagues sharing Yazz gift hampers around the meeting room table". |

Both photos show people in Lexta's meeting room with Yazz gift hampers. The original site does not name them; Lexta should confirm they are staff and that the photos may be used, or send dedicated team and HR photos.

## 2. Placeholders the original site does not answer (left as they are)

| Placeholder | What the original site has |
| --- | --- |
| Clean Hands, Green Land article body | Only the old buy back version: "A plastic buy-back program where consumers return empty sachet/detergent wrappers to Lexta distributors in exchange for "Eco-Points" redeemable for products." (https://lextagh.com/2026/07/15/clean-hands-green-land/). Not the hygiene and disposal version, so the placeholder stays. |
| Chat office hours | No opening or office hours anywhere (pages, footer, contact page, Linzzy site). |
| Photo of Lexta Square | No photo of the building in the media library or page backgrounds. |
| Factory floor / production line photo (Our Brands) | None. The media library holds CSR event photos, board portraits, product shots and stock or AI images; no factory or production photos. |
| One photo per area of work (People & Culture) | None that shows the work areas (production, QA, sales, marketing, logistics, admin). Those slots keep their current stand-in photos. |
| Lexta brand video | The Home page has a "Lexta Videos / More Videos" heading but no video embedded. |
| The other 12 draft news stories | Bright Smiles, Safe Bottoms and the Lexta Forest Project have one sentence each on lextagh.com (the drafts already cover them). Empowered Periods has a one paragraph campaign description, not the "19 locations in a single day" story. The other eight stories come from yazzproducts.com and press coverage, not from lextagh.com. |

## 3. Answers to the questions in the gaps file ("original site says X")

| Gaps item | Original site says | Source |
| --- | --- | --- |
| C1 consumer care email | "Complaints & product reviews: Support@lextagh.com"; footer email Support@lextagh.com. So support@lextagh.com existed for consumer complaints. | https://lextagh.com/contact-us/, footer of every page |
| C2 / C3 partnerships, CSR email | "Partnerships/sponsorships: Marketing@lextagh.com". No csr@lextagh.com or sales@lextagh.com anywhere. | https://lextagh.com/contact-us/ |
| C4 phone numbers | Footer: "+233 (0) 501 619 588, +233 (0) 302 235 296". Contact page: "Whatsapp Customer Care +233544351010" and the "Lexta Ghana Limited channel on WhatsApp". No 302 662 970 and no 509 967 400. This supports reading "+233 02235296" as a typo for +233 (0) 302 235 296. | https://lextagh.com/ (footer), https://lextagh.com/contact-us/ |
| C6 Hooch Choco Flakes | Brands page lists only "Super Crunchy Corn Flakes" and "Frosted Flakes". No Choco Flakes. | https://lextagh.com/brands/ |
| C8 programme status | The four 15 July 2026 posts are one sentence each and read as plans: Forest "Commitment to plant 10 indigenous trees for every 1,000 rolls…"; Bright Smiles "Partner with the Ghana Dental Association to provide free biannual screenings…"; Safe Bottoms "Lexta funds…"; Clean Hands as the buy back. No reports of activity. Empowered Periods is described as running ("for thousands of schoolgirls annually"). | https://lextagh.com/csr-news-blog/ and the four posts |
| C9 Clean Hands body | Only the buy back version (see section 2). | https://lextagh.com/2026/07/15/clean-hands-green-land/ |
| C10 figures | About Us: "established in 2002 as a proudly Ghanaian-owned company"; "a wholly-owned subsidiary in Monrovia, Liberia"; "Headquartered in Accra". No founding year for Liberia (the site's "since 2010" has no source), no 500+ employees, 10M+ lives, 200+ partners, factories in Accra and Tema or "16 regions". | https://lextagh.com/about-us/ |
| C11 Yazz award line | Not on lextagh.com. | |
| C13 Mama Yazz | Brands page: "pocket tissues, toilet rolls, and premium kitchen towels"; Mama Yazz is not named. | https://lextagh.com/brands/ |
| Section 4, prototype copy (founder welcome, pillars, values, leadership) | The site's founder welcome matches the original "Welcome Message from the Founder & Managing Director" almost word for word, signed Martin Osei Kwaku Brobbey. The People page's five pillars (Entrepreneurship, Team Cohesion, Growth, Drive, Results), the core values (Committed, Aspiring, Respect, Care), the corporate pillars and the board biographies also come from the original site. So this copy is Lexta's own earlier text, not invented, though Lexta should still approve it. | https://lextagh.com/about-us/, https://lextagh.com/people/ |

## 4. Conflicts between the original site and Drive (Drive wins; nothing changed)

- **Brands:** the original About Us lists "YAZZ, HOOCH, ROXX and LINZZY" in one sentence and "YAZZ, HOOCH, and LINZZY" in the next. Drive lists three brands; the site keeps three.
- **Mission wording:** original "give our stakeholders maximum returns"; Drive (now on the site) "deliver value to stakeholders".
- **Product claims:** the original Brands page says Hooch is "low-fat" and avoids the "sugar crash", Linzzy has "clinical anti-leak barriers" and "fragrance-free" wipes, Yazz detergent is "gentle on hands". The Lexta site removed these as unverified or contradicted by Drive (see LEXTA-CONTENT-CHANGES.md); they stay removed.
- **Clean Hands, Green Land:** original is the buy back with Eco-Points; Drive is hygiene education, packaging disposal and clean-ups. Drive wins.
- **Safe Bottoms:** original "Lexta funds" (lextagh.com) and "Linzzy funds, for every diaper sold" (linzzyproducts.com); Drive ties it to Yazz and Linzzy diapers and wipes. Drive wins.
- **Footer:** original "©Copyright 2026. Lexta Ghana LTD. All Rights Reserved." Drive's wording is used.
- **Address:** original footer spells "Olusegu Obasanjo Highway"; the site keeps the correct "Olusegun".

## 5. Not used, and why

- Board and management portraits: the site already has supplied portraits. The original "Management Team" section is theme dummy content ("Johnathan Doe, Founder & CEO").
- `about-lexta-Ghana.jpg`, `diversity-and-inclusion.png`, `team_*.jpg`, `placeholder*.png`: stock, AI or theme images, not real Lexta photos.
- CroxItOut studio photos (KAKEL-0008, 0026, 0043, 0046, 0057, 0061): show MX24 TV's branding (another company's brand).
- Empowered Periods outreach photos (KAKEL-0530, 1798, 1845, 1866, 1870, 1875, 1892, 1897, 1899, 1914): real Lexta CSR photos, but there is no empty slot for them; KAKEL-0530 also shows a TECNO shop sign. They suit future CSR and news photos (see IMAGE-MAP.md).
- The Careers job "Coming Job" (https://lextagh.com/jobs/coming-job/) is a test entry.
- The original site's WhatsApp channel and social links (Facebook yazzghana, Instagram yazz_products) were not added: they are Yazz accounts, and this task adds no new elements.
