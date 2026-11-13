# Lexta website: content changes from Lexta's approved copy

> Source of the new text: Google Drive "Lexta Revised Website content and Wireframes new - Google Docs.pdf" (id 15Ypkvg9VXEvvbIYrrse55hdsv9yeVcdh), plus the Yazz, Linzzy and Hooch documents for product facts (see INVENTORY.md). The Drive folder "Lexta Tab Content" was empty.
> Only strings changed. No layout, section, component, style or image changed (checked at 390 and 1440 px against the unchanged build).
> Branch: content/lexta-approved-copy. Date: 13 November 2026.

Reasons used below: **Approved copy** (Lexta's text placed in its slot), **Contradiction** (the site said something Lexta's documents contradict), **Unverified claim** (a product claim Lexta's documents do not support; Lexta's PDF says only approved claims may be used), **Routing** (Lexta's email routing table).

## Email routing (whole site)

Lexta's routing table sends general contact, partnerships, distributor and wholesale enquiries to marketing@lextagh.com ("interim, pending Sales confirmation") and job applications to hr@lextagh.com. Neither sales@lextagh.com nor a general support@lextagh.com appears anywhere in Lexta's documents. No Lexta consumer care address is given, so the Consumer care route keeps support@lextagh.com (logged in the gaps file).

| Where | Old text | New text | Reason |
| --- | --- | --- | --- |
| Footer, contact column | support@lextagh.com | marketing@lextagh.com | Routing |
| Mobile menu, contact lines | support@lextagh.com | marketing@lextagh.com | Routing |
| Contact Us, "Email us" card | support@lextagh.com / sales@lextagh.com | marketing@lextagh.com / hr@lextagh.com | Routing |
| Contact Us, Sales and distribution card | sales@lextagh.com | marketing@lextagh.com | Routing |
| Contact Us, Media and communications card | support@lextagh.com | marketing@lextagh.com | Routing |
| Contact Us, Recruitment card | support@lextagh.com | hr@lextagh.com | Routing |
| Contact Us, "Book an appointment" button | mailto:support@lextagh.com | mailto:marketing@lextagh.com | Routing |
| Contact Us, closing "Contact us" button | mailto:sales@lextagh.com | mailto:marketing@lextagh.com | Routing |
| Contact Us form routes (General enquiry, Distribution, Bulk orders, Media) shown under the form and in fallback messages | support@ / sales@lextagh.com | marketing@lextagh.com | Routing |
| Contact Us form route Careers | support@lextagh.com | hr@lextagh.com | Routing |
| Contact Us FAQ "How do I become a Lexta distributor?" | Write to sales@lextagh.com | Write to marketing@lextagh.com | Routing |
| Contact Us FAQ "Do you supply institutions…?" | to sales@lextagh.com for a quotation | to marketing@lextagh.com for a quotation | Routing |
| Contact Us FAQ "Can I visit the factory?" | Write to support@lextagh.com | Write to marketing@lextagh.com | Routing |
| FAQs, "How do I report a product quality issue?" | Email sales@lextagh.com | Email marketing@lextagh.com | Routing |
| FAQs, "Does Lexta ever charge for recruitment?" | report it to sales@lextagh.com | report it to hr@lextagh.com | Routing |
| Careers, general application contact | support@lextagh.com | hr@lextagh.com | Routing |
| Careers, "Ask a question" on each role | mailto:support@lextagh.com | mailto:hr@lextagh.com | Routing |
| Careers form error messages (CAREERS_EMAIL) | support@lextagh.com | hr@lextagh.com | Routing |
| Partner With Us, Trade desk | sales@lextagh.com | marketing@lextagh.com | Routing |
| Partner form, newsletter and default contact fallback messages (SALES_EMAIL, SUPPORT_EMAIL) | sales@ / support@lextagh.com | marketing@lextagh.com | Routing |
| Privacy Policy, Terms and legal "Questions" box | sales@lextagh.com | marketing@lextagh.com | Routing |
| News articles, media contact block | support@lextagh.com | marketing@lextagh.com | Routing (Corporate Affairs) |
| Live chat "not available" and error messages | support@lextagh.com | marketing@lextagh.com | Routing |

## Home

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Hero slide 1, headline | Caring for your everyday | Caring for you every day | Approved copy |
| Hero slide 1, body | Home care, personal care and food products made in Ghana for families across Africa. | Quality, affordability and everyday care, proudly from Ghana. | Approved copy (trimmed; full text in the gaps file) |
| Hero slide 1, buttons | Explore our brands | Explore Our Brands + Partner with Us (to /partner-with-us, the existing secondary button style already used on slide 6) | Approved copy |
| Our Brands, Linzzy card | Sanitary napkins in Cool Mint, Heavy Flow and Extra Long, plus fragrance free baby wipes formulated for sensitive skin. | Sanitary towels in Cool Mint, Heavy Flow and Extra Long, panty liners, plus baby diapers and baby wipes for everyday family care. | Contradiction: Linzzy wipes are Rose Perfume and Lavender Perfume, and the range includes liners and diapers |
| Our Impact in Numbers | 4+ Trusted Brands | 3 Trusted Brands | Contradiction: Lexta lists three brands |

## About Us

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Hero paragraph (also the page description) | Lexta Ghana Limited is a Ghanaian manufacturer of home care, personal care and food products. Founded in Accra in 2002, we make and distribute the everyday essentials that families across Ghana and the wider West African sub-region reach for without thinking twice. | Lexta Ghana Limited is a Ghanaian consumer-goods company committed to making dependable everyday products more accessible to households. Across Yazz, Linzzy and Hooch, we bring care, innovation and value together with an ambition to serve families throughout Africa. | Approved copy |
| Our Story, third paragraph | Today our portfolio carries three brands: Yazz, Hooch and Linzzy. Each was developed to serve a specific need in the Ghanaian home, and each holds to the same standard of quality, safety and value. | Our mission is to combine quality, innovation and affordability in products that meet family needs and deliver value to stakeholders. Our vision is to be the preferred choice for family-care products across Africa. | Approved copy (mission and vision) |
| Our Story, figures | 4 Brands in the portfolio | 3 Brands in the portfolio | Contradiction |

## Our Brands

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Linzzy introduction | Linzzy is our answer to a generation that expects more from a personal care product than absorption. Cleaner design, clinical performance, and a quieter kind of confidence. Where Yazz is the trusted everyday, Linzzy is precise, modern and unmistakably deliberate. | Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited, created to support the personal care needs of women, mothers and growing families. Its portfolio includes sanitary towels, panty liners, baby diapers and baby wipes, offering practical choices for different care routines. | Approved copy (Linzzy About); removes unverified "clinical performance" |
| Linzzy point 1 | Built on engineering, not marketing: Structured absorption layers and anti leak barriers designed around how the product is actually worn, not how it photographs. | Comfort-focused design: Product options designed with attention to fit, coverage, convenience and everyday use, built around the Absorb, Lock and Breathe positioning. | Unverified claim |
| Linzzy point 2 | Built for sensitive skin: Fragrance free formulations across the baby range, tested to guard against irritation rather than mask it. | A brand that listens: We value consumer feedback and believe that understanding real experiences helps us continuously improve. | Contradiction (wipes are perfumed) and unverified testing claim |
| Hooch introduction | Breakfast decides the morning. Hooch is built for mornings that have to last: pure grains, vitamin fortified, low in fat, and formulated to avoid the sugar crash that most cereals build in and then quietly rely on. For families, for students, for anyone whose day starts early and ends late. | Hooch is a food brand within the Lexta Ghana Limited family, created to make breakfast and snack moments enjoyable, practical and accessible. We believe that a positive start can open the door to learning, creativity and connection. Our ambition is to support families with dependable food choices and useful everyday ideas. | Approved copy; removes unverified "low in fat" and "sugar crash" claims (Frosted Flakes lists 23 sugar) |
| Hooch point 1 | Fortified, not just sweetened: Essential vitamins added for real metabolic value, not a claim on the front of the box. | Enriched with vitamins: Vitamin E, B1, B2, B3, B5, B6, B12 and folic acid, as listed on the approved Hooch packaging. | Unverified claim |
| Hooch point 2 | Made for the long morning: A grain profile designed to release energy steadily, so ten o'clock feels like nine. | Convenience: Making busy mornings easier with 10 individually portioned cereal packs in every product. | Unverified claim |

### Product cards (fallback text in components/brands/data.ts)

The live page reads products from Product Management in the portal. These cards are the fallback when the database cannot be reached. **The same text must also be entered in Product Management by Lexta staff** (this branch does not touch Supabase); see the gaps file.

| Card | Old text | New text | Reason |
| --- | --- | --- | --- |
| Yazz sanitary pads and panty liners | Winged, high absorbency pads engineered for security and comfort through a full day. Available across regular, heavy flow and extra long formats, with panty liners for everyday freshness. | Ultra-thin pads with soft flexible wings and wide adhesive for side protection and comfort. Available in Green, Pink (Heavy Flow), Minty, Extra Long and Extra Long Minty, with panty liners for everyday freshness. | Contradiction (variant list) |
| Yazz toothpaste | The new Yazz range comes in three variants: Charcoal, Herbal and Fluoride. Formulated with calcium carbonate, fluoride and sodium to strengthen enamel and guard against plaque, cavities, bleeding gums and bad breath. The Herbal variant carries a blend of herbs that soothes the gums. | The Yazz range comes in five variants: Whitening, Total Care, Herbal, Fluoride and Charcoal. Made for whiter, brighter and healthier smiles, with everyday protection against plaque, cavities and bad breath. The Herbal variant carries a unique blend of herbs. | Contradiction (five variants) |
| Yazz toothbrushes | Designed to pair with the range, built to last longer than the month you bought them for. | Princess, Duke, Duchess, Monarch, Kids and Double (His & Hers), with medium bristles, a tongue cleaner and a flexible rubber handle for easy grip. | Approved product facts |
| Yazz washing powder | Active enzymes formulated to lift the toughest stains, with perfumed blue speckles that leave clothes smelling fresh. Clinically tested to be gentle on hands. Tough on stains, kind on fabric. | Yazz Activ Detergent with Enzymes, specially formulated to give you brighter and fresher clothes, free from every stain. Available in 200g, 500g, 2kg and 5kg packs. | Unverified claim ("clinically tested"; Lexta's pack says to stop use on skin irritation) |
| Yazz baby wipes | Alcohol free, gently scented wipes that clean and care for delicate skin, leaving it fresh and smooth. Available in three variants. | Alcohol free wipes that gently cleanse and care for delicate skin, leaving it soft and nourished. Available in Lavender, Castor Oil and Aloe Vera. | Approved product facts |
| Yazz baby diapers | Absorbent, secure and comfortable, for the long nights and the longer days. | Regular diapers and pull up pants with elastic waists, cottony softness and up to 12 hours leakage protection. | Approved product facts |
| Yazz tissue and kitchen towels | Pocket tissues, toilet rolls, and Mama Yazz, our two ply kitchen towel, named for the number of jobs it ends up doing in a Ghanaian kitchen. | Mama Yazz jumbo tissue, kitchen towels, toilet rolls and tissue napkins for everyday household routines. Pocket Tissue is coming soon. | Contradiction (Mama Yazz is the jumbo tissue; Pocket Tissue coming soon) |
| Linzzy card title | Sanitary napkins | Sanitary towels | Lexta's product name |
| Linzzy sanitary towels | A full portfolio including Cool Mint, Heavy Flow and Extra Long, each with clinical anti leak barriers and structured absorption designed for a specific need rather than an average one. | Cool Mint, Heavy Flow and Extra Long sanitary towels built around the Absorb, Lock and Breathe positioning, plus Linzzy Panty Liners for light everyday protection. | Unverified claim |
| Linzzy sanitary towels image alt | Linzzy sanitary napkins | Linzzy sanitary towels | Lexta's product name |
| Linzzy baby wipes | Ultra mild, fragrance free wipes in 80 piece packs, formulated for sensitive skin and built to hold up to the job. | 80 wipes per resealable pack, in Pink (Rose Perfume), Blue (Lavender Perfume) and Yellow, for everyday care at home or on the go. | Contradiction (perfumed variants) |
| Linzzy baby care | A growing range of everyday essentials for the youngest members of the household. | Linzzy Baby Diapers with a flexible comfort design, in sizes for growing babies, made for little moves and everyday comfort. | Approved product facts |
| Hooch corn flakes | Traditional, crisp, sun ripened corn flakes toasted for a crunch that survives the milk, fortified with essential vitamins. | Super classic crunchy, everyday goodness. 10 individual packs of 50g in every 500g product, enriched with vitamins. | Approved product facts |
| Hooch frosted flakes | A measured balance of sweetness and high energy grain, low in fat, made for active mornings and small people with strong opinions. | Sweet crunch, happy mornings. A crispy texture with a sweet frosted finish, in 10 individual packs of 37.5g in every 375g product. | Unverified claim ("low in fat") |

## Corporate Social Responsibility

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Hero paragraph | We make products that help people stay healthy, clean and confident. Our responsibility does not end when the pack is sold. It continues in the schools, clinics, markets and communities where those products are needed most. | Our care extends beyond our products. Through education, hygiene awareness, environmental responsibility and community partnerships, Lexta seeks to help create healthier, more informed and more sustainable communities. | Approved copy (the last sentence of Lexta's paragraph is in the gaps file) |
| Focus area 05, Environment | Restoring what our production takes, and building circular systems that give plastic waste a value. | Restoring what our production takes, with responsible packaging disposal and community clean-up partnerships. | Contradiction (Clean Hands, Green Land is described differently) |
| Programme card, The Safe Bottoms Initiative | For every jumbo pack sold, Lexta funds the construction and maintenance of mechanised boreholes in communities facing water scarcity, so that safe hygiene for infants is possible in the first place. | For every jumbo pack sold, Yazz and Linzzy diapers and wipes fund the construction and maintenance of mechanised boreholes in communities facing water scarcity, to ensure safe hygiene for infants. | Approved copy (initiative tied to Yazz and Linzzy baby care) |
| Programme card, Clean Hands, Green Land | A plastic buy back programme. Consumers return empty sachet and detergent wrappers to Lexta distributors in exchange for Eco Points, redeemable against our products. Waste gets a value, and our distribution network becomes a collection network. | Clean homes and a cleaner environment belong together. Led by Yazz Detergent, this programme focuses on practical hygiene education, responsible packaging disposal and community clean-up partnerships. | Contradiction |
| SDG 12 | The Clean Hands, Green Land plastic buy back programme. | Clean Hands, Green Land: hygiene education, responsible packaging disposal and community clean-ups. | Contradiction |

## News

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| News page intro and description | …Lexta Ghana, Yazz, Linzzy, Crox and Softcare. | …Lexta Ghana, Yazz, Linzzy and Hooch. | Contradiction (Lexta's brands are Yazz, Linzzy and Hooch) |
| Article "Clean Hands, Green Land", excerpt | A plastic buy back programme that turns our distribution network into a collection network, with Eco Points for consumers. | Clean homes and a cleaner environment belong together: hygiene education, responsible packaging disposal and community clean-ups. | Contradiction |
| Article "Clean Hands, Green Land", standfirst | A plastic buy back programme that turns our distribution network into a collection network: consumers return empty sachet and detergent wrappers to Lexta distributors and earn Eco Points they can redeem against our products. | Clean homes and a cleaner environment belong together. Led by Yazz Detergent, Clean Hands, Green Land focuses on practical hygiene education, responsible packaging disposal and community clean-up partnerships. | Contradiction (the article body still describes the buy back; see gaps) |

## Careers

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Hero paragraph | From the production floor in Accra to sales routes across Ghana and into Liberia, our teams make and move products that hundreds of thousands of households depend on. Here is where we are hiring right now. | Grow with a company that believes in people and possibilities. Explore opportunities in production, sales, logistics, marketing and administration. Here is where we are hiring right now. | Approved copy |
| Benefits, Staff product allocation | A monthly allocation of Yazz, Linzzy, Crox and Softcare products for your household. | A monthly allocation of Yazz, Linzzy and Hooch products for your household. | Contradiction |

## Contact Us

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Consumer care card | …batch enquiries for Yazz, Linzzy, Crox and Softcare. | …batch enquiries for Yazz, Linzzy and Hooch. | Contradiction |
| FAQ "Where can I buy your products?" | Yazz, Linzzy, Crox and Softcare are stocked… | Yazz, Linzzy and Hooch are stocked… | Contradiction |
| Bulk orders field placeholder | e.g. 500 cartons Softcare 2-ply | e.g. 500 cartons Mama Yazz tissue | Contradiction (not a Lexta brand) |
| Consumer care field placeholder | e.g. Yazz Ultra, batch 2026-04-18 | e.g. Yazz Minty pads, batch 2026-04-18 | Contradiction (not a Lexta product) |

## Partner With Us

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Figures | 6 Consumer brands available to trade partners | 3 Consumer brands available to trade partners | Contradiction |

## Footer

| Section | Old text | New text | Reason |
| --- | --- | --- | --- |
| Copyright | © 2026. Lexta Ghana LTD. All Rights Reserved. | © 2026 Lexta Ghana Limited. All rights reserved. | Approved wording (used in every Lexta document) |

## Not changed (Lexta's documents agree with the site)

- Head office address: Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.
- Phone numbers +233 (0) 501 619 588 and +233 (0) 302 235 296 (both appear in Lexta's contact block).
- "Founded 2002", "24 years", "25+ years", 500+ employees, 10M+ lives, 200+ distribution partners, Liberia: Lexta's documents give no figures, so nothing contradicts them (logged for confirmation in the gaps file).
