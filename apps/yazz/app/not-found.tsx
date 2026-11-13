import Link from "next/link";
import Icon from "@/components/Icon";
import SiteLayout from "./(site)/layout";

export default function NotFound() {
  return (
    <SiteLayout>
    <section className="yz-pad" style={{ padding: "80px var(--yz-gutter)", textAlign: "center" }}>
      <p className="yz-eyebrow">Page not found</p>
      <h1 className="yz-h2" style={{ marginTop: 12 }}>We couldn&apos;t find that page</h1>
      <p className="yz-lead" style={{ marginTop: 12 }}>It may have moved. Try our products or tips instead.</p>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
        <Link href="/products" className="yz-btn yz-btn--red">Explore Products <Icon name="arrow" size={16} /></Link>
        <Link href="/tips" className="yz-btn yz-btn--outline">Tips &amp; Articles</Link>
      </div>
    </section>
    </SiteLayout>
  );
}
