/**
 * The FAQs page (/faqs). Lexta sent no FAQ list for Linzzy (the original linzzyproducts.com has none either), so every
 * answer here is Lexta's own wording, taken from the Linzzy product page, the Tips & Advice articles and the About and
 * Contact pages, each linking to where it says more. More questions can be added on request (CONTENT-NEEDED.md).
 * Shop topics (orders, payment, delivery, returns) are left out: the site sells nothing online (contract scope).
 */
export type FaqGroup = {
  id: string;
  name: string;
  icon: string;
  items: { q: string; a: string; link?: { href: string; label: string } }[];
};

const article = (slug: string) => ({ href: `/tips/${slug}`, label: "Read the article" });

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "feminine-care",
    name: "Feminine Care",
    icon: "female",
    items: [
      {
        q: "Which Linzzy sanitary towel should I choose?",
        a: "Start by observing your usual menstrual pattern. Consider how quickly your sanitary towel becomes saturated, your daily activities and whether you experience leakage. Heavy Flow is a higher-absorbency option for heavier days, Extra Long offers extended coverage, including during rest or overnight use, and Cool Mint suits those who prefer its cooling sensation.",
        link: article("know-your-flow"),
      },
      {
        q: "Is a longer towel more absorbent?",
        a: "Remember that a longer towel is not automatically more absorbent. Always check the absorbency and product information on the packaging.",
        link: article("know-your-flow"),
      },
      {
        q: "How often should I change my sanitary towel?",
        a: "A general guide is every 4 to 6 hours, or sooner if saturated, depending on your flow and product instructions.",
        link: article("period-hygiene-101"),
      },
      {
        q: "When should I use a panty liner instead of a sanitary towel?",
        a: "Panty liners can be useful during very light spotting, towards the end of a period or for occasional everyday discharge when preferred. They are not a substitute for sanitary towels during moderate or heavy menstrual bleeding.",
        link: article("panty-liners-explained"),
      },
      {
        q: "Should I wear panty liners every day?",
        a: "Daily use is not necessary for everyone. Some people prefer them occasionally, while others find that prolonged use contributes to irritation or moisture retention. If you notice irritation, stop using the product and consider seeking professional advice.",
        link: article("panty-liners-explained"),
      },
      {
        q: "Is the Cool Mint towel right for sensitive skin?",
        a: "Cooling ingredients or sensations may cause discomfort in sensitive individuals. Stop use immediately if irritation, burning or an uncomfortable cooling sensation occurs. Do not use on already irritated or broken skin.",
        link: { href: "/products/feminine-care#product-cool-mint-sanitary-towels", label: "See Linzzy Cool Mint" },
      },
      {
        q: "How do I dispose of a used sanitary towel?",
        a: "Wrap used sanitary towels securely and place them in an appropriate waste bin. Never flush them.",
        link: article("period-hygiene-101"),
      },
      {
        q: "When should I speak to a healthcare professional about my period?",
        a: "Seek medical advice for unusually heavy bleeding, severe pain, bleeding between periods, or major changes in your usual cycle. Heavy bleeding that causes faintness or significant weakness warrants urgent medical attention.",
        link: article("beyond-the-pad"),
      },
    ],
  },
  {
    id: "baby-care",
    name: "Baby Care",
    icon: "baby",
    items: [
      {
        q: "Which Linzzy diaper size does my baby need?",
        a: "Weight ranges on diaper packaging are generally a better starting point than age alone. Linzzy Medium (M) is for 6 to 9 kg and Large (L) for 9 to 13 kg. Always refer to the size information printed on the product packaging.",
        link: article("is-your-baby-wearing-the-right-diaper-size"),
      },
      {
        q: "How do I know it is time for the next diaper size?",
        a: "Frequent leaks, deep marks around the waist or thighs, difficulty fastening the diaper, gaps around the legs or a baby who seems uncomfortable can all be signs that your baby may need a different diaper size.",
        link: article("is-your-baby-wearing-the-right-diaper-size"),
      },
      {
        q: "How often should I change my baby's diaper?",
        a: "Change diapers promptly after bowel movements and regularly whenever wet or soiled. Newborns generally require more frequent changes than older babies.",
        link: article("diaper-changing-made-easier"),
      },
      {
        q: "Can I flush baby wipes?",
        a: "No. Used baby wipes should be placed in an appropriate waste bin. Conventional wipes can contribute to blocked pipes and sewer problems.",
        link: article("baby-wipes-101"),
      },
      {
        q: "How should I store baby wipes?",
        a: "Store wipes in a cool, dry place, away from direct sunlight and excessive heat. Keep the package securely closed and follow the storage instructions on the label.",
        link: article("baby-wipes-101"),
      },
      {
        q: "My baby has sensitive skin. What should I do?",
        a: "Some babies may be sensitive to fragrances, preservatives or other ingredients in wipes. For babies with sensitive or irritated skin, plain water and a soft cloth may be preferable. Discontinue use if redness, itching or irritation occurs, and consult a healthcare professional for persistent or worsening irritation.",
        link: { href: "/products/baby-care#product-baby-wipes", label: "See Linzzy Baby Wipes" },
      },
      {
        q: "What should I pack in a diaper bag?",
        a: "Enough diapers for your outing plus a few extras, baby wipes within reach, a changing mat, spare clothing, hygiene essentials such as hand sanitizer and disposal bags, and feeding and comfort items.",
        link: article("the-perfect-diaper-bag"),
      },
    ],
  },
  {
    id: "where-to-buy",
    name: "Where to Buy",
    icon: "pin",
    items: [
      {
        q: "Where can I buy Linzzy products?",
        a: "Use Where to Buy on our Contact page: choose your region, search by town or shop, and see the shops that stock Linzzy on the map.",
        link: { href: "/contact#where-to-buy", label: "Find a stockist" },
      },
      {
        q: "Can I buy Linzzy on this website?",
        a: "This website does not sell products. Find a shop near you with Where to Buy, or contact our team.",
        link: { href: "/contact#where-to-buy", label: "Find a stockist" },
      },
      {
        q: "I want to distribute or stock Linzzy. Who do I contact?",
        a: "Contact our team to discuss product availability, distribution opportunities and commercial enquiries.",
        link: { href: "/contact#trade", label: "Send a trade enquiry" },
      },
    ],
  },
  {
    id: "about-linzzy",
    name: "About Linzzy",
    icon: "heart",
    items: [
      {
        q: "Who makes Linzzy?",
        a: "Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited, a Ghanaian company with a portfolio of household, personal care and family-focused brands.",
        link: { href: "/about", label: "About Linzzy" },
      },
      {
        q: "What products does Linzzy make?",
        a: "Our product portfolio includes sanitary towels, panty liners, baby diapers and baby wipes, offering practical choices for different care routines.",
        link: { href: "/products", label: "See all products" },
      },
      {
        q: "I have a concern about a Linzzy product. What should I include?",
        a: "Where relevant, kindly provide the product name and variant, the batch number and manufacturing or expiry information, the place and approximate date of purchase, a photograph of the product packaging and a brief description of your concern. Our team will review your submission and advise on the appropriate next steps.",
        link: { href: "/contact?topic=problem#message", label: "Report a problem" },
      },
    ],
  },
];
