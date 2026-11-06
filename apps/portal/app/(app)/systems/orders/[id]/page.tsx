import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ORDER_STEPS, orderStatusLabel, staffNextStatuses,
  type DistributorOrder, type DistributorOrderEvent, type DistributorOrderLine, type DistributorOrderStaffNote, type OrderStatus,
} from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import { DistributorStatusButton, StaffNoteForm, StaffStatusForm } from "@/components/orders/OrderForms";
import { formatDateTime, UUID } from "@/lib/crm";
import { brandName, getOrdersAccess, loadOrderPeople, NO_ORDERS_ACCESS, PRICE_PLACEHOLDER, regionName, type OrdersAccess } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { deleteOrder } from "../actions";

export const metadata = { title: "Order | Lexta Business System" };

const COLUMNS = "id, reference, organisation_id, status, brand_ids, delivery_region_id, delivery_address, distributor_notes, status_changed_at, " +
  "submitted_at, confirmed_at, dispatched_at, delivered_at, cancelled_at, created_at, updated_at, created_by, updated_by";

const STEP_TIME: Record<string, keyof DistributorOrder> = {
  submitted: "submitted_at", confirmed: "confirmed_at", dispatched: "dispatched_at", delivered: "delivered_at",
};

function Tracker({ order }: { order: DistributorOrder }) {
  if (order.status === "draft") return null;
  return (
    <ol className="order-track" aria-label="Order progress">
      {ORDER_STEPS.map((s) => {
        const at = order[STEP_TIME[s]] as string | null;
        const current = order.status === s;
        return (
          <li key={s} className={`${at ? "done" : ""}${current ? " now" : ""}`} aria-current={current ? "step" : undefined}>
            <span className="dot" aria-hidden="true" />
            <b>{orderStatusLabel(s)}</b>
            <span className="hint">{at ? formatDateTime(at) : order.status === "cancelled" ? "" : "Not yet"}</span>
          </li>
        );
      })}
      {order.status === "cancelled" && (
        <li className="done now cancelled" aria-current="step">
          <span className="dot" aria-hidden="true" />
          <b>Cancelled</b>
          <span className="hint">{formatDateTime(order.cancelled_at)}</span>
        </li>
      )}
    </ol>
  );
}

function Lines({ access, lines }: { access: OrdersAccess; lines: DistributorOrderLine[] }) {
  const packs = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <>
      <div className="table-wrap">
        <table className="ptable order-lines">
          <thead><tr><th scope="col">Product</th><th scope="col">Pack size</th><th scope="col">Packs</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td>
                  <b>{l.product_name_snapshot}{l.variant_snapshot ? `, ${l.variant_snapshot}` : ""}</b>
                  <span className="hint">{brandName(access, l.brand_id)}, <span className="mono">{l.sku_code_snapshot}</span>{l.sku_id ? "" : ", no longer in the catalogue"}</span>
                </td>
                <td data-label="Pack size">{l.pack_size_snapshot}</td>
                <td data-label="Packs" className="num">{l.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small review-total">{lines.length} {lines.length === 1 ? "product" : "products"}, {packs} {packs === 1 ? "pack" : "packs"} in all.</p>
    </>
  );
}

