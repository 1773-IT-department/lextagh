// The FAQs of the prototype (Linzzy FAQs.dc.html), shared by the page (for its FAQ structured data) and the view.

export const LINKS: Record<string, string> = {
  tips: "/tips",
  fem: "/products?p=cool-mint-sanitary-towels",
  baby: "/products?p=baby-wipes",
  wtb: "/contact#where-to-buy",
  trade: "/contact#trade",
  about: "/about",
  products: "/products",
  problem: "/contact?topic=problem#message",
  question: "/contact?topic=question#message",
  "know-your-flow": "/tips/know-your-flow",
  "period-hygiene-101": "/tips/period-hygiene-101",
  "panty-liners-explained": "/tips/panty-liners-explained",
  "beyond-the-pad": "/tips/beyond-the-pad",
  "diaper-size": "/tips/is-your-baby-wearing-the-right-diaper-size",
  "diaper-changing": "/tips/diaper-changing-made-easier",
  "baby-wipes-101": "/tips/baby-wipes-101",
  "diaper-bag": "/tips/the-perfect-diaper-bag",
};

export type Item = [q: string, a: string, link: string, to: string];
// Strict source sweep: Lexta sent no Linzzy FAQ list, so every question is a heading Lexta wrote (the Tips & Advice
// articles, the product page and the Contact page) and every answer is the Drive text under that heading.
export const FAQ: { id: string; title: string; tone: string; items: Item[] }[] = [
  { id: "fem", title: "Feminine Care", tone: "#C2185B", items: [
    ["Getting to know Linzzy's sanitary towel range", "Linzzy Cool Mint: A sanitary towel option for consumers who prefer the cooling sensation associated with this variant. Cooling products may not suit everyone, particularly those with sensitive skin. Linzzy Heavy Flow: Designed as a higher-absorbency option for days when you need additional menstrual protection. Linzzy Extra Long: Offers extended coverage for those who prefer a longer sanitary towel, including during rest or overnight use.", "Read the article", "know-your-flow"],
    ["How to make the right choice", "Start by observing your usual menstrual pattern. Consider how quickly your sanitary towel becomes saturated, your daily activities and whether you experience leakage. Remember that a longer towel is not automatically more absorbent. Always check the absorbency and product information on the packaging.", "Read the article", "know-your-flow"],
    ["Change your sanitary towel regularly", "A general guide is every 4 to 6 hours, or sooner if saturated, depending on your flow and product instructions.", "Read the article", "period-hygiene-101"],
    ["When might a panty liner be useful?", "Panty liners can be useful during very light spotting, towards the end of a period or for occasional everyday discharge when preferred. Panty liners are not a substitute for sanitary towels during moderate or heavy menstrual bleeding.", "Read the article", "panty-liners-explained"],
    ["Should you wear panty liners every day?", "Daily use is not necessary for everyone. Some people prefer them occasionally, while others find that prolonged use contributes to irritation or moisture retention. If you notice irritation, stop using the product and consider seeking professional advice.", "Read the article", "panty-liners-explained"],
    ["Linzzy Cool Mint: Skin Sensitivity & Allergy Precautions", "Cooling ingredients or sensations may cause discomfort in sensitive individuals. Stop use immediately if irritation, burning or an uncomfortable cooling sensation occurs. Do not use on already irritated or broken skin.", "See Linzzy Cool Mint", "fem"],
    ["Dispose of used towels responsibly", "Wrap used sanitary towels securely and place them in an appropriate waste bin. Never flush them.", "Read the article", "period-hygiene-101"],
    ["What should you pay attention to?", "Track the start date, duration, approximate flow and any symptoms that affect your daily activities. Seek medical advice for unusually heavy bleeding, severe pain, bleeding between periods, or major changes in your usual cycle. Heavy bleeding that causes faintness or significant weakness warrants urgent medical attention.", "Read the article", "beyond-the-pad"],
  ] },
  { id: "baby", title: "Baby Care", tone: "#0E7A5B", items: [
    ["Should you choose diapers based on age or weight?", "Weight ranges on diaper packaging are generally a better starting point than age alone. However, body shape and fit also matter. Always refer to the size information printed on the product packaging.", "Read the article", "diaper-size"],
    ["Five signs your baby may need a different diaper size", "Frequent leaks. Deep marks around the waist or thighs. Difficulty fastening the diaper. Gaps around the legs. Your baby seems uncomfortable.", "Read the article", "diaper-size"],
    ["How often should you change a diaper?", "Change diapers promptly after bowel movements and regularly whenever wet or soiled. Newborns generally require more frequent changes than older babies. Check your baby's diaper often rather than waiting for visible discomfort.", "Read the article", "diaper-changing"],
    ["How should used baby wipes be disposed of?", "Used baby wipes should be placed in an appropriate waste bin. Never flush baby wipes down the toilet, even when they appear soft or breakable, unless local disposal guidance explicitly confirms a product is suitable for flushing. Conventional wipes can contribute to blocked pipes and sewer problems.", "Read the article", "baby-wipes-101"],
    ["How should baby wipes be stored?", "Store wipes in a cool, dry place, away from direct sunlight and excessive heat. Keep the package securely closed and follow the storage instructions on the label.", "Read the article", "baby-wipes-101"],
    ["Linzzy Baby Wipes: Skin Sensitivity & Allergy Precautions", "Some babies may be sensitive to fragrances, preservatives or other ingredients in wipes. Always review the product's ingredient information. For babies with sensitive or irritated skin, plain water and a soft cloth may be preferable. Discontinue use if redness, itching or irritation occurs. Avoid contact with eyes, mouth and broken skin. Never flush wipes down the toilet.", "See Linzzy Baby Wipes", "baby"],
    ["What should be in your diaper bag?", "A diaper bag is more than an accessory. It is your portable baby care station. Pack enough diapers. Keep baby wipes within reach. Carry a changing mat. Include spare clothing. Remember hygiene essentials. Include feeding and comfort items.", "Read the article", "diaper-bag"],
  ] },
  { id: "about", title: "About Linzzy", tone: "#23103a", items: [
    ["Interested in distributing or stocking Linzzy products?", "Contact our team to discuss product availability, distribution opportunities and commercial enquiries.", "Send a trade enquiry", "trade"],
    ["Part of the Lexta Ghana Family", "Linzzy is proudly part of Lexta Ghana Limited, a Ghanaian company with a portfolio of household, personal care and family-focused brands.", "About Linzzy", "about"],
    ["Have questions about our sanitary towels, panty liners, baby diapers or baby wipes?", "Contact us for information about product options, packaging, sizing and recommended usage.", "Ask a question", "question"],
    ["Consumer Feedback and Complaints", "If you have a concern about a Linzzy product, please contact our customer support team directly. Where relevant, kindly provide: the product name and variant; batch number and manufacturing or expiry information, where available; place and approximate date of purchase; a photograph of the product packaging; a brief description of your concern. Our team will review your submission and advise on the appropriate next steps.", "Report a problem", "problem"],
  ] },
];
export const CHIPS: [string, string, string][] = [["all", "All topics", "#23103a"], ["fem", "Feminine Care", "#C2185B"], ["baby", "Baby Care", "#0E7A5B"], ["about", "About Linzzy", "#23103a"]];

