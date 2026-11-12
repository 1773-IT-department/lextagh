import type { AppRole } from "@lexta/db";

export type SystemDef = { slug: string; name: string; summary: string; roles: AppRole[] };

/**
 * The 8 systems from proposal 1773/LEX/2026-09, plus the shared chat inbox and user admin.
 * Stockists belong to Where to Buy and sit next to Product management.
 * Which roles see which system is the starting default; Desmond can change it.
 * Admin and management see everything. Distributors only see ordering (the signed in shell sends them nowhere else).
 * The database enforces access with Row Level Security; this list only shapes the navigation.
 */
export const SYSTEMS: SystemDef[] = [
  { slug: "dashboard", name: "Management dashboard", summary: "Orders, coverage, leads, complaints, CSR and KPIs at a glance.", roles: ["admin", "management"] },
  { slug: "orders", name: "Distributor ordering", summary: "Distributors place and track orders; sales confirms, dispatches and delivers.", roles: ["admin", "management", "sales_rep", "distributor"] },
  { slug: "field-sales", name: "Field sales", summary: "Shop visits on the phone, with photo and location.", roles: ["admin", "management", "sales_rep"] },
  { slug: "crm", name: "CRM", summary: "Leads, distributors, institutions and partners.", roles: ["admin", "management", "sales_rep", "customer_care", "marketing"] },
  { slug: "complaints", name: "Complaints", summary: "Case number, owner, status and closure.", roles: ["admin", "management", "customer_care", "sales_rep", "marketing"] },
  { slug: "products", name: "Product management", summary: "Edit a product once and the Lexta website updates.", roles: ["admin", "management", "marketing"] },
  { slug: "stockists", name: "Stockists (Where to Buy)", summary: "Shops, regions and brands carried, shown on Where to Buy.", roles: ["admin", "management", "sales_rep", "marketing", "customer_care"] },
  { slug: "csr", name: "CSR activities", summary: "CSR activities by programme: date, place, people reached and photos, with totals.", roles: ["admin", "management", "marketing"] },
  { slug: "recruitment", name: "Recruitment", summary: "Open roles and applications from the Careers page.", roles: ["admin", "management", "hr"] },
  { slug: "chat", name: "Live chat inbox", summary: "Answer visitors from the Lexta website in one place.", roles: ["admin", "management", "customer_care"] },
  { slug: "users", name: "Users and access", summary: "Invite people, set roles and brands.", roles: ["admin"] },
];

export function systemsFor(role: AppRole | null): SystemDef[] {
  if (!role) return [];
  return SYSTEMS.filter((s) => s.roles.includes(role));
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  management: "Management",
  sales_rep: "Sales rep",
  distributor: "Distributor",
  customer_care: "Customer care",
  hr: "HR",
  marketing: "Marketing",
};

/** The only part of the portal a distributor may open. */
export const DISTRIBUTOR_HOME = "/systems/orders";
export const isDistributorPath = (path: string) => path === DISTRIBUTOR_HOME || path.startsWith(`${DISTRIBUTOR_HOME}/`);

/**
 * May the signed in shell render for a distributor, given the path header the middleware set? Fails closed.
 *   a page request             only inside the ordering area
 *   a server action            only one sent from the ordering area (its redirects stay there) or from /login (sign in,
 *                              which always sends a distributor to their orders)
 *   no header or anything else  no
 */
export function distributorMayRender(header: string | null, actionPrefix: string): boolean {
  if (!header) return false;
  if (header.startsWith(actionPrefix)) {
    const from = header.slice(actionPrefix.length);
    return isDistributorPath(from) || from === "/login";
  }
  return isDistributorPath(header);
}

/** A distributor's menu: their ordering area only. */
export const DISTRIBUTOR_NAV = [
  { href: "/systems/orders", label: "My orders" },
  { href: "/systems/orders/new", label: "New order" },
  { href: "/systems/orders/catalogue", label: "Catalogue" },
];
