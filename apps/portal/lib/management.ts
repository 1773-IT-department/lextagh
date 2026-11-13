import type { AppRole } from "@lexta/db";
import { COMPLAINT_CATEGORIES, COMPLAINT_SEVERITIES, CRM_SOURCES, JOB_APPLICATION_STAGES, ORDER_STATUSES } from "@lexta/db";
import { parseDashboardFilters, type DashboardFilters, type DashboardPreset } from "@/lib/dashboard";

/**
 * The management overview (/management): a read only view across every system for admin and management.
 * Same roles as the check at the top of the functions in 0014_management_dashboard.sql and
 * 0015_management_overview.sql; the database refuses everyone else.
 */
export const MANAGEMENT_ROLES: AppRole[] = ["admin", "management"];
export const MANAGEMENT_BASE = "/management";
export const NO_MANAGEMENT_ACCESS = "Your role does not include the management overview. Ask your Lexta administrator if you need it.";
export const isManager = (role: AppRole | null | undefined) => !!role && MANAGEMENT_ROLES.includes(role);

/** Where a person lands after sign in and on "/": admin and management on the overview, everyone else on Home. */
export const homePathFor = (role: AppRole | null | undefined) => (isManager(role) ? MANAGEMENT_BASE : "/");

/** The tabs: the overview, the feed, and one section per system (the slug is the address under /management). */
export const MANAGEMENT_SECTIONS = [
  { slug: "orders", label: "Orders", system: "orders" },
  { slug: "field-sales", label: "Field sales", system: "field_sales" },
  { slug: "crm", label: "CRM", system: "crm" },
  { slug: "complaints", label: "Complaints", system: "complaints" },
  { slug: "recruitment", label: "Recruitment", system: "recruitment" },
  { slug: "chat", label: "Live chat", system: "chat" },
  { slug: "catalogue", label: "Products and stockists", system: "catalogue" },
  { slug: "csr", label: "CSR", system: "csr" },
] as const;
export type SectionSlug = (typeof MANAGEMENT_SECTIONS)[number]["slug"];
export type FeedSystem = (typeof MANAGEMENT_SECTIONS)[number]["system"];
export const MANAGEMENT_TABS: { href: string; label: string }[] = [
  { href: MANAGEMENT_BASE, label: "Overview" },
  { href: `${MANAGEMENT_BASE}/activity`, label: "Activity" },
  ...MANAGEMENT_SECTIONS.map((s) => ({ href: `${MANAGEMENT_BASE}/${s.slug}`, label: s.label })),
];
export const FEED_SYSTEM_LABELS: Record<FeedSystem, string> = Object.fromEntries(MANAGEMENT_SECTIONS.map((s) => [s.system, s.label])) as Record<FeedSystem, string>;
export const isFeedSystem = (v: string | undefined): v is FeedSystem => !!v && v in FEED_SYSTEM_LABELS;

export type ManagementFilters = DashboardFilters;
export const parseManagementFilters = parseDashboardFilters;

/** The query string that carries the period and brand from tab to tab (presets keep it short). */
export function filterQuery(f: Pick<DashboardFilters, "range" | "brand"> & Partial<Pick<DashboardFilters, "from" | "to">>, extra: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams();
  if (f.range === "custom") { q.set("from", f.from ?? ""); q.set("to", f.to ?? ""); }
  else if (f.range !== "30d") q.set("range", f.range);
  if (f.brand) q.set("brand", f.brand);
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}
export const managementHref = (path: string, f: Pick<DashboardFilters, "range" | "brand"> & Partial<Pick<DashboardFilters, "from" | "to">>, extra?: Record<string, string | undefined>) =>
  `${path}${filterQuery(f, extra)}`;
export const presetHref = (path: string, range: DashboardPreset, brand: string) => managementHref(path, { range, brand });

