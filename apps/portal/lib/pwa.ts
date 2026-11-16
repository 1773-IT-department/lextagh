import type { AppRole } from "@lexta/db";

/**
 * The two phone apps of the Business System: Field Sales (sales reps log shop visits) and the CSR Tracker (marketing
 * logs CSR activities). Each is an installable web app (PWA) with its own manifest and icons; both share one service
 * worker (/lexta-sw.js). Anyone can open the install page; using the app still needs a login with the right role
 * (accounts come from Users and access).
 */
export type PwaKey = "field-sales" | "csr";

export type PwaApp = {
  key: PwaKey;
  /** Full name on the install page and in the phone's app list. */
  name: string;
  /** Name under the icon on the home screen (12 characters or fewer). */
  shortName: string;
  description: string;
  /** Where the installed app opens. */
  startUrl: string;
  /** Public page that installs the app; this is the link people share. */
  installPath: string;
  manifestPath: string;
  themeColor: string;
  backgroundColor: string;
  /** Roles that may open the app's system (same as the database role checks). */
  useRoles: AppRole[];
  /** Roles that see the "Share install link" panel. */
  shareRoles: AppRole[];
  /** Who the app is for, in the share message. */
  audience: string;
};

export const PWA_APPS: Record<PwaKey, PwaApp> = {
  "field-sales": {
    key: "field-sales",
    name: "Lexta Field Sales",
    shortName: "Field Sales",
    description: "Log shop visits on your phone: the shop, a photo, what happened and your location.",
    startUrl: "/systems/field-sales?source=app",
    installPath: "/install/field-sales",
    manifestPath: "/pwa/field-sales.webmanifest",
    themeColor: "#0b2f3d",
    backgroundColor: "#0b2f3d",
    useRoles: ["admin", "management", "sales_rep"],
    shareRoles: ["admin", "management"],
    audience: "field sales reps",
  },
  csr: {
    key: "csr",
    name: "Lexta CSR Tracker",
    shortName: "CSR Tracker",
    description: "Log CSR activities on your phone: when, where, how many people it reached, with photos.",
    startUrl: "/systems/csr?source=app",
    installPath: "/install/csr",
    manifestPath: "/pwa/csr.webmanifest",
    themeColor: "#0d8ba8",
    backgroundColor: "#0d8ba8",
    useRoles: ["admin", "management", "marketing"],
    shareRoles: ["admin", "management", "marketing"],
    audience: "the CSR team",
  },
};

export const isPwaKey = (v: string): v is PwaKey => v === "field-sales" || v === "csr";

export const canSharePwa = (key: PwaKey, role: AppRole | null | undefined) => !!role && PWA_APPS[key].shareRoles.includes(role);

/** The portal's public address for share links: the configured one, otherwise the address this request came in on. */
export function portalOrigin(host: string | null, proto: string | null): string {
  const configured = (process.env.NEXT_PUBLIC_PORTAL_URL ?? "").trim().replace(/\/+$/, "");
  if (/^https?:\/\/[^/\s]+$/.test(configured)) return configured;
  const h = (host ?? "").trim();
  if (/^[a-z0-9.-]+(:\d+)?$/i.test(h)) return `${proto === "http" ? "http" : "https"}://${h}`;
  return "https://lexta-portal.vercel.app";
}

/** The text sent with the link on WhatsApp or SMS. */
export const shareMessage = (app: PwaApp, url: string) =>
  `Install the ${app.name} app on your phone: ${url}\nOpen the link, tap Install app, then sign in with your Lexta Business System login.`;
