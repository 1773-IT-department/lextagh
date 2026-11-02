import Link from "next/link";
import { productImageUrl, type ProductImage } from "@lexta/db";
import { getProductAccess } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Products | Lexta Business System" };

type Row = {
  id: string;
  name: string;
  category: string | null;
  brand_id: string;
  is_published: boolean;
  updated_at: string;
  product_skus: { count: number }[];
  product_images: Pick<ProductImage, "storage_path" | "external_url" | "alt_text" | "is_primary" | "sort_order">[];
};

type Search = { brand?: string; q?: string; status?: string; deleted?: string; files?: string };

function NoAccess() {
  return (
    <>
      <h1>Product management</h1>
      <p className="small">Your role does not include this system. Ask your Lexta administrator if you need it.</p>
    </>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getProductAccess();
  if (!access.canView) return <NoAccess />;

  const brandIds = access.brands.map((b) => b.id);
  const brandFilter = params.brand && brandIds.includes(params.brand) ? params.brand : "";
  const status = params.status === "published" || params.status === "draft" ? params.status : "";
  // Keep only characters that are safe inside a PostgREST filter.
  const q = (params.q ?? "").replace(/[^\p{L}\p{N} '-]/gu, " ").trim().slice(0, 80);

  let rows: Row[] = [];
  let loadError = false;
  if (brandIds.length) {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("id, name, category, brand_id, is_published, updated_at, product_skus(count), product_images(storage_path, external_url, alt_text, is_primary, sort_order)")
      .in("brand_id", brandFilter ? [brandFilter] : brandIds)
      .order("sort_order")
      .order("name");
    if (status) query = query.eq("is_published", status === "published");
    if (q) query = query.or(`name.ilike.*${q}*,category.ilike.*${q}*`);
    const { data, error } = await query;
    if (error) {
      console.error("[products] list failed", error);
      loadError = true;
    } else rows = (data ?? []) as Row[];
  }

  const brandName = new Map(access.brands.map((b) => [b.id, b.name]));
  const filtered = !!(brandFilter || status || q);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Product management</h1>
          <p className="small">
            One place for every product, SKU, pack size and image. Published products appear on the websites.
            {!access.canEdit && " Your role can view products but not change them."}
          </p>
        </div>
        {access.canEdit && access.brands.length > 0 && <Link className="btn" href="/systems/products/new">New product</Link>}
      </div>

      {params.deleted && <div className="alert ok" role="status">The product was deleted.</div>}
      {params.deleted && params.files === "left" && <div className="alert info" role="note">Some of its image files could not be cleaned up. They are no longer shown anywhere; tell the IT team if this keeps happening.</div>}

      {access.brands.length === 0 ? (
        <div className="tile empty">
          <b>No brands assigned yet</b>
          <span>Ask your Lexta administrator to give you access to Yazz, Linzzy or Hooch.</span>
        </div>
      ) : (
        <>
          <form className="filters" method="get" role="search">
            <div className="field">
              <label htmlFor="q">Search</label>
              <input id="q" name="q" type="search" defaultValue={q} placeholder="Name or category" />
            </div>
            <div className="field">
              <label htmlFor="brand">Brand</label>
              <select id="brand" name="brand" defaultValue={brandFilter}>
                <option value="">All my brands</option>
                {access.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={status}>
                <option value="">Any</option>
                <option value="published">On the websites</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn" type="submit">Apply</button>
              {filtered && <Link className="btn light" href="/systems/products">Clear</Link>}
            </div>
          </form>

          {loadError ? (
            <div className="alert error" role="alert">We could not load the products. Please refresh the page. If it keeps happening, tell the IT team.</div>
          ) : rows.length === 0 ? (
            <div className="tile empty">
              <b>{filtered ? "No products match" : "No products yet"}</b>
              <span>{filtered ? "Try another search or clear the filters." : access.canEdit ? "Create the first product with the New product button." : "Products will appear here once marketing adds them."}</span>
            </div>
          ) : (
            <>
              <p className="small" aria-live="polite">{rows.length} {rows.length === 1 ? "product" : "products"}</p>
              <div className="table-wrap">
                <table className="ptable">
                  <thead>
                    <tr><th scope="col">Product</th><th scope="col">Brand</th><th scope="col">SKUs</th><th scope="col">Status</th><th scope="col">Last change</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const img = [...p.product_images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
                      return (
                        <tr key={p.id}>
                          <td className="pcell">
                            <span className="pthumb">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {img ? <img src={productImageUrl(img)} alt="" loading="lazy" /> : <span aria-hidden="true">No image</span>}
                            </span>
                            <span>
                              <Link href={`/systems/products/${p.id}`} className="pname">{p.name}</Link>
                              {p.category && <span className="hint">{p.category}</span>}
                            </span>
                          </td>
                          <td data-label="Brand">{brandName.get(p.brand_id) ?? ""}</td>
                          <td data-label="SKUs">{p.product_skus[0]?.count ?? 0}</td>
                          <td data-label="Status"><span className={`badge ${p.is_published ? "on" : "off"}`}>{p.is_published ? "On the websites" : "Draft"}</span></td>
                          <td data-label="Last change">{new Date(p.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
