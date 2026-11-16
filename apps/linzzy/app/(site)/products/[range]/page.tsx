import { notFound, permanentRedirect } from "next/navigation";
import { isRangeSlug, RANGE_SLUGS } from "@/lib/ranges";

// The new design shows both ranges on /products, so the old range pages send visitors (and saved links) to their band.
export function generateStaticParams() {
  return RANGE_SLUGS.map((range) => ({ range }));
}

export default async function RangePage({ params }: { params: Promise<{ range: string }> }) {
  const { range } = await params;
  if (!isRangeSlug(range)) notFound();
  permanentRedirect(range === "baby-care" ? "/products#baby" : "/products#fem");
}
