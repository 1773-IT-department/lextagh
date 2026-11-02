import "server-only";
import { crmContactName } from "@lexta/db";
import type { CrmAccess } from "./crm";
import { createClient } from "./supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
export type Option = { id: string; label: string };

const LIMIT = 1000;

/**
 * Contacts for a picker, by name. Only what Row Level Security lets this person see. The record already chosen is
 * always included, so a long list never silently drops it.
 */
export async function contactOptions(supabase: Client, keep?: string | null): Promise<Option[]> {
  const { data, error } = await supabase.from("crm_contacts").select("id, full_name, email, phone, organisation:crm_organisations!crm_contacts_organisation_id_fkey(name)")
    .order("full_name", { nullsFirst: false }).order("id").limit(LIMIT);
  if (error) throw new Error("Could not load contacts");
  type Row = { id: string; full_name: string | null; email: string | null; phone: string | null; organisation: { name: string } | { name: string }[] | null };
  const rows = (data ?? []) as unknown as Row[];
  if (keep && !rows.some((r) => r.id === keep)) {
    const { data: one } = await supabase.from("crm_contacts").select("id, full_name, email, phone, organisation:crm_organisations!crm_contacts_organisation_id_fkey(name)").eq("id", keep).maybeSingle();
    if (one) rows.unshift(one as unknown as Row);
  }
  return rows.map((r) => {
    const org = Array.isArray(r.organisation) ? r.organisation[0] : r.organisation;
    return { id: r.id, label: `${crmContactName(r)}${org?.name ? `, ${org.name}` : ""}` };
  });
}

export async function organisationOptions(supabase: Client, keep?: string | null): Promise<Option[]> {
  const { data, error } = await supabase.from("crm_organisations").select("id, name, town").order("name").order("id").limit(LIMIT);
  if (error) throw new Error("Could not load organisations");
  const rows = (data ?? []) as { id: string; name: string; town: string | null }[];
  if (keep && !rows.some((r) => r.id === keep)) {
    const { data: one } = await supabase.from("crm_organisations").select("id, name, town").eq("id", keep).maybeSingle();
    if (one) rows.unshift(one as { id: string; name: string; town: string | null });
  }
  return rows.map((r) => ({ id: r.id, label: r.town ? `${r.name}, ${r.town}` : r.name }));
}

export async function stockistOptions(supabase: Client, keep?: string | null): Promise<Option[]> {
  const { data, error } = await supabase.from("stockists").select("id, name, town").order("name").order("id").limit(LIMIT);
  if (error) throw new Error("Could not load stockists");
  const rows = (data ?? []) as { id: string; name: string; town: string }[];
  if (keep && !rows.some((r) => r.id === keep)) {
    const { data: one } = await supabase.from("stockists").select("id, name, town").eq("id", keep).maybeSingle();
    if (one) rows.unshift(one as { id: string; name: string; town: string });
  }
  return rows.map((r) => ({ id: r.id, label: `${r.name}, ${r.town}` }));
}

/** Who a new record may belong to: anyone in the CRM for admin and management, otherwise yourself or nobody. */
export function ownerChoices(access: CrmAccess): Option[] {
  const base = [{ id: "me", label: "Me" }, { id: "none", label: "Nobody yet" }];
  if (!access.manages) return base;
  return [...base, ...access.staff.filter((s) => s.is_active && s.id !== access.userId).map((s) => ({ id: s.id, label: s.display_name }))];
}

/** Everyone a manager can hand a record to. */
export function reassignChoices(access: CrmAccess): Option[] {
  return access.staff.filter((s) => s.is_active).map((s) => ({ id: s.id, label: s.id === access.userId ? `${s.display_name} (me)` : s.display_name }));
}
