import type { Metadata } from "next";
import ArrowButton from "@/components/ArrowButton";
import RevealOnScroll from "@/components/RevealOnScroll";
import NewsRoom from "@/components/news/NewsRoom";
import SubscribeBox from "@/components/news/SubscribeBox";
import { articleHref, featuredArticle, gridArticles, mediaContact, mediaEmail, mediaPhone, toCard } from "@/content/news";

// Title and description exactly as the prototype's <helmet> sets them.
const title = "News & Media | Lexta Ghana";
const description =
  "Campaign launches, outreach reports, partnerships and product news from Lexta Ghana and our brands Yazz, Linzzy and Hooch.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/news" },
  openGraph: { title, description, type: "website" },
};

const f = featuredArticle;

export default function NewsPage() {
  return (
    <>
      <RevealOnScroll />

      <section data-screen-label="News hero" style={{ background: "#0c303e", padding: "70px 28px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>News &amp; media</div>
          <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
          <h1 style={{ margin: "20px 0 0", fontSize: "clamp(32px,6vw,52px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty", maxWidth: 760 }}>
            What we have been <span style={{ color: "#3fc0dd" }}>up to</span>
          </h1>
          <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.9)", maxWidth: 620, textWrap: "pretty" }}>
            Campaign launches, outreach reports, partnerships and brand news from Lexta Ghana, Yazz, Linzzy and Hooch.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 0, marginTop: 54, borderRadius: "14px 14px 0 0", overflow: "hidden", background: "#fff", boxShadow: "0 -14px 40px rgba(4,26,34,.28)" }}>
            <div style={{ minHeight: 340, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.image} alt="The Empowered Periods Campaign" style={{ display: "block", width: "100%", height: "100%", minHeight: 340, objectFit: "cover" }} />
            </div>
            <div style={{ padding: "44px 42px 46px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ background: "rgba(18,163,196,.12)", color: "#0b6d88", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "6px 11px", borderRadius: 5 }}>Featured</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#5d7883" }}>{f.date}</span>
              </div>
              <h2 style={{ margin: "20px 0 0", fontSize: 30, lineHeight: 1.16, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>{f.title}</h2>
              <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.85, color: "#5d7883", textWrap: "pretty" }}>{f.excerpt}</p>
              <ArrowButton href={articleHref(f)} padding="12px 12px 12px 20px" style={{ marginTop: 26, alignSelf: "flex-start" }}>Read the full story</ArrowButton>
            </div>
          </div>
        </div>
      </section>

      <section data-screen-label="Newsroom" style={{ background: "#fff", padding: "44px 28px 78px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <NewsRoom articles={gridArticles.map(toCard)} />
        </div>
      </section>

      <section
        data-reveal="1"
        data-screen-label="Media enquiries"
        style={{ background: "#f7fcfe", padding: "70px 28px", borderTop: "1px solid rgba(18,163,196,.14)", borderBottom: "1px solid rgba(18,163,196,.14)" }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 44, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>Press</div>
            <h2 style={{ margin: "14px 0 0", fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>Media enquiries</h2>
            <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883", maxWidth: 480 }}>{mediaContact}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#12313d" }}>{mediaEmail}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#12313d" }}>{mediaPhone}</div>
            </div>
            <ArrowButton href="/about-us#contact" padding="12px 12px 12px 20px" style={{ marginTop: 24 }}>Contact the team</ArrowButton>
          </div>
          <SubscribeBox />
        </div>
      </section>
    </>
  );
}

