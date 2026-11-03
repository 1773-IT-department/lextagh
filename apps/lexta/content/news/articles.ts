/**
 * Lexta news articles. Content lives in code (no CMS, by scope): edit this file to change a story.
 *
 * Order: newest first, with the News grid keeping the approved prototype's card order. The story with
 * featured: true fills the News page hero; every other story is a card in the grid.
 *
 * Fields:
 * - excerpt: the short text on the News card (copied from the approved prototype).
 * - standfirst: the intro under the headline on the article page, also its meta description.
 * - date: the date as displayed. isoDate: machine date (YYYY-MM-DD, or YYYY-MM when only the month is known).
 * - image: the story photo (local /assets path or a photo on lextagh.com or yazzproducts.com). imageAlt describes it.
 * - draft: true shows the note that the story is an interim summary of public coverage. When Lexta sends its
 *   official text, replace standfirst, body and sources, then set draft to false.
 * - body: blocks of type p (paragraph), h2 (subheading), quote (pull quote, text plus optional cite)
 *   and list (bullet points, items plus optional intro).
 *
 * Copy rules: no em dashes, en dashes or spaced hyphens. Never invent facts, quotes or photos.
 */

export type NewsCategory = "CSR" | "Health" | "Brands" | "Partnerships" | "Company";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[]; intro?: string };

export type ArticleSource = { name: string; url: string };

export type Article = {
  slug: string;
  title: string;
  category: NewsCategory;
  date: string;
  isoDate: string;
  excerpt: string;
  standfirst: string;
  readingMinutes: number;
  image: string;
  imageAlt: string;
  featured: boolean;
  draft: boolean;
  body: ArticleBlock[];
  sources: ArticleSource[];
  /** Where the story was first published (kept for reference; the site links to our own article page). */
  originalUrl: string;
};

