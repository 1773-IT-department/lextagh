/**
 * Linzzy Tips & Advice. Static content in the repo: 1773 adds or edits articles on request (there is no staff news
 * CMS, by contract). To add one, add an entry to ARTICLES; it appears on /tips, in its category and at /tips/<slug>.
 *
 * Source: Lexta's "Linzzy Website Content.docx" (Google Drive, Linzzy Tab Content; docs/content/linzzy/tips-and-advice):
 * the six Feminine Care Edition articles and the six Baby Diapers & Baby Wipes articles, word for word apart from
 * dashes. Lexta gave no dates, so none are shown. Each article's own category is its topic label. Photos: Lexta's
 * AI-made Linzzy nursery images (Drive, "LINZZY ARTICLES") and lifestyle artwork from the original linzzyproducts.com;
 * the two articles without a fitting photo show a marked placeholder (CONTENT-NEEDED.md).
 *
 * Body format, one block per blank line:  "## Heading"  |  "### Subheading"  |  "- list item" lines  |
 * "1. numbered" lines  |  "> **Label**" then "> text" (a tip box)  |  anything else is a paragraph.
 */

export const CATEGORIES = [
  {
    slug: "feminine-care",
    label: "Feminine Care",
    title: "Linzzy Tips Just for You: Feminine Care & Wellness",
    tagline: "Your Comfort. Your Confidence. Your Everyday Care.",
    blurb: "Practical guidance on menstrual hygiene, choosing sanitary towels, panty liners, period care in warm weather and understanding your cycle.",
  },
  {
    slug: "baby-care",
    label: "Baby Care",
    title: "Baby Diapers & Baby Wipes",
    tagline: "Little Moments, Loving Care, Bright Beginnings.",
    blurb: "An educational and supportive space for parents, caregivers and growing families: practical baby care guidance, everyday hygiene tips, diapering advice and helpful parenting routines.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const isCategory = (v: string | undefined): v is CategorySlug => CATEGORIES.some((c) => c.slug === v);
export const categoryOf = (slug: CategorySlug) => CATEGORIES.find((c) => c.slug === slug)!;

export type Article = {
  slug: string;
  title: string;
  lede: string;
  category: CategorySlug;
  /** The article's own category in Lexta's document, shown as its topic label. */
  topic: string;
  readMinutes: number;
  /** A photo, or null for a marked placeholder. */
  image: { src: string; alt: string } | null;
  imageNeeded?: string;
  /** The article's closing line ("Linzzy Says"). */
  says: string | null;
  /** The "Community Corner" question that ends each article. */
  community: string | null;
  body: string;
};

/** Lexta's notices, shown under the articles of each category. */
export const NOTICES: Record<CategorySlug, { title: string; text: string }> = {
  "feminine-care": {
    title: "Editorial safety notice",
    text: "These articles provide general menstrual health education and are not a substitute for professional medical diagnosis or treatment.",
  },
  "baby-care": {
    title: "Important Baby Care Notice",
    text: "The information shared in Linzzy Tips & Advice is intended for general educational and awareness purposes only. It does not constitute medical advice, diagnosis or treatment. Every baby's needs and skin sensitivities may differ. Parents and caregivers should consult a qualified healthcare professional for persistent irritation, unusual symptoms or other health concerns. Always follow the instructions and safety guidance provided on Linzzy product packaging.",
  },
};

export const ARTICLES: Article[] = [
  {
    slug: "know-your-flow", category: "feminine-care", topic: "Menstrual Health & Product Selection",
    title: "Know Your Flow: Choosing the Right Sanitary Towel for Your Period",
    lede: "Every period tells a different story. Some days your flow is light, other days it is heavier, and sometimes your routine demands extra preparation.",
    readMinutes: 2, image: { src: "/images/original/cover-know-your-flow.webp", alt: "Linzzy Cool Mint, Heavy Flow and Extra Long sanitary towel packs side by side on a lilac background" },
    says: "Your flow is personal. Your care should be too.",
    community: "What matters most when choosing a sanitary towel: length, absorbency or comfort?",
    body: `Understanding your menstrual flow can help you choose suitable sanitary protection and feel more prepared throughout your cycle.

## Understanding your flow

Menstrual flow can vary from person to person and from day to day. It is common for bleeding to be heavier during certain days of a period and lighter towards the end.

Your choice of sanitary towel should consider absorbency, length, fit and how frequently you need to change it.

## Getting to know Linzzy's sanitary towel range

Linzzy Cool Mint: A sanitary towel option for consumers who prefer the cooling sensation associated with this variant. Cooling products may not suit everyone, particularly those with sensitive skin.

Linzzy Heavy Flow: Designed as a higher-absorbency option for days when you need additional menstrual protection.

Linzzy Extra Long: Offers extended coverage for those who prefer a longer sanitary towel, including during rest or overnight use.

## How to make the right choice

Start by observing your usual menstrual pattern. Consider how quickly your sanitary towel becomes saturated, your daily activities and whether you experience leakage.

Remember that a longer towel is not automatically more absorbent. Always check the absorbency and product information on the packaging.`,
  },
  {
    slug: "period-hygiene-101", category: "feminine-care", topic: "Menstrual Hygiene",
    title: "Period Hygiene 101: Healthy Habits for Every Menstrual Cycle",
    lede: "Good menstrual hygiene is not about complicated routines. It is about simple, consistent habits that help you feel clean and comfortable throughout your period.",
    readMinutes: 2, image: null, imageNeeded: "clean bathroom vanity with Linzzy Heavy Flow (Lexta's thumbnail guide)",
    says: "Good period care begins with everyday habits.",
    community: "Which period hygiene habit would you encourage every young woman to practice?",
    body: `## Five habits worth practicing

Change your sanitary towel regularly. A general guide is every 4 to 6 hours, or sooner if saturated, depending on your flow and product instructions.

Wash your hands. Clean your hands before and after changing menstrual products.

Clean gently. Wash the external genital area with water. Avoid douching, scented intimate washes or harsh products that may cause irritation.

Dispose of used towels responsibly. Wrap used sanitary towels securely and place them in an appropriate waste bin. Never flush them.

Pay attention to discomfort. Persistent itching, unusual discharge, strong unpleasant odour or irritation should not be ignored. Seek guidance from a qualified healthcare professional.

## Why consistency matters

A practical hygiene routine helps you manage menstruation more comfortably at school, at work and while travelling.`,
  },
  {
    slug: "long-days-busy-schedules", category: "feminine-care", topic: "Lifestyle & Period Preparation",
    title: "Long Days, Busy Schedules: Staying Prepared During Your Period",
    lede: "From early lectures to office meetings, market days and long journeys, life does not stop because your period has arrived.",
    readMinutes: 2, image: { src: "/images/original/banner-on-the-go.webp", alt: "A young woman on the go with her handbag, beside packs of Linzzy sanitary towels" },
    says: "Your schedule may be busy, but your comfort still matters.",
    community: "What's the most useful item in your emergency period pouch?",
    body: `A little preparation can make your day easier.

## Build your personal period care kit

Keep a small pouch containing spare sanitary towels, clean underwear, tissues, a sealable bag for emergencies and hand sanitizer for situations where handwashing is unavailable.

## Plan around your activities

If you expect to spend several hours away from home, identify suitable washrooms where you can change comfortably.

Choose a product that suits your flow and clothing, rather than relying on one sanitary towel for the entire day.

## Be ready for unexpected changes

Periods can sometimes arrive earlier or later than expected. Tracking your cycle may help you recognise patterns, although tracking apps and calendars cannot predict every cycle accurately.

## Rest when you need to

Menstrual symptoms vary. Gentle movement, adequate hydration, nutritious meals and rest may support general well-being.`,
  },
  {
    slug: "panty-liners-explained", category: "feminine-care", topic: "Everyday Feminine Care",
    title: "Panty Liners Explained: When, Why and How to Use Them",
    lede: "Panty liners and sanitary towels may look similar, but they are designed for different needs.",
    readMinutes: 2, image: { src: "/images/original/cover-panty-liners.webp", alt: "A pack of Linzzy Panty Liners on a soft lavender background" },
    says: "Small essentials can make everyday routines easier.",
    community: "When do you find panty liners most useful?",
    body: `Understanding the difference can help you choose the right product for your routine.

## What is a panty liner?

A panty liner is a thin absorbent product worn inside underwear to manage small amounts of moisture or light spotting.

## When might a panty liner be useful?

Panty liners can be useful during very light spotting, towards the end of a period or for occasional everyday discharge when preferred.

Normal vaginal discharge is a natural part of reproductive health. It does not automatically require a panty liner.

## Introducing Linzzy Panty Liners

Linzzy Panty Liners offer a compact option for consumers seeking light everyday protection. The supplied packaging identifies a 155 mm liner in a 30-piece pack.

## How to use a panty liner correctly

Attach the liner securely to clean underwear, change it whenever damp or soiled, and dispose of it in a bin after use.

Panty liners are not a substitute for sanitary towels during moderate or heavy menstrual bleeding.

## Should you wear panty liners every day?

Daily use is not necessary for everyone. Some people prefer them occasionally, while others find that prolonged use contributes to irritation or moisture retention.

If you notice irritation, stop using the product and consider seeking professional advice.`,
  },
  {
    slug: "period-care-in-warm-weather", category: "feminine-care", topic: "Period Comfort & Seasonal Care",
    title: "Period Care in Ghana's Warm Weather: Comfort, Clothing and Hygiene",
    lede: "Ghana's warm weather can make everyday menstrual care feel more challenging, particularly during long commutes, outdoor activities and busy working days.",
    readMinutes: 2, image: { src: "/images/original/flow-focus-grow.webp", alt: "A young woman in a yoga pose next to a stack of Linzzy sanitary towel packs" },
    says: "Every season deserves thoughtful care.",
    community: "How do you stay comfortable during your period on particularly warm days?",
    body: `Understanding the relationship between heat, sweat and personal hygiene can help you create a comfortable routine.

## Choose suitable underwear

Breathable, comfortable underwear can help reduce friction and moisture accumulation.

## Change menstrual products when needed

Do not wait until a sanitary towel becomes uncomfortable or saturated. Change regularly, especially during heavier-flow days.

## Keep the external genital area clean

Gentle washing and careful drying are usually sufficient. Avoid excessive washing or using perfumed products to mask natural body odours.

## Recognise skin sensitivity

If a cooling or fragranced product causes discomfort, discontinue use. Cooling sensations should not be confused with proof of improved hygiene.

## Plan for outdoor activities

Carry spare products, drinking water and a small personal care pouch when spending long periods away from home.`,
  },
  {
    slug: "beyond-the-pad", category: "feminine-care", topic: "Menstrual Education & Empowerment",
    title: "Beyond the Pad: Understanding Your Menstrual Cycle and When to Seek Help",
    lede: "Menstruation is a natural biological process, but understanding your cycle involves more than knowing when to wear a sanitary towel.",
    readMinutes: 2, image: { src: "/images/original/mother-daughter.webp", alt: "A mother handing her smiling daughter a pack of Linzzy sanitary towels" },
    says: "Understanding your body is part of caring for yourself.",
    community: "What is one period-related question you wish had been answered when you first started menstruating?",
    body: `Learning about menstrual patterns can help you recognise changes and communicate concerns to a healthcare professional.

## What is a menstrual cycle?

The menstrual cycle is counted from the first day of one period to the first day of the next.

Cycle length varies, especially during adolescence, and not everyone menstruates on a predictable monthly schedule.

## What can affect your cycle?

Stress, illness, hormonal changes, medication and other health factors may influence menstrual patterns.

## What should you pay attention to?

Track the start date, duration, approximate flow and any symptoms that affect your daily activities.

Seek medical advice for unusually heavy bleeding, severe pain, bleeding between periods, or major changes in your usual cycle. Heavy bleeding that causes faintness or significant weakness warrants urgent medical attention.

## Let's make period conversations normal

Menstrual education benefits young people, parents, teachers and communities. Accurate information can reduce stigma and encourage timely support.`,
  },
  {
    slug: "the-perfect-diaper-bag", category: "baby-care", topic: "Baby Care Essentials",
    title: "The Perfect Diaper Bag: Everything You Need for a Day Out with Baby",
    lede: "Stepping out with your little one can be exciting, but every parent knows that babies come with surprises! From unexpected diaper changes to feeding breaks, a well-packed diaper bag can make outings easier and more enjoyable.",
    readMinutes: 2, image: { src: "/images/nursery/diaper-bag.webp", alt: "A packed diaper bag with Linzzy Baby Wipes, a bottle and a soft toy, next to Linzzy Baby Diapers and baby clothes" },
    says: "A prepared parent makes more room for happy little adventures.",
    community: "What's the one baby care item you never leave home without? Share your parenting essentials with the Linzzy community!",
    body: `At Linzzy, we believe preparation makes room for more beautiful moments with your baby.

## What Should Be in Your Diaper Bag?

A diaper bag is more than an accessory. It is your portable baby care station.

### 1. Pack enough diapers

Always carry sufficient diapers for your outing, plus a few extras for unexpected delays. Babies have different changing needs, so plan according to your child's routine.

### 2. Keep baby wipes within reach

Baby wipes are useful during diaper changes and for cleaning everyday messes. Keep your Linzzy Baby Wipes in an easily accessible compartment so you can reach them quickly when needed.

### 3. Carry a changing mat

A clean, portable changing mat provides a protective surface during diaper changes outside the home. Wipe down reusable mats after use.

### 4. Include spare clothing

Accidental leaks and spills happen. Pack at least one complete change of clothing for your baby.

### 5. Remember hygiene essentials

Carry hand sanitizer for situations where soap and water are unavailable, a small bag for soiled clothing, and appropriate disposal bags for used diapers.

### 6. Include feeding and comfort items

Depending on your baby's age, pack feeding supplies, a bib and a familiar comfort item.

> **Linzzy's Smart Packing Tip**
> Organise your bag into three sections: diapering essentials, feeding supplies and clothing. This saves time when you need something urgently.

## A Little Reminder

Never leave your baby unattended on a changing surface, even for a moment.`,
  },
  {
    slug: "diaper-changing-made-easier", category: "baby-care", topic: "Baby Hygiene & Daily Care",
    title: "Diaper Changing Made Easier, Building a Comfortable Routine for Your Baby",
    lede: "Diaper changing is one of the most frequent activities in a baby's daily routine. Although it may seem simple, developing good changing habits can support cleanliness, comfort and healthy skin.",
    readMinutes: 2, image: { src: "/images/nursery/mum-changing.webp", alt: "A smiling mother changing her laughing baby's diaper, with Linzzy Baby Diapers and Baby Wipes nearby" },
    says: "Every change is another opportunity to care.",
    community: "What helps keep your baby calm during diaper changes?",
    body: `Whether you are a first-time parent or an experienced caregiver, a consistent routine can make diaper changes smoother.

## Five Steps to a Better Diaper-Changing Routine

### Step 1: Prepare before you begin

Have your clean diaper, baby wipes and disposal bag ready. Keeping everything within reach allows you to focus on your baby throughout the change.

### Step 2: Remove the used diaper carefully

Gently remove the soiled diaper and fold it inward to contain the waste. Keep your baby securely supported.

### Step 3: Clean your baby's diaper area

Use suitable baby wipes or soft cotton with lukewarm water to gently clean the skin. Clean from front to back, especially for girls, to reduce the transfer of germs.

For babies with sensitive or irritated skin, plain water and a soft cloth may be preferable.

### Step 4: Allow the skin to dry

Gently pat the area dry before putting on a clean diaper. Trapped moisture can contribute to irritation.

### Step 5: Put on a fresh diaper

Position the diaper comfortably and fasten it securely without making it too tight. Check that the leg cuffs sit properly and that your baby can move freely.

## How Often Should You Change a Diaper?

Change diapers promptly after bowel movements and regularly whenever wet or soiled. Newborns generally require more frequent changes than older babies.

Check your baby's diaper often rather than waiting for visible discomfort.

## Common Mistakes to Avoid

Avoid fastening diapers too tightly, rubbing the skin aggressively, leaving babies in soiled diapers for extended periods or applying powders without professional guidance.

> **Linzzy's Gentle Care Reminder**
> Diaper-changing time can also be a moment of connection. Speak gently to your baby, maintain eye contact and make the experience reassuring.`,
  },
  {
    slug: "is-your-baby-wearing-the-right-diaper-size", category: "baby-care", topic: "Diaper Fit & Comfort",
    title: "Is Your Baby Wearing the Right Diaper Size? Signs Every Parent Should Know",
    lede: "Babies grow quickly, and their diaper needs change along the way. A diaper that fitted comfortably last month may no longer provide the same level of comfort today.",
    readMinutes: 2, image: { src: "/images/nursery/joyful-baby.webp", alt: "A happy baby lying on a blanket beside Linzzy Baby Diapers in sizes M and L" },
    says: "The right fit supports every little move.",
    community: "How did you know it was time to change your baby's diaper size?",
    body: `Choosing the right diaper size is important for freedom of movement, effective containment and everyday comfort.

## Five Signs Your Baby May Need a Different Diaper Size

### 1. Frequent leaks

If leaks occur despite regular changes and correct positioning, the diaper may be too small, too large or incorrectly fitted.

### 2. Deep marks around the waist or thighs

A properly fitted diaper should sit securely without digging into the skin. Persistent deep red marks may indicate excessive tightness.

### 3. Difficulty fastening the diaper

If the fastening tabs barely reach or the diaper appears stretched, consider checking the next size.

### 4. Gaps around the legs

Large gaps can allow leakage. Check the leg cuffs and ensure the diaper sits snugly without restricting movement.

### 5. Your baby seems uncomfortable

A diaper should allow natural movement, crawling, sitting and playing. Persistent discomfort warrants checking the fit and skin condition.

## How to Check Diaper Fit

The waistband sits comfortably without digging into the skin.

The leg cuffs are properly positioned, without large gaps.

The diaper covers the baby's bottom securely.

Your baby can move comfortably.

## Should You Choose Diapers Based on Age or Weight?

Weight ranges on diaper packaging are generally a better starting point than age alone. However, body shape and fit also matter.

Always refer to the size information printed on the product packaging.

> **Linzzy's Parenting Tip**
> Check diaper fit regularly, particularly during periods of rapid growth.`,
  },
  {
    slug: "baby-wipes-101", category: "baby-care", topic: "Baby Wipes & Hygiene",
    title: "Baby Wipes 101: How to Use, Store and Dispose of Wipes Responsibly",
    lede: "From diaper changes to everyday messes, baby wipes are a convenient part of many families' care routines.",
    readMinutes: 2, image: { src: "/images/nursery/baby-wipes.webp", alt: "Linzzy Baby Wipes in yellow, pink and blue packs on a nursery shelf" },
    says: "Gentle care begins with thoughtful everyday choices.",
    community: "Do you keep baby wipes in your diaper bag, car or nursery? Tell us where they come in handy most.",
    body: `However, using wipes correctly is just as important as having them available.

Understanding proper storage, gentle cleaning techniques and responsible disposal can help parents maintain good hygiene practices.

## When Can Baby Wipes Be Used?

Baby wipes intended for infant skin may be useful for cleaning the diaper area and wiping everyday messes from hands and skin, provided the product instructions permit these uses.

Avoid using ordinary baby wipes inside the mouth, directly in the eyes or on broken skin.

## Best Practices for Using Baby Wipes

### 1. Use gentle movements

Clean the skin without excessive rubbing. Repeated friction may irritate delicate areas.

### 2. Use a fresh wipe when needed

Avoid transferring dirt or germs from one area to another. Use additional wipes when cleaning heavily soiled skin.

### 3. Check your baby's skin response

Every baby's skin is different. If irritation develops, discontinue the product and seek appropriate healthcare advice if symptoms persist.

### 4. Close the packaging after use

Reseal the wipes pack properly to help prevent drying and contamination.

## How Should Baby Wipes Be Stored?

Store wipes in a cool, dry place, away from direct sunlight and excessive heat. Keep the package securely closed and follow the storage instructions on the label.

Avoid transferring wipes into unclean containers or adding water or other liquids to a package.

## How Should Used Baby Wipes Be Disposed Of?

Used baby wipes should be placed in an appropriate waste bin.

Never flush baby wipes down the toilet, even when they appear soft or breakable, unless local disposal guidance explicitly confirms a product is suitable for flushing. Conventional wipes can contribute to blocked pipes and sewer problems.

Keep unused wipes and their packaging out of children's reach.

> **Linzzy's Responsible Care Tip**
> Good baby care also includes caring for the environment around us. Dispose of wipes properly and encourage responsible waste habits within your household.`,
  },
  {
    slug: "keeping-your-baby-comfortable-in-warm-weather", category: "baby-care", topic: "Baby Comfort & Seasonal Care",
    title: "Keeping Your Baby Comfortable in Ghana's Warm Weather, Diapering and Skin Care Tips",
    lede: "Warm weather is part of everyday life for many families in Ghana and across West Africa. While babies enjoy comfort and movement, heat, sweat and moisture can sometimes make diapering more challenging.",
    readMinutes: 2, image: null, imageNeeded: "warm weather baby care scene with Linzzy Baby Diapers",
    says: "Comfortable little moments make brighter days.",
    community: "What baby care routines have helped your family during Ghana's warmer months?",
    body: `Creating a comfortable changing routine can help reduce prolonged exposure to moisture and friction.

## Understanding Baby Skin in Warm Weather

Babies have delicate skin that can become irritated when exposed to prolonged moisture, rubbing or heat.

The diaper area deserves particular attention because it is frequently covered.

## Practical Ways to Support Baby Comfort

### 1. Check diapers regularly

Warm weather does not automatically mean your baby needs a different diaper, but regular checks and prompt changes help prevent prolonged contact with moisture.

### 2. Choose comfortable clothing

Lightweight, breathable clothing suitable for the weather can help keep your baby comfortable. Avoid overdressing.

### 3. Clean and dry the diaper area

Gently clean the skin during changes and allow it to dry before fastening a new diaper.

### 4. Allow supervised diaper-free time

Short periods without a diaper, on a clean, safe and waterproof surface, may help reduce prolonged moisture exposure.

### 5. Pay attention to irritation

Watch for persistent redness, discomfort or changes in the skin. If a rash worsens, spreads, develops blisters or does not improve, consult a qualified healthcare professional.

## What About Diaper Rash?

Diaper rash can have several causes, including moisture, friction and skin sensitivity.

Maintaining cleanliness, changing soiled diapers promptly and using a suitable protective barrier cream when appropriate can help manage mild irritation. Seek professional advice when necessary.

> **Linzzy's Comfort Reminder**
> Every baby's skin is unique. What works for one child may not work for another, so observe your baby's comfort and adjust routines appropriately.`,
  },
  {
    slug: "little-changes-big-milestones", category: "baby-care", topic: "Parenting & Baby Development",
    title: "Little Changes, Big Milestones: Making Diaper Time Part of Your Baby's Development",
    lede: "Your baby's daily routine is filled with opportunities for connection, communication and learning.",
    readMinutes: 2, image: { src: "/images/nursery/dad-playtime.webp", alt: "A father playing with his laughing baby on a play mat, with Linzzy Baby Diapers and Baby Wipes" },
    says: "Little moments today, brighter beginnings tomorrow.",
    community: "What's your favourite everyday bonding moment with your baby?",
    body: `Even a simple diaper change can become a meaningful moment of interaction between a parent and child.

At Linzzy, we believe caring for a baby goes beyond everyday essentials. It is also about nurturing the little moments that shape growing relationships.

## Turning Diaper Changes into Bonding Moments

### Talk to your baby

Describe what you are doing during a diaper change. Simple phrases such as "Let's get you comfortable" introduce your baby to everyday language and familiar sounds.

### Respond to expressions

Notice your baby's movements, sounds and facial expressions. Responding warmly helps build a sense of security and connection.

### Make routines predictable

Babies can benefit from consistent, reassuring routines. A calm approach to changing, feeding and resting can help caregivers respond to their needs.

### Encourage gentle interaction

Age-appropriate songs, facial expressions and playful conversation can make changing time more engaging.

### Involve other caregivers

Fathers, grandparents and trusted caregivers can all participate in daily baby care. Shared responsibility supports families and helps babies develop familiar relationships.

## Creating a Positive Changing Environment

Choose a safe, clean and comfortable changing area. Keep essential supplies nearby and maintain continuous supervision.

If your baby becomes restless, remain calm and complete the change safely.

> **Linzzy's Family Care Tip**
> Parenting is not about making every moment perfect. It is about providing consistent, attentive care as your child grows.`,
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);

/** Six quick tips (Lexta's "Six quick Tips & Advice for the website"), shown as short cards under the articles. */
export const QUICK_TIPS: { n: string; title: string; headline: string; body: string }[] = [
  { n: "01", title: "Know Your Flow", headline: "Know Your Flow", body: "Choose sanitary protection according to your bleeding pattern, preferred fit and absorbency needs. Check the product label before use." },
  { n: "02", title: "Change Regularly", headline: "Freshness Starts with Good Habits", body: "Change sanitary towels approximately every 4 to 6 hours or sooner when needed. Change panty liners whenever damp or soiled." },
  { n: "03", title: "Keep a Period Pouch", headline: "Prepared Wherever You Go", body: "Carry spare sanitary towels, clean underwear and a disposal bag to stay prepared at school, work or while travelling." },
  { n: "04", title: "Use Panty Liners Wisely", headline: "Little Care, Everyday Confidence", body: "Panty liners are suitable for light spotting or small amounts of moisture, not for managing heavy menstrual bleeding." },
  { n: "05", title: "Listen to Your Skin", headline: "Comfort Comes First", body: "Stop using any menstrual product that causes irritation. Fragrance or cooling sensations do not necessarily mean better hygiene." },
  { n: "06", title: "Track Your Cycle", headline: "Know Your Cycle, Know Your Body", body: "Record your period dates and symptoms to understand your usual pattern and recognise changes worth discussing with a healthcare professional." },
];

/**
 * Linzzy Parent Corner, editorial text only (docs/content/linzzy/parent-corner.md). The submission form, story
 * spotlight and expert Q&A are not built (outside the agreed scope, see CONTENT-NEEDED.md).
 */
export const PARENT_CORNER = {
  title: "Linzzy Parent Corner",
  tagline: "Every Parent Has a Story. Every Story Can Inspire.",
  lead: "Real Parents. Real Experiences. Shared Wisdom.",
  intro: [
    "Every little milestone, every unexpected challenge and every precious moment come with a story.",
    "At Linzzy, we believe parenting becomes more meaningful when we learn from one another. Whether you're navigating your baby's first diaper change, learning new hygiene routines, celebrating a developmental milestone or discovering what works best for your family, your experience could inspire another parent.",
  ],
  sign: "Linzzy Parent Corner, Little Stories. Big Lessons. Brighter Beginnings.",
  topics: [
    "Diaper-changing routines and hygiene",
    "Understanding diaper fit and sizing",
    "Baby wipes and responsible usage",
    "Everyday baby skin care",
    "Recognising when professional medical advice may be needed",
    "Common baby care myths and misconceptions",
  ],
  /** Lexta's monthly themes; the page shows the current month's. */
  months: [
    { theme: "New Beginnings", question: "What surprised you most about becoming a parent?" },
    { theme: "Little Moments of Love", question: "How do you bond with your baby during daily routines?" },
    { theme: "Baby Hygiene Matters", question: "What's your best diaper-changing tip?" },
    { theme: "Parenting on the Go", question: "What never leaves your diaper bag?" },
    { theme: "Celebrating Mothers", question: "What has motherhood taught you?" },
    { theme: "Fathers in Baby Care", question: "How do fathers participate in everyday baby care?" },
    { theme: "Baby Comfort", question: "How do you keep your baby comfortable in warm weather?" },
    { theme: "Growing Milestones", question: "Which little milestone made you proud?" },
    { theme: "Healthy Hygiene Habits", question: "What baby care hygiene lesson would you share?" },
    { theme: "Parenting Myths", question: "Which baby care myth would you like an expert to explain?" },
    { theme: "Family Support", question: "Who has helped you most on your parenting journey?" },
    { theme: "Our Parenting Year", question: "What's your biggest parenting lesson this year?" },
  ],
};
