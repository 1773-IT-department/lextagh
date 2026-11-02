import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { getProductAccess } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New product | Lexta Business System" };

export default async function NewProductPage() {
  const access = await getProductAccess();
  if (!access.canEdit || access.brands.length === 0) {
    return (
      <>
        <p className="crumbs"><Link href="/systems/products">Products</Link></p>
        <h1>New product</h1>
        <p className="small">{access.canView ? "Your role can view products but not create them." : "Your role does not include this system. Ask your Lexta administrator if you need it."}</p>
      </>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category").not("category", "is", null).in("brand_id", access.brands.map((b) => b.id));
  const categories = [...new Set((data ?? []).map((r) => r.category as string))].sort();

  return (
    <>
      <p className="crumbs"><Link href="/systems/products">Products</Link></p>
      <h1>New product</h1>
      <p className="small">Fill in the details, then add images on the next screen.</p>
      <ProductForm brands={access.brands} categories={categories} canEdit />
    </>
  );
}
