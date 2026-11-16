"use client";

import ShellView from "@/components/linzzy/views/ShellView";
import { useChrome } from "@/components/linzzy/chrome";

/** Page not found, inside the new design's header and footer. */
export default function NotFoundClient() {
  const c = useChrome("", "Page Not Found");
  const v = { ...c.base, chapters: c.chapters([["top", "00", "Page Not Found"]]) };
  return (
    <ShellView v={v}>
      <section id="top" data-chapter="Page Not Found" data-num="00" style={{ minHeight: "70vh", background: "#FBF8FF", padding: "clamp(130px,16vw,200px) clamp(20px,5vw,80px) 100px" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C2185B" }}>Page not found</p>
        <h1 style={{ margin: "22px 0 0", fontFamily: "'DM Serif Display',serif", fontWeight: 400, fontSize: "clamp(44px,7vw,110px)", lineHeight: 0.95, letterSpacing: "-0.03em", color: "#23103a" }}>We couldn&apos;t find <em style={{ color: "#C2185B" }}>that page</em></h1>
        <p style={{ margin: "28px 0 0", maxWidth: 620, fontSize: 20, lineHeight: 1.5, color: "#3d2a55" }}>It may have moved. Try our products or tips instead.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36 }}>
          <a href="/products" className="lzt3" style={{ padding: "18px 30px", background: "#23103a", color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>Explore Products</a>
          <a href="/tips" className="lzt3" style={{ padding: "18px 30px", border: "1.5px solid #23103a", color: "#23103a", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>Tips &amp; Advice</a>
        </div>
      </section>
    </ShellView>
  );
}
