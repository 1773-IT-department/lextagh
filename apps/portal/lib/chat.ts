import "server-only";
import type { AppRole, Brand, ChatStaff } from "@lexta/db";
import { requireSession } from "./session";
import { createClient } from "./supabase/server";

/**
 * Who answers the live chat inbox. Same as public.chat_staff_role() in 0009_live_chat.sql, and as the "chat" entry
 * in lib/systems.ts: admin, management and customer care. They are the roles that already read every brand's
 * customer messages (CRM website enquiries and complaints); sales, marketing, HR and distributors do not.
 */
export const CHAT_ROLES: AppRole[] = ["admin", "management", "customer_care"];

export type ChatAccess = {
  userId: string;
  role: AppRole | null;
  /** Admin, management and customer care: read, reply, note, assign, close and reopen every chat. */
  canView: boolean;
  /** Admin only: delete a conversation (for example when a visitor asks for their data to be erased). */
  isAdmin: boolean;
  /** Make a CRM lead from a chat (the CRM lets admin, management and customer care create leads). */
  canMakeLead: boolean;
  /** Log a complaint from a chat (the complaints tracker lets admin and customer care create complaints). */
  canMakeComplaint: boolean;
  staff: ChatStaff[];
  brands: Pick<Brand, "id" | "slug" | "name">[];
};

/** Worked out on the server. The database enforces the same rules (Row Level Security, grants, triggers). */
export async function getChatAccess(): Promise<ChatAccess> {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const canView = !!role && CHAT_ROLES.includes(role);
  const base = {
    userId: user.id, role, canView, isAdmin: role === "admin",
    canMakeLead: canView, canMakeComplaint: role === "admin" || role === "customer_care",
  };
  if (!canView) return { ...base, canMakeLead: false, canMakeComplaint: false, staff: [], brands: [] };
  const supabase = await createClient();
  const [staffRes, brandsRes] = await Promise.all([
    supabase.rpc("chat_staff"),
    supabase.from("brands").select("id, slug, name").order("name"),
  ]);
  if (staffRes.error) throw new Error("Could not load the team list");
  if (brandsRes.error) throw new Error("Could not load brands");
  return { ...base, staff: (staffRes.data ?? []) as ChatStaff[], brands: (brandsRes.data ?? []) as ChatAccess["brands"] };
}

export const NO_CHAT_ACCESS = "Your role does not include the live chat inbox. Ask your Lexta administrator if you need it.";

export function chatStaffName(access: ChatAccess, id: string | null | undefined): string {
  if (!id) return "";
  if (id === access.userId) return "You";
  return access.staff.find((s) => s.id === id)?.display_name ?? "Former team member";
}

/** The site a chat came from, by brand: "Lexta site", "Yazz site". */
export function chatSiteName(access: ChatAccess, brandId: string): string {
  const b = access.brands.find((x) => x.id === brandId);
  if (!b) return "Website";
  return b.slug === "lexta" ? "Lexta site" : `${b.name} site`;
}

/** Short relative time for the inbox: "just now", "5 min", "3 h", then the date. */
export function chatAgo(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Accra" });
}

export function chatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });
}
