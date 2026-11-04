import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import Enquiry from "@/components/contact/Enquiry";
import Faq from "@/components/contact/Faq";
import p from "@/components/proto.module.css";

// Title and description from contact-us.html.
const title = "Contact Us | Lexta Ghana";
const description = "Reach Lexta Ghana: general enquiries, distributor and bulk orders, consumer care, media and careers. Head office at Lexta Square, Dzorwulu, Accra.";

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
    title: "Sales and distribution", accent: true, email: "sales@lextagh.com",
    text: "Distributor appointments, trade terms, stock availability and route coverage.",
    second: { label: "+233 (0) 501 619 588", href: "tel:+233501619588" },
  },
  {
    title: "Consumer care", email: "support@lextagh.com",
    text: "Product questions, quality concerns and batch enquiries for Yazz, Linzzy, Crox and Softcare.",
    second: { label: "+233 (0) 302 235 296", href: "tel:+233302235296" },
  },
  {
    title: "Media and communications", email: "support@lextagh.com",
    text: "Interviews, campaign detail, brand assets and comment on our programmes.",
    second: { label: "Visit the newsroom →", href: "/news" },
  },
  {
    title: "Recruitment", email: "support@lextagh.com",
    text: "Applications, interview scheduling and questions about an open role.",
    second: { label: "See open roles →", href: "/careers#openings" },
  },
];

const visitFacts = [
  { title: "Office hours", text: "Monday to Friday, 8am to 5pm. Saturdays by arrangement." },
  { title: "Deliveries and collections", text: "Trade collections from 8am to 3pm at the goods gate, with an order reference." },
  { title: "Postal address", text: "P. O. Box AN 19064, Accra North, Ghana." },
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
                Talk to the right <span style={{ color: "#3fc0dd" }}>team directly</span>
              </h1>
              <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.9)", maxWidth: 560, textWrap: "pretty" }}>
                Distribution, bulk orders, consumer care, media or careers. Pick the route that fits and you reach the people who can actually answer.
              </p>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 50px rgba(4,26,34,.34)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/contact-hero.png"
                alt="Lexta customer care agent at her desk"
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
              <div style={cardNote}>P. O. Box AN 19064, Accra North</div>
            </div>
            <div style={{ padding: "32px 30px 34px", borderRight: "1px solid rgba(18,163,196,.16)" }}>
              <div style={cardLabel}>Call us</div>
              <div style={linkStack}>
                <a href="tel:+233501619588" style={cardLink}>+233 (0) 501 619 588</a>
                <a href="tel:+233302235296" style={cardLink}>+233 (0) 302 235 296</a>
              </div>
              <div style={cardNote}>Monday to Friday, 8am to 5pm GMT</div>
            </div>
            <div style={{ padding: "32px 30px 34px" }}>
              <div style={cardLabel}>Email us</div>
              <div style={linkStack}>
                <a href="mailto:support@lextagh.com" style={cardLink}>support@lextagh.com</a>
                <a href="mailto:sales@lextagh.com" style={cardLink}>sales@lextagh.com</a>
              </div>
              <div style={cardNote}>We reply within two working days</div>
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
            <div style={{ ...eyebrow, letterSpacing: ".18em", color: "#3fc0dd" }}>Direct lines</div>
            <h2 style={{ ...h2, fontSize: 34, lineHeight: 1.15, letterSpacing: "-.03em", color: "#fff" }}>Skip the switchboard</h2>
            <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>If you already know who you need, reach them here.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24, marginTop: 44 }}>
            {departments.map((d) => (
              <div key={d.title} style={{ borderTop: `3px solid ${d.accent ? "#3fc0dd" : "rgba(255,255,255,.28)"}`, paddingTop: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{d.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.8)" }}>{d.text}</p>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                  <a href={`mailto:${d.email}`} style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{d.email}</a>
                  {d.second.href.startsWith("/") ? (
                    <Link href={d.second.href} style={deptLink}>{d.second.label}</Link>
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
            <ImageSlot
              placeholder="Map or photo of Lexta Square, Dzorwulu"
              src="/pasted-1788866487314-0-mtskx3iw-btc6.png"
              width={707}
              height={434}
              alt="Lexta Square, the Lexta head office building in Dzorwulu, Accra"
              style={{ display: "block", width: "100%", height: 420 }}
            />
          </div>
          <div>
            <div style={eyebrow}>Visit us</div>
            <h2 style={h2}>Lexta Square, Dzorwulu</h2>
            <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" }}>
              Our head office and main manufacturing site sit on the Olusegun Obasanjo Highway in Dzorwulu, Accra. Visitors are welcome by appointment; factory tours require prior clearance for hygiene and safety reasons.
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
              <ArrowButton href="https://maps.google.com/?q=Dzorwulu,+Accra,+Ghana" padding="12px 12px 12px 20px">Get directions</ArrowButton>
              <a
                href="mailto:support@lextagh.com"
                style={{ display: "inline-flex", alignItems: "center", border: "1px solid rgba(18,163,196,.45)", background: "#f7fcfe", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
              >
                Book an appointment
              </a>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="FAQ" className={p.pad76} style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={eyebrow}>Before you write</div>
          <h2 style={h2}>Questions we get most</h2>
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
              We appoint distributors across Ghana and into Liberia, with trade terms, merchandising support and a field team behind you.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <a
              href="mailto:sales@lextagh.com"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
            >
              Contact us
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
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
