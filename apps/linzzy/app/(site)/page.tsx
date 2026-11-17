import type { Metadata } from "next";
import HomeClient from "@/components/linzzy/pages/HomeClient";
import { featuredProducts, homeTips } from "@/components/linzzy/model";
import { getLinzzyProducts } from "@/lib/products";

/** Rebuilt at most hourly; the portal's product saves refresh it at once through /api/revalidate. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Linzzy | Gentle Care for Bright Beginnings" },
  description: "Welcome to Linzzy, where thoughtful care meets everyday comfort. Our range of feminine hygiene and baby care essentials is thoughtfully developed to support everyday cleanliness, comfort and confidence.",
  alternates: { canonical: "/" },
};

/** Home (Linzzy Home.dc.html), with the featured products from Product Management. */
export default async function HomePage() {
  const { products } = await getLinzzyProducts();
  return <HomeClient featured={featuredProducts(products)} tips={homeTips()} />;
}
