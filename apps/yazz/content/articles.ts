/**
 * Yazz Tips & Articles. Static content in the repo: 1773 adds or edits articles on request (there is no staff news
 * CMS, by contract). To add one, add an entry to ARTICLES; it appears on /tips, in its category and at /tips/<slug>.
 *
 * Source: Lexta's "yazz article.docx" (Google Drive, YAZZ ARTICLES): the ten Tips Just 4 You articles and the ten
 * Just 4 Parents & Caregivers articles, with the dates Lexta asked for (month only), and the Tips & Advice topics in
 * "yazz website content.docx". Photos are still to come (CONTENT-NEEDED.md), so articles show a branded block.
 * "Just 4 You" and "Just 4 Parents" are article categories only: no selectors, calculators or other tools.
 *
 * Body format, one block per blank line:  "## Heading"  |  "- list item" lines  |  "1. numbered" lines  |
 * "> A Yazz tip" (the coloured tip box)  |  anything else is a paragraph.
 */

export const CATEGORIES = [
  {
    slug: "just-4-you",
    label: "Just 4 You",
    title: "Periods. Puberty. Protection. Confidence. Just 4 You.",
    blurb:
      "The Yazz® space created to help you understand your period, care for yourself, choose the right menstrual protection and feel more confident through every stage of your journey.",
  },
  {
    slug: "just-4-parents",
    label: "Just 4 Parents",
    title: "Helping Her Understand. Helping Her Prepare. Helping Her Grow with Confidence.",
    blurb:
      "Part of Tips Just 4 You, created to help parents, guardians and caregivers approach puberty and menstruation with openness, sensitivity and practical information.",
  },
  {
    slug: "care-tips",
    label: "Care Tips",
    title: "Helpful ideas for everyday living.",
    blurb: "Practical advice for oral care, baby care and home care, created around the real questions families ask.",
  },
  { slug: "news", label: "News", title: "The latest from Yazz.", blurb: "News and announcements from Yazz® and Lexta Ghana Limited." },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const isCategory = (v: string | undefined): v is CategorySlug => CATEGORIES.some((c) => c.slug === v);
export const categoryOf = (slug: CategorySlug) => CATEGORIES.find((c) => c.slug === slug)!;

export type Article = {
  slug: string;
  title: string;
  /** The article's own subtitle. */
  kicker: string;
  lede: string;
  category: CategorySlug;
  /** The small coloured label on cards: what the article is about. */
  topic: { label: string; tone: string };
  /** "2026-01" (month only, as Lexta dated them), or null. */
  date: string | null;
  readMinutes: number;
  /** A prototype photo, or null for a branded placeholder block. */
  image: { src: string; alt: string } | null;
  /** A range page the article links to ("Related products"). */
  range?: "feminine-care" | "oral-care" | "baby-care" | "home-care" | "home-tissue";
  body: string;
};

const PINK = "#EC1B7B";
const BLUE = "#0B4FA5";
const GREEN = "#15803D";
const PURPLE = "#6D3FC0";
const FEM_IMAGE = { src: "/images/feminine-care.webp", alt: "A smiling young woman holding a pack of Yazz sanitary pads" };

export const TIP_LABEL: Record<CategorySlug, string> = {
  "just-4-you": "Yazz® Tip Just 4 You",
  "just-4-parents": "Yazz® Parent Tip",
  "care-tips": "Yazz® Tip",
  news: "Yazz®",
};

/** Shown under every Just 4 You and Just 4 Parents article (Lexta's own wording). */
export const HEALTH_NOTE =
  "Content within Yazz® Tips Just 4 You is intended for general education and does not replace professional medical advice, diagnosis or treatment. Menstrual cycles and puberty vary between individuals. If you are concerned about your health, menstrual cycle, puberty or symptoms you are experiencing, speak with a parent or trusted adult and seek advice from a qualified healthcare professional.";

const you = (a: Omit<Article, "category" | "topic" | "range"> & { topic?: Article["topic"] }): Article => ({
  category: "just-4-you", topic: { label: "Tips Just 4 You", tone: PINK }, range: "feminine-care", ...a,
});
const parents = (a: Omit<Article, "category" | "topic" | "date" | "range">): Article => ({
  category: "just-4-parents", topic: { label: "Just 4 Parents", tone: BLUE }, date: null, range: "feminine-care", ...a,
});

export const ARTICLES: Article[] = [
  // Tips Just 4 You -----------------------------------------------------------------------------------------
  you({
    slug: "what-happens-during-puberty", title: "What Happens During Puberty?", kicker: "Growing, Changing and Becoming You",
    lede: "Have you noticed that your body, emotions or even the way you think about things are beginning to change? Welcome to puberty.",
    date: "2026-01", readMinutes: 3, image: null,
    body: `Puberty is a natural stage of growing up when a child's body gradually develops toward physical maturity. It doesn't happen overnight, and it doesn't happen at exactly the same age or speed for everyone.

Some friends may notice changes earlier than you. Others may experience them later. There isn't a competition or timetable you need to follow.

## Why Does Puberty Happen?

Puberty happens because your body begins producing different levels of hormones, chemical messengers that help control growth, development and other body processes.

These hormonal changes can affect your body, skin, hair, emotions and reproductive system.

## What Changes Might I Notice?

During puberty, you may notice:

- Growth spurts
- Breast development
- Hair growing under your arms and around the pubic area
- Changes in body shape
- Increased sweating and body odour
- Oilier skin or spots
- Vaginal discharge
- Emotional changes
- The beginning of menstruation

These changes usually happen gradually.

## Does Everyone Experience Puberty the Same Way?

No. Bodies develop differently. Try not to use your friends, classmates, siblings, social media or celebrities as a measurement of how your body "should" look.

Your development is your own.

> Learning what puberty is can make the changes feel less confusing. If something about your development worries you, speak with a parent, caregiver, another trusted adult or healthcare professional. Growing differently doesn't mean growing incorrectly.`,
  }),
  you({
    slug: "understanding-your-first-period", title: "Understanding Your First Period", kicker: "Your First Period Is a New Chapter",
    lede: "Your first period can arrive with plenty of questions. Knowing what to expect beforehand can help you feel more prepared.",
    date: "2026-02", readMinutes: 4, image: FEM_IMAGE,
    body: `What is happening? Is this normal? What do I do now? Who should I tell?

## What Is a Period?

A period is part of the menstrual cycle. During the menstrual cycle, the lining of the uterus builds up. If pregnancy does not occur, the body sheds this lining through the vagina. The blood and tissue leaving the body are what we call a menstrual period.

Your first menstrual period is known as menarche.

## When Will My First Period Start?

There is no single exact age. Your first period usually happens after other signs of puberty have begun. Because everybody develops differently, avoid worrying simply because a friend starts before or after you.

## How Long Will It Last?

Periods can vary, especially when they first begin. Early menstrual cycles may not always follow a predictable schedule.

Keeping track of when your period begins and ends can help you gradually understand your own pattern.

## What Should I Do When My First Period Arrives?

First, know that menstruation is normal.

If you're at home, tell a parent, caregiver or another trusted adult. If you're at school and don't have a sanitary pad, you can ask a teacher, school nurse or another trusted adult for assistance.

Once you have a pad, follow the instructions on the packaging and change it regularly according to your flow and comfort needs.

## Prepare a Yazz® Period Kit

Keep a small pouch containing:

- Sanitary pads
- Clean underwear
- Tissues
- A small disposal bag
- A period calendar or tracker

Keep one at home and, where possible, another in your school bag.

> Your first period isn't something you need to hide or feel ashamed about. It's your body growing, and knowledge helps you feel prepared.`,
  }),
  you({
    slug: "body-changes-during-puberty", title: "Body Changes During Puberty", kicker: "What's Happening to My Body?",
    lede: "One day your clothes fit perfectly. A few months later, things may feel different. Puberty brings physical changes because your body is developing.",
    date: "2026-02", readMinutes: 3, image: null,
    body: `## Breast Development

Breasts may begin developing during puberty. One breast may sometimes appear to develop differently or at a different pace from the other. Bodies vary, and development happens gradually.

## Body Hair

Hair may begin growing:

- Under your arms
- Around your pubic area
- More noticeably on other parts of your body

This is a normal part of puberty.

## Growing Taller

You may experience a period of faster growth. Your height, weight and body proportions can change as you develop.

## Skin Changes

Hormonal changes can cause the skin to produce more oil. This can contribute to spots or acne. A simple, gentle skincare routine can help you care for your skin.

## Sweating and Body Odour

You may begin sweating more, particularly under your arms. Regular bathing, clean clothing and appropriate personal-care products can help manage body odour.

## Vaginal Discharge

You may begin noticing clear or whitish discharge in your underwear. This can be a normal part of puberty. Learn more about this in the next article.

> Your body isn't supposed to look exactly like anybody else's. Give yourself time to grow.`,
  }),
  you({
    slug: "understanding-normal-vaginal-discharge", title: "Understanding Normal Vaginal Discharge", kicker: "\"I Noticed Something in My Underwear. Should I Be Worried?\"",
    lede: "Not necessarily. Vaginal discharge is part of the body's natural way of keeping the vaginal environment healthy.",
    date: "2026-03", readMinutes: 3, image: null,
    body: `Vaginal discharge is fluid produced by the vagina and cervix. You may begin noticing discharge during puberty, sometimes before your first menstrual period.

## What Can Normal Discharge Look Like?

Normal discharge can vary throughout the menstrual cycle. It may be:

- Clear
- Whitish
- Slightly creamy
- Thin at some times
- Thicker at others

The amount and texture can change at different stages of your cycle.

## Is Discharge the Same as a Period?

No. Menstrual flow contains blood and tissue shed from the lining of the uterus. Vaginal discharge is different and can occur throughout the menstrual cycle.

## Do I Need to Clean Inside My Vagina?

The vagina is self-cleaning, so internal washing or douching isn't necessary and can disrupt its natural balance.

For everyday hygiene, gently washing the external genital area with water and following appropriate personal-hygiene practices is generally enough.

## When Should I Tell Someone?

If you notice a strong or unusual smell, significant changes in colour or consistency, or symptoms such as itching, burning, irritation or pain, tell a parent, caregiver or trusted adult and consider speaking with a healthcare professional.

Don't feel embarrassed about asking.

> Understanding what's usual for your body can help you recognise when something changes. Know your body. Ask when you're unsure.`,
  }),
  you({
    slug: "emotional-changes-during-puberty", title: "Emotional Changes During Puberty", kicker: "Why Do My Feelings Seem Different?",
    lede: "Puberty isn't only about physical changes. You may also notice changes in your emotions.",
    date: "2026-03", readMinutes: 2, image: null,
    body: `Sometimes you might feel happy and energetic. At another time you may feel irritated, worried, sensitive or overwhelmed.

Hormonal changes can influence emotions, but school, friendships, family relationships, stress, sleep and everyday experiences can affect them too.

## What Can Help?

1. Talk about it: speak with someone you trust instead of keeping difficult feelings to yourself.
2. Get enough rest: sleep is important for your physical and emotional wellbeing.
3. Take healthy breaks: reading, music, creative activities, gentle exercise, spending time outdoors or enjoying a hobby can help you reset.
4. Be patient with yourself: growing up involves learning how to understand and manage new feelings.

You don't need to have everything figured out immediately.

## When Should I Ask for Help?

If difficult emotions feel overwhelming, continue for a long time or interfere significantly with everyday life, tell a trusted adult. Getting appropriate support is important.

> Your feelings matter, and talking about them can help.`,
  }),
  you({
    slug: "personal-hygiene-during-puberty", title: "Personal Hygiene During Puberty", kicker: "Caring for Your Changing Body",
    lede: "As your body changes, your personal-care routine may need to change too. Good hygiene is about caring for your health and feeling comfortable.",
    date: "2026-03", readMinutes: 3, image: null,
    body: `## Bathing

Regular bathing helps remove sweat, dirt and body odour. Pay attention to areas that sweat more, including your underarms and feet.

## Clean Clothes and Underwear

Change your underwear daily and choose clean, comfortable clothing.

## Menstrual Hygiene

During your period:

- Wash your hands before and after changing your pad.
- Change your sanitary pad regularly according to your flow and the product directions.
- Wrap used pads before placing them in an appropriate waste bin.
- Never flush sanitary pads down the toilet.
- Keep spare pads available when possible.

## Caring for Your External Genital Area

Keep the external genital area clean using gentle hygiene practices. Avoid harsh products or unnecessary internal cleaning.

## Oral Hygiene

Puberty doesn't change the importance of caring for your teeth. Brush regularly and follow good dental-care practices.

## Create Your Everyday Care Kit

Depending on your needs, your bag could include:

- Sanitary pads
- Tissues
- Clean underwear
- Deodorant or appropriate personal-care products
- A small disposal pouch

> Clean habits. Comfortable body. Confident you.`,
  }),
  you({
    slug: "building-confidence-while-growing-up", title: "Building Confidence While Growing Up", kicker: "Your Confidence Doesn't Have to Wait",
    lede: "Puberty can sometimes make you more aware of how you look. And social media can make it seem as though everyone else has everything figured out. They don't.",
    date: "2026-04", readMinutes: 3, image: null,
    body: `Your height changes. Your skin changes. Your body develops. Friends may develop differently.

## Don't Compare Your Growth

There isn't one "perfect" way for a developing body to look. Comparing yourself constantly with friends or people online can make normal differences feel like problems when they aren't.

## Confidence Is More Than Appearance

Confidence can grow from:

- Learning new things
- Developing your talents
- Treating others well
- Speaking respectfully
- Asking questions
- Taking responsibility
- Learning from mistakes
- Building healthy friendships
- Taking care of yourself
- Recognising your strengths

## Speak Kindly About Yourself

Pay attention to how you describe yourself. Instead of focusing only on what you dislike, recognise what your body enables you to do and the qualities that make you who you are.

> You don't have to become somebody else to become confident. Grow into you.`,
  }),
  you({
    slug: "talking-to-a-trusted-adult", title: "Talking to a Trusted Adult", kicker: "Some Questions Are Easier When You Don't Face Them Alone",
    lede: "Periods, puberty and body changes can sometimes feel awkward to discuss. But you deserve reliable information, and a trusted adult can help.",
    date: "2026-01", readMinutes: 2, image: null,
    body: `## Who Can Be a Trusted Adult?

Depending on your circumstances, this might be:

- A parent
- A caregiver
- An older responsible family member
- A teacher
- A school counsellor
- A school nurse
- A healthcare professional
- Another responsible adult you know and trust

## How Do I Start the Conversation?

You don't need a perfect opening. Try something simple:

- "I have a question about my period."
- "Can we talk about something I'm noticing with my body?"
- "I learned something about puberty and I want to understand it better."
- "My period started and I need some help."

## What If I Feel Embarrassed?

That's understandable. You could write your question down first or choose a quiet moment to speak. Remember, parents, caregivers and other adults went through puberty too.

> Asking for help is a smart way of taking care of yourself.`,
  }),
  you({
    slug: "periods-at-school", title: "Periods at School", kicker: "Period Day + School Day? You've Got This.",
    lede: "You're sitting in class and suddenly realise your period has started. What now? First, don't panic.",
    date: "2026-01", readMinutes: 3, image: FEM_IMAGE,
    body: `Having your period at school is normal, and being prepared can make it much easier.

## Pack a School Period Kit

Keep a discreet pouch containing:

- Yazz® sanitary pads
- Spare underwear
- Tissues
- A disposal bag or pouch

## What If I Don't Have a Pad?

Ask a trusted teacher, school nurse, school administrator, friend or another appropriate person for help.

## Changing Your Pad at School

Use an appropriate washroom when you need to change your pad. Wrap the used pad and place it in the designated waste bin. Wash your hands before and after changing where possible.

## What If I Notice a Leak?

It happens. If possible, change your pad and clothing. Ask a trusted adult or friend for assistance if you need it. A spare pair of underwear in your period kit can be useful.

## Track Your Period

Recording the first day of each period can help you understand your cycle and estimate when your next one may arrive. Remember that cycles can vary, particularly during the first years of menstruation.

> Your education matters every day of the month. Be prepared. Stay protected. Keep learning.`,
  }),
  you({
    slug: "common-puberty-questions", title: "Common Puberty Questions", kicker: "You Asked. Yazz® Answers.",
    lede: "Thirteen of the questions we hear most often about puberty and periods, answered simply.",
    date: "2026-01", readMinutes: 4, image: null,
    body: `## When will I start puberty?

There isn't one exact age. Puberty begins at different times for different people.

## When will I get my first period?

There isn't a single date or age that applies to everyone. Your first period generally happens after other puberty changes have begun.

## What if my friends already have periods and I don't?

Bodies develop at different rates. Starting later than a friend doesn't automatically mean something is wrong.

## Is vaginal discharge normal?

Clear or whitish discharge can be a normal part of puberty and the menstrual cycle. If it changes significantly or comes with discomfort, irritation or an unusual smell, speak with a trusted adult or healthcare professional.

## Why am I sweating more?

Hormonal changes during puberty can increase sweating. Regular bathing, clean clothing and appropriate personal-care products can help.

## Why am I getting spots?

Hormonal changes can increase oil production in your skin, which can contribute to acne.

## Why do my emotions change?

Hormones, stress, relationships, school, sleep and other factors can all influence emotions during adolescence.

## Is having a period embarrassing?

No. Menstruation is a normal biological process.

## Can I go to school during my period?

Yes. Most people can continue their usual activities during their period, depending on how they feel.

## How often should I change my sanitary pad?

Change your pad regularly according to your menstrual flow, comfort needs and the instructions provided with the product. Don't continue wearing a pad once it is saturated or uncomfortable.

## What if my period starts unexpectedly?

Use a sanitary pad and tell a parent, caregiver or trusted adult if you need help. Keeping a period kit with you can help you prepare.

## Should I track my period?

Tracking your cycle can help you understand your usual pattern and prepare for future periods.

## What if I'm worried about something happening to my body?

Don't rely only on friends or social media for health information. Speak with a parent, caregiver, trusted adult or qualified healthcare professional.

> Puberty doesn't come with a personal instruction manual. That's why Yazz® Tips Just 4 You exists: to make periods, puberty, hygiene and growing up easier to understand.`,
  }),
  you({
    slug: "how-to-use-a-sanitary-pad", title: "How to Use a Sanitary Pad", kicker: "Simple Protection. Everyday Confidence.",
    lede: "If you've never used a sanitary pad before, it may seem unfamiliar at first. A sanitary pad is worn inside your underwear to absorb menstrual flow.",
    date: null, readMinutes: 2, image: FEM_IMAGE,
    body: `## Using Your Yazz® Pad

1. Wash and dry your hands.
2. Remove the pad from its individual wrapper.
3. Peel away the protective backing.
4. Position the pad securely in the centre of your underwear.
5. If your Yazz® pad has wings, fold them around the sides of your underwear to help keep the pad in place.
6. Change your pad regularly and whenever it feels full, uncomfortable or needs replacing.
7. Wrap the used pad securely before placing it in an appropriate waste bin.
8. Wash your hands afterwards.

Never flush sanitary pads down the toilet. Always follow the usage and disposal instructions displayed on your Yazz® packaging.`,
  }),
  you({
    slug: "which-pad-is-right-4-me", title: "Choosing My Yazz®: Which Pad Is Right 4 Me?", kicker: "Your Flow, Your Day, Your Comfort",
    lede: "Your flow can change during your period. What feels suitable during the first few days may be different from what you prefer toward the end.",
    date: null, readMinutes: 2, image: null,
    body: `When choosing a pad, think about:

- Your flow: is today lighter, moderate or heavier than usual?
- Your day: are you going to school, work, travelling, relaxing at home or staying active?
- Your comfort: choose protection that feels comfortable and secure for you.
- Day or night: you may prefer different coverage depending on whether you're going about your day or sleeping.

Compare the Yazz® options using the details on their approved packaging: pad lengths, pack contents and flow. Our Feminine Care page lists every Yazz® pad and panty liner.`,
  }),
  you({
    slug: "feeling-fresh-every-day", title: "Feeling Fresh Every Day", kicker: "Freshness Begins with Good Personal Hygiene",
    lede: "Taking care of yourself during your period doesn't need to be complicated. Simple hygiene habits can help you stay comfortable and confident.",
    date: null, readMinutes: 2, image: null,
    body: `- Change regularly. Avoid wearing the same sanitary pad for longer than necessary. Change it according to your flow, comfort needs and product directions.
- Wash your hands. Wash your hands before and after changing your sanitary pad.
- Keep clean. Regular bathing and appropriate personal hygiene are important throughout your cycle.
- Wear clean underwear. Fresh, comfortable underwear can help you feel more comfortable throughout your day.
- Carry your essentials. Keeping an extra pad with you can make unexpected situations easier to manage.
- Dispose responsibly. Wrap used sanitary pads and place them in an appropriate waste bin. Do not flush them.

## Your Period Doesn't Make You Dirty

Menstruation is a normal biological process. Good menstrual hygiene is about caring for yourself, not feeling embarrassed about your period.

> Fresh. Comfortable. Confident.`,
  }),
  you({
    slug: "period-myths-vs-facts", title: "Period Myths vs Facts", kicker: "Let's Get the Facts Straight",
    lede: "Menstruation can sometimes be surrounded by myths, embarrassment and misinformation. Yazz® believes better information creates greater confidence.",
    date: null, readMinutes: 2, image: null,
    body: `## Myth: Periods are something to be ashamed of.

Fact: menstruation is a normal biological process.

## Myth: Everyone's period is the same.

Fact: menstrual experiences can vary from person to person.

## Myth: You shouldn't talk about periods.

Fact: healthy, age-appropriate conversations about menstruation can help people make informed hygiene choices and seek help when needed.

## Myth: Getting your period means you have to stop your normal activities.

Fact: many people continue school, work and normal daily activities during menstruation, depending on how they feel.

> Let's replace period myths with period knowledge.`,
  }),

  // Just 4 Parents & Caregivers -------------------------------------------------------------------------------
  parents({
    slug: "how-to-explain-menstruation", title: "How to Explain Menstruation", kicker: "Make the First Conversation Simple",
    lede: "For many adults, talking about menstruation can feel uncomfortable, particularly if periods weren't openly discussed when they were growing up. But your experience doesn't have to become hers.",
    readMinutes: 3, image: null,
    body: `Menstruation should be explained as a normal biological process, not something secret, dirty or embarrassing. Ideally, the conversation should happen before her first period, not after she unexpectedly discovers blood in her underwear.

## Where Do You Begin?

Start with the basics. You might explain:

"As you grow up, your body will go through puberty. One of those changes is having periods. A period happens when the lining that has built up inside the uterus leaves the body through the vagina as blood and tissue. It usually happens as part of a repeating menstrual cycle."

Keep your explanation appropriate to her age and level of understanding. You don't need to explain everything in one conversation.

## Explain the Words Too

Help her become comfortable with accurate terms such as:

- Puberty
- Menstruation
- Period
- Menstrual cycle
- Uterus
- Vagina
- Sanitary pad

Using clear language helps remove mystery and embarrassment.

## Let Her Ask Questions

Her questions may surprise you. Try not to laugh, dismiss them or make her feel embarrassed. If you don't know an answer, it's perfectly reasonable to say: "I'm not sure. Let's find reliable information together."

## Don't Make Menstruation a "Girls' Secret"

Periods are private, but they don't need to be shameful. Where appropriate, boys and other family members can also learn basic, age-appropriate facts about menstruation. Better understanding can contribute to more respectful attitudes.

> Don't wait for "the period talk." Have many small conversations as she grows. Information before menstruation can turn fear into preparation.`,
  }),
  parents({
    slug: "preparing-her-for-her-first-period", title: "Preparing Her for Her First Period", kicker: "Preparation Begins Before the First Drop",
    lede: "For a young person who hasn't been prepared for menstruation, an unexpected first period could be frightening. Preparing her beforehand gives her something extremely valuable: understanding.",
    readMinutes: 3, image: null,
    body: `## Teach Her What to Expect

Explain that:

- Her first period is part of puberty.
- Menstrual flow can vary.
- Periods may not immediately follow a predictable pattern.
- She may experience some discomfort.
- She can continue many normal activities during her period according to how she feels.
- She should tell you or another trusted adult if she is worried about anything.

Most importantly, tell her: "When it happens, you can come to me."

## Show Her a Sanitary Pad Before She Needs One

Don't simply place sanitary pads in a cupboard. Show her what one looks like. Explain the wrapper. Show her where the adhesive backing is. Explain wings if the product has them. Teach her how the pad is positioned inside underwear, and how to remove, wrap and dispose of a used pad appropriately.

Always follow the specific directions provided on the product packaging.

## Talk About School

Ask: "If your period started at school tomorrow, what would you do?" Work through the answer together. Help her identify appropriate adults at school she could approach, and make sure she knows where her period kit is.

> Preparation isn't about making her worry that her period could start at any moment. It's about helping her know: "Whenever it happens, I know what to do."`,
  }),
  parents({
    slug: "creating-her-first-period-kit", title: "Creating Her First Period Kit", kicker: "A Little Bag That Can Bring Big Reassurance",
    lede: "A first-period kit is one of the simplest ways to help a young person feel prepared. It doesn't need to be expensive or complicated.",
    readMinutes: 2, image: null,
    body: `Choose a small, clean and discreet pouch that fits easily into her school bag.

## The Yazz® First Period Kit

Consider including:

- Sanitary pads: pack enough for expected needs, including a spare where practical. Make sure she knows how to use them before putting them in her kit.
- Spare underwear: an unexpected period or leak can happen, and clean underwear makes it much easier to manage.
- Tissues: useful as an everyday personal-hygiene item.
- Disposal bags: for securely wrapping used products where disposal facilities are not immediately available.
- A small calendar or period tracker: recording the first day of each period helps her understand her pattern.

## Personalise It

Let her choose the pouch. She might prefer something colourful, simple, fashionable or discreet. Giving her ownership helps the kit feel like normal personal care rather than an emergency pack.

## Check It Together

Period kits need restocking. Create a simple habit of checking supplies periodically without making it intrusive.

> Consider keeping period essentials in more than one location: school bag, home, travel bag. Preparation creates options.`,
  }),
  parents({
    slug: "understanding-puberty", title: "Understanding Puberty", kicker: "She's Not \"Suddenly Different\". She's Developing.",
    lede: "Puberty is the period of development during which a child's body gradually matures, with physical and emotional changes.",
    readMinutes: 2, image: null,
    body: `For girls, changes may include:

- Breast development
- Growth in height
- Changes in body proportions
- Pubic and underarm hair
- Increased sweating
- Body odour
- Oilier skin or acne
- Vaginal discharge
- Menstruation
- Emotional changes

These changes don't necessarily happen in the same order or at the same age for everyone.

## Avoid Comparisons

Statements such as "Your sister wasn't like this", "You're developing too quickly" or "Why haven't you developed like your friends?" can make normal developmental differences feel like failures. Instead, reinforce the idea that bodies develop at different rates.

## Respect Growing Privacy

As children mature, they may want more privacy when dressing, bathing or managing their periods. Where appropriate and safe, respecting this growing independence can help them develop healthy personal boundaries.

> Puberty isn't only something happening to her body. It's a period when she's also developing greater independence, self-awareness and identity. Guide the person, not just the changes.`,
  }),
  parents({
    slug: "discussing-personal-hygiene", title: "Discussing Personal Hygiene", kicker: "Turn Hygiene into Education, Not Embarrassment",
    lede: "Puberty can bring increased sweating, body odour, oilier skin, vaginal discharge and menstruation. Teach her without shaming her.",
    readMinutes: 3, image: null,
    body: `Instead of "You smell", try: "As we grow, our bodies can sweat more. Let's talk about a routine that helps you stay clean and comfortable."

## Build a Simple Routine

- Bathing: regular bathing helps remove sweat and maintain general cleanliness.
- Underwear: encourage clean underwear daily and whenever a change is needed.

## Menstrual Hygiene

Teach her to:

- Wash her hands before and after changing a sanitary pad.
- Change pads regularly according to her flow and product instructions.
- Wrap used pads securely.
- Place used pads in an appropriate waste bin.
- Never flush sanitary pads down the toilet.

## Genital Hygiene

Explain the difference between the vulva, the external genital area, and the vagina, the internal canal. The vagina is self-cleaning. Douching or inserting products for routine cleaning is unnecessary and may disturb its natural environment. Gentle care of the external genital area is generally sufficient.

## Oral and Skin Care

Puberty is also a good time to reinforce regular dental care and simple, gentle skincare habits.

> Good hygiene shouldn't be taught through embarrassment. Teach the habit. Explain why it matters. Give her the tools to manage it herself.`,
  }),
  parents({
    slug: "understanding-period-discomfort", title: "Understanding Period Discomfort", kicker: "\"My Period Hurts\": Don't Automatically Dismiss It",
    lede: "Period discomfort is common, but that doesn't mean every level of pain should simply be accepted.",
    readMinutes: 3, image: null,
    body: `Menstrual cramps occur when the uterus contracts during menstruation. She may describe:

- Cramping or aching in the lower abdomen
- Lower-back discomfort
- Headaches
- Tiredness
- Bloating
- Breast tenderness
- Changes in mood

Experiences vary considerably.

## How Can You Support Her?

Start by listening. Ask "How are you feeling?" rather than immediately telling her what she should be feeling.

Depending on her symptoms, simple measures such as rest, hydration, gentle activity where comfortable and warmth applied appropriately may help some people. For medication, particularly for a child or young teenager, follow the product directions and seek appropriate guidance from a pharmacist or healthcare professional when needed.

## Don't Normalise Severe Pain

Avoid automatically saying "Periods hurt. You'll get used to it." Pain that is severe, worsening, regularly prevents her from attending school or normal activities, or comes with other concerning symptoms deserves professional medical attention.

> Teach her to describe her symptoms rather than hide them. Listening to her body is part of menstrual education.`,
  }),
  parents({
    slug: "helping-her-manage-periods-at-school", title: "Helping Her Manage Periods at School", kicker: "Her Period Shouldn't Make School Feel Impossible",
    lede: "School can be one of the biggest sources of anxiety when menstruation begins. Preparation can reduce some of that anxiety.",
    readMinutes: 3, image: null,
    body: `She may worry: "What if I leak?" "What if somebody sees my pad?" "What if my period starts during class?" "What if there isn't a bin?"

## Create Her School Plan

1. Pack her period kit: include pads, spare underwear, tissues and appropriate disposal supplies.
2. Identify trusted adults: a teacher, school nurse, counsellor or another staff member she can approach if she needs assistance.
3. Discuss changing pads: she should know she can use an appropriate washroom to change her pad regularly.
4. Prepare for leaks: leaks can happen and aren't a personal failure. Teach her to change her pad and underwear where possible and ask a trusted adult for help.
5. Teach responsible disposal: wrap used pads and place them in the appropriate waste bin. Never flush sanitary pads.

## Talk to the School When Necessary

If menstruation is creating difficulties because of inadequate facilities, bullying, health needs or another concern, parents and caregivers may need to communicate with the school.

> Don't only pack sanitary pads. Pack knowledge with them. A girl who knows what to do has more options when something unexpected happens.`,
  }),
  parents({
    slug: "supporting-confidence-during-puberty", title: "Supporting Confidence During Puberty", kicker: "Help Her Like Who She's Becoming, Not Chase a \"Perfect\" Body",
    lede: "Puberty can make young people extremely aware of their appearance. Parents and caregivers have an important role in creating a healthier environment.",
    readMinutes: 3, image: null,
    body: `## Be Careful with Body Comments

Avoid teasing or repeatedly commenting on her weight, breast development, height, skin, body shape or how quickly or slowly she is developing. Even comments intended as jokes can affect confidence.

## Praise More Than Appearance

Notice her:

- Kindness
- Creativity
- Curiosity
- Courage
- Responsibility
- Effort
- Problem-solving
- Talents
- Leadership
- Academic progress

Help her understand that her value isn't determined by how she looks.

## Watch Your Own Language

Young people listen to how adults talk about their own bodies and other people's bodies. Model respectful language.

## Teach Social Media Awareness

Help her understand that online images may be carefully selected, posed, filtered or edited. She shouldn't measure normal development against a curated screen.

> Instead of teaching her to ask "Am I pretty enough?", help her develop a much bigger question: "Who am I becoming?"`,
  }),
  parents({
    slug: "separating-period-facts-from-myths", title: "Separating Period Facts from Myths", kicker: "What We Teach Matters",
    lede: "Period myths can pass from one generation to another. Some may seem harmless. Others can create fear, shame or unhealthy hygiene practices.",
    readMinutes: 3, image: null,
    body: `## Myth: Menstruation is dirty.

Fact: menstruation is a normal biological process. Menstrual hygiene matters, but menstruating doesn't make someone unclean or inferior.

## Myth: Girls shouldn't talk about periods.

Fact: appropriate menstrual education helps young people understand their bodies and manage menstruation more confidently.

## Myth: Everyone's period should be the same.

Fact: cycle length, menstrual flow and symptoms can vary between individuals and sometimes between cycles.

## Myth: A girl should know how to manage her period automatically.

Fact: menstrual hygiene is learned. Show her how to use products, dispose of them responsibly, track her cycle and recognise when she needs help.

## Myth: Period pain should always be endured.

Fact: some menstrual discomfort is common, but severe, worsening or disruptive symptoms should be assessed appropriately.

## Myth: Vaginal discharge automatically means something is wrong.

Fact: normal vaginal discharge can occur during puberty and throughout the menstrual cycle. Significant changes, or discharge with irritation, pain or a strong unusual odour, should be discussed with a healthcare professional.

> Before passing on something you were told growing up, ask: "Is this medically accurate, or is it simply something our generation was taught?" Pass on knowledge, not misinformation.`,
  }),
  parents({
    slug: "when-to-seek-medical-advice", title: "Knowing When to Seek Professional Medical Advice", kicker: "Know When a Conversation Needs a Healthcare Professional",
    lede: "Parents and caregivers don't need to diagnose menstrual or puberty-related health concerns themselves. Your role is to notice, listen and seek professional advice when needed.",
    readMinutes: 3, image: null,
    body: `## Seek Medical Advice When You're Concerned About:

- Very heavy menstrual bleeding: bleeding that is unusually heavy, needs very frequent product changes, lasts unusually long, or comes with significant weakness or dizziness.
- Severe period pain: pain that is severe, worsening, doesn't respond to ordinary measures, or repeatedly keeps her from school or normal activities.
- Significant changes in her menstrual pattern: cycles can be irregular at first, but persistent or concerning changes should be discussed with a qualified professional.
- Puberty development: if puberty seems to begin unusually early, hasn't started when expected, or her periods haven't begun within the expected stage of development.
- Unusual vaginal symptoms: discharge with persistent itching, burning, pain, irritation, a strong unusual odour or a significant unexpected change.
- Fainting, severe weakness or feeling very unwell: symptoms that appear serious or urgent should receive prompt medical attention.
- Emotional wellbeing: persistent or significant changes in mood, behaviour, sleep, school participation or everyday functioning.

## Trust What She Tells You

If she repeatedly says "Something doesn't feel right", listen. Taking her concerns seriously helps teach an important lifelong skill: speaking up about her health.

> You don't need to have the diagnosis. You need to know when it's time to ask someone qualified. Listen. Observe. Ask. Seek help when needed.`,
  }),

  // Care tips -------------------------------------------------------------------------------------------------
  {
    slug: "tips-for-a-healthy-smile", title: "Tips for a Healthy Smile", kicker: "Your Best Smiles", category: "care-tips",
    topic: { label: "Oral Care", tone: BLUE }, date: null, readMinutes: 2, range: "oral-care",
    image: { src: "/images/oral-care.webp", alt: "A smiling man brushing his teeth with Yazz toothpaste on the counter" },
    lede: "Make good oral hygiene part of every day, with simple brushing habits for the whole family.",
    body: `- Visit the dentist regularly for check-ups.
- Brush twice a day, for two minutes, with fluoride toothpaste where age-appropriate.
- Rinse your mouth after every meal.
- Do not eat sweet sticky food between meals.
- Change the brush after every 3 months.

## Follow the Correct Brushing Technique

Hold the brush with your elbow raised up to shoulder level, and brush in a circular, up and down motion.

## Look After Your Toothbrush

Yazz toothbrushes have a unique bristle that helps remove plaque and stains, and many come with a tongue cleaner designed to gently clean the tongue.

> Dentist recommendation: change your toothbrush at least once every three months.`,
  },
  {
    slug: "laundry-care-with-yazz-activ", title: "Laundry Care with Yazz® Activ", kicker: "Brighter and Fresher, Wash after Wash", category: "care-tips",
    topic: { label: "Home Care", tone: PURPLE }, date: null, readMinutes: 2, range: "home-care", image: null,
    lede: "Make everyday laundry care simpler with clear instructions for use, storage and responsible disposal.",
    body: `## Sort Your Laundry

Separate coloured clothes from white and wash them in different basins. Yazz Activ is suitable for cotton, linen, polyester and mixtures of those fabrics. Don't use it for silk or wool clothes.

## Dissolve and Soak

Dissolve Yazz Activ detergent with enzymes in water and soak clothes for 15 to 20 minutes before washing. For heavy dirt or more clothes, soak for longer and use more detergent accordingly.

## Use the Right Amount

Wash by quantity of clothes against weight. Check the pack for directions at all times.

## Store It Safely

- Keep the product in a dry place and out of reach of children.
- In case of eye contact, flush with plenty of water.
- If swallowed, drink plenty of clean water or milk and seek medical assistance.
- In case of irritation on the skin, discontinue use and seek medical assistance.

> Stay bright, fresher and stain free with Yazz Activ detergent with enzymes.`,
  },
  {
    slug: "diaper-changing-routines", title: "Diaper Changing Routines", kicker: "Clean, Dry and Comfortable", category: "care-tips",
    topic: { label: "Baby Care", tone: GREEN }, date: null, readMinutes: 2, range: "baby-care", image: null,
    lede: "Everyday care for growing families: practical guidance on changing routines, fit and safe product handling.",
    body: `## Before You Change

- Wash your hands before changing your baby's diaper.
- Make sure your baby is clean and dry before putting on a fresh diaper.

## Putting on a Yazz® Diaper

1. Place baby on the diaper with the two back tapes at the back.
2. Attach the two back tapes on the refastenable area to fit your baby.
3. Pull the elastic leg bands towards the side to prevent leakage.
4. Pull up the tape to check whether the diaper is wet.

## After the Change

Change used diapers to keep your baby comfortable, and throw them away immediately to avoid bacteria. Do not flush diapers or baby wipes: dispose of them with normal household waste.

> Plastic bags are dangerous for children and must be kept out of reach.`,
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-01" to "January 2026". */
export const monthLabel = (d: string) => {
  const [y, m] = d.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** Newest dated articles first, then the undated ones in file order. */
export function sortedArticles(list: Article[] = ARTICLES): Article[] {
  return list
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (y.a.date ?? "").localeCompare(x.a.date ?? "") || x.i - y.i)
    .map(({ a }) => a);
}

/** The Tips Just 4 You landing tiles (Lexta's "What would you like to know today?"), each opening its article. */
export const TOPIC_TILES: { title: string; body: string; slug: string }[] = [
  { title: "My First Period", body: "Everything you need to feel more prepared.", slug: "understanding-your-first-period" },
  { title: "Choose My Yazz®", body: "Learn how to select protection for your needs.", slug: "which-pad-is-right-4-me" },
  { title: "Feeling Fresh", body: "Simple menstrual and everyday hygiene tips.", slug: "feeling-fresh-every-day" },
  { title: "Puberty & Me", body: "Understand some of the changes that come with growing up.", slug: "what-happens-during-puberty" },
  { title: "Periods at School", body: "Preparation and confidence for school days.", slug: "periods-at-school" },
  { title: "Myths & Facts", body: "Separate menstrual facts from common misconceptions.", slug: "period-myths-vs-facts" },
];
