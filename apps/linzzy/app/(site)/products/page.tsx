import type { Metadata } from "next";
import { toProtoProduct } from "@/components/linzzy/model";
import ProductsClient from "@/components/linzzy/pages/ProductsClient";
import { getLinzzyProducts } from "@/lib/products";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Products",
  description: "Our Collection. Your Choice. Your Comfort. Discover Linzzy Cool Mint, Heavy Flow, Extra Long Sanitary Towels and Panty Liners. Explore our baby diapers and wipes, created for families who value comfort, cleanliness and convenient care.",
  alternates: { canonical: "/products" },
};

/** Products (Linzzy Products.dc.html): every Linzzy product from Product Management, in its two ranges. */
export default async function ProductsPage() {
  const { products } = await getLinzzyProducts();
  return <ProductsClient products={products.map(toProtoProduct)} />;
}
