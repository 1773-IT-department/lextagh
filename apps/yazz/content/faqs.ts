/**
 * The FAQs page (/faqs): the accordion of the prototype's FAQs page. The questions are Lexta's "Ask Yazz®"
 * list ("yazz article.docx") plus where to buy and trade questions; each answer uses Lexta's own wording from the
 * articles and product content and links to the article that says more. Shop topics (orders, payment, delivery,
 * returns) are left out: the Yazz site sells nothing online (contract scope).
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
    id: "ask-yazz",
    name: "Ask Yazz®",
    icon: "heart",
    items: [
      {
        q: "What is a period?",
        a: "A period is part of the menstrual cycle. The lining of the uterus builds up and, if pregnancy does not occur, the body sheds it through the vagina as blood and tissue.",
        link: article("understanding-your-first-period"),
      },
      {
        q: "When might I get my first period?",
        a: "There isn't a single date or age that applies to everyone. Your first period generally happens after other puberty changes have begun.",
        link: article("common-puberty-questions"),
      },
      {
        q: "How do I know my period is coming?",
        a: "Getting familiar with your own cycle can help you recognise your usual pattern and prepare for your period. Tracking your cycle with a period tracker or calendar can help you understand your usual pattern and prepare for future periods.",
        link: article("common-puberty-questions"),
      },
      {
        q: "How do I use a sanitary pad?",
        a: "Wash your hands, unwrap the pad, peel away the backing, position it in the centre of your underwear and fold the wings around the sides. Change regularly, wrap and bin the used pad, and wash your hands. Never flush pads.",
        link: article("how-to-use-a-sanitary-pad"),
      },
      {
        q: "How often should I change my pad?",
        a: "Regularly, according to your flow, comfort needs and the instructions provided with the product. Don't keep wearing a pad once it is saturated or uncomfortable.",
        link: article("common-puberty-questions"),
      },
      {
        q: "Which Yazz® pad should I choose?",
        a: "Think about your flow, your day, your comfort and whether it is day or night, then compare the options using the details on their approved packaging.",
        link: article("which-pad-is-right-4-me"),
      },
      {
        q: "Can I go to school during my period?",
        a: "Yes. Most people can continue their usual activities during their period, depending on how they feel. A period kit in your school bag helps.",
        link: article("periods-at-school"),
      },
      {
        q: "How do I dispose of my sanitary pad?",
        a: "Wrap the used pad and place it in a waste bin, then wash your hands. Never flush pads.",
        link: article("how-to-use-a-sanitary-pad"),
      },
      {
        q: "Why can my menstrual flow change?",
        a: "Your flow can change during your period. What feels suitable during the first few days may be different from what you prefer toward the end of your period. Cycle length, menstrual flow and symptoms can vary between individuals and sometimes between cycles.",
        link: article("which-pad-is-right-4-me"),
      },
      {
        q: "How can I prepare for my first period?",
        a: "Learning about menstruation before your first period can make the experience feel much more manageable. Create a small Yazz® Period Kit for your school bag, handbag or backpack, and know which trusted adult you can ask for support.",
        link: article("understanding-your-first-period"),
      },
      {
        q: "How do I talk to my parents or caregiver about periods?",
        a: "You don't need a perfect opening. Try something simple, such as \"I have a question about my period.\" You could also write your question down first.",
        link: article("talking-to-a-trusted-adult"),
      },
      {
        q: "What should I keep in my period kit?",
        a: "Sanitary pads, clean underwear, tissues, a small disposal bag and a period calendar or tracker.",
        link: article("understanding-your-first-period"),
      },
      {
        q: "When should I talk to a healthcare professional?",
        a: "If you are worried about something happening to your body, speak with a parent, caregiver, trusted adult or qualified healthcare professional. Don't rely only on friends or social media.",
        link: article("common-puberty-questions"),
      },
    ],
  },
  {
    id: "products",
    name: "Products",
    icon: "box",
    items: [
      {
        q: "Who makes Yazz®?",
        a: "Yazz® is a trademark brand of Lexta Ghana Limited, a 100% Ghanaian consumer goods company.",
      },
      {
        q: "How do I know a Yazz® product is genuine?",
        a: "Look for the Yazz® mark. The Yazz® name, logo, brand identity and associated trademarks are proprietary assets of Lexta Ghana Limited and distinguish genuine Yazz® products. Imitation is not permitted; you can report it on +233 50 996 7400 or support@yazzproducts.com.",
      },
      {
        q: "What should I do if a product irritates my skin?",
        a: "In the highly unlikely event of irritation, discontinue use and report it on +233 50 996 7400 (WhatsApp) or support@yazzproducts.com.",
      },
      {
        q: "How do I report a problem with a product?",
        a: "Use the contact form and choose \"Report a problem with a product\". Tell us the product, batch information, purchase location and what happened. Your report goes to our consumer care team, and the form shows you a case number for it. To send photographs where appropriate, email support@yazzproducts.com.",
        link: { href: "/contact?topic=problem#message", label: "Report a problem" },
      },
    ],
  },
  {
    id: "where-to-buy",
    name: "Where to Buy",
    icon: "pin",
    items: [
      {
        q: "Can I order Yazz® online?",
        a: "Not from this website. Yazz® products are sold through distributors, wholesalers and shops; Where to Buy shows the stockists listed near you.",
        link: { href: "/contact#where-to-buy", label: "Find a stockist" },
      },
      {
        q: "How do I become a Yazz® stockist or distributor?",
        a: "Send us your business details, region and expected volumes through the trade enquiry form. Your enquiry goes to Lexta Ghana Limited.",
        link: { href: "/contact#trade", label: "Trade enquiry" },
      },
      {
        q: "What is the minimum bulk order?",
        a: "[PLACEHOLDER: minimum order quantities for retailers, wholesalers and distributors, from Lexta]",
      },
    ],
  },
];
