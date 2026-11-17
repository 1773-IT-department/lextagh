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
 * - image: the story photo, a local file under /assets (never a link to Lexta's old websites). imageAlt describes it.
 * - draft: true shows the note that the story is an interim summary of public coverage. When Lexta sends its
 *   official text, replace standfirst, body and sources, then set draft to false.
 * - body: blocks of type p (paragraph), h2 (subheading), quote (pull quote, text plus optional cite)
 *   and list (bullet points, items plus optional intro).
 *
 * Copy rules: no em dashes, en dashes or spaced hyphens. Never invent facts, quotes or photos.
 *
 * Held stories: stories listed in held.ts stay in this file but are not shown anywhere until Lexta approves them.
 */

import { isLiveStory } from "./held";

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

/** Every story, including those held back (see held.ts). Pages use `articles`, the live ones only. */
export const allArticles: Article[] = [
  {
    slug: "the-bright-smiles-school-tour",
    title: "The Bright Smiles School Tour",
    category: "CSR",
    date: "15 July 2026",
    isoDate: "2026-07-15",
    excerpt: "The Bright Smiles School Tour proposes age-appropriate oral-hygiene education and partnerships with qualified dental professionals and schools.",
    standfirst: "Healthy smiles begin with everyday habits. The Bright Smiles School Tour proposes age-appropriate oral-hygiene education and partnerships with qualified dental professionals and schools.",
    readingMinutes: 1,
    image: "/assets/original/web/lexta-kakel-1897-scaled.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "Bright Smiles School Tour: Oral Hygiene Education, Empowerment and Academic support, with Oral Care (Yazz Toothpaste / Toothbrushes)."
      },
      {
        type: "p",
        text: "Oral Care (Paste & Brush), SDG 3: Good Health."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    excerpt: "For every jumbo pack sold, Yazz Diapers/Wipes funds the construction/maintenance of mechanised boreholes in communities facing water scarcity to ensure safe hygiene for infants.",
    standfirst: "Good baby hygiene begins with information and access. Safe Bottoms is designed to support caregiver education, responsible diaper and wipe disposal and community hygiene partnerships.",
    readingMinutes: 1,
    image: "/assets/original/web/lexta-kakel-1875-683x1024.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "For every jumbo pack sold, Yazz Diapers/Wipes funds the construction/maintenance of mechanised boreholes in communities facing water scarcity to ensure safe hygiene for infants."
      },
      {
        type: "p",
        text: "Safe Bottoms Initiative: safe drinking water initiative for communities and today's child; Baby Care products (Yazz / Linzzy)."
      },
      {
        type: "p",
        text: "Baby Care (Diapers & Wipes), SDG 6: Clean Water & Sanitation."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    excerpt: "Commitment to plant 10 indigenous trees for every 1,000 rolls of 100% Virgin Pulp tissue sold, restoring degraded forest reserves.",
    standfirst: "Care for our homes should go hand in hand with care for the environment. The Lexta Forest Project is a proposed tree-planting and environmental-education platform linking everyday paper use with responsible stewardship.",
    readingMinutes: 1,
    image: "/assets/original/web/lexta-lexta-teen-care-campaign.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "Commitment to plant 10 indigenous trees for every 1,000 rolls of 100% Virgin Pulp tissue sold, restoring degraded forest reserves in the Ashanti and Eastern regions."
      },
      {
        type: "p",
        text: "Yazz Forest Project: Plant a tree today; Yazz tissues."
      },
      {
        type: "p",
        text: "Paper & Hygiene (Tissue/Napkins), SDG 15: Life on Land."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    excerpt: "This proposed programme focuses on practical hygiene education, responsible packaging disposal and community clean-up partnerships.",
    standfirst: "Clean homes and a cleaner environment belong together. This proposed programme focuses on practical hygiene education, responsible packaging disposal and community clean-up partnerships.",
    readingMinutes: 1,
    image: "/assets/original/web/lexta-kakel-1845-1024x683.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "Clean Hands, Green Land: clean home, safe environment initiative for communities and today's leaders; Yazz Detergents."
      },
      {
        type: "p",
        text: "Home Care (Washing Powder/Detergents), SDG 12: Responsible Consumption."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/yazz-whatsapp-image-2026-05-29-at-15-58-53-780x470-1.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/yazz-yazz-crvical-cancer-awareness-2026.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/yazz-we6a0601-1024x683.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/yazz-130202594139-vaqdtgfssn-health-cervical-cancer1.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/yazz-whatsapp-image-2024-01-16-at-21-50-17-1021x1024.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/placeholder-ges-cook-art.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    image: "/assets/original/web/yazz-whatsapp-image-2020-01-19-at-8-42-06-am-1080x675-1-1024x640.webp",
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
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    excerpt: "Yazz in collaboration with Domite Foundation stormed the school with Yazz sanitary towels and free learning materials.",
    standfirst: "The team spent time with the girls of Unity High JHS in Kotobabi in commemoration of the International Women's Day.",
    readingMinutes: 2,
    image: "/assets/original/web/lexta-lexta-ghana-limited-spent-time-with-the-girls-of-unity-high-jhs-in-kot.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "The team spent time with the girls of Unity High JHS in Kotobabi in commemoration of the International Women's Day. The pupils were taken through basic female hygiene routines, the need to focus on their studies and charged to persevere in all they do. Yazz in collaboration with Domite Foundation stormed the school with Yazz sanitary towels and free learning materials to enhance the learning and the well being of the girl child. We salute all women on this special day."
      },
      {
        type: "p",
        text: "Speaking to the media, the head of Sales and Marketing for Lexta Ghana Limited, Mr. Seth Ntiamoah-Asare Jnr mentioned the need to help position women at higher levels of the society. He stressed on the fact that women who have had the opportunity to steer affairs in key organisations have done so to perfection. Considering the impact, the world would be a greater place if our mothers, wives, sisters and daughters have the space most men had and abused it. He however challenged the up and coming ones to push their way into strategic positions through higher learning and decency."
      },
      {
        type: "p",
        text: "Present at the event were the teachers and non teaching staff of Unity JHS, the executive director of Domite Foundation, the Key Account Manager for Modern Trade and Hooch Foods, Mr Osei Kwame Daniel, and Priscilla, the second director for Domite Foundation."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    excerpt: "To educate on cervical cancer and Femcare as part of the national tour to schools and other institutions.",
    standfirst: "Lexta Ghana Limited, in collaboration with the Medical Women Association of Ghana (MWAG), paid a visit to Mawuko Girls SHS, Ho to educate on cervical cancer and Femcare.",
    readingMinutes: 1,
    image: "/assets/original/web/lexta-lexta-ghana-limited-visits-mawuko-girls-shs-ho.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "Lexta Ghana Limited, producers and distributors of Yazz range of products and Hooch cereals, in collaboration with the Medical Women Association of Ghana (MWAG), led by the immediate past President of MWAG Dr. Naa Sodzi Tettey and the head of Sales & Marketing of Lexta, Mr. Seth Ntiamoah-Asare Jnr, paid a visit to Mawuko Girls SHS, Ho to educate on cervical cancer and Femcare as part of the national tour to schools and other institutions to educate Ghanaians, especially women and girls, on the deadly cervical cancer disease."
      },
      {
        type: "p",
        text: "The interaction stressed on prevention and the need to screen periodically to eradicate this killer disease. Some products and learning materials were also given out as part of the company's CSR."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Lexta Ghana Limited visits Mawuko Girls SHS, Ho",
        url: "https://lextagh.com/2019/02/04/lexta-ghana-limited-visits-mawuko-girls-shs-ho/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
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
    excerpt: "The Lexta Teen Care Campaign aims at teaching students in Senior High Schools (SHS) how to properly cultivate good personal care and general hygiene habits.",
    standfirst: "The Campaign which was launched in February 2017 is set to educate SHS students across the country on cervical cancer, menstrual hygiene and oral care.",
    readingMinutes: 3,
    image: "/assets/original/web/lexta-lexta-teen-care-campaign.webp",
    imageAlt: "Image from the original story",
    featured: false,
    draft: true,
    body: [
      {
        type: "p",
        text: "As our flagship CSR project, the Lexta Teen Care Campaign aims at teaching students in Senior High Schools (SHS) how to properly cultivate good personal care and general hygiene habits in their adolescent years, a crucial phase in their development."
      },
      {
        type: "p",
        text: "Keeping clean is an important part of staying healthy and safe from diseases and infections. In the adolescent stage, cleanliness cannot be overemphasized owing to the numerous changes that occur as one begins adulthood."
      },
      {
        type: "p",
        text: "As a Company that cares, Lexta believes there is the need for more education on the importance of personal hygiene for adolescence and this led to the birth of the Lexta Teen Care Campaign."
      },
      {
        type: "p",
        text: "The Campaign which was launched in February 2017 is set to educate SHS students across the country on cervical cancer, menstrual hygiene and oral care. A number of clean-up competitions will be executed to keep our school environments neat and tidy."
      },
      {
        type: "h2",
        text: "Cervical Cancer"
      },
      {
        type: "p",
        text: "Available statistics indicate that it is the leading cause of cancer death for women in 40 of the 48 countries of sub-Saharan Africa. It affects younger age groups as a result of early sexual activity, multiple sexual partners, and exposure to other sexually transmitted infections such as HIV. Thus, educating Ghanaian teenagers, both boys and girls, on the dangers of cervical cancer would serve as a preventive measure aimed at reducing the infection rate of the disease in the country."
      },
      {
        type: "h2",
        text: "Menstrual Hygiene"
      },
      {
        type: "p",
        text: "According to WASH United (2014), the majority of the female population who are of reproductive age in Africa do not have access to clean and safe sanitary products or a clean and private space to change their menstrual cloths or pads. Poor protection and inadequate washing facilities may increase susceptibility to infection of their reproductive tract, with the odour of menstrual blood putting girls at risk of being stigmatized. The education on menstrual hygiene is our contribution to raising awareness about the importance of practicing good menstrual hygiene."
      },
      {
        type: "h2",
        text: "Oral Care"
      },
      {
        type: "p",
        text: "The World Health Organization (WHO) describes oral health as a key indicator of overall health due to its systemic and reciprocal links with general health. The mouth which is made up of the teeth, masticatory muscles, tongue, mucosal soft tissues, and salivary glands, is the body's main portal for nutrition. It is regarded as the starting point of the body's defense system and immunity thus, when oral health is compromised by disease or injury, general health suffers. A 2012 FDI Report indicated that across the world, 60 to 90% of school children and nearly 100% of adults have dental cavities. Being a producer of oral care products, we recognize the health and social benefits of practicing good oral hygiene which is what necessitated this component under the Lexta Teen Care Campaign."
      },
      {
        type: "h2",
        text: "Clean-up competitions"
      },
      {
        type: "p",
        text: "Poor sanitation affects public health and as a nation battling with issues of sanitation, we found it imperative to collaborate with schools by participating in their weekly and/or monthly inspections as a means of drumming home the importance of keeping their surroundings clean which goes a long way to reduce the incidence of sanitation-related diseases such as cholera, diarrhoea, dysentery, hepatitis A and typhoid."
      }
    ],
    sources: [
      {
        name: "Lexta Ghana: Lexta Teen Care Campaign",
        url: "https://lextagh.com/2017/05/30/lexta-teen-care-campaign/"
      },
      {
        name: "Lexta Ghana: Corporate Social Responsibility",
        url: "/corporate-social-responsibility"
      }
    ],
    originalUrl: "https://lextagh.com/2017/05/30/lexta-teen-care-campaign/"
  }
];

/** The stories the site shows, lists and builds pages for: every story except those held back in held.ts. */
export const articles: Article[] = allArticles.filter((a) => isLiveStory(a.slug));
