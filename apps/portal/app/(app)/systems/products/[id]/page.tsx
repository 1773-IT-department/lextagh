import Link from "next/link";
import { notFound } from "next/navigation";
import { productImageUrl, type Product, type ProductImage, type ProductSku } from "@lexta/db";
import ConfirmButton from "@/components/products/ConfirmButton";
import ImageManager from "@/components/products/ImageManager";
import PublishButton from "@/components/products/PublishButton";
import ProductForm from "@/components/products/ProductForm";
import { getProductAccess } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "../actions";

export const metadata = { title: "Edit product | Lexta Business System" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function EditProductPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; sku_error?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();

  const access = await getProductAccess();
  if (!access.canView) {
    return (
      <>
        <h1>Product management</h1>
        <p className="small">Your role does not include this system. Ask your Lexta administrator if you need it.</p>
      </>
    );
  }

  const supabase = await createClient();
  const { data: product, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle<Product>();
  if (error) throw new Error("Could not load the product");
  const brand = product && access.brands.find((b) => b.id === product.brand_id);
  if (!product || !brand) notFound();

  const [{ data: skus }, { data: images }, { data: cats }] = await Promise.all([
    supabase.from("product_skus").select("*").eq("product_id", id).order("sort_order").returns<ProductSku[]>(),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order").order("created_at").returns<ProductImage[]>(),
    supabase.from("products").select("category").not("category", "is", null).in("brand_id", access.brands.map((b) => b.id)),
  ]);
  const categories = [...new Set((cats ?? []).map((r) => r.category as string))].sort();
  const canEdit = access.canEdit;

  return (
    <>
      <p className="crumbs"><Link href="/systems/products">Products</Link> / {brand.name}</p>
      <div className="page-head">
        <div>
          <h1>{product.name}</h1>
          <p className="small">
            <span className={`badge ${product.is_published ? "on" : "off"}`}>{product.is_published ? "On the websites" : "Draft"}</span>{" "}
            {brand.name}{product.category ? `, ${product.category}` : ""}
          </p>
        </div>
        {canEdit && (
          <div className="head-actions">
            <PublishButton productId={product.id} isPublished={product.is_published} />
          </div>
        )}
      </div>

      {flags.created && !flags.sku_error && <div className="alert ok" role="status">Product created. Add images below, then publish when it is ready.</div>}
      {flags.sku_error && <div className="alert error" role="alert">Product created, but SKU {flags.sku_error} could not be saved. Its code may already be used by another product. Check the SKUs below and save again.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The product could not be deleted. Nothing was changed. Please try again. If it keeps happening, tell the IT team.</div>}
      {flags.error === "permission" && <div className="alert error" role="alert">The product was not deleted: you do not have permission to delete products of this brand. Nothing was changed.</div>}
      {flags.error === "linked" && <div className="alert error" role="alert">The product was not deleted because other records still need it. Nothing was changed. Tell the IT team which product it is.</div>}
      {!canEdit && <div className="alert info" role="note">You are viewing this product. Your role cannot change it.</div>}

      <div className="edit-grid">
        <ProductForm product={product} skus={skus ?? []} brands={access.brands} categories={categories} canEdit={canEdit} />
        <div>
          <ImageManager
            productId={product.id}
            brandSlug={brand.slug}
            canEdit={canEdit}
            images={(images ?? []).map((i) => ({ id: i.id, url: productImageUrl(i), alt_text: i.alt_text, is_primary: i.is_primary, is_upload: !!i.storage_path }))}
          />
          {canEdit && (
            <section className="panel danger-zone">
              <h2>Delete product</h2>
              <p className="small">Removes the product, its SKUs and images from the system and the websites. This cannot be undone. To hide it for now, unpublish it instead.</p>
              <form action={deleteProduct.bind(null, product.id)}>
                <ConfirmButton className="btn danger" message={`Delete ${product.name} for good? This cannot be undone.`}>Delete product</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
