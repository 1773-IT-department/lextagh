/**
 * Addresses and contact details the Yazz site uses everywhere.
 *
 * siteUrl: this site's public address for canonical links and Open Graph. NEXT_PUBLIC_SITE_URL first (Desmond sets
 * the real domain at go-live), then the Vercel project's stable address; with neither, links stay relative.
 *
 * lextaSiteUrl: the Lexta corporate site, where CSR, Careers and the privacy policy live (brand sites have no CSR or
 * careers pages). NEXT_PUBLIC_LEXTA_SITE_URL, else the lexta-web preview. Never a real Lexta domain here.
 */
const vercelHost =
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  process.env.VERCEL_BRANCH_URL ||
  process.env.VERCEL_URL ||
  "";
const vercelUrl = vercelHost ? `https://${vercelHost}` : "";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || vercelUrl).replace(/\/+$/, "");
export const metadataBase = siteUrl ? new URL(siteUrl) : undefined;

export const LEXTA_PREVIEW_URL = "https://lexta-web-git-claude-b-856ed5-1773-hr-consultancy-and-marketing.vercel.app";
export const lextaSiteUrl = (process.env.NEXT_PUBLIC_LEXTA_SITE_URL || LEXTA_PREVIEW_URL).replace(/\/+$/, "");

/** Pages of the Lexta site that Yazz links to. */
export const lexta = {
  home: `${lextaSiteUrl}/`,
  csr: `${lextaSiteUrl}/corporate-social-responsibility`,
  careers: `${lextaSiteUrl}/careers`,
  privacy: `${lextaSiteUrl}/privacy-policy`,
  terms: `${lextaSiteUrl}/terms-and-conditions`,
};

/**
 * Yazz contact details, from Lexta's website content ("yazz website content.docx", Contact). The emails are Lexta's
 * own addresses for Yazz; shown as text and mailto links only.
 */
export const contact = {
  company: "Lexta Ghana Limited",
  addressLines: ["Lexta Square, Olusegun Obasanjo Highway", "Dzorwulu, Accra, Ghana"],
  phones: ["+233 302 235 296", "+233 302 662 970", "+233 501 619 588", "+233 544 351 010"],
  whatsappCare: "+233 544 351 010",
  consumerReports: "+233 50 996 7400",
  enquiriesEmail: "info@yazzproducts.com",
  partnershipsEmail: "marketing@yazzproducts.com",
  /** Complaints and product reviews; also where the forms and chat send people when they cannot send. */
  supportEmail: "support@yazzproducts.com",
  /** Where trade and stockist enquiries can write when the form cannot send. */
  tradeEmail: "marketing@yazzproducts.com",
  officeHours: "[PLACEHOLDER: Yazz consumer care hours]",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb7CGlb35fLvDzjVPU41",
};

export const tel = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
export const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/**
 * Yazz social accounts. Lexta's content gives only the Lexta Ghana WhatsApp channel; the other handles are placeholders
 * until Lexta sends them (CONTENT-NEEDED.md). A link without a real address is shown as a plain icon, not a link.
 */
export const socials: { label: string; icon: "whatsapp" | "facebook" | "instagram" | "tiktok" | "youtube"; href: string | null }[] = [
  { label: "Follow Lexta Ghana on WhatsApp", icon: "whatsapp", href: contact.whatsappChannel },
  { label: "Yazz on Facebook", icon: "facebook", href: null },
  { label: "Yazz on Instagram", icon: "instagram", href: null },
  { label: "Yazz on TikTok", icon: "tiktok", href: null },
  { label: "Yazz on YouTube", icon: "youtube", href: null },
];
