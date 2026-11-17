import type { Metadata } from "next";
import ContactClient from "@/components/linzzy/pages/ContactClient";
import { isTopic } from "@/lib/forms/options";
import { getLinzzyProducts } from "@/lib/products";
import { contact, lexta } from "@/lib/site";
import { ALL_REGIONS, getLinzzyStockists, getWhereToBuyRegions, type StockistItem } from "@/lib/where-to-buy";

export const metadata: Metadata = {
  title: "Contact & Where to Buy",
  description: "Whether you need product information, want to share your experience, make a business enquiry or explore a partnership, our team is ready to hear from you.",
  alternates: { canonical: "/contact" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().toLowerCase() : "");

/**
 * Contact & Where to Buy (Linzzy Contact.dc.html): the stockist finder (Linzzy stockists of the Business System, Leaflet
 * map), the consumer form (CRM lead, or a complaint for a product problem) and the trade enquiry (CRM lead). Reads
 * ?region=, ?product= and ?topic= so links from the product pages arrive with their choices made.
 */
export default async function ContactPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [{ regions }, { products: all }] = await Promise.all([getWhereToBuyRegions(), getLinzzyProducts()]);
  // Coming soon items are not in the shops yet, so they are not offered here.
  const products = all.filter((p) => !p.comingSoon).map((p) => ({ slug: p.slug, name: p.name }));
  const regionParam = one(sp.region);
  const regionFromUrl = regionParam === ALL_REGIONS || regions.some((r) => r.slug === regionParam);
  const region = regionFromUrl ? regionParam : ALL_REGIONS;
  let stockists: StockistItem[] | null;
  try { stockists = await getLinzzyStockists(region); } catch { stockists = null; }
  const productParam = one(sp.product);
  const topicParam = one(sp.topic);
  return (
    <ContactClient
      regions={regions}
      initialRegion={region}
      initialStockists={stockists}
      regionFromUrl={regionFromUrl}
      products={products}
      initialTopic={isTopic(topicParam) ? topicParam : "question"}
      initialProduct={products.some((p) => p.slug === productParam) ? productParam : ""}
      marketingEmail={contact.partnershipsEmail}
      privacyUrl={lexta.privacy}
    />
  );
}