function History({ events, who }: { events: DistributorOrderEvent[]; who: (e: DistributorOrderEvent) => string }) {
  if (!events.length) return <p className="small">Nothing logged yet.</p>;
  return (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id} className="t-status_change">
          <div className="t-head">
            <span className="badge type">{e.type === "created" ? "Started" : orderStatusLabel(e.to_status)}</span>
            <span className="small">{formatDateTime(e.created_at)} by {who(e)}</span>
          </div>
          {e.type === "status_change" && <p className="t-body">{orderStatusLabel(e.from_status)} to {orderStatusLabel(e.to_status)}</p>}
          {e.note && <p className="t-body">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}

export default async function OrderPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; submitted?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getOrdersAccess();
  if (!access.isDistributor && !access.isStaff) return (<><h1>Order</h1><p className="small">{NO_ORDERS_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: order, error } = await supabase.from("distributor_orders").select(COLUMNS).eq("id", id).maybeSingle<DistributorOrder>();
  if (error) throw new Error("Could not load the order");
  if (!order) notFound();
  const [linesRes, eventsRes, notesRes, orgRes, people] = await Promise.all([
    supabase.from("distributor_order_lines")
      .select("id, order_id, sku_id, product_id, brand_id, product_name_snapshot, sku_code_snapshot, variant_snapshot, pack_size_snapshot, quantity, created_at, updated_at")
      .eq("order_id", id).order("product_name_snapshot").order("sku_code_snapshot"),
    supabase.from("distributor_order_events").select("id, order_id, type, from_status, to_status, note, by_distributor, created_by, created_at, updated_at")
      .eq("order_id", id).order("created_at", { ascending: false }).limit(200),
    access.isStaff
      ? supabase.from("distributor_order_staff_notes").select("id, order_id, body, created_by, created_at, updated_at").eq("order_id", id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.rpc("distributor_org_name", { target_org: order.organisation_id }),
    access.isStaff ? loadOrderPeople() : Promise.resolve(new Map<string, string>()),
  ]);
  if (linesRes.error || eventsRes.error) throw new Error("Could not load the order");
  const lines = (linesRes.data ?? []) as DistributorOrderLine[];
  const events = (eventsRes.data ?? []) as DistributorOrderEvent[];
  const notes = (notesRes.data ?? []) as DistributorOrderStaffNote[];
  const orgName = (orgRes.data as string | null) ?? "Distributor";
  const status = order.status as OrderStatus;
  const delivery = [regionName(access, order.delivery_region_id), order.delivery_address].filter(Boolean).join(", ");

  const details = (
    <section className="panel">
      <h2>Delivery</h2>
      <dl className="facts">
        <dt>Deliver to</dt>
        <dd>{delivery || "Not given yet"}</dd>
        <dt>Notes from the distributor</dt>
        <dd className="pre-line">{order.distributor_notes || "None"}</dd>
        <dt>Started</dt>
        <dd>{formatDateTime(order.created_at)}</dd>
      </dl>
    </section>
  );

  // Distributor view ----------------------------------------------------------------------------------------------
  if (access.isDistributor) {
    const who = (e: DistributorOrderEvent) => (e.by_distributor ? (e.created_by === access.userId ? "you" : "your team") : "Lexta");
    return (
      <>
        <p className="crumbs"><Link href="/systems/orders">My orders</Link></p>
        <div className="page-head">
          <div>
            <h1 className="mono-h">{order.reference}</h1>
            <p className="small"><span className={`badge ostatus o-${status}`}>{orderStatusLabel(status)}</span> {orgName}</p>
          </div>
        </div>
        {flags.submitted && <div className="alert ok" role="status">Order submitted. Lexta will confirm it, and you can follow each step here.</div>}
        {flags.saved && <div className="alert ok" role="status">Draft saved. Submit it when you are ready.</div>}

        <Tracker order={order} />
        {status === "draft" && (
          <section className="panel order-next">
            <h2>This order is a draft</h2>
            <p className="small">Lexta does not see it until you submit it.</p>
            <div className="order-actions">
              <Link className="btn light" href={`/systems/orders/${order.id}/edit`}>Edit draft</Link>
              <DistributorStatusButton id={order.id} to="submitted" label="Submit order" />
              <DistributorStatusButton id={order.id} to="cancelled" label="Drop draft" danger confirm={`Drop draft ${order.reference}? It cannot be submitted afterwards.`} />
            </div>
          </section>
        )}
        {status === "submitted" && (
          <section className="panel order-next">
            <h2>Waiting for Lexta to confirm</h2>
            <p className="small">You can still cancel this order until Lexta confirms it.</p>
            <DistributorStatusButton id={order.id} to="cancelled" label="Cancel order" danger confirm={`Cancel order ${order.reference}?`} />
          </section>
        )}

        <div className="crm-detail">
          <div>
            <section className="panel">
              <h2>Products</h2>
              {lines.length ? <Lines access={access} lines={lines} /> : <p className="small">No products yet. Edit the draft to add some.</p>}
              <p className="small placeholder-note">Prices are not shown in the portal. {PRICE_PLACEHOLDER}</p>
            </section>
            {details}
          </div>
          <div>
            <section className="panel">
              <h2>History</h2>
              <History events={events} who={who} />
            </section>
          </div>
        </div>
      </>
    );
  }

  // Staff view ----------------------------------------------------------------------------------------------------
  const nameOf = (pid: string | null) => (pid ? (pid === access.userId ? "you" : people.get(pid) ?? "a former user") : "the system");
  const who = (e: DistributorOrderEvent) => (e.by_distributor ? `${nameOf(e.created_by)} (distributor)` : nameOf(e.created_by));
  return (
    <>
      <p className="crumbs"><Link href="/systems/orders">Orders</Link></p>
      <div className="page-head">
        <div>
          <h1>{orgName}</h1>
          <p className="small">
            <span className={`badge ostatus o-${status}`}>{orderStatusLabel(status)}</span>{" "}
            <span className="mono">{order.reference}</span>, {order.brand_ids.map((b) => brandName(access, b)).join(", ")}
          </p>
        </div>
      </div>
      {flags.error === "delete" && <div className="alert error" role="alert">The order could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}

      <Tracker order={order} />
      <div className="crm-detail">
        <div>
          <section className="panel">
            <h2>Products</h2>
            <Lines access={access} lines={lines} />
            <p className="small placeholder-note">{PRICE_PLACEHOLDER}</p>
          </section>
          {details}
          <section className="panel">
            <h2>Status</h2>
            <StaffStatusForm id={order.id} status={status} next={staffNextStatuses(status)} />
          </section>
        </div>
        <div>
          <section className="panel">
            <h2>Internal notes</h2>
            <p className="small">Only Lexta staff see these. The distributor never does.</p>
            <StaffNoteForm id={order.id} />
            {notes.length === 0 ? <p className="small">No internal notes yet.</p> : (
              <ol className="timeline">
                {notes.map((n) => (
                  <li key={n.id} className="t-note">
                    <div className="t-head">
                      <span className="badge type">Internal</span>
                      <span className="small">{formatDateTime(n.created_at)} by {nameOf(n.created_by)}</span>
                    </div>
                    <p className="t-body">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="panel">
            <h2>History</h2>
            <p className="small">The distributor sees these steps and their notes.</p>
            <History events={events} who={who} />
          </section>
          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete order</h2>
              <p className="small">Removes the order, its lines, history and internal notes for good. Cancel it instead unless it was made by mistake.</p>
              <form action={deleteOrder.bind(null, order.id)}>
                <ConfirmButton className="btn danger" message={`Delete ${order.reference} for good? This cannot be undone.`}>Delete order</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
