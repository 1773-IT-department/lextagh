import type { AppRole } from "@lexta/db";

export type SystemDef = { slug: string; name: string; summary: string; roles: AppRole[] };

/**
 * The 8 systems from proposal 1773/LEX/2026-09, plus the shared chat inbox and user admin.
 * Which roles see which system is the starting default; Desmond can change it.
 * Admin and management see everything. Distributors only see ordering.
 * The database enforces access with Row Level Security; this list only shapes the navigation.
 */
export const SYSTEMS: SystemDef[] = [
  { slug: "dashboard", name: "Management dashboard", summary: "Orders, coverage, leads, complaints, CSR and KPIs at a glance.", roles: ["admin", "management"] },
  { slug: "orders", name: "Distributor ordering", summary: "Distributors place and track orders.", roles: ["admin", "management", "sales_rep", "customer_care", "distributor"] },
  { slug: "field-sales", name: "Field sales", summary: "Shop visits on the phone, with photo and location.", roles: ["admin", "management", "sales_rep"] },
  { slug: "crm", name: "CRM", summary: "Leads, distributors, institutions and partners.", roles: ["admin", "management", "sales_rep", "customer_care", "marketing"] },
  { slug: "complaints", name: "Complaints", summary: "Case number, owner, status and closure.", roles: ["admin", "management", "customer_care"] },
  { slug: "products", name: "Product management", summary: "Edit a product once and all four websites update.", roles: ["admin", "management", "marketing"] },
  { slug: "csr", name: "CSR activities", summary: "Track CSR projects and outreach.", roles: ["admin", "management", "marketing"] },
  { slug: "recruitment", name: "Recruitment", summary: "Open roles and applications from the Careers page.", roles: ["admin", "management", "hr"] },
  { slug: "chat", name: "Live chat inbox", summary: "Answer website visitors from all four sites in one place.", roles: ["admin", "management", "customer_care"] },
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
