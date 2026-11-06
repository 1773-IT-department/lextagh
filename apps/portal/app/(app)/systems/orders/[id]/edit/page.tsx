import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { DistributorOrder, DistributorOrderLine } from "@lexta/db";
import OrderBuilder from "@/components/orders/OrderBuilder";
import { UUID } from "@/lib/crm";
import { toBuilderProducts } from "@/lib/order-builder";
import { getOrdersAccess, loadCatalogue, NOT_LINKED, PRICE_PLACEHOLDER } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit draft | Lexta Business System" };

/** Distributor: change a draft order. Anything that is not a draft goes back to the order page. */
export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const access = await getOrdersAccess();
  if (!access.isDistributor) redirect(`/systems/orders/${id}`);
  if (!access.account) return (<><h1>Edit draft</h1><div className="tile empty"><b>Not linked yet</b><span>{NOT_LINKED}</span></div></>);
  const supabase = await createClient();
  const { data: order, error } = await supabase.from("distributor_orders")
    .select("id, reference, status, delivery_region_id, delivery_address, distributor_notes").eq("id", id)
    .maybeSingle<Pick<DistributorOrder, "id" | "reference" | "status" | "delivery_region_id" | "delivery_address" | "distributor_notes">>();
  if (error) throw new Error("Could not load the order");
  if (!order) notFound();
  if (order.status !== "draft") redirect(`/systems/orders/${id}`);
  const [catalogue, linesRes] = await Promise.all([
    loadCatalogue(access.account),
    supabase.from("distributor_order_lines").select("sku_id, quantity, product_name_snapshot, pack_size_snapshot").eq("order_id", id),
  ]);
  if (linesRes.error) throw new Error("Could not load the order lines");
  const products = toBuilderProducts(access, catalogue);
  const available = new Set(products.flatMap((p) => p.skus.map((s) => s.id)));
  const lines = (linesRes.data ?? []) as Pick<DistributorOrderLine, "sku_id" | "quantity" | "product_name_snapshot" | "pack_size_snapshot">[];
  const quantities: Record<string, number> = {};
  const unavailable: string[] = [];
  for (const l of lines) {
    if (l.sku_id && available.has(l.sku_id)) quantities[l.sku_id] = l.quantity;
    else unavailable.push(`${l.product_name_snapshot} (${l.pack_size_snapshot})`);
  }

  return (
    <>
      <p className="crumbs"><Link href={`/systems/orders/${id}`}>{order.reference}</Link></p>
      <h1>Edit draft</h1>
      <OrderBuilder products={products} regions={access.regions} orderId={order.id} reference={order.reference} pricePlaceholder={PRICE_PLACEHOLDER}
        unavailable={unavailable}
        initial={{ quantities, regionId: order.delivery_region_id ?? "", address: order.delivery_address ?? "", notes: order.distributor_notes ?? "" }} />
    </>
  );
}
