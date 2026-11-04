import type { Metadata } from "next";
import Link from "next/link";
import ArrowButton from "@/components/ArrowButton";
import { faqGroups } from "@/components/faqs/data";
import LinkedText from "@/components/LinkedText";

// Title and description from faqs.html.
const title = "FAQs | Lexta Ghana";
const description = "Answers to common questions about Lexta Ghana products, distribution, bulk orders, careers and community work.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

export default function FaqsPage() {
  return (
    <>
      <section data-screen-label="FAQ hero" style={{ background: "#0c303e", padding: "70px 28px 60px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Help centre</div>
          <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
          <h1 style={{ margin: "20px 0 0", fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
            Frequently asked questions
          </h1>
          <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.9)", maxWidth: 600, textWrap: "pretty" }}>
            Answers on our products, buying from us, partnering with us and working here. If yours is not below, the team replies within two working days.
          </p>
        </div>
      </section>

      <section data-screen-label="FAQ list" style={{ background: "#fff", padding: "64px 28px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 46 }}>
          {faqGroups.map((g) => (
            <div key={g.title}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>{g.kicker}</div>
              <h2 style={{ margin: "10px 0 0", fontSize: 26, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-.02em", color: "#12313d" }}>{g.title}</h2>
              <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                {g.items.map((q) => (
                  <div key={q.q} style={{ border: "1px solid rgba(18,163,196,.18)", borderRadius: 13, padding: "22px 24px", background: "#f9fdfe" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "#12313d", letterSpacing: "-.01em", textWrap: "pretty" }}>{q.q}</div>
                    <p style={{ margin: "9px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883", textWrap: "pretty" }}><LinkedText text={q.a} links={q.links} /></p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-screen-label="FAQ CTA" style={{ background: "#fff", padding: "56px 28px 74px" }}>
        <div
          style={{
            maxWidth: 1000, margin: "0 auto", background: "#0c303e", borderRadius: 16, padding: "40px 36px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 26, alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", color: "#fff", textWrap: "pretty" }}>Still need an answer?</h2>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.8, color: "rgba(255,255,255,.82)", maxWidth: 440 }}>
              Send the question to the team. Trade, consumer care and recruitment enquiries all land with a named person.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <ArrowButton
              href="/contact-us"
              padding="13px 13px 13px 22px"
              style={{ borderRadius: 8 }}
              badgeStyle={{ width: 24, height: 24, background: "rgba(255,255,255,.25)" }}
            >
              Contact us
            </ArrowButton>
            <Link
              href="/partner-with-us"
              style={{ display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,.5)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "13px 22px", borderRadius: 8 }}
            >
              Partner with us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
