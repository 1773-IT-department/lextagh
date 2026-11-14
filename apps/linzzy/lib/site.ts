/**
 * Addresses and contact details the Linzzy site uses everywhere.
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

/** Pages of the Lexta site that Linzzy links to. */
export const lexta = {
  home: `${lextaSiteUrl}/`,
  csr: `${lextaSiteUrl}/corporate-social-responsibility`,
  careers: `${lextaSiteUrl}/careers`,
  privacy: `${lextaSiteUrl}/privacy-policy`,
  terms: `${lextaSiteUrl}/terms-and-conditions`,
};

/**
 * Linzzy contact details, from Lexta's "Linzzy Website Content.docx" (Contact Us page). The phone list there is the
 * same Lexta list as on the Yazz site; the emails are the @linzzyproducts.com addresses that document gives (to be
 * confirmed: the original linzzyproducts.com shows Lexta addresses only, see CONTENT-NEEDED.md). Text and mailto only.
 */
export const contact = {
  company: "Lexta Ghana Limited",
  addressLines: ["Lexta Square, Olusegun Obasanjo Highway", "Dzorwulu, Accra, Ghana"],
  phones: ["+233 302 235 296", "+233 302 662 970", "+233 501 619 588", "+233 544 351 010"],
  whatsappCare: "+233 544 351 010",
  consumerReports: "+233 50 996 7400",
  enquiriesEmail: "info@linzzyproducts.com",
  partnershipsEmail: "marketing@linzzyproducts.com",
  /** Complaints and product reviews; also where the forms and chat send people when they cannot send. */
  supportEmail: "support@linzzyproducts.com",
  /** Distributors and business enquiries (Lexta's content: info@linzzyproducts.com). */
  tradeEmail: "info@linzzyproducts.com",
  officeHours: "[PLACEHOLDER: Linzzy consumer care hours]",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb7CGlb35fLvDzjVPU41",
  handle: "@Linzzyproducts",
};

export const tel = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
export const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/**
 * Linzzy social accounts. Lexta's content lists Facebook, Instagram, TikTok and X under @Linzzyproducts without links.
 * Facebook and Instagram are the accounts linked from the original linzzyproducts.com
 * (docs/content/linzzy/original-site/contacts.md); TikTok and X stay placeholders until Lexta sends them.
 */
export const socials: { label: string; icon: "whatsapp" | "facebook" | "instagram" | "tiktok" | "x"; href: string | null }[] = [
  { label: "Follow Lexta Ghana on WhatsApp", icon: "whatsapp", href: contact.whatsappChannel },
  { label: "Linzzy on Facebook", icon: "facebook", href: "https://www.facebook.com/people/Linzzy-Product/61572662232439/" },
  { label: "Linzzy on Instagram", icon: "instagram", href: "https://www.instagram.com/linzzy_products/" },
  { label: "Linzzy on TikTok", icon: "tiktok", href: null },
  { label: "Linzzy on X", icon: "x", href: null },
];
