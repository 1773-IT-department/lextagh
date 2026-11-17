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
export const FAQ: { id: string; title: string; tone: string; items: Item[] }[] = [
  { id: "fem", title: "Feminine Care", tone: "#C2185B", items: [
    ["Which Linzzy sanitary towel should I choose?", "Start by observing your usual menstrual pattern. Consider how quickly your sanitary towel becomes saturated, your daily activities and whether you experience leakage. Heavy Flow is a higher-absorbency option for heavier days, Extra Long offers extended coverage, including during rest or overnight use, and Cool Mint is a sanitary towel option for consumers who prefer the cooling sensation associated with this variant. Cooling products may not suit everyone, particularly those with sensitive skin.", "Read the article", "know-your-flow"],
    ["Is a longer towel more absorbent?", "Remember that a longer towel is not automatically more absorbent. Always check the absorbency and product information on the packaging.", "Read the article", "know-your-flow"],
    ["How often should I change my sanitary towel?", "A general guide is every 4 to 6 hours, or sooner if saturated, depending on your flow and product instructions.", "Read the article", "period-hygiene-101"],
    ["When should I use a panty liner instead of a sanitary towel?", "Panty liners can be useful during very light spotting, towards the end of a period or for occasional everyday discharge when preferred. They are not a substitute for sanitary towels during moderate or heavy menstrual bleeding.", "Read the article", "panty-liners-explained"],
    ["Should I wear panty liners every day?", "Daily use is not necessary for everyone. Some people prefer them occasionally, while others find that prolonged use contributes to irritation or moisture retention. If you notice irritation, stop using the product and consider seeking professional advice.", "Read the article", "panty-liners-explained"],
    ["Is the Cool Mint towel right for sensitive skin?", "Cooling ingredients or sensations may cause discomfort in sensitive individuals. Stop use immediately if irritation, burning or an uncomfortable cooling sensation occurs. Do not use on already irritated or broken skin.", "See Linzzy Cool Mint", "fem"],
    ["How do I dispose of a used sanitary towel?", "Wrap used sanitary towels securely and place them in an appropriate waste bin. Never flush them.", "Read the article", "period-hygiene-101"],
    ["When should I speak to a healthcare professional about my period?", "Seek medical advice for unusually heavy bleeding, severe pain, bleeding between periods, or major changes in your usual cycle. Heavy bleeding that causes faintness or significant weakness warrants urgent medical attention.", "Read the article", "beyond-the-pad"],
  ] },
  { id: "baby", title: "Baby Care", tone: "#0E7A5B", items: [
    ["Which Linzzy diaper size does my baby need?", "Weight ranges on diaper packaging are generally a better starting point than age alone. Linzzy Medium (M) is for 6 to 9 kg and Large (L) for 9 to 13 kg. Always refer to the size information printed on the product packaging.", "Read the article", "diaper-size"],
    ["How do I know it is time for the next diaper size?", "Frequent leaks, deep marks around the waist or thighs, difficulty fastening the diaper, gaps around the legs or a baby who seems uncomfortable can all be signs that your baby may need a different diaper size.", "Read the article", "diaper-size"],
    ["How often should I change my baby's diaper?", "Change diapers promptly after bowel movements and regularly whenever wet or soiled. Newborns generally require more frequent changes than older babies.", "Read the article", "diaper-changing"],
    ["Can I flush baby wipes?", "No. Used baby wipes should be placed in an appropriate waste bin. Conventional wipes can contribute to blocked pipes and sewer problems.", "Read the article", "baby-wipes-101"],
    ["How should I store baby wipes?", "Store wipes in a cool, dry place, away from direct sunlight and excessive heat. Keep the package securely closed and follow the storage instructions on the label.", "Read the article", "baby-wipes-101"],
    ["My baby has sensitive skin. What should I do?", "Some babies may be sensitive to fragrances, preservatives or other ingredients in wipes. For babies with sensitive or irritated skin, plain water and a soft cloth may be preferable. Discontinue use if redness, itching or irritation occurs, and consult a healthcare professional for persistent or worsening irritation.", "See Linzzy Baby Wipes", "baby"],
    ["What should I pack in a diaper bag?", "Enough diapers for your outing plus a few extras, baby wipes within reach, a changing mat, spare clothing, hygiene essentials such as hand sanitizer and disposal bags, and feeding and comfort items.", "Read the article", "diaper-bag"],
  ] },
  { id: "wtb", title: "Where to Buy", tone: "#5B1A7A", items: [
    ["Where can I buy Linzzy products?", "Use Where to Buy on our Contact page: choose your region, search by town or shop, and see the shops that stock Linzzy on the map.", "Find a stockist", "wtb"],
    ["Can I buy Linzzy on this website?", "This website does not sell products. Find a shop near you with Where to Buy, or contact our team.", "Find a stockist", "wtb"],
    ["I want to distribute or stock Linzzy. Who do I contact?", "Contact our team to discuss product availability, distribution opportunities and commercial enquiries.", "Send a trade enquiry", "trade"],
  ] },
  { id: "about", title: "About Linzzy", tone: "#23103a", items: [
    ["Who makes Linzzy?", "Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited, a Ghanaian company with a portfolio of household, personal care and family-focused brands.", "About Linzzy", "about"],
    ["What products does Linzzy make?", "Our product portfolio includes sanitary towels, panty liners, baby diapers and baby wipes, offering practical choices for different care routines.", "See all products", "products"],
    ["I have a concern about a Linzzy product. What should I include?", "Where relevant, kindly provide the product name and variant, the batch number and manufacturing or expiry information, the place and approximate date of purchase, a photograph of the product packaging and a brief description of your concern. Our team will review your submission and advise on the appropriate next steps.", "Report a problem", "problem"],
  ] },
];
export const CHIPS: [string, string, string][] = [["all", "All topics", "#23103a"], ["fem", "Feminine Care", "#C2185B"], ["baby", "Baby Care", "#0E7A5B"], ["wtb", "Where to Buy", "#5B1A7A"], ["about", "About Linzzy", "#23103a"]];

