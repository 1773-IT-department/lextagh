import "server-only";
import { STAFF_ORDER_STATUSES } from "@lexta/db";
import { cleanSearch, UUID } from "./crm";

/** The orders inbox filters, shared by the list and the CSV export so both always show the same orders. */
export type OrderFilters = {
  q: string;
  /** A status, "open" (submitted, confirmed or dispatched) or "" (any). */
  status: string;
  brand: string;
  /** A distributor organisation id. */
  org: string;
  /** YYYY-MM-DD, submitted on or after. */
  from: string;
  /** YYYY-MM-DD, submitted on or before. */
  to: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (v: string | undefined) => (v && DATE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? v : "");

export function parseOrderFilters(params: Record<string, string | undefined>): OrderFilters {
  return {
    q: cleanSearch(params.q, 80),
    status: params.status === "open" || STAFF_ORDER_STATUSES.some((s) => s.value === params.status) ? params.status! : "",
    brand: params.brand && UUID.test(params.brand) ? params.brand : "",
    org: params.org && UUID.test(params.org) ? params.org : "",
    from: validDate(params.from),
    to: validDate(params.to),
  };
}

/** The arguments of public.distributor_order_inbox and friends. */
export function filterArgs(f: OrderFilters, withStatus = true) {
  return {
    ...(withStatus ? { p_status: f.status || null } : {}),
    p_brand: f.brand || null,
    p_org: f.org || null,
    p_from: f.from || null,
    p_to: f.to || null,
    p_q: f.q || null,
  };
}

/** The query string for these filters (empty values left out). */
export function orderFilterQuery(f: Partial<OrderFilters> & { page?: string }): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v && !(k === "page" && v === "1")) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
