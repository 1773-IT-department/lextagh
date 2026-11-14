import { redirect } from "next/navigation";
import OrderBuilder from "@/components/orders/OrderBuilder";
import OrderTabs from "@/components/orders/OrderTabs";
import { toBuilderProducts } from "@/lib/order-builder";
import { getOrdersAccess, loadCatalogue, NOT_LINKED, PRICE_PLACEHOLDER } from "@/lib/orders";

export const metadata = { title: "New order | Lexta Business System" };

/** Distributor: a new order. Staff do not place orders here; they go back to the inbox. */
export default async function NewOrderPage() {
  const access = await getOrdersAccess();
  if (!access.isDistributor) redirect("/systems/orders");
  if (!access.account) return (<><h1>New order</h1><div className="tile empty"><b>Not linked yet</b><span>{NOT_LINKED}</span></div></>);
  const products = toBuilderProducts(access, await loadCatalogue(access.account));
  const regionId = access.account.region_id ?? "";

  return (
    <>
      <h1>New order</h1>
      <p className="small">Choose the number of packs for each product, then review and submit. You can save it as a draft and finish later.</p>
      <OrderTabs active="new" distributor />
      {products.length === 0 ? (
        <div className="tile empty"><b>No products to order yet</b><span>There are no published products for your brands yet. Ask your Lexta sales contact.</span></div>
      ) : (
        <OrderBuilder products={products} regions={access.regions} pricePlaceholder={PRICE_PLACEHOLDER}
          initial={{ quantities: {}, regionId, address: "", notes: "" }} />
      )}
    </>
  );
}