export const articles: Article[] = [
  {
    slug: "the-bright-smiles-school-tour",
    title: "The Bright Smiles School Tour",
    category: "CSR",
    date: "15 July 2026",
    isoDate: "2026-07-15",
    excerpt: "Free biannual dental screenings and oral hygiene workshops in rural primary schools, with the Ghana Dental Association.",
    standfirst: "In partnership with the Ghana Dental Association, The Bright Smiles School Tour brings free dental screenings and oral hygiene workshops to rural primary schools twice a year.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/KAKEL-1897-scaled.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "The programme"
      },
      {
        type: "p",
        text: "The Bright Smiles School Tour is Lexta Ghana's oral health programme for young children. Working in partnership with the Ghana Dental Association, the tour provides free biannual dental screenings and oral hygiene workshops in rural primary schools."
      },
      {
        type: "p",
        text: "Screenings give dental professionals the chance to spot problems early and advise children and their families on next steps. The workshops focus on the everyday habits that prevent problems in the first place: how and when to brush, why sugary snacks and drinks matter, and why regular check ups are worth the trip."
      },
      {
        type: "h2",
        text: "Why start in primary school"
      },
      {
        type: "p",
        text: "Tooth decay is one of the most common health problems among children anywhere in the world, and it is largely preventable. The habits that protect teeth for life are formed early, which makes the primary school years the right moment to teach them."
      },
      {
        type: "p",
        text: "Dental pain is also more than a health issue. A child with toothache finds it hard to concentrate, and may miss school altogether. Helping children keep their teeth healthy supports their learning as well as their wellbeing."
      },
      {
        type: "h2",
        text: "Why rural schools"
      },
      {
        type: "p",
        text: "Families in rural communities often live further from dental clinics and may find it harder to reach regular care. Taking screenings and workshops into rural primary schools brings that care to children where they already are, and returning twice a year allows progress to be followed rather than measured once."
      },
      {
        type: "h2",
        text: "Working with the experts"
      },
      {
        type: "p",
        text: "Our approach to corporate social responsibility is to work where our products and expertise can change an outcome, and to partner with the people who know the subject best. A company that makes oral care products should be in schools talking about oral health, and the Ghana Dental Association brings the clinical knowledge to make those visits count."
      },
      {
        type: "p",
        text: "The Bright Smiles School Tour is part of the oral health pillar of our CSR programme and contributes to Sustainable Development Goal 3, good health and wellbeing. Schools that would like to be considered for a visit can request an outreach session through our website."
      }
    ],
    sources: [
      {
        name: "Yazz Products: The Bright Smiles School Tour",
        url: "https://yazzproducts.com/the-bright-smiles-school-tour/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2026/07/15/the-bright-smiles-school-tour/"
  },
  {
    slug: "the-safe-bottoms-initiative",
    title: "The Safe Bottoms Initiative",
    category: "CSR",
    date: "15 July 2026",
    isoDate: "2026-07-15",
    excerpt: "For every jumbo pack sold, Lexta funds mechanised boreholes in communities facing water scarcity.",
    standfirst: "For every jumbo pack sold, Lexta funds the construction and maintenance of mechanised boreholes in communities facing water scarcity, so that safe hygiene for infants is possible in the first place.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/KAKEL-1875-683x1024.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "How the initiative works"
      },
      {
        type: "p",
        text: "The Safe Bottoms Initiative links an everyday purchase to a lasting community benefit. For every jumbo pack sold, Lexta Ghana funds the construction and maintenance of mechanised boreholes in communities facing water scarcity."
      },
      {
        type: "p",
        text: "The idea is straightforward. Good infant hygiene depends on clean water: for bathing a baby, for washing hands before and after a change, and for keeping the home clean. Where safe water is scarce, even families with the right products struggle to keep their children clean and healthy. Safe Bottoms addresses that underlying need."
      },
      {
        type: "h2",
        text: "Why water comes first"
      },
      {
        type: "p",
        text: "Access to safe water shapes almost every part of family health. When water has to be carried over long distances, every litre is rationed, and hygiene is often the first thing to be cut back. Infants and young children are among the most vulnerable to the illnesses that follow poor sanitation."
      },
      {
        type: "p",
        text: "A reliable water point close to home changes that. It saves time, particularly for the women and girls who usually fetch water, and it makes regular handwashing and bathing realistic rather than aspirational."
      },
      {
        type: "h2",
        text: "Built to last"
      },
      {
        type: "p",
        text: "Funding covers maintenance as well as construction. A borehole that falls into disrepair stops serving its community, so the initiative is designed to keep water flowing over time rather than to mark a single opening day."
      },
      {
        type: "h2",
        text: "Part of our water and sanitation pillar"
      },
      {
        type: "p",
        text: "Safe Bottoms is part of the water and sanitation pillar of Lexta's CSR programme and contributes to Sustainable Development Goal 6, clean water and sanitation. It reflects a principle that runs through all our community work: we act where our products and our business can make a practical difference."
      },
      {
        type: "p",
        text: "Communities, local authorities and organisations working on water access that would like to discuss the initiative can contact our team through the Partner With Us page."
      }
    ],
    sources: [
      {
        name: "Yazz Products: The Safe Bottoms Initiative",
        url: "https://yazzproducts.com/the-safe-bottoms-initiative/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2026/07/15/the-safe-bottoms-initiative/"
  },
  {
    slug: "the-lexta-forest-project",
    title: "The Lexta Forest Project",
    category: "CSR",
    date: "15 July 2026",
    isoDate: "2026-07-15",
    excerpt: "Ten indigenous trees planted for every 1,000 rolls of virgin pulp tissue sold, restoring reserves in Ashanti and the Eastern region.",
    standfirst: "Lexta commits to planting ten indigenous trees for every 1,000 rolls of 100 percent virgin pulp tissue sold, restoring degraded forest reserves in the Ashanti and Eastern regions.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/Lexta-Teen-Care-Campaign.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "Putting trees back"
      },
      {
        type: "p",
        text: "Our tissue is made from 100 percent virgin pulp, which comes from trees. The Lexta Forest Project is our commitment to give back what that production takes. For every 1,000 rolls of 100 percent virgin pulp tissue sold, Lexta commits to planting ten indigenous trees."
      },
      {
        type: "p",
        text: "The planting is focused on degraded forest reserves in the Ashanti and Eastern regions, two parts of Ghana where forest cover has come under pressure."
      },
      {
        type: "h2",
        text: "Why indigenous species"
      },
      {
        type: "p",
        text: "The project plants indigenous trees rather than fast growing exotic species. Native trees belong to the local ecosystem: they support the birds, insects and other wildlife that depend on them, and they help restore the character of a forest rather than simply adding tree cover."
      },
      {
        type: "h2",
        text: "Why forests matter"
      },
      {
        type: "p",
        text: "Forests protect soils and water sources, provide habitat, store carbon and support the livelihoods of many communities. When a reserve is degraded, those benefits are lost along with the trees. Restoration is slow work, and it depends on long term commitment rather than one off planting days."
      },
      {
        type: "h2",
        text: "Linking sales to restoration"
      },
      {
        type: "p",
        text: "Tying planting to tissue sales means the project grows with the business. As more households choose our tissue, more trees go into the ground. It is a direct expression of the philosophy behind all our CSR work: a company that makes tissue from virgin pulp should be putting trees back."
      },
      {
        type: "p",
        text: "The Lexta Forest Project is part of the environment pillar of our CSR programme and contributes to Sustainable Development Goal 15, life on land. Organisations involved in forest restoration in the Ashanti and Eastern regions that would like to work with us can contact our team through the Partner With Us page."
      }
    ],
    sources: [
      {
        name: "Yazz Products: The Lexta Forest Project",
        url: "https://yazzproducts.com/the-lexta-forest-project/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2026/07/15/the-lexta-forest-project/"
  },
  {
    slug: "clean-hands-green-land",
    title: "Clean Hands, Green Land",
    category: "CSR",
    date: "15 July 2026",
    isoDate: "2026-07-15",
    excerpt: "A plastic buy back programme that turns our distribution network into a collection network, with Eco Points for consumers.",
    standfirst: "A plastic buy back programme that turns our distribution network into a collection network: consumers return empty sachet and detergent wrappers to Lexta distributors and earn Eco Points they can redeem against our products.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/KAKEL-1845-1024x683.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "How it works"
      },
      {
        type: "p",
        text: "Clean Hands, Green Land is Lexta Ghana's plastic buy back programme. Consumers return empty sachet and detergent wrappers to Lexta distributors. In exchange they receive Eco Points, which can be redeemed against Lexta products."
      },
      {
        type: "p",
        text: "The principle is simple: give waste a value, and people have a reason to collect it rather than throw it away."
      },
      {
        type: "h2",
        text: "Our network, working in reverse"
      },
      {
        type: "p",
        text: "Every day our distributors carry products out to shops, markets and homes across Ghana. Clean Hands, Green Land uses the same network in the other direction. The routes that deliver full packs can also bring empty wrappers back, which turns a distribution network into a collection network without building a new system from scratch."
      },
      {
        type: "h2",
        text: "Why packaging waste matters"
      },
      {
        type: "p",
        text: "Small plastic sachets and wrappers make everyday products affordable in convenient sizes, but once used they are easy to drop and hard to collect. Discarded packaging blocks drains, spoils public spaces and can contribute to flooding when gutters are clogged."
      },
      {
        type: "p",
        text: "As a manufacturer of home care products sold in this kind of packaging, we have a responsibility for what happens to it after use. Clean Hands, Green Land is one practical way of taking that responsibility seriously."
      },
      {
        type: "h2",
        text: "A circular approach"
      },
      {
        type: "p",
        text: "Rewarding returns with Eco Points that can be spent on our products closes the loop between consumer, distributor and manufacturer. Households gain value from something they would otherwise discard, and communities benefit from cleaner streets and drains."
      },
      {
        type: "p",
        text: "The programme is part of the environment pillar of our CSR work and contributes to Sustainable Development Goal 12, responsible consumption and production. For details of participating distributors, please contact our team through the Contact Us page."
      }
    ],
    sources: [
      {
        name: "Yazz Products: Clean Hands, Green Land",
        url: "https://yazzproducts.com/clean-hands-green-land/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2026/07/15/clean-hands-green-land/"
  },
  {
    slug: "empowered-periods-reaches-19-locations-in-a-single-day",
    title: "Empowered Periods reaches 19 locations in a single day",
    category: "CSR",
    date: "28 June 2026",
    isoDate: "2026-06-28",
    excerpt: "Our annual nationwide activation, led by Yazz and Linzzy, distributed free sanitary products and delivered menstrual hygiene education to thousands of young women on 28 May 2026.",
    standfirst: "On 28 May 2026, Menstrual Hygiene Day, our annual Empowered Periods Campaign took free sanitary products and menstrual hygiene education to at least 19 locations across Ghana in a single day.",
    readingMinutes: 3,
    image: "/assets/hero-cervical-screening.png",
    imageAlt: "Image from the original story",
    featured: true,
    draft: true,
    body: [
      {
        type: "h2",
        text: "A day of action across the country"
      },
      {
        type: "p",
        text: "On Thursday 28 May 2026, teams from Lexta Ghana Limited activated the annual Empowered Periods Campaign at no fewer than 19 locations across Ghana. Led by our Yazz and Linzzy brands, the outreach distributed free sanitary pads and delivered menstrual hygiene education to thousands of young women and girls."
      },
      {
        type: "p",
        text: "The date was chosen with purpose. 28 May is Menstrual Hygiene Day, marked around the world to draw attention to good menstrual health and to the barriers that stop many women and girls from managing their periods safely and with dignity."
      },
      {
        type: "h2",
        text: "Why period poverty matters"
      },
      {
        type: "p",
        text: "Period poverty describes the situation in which girls and women cannot afford or reach sanitary products, safe facilities or reliable information. Its effect on education is direct: a girl who cannot manage her period at school may stay at home, and those missed days add up over a school year."
      },
      {
        type: "p",
        text: "The Empowered Periods Campaign responds to that problem in a practical way. It supplies free sanitary products and hosts reproductive health education for schoolgirls, so that a lack of basic hygiene resources is never the reason a girl misses her lessons."
      },
      {
        type: "h2",
        text: "Part of The Dignity Project"
      },
      {
        type: "p",
        text: "The campaign sits within The Dignity Project, the flagship social initiative led by Yazz. The Dignity Project aims to keep adolescent girls in school with comfort and confidence, combining free product distribution, reproductive health education and a sustained presence in schools rather than a single visit."
      },
      {
        type: "p",
        text: "Speaking about the 2026 outreach, Lexta's Marketing Executive, Akosua Naana Lexis Obenewaa Opoku-Agyemang, said the activation demonstrated the company's ongoing commitment to tackling period poverty, which she described as a continuous mission. She linked the work directly to The Dignity Project and to helping girls experience their cycles with dignity and confidence."
      },
      {
        type: "h2",
        text: "Building on the 2025 launch"
      },
      {
        type: "p",
        text: "Yazz launched Empowered Periods on Menstrual Hygiene Day 2025 with simultaneous street awareness activations at 14 major locations in Greater Accra, where volunteers shared educational materials and free sanitary products. The campaign was designed in three phases, Awareness, Education and Engagement, bringing together community activity, digital content and product distribution, with school visits and community sessions following the launch."
      },
      {
        type: "p",
        text: "Press coverage of the 2025 campaign reported that it provided more than 6,000 young girls with menstrual hygiene kits and educational materials. In 2026 the single day activation moved beyond Greater Accra, reaching at least 19 locations across the country."
      },
      {
        type: "h2",
        text: "Into the high schools"
      },
      {
        type: "p",
        text: "Alongside the 2026 activation, Lexta announced a partnership with MX24 TV for the 2026 CroxItOut High School Tour, which takes menstrual health and wider wellbeing education into senior high schools nationwide. The conversation started on Menstrual Hygiene Day will continue in classrooms through the year."
      },
      {
        type: "p",
        text: "We believe no girl should miss an education because of a lack of basic hygiene resources. Schools, health facilities and community groups that would like to work with us on menstrual health education can reach our team through the Partner With Us page."
      }
    ],
    sources: [
      {
        name: "GhanaWeb: Menstrual health campaign reaches 19 locations across Ghana",
        url: "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/Menstrual-health-campaign-reaches-19-locations-across-Ghana-2036844"
      },
      {
        name: "MyJoyOnline: Yazz intensifies nationwide fight against period poverty with school outreach campaign",
        url: "https://www.myjoyonline.com/yazz-intensifies-nationwide-fight-against-period-poverty-with-school-outreach-campaign/"
      },
      {
        name: "Adomonline: Yazz intensifies nationwide fight against period poverty with school outreach campaign",
        url: "https://www.adomonline.com/yazz-intensifies-nationwide-fight-against-period-poverty-with-school-outreach-campaign/"
      },
      {
        name: "Ghanaian Times: Yazz Partners MX24 TV for 2026 CroxItOut High School Tour",
        url: "https://ghanaiantimes.com.gh/yazz-partners-mx24-tv-for-2026-croxitout-high-school-tour-to-advance-menstrual-health-education/"
      },
      {
        name: "Citi Newsroom: YAZZ launches Empowered Periods campaign (May 2025)",
        url: "https://www.citinewsroom.com/2025/05/yazz-launches-empowered-periods-campaign-to-support-menstrual-health-education-across-communities/"
      },
      {
        name: "Hot FM Ghana: YAZZ launches Empowered Periods campaign",
        url: "https://hotfmghana.com/yazz-launches-empowered-periods-campaign-to-support-menstrual-health-education-across-communities/"
      },
      {
        name: "MX24 TV: Yazz launches Empowered Periods campaign on World Menstrual Hygiene Day",
        url: "https://mx24online.com/croxitout/yazz-launches-empowered-periods-campaign-on-world-menstrual-hygiene-day/"
      },
      {
        name: "Graphic Online: Empowered Periods campaign boosts menstrual health education",
        url: "https://www.graphic.com.gh/entertainment/showbiz-news/empowered-periods-campaign-boosts-menstrual-health-education.html"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2026/06/28/the-empowered-periods-campaign/"
  },
  {
    slug: "yazz-partners-mx24-tv-for-the-2026-croxitout-high-school-tour",
    title: "Yazz partners MX24 TV for the 2026 CroxItOut High School Tour",
    category: "Brands",
    date: "29 May 2026",
    isoDate: "2026-05-29",
    excerpt: "Awareness, Mentorship, Action. The tour takes menstrual health, oral care and mental health education into senior high schools nationwide.",
    standfirst: "Lexta Ghana, makers of Yazz personal care products, has partnered MX24 TV on the 2026 CroxItOut High School Tour, taking health education and mentorship into senior high schools nationwide under the theme Awareness, Mentorship, Action.",
    readingMinutes: 3,
    image: "https://yazzproducts.com/wp-content/uploads/2026/09/WhatsApp-Image-2026-05-29-at-15.58.53-780x470-1.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "The partnership"
      },
      {
        type: "p",
        text: "Lexta Ghana Limited, manufacturers of Yazz personal care products, has officially partnered MX24 TV for the 2026 CroxItOut Campaign High School Tour. Yazz was named headline sponsor of the 2026 campaign."
      },
      {
        type: "p",
        text: "The tour runs under the theme “Awareness, Mentorship, Action” and the hashtag #EmpowerHer. It combines health education, mentorship sessions and product engagement, taking our advocacy directly to students in senior high schools across the country."
      },
      {
        type: "h2",
        text: "Five focus areas"
      },
      {
        type: "p",
        text: "Together with the Yazz Empowered Periods Campaign, the 2026 High School Tour focuses on five areas of young people's health:"
      },
      {
        type: "list",
        items: [
          "Breast cancer awareness",
          "Menstrual hygiene",
          "Oral health",
          "Personal hygiene",
          "Mental health"
        ]
      },
      {
        type: "p",
        text: "Each of these touches the everyday lives of students, and several connect directly with the products Lexta makes and with the education our teams have delivered in schools since 2017."
      },
      {
        type: "h2",
        text: "About CroxItOut"
      },
      {
        type: "p",
        text: "CroxItOut is a campaign by MX24 TV. It began in 2024 as a nationwide breast cancer awareness campaign for high schools, encouraging young people to set a reminder, get screened and “crox it out”. The campaign describes itself as a nationwide movement that has reached more than 20 high schools across Ghana with breast cancer education, free screenings, mentorship and a music festival. In 2025 the duo Lali X Lola released a single as part of the campaign."
      },
      {
        type: "h2",
        text: "Following Empowered Periods"
      },
      {
        type: "p",
        text: "The announcement followed Yazz's nationwide outreach on Thursday 28 May 2026, when the brand activated its annual Empowered Periods Campaign at no fewer than 19 locations in Ghana, distributing free sanitary pads and menstrual hygiene education."
      },
      {
        type: "p",
        text: "Lexta's Marketing Executive, Akosua Naana Lexis Obenewaa Opoku-Agyemang, said the May outreach demonstrated the company's ongoing commitment to tackling period poverty, and that the partnership with MX24 TV would allow the brand to take its advocacy directly into senior high schools nationwide. She connected the tour to The Dignity Project, the Yazz flagship initiative that helps adolescent girls remain in school and manage their menstrual health with dignity."
      },
      {
        type: "h2",
        text: "Why schools"
      },
      {
        type: "p",
        text: "Senior high school is when many young people form the habits that will shape their health as adults. Reaching students in their own schools, with trusted partners and practical information, is one of the most direct ways to make health education last. Schools interested in an outreach session can request one through the Lexta website."
      }
    ],
    sources: [
      {
        name: "Ghanaian Times: Yazz Partners MX24 TV for 2026 CroxItOut High School Tour",
        url: "https://ghanaiantimes.com.gh/yazz-partners-mx24-tv-for-2026-croxitout-high-school-tour-to-advance-menstrual-health-education/"
      },
      {
        name: "MyJoyOnline: Yazz intensifies nationwide fight against period poverty with school outreach campaign",
        url: "https://www.myjoyonline.com/yazz-intensifies-nationwide-fight-against-period-poverty-with-school-outreach-campaign/"
      },
      {
        name: "Adomonline: Yazz intensifies nationwide fight against period poverty with school outreach campaign",
        url: "https://www.adomonline.com/yazz-intensifies-nationwide-fight-against-period-poverty-with-school-outreach-campaign/"
      },
      {
        name: "GhanaWeb: Menstrual health campaign reaches 19 locations across Ghana",
        url: "https://www.ghanaweb.com/GhanaHomePage/NewsArchive/Menstrual-health-campaign-reaches-19-locations-across-Ghana-2036844"
      },
      {
        name: "MX24 TV: CroxItOut",
        url: "https://mx24online.com/croxitout/"
      },
      {
        name: "CroxItOut: Awareness. Mentorship. Action. #EmpowerHer",
        url: "https://croxitout.org/"
      },
      {
        name: "Citi Newsroom: MX24 TV launches Crox It Out 2024",
        url: "https://www.citinewsroom.com/2024/04/mx24-tv-launches-crox-it-out-2024-a-nationwide-breast-cancer-awareness-campaign-for-high-schools/"
      },
      {
        name: "Now Accra: Beats for the Brave, Lali X Lola",
        url: "https://nowaccra.com/2025/10/06/beats-for-the-brave-lali-x-lola-lead-ghanas-breast-cancer-awareness-movement-with-new-single/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/yazz-partners-mx24-tv-for-2026-croxitout-high-school-tour-to-advance-menstrual-health-education/"
  },
  {
    slug: "free-public-cervical-cancer-screening-with-sofpog-mwag-and-korle-bu-polyclinic",
    title: "Free public cervical cancer screening with SOFPOG, MWAG and Korle Bu Polyclinic",
    category: "Health",
    date: "February 2026",
    isoDate: "2026-01-30",
    excerpt: "Screening and education on HPV, vaccination and warning signs during Cervical Cancer Awareness Month.",
    standfirst: "During Cervical Cancer Awareness Month 2026, the Society of Family Physicians of Ghana worked with the Medical Women Association of Ghana, Yazz and the Korle Bu Polyclinic Family Medicine Department to offer free cervical cancer screening and education to the public.",
    readingMinutes: 3,
    image: "https://yazzproducts.com/wp-content/uploads/2026/02/yazz-crvical-cancer-awareness-2026.png",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "A shared effort in Awareness Month"
      },
      {
        type: "p",
        text: "January is Cervical Cancer Awareness Month. In January 2026 the Society of Family Physicians of Ghana (SOFPOG), in collaboration with the Medical Women Association of Ghana (MWAG), Yazz and the Family Medicine Department of Korle Bu Polyclinic, organised free cervical cancer screening for members of the public."
      },
      {
        type: "p",
        text: "Alongside screening, the day focused on education: what causes cervical cancer, how it can be prevented, and which signs should prompt a woman to see a health professional without delay."
      },
      {
        type: "h2",
        text: "Prevention and early detection"
      },
      {
        type: "p",
        text: "Dr Baaba Nyina Damoah of SOFPOG emphasised that cervical cancer can be prevented, and treated when it is caught early. She explained that infection with the human papillomavirus (HPV) is the main cause of the disease, and stressed the importance of regular screening by Pap smear or HPV test, because most women notice no symptoms in the early stages."
      },
      {
        type: "p",
        text: "Vaccination was another key message. Girls and young women can be protected through the HPV vaccine, which lowers their risk of developing cervical cancer later in life."
      },
      {
        type: "h2",
        text: "Warning signs not to ignore"
      },
      {
        type: "p",
        text: "Participants were reminded of warning signs that should always be checked by a health professional:"
      },
      {
        type: "list",
        items: [
          "Abnormal vaginal bleeding",
          "Bleeding after sex",
          "Unusual vaginal discharge"
        ]
      },
      {
        type: "p",
        text: "None of these signs means a woman has cancer, but each is a reason to be seen promptly rather than to wait."
      },
      {
        type: "h2",
        text: "Why it matters in Ghana"
      },
      {
        type: "p",
        text: "Cervical cancer is the second most common cancer among women in Ghana. Ghana Health Service figures cited by the Medical Women Association of Ghana show that of the 2,797 women diagnosed with the disease each year, 1,699 die. Most of those deaths are preventable through vaccination, regular screening and timely treatment."
      },
      {
        type: "p",
        text: "Free screening in a public setting removes two of the most common barriers, cost and uncertainty about where to go, and lets women speak directly with doctors who can answer their questions."
      },
      {
        type: "h2",
        text: "Our continuing commitment"
      },
      {
        type: "p",
        text: "For close to a decade, Lexta and Yazz have sponsored and supported MWAG and its partners every January in taking free screening and education to the communities that need it. Working with family physicians from SOFPOG and the Korle Bu Polyclinic means that women who are screened are seen by clinicians who can follow up on what is found."
      }
    ],
    sources: [
      {
        name: "Yazz Products: SOFPOG in collaboration with MWAG, Yazz and Korle Bu Polyclinic",
        url: "https://www.yazzproducts.com/sofpog-in-collaboration-with-mwag-yazz-and-korle-bu-polyclinic-family-medicine-department-organized-free-cervical-cancer-screening-for-the-public-as-part-of-the-cervical-cancer-awareness-month/"
      },
      {
        name: "Ghana News Agency: Ghanaian Women doctors encourage cervical cancer screening for early detection",
        url: "https://gna.org.gh/2025/01/ghanaian-women-doctors-encourage-cervical-cancer-screening-for-early-detection/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/sofpog-in-collaboration-with-mwag-yazz-and-korle-bu-polyclinic-family-medicine-department-organized-free-cervical-cancer-screening-for-the-public-as-part-of-the-cervical-cancer-awareness-month/"
  },
  {
    slug: "cervical-cancer-awareness-at-tuesday-market-park-mamprobi",
    title: "Cervical cancer awareness at Tuesday Market Park, Mamprobi",
    category: "Health",
    date: "28 January 2025",
    isoDate: "2025-01-28",
    excerpt: "Taking screening and education into the market, where the women who most need it already are.",
    standfirst: "On 28 January 2025, Yazz joined the Medical Women Association of Ghana at Tuesday Market Park in Mamprobi, taking cervical cancer education and free screening to the women who work and shop there.",
    readingMinutes: 2,
    image: "https://yazzproducts.com/wp-content/uploads/2025/03/WE6A0601-1024x683.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "Meeting women where they are"
      },
      {
        type: "p",
        text: "On 28 January 2025, Yazz hosted a cervical cancer awareness event at Tuesday Market Park in Mamprobi, Accra, as part of Cervical Cancer Awareness Month. The event formed part of the 2025 national campaign of the Medical Women Association of Ghana (MWAG), which was sponsored by Lexta Ghana Limited."
      },
      {
        type: "p",
        text: "Markets are where many women spend most of their working day. For a trader, closing a stall to attend a clinic can mean losing a day's income, so health services that come to the market remove one of the most common reasons screening is put off."
      },
      {
        type: "h2",
        text: "Education and screening on site"
      },
      {
        type: "p",
        text: "Led by MWAG's Greater Accra branch chairperson, family physician Dr Ayongo Mate-Kole, the team spoke with women at the market about cervical cancer, how it develops and why screening matters even when a woman feels perfectly well. The outreach combined that education with free screening using Visual Inspection with Acetic Acid (VIA)."
      },
      {
        type: "p",
        text: "MWAG reported that 80 women were screened at the national launch at Tuesday Market, and that five of them tested positive. For those women, finding changes early opens the way to treatment before the disease advances."
      },
      {
        type: "h2",
        text: "The case for early detection"
      },
      {
        type: "p",
        text: "Cervical cancer is the second most common cancer among women in Ghana. Ghana Health Service figures cited by the Medical Women Association of Ghana show that of the 2,797 women diagnosed with the disease each year, 1,699 die. Most of those deaths are preventable through vaccination, regular screening and timely treatment."
      },
      {
        type: "p",
        text: "The 2025 campaign theme was “We Can Prevent Cervical Cancer, Get Screened Now”. Women were encouraged to be screened at least once every three to five years and to register with the National Health Insurance Scheme to help with treatment costs."
      },
      {
        type: "h2",
        text: "Part of a wider January programme"
      },
      {
        type: "p",
        text: "The Mamprobi event was one of a series of activities that Lexta supports with MWAG and its partners each January, from awareness launches to community screening days and hospital based screening in different regions. Bringing that work into a busy market is a reminder that the most effective health messages are the ones delivered where people already are."
      }
    ],
    sources: [
      {
        name: "Yazz Products: Cervical cancer awareness event, Tuesday Market Park, Mamprobi",
        url: "https://www.yazzproducts.com/we-hosted-the-cervical-cancer-awareness-event-on-28th-january-2025-at-the-tuesday-market-park-mamprobi/"
      },
      {
        name: "Ghana News Agency: Ghanaian Women doctors encourage cervical cancer screening for early detection",
        url: "https://gna.org.gh/2025/01/ghanaian-women-doctors-encourage-cervical-cancer-screening-for-early-detection/"
      },
      {
        name: "Medical Women's International Association: Report June 2025, Ghana",
        url: "https://mwia.net/2025/07/02/report-june-2025-gh/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/we-hosted-the-cervical-cancer-awareness-event-on-28th-january-2025-at-the-tuesday-market-park-mamprobi/"
  },
  {
    slug: "ghanaian-women-doctors-encourage-screening-for-early-detection",
    title: "Ghanaian women doctors encourage screening for early detection",
    category: "Health",
    date: "April 2025",
    isoDate: "2025-04",
    excerpt: "MWAG's Cervical Cancer Awareness Month launch in Ablekuma South, sponsored by Lexta, under the theme We Can Prevent Cervical Cancer, Get Screened Now.",
    standfirst: "The Medical Women Association of Ghana launched Cervical Cancer Awareness Month 2025 in Ablekuma South with a call for every woman to get screened early, in a campaign sponsored by Lexta Ghana.",
    readingMinutes: 3,
    image: "https://yazzproducts.com/wp-content/uploads/2025/04/130202594139-vaqdtgfssn-health-cervical-cancer1.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "A launch with a clear message"
      },
      {
        type: "p",
        text: "The Medical Women Association of Ghana (MWAG) launched its 2025 Cervical Cancer Awareness Month campaign in the Ablekuma South constituency of Accra, in collaboration with the Ablekuma South Sub Metro Health Directorate and with sponsorship from Lexta Ghana Limited."
      },
      {
        type: "p",
        text: "The launch ran under the theme “We Can Prevent Cervical Cancer, Get Screened Now”, a call for women to make screening a regular part of their health care rather than waiting for symptoms."
      },
      {
        type: "h2",
        text: "Why screening comes first"
      },
      {
        type: "p",
        text: "Cervical cancer rarely shows signs in its early stages. By the time symptoms appear, the disease may be more advanced and harder to treat. Screening finds changes in the cervix early, when treatment is most effective, and the campaign encouraged women to be screened at least once every three to five years."
      },
      {
        type: "p",
        text: "Cervical cancer is the second most common cancer among women in Ghana. Ghana Health Service figures cited by the Medical Women Association of Ghana show that of the 2,797 women diagnosed with the disease each year, 1,699 die. Most of those deaths are preventable through vaccination, regular screening and timely treatment."
      },
      {
        type: "h2",
        text: "Taking screening to the market"
      },
      {
        type: "p",
        text: "Dr Ayongo Mate-Kole, a family physician at Korle-Bu Polyclinic and Chairperson of MWAG's Greater Accra branch, led the team's engagement with women at Tuesday Market in Ablekuma South. The outreach was designed both to educate the women and to screen them for prevention."
      },
      {
        type: "p",
        text: "The team planned free screening for 100 women using Visual Inspection with Acetic Acid (VIA), a simple method well suited to community settings. In its later report on the campaign, MWAG recorded that 80 women were screened at the launch, five of whom tested positive and could be guided towards further care."
      },
      {
        type: "h2",
        text: "Support from local leadership"
      },
      {
        type: "p",
        text: "The Member of Parliament for Ablekuma South, Dr Alfred Oko Vanderpuije, commended MWAG and its partners for the initiative to help reduce cervical cancer deaths among women. He encouraged participants to share the message with others and advised women to register with the National Health Insurance Scheme to help with the cost of treatment."
      },
      {
        type: "h2",
        text: "A long partnership"
      },
      {
        type: "p",
        text: "Lexta and its Yazz brand have supported MWAG's cervical cancer work for close to a decade, sponsoring awareness launches and free screening in communities across Ghana each January. MWAG's own report on the 2025 campaign noted that Lexta's sponsorship enabled many women to access screening at no cost."
      }
    ],
    sources: [
      {
        name: "Ghana News Agency: Ghanaian Women doctors encourage cervical cancer screening for early detection",
        url: "https://gna.org.gh/2025/01/ghanaian-women-doctors-encourage-cervical-cancer-screening-for-early-detection/"
      },
      {
        name: "BusinessGhana: Ghanaian Women doctors encourage cervical cancer screening for early detection",
        url: "http://www.businessghana.com/site/news/general/322225/Ghanaian-Women-doctors-encourage-cervical-cancer-screening-for-early-detection"
      },
      {
        name: "Medical Women's International Association: Report June 2025, Ghana",
        url: "https://mwia.net/2025/07/02/report-june-2025-gh/"
      },
      {
        name: "Yazz Products: Ghanaian women doctors sponsored by Lexta Ghana encourage cervical cancer screening",
        url: "https://www.yazzproducts.com/ghanaian-women-doctors-sponsored-by-lexta-ghana-encourage-cervical-cancer-screening-for-early-detection/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/ghanaian-women-doctors-sponsored-by-lexta-ghana-encourage-cervical-cancer-screening-for-early-detection/"
  },
  {
    slug: "cervical-cancer-awareness-launch-2024-tamale",
    title: "Cervical Cancer Awareness Launch 2024, Tamale",
    category: "Health",
    date: "January 2024",
    isoDate: "2024-01-20",
    excerpt: "The first national launch held in the northern sector, at the forecourt of Tamale Teaching Hospital, followed by free screening at the gynaecology clinic.",
    standfirst: "In January 2024 the national launch of Cervical Cancer Awareness Month was held in the northern sector for the first time, at the forecourt of Tamale Teaching Hospital, with Lexta Ghana as sponsor.",
    readingMinutes: 2,
    image: "https://yazzproducts.com/wp-content/uploads/2024/02/WhatsApp-Image-2024-01-16-at-21.50.17-1021x1024.jpeg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "A first for the north"
      },
      {
        type: "p",
        text: "On 20 January 2024 the Medical Women Association of Ghana (MWAG) held its Cervical Cancer Awareness Month launch at the forecourt of Tamale Teaching Hospital. It was the first time the national launch had been held in the northern sector. Lexta Ghana Limited, producers of Yazz products, sponsored the event."
      },
      {
        type: "h2",
        text: "Who took part"
      },
      {
        type: "p",
        text: "The Medical Director of Tamale Teaching Hospital chaired the occasion. Also present were the Deputy Northern Regional Director of Public Health of the Ghana Health Service, the National President of MWAG and representatives of Lexta Ghana."
      },
      {
        type: "p",
        text: "The audience reflected the communities the campaign sets out to reach: MWAG members, school children from three second cycle schools in Tamale, women's groups, young hairdressing and tailoring apprentices, and members of the public."
      },
      {
        type: "h2",
        text: "From awareness to screening"
      },
      {
        type: "p",
        text: "The second part of the programme was free cervical cancer screening at the hospital's gynaecology clinic. The launch gave momentum to the plans of MWAG's Northern sector for the rest of the month, with a goal of screening 150 women by the end of January."
      },
      {
        type: "h2",
        text: "Why the location mattered"
      },
      {
        type: "p",
        text: "Bringing the national launch to Tamale meant that the attention, the education and the free screening that come with it reached women in the northern sector directly. Including students and young apprentices in the audience means awareness starts early, long before many of them will be due for their first screening."
      },
      {
        type: "p",
        text: "Cervical cancer is the second most common cancer among women in Ghana. Ghana Health Service figures cited by the Medical Women Association of Ghana show that of the 2,797 women diagnosed with the disease each year, 1,699 die. Most of those deaths are preventable through vaccination, regular screening and timely treatment."
      },
      {
        type: "h2",
        text: "A partnership since 2015"
      },
      {
        type: "p",
        text: "MWAG has carried out cervical cancer sensitisation and screening with support from Lexta Ghana since 2015. Each January the partnership takes the campaign to a different set of communities, working alongside hospitals and regional health services to make free screening available where it is needed."
      }
    ],
    sources: [
      {
        name: "Yazz Products: Cervical Cancer Awareness Launch, 2024 Tamale",
        url: "https://www.yazzproducts.com/cervical-cancer-awareness-launch-2024-tamale/"
      },
      {
        name: "Business & Financial Times: MWAG, Yazz conduct free cervical cancer screening nation-wide",
        url: "https://thebftonline.com/2023/01/28/mwag-yazz-conduct-free-cervical-cancer-screening-nation-wide/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/cervical-cancer-awareness-launch-2024-tamale/"
  },
  {
    slug: "yazz-partners-the-ges-cook-art-competition",
    title: "Yazz partners the GES Cook Art Competition",
    category: "Partnerships",
    date: "11 February 2020",
    isoDate: "2020-02-11",
    excerpt: "The second edition of the Ghana Education Service schools contest promoting Home Economics. Ashaiman Senior High School took the title.",
    standfirst: "Lexta Ghana Limited, producers of the Yazz range, launched the second edition of the Cook Art Schools Competition in Accra, an annual Ghana Education Service contest that promotes Home Economics in senior high schools.",
    readingMinutes: 2,
    image: "https://yazzproducts.com/wp-content/uploads/2020/02/WhatsApp-Image-2020-02-11-at-11.57.18-AM.jpeg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "Supporting Home Economics in schools"
      },
      {
        type: "p",
        text: "In February 2020, Lexta Ghana Limited, producers of the Yazz range of products, launched the second edition of the Cook Art Schools Competition in Accra. The competition is an annual cooking contest organised by the Ghana Education Service (GES) to promote Home Economics in second cycle schools."
      },
      {
        type: "p",
        text: "Onga food seasonings, part of the Promasidor Group, was the lead sponsor, with Yazz home tissues from Lexta Ghana as a supporting sponsor."
      },
      {
        type: "h2",
        text: "How the competition works"
      },
      {
        type: "p",
        text: "The competition tours the country in regional rounds. Two students are selected from each of the 16 regions to compete in the national final in Accra, giving Home Economics students from every part of Ghana a stage for their skills."
      },
      {
        type: "h2",
        text: "Ashaiman takes Greater Accra"
      },
      {
        type: "p",
        text: "In the Greater Accra round, hosted by Accra Girls SHS, seven senior high schools competed. Schools were judged on cleanliness, cooking tools, the taste of the meal and Home Science theory questions."
      },
      {
        type: "p",
        text: "After more than three hours of keenly contested cooking, Ashaiman Senior High School took the title, with West Africa SHS in second place. The winning school received hampers of company products and a refurbishment of its Home Science department, and both schools earned the opportunity to represent Greater Accra in the national competition."
      },
      {
        type: "h2",
        text: "Why we support it"
      },
      {
        type: "p",
        text: "Home Economics teaches practical skills in food, nutrition, hygiene and household management that young people carry into adult life, and for some into careers in catering and hospitality. As a maker of household essentials, Lexta sees the competition as a natural fit: it rewards the cleanliness, care and preparation that good home care depends on."
      },
      {
        type: "p",
        text: "Our support for the Cook Art Competition is part of our commitment to Sustainable Development Goal 4, quality education, alongside our health and hygiene work in schools."
      }
    ],
    sources: [
      {
        name: "Yazz Products: News listing (Yazz Partners GES' Cook Art Competition)",
        url: "https://www.yazzproducts.com/category/news/"
      },
      {
        name: "Ghanaian Times: Ashaiman SHS wins Onga Cook Art competition",
        url: "https://ghanaiantimes.com.gh/ashaiman-shs-wins-onga-cook-art-competition/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/yazz-partners-ges-cook-art-competition-2/"
  },
  {
    slug: "free-cervical-cancer-screening-and-education-in-kumasi",
    title: "Free cervical cancer screening and education in Kumasi",
    category: "Health",
    date: "January 2020",
    isoDate: "2020-01",
    excerpt: "Education and free screening in Kumasi, ahead of the Accra edition at Accra Psychiatric Hospital.",
    standfirst: "In January 2020, Lexta Ghana and the Medical Women Association of Ghana took cervical cancer education and free screening to Kumasi, ahead of the Accra edition at Accra Psychiatric Hospital.",
    readingMinutes: 2,
    image: "https://yazzproducts.com/wp-content/uploads/2026/05/WhatsApp-Image-2020-01-19-at-8.42.06-AM-1080x675-1-1024x640.jpeg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "Awareness Month in the Ashanti Region"
      },
      {
        type: "p",
        text: "As part of Cervical Cancer Awareness Month in January 2020, Lexta Ghana Limited, producers of Yazz products, worked with the Medical Women Association of Ghana (MWAG) to bring cervical cancer education and free screening to women in Kumasi."
      },
      {
        type: "p",
        text: "The Kumasi programme combined the two elements that run through all of our cervical cancer work: education, so that women understand the disease and why screening matters, and free screening carried out by medical professionals who can act on the results."
      },
      {
        type: "h2",
        text: "On to Accra"
      },
      {
        type: "p",
        text: "Kumasi was followed by Accra, where Lexta and MWAG conducted cervical cancer screening for hundreds of women at Accra Psychiatric Hospital later that month."
      },
      {
        type: "p",
        text: "Speaking at the time, Lexta's Head of Logistics and Operations, Kingsley Adjei Mensah, noted that over the previous five years the company and MWAG had educated women and carried out several screenings together. He said the team would continue to other regions, with Cape Coast next, until all 16 regions of the country had been covered."
      },
      {
        type: "h2",
        text: "Why we keep coming back"
      },
      {
        type: "p",
        text: "Cervical cancer is preventable, and treatable when found early, but it often causes no symptoms in its early stages. Regular screening is the most reliable way to find changes before they become serious, and free screening removes the cost that keeps many women from being checked."
      },
      {
        type: "p",
        text: "Cervical cancer is the second most common cancer among women in Ghana. Ghana Health Service figures cited by the Medical Women Association of Ghana show that of the 2,797 women diagnosed with the disease each year, 1,699 die. Most of those deaths are preventable through vaccination, regular screening and timely treatment."
      },
      {
        type: "h2",
        text: "Part of a national effort"
      },
      {
        type: "p",
        text: "Kumasi 2020 was one stop in a programme that has since reached communities from Accra to Tamale. Every January, Lexta and Yazz sponsor and support MWAG and partner institutions in taking free screening and education directly to the women who need it."
      }
    ],
    sources: [
      {
        name: "Yazz Products: Free cervical cancer screening and education in Kumasi",
        url: "https://yazzproducts.com/free-cervical-cancer-screening-and-education-on-cervical-cancer-that-happened-in-kumasi/"
      },
      {
        name: "Yazz Products: LEXTA Ghana conducted cervical cancer screening at Accra Psychiatric Hospital",
        url: "https://www.yazzproducts.com/lexta-ghana-conducted-cervical-cancer-screening-at-accra-psychiatric-hospital/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://yazzproducts.com/free-cervical-cancer-screening-and-education-on-cervical-cancer-that-happened-in-kumasi-copy-copy/"
  },
  {
    slug: "international-womens-day-with-the-girls-of-unity-high-jhs-kotobabi",
    title: "International Women's Day with the girls of Unity High JHS, Kotobabi",
    category: "CSR",
    date: "8 March 2019",
    isoDate: "2019-03-08",
    excerpt: "With the Domite Foundation, our team took students through basic hygiene routines and distributed Yazz towels and learning materials.",
    standfirst: "To mark International Women's Day 2019, Lexta Ghana Limited and the Domite Foundation spent the day with the girls of Unity High JHS in Kotobabi, Accra, talking about hygiene and the value of their education.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/Lexta-Ghana-Limited-spent-time-with-the-girls-of-Unity-high-JHS-in-Kotobabi-in-commemoration-of-the-internal-womens-day.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "A day with the girls"
      },
      {
        type: "p",
        text: "On 8 March 2019, International Women's Day, a team from Lexta Ghana Limited visited Unity High Junior High School in Kotobabi, Accra, in collaboration with the Domite Foundation."
      },
      {
        type: "p",
        text: "The team took the girls through basic hygiene routines and encouraged them to stay focused on their studies. Yazz sanitary towels and free learning materials were distributed to support the wellbeing and education of the girl child."
      },
      {
        type: "h2",
        text: "Why junior high matters"
      },
      {
        type: "p",
        text: "The junior high years are when many girls begin to menstruate. Having the right information and products at that moment shapes how confidently a girl manages her period, and whether it disrupts her schooling. Practical, open conversations about hygiene help girls treat menstruation as a normal part of life rather than a reason to stay at home."
      },
      {
        type: "p",
        text: "Pairing sanitary products with learning materials reflects a simple idea that guides our work in schools: hygiene and education go together, and a girl who is comfortable and confident is better placed to learn."
      },
      {
        type: "h2",
        text: "Part of a longer commitment"
      },
      {
        type: "p",
        text: "The visit was one of many school sessions that Lexta and Yazz have carried out since our first CSR programme began in 2017. Today The Dignity Project and the annual Empowered Periods Campaign build on visits like this one, combining free products with health education and a sustained presence in schools."
      },
      {
        type: "p",
        text: "Schools and institutions can request a Lexta or Yazz outreach session on menstrual health, oral care, cervical cancer awareness or general hygiene through our website."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2019/03/08/lexta-ghana-limited-spent-time-with-the-girls-of-unity-high-jhs-in-kotobabi-in-commemoration-of-the-internal-womens-day/"
  },
  {
    slug: "lexta-ghana-visits-mawuko-girls-shs-ho",
    title: "Lexta Ghana visits Mawuko Girls SHS, Ho",
    category: "CSR",
    date: "4 February 2019",
    isoDate: "2019-02-04",
    excerpt: "With MWAG, led by Dr. Naa Sodzi Tettey, educating students on cervical cancer and femcare as part of a national school tour.",
    standfirst: "Alongside the Medical Women Association of Ghana, a Lexta Ghana team visited Mawuko Girls Senior High School in Ho to educate students on cervical cancer and femcare as part of a national school tour.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/Lexta-Ghana-Limited-Visits-Mawuko-girls-SHS-Ho.jpeg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "The visit"
      },
      {
        type: "p",
        text: "In February 2019, Lexta Ghana Limited, makers of Yazz products and Hooch cereals, joined the Medical Women Association of Ghana (MWAG) on a visit to Mawuko Girls Senior High School in Ho, in the Volta Region."
      },
      {
        type: "p",
        text: "The visit was led by Dr Naa Sodzi Tettey, immediate past President of MWAG, and Mr Seth Ntiamoah-Asare Jnr, Head of Sales and Marketing at Lexta. It formed part of a national school tour to educate Ghanaians, especially women and girls, about cervical cancer and femcare."
      },
      {
        type: "h2",
        text: "Prevention and screening"
      },
      {
        type: "p",
        text: "The session focused on prevention and on the importance of periodic screening. Cervical cancer develops slowly and often without symptoms, so the most powerful tools against it are knowledge, vaccination and regular checks once a woman reaches screening age."
      },
      {
        type: "p",
        text: "Speaking to students in secondary school means that young women learn these facts years before they need them, and can share them with mothers, aunts and friends at home."
      },
      {
        type: "h2",
        text: "Femcare in the classroom"
      },
      {
        type: "p",
        text: "The femcare part of the session covered menstrual hygiene and personal care, giving students practical guidance on looking after their health with confidence during adolescence."
      },
      {
        type: "h2",
        text: "Supporting students"
      },
      {
        type: "p",
        text: "As part of Lexta's corporate social responsibility, products and learning materials were distributed to the students at the end of the session."
      },
      {
        type: "h2",
        text: "A long partnership"
      },
      {
        type: "p",
        text: "The Mawuko visit is one chapter in a partnership with MWAG that has continued for close to a decade, from school tours like this one to the free community screening that Lexta and Yazz sponsor every January during Cervical Cancer Awareness Month."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Lexta Ghana Limited visits Mawuko Girls SHS, Ho",
        url: "https://lextagh.com/2019/02/04/lexta-ghana-limited-visits-mawuko-girls-shs-ho/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2019/02/04/lexta-ghana-limited-visits-mawuko-girls-shs-ho/"
  },
  {
    slug: "the-lexta-teen-care-campaign-launches",
    title: "The Lexta Teen Care Campaign launches",
    category: "Company",
    date: "30 May 2017",
    isoDate: "2017-05-30",
    excerpt: "Our original CSR programme, teaching senior high school students to build good personal care habits during adolescence.",
    standfirst: "The Lexta Teen Care Campaign, our first corporate social responsibility programme, teaches senior high school students to build good personal care and hygiene habits during adolescence.",
    readingMinutes: 2,
    image: "https://lextagh.com/wp-content/uploads/2026/06/Lexta-Teen-Care-Campaign.jpg",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "h2",
        text: "Where it began"
      },
      {
        type: "p",
        text: "Launched in 2017, the Lexta Teen Care Campaign is our original CSR programme and the foundation that everything since has been built on. Its aim is to teach senior high school students how to build good personal care and hygiene habits during adolescence, a crucial phase in their development."
      },
      {
        type: "p",
        text: "Adolescence is when young people start taking charge of their own health. The habits formed in these years, good and bad, tend to last, which makes senior high school the right place to start."
      },
      {
        type: "h2",
        text: "What the campaign covers"
      },
      {
        type: "p",
        text: "The campaign brings together the health topics where Lexta's products and partnerships give us something useful to offer:"
      },
      {
        type: "list",
        items: [
          "Cervical cancer awareness and the importance of screening",
          "Menstrual hygiene",
          "Oral care",
          "School sanitation, through clean up competitions run with schools to improve their own campuses"
        ]
      },
      {
        type: "h2",
        text: "Why these topics"
      },
      {
        type: "p",
        text: "Each of these issues is preventable, and each begins with education. Cervical cancer is the leading cause of cancer death for women in 40 of the 48 countries of sub Saharan Africa. Across the world, between 60 and 90 percent of school children have dental cavities. Poor sanitation drives cholera, diarrhoea, dysentery, hepatitis A and typhoid."
      },
      {
        type: "p",
        text: "Giving students accurate information, in their own schools and in language they relate to, is one of the most effective ways to change those outcomes."
      },
      {
        type: "h2",
        text: "In the classroom"
      },
      {
        type: "p",
        text: "At St. Mary's Senior High School, one of the schools visited under the campaign, Lexta's Head of HR and Administration addressed staff and students, and students took part in a presentation on cervical cancer and menstrual hygiene."
      },
      {
        type: "h2",
        text: "The foundation for what followed"
      },
      {
        type: "p",
        text: "Teen Care set the pattern for the CSR work that came after it: go where the need is, work alongside people who know the subject, and connect what we teach with what we make. Our school tours with the Medical Women Association of Ghana, The Dignity Project and the Empowered Periods Campaign all grew from the ground the Teen Care Campaign first prepared."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Lexta Teen Care Campaign, St. Mary's SHS",
        url: "https://www.lextagh.com/lexta-teen-care-campaign-st-marys-shs/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility page (website prototype)",
        url: "https://lextagh.vercel.app/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2017/05/30/lexta-teen-care-campaign/"
  }
];
