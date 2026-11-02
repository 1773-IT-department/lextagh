import type { Metadata } from "next";

/** Internal check page for the shared layout (header, footer, mobile nav). Not linked anywhere, not indexed. */
export const metadata: Metadata = {
  title: "Layout preview | Lexta Ghana Limited",
  robots: { index: false, follow: false },
};

export default function LayoutPreview() {
  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 28px", minHeight: "60vh" }}>
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: "#12313d" }}>Shared layout preview</h1>
      <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.8, color: "#5d7883", maxWidth: 620 }}>
        This page only exists so the team can check the shared header, footer and mobile menu before pages are converted.
        It will be removed once the Home page is converted.
      </p>
    </main>
  );
}
