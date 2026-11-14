/**
 * Addresses and contact details the Hooch site uses everywhere.
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

export const LEXTA_PREVIEW_URL = "https://lexta-web-git-nextjs-1773-hr-consultancy-and-marketing.vercel.app";
export const lextaSiteUrl = (process.env.NEXT_PUBLIC_LEXTA_SITE_URL || LEXTA_PREVIEW_URL).replace(/\/+$/, "");

/** Pages of the Lexta site that Hooch links to (community programmes, careers, legal). */
export const lexta = {
  home: `${lextaSiteUrl}/`,
  csr: `${lextaSiteUrl}/corporate-social-responsibility`,
  careers: `${lextaSiteUrl}/careers`,
  privacy: `${lextaSiteUrl}/privacy-policy`,
  terms: `${lextaSiteUrl}/terms-and-conditions`,
};

/**
 * Hooch contact details, from Lexta's "Hooch Foods website content.docx" (Contact Us tab). The phone list is the same
 * Lexta list as on the Yazz and Linzzy sites; the emails are the @hoochfoods.com addresses that document gives (to be
 * confirmed: Lexta's PDF routes Hooch to @linzzyproducts.com addresses, and hoochfoods.com does not serve a working site
 * yet, see CONTENT-NEEDED.md). The document's line "Contact Yazz Products for all inquiries" is a copy slip from the
 * Yazz document and is not shown. Text and mailto only.
 */
export const contact = {
  company: "Lexta Ghana Limited",
  addressLines: ["Lexta Square, Olusegun Obasanjo Highway", "Dzorwulu, Accra, Ghana"],
  phones: ["+233 302 235 296", "+233 302 662 970", "+233 501 619 588", "+233 544 351 010"],
  whatsappCare: "+233 544 351 010",
  consumerReports: "+233 50 996 7400",
  enquiriesEmail: "info@hoochfoods.com",
  partnershipsEmail: "marketing@hoochfoods.com",
  /** Complaints and product reviews; also where the forms and chat send people when they cannot send. */
  supportEmail: "support@hoochfoods.com",
  /** Distributors and business enquiries. */
  tradeEmail: "info@hoochfoods.com",
  officeHours: "[PLACEHOLDER: Hooch consumer care hours]",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb7CGlb35fLvDzjVPU41",
};

export const tel = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
export const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/** Hooch social accounts: Lexta's content names none for Hooch, so only the Lexta WhatsApp channel links out. */
export const socials: { label: string; icon: "whatsapp" | "facebook" | "instagram" | "tiktok"; href: string | null }[] = [
  { label: "Follow Lexta Ghana on WhatsApp", icon: "whatsapp", href: contact.whatsappChannel },
  { label: "Hooch on Facebook", icon: "facebook", href: null },
  { label: "Hooch on Instagram", icon: "instagram", href: null },
  { label: "Hooch on TikTok", icon: "tiktok", href: null },
];
