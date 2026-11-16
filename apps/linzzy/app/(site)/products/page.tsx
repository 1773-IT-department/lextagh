import type { Metadata } from "next";
import { toProtoProduct } from "@/components/linzzy/model";
import ProductsClient from "@/components/linzzy/pages/ProductsClient";
import { getLinzzyProducts } from "@/lib/products";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: "Linzzy Feminine Care and Baby Care: Heavy Flow, Cool Mint and Extra Long sanitary towels, Panty Liners, Baby Diapers and Baby Wipes, from Lexta Ghana Limited.",
  alternates: { canonical: "/products" },
};

/** Products (Linzzy Products.dc.html): every Linzzy product from Product Management, in its two ranges. */
export default async function ProductsPage() {
  const { products } = await getLinzzyProducts();
  return <ProductsClient products={products.map(toProtoProduct)} />;
}
