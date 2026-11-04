import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ApplicationForm from "@/components/partner/ApplicationForm";
import RoutePicker from "@/components/partner/RoutePicker";
import { RouteProvider } from "@/components/partner/RouteContext";
import { benefits, steps } from "@/components/partner/data";

// Title and description from partner-with-us.html.
const title = "Partner With Us | Lexta Ghana";
const description = "Partner with Lexta Ghana as a distributor, retail chain, institutional buyer or private-label client across Ghana and Liberia.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/* ---------- Shared prototype styles (values copied from partner-with-us.html) ---------- */

const section: CSSProperties = { padding: "70px 28px" };
const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const h2: CSSProperties = { margin: "12px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const lead: CSSProperties = { margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" };
const arrowBadge: CSSProperties = { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 };

const stats = [
  { value: "16", text: "Regions covered by our distribution network" },
  { value: "2", text: "Markets served: Ghana and Liberia" },
  { value: "48h", text: "Typical response to a complete application" },
  { value: "6", text: "Consumer brands available to trade partners" },
];

const contacts = [
  { tag: "TR", title: "Trade desk", label: "sales@lextagh.com", href: "mailto:sales@lextagh.com" },
  { tag: "TL", title: "Call the team", label: "+233 (0) 501 619 588", href: "tel:+233501619588" },
];

const checklist = [
  { title: "Business registration", text: "certificate of incorporation and TIN." },
  { title: "Trade references", text: "two suppliers you currently buy from." },
  { title: "Storage and fleet", text: "warehouse size and vehicles available." },
  { title: "Coverage plan", text: "the towns, routes or outlets you serve." },
];

export default function PartnerPage() {
  return (
    <RouteProvider>
      <section data-screen-label="Partner hero" style={{ background: "#0c303e", padding: "74px 28px 66px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 46, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Partner with us</div>
            <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(32px,5vw,50px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              Grow with a house of <span style={{ color: "#3fc0dd" }}>everyday brands</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.9)", maxWidth: 520, textWrap: "pretty" }}>
              Distributors, retail chains, institutional buyers and private-label clients build with Lexta across Ghana and Liberia, backed by stock depth, trade terms and a field team that shows up.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
              <a
                href="#apply"
                style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "13px 13px 13px 22px", borderRadius: 8 }}
              >
                Start an application
                <span aria-hidden="true" style={{ ...arrowBadge, width: 24, height: 24, background: "rgba(255,255,255,.25)" }}>→</span>
              </a>
              <Link
                href="/our-brands"
                style={{ display: "inline-flex", alignItems: "center", border: "1px solid rgba(255,255,255,.5)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "13px 22px", borderRadius: 8 }}
              >
                See the portfolio
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {stats.map((s) => (
              <div key={s.text} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 13, padding: 24 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-.03em" }}>{s.value}</div>
                <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,.72)" }}>{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-screen-label="Partnership routes" style={{ ...section, background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={eyebrow}>Ways to partner</div>
          <h2 style={h2}>Six routes into the business</h2>
          <p style={{ ...lead, maxWidth: 600 }}>Pick the one closest to your operation. Each has its own terms, minimums and onboarding path.</p>
          <RoutePicker />
        </div>
      </section>

      <section data-screen-label="Partner support" style={{ ...section, background: "#f4fafc" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={eyebrow}>What you get</div>
          <h2 style={h2}>Support that protects your margin</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 18, marginTop: 32, maxWidth: 1100 }}>
            {benefits.map((b) => (
              <div key={b.title} style={{ background: "#fff", border: "1px solid rgba(18,163,196,.16)", borderRadius: 13, padding: "26px 24px", boxShadow: "0 12px 26px rgba(11,60,78,.06)" }}>
                <div style={{ ...eyebrow, letterSpacing: ".14em" }}>{b.kicker}</div>
                <div style={{ marginTop: 10, fontSize: 15.5, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{b.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.85, color: "#5d7883" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-screen-label="Process" style={{ ...section, background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ ...eyebrow, color: "#3fc0dd" }}>How it works</div>
          <h2 style={{ ...h2, color: "#fff" }}>From enquiry to first delivery</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 18, marginTop: 34 }}>
            {steps.map((s) => (
              <div key={s.num} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 13, padding: "26px 24px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3fc0dd", letterSpacing: ".14em" }}>{s.num}</div>
                <div style={{ marginTop: 12, fontSize: 15.5, fontWeight: 700, color: "#fff", letterSpacing: "-.015em" }}>{s.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.85, color: "rgba(255,255,255,.75)" }}>{s.desc}</p>
                <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.55)", letterSpacing: ".06em", textTransform: "uppercase" }}>{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" data-screen-label="Application form" style={{ ...section, background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "start" }}>
          <div>
            <div style={eyebrow}>Apply</div>
            <h2 style={h2}>Tell us about your business</h2>
            <p style={{ ...lead, maxWidth: 460 }}>Send the basics and our trade team comes back with terms, coverage and the documents we need next.</p>
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
              {contacts.map((c) => (
                <div key={c.tag} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      flex: "0 0 auto", width: 34, height: 34, borderRadius: 9, background: "#f0f9fc", color: "#0b6d88",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {c.tag}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#12313d" }}>{c.title}</div>
                    <a href={c.href} style={{ fontSize: 13, color: "#128fb0" }}>{c.label}</a>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 26, background: "#f7fcfe", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "24px 24px 26px" }}>
              <div style={{ ...eyebrow, letterSpacing: ".14em" }}>Have these ready</div>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {checklist.map((c) => (
                  <div key={c.title} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ flex: "0 0 auto", width: 7, height: 7, borderRadius: "50%", background: "#12a3c4", marginTop: 7 }} />
                    <div style={{ fontSize: 12.5, lineHeight: 1.75, color: "#3f5f6b" }}>
                      <strong style={{ color: "#12313d" }}>{c.title}</strong>{`: ${c.text}`}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(18,163,196,.18)", fontSize: 12, lineHeight: 1.75, color: "#5d7883" }}>
                Missing something? Apply anyway, and the trade desk will tell you what else is needed.
              </div>
            </div>
          </div>

          <ApplicationForm />
        </div>
      </section>

      <section data-screen-label="Closing CTA" style={{ background: "#fff", padding: "0 28px 74px" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14, padding: 46,
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 32, alignItems: "center",
            boxShadow: "0 22px 46px rgba(11,90,110,.26)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#fff", textWrap: "pretty" }}>Not sure which route fits?</h2>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              Talk it through with the trade team first. We will tell you honestly whether the coverage is open in your area.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link
              href="/contact-us"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
            >
              Contact us
              <span aria-hidden="true" style={{ ...arrowBadge, background: "#12a3c4", color: "#fff" }}>→</span>
            </Link>
            <Link
              href="/our-brands"
              style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
            >
              See our brands
            </Link>
          </div>
        </div>
      </section>
    </RouteProvider>
  );
}
