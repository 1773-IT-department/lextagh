import { DateInput, Select } from "@lexta/ui";
import Link from "next/link";
import { orderStatusLabel, STAFF_ORDER_STATUSES, type DistributorOrder, type OrderInboxRow } from "@lexta/db";
import OrderTabs from "@/components/orders/OrderTabs";
import { formatDate, formatDateTime, PAGE_SIZE } from "@/lib/crm";
import { filterArgs, orderFilterQuery, parseOrderFilters, type OrderFilters } from "@/lib/order-filters";
import { brandName, getOrdersAccess, NO_ORDERS_ACCESS, NOT_LINKED, NOTIFY_PLACEHOLDER, regionName, type OrdersAccess } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orders | Lexta Business System" };

type Search = Partial<Record<keyof OrderFilters | "page" | "deleted", string>>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getOrdersAccess();
  if (access.isDistributor) return <MyOrders access={access} />;
  if (!access.isStaff) return (<><h1>Distributor ordering</h1><p className="small">{NO_ORDERS_ACCESS}</p></>);
  return <Inbox access={access} params={params} />;
}

// Distributor: my orders ------------------------------------------------------------------------------------------

async function MyOrders({ access }: { access: OrdersAccess }) {
  if (!access.account) {
    return (<><h1>My orders</h1><div className="tile empty"><b>Not linked yet</b><span>{NOT_LINKED}</span></div></>);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("distributor_orders")
    .select("id, reference, status, created_at, submitted_at, status_changed_at, delivery_region_id, delivery_address")
    .order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error("Could not load your orders");
  const orders = (data ?? []) as Pick<DistributorOrder, "id" | "reference" | "status" | "created_at" | "submitted_at" | "status_changed_at" | "delivery_region_id" | "delivery_address">[];
  const ids = orders.map((o) => o.id);
  const linesRes = ids.length
    ? await supabase.from("distributor_order_lines").select("order_id, quantity").in("order_id", ids)
    : { data: [], error: null };
  const totals = new Map<string, { lines: number; packs: number }>();
  for (const l of (linesRes.data ?? []) as { order_id: string; quantity: number }[]) {
    const t = totals.get(l.order_id) ?? { lines: 0, packs: 0 };
    totals.set(l.order_id, { lines: t.lines + 1, packs: t.packs + l.quantity });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My orders</h1>
          <p className="small">{access.account.organisation_name}. Order {access.account.brands.map((b) => b.name).join(", ") || "Lexta products"} and follow each order here.</p>
        </div>
        <div className="head-actions"><Link className="btn" href="/systems/orders/new">New order</Link></div>
      </div>
      <OrderTabs active="mine" distributor />
      {orders.length === 0 ? (
        <div className="tile empty">
          <b>No orders yet</b>
          <span>Start a new order: choose products and the number of packs, review it, then submit. Lexta confirms it and you can follow it here.</span>
        </div>
      ) : (
        <ul className="order-cards">
          {orders.map((o) => {
            const t = totals.get(o.id) ?? { lines: 0, packs: 0 };
            return (
              <li key={o.id}>
                <Link href={`/systems/orders/${o.id}`} className="order-card">
                  <div className="order-card-top">
                    <span className="mono">{o.reference}</span>
                    <span className={`badge ostatus o-${o.status}`}>{orderStatusLabel(o.status)}</span>
                  </div>
                  <span className="small">
                    {t.lines} {t.lines === 1 ? "product" : "products"}, {t.packs} {t.packs === 1 ? "pack" : "packs"}
                    {", "}
                    {o.submitted_at ? `submitted ${formatDate(o.submitted_at)}` : `started ${formatDate(o.created_at)}`}
                  </span>
                  {(o.delivery_region_id || o.delivery_address) && (
                    <span className="hint">To {[regionName(access, o.delivery_region_id), o.delivery_address].filter(Boolean).join(", ")}</span>
                  )}
                  {o.status !== "draft" && <span className="hint">Last update {formatDateTime(o.status_changed_at)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// Staff: the inbox -------------------------------------------------------------------------------------------------

async function Inbox({ access, params }: { access: OrdersAccess; params: Search }) {
  const f = parseOrderFilters(params);
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = Object.values(f).some(Boolean);
  const supabase = await createClient();
  const [listRes, countsRes, orgsRes] = await Promise.all([
    supabase.rpc("distributor_order_inbox", { ...filterArgs(f), p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE }),
    supabase.rpc("distributor_order_counts", filterArgs(f, false)),
    supabase.rpc("distributor_order_organisations"),
  ]);
  if (listRes.error) console.error("[orders] inbox failed", listRes.error);
  const rows = (listRes.data ?? []) as OrderInboxRow[];
  const counts = new Map(((countsRes.data ?? []) as { status: string; n: number }[]).map((c) => [c.status, Number(c.n)]));
  const orgs = (orgsRes.data ?? []) as { id: string; name: string | null }[];
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: Search) => `/systems/orders${orderFilterQuery({ ...f, page: String(page), ...over })}`;
  const brandChoices = access.brands.filter((b) => access.myBrandIds.has(b.id));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Distributor orders</h1>
          <p className="small">Orders distributors submit in the portal, for the brands you work on. Confirm, dispatch and mark delivered; the distributor follows each step.</p>
        </div>
        <div className="head-actions">
          <a className="btn light" href={`/systems/orders/export${orderFilterQuery(f)}`}>Export CSV</a>
        </div>
      </div>
      <OrderTabs active="inbox" />
      {params.deleted && <div className="alert ok" role="status">The order was deleted.</div>}
      <p className="small placeholder-note">New orders do not send an email yet. {NOTIFY_PLACEHOLDER}</p>

      <nav className="pipeline order-counts" aria-label="Orders by status">
        {STAFF_ORDER_STATUSES.map((s) => (
          <Link key={s.value} href={href({ status: s.value, page: "1" })} className={`pipe o-${s.value}`} aria-current={f.status === s.value ? "page" : undefined}>
            <b>{countsRes.error ? "?" : counts.get(s.value) ?? 0}</b>
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>

      <form className="filters order-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={f.q} placeholder="LX-ORD reference or distributor" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <Select id="status" name="status" defaultValue={f.status}>
            <option value="">Any status</option>
            <option value="open">Still to do</option>
            {STAFF_ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <Select id="brand" name="brand" defaultValue={f.brand}>
            <option value="">Any brand</option>
            {brandChoices.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <div className="field">
          <label htmlFor="org">Distributor</label>
          <Select id="org" name="org" defaultValue={f.org}>
            <option value="">Any distributor</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name ?? "Distributor"}</option>)}
          </Select>
        </div>
        <div className="field">
          <label htmlFor="from">Submitted from</label>
          <DateInput id="from" name="from" type="date" defaultValue={f.from} />
        </div>
        <div className="field">
          <label htmlFor="to">Submitted to</label>
          <DateInput id="to" name="to" type="date" defaultValue={f.to} />
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/orders">Clear</Link>}
        </div>
      </form>

      {listRes.error ? (
        <div className="alert error" role="alert">We could not load the orders. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No orders match" : "No orders yet"}</b>
          <span>{filtered ? "Try another search or clear the filters." : "Orders appear here when a distributor submits one. Link distributor logins under Distributor logins."}</span>
        </div>
      ) : (
        <>
          <p className="small" aria-live="polite">{total} {total === 1 ? "order" : "orders"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th scope="col">Order</th><th scope="col">Brands</th><th scope="col">Status</th><th scope="col">Packs</th><th scope="col">Delivery</th><th scope="col">Submitted</th></tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/systems/orders/${o.id}`} className="pname">{o.organisation_name ?? "Distributor"}</Link>
                      <span className="hint mono">{o.reference}</span>
                    </td>
                    <td data-label="Brands">{o.brand_ids.map((b) => brandName(access, b)).join(", ")}</td>
                    <td data-label="Status"><span className={`badge ostatus o-${o.status}`}>{orderStatusLabel(o.status)}</span></td>
                    <td data-label="Packs">{Number(o.pack_count)}<span className="hint">{o.line_count} {o.line_count === 1 ? "line" : "lines"}</span></td>
                    <td data-label="Delivery">{[regionName(access, o.delivery_region_id), o.delivery_address].filter(Boolean).join(", ") || <span className="small">Not given</span>}</td>
                    <td data-label="Submitted">{formatDate(o.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn small light" href={href({ page: String(page - 1) })}>Previous</Link> : <span />}
              <span className="small">Page {page} of {pages}</span>
              {page < pages ? <Link className="btn small light" href={href({ page: String(page + 1) })}>Next</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </>
  );
}
