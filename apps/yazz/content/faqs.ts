/**
 * The FAQs page (/faqs): the accordion of the prototype's FAQs page. The questions are Lexta's 13 "Ask Yazz®"
 * questions (docs/content/yazz/tips-just-4-you/11-ask-yazz.md); each answer quotes Lexta's own articles and tips and
 * links to the article that says more. The Products and Where to Buy items are headed with Lexta's own headings
 * (About, Contact) and quote that copy. Shop topics are left out: the Yazz site sells nothing online (contract scope).
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
        a: "During the menstrual cycle, the lining of the uterus builds up. If pregnancy does not occur, the body sheds this lining through the vagina. The blood and tissue leaving the body are what we call a menstrual period.",
        link: article("understanding-your-first-period"),
      },
      {
        q: "When might I get my first period?",
        a: "There isn't a single date or age that applies to everyone. Your first period generally happens after other puberty changes have begun.",
        link: article("common-puberty-questions"),
      },
      {
        q: "How do I know my period is coming?",
        a: "Getting familiar with your own cycle can help you recognise your usual pattern and prepare for your period. Tracking your cycle can help you understand your usual pattern and prepare for future periods.",
        link: article("common-puberty-questions"),
      },
      {
        q: "How do I use a sanitary pad?",
        a: "Wash and dry your hands. Remove the pad from its individual wrapper. Peel away the protective backing. Position the pad securely in the centre of your underwear. If your Yazz® pad has wings, fold them around the sides of your underwear to help keep the pad in place. Never flush sanitary pads down the toilet.",
        link: article("how-to-use-a-sanitary-pad"),
      },
      {
        q: "How often should I change my pad?",
        a: "Change your pad regularly according to your menstrual flow, comfort needs and the instructions provided with the product. Don't continue wearing a pad once it is saturated or uncomfortable.",
        link: article("common-puberty-questions"),
      },
      {
        q: "Which Yazz® pad should I choose?",
        a: "Your flow can change during your period. What feels suitable during the first few days may be different from what you prefer toward the end of your period.",
        link: article("which-pad-is-right-4-me"),
      },
      {
        q: "Can I go to school during my period?",
        a: "Yes. Most people can continue their usual activities during their period, depending on how they feel.",
        link: article("periods-at-school"),
      },
      {
        q: "How do I dispose of my sanitary pad?",
        a: "Wrap the used pad securely before placing it in an appropriate waste bin. Wash your hands afterwards. Never flush sanitary pads down the toilet.",
        link: article("how-to-use-a-sanitary-pad"),
      },
      {
        q: "Why can my menstrual flow change?",
        a: "Your flow can change during your period. What feels suitable during the first few days may be different from what you prefer toward the end of your period. Cycle length, menstrual flow and symptoms can vary between individuals and sometimes between cycles.",
        link: article("which-pad-is-right-4-me"),
      },
      {
        q: "How can I prepare for my first period?",
        a: "Learning about menstruation before your first period can make the experience feel much more manageable.",
        link: article("understanding-your-first-period"),
      },
      {
        q: "How do I talk to my parents or caregiver about periods?",
        a: "You don't need a perfect opening. Try something simple: \"I have a question about my period.\" You could write your question down first or choose a quiet moment to speak.",
        link: article("talking-to-a-trusted-adult"),
      },
      {
        q: "What should I keep in my period kit?",
        a: "Sanitary pads, clean underwear, tissues, a small disposal bag and a period calendar or tracker.",
        link: article("understanding-your-first-period"),
      },
      {
        q: "When should I talk to a healthcare professional?",
        a: "Don't rely only on friends or social media for health information. Speak with a parent, caregiver, trusted adult or qualified healthcare professional.",
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
        q: "Proudly From Lexta Ghana Limited",
        a: "Yazz® forms part of the brand portfolio of Lexta Ghana Limited, a 100% Ghanaian consumer goods company committed to developing products and brands that serve evolving consumer needs.",
      },
      {
        q: "Look for the Yazz® Mark",
        a: "The Yazz® name, logo, brand identity and associated trademarks are proprietary assets of Lexta Ghana Limited and distinguish genuine Yazz® products in the marketplace. Imitation is not permitted; reporting will be rewarded. Blow the whistle: +233 50 996 7400 or via email support@yazzproducts.com.",
      },
      {
        q: "Consumer Reports",
        a: "In the highly unlikely event of irritation, please discontinue use and share a report to +233 50 996 7400 or via email support@yazzproducts.com.",
      },
      {
        q: "Consumer Support",
        a: "We are here to listen, serve and support. If you have a question or concern, tell us the product, batch information, purchase location and what happened. You may attach photographs where appropriate. Your enquiry will be handled by our consumer-care team. support@yazzproducts.com.",
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
        q: "Distributors, Wholesale and Modern Trade",
        a: "[PLACEHOLDER: how retailers, wholesalers and distributors buy Yazz, with minimum order quantities, from Lexta]",
        link: { href: "/contact#where-to-buy", label: "Find a stockist" },
      },
      {
        q: "Stockist Enquiry",
        a: "Contact Yazz Products for all inquiries. Enquiries: info@yazzproducts.com.",
        link: { href: "/contact#trade", label: "Trade enquiry" },
      },
    ],
  },
];
