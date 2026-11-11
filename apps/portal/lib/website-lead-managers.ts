import "server-only";
import type { CrmStaff } from "@lexta/db";
import { CUSTOMER_CARE_MAY_EDIT } from "./crm";

/**
 * Who may manage website leads, the same rule as public.crm_website_lead_manager_ok (0012_website_lead_managers.sql):
 * an active person who can work CRM leads (admin, management, sales rep, marketing; customer care only once it may
 * edit leads). For one brand, a sales rep or marketer must also work on that brand. The database checks it again.
 */
export function canManageWebsiteLeads(person: CrmStaff, brandId: string | null, brandLinks: Map<string, Set<string>>): boolean {
  if (!person.is_active) return false;
  if (person.role === "admin" || person.role === "management") return true;
  if (person.role === "customer_care") return CUSTOMER_CARE_MAY_EDIT;
  if (person.role === "sales_rep" || person.role === "marketing") {
    return brandId === null || !!brandLinks.get(person.id)?.has(brandId);
  }
  return false;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", management: "Management", sales_rep: "Sales rep", marketing: "Marketing", customer_care: "Customer care",
};

export const roleLabel = (role: string) => ROLE_LABEL[role] ?? role;
