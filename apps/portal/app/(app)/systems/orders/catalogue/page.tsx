import Link from "next/link";
import { productImageUrl } from "@lexta/db";
import OrderTabs from "@/components/orders/OrderTabs";
import { brandName, getOrdersAccess, loadCatalogue, NOT_LINKED, PRICE_PLACEHOLDER } from "@/lib/orders";
import { redirect } from "next/navigation";

export const metadata = { title: "Catalogue | Lexta Business System" };

/** Distributor: the published products and pack sizes of the brands their organisation carries. */
export default async function CataloguePage() {
  const access = await getOrdersAccess();
  if (!access.isDistributor) redirect("/systems/orders");
  if (!access.account) return (<><h1>Catalogue</h1><div className="tile empty"><b>Not linked yet</b><span>{NOT_LINKED}</span></div></>);
  const products = await loadCatalogue(access.account);
  const brands = access.account.brands.filter((b) => products.some((p) => p.brand_id === b.id));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Catalogue</h1>
          <p className="small">Products you can order, with their pack sizes. Prices are not shown here. {PRICE_PLACEHOLDER}</p>
        </div>
        <div className="head-actions"><Link className="btn" href="/systems/orders/new">New order</Link></div>
      </div>
      <OrderTabs active="catalogue" distributor />
      {products.length === 0 ? (
        <div className="tile empty"><b>No products yet</b><span>There are no published products for your brands yet. Ask your Lexta sales contact.</span></div>
      ) : brands.map((b) => (
        <section key={b.id} className="cat-brand">
          <h2>{b.name}</h2>
          <ul className="cat-list">
            {products.filter((p) => p.brand_id === b.id).map((p) => (
              <li key={p.id} className="cat-item">
                <div className="cat-head">
                  <span className="pthumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image ? <img src={productImageUrl(p.image)} alt={p.image.alt_text} loading="lazy" /> : <span aria-hidden="true">No image</span>}
                  </span>
                  <div>
                    <b>{p.name}</b>
                    <span className="hint">{[brandName(access, p.brand_id), p.category].filter(Boolean).join(", ")}</span>
                  </div>
                </div>
                {p.short_description && <p className="small cat-desc">{p.short_description}</p>}
                <ul className="sku-rows">
                  {p.skus.map((s) => (
                    <li key={s.id}>
                      <div className="sku-text">
                        <span>{s.variant_name ?? "Standard"}</span>
                        <span className="hint">{s.pack_size_label} <span className="mono">{s.sku_code}</span></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