// Previous period ---------------------------------------------------------------------------------------------------
const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The period of the same length that ends the day before this one starts (dates are Ghana dates, which are UTC). */
export function previousPeriod(from: string, to: string): { from: string; to: string; days: number } {
  const start = Date.parse(`${from}T00:00:00Z`);
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - start) / DAY) + 1;
  return { from: iso(start - days * DAY), to: iso(start - DAY), days };
}

/** "up 4 on the previous 30 days", "down 2 on ...", "the same as ...". */
export function changeText(now: number, before: number, days: number): { text: string; dir: "up" | "down" | "same" } {
  const diff = Number(now) - Number(before);
  const span = `the previous ${days === 1 ? "day" : `${days.toLocaleString("en-GB")} days`}`;
  if (diff === 0) return { text: `The same as ${span}`, dir: "same" };
  const n = Math.abs(diff).toLocaleString("en-GB");
  return diff > 0 ? { text: `Up ${n} on ${span}`, dir: "up" } : { text: `Down ${n} on ${span}`, dir: "down" };
}

// Charts --------------------------------------------------------------------------------------------------------------
export type SeriesPoint = { from: string; to: string; orders: number; leads: number; complaints: number; visits: number };
/** What public.management_timeseries returns. */
export type Timeseries = { from: string; to: string; brand_id: string | null; unit: "day" | "week" | "month"; points: SeriesPoint[] };

export function pointLabel(p: { from: string; to: string }, unit: Timeseries["unit"]): string {
  const day = (v: string, year = false) => new Date(`${v}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
  if (unit === "day" || p.from === p.to) return day(p.from);
  if (unit === "month") {
    const whole = p.from.endsWith("-01") && iso(Date.parse(`${p.to}T00:00:00Z`) + DAY).endsWith("-01");
    const m = new Date(`${p.from}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    return whole ? m : `${day(p.from)} to ${day(p.to)}`;
  }
  return `${day(p.from)} to ${day(p.to)}`;
}

// Activity feed -------------------------------------------------------------------------------------------------------
/** One row of public.management_activity. */
export type FeedItem = {
  key: string; at: string; system: FeedSystem; kind: string; record_id: string; title: string; detail: string;
  brand_ids: string[]; actor_id: string | null; actor_name: string | null;
};
export type FeedPage = { items: FeedItem[]; has_more: boolean };
/**
 * An event ready to show, with every text made on the server. The client part of the feed only prints these strings,
 * so the browser never formats a date itself (its date names can differ from the server's, which breaks hydration).
 */
export type FeedView = { key: string; at: string; href: string; system: string; when: string; what: string; detail: string; meta: string };
export const FEED_PAGE_SIZE = 30;

/** The record behind an event, in its own system. */
export function recordHref(item: Pick<FeedItem, "kind" | "record_id">): string {
  const id = item.record_id;
  switch (item.kind) {
    case "lead_created": case "lead_stage": return `/systems/crm/leads/${id}`;
    case "complaint_opened": case "complaint_status": return `/systems/complaints/${id}`;
    case "application_received": case "application_stage": return `/systems/recruitment/applications/${id}`;
    case "chat_started": case "chat_closed": return `/systems/chat/${id}`;
    case "order_submitted": case "order_status": return `/systems/orders/${id}`;
    case "visit": return `/systems/field-sales/visits/${id}`;
    case "new_shop": case "shop_confirmed": case "stockist_created": case "stockist_updated": return `/systems/stockists/${id}`;
    case "csr_logged": return `/systems/csr/${id}`;
    case "product_created": case "product_updated": return `/systems/products/${id}`;
    default: return MANAGEMENT_BASE;
  }
}

