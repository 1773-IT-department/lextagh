// Distributor ordering types and labels. Hand written from supabase/migrations/0010_distributor_orders.sql.
// No prices: product data has none, so orders are quantities in packs only.

type Timestamps = { created_at: string; updated_at: string };
type Option<T extends string> = { value: T; label: string };

export type OrderStatus = "draft" | "submitted" | "confirmed" | "dispatched" | "delivered" | "cancelled";

/** In the order an order moves; cancelled can happen from draft, submitted or confirmed. */
export const ORDER_STATUSES: readonly Option<OrderStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/** The statuses staff see (never drafts). */
export const STAFF_ORDER_STATUSES = ORDER_STATUSES.filter((s) => s.value !== "draft");

/** Still to be worked by staff. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = ["submitted", "confirmed", "dispatched"];

export const orderStatusLabel = (v: string | null | undefined) => ORDER_STATUSES.find((s) => s.value === v)?.label ?? "Draft";

/** The tracker a distributor sees, from submitted to delivered. */
export const ORDER_STEPS: readonly OrderStatus[] = ["submitted", "confirmed", "dispatched", "delivered"];

/** Same flow as public.check_distributor_order(): the moves staff may make from a status. */
export function staffNextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "submitted") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["dispatched", "cancelled"];
  if (status === "dispatched") return ["delivered"];
  return [];
}

/** The distributor may cancel a draft, or a submitted order until staff confirm it. */
export const distributorMayCancel = (status: OrderStatus) => status === "draft" || status === "submitted";

/** Most packs on one line, as public.save_distributor_order() allows. */
export const ORDER_MAX_QUANTITY = 100000;
export const ORDER_MAX_LINES = 200;

export type DistributorOrder = Timestamps & {
  id: string;
  /** LX-ORD-<year>-0001, from the database. */
  reference: string;
  organisation_id: string;
  status: OrderStatus;
  brand_ids: string[];
  delivery_region_id: string | null;
  delivery_address: string | null;
  distributor_notes: string | null;
  status_changed_at: string;
  submitted_at: string | null;
  confirmed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

export type DistributorOrderLine = Timestamps & {
  id: string;
  order_id: string;
  sku_id: string | null;
  product_id: string | null;
  brand_id: string;
  product_name_snapshot: string;
  sku_code_snapshot: string;
  variant_snapshot: string | null;
  pack_size_snapshot: string;
  quantity: number;
};

export type DistributorOrderEvent = Timestamps & {
  id: string;
  order_id: string;
  type: "created" | "status_change";
  from_status: OrderStatus | null;
  to_status: OrderStatus | null;
  note: string | null;
  by_distributor: boolean;
  created_by: string | null;
};

export type DistributorOrderStaffNote = Timestamps & {
  id: string;
  order_id: string;
  body: string;
  created_by: string | null;
};

/** public.my_distributor_account() */
export type DistributorAccount = {
  organisation_id: string;
  organisation_name: string;
  region_id: string | null;
  brands: { id: string; slug: string; name: string }[];
};

/** public.distributor_logins() */
export type DistributorLogin = {
  profile_id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  organisation_id: string | null;
  organisation_name: string | null;
  may_unlink: boolean;
};

/** public.distributor_order_inbox() */
export type OrderInboxRow = {
  id: string;
  reference: string;
  organisation_id: string;
  organisation_name: string | null;
  status: OrderStatus;
  brand_ids: string[];
  delivery_region_id: string | null;
  delivery_address: string | null;
  submitted_at: string;
  status_changed_at: string;
  line_count: number;
  pack_count: number;
  total_count: number;
};

/** What save_distributor_order() takes. */
export type OrderDetailsPayload = {
  delivery_region_id: string | null;
  delivery_address: string | null;
  distributor_notes: string | null;
  lines: { sku_id: string; quantity: number }[];
};
