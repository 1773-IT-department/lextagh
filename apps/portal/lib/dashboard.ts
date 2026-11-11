import type { AppRole } from "@lexta/db";

/** Same as the role check at the top of public.management_dashboard in 0014_management_dashboard.sql. */
export const DASHBOARD_ROLES: AppRole[] = ["admin", "management"];
export const DASHBOARD_BASE = "/systems/dashboard";
export const NO_DASHBOARD_ACCESS = "Your role does not include the management dashboard. Ask your Lexta administrator if you need it.";

export type DashboardPreset = "30d" | "month" | "year";
export const DASHBOARD_PRESETS: { value: DashboardPreset; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "This year" },
];

export type DashboardFilters = {
  /** A preset, or "custom" when valid from and to dates were given. */
  range: DashboardPreset | "custom";
  from: string;
  to: string;
  /** A brand id, or "" for every brand. */
  brand: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const validDate = (v: string | undefined) => (v && DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && iso(new Date(`${v}T00:00:00Z`)) === v ? v : "");

/** The dates of a preset. Ghana is UTC all year, so the UTC date is Ghana's date. */
export function presetDates(preset: DashboardPreset, now: Date = new Date()): { from: string; to: string } {
  const to = iso(now);
  if (preset === "month") return { from: `${to.slice(0, 7)}-01`, to };
  if (preset === "year") return { from: `${to.slice(0, 4)}-01-01`, to };
  return { from: iso(new Date(now.getTime() - 29 * DAY)), to };
}

/**
 * Filters from the address bar. Valid from and to dates (from not after to, at most about ten years, the database's
 * limit) win; otherwise the preset, default the last 30 days. The brand must be one of the brands given.
 */
export function parseDashboardFilters(
  params: Partial<Record<"range" | "from" | "to" | "brand", string>>,
  brandIds: string[],
  now: Date = new Date(),
): DashboardFilters {
  const brand = params.brand && UUID.test(params.brand) && brandIds.includes(params.brand) ? params.brand : "";
  const from = validDate(params.from);
  const to = validDate(params.to);
  if (from && to && from <= to && (Date.parse(to) - Date.parse(from)) / DAY <= 3660) return { range: "custom", from, to, brand };
  const range: DashboardPreset = params.range === "month" || params.range === "year" ? params.range : "30d";
  return { range, ...presetDates(range, now), brand };
}

/** The address of the dashboard with these filters (presets keep the address short). */
export function dashboardHref(f: Pick<DashboardFilters, "range" | "brand"> & Partial<Pick<DashboardFilters, "from" | "to">>): string {
  const q = new URLSearchParams();
  if (f.range === "custom") { q.set("from", f.from ?? ""); q.set("to", f.to ?? ""); }
  else if (f.range !== "30d") q.set("range", f.range);
  if (f.brand) q.set("brand", f.brand);
  const s = q.toString();
  return s ? `${DASHBOARD_BASE}?${s}` : DASHBOARD_BASE;
}

/** A link into a system's list, with only the filters that list understands. */
export function systemHref(path: string, params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

type Counts = Record<string, number>;

/** What public.management_dashboard returns. */
export type Dashboard = {
  from: string;
  to: string;
  brand_id: string | null;
  crm: { new_leads: number; by_source: Counts; by_stage: Counts; open_now: number; won: number; lost: number; unassigned_website: number };
  complaints: {
    opened: number; closed: number; resolved: number; avg_days_to_close: number | null; open_now: number;
    open_by_severity: Counts; open_by_status: Counts; overdue_now: number;
  };
  recruitment: { open_roles: number; applications: number; by_stage: Counts; in_progress_now: number };
  chat: { conversations: number; awaiting_reply_now: number; never_answered_now: number; leads_from_chat: number };
  orders: { orders: number; by_status: Counts; lines: number; packs: number; to_confirm_now: number };
  field_sales: {
    visits: number; reps: number; new_shops_in_period: number; top_reps: { name: string; visits: number }[];
    outcomes: { label: string; visits: number }[]; shops_to_confirm_now: number;
  };
  csr: { activities_done: number; people_reached: number; by_programme: { name: string; activities: number; people: number }[]; planned_ahead: number };
  catalogue: { published_products: number; products: number; active_stockists: number };
};

export type Bar = { label: string; value: number };

/** Bars in a fixed order (every option, zeros included), from a count per value. */
export function barsFrom(options: readonly { value: string; label: string }[], counts: Counts | null | undefined): Bar[] {
  return options.map((o) => ({ label: o.label, value: Number(counts?.[o.value] ?? 0) }));
}

export const formatNumber = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString("en-GB");

export function formatRangeDay(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
