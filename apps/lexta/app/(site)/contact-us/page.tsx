import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import ArrowText from "@/components/ArrowText";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import Enquiry from "@/components/contact/Enquiry";
import Faq from "@/components/contact/Faq";
import p from "@/components/proto.module.css";

// Title and description from contact-us.html.
const title = "Contact Us | Lexta Ghana";
const description = "Contact Lexta Ghana for all inquiries. Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/* ---------- Shared prototype styles (values copied from contact-us.html) ---------- */

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const h2: CSSProperties = { margin: "14px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const cardLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" };
const cardLink: CSSProperties = { fontSize: 14, fontWeight: 600, color: "#12313d" };
const cardNote: CSSProperties = { marginTop: 8, fontSize: 12, color: "#5d7883" };
const linkStack: CSSProperties = { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 };
const deptLink: CSSProperties = { fontSize: 13, color: "rgba(255,255,255,.8)" };

type Dept = { title: string; text: string; email: string; accent?: boolean; second: { label: string; href: string } };

const departments: Dept[] = [
  {
    title: "Distributor / wholesale / modern trade", accent: true, email: "marketing@lextagh.com",
    text: "For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details.",
    second: { label: "+233 (0) 501 619 588", href: "tel:+233501619588" },
  },
  {
    title: "Complaints & product reviews", email: "support@lextagh.com",
    text: "Consumer Reports:",
    second: { label: "+233 (0) 509 967 400", href: "tel:+233509967400" },
  },
  {
    title: "Partnerships / Corporate Affairs", email: "marketing@lextagh.com",
    text: "Partnerships/sponsorships.",
    second: { label: "Visit the newsroom →", href: "/news" },
  },
  {
    title: "Job applications (recruitment)", email: "hr@lextagh.com",
    text: "To enquire about careers, use the Careers form.",
    second: { label: "See open roles →", href: "/careers#openings" },
  },
];

/** Plain Google Maps search link (no API key) for the head office address. */
const directionsUrl = "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra");

const visitFacts = [
  { title: "Office hours", text: "[PLACEHOLDER: Lexta office hours]" },
  { title: "Deliveries and collections", text: "[PLACEHOLDER: trade collection hours and point]" },
  { title: "Postal address", text: "[PLACEHOLDER: Lexta postal address (P. O. Box)]" },
];

