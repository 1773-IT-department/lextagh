import Link from "next/link";
import Icon from "@/components/Icon";
import SiteLayout from "./(site)/layout";

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="hc-wrap hc-section" style={{ textAlign: "center" }}>
        <p className="hc-eyebrow">Page not found</p>
        <h1 className="hc-h2" style={{ marginTop: 14 }}>We couldn&apos;t find that page</h1>
        <p className="hc-lead" style={{ marginTop: 14 }}>It may have moved. Try our cereals or a breakfast idea instead.</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
          <Link href="/products" className="hc-btn hc-btn--red">Explore Our Products <Icon name="arrow" size={18} /></Link>
          <Link href="/recipes" className="hc-btn">Breakfast Ideas</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
