import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import ApplicationForm from "@/components/careers/ApplicationForm";
import OpenRoles from "@/components/careers/OpenRoles";
import { getCareersJobs } from "@/components/careers/live";
import p from "@/components/proto.module.css";

// Title and description from careers.html.
const title = "Careers | Lexta Ghana";
const description = "Current openings at Lexta Ghana across manufacturing, quality, sales, marketing, supply chain and support functions.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * Open roles come live from the Recruitment system. The page is rebuilt when the portal saves or opens or closes a
 * role (/api/revalidate clears the "jobs" tag and this path) and at the latest every hour, so a role drops off within
 * the hour after its closing day (applications are refused by the database from then on anyway).
 */
export const revalidate = 3600;

/* ---------- Shared prototype styles (values copied from careers.html) ---------- */

const fill: CSSProperties = { position: "absolute", inset: 0 };
const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const h2: CSSProperties = { margin: "14px 0 0", fontSize: 34, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const body: CSSProperties = { margin: "16px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" };
const statNum: CSSProperties = { fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-.03em" };
const statLabel: CSSProperties = { marginTop: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.75)" };


const benefits = [
  { title: "Health cover", text: "Medical cover for you, extended to dependants for permanent staff, plus on-site first aid and periodic screening." },
  { title: "Pension and statutory benefits", text: "SSNIT tier one and tier two contributions handled properly and on time, with clear payslips every month." },
  { title: "Training budget", text: "Technical certification, safety and compliance training and professional development, funded rather than encouraged." },
  { title: "Performance bonus", text: "Annual review with a bonus tied to targets you can see and influence, not a number decided in a closed room." },
  { title: "Staff product allocation", text: "A monthly allocation of Yazz, Linzzy and Hooch products for your household." },
  { title: "Internal mobility", text: "Open roles are advertised internally first, and we back moves between functions where the fit is right." },
];

const steps = [
  { n: "1", title: "Application", text: "Send your CV and a short note on why the role fits. You get a confirmation, not silence." },
  { n: "2", title: "Conversation", text: "A call with HR, then an interview with the hiring manager and the team you would work with." },
  { n: "3", title: "Practical exercise", text: "For technical and commercial roles, a task drawn from the actual job. Nothing artificial." },
  { n: "4", title: "Offer and onboarding", text: "References, a written offer with the terms spelled out, and a structured first few weeks." },
];

const interests = [
  "Manufacturing and production",
  "Quality assurance",
  "Sales and distribution",
  "Marketing and brand",
  "Supply chain and logistics",
  "Finance, HR and administration",
];

export default async function CareersPage() {
  const jobs = await getCareersJobs();
  // Counted from the live roles, so the hero never claims roles that are not open.
  const stats = [
    { value: String(jobs.length), label: "Roles open today", accent: true },
    { value: String(new Set(jobs.map((j) => j.department)).size), label: "Departments hiring" },
    { value: "2 wks", label: "Typical time to first reply" },
    { value: "4", label: "Locations across Ghana" },
  ];

  return (
    <>
      <RevealOnScroll />

      <section data-screen-label="Careers hero" className={p.pad82} style={{ position: "relative", background: "#0c303e", overflow: "hidden", paddingBottom: 70 }}>
        <div style={fill}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/careers-hero.png"
            alt="Lexta colleagues reviewing work together in the office"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block" }}
          />
        </div>
        <div style={{ ...fill, background: "linear-gradient(100deg,rgba(6,32,42,.95) 0%,rgba(6,32,42,.72) 52%,rgba(6,32,42,.28) 86%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Careers at Lexta</div>
            <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(32px,6.2vw,54px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              Build something people <span style={{ color: "#3fc0dd" }}>use every day</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.92)", maxWidth: 600, textWrap: "pretty" }}>
              Grow with a company that believes in people and possibilities. Explore opportunities in production, sales, logistics, marketing and administration. Here is where we are hiring right now.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
              <ArrowButton href="#openings" padding="12px 12px 12px 20px">Browse open roles</ArrowButton>
              <a
                href="#general"
                style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
              >
                Send a general application
              </a>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 18, marginTop: 52, maxWidth: 900 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ borderTop: `3px solid ${s.accent ? "#3fc0dd" : "rgba(255,255,255,.28)"}`, paddingTop: 14 }}>
                <div style={statNum}>{s.value}</div>
                <div style={statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="openings" data-screen-label="Open roles" style={{ background: "#fff", padding: "66px 28px 78px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <OpenRoles jobs={jobs} />
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Benefits" className={p.pad80} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>What you get</div>
            <h2 style={{ ...h2, letterSpacing: "-.03em", color: "#fff" }}>The terms behind the job title</h2>
            <p style={{ ...body, color: "rgba(255,255,255,.82)" }}>Details vary by role and level, and we set them out plainly in the offer rather than after you sign.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24, marginTop: 44 }}>
            {benefits.map((b) => (
              <div key={b.title} style={{ borderTop: "3px solid #3fc0dd", paddingTop: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{b.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.8)" }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Hiring process" className={p.pad76} style={{ background: "#f7fcfe", borderBottom: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>How we hire</div>
            <h2 style={h2}>Four steps, and we tell you where you stand</h2>
            <p style={body}>Most processes close within three to four weeks of the advert coming down.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 20, marginTop: 42 }}>
            {steps.map((s) => (
              <div key={s.n} style={{ background: "#fff", borderRadius: 14, padding: "26px 24px 28px", boxShadow: "0 16px 34px rgba(11,60,78,.09)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{s.n}</div>
                <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: "#12313d" }}>{s.title}</div>
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{s.text}</p>
              </div>
            ))}
          </div>
          <Link href="/people-and-culture" style={{ marginTop: 32, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}>
            Read about life at Lexta <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
          </Link>
        </div>
      </section>

      <section id="general" data-reveal="1" data-screen-label="General application" className={p.pad76} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={eyebrow}>Apply</div>
            <h2 style={{ ...h2, fontSize: 32, lineHeight: 1.18 }}>Nothing open that fits? Tell us anyway</h2>
            <p style={{ ...body, marginTop: 18 }}>
              We keep general applications on file and go back to them first when a role opens. Send us the function you are interested in and where you are based.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#12313d" }}>hr@lextagh.com</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#12313d" }}>+233 (0) 501 619 588</div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: "#5d7883", maxWidth: 320 }}>Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.</div>
            </div>
            <div style={{ marginTop: 26, borderRadius: 12, overflow: "hidden", flex: "1 1 auto", minHeight: 240, boxShadow: "0 18px 38px rgba(11,60,78,.16)" }}>
              {/* Photo from Lexta's original website (the lextagh.com careers page image, KAKEL-9871). */}
              <ImageSlot
                placeholder="Recruitment team photo"
                src="/assets/original/lexta-careers-team-1600x1200.jpg"
                width={1600}
                height={1200}
                alt="Lexta colleagues sharing Yazz gift hampers around the meeting room table"
              />
            </div>
          </div>

          <ApplicationForm roles={jobs.map((j) => ({ reference: j.reference, title: j.title }))} interests={interests} />
        </div>
      </section>
    </>
  );
}