export default function ContactPage() {
  return (
    <>
      <RevealOnScroll />

      <section data-screen-label="Contact hero" style={{ background: "#0c303e", padding: "70px 28px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 44, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Contact us</div>
              <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
              <h1 style={{ margin: "20px 0 0", fontSize: "clamp(32px,5vw,50px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
                Contact <span style={{ color: "#3fc0dd" }}>Lexta Ghana</span>
              </h1>
              <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.9)", maxWidth: 560, textWrap: "pretty" }}>
                Contact Lexta Ghana for all inquiries. Please use our FAQs below to find answers to some of the questions you may have.
              </p>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 50px rgba(4,26,34,.34)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/contact-hero.png"
                alt="Customer care agent at her desk"
                style={{ display: "block", width: "100%", height: "100%", minHeight: 320, maxHeight: 420, objectFit: "cover" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 0, marginTop: 54, borderRadius: "14px 14px 0 0",
              overflow: "hidden", background: "#fff", boxShadow: "0 -14px 40px rgba(4,26,34,.28)",
            }}
          >
            <div style={{ padding: "32px 30px 34px", borderRight: "1px solid rgba(18,163,196,.16)" }}>
              <div style={cardLabel}>Head office</div>
              <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: "#12313d", fontWeight: 600 }}>Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.</div>
              <div style={cardNote}>[PLACEHOLDER: Lexta postal address (P. O. Box)]</div>
            </div>
            <div style={{ padding: "32px 30px 34px", borderRight: "1px solid rgba(18,163,196,.16)" }}>
              <div style={cardLabel}>Call us</div>
              <div style={linkStack}>
                <a href="tel:+233501619588" style={cardLink}>+233 (0) 501 619 588</a>
                <a href="tel:+233302235296" style={cardLink}>+233 (0) 302 235 296</a>
                <a href="tel:+233302662970" style={cardLink}>+233 (0) 302 662 970</a>
              </div>
              <div style={cardNote}>WhatsApp Customer Care: <a href="https://wa.me/233544351010" style={{ color: "inherit" }}>+233 (0) 544 351 010</a>. [PLACEHOLDER: phone line opening hours]</div>
            </div>
            <div style={{ padding: "32px 30px 34px" }}>
              <div style={cardLabel}>Email us</div>
              <div style={linkStack}>
                <a href="mailto:marketing@lextagh.com" style={cardLink}>marketing@lextagh.com</a>
                <a href="mailto:hr@lextagh.com" style={cardLink}>hr@lextagh.com</a>
                <a href="mailto:support@lextagh.com" style={cardLink}>support@lextagh.com</a>
              </div>
              <div style={cardNote}>Messages go to a designated monitored inbox</div>
            </div>
          </div>
        </div>
      </section>

      <section data-screen-label="Enquiry form" style={{ background: "#fff", padding: "56px 28px 78px" }}>
        <Enquiry />
      </section>

      <section data-reveal="1" data-screen-label="Departments" className={p.pad78} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ ...eyebrow, letterSpacing: ".18em", color: "#3fc0dd" }}>Contact us</div>
            <h2 style={{ ...h2, fontSize: 34, lineHeight: 1.15, letterSpacing: "-.03em", color: "#fff" }}>Direct lines</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24, marginTop: 44 }}>
            {departments.map((d) => (
              <div key={d.title} style={{ borderTop: `3px solid ${d.accent ? "#3fc0dd" : "rgba(255,255,255,.28)"}`, paddingTop: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{d.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.8)" }}>{d.text}</p>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                  <a href={`mailto:${d.email}`} style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{d.email}</a>
                  {d.second.href.startsWith("/") ? (
                    <Link href={d.second.href} style={deptLink}><ArrowText text={d.second.label} /></Link>
                  ) : (
                    <a href={d.second.href} style={deptLink}>{d.second.label}</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Visit us" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "center" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", height: 420, display: "block", boxShadow: "0 20px 44px rgba(11,60,78,.18)" }}>
            {/* [PLACEHOLDER: photo of Lexta Square from Lexta]. The prototype used a third party Street View screenshot
                (someone else's credit and an Allianz caption), so it is not used. When Lexta supplies its own photo, add it
                to public/assets and pass src, width, height and alt here. */}
            <ImageSlot placeholder="Photo of Lexta Square, Dzorwulu" style={{ display: "block", width: "100%", height: 420 }} />
          </div>
          <div>
            <div style={eyebrow}>Visit us</div>
            <h2 style={h2}>Lexta Square, Dzorwulu</h2>
            <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" }}>
              Office address: Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 22, marginTop: 28 }}>
              {visitFacts.map((f) => (
                <div key={f.title} style={{ borderTop: "3px solid #12a3c4", paddingTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#12313d" }}>{f.title}</div>
                  <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{f.text}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <ArrowButton href={directionsUrl} padding="12px 12px 12px 20px">Get directions</ArrowButton>
              <a
                href="mailto:marketing@lextagh.com"
                style={{ display: "inline-flex", alignItems: "center", border: "1px solid rgba(18,163,196,.45)", background: "#f7fcfe", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
              >
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="FAQ" className={p.pad76} style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={eyebrow}>Before you write</div>
          <h2 style={h2}>FAQs</h2>
          <Faq />
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Closing CTA" style={{ background: "#fff", padding: "70px 28px" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14, padding: 46,
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 32, alignItems: "center",
            boxShadow: "0 22px 46px rgba(11,90,110,.26)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#fff", textWrap: "pretty" }}>Want to carry our brands?</h2>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <a
              href="mailto:marketing@lextagh.com"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
            >
              Contact us
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
            </a>
            <Link
              href="/our-brands"
              style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
            >
              See our brands
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