const label = (options: readonly { value: string; label: string }[], v: string) => options.find((o) => o.value === v)?.label ?? v;
const orderStatus = (v: string) => label(ORDER_STATUSES, v);
const stage = (v: string) => label(JOB_APPLICATION_STAGES, v);
const ghanaDay = (v: string) => new Date(`${v}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** What happened, in words: a sentence and a detail line. */
export function describe(item: FeedItem): { what: string; detail: string } {
  const d = item.detail ?? "";
  const parts = d.split("|");
  switch (item.kind) {
    case "lead_created": return { what: `New lead: ${item.title}`, detail: `Source: ${label(CRM_SOURCES, d)}` };
    case "lead_stage": return { what: `Lead ${item.title}`, detail: d };
    case "complaint_opened": return { what: `Complaint ${item.title} received`, detail: `${label(COMPLAINT_CATEGORIES, parts[0] ?? "")}, ${label(COMPLAINT_SEVERITIES, parts[1] ?? "").toLowerCase()} severity` };
    case "complaint_status": return { what: `Complaint ${item.title}`, detail: d };
    case "application_received": return { what: `Application ${item.title} received`, detail: d };
    case "application_stage": return { what: `Application ${item.title}`, detail: `Moved from ${stage(parts[0] ?? "")} to ${stage(parts[1] ?? "")}` };
    case "chat_started": return { what: `Chat ${item.title} started`, detail: d ? `On the page ${d}` : "" };
    case "chat_closed": return { what: `Chat ${item.title} closed`, detail: "" };
    case "order_submitted": return { what: `Order ${item.title} submitted`, detail: parts[0] ?? "" };
    case "order_status": return { what: `Order ${item.title} ${orderStatus(parts[2] ?? "").toLowerCase()}`, detail: `${parts[0] ? `${parts[0]}. ` : ""}Moved from ${orderStatus(parts[1] ?? "")} to ${orderStatus(parts[2] ?? "")}` };
    case "visit": return { what: `Shop visit: ${item.title}`, detail: d ? `Outcome: ${d}` : "" };
    case "new_shop": return { what: `New shop found: ${item.title}`, detail: d };
    case "shop_confirmed": return { what: `New shop confirmed: ${item.title}`, detail: d };
    case "csr_logged": return { what: `CSR activity logged: ${item.title}`, detail: [parts[1], parts[2] ? ghanaDay(parts[2]) : "", parts[0] === "planned" ? "planned" : "done"].filter(Boolean).join(", ") };
    case "product_created": return { what: `Product added: ${item.title}`, detail: d === "published" ? "On the websites" : "Draft" };
    case "product_updated": return { what: `Product changed: ${item.title}`, detail: d === "published" ? "On the websites" : "Draft" };
    case "stockist_created": return { what: `Stockist added: ${item.title}`, detail: d };
    case "stockist_updated": return { what: `Stockist changed: ${item.title}`, detail: d };
    default: return { what: item.title, detail: d };
  }
}

/** Singular or plural from the count: plural(1, "order", "orders") is "order". */
export const plural = (n: number | string | null | undefined, one: string, many: string) => (Number(n ?? 0) === 1 ? one : many);

/** Turns events into what the feed shows (call on the server only). */
export function presentFeed(items: FeedItem[], brandNames: Record<string, string>): FeedView[] {
  return items.map((item) => {
    const { what, detail } = describe(item);
    const who = actorText(item);
    const brands = item.brand_ids.map((b) => brandNames[b]).filter(Boolean);
    return {
      key: item.key, at: item.at, href: recordHref(item), system: FEED_SYSTEM_LABELS[item.system] ?? item.system, when: formatWhen(item.at), what, detail,
      meta: [who ? `By ${who}` : "", brands.join(", ")].filter(Boolean).join(" \u00b7 "),
    };
  });
}

/** Who did it, or "" when no person is on record (records written before authors were kept, imports). */
export function actorText(item: FeedItem): string {
  if (item.actor_name) return item.actor_name;
  switch (item.kind) {
    case "lead_created": return item.detail.startsWith("website_") ? "Website" : "";
    case "application_received": return "Careers page";
    case "chat_started": return "Website visitor";
    case "order_submitted": case "order_status": return item.detail.endsWith("|distributor") ? "The distributor" : "";
    default: return "";
  }
}

/** Ghana time (UTC all year), for example "13 Nov 2026, 14:05". */
export function formatWhen(at: string): string {
  const d = new Date(at);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;
}
