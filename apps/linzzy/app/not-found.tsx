import Link from "next/link";
import Icon from "@/components/Icon";
import SiteLayout from "./(site)/layout";

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="lz-wrap lz-section" style={{ textAlign: "center" }}>
        <p className="lz-eyebrow">Page not found</p>
        <h1 className="lz-h2" style={{ marginTop: 14 }}>We couldn&apos;t find that page</h1>
        <p className="lz-lead" style={{ marginTop: 14 }}>It may have moved. Try our products or tips instead.</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
          <Link href="/products" className="lz-btn lz-btn--berry">Explore Products <Icon name="arrow" size={18} /></Link>
          <Link href="/tips" className="lz-btn">Tips &amp; Advice</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
