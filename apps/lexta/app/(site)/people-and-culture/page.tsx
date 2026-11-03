import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import pc from "@/components/people/people.module.css";
import p from "@/components/proto.module.css";

// The prototype page had no title or description; these reuse its own hero copy.
const title = "People and Culture | Life at Lexta Ghana Limited";
const description =
  "We make products that hundreds of thousands of Ghanaian households depend on. That work is done by people, and how we treat them shows up in what leaves the factory.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/* ---------- Shared prototype styles (values copied from people-and-culture.html) ---------- */

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const h2: CSSProperties = { margin: "14px 0 0", fontSize: 34, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const h2Small: CSSProperties = { ...h2, fontSize: 32, lineHeight: 1.18 };
const body: CSSProperties = { fontSize: 14, lineHeight: 1.9, color: "#5d7883" };
const fill: CSSProperties = { position: "absolute", inset: 0 };
const slotFill: CSSProperties = { display: "block", width: "100%", height: "100%" };
const photoBox: CSSProperties = { borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 38px rgba(11,60,78,.16)" };
const ghostBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)",
  color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7,
};
const twoColTight: CSSProperties = { maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 52 };

type Photo = { placeholder: string; src: string; alt: string; w: number; h: number };

const photos = {
  production: { src: "/pasted-1788862892966-0-mtsis246-yfed.png", w: 1672, h: 941 },
  hygieneDay: { src: "/pasted-1788865773860-0-mtskht0u-7cqg.png", w: 960, h: 1280 },
  schoolTalk: { src: "/pasted-1788865790152-0-mtski5l9-mmbf.png", w: 918, h: 479 },
  screening: { src: "/pasted-1788865838716-0-mtskj730-quwo.png", w: 1024, h: 767 },
  campus: { src: "/pasted-1788863146762-0-mtsixhy1-fej8.png", w: 1671, h: 941 },
  kitchen: { src: "/pasted-1788863665969-0-mtsj8mkd-3thf.png", w: 1774, h: 887 },
  stall2: { src: "/pasted-1788863569187-0-mtsj6jyu-9jac.png", w: 640, h: 457 },
  shelf: { src: "/pasted-1788864602539-0-mtsjsp8a-bvzb.png", w: 1670, h: 941 },
  truck: { src: "/pasted-1788863416272-0-mtsj39w5-y1jr.png", w: 640, h: 480 },
  desk: { src: "/pasted-1788862416064-0-mtsihu4k-1tx9.png", w: 500, h: 500 },
  speaker: { src: "/pasted-1788863343139-0-mtsj1pgq-1xnf.png", w: 365, h: 547 },
  donation: { src: "/pasted-1788864443586-0-mtsjpakl-bqdh.png", w: 620, h: 413 },
  donation2: { src: "/pasted-1788864409002-0-mtsjojvz-o4fd.png", w: 620, h: 413 },
  stall: { src: "/pasted-1788863589556-0-mtsj6zlp-gm1a.png", w: 640, h: 457 },
};

const peoplePhotos: Photo[] = [
  { placeholder: "Team member at work", ...photos.hygieneDay, alt: "Yazz team at a Menstrual Hygiene Day event" },
  { placeholder: "Colleagues in discussion", ...photos.schoolTalk, alt: "Yazz team speaking to students at a school" },
  { placeholder: "Long-serving staff portrait", ...photos.screening, alt: "Group at a cervical cancer awareness event" },
];

const pillars = [
  { n: "01", title: "Entrepreneurship", text: "We hire people who take ownership. If you see something that could work better, we would rather you fix it than file it. You are trusted to take initiative, think creatively and run your work like it is your own business." },
  { n: "02", title: "Team cohesion", text: "We win as one company, not as competing departments. Production talks to sales. Sales talks to marketing. Nobody here gets to succeed while the person next to them fails." },
  { n: "03", title: "Growth", text: "Your progress is our progress. Through training, mentorship and clear career pathways, we invest in where you are going, not just what you are doing now." },
  { n: "04", title: "Drive", text: "We are a company that moves. We bring energy to the work, we push at the edges of what is possible, and we do not wait to be told twice." },
  { n: "05", title: "Results", text: "We set high standards, we measure honestly, and we celebrate together when we hit them. Effort matters. Outcomes matter more." },
];

const roles: (Photo & { title: string; text: string })[] = [
  {
    placeholder: "Production line photo", ...photos.campus, alt: "Lexta staff outside the Lexta facility", title: "Manufacturing and production",
    text: "Machine operators, line supervisors, production planners and engineers. The heart of the business, running to international hygiene and regulatory standards.",
  },
  {
    placeholder: "Quality lab photo", ...photos.kitchen, alt: "Mother and daughter with Lexta products at a kitchen table", title: "Quality assurance",
    text: "The people who decide whether a batch leaves the building. Rigorous, uncompromising, and the reason our brands hold their reputation.",
  },
  {
    placeholder: "Field sales / van sales photo", ...photos.stall2, alt: "Yazz team speaking with a trader at a market stall", title: "Sales and distribution",
    text: "Field representatives, area managers and key account teams working across Ghana and into Liberia, moving our brands from our floor to the shelves people actually shop from.",
  },
  {
    placeholder: "Brand / marketing team photo", ...photos.shelf, alt: "Shopper at a supermarket shelf of Yazz, Hooch and Linzzy products", title: "Marketing and brand",
    text: "Brand managers and marketing executives building Yazz, Linzzy and Hooch, and running the CSR campaigns that put us in schools and clinics nationwide.",
  },
  {
    placeholder: "Warehouse / fleet photo", ...photos.truck, alt: "Yazz branded truck with a team in red shirts", title: "Supply chain and logistics",
    text: "Warehousing, fleet, procurement and planning. The discipline that keeps a product available in Tamale on the same terms as in Accra.",
  },
  {
    placeholder: "Office / admin team photo", ...photos.desk, alt: "Man in a blue suit seated at a desk", title: "Finance, HR and administration",
    text: "The functions that let everything else run, staffed by people who understand a manufacturing business rather than a generic one.",
  },
];

const growthPoints = [
  { title: "Structured onboarding", text: "A proper first few weeks, with someone accountable for showing you how things actually run here." },
  { title: "Mentorship", text: "Experienced colleagues who are expected to develop the people around them, not just deliver their own numbers." },
  { title: "Ongoing training", text: "Technical certification, safety and compliance and professional development, kept current rather than filed away." },
];

const csrPhotos: Photo[] = [
  { placeholder: "Community product donation handover", ...photos.donation2, alt: "Yazz product donation handover" },
  { placeholder: "Field team outreach in the community", ...photos.stall, alt: "Yazz team speaking with a trader at a market stall" },
];

const hireSteps = [
  { n: "1", title: "Apply", text: "Submit your application online. You will get a confirmation, not silence." },
  { n: "2", title: "Screening", text: "We review every application. Shortlisted candidates hear from us within a defined window." },
  { n: "3", title: "Interview", text: "A conversation with the hiring manager and the team you would work with. We will tell you what we are looking for." },
  { n: "4", title: "Assessment", text: "For some roles, a practical exercise relevant to the actual job. Nothing artificial." },
  { n: "5", title: "Offer and onboarding", text: "A clear offer, a proper start, and a structured first few weeks." },
];

const arrangements = ["Full time", "Part time", "Contract", "Internship", "Remote"];

export default function PeopleAndCulturePage() {
  return (
    <>
      <RevealOnScroll />

      <section
        data-screen-label="Careers hero"
        style={{ position: "relative", background: "#0c303e", overflow: "hidden", minHeight: 480, display: "flex", alignItems: "center", padding: "92px 28px" }}
      >
        <div style={fill}>
          <ImageSlot placeholder="Lexta team on the factory floor" src={photos.production.src} width={photos.production.w} height={photos.production.h} alt="" style={slotFill} />
        </div>
        <div style={{ ...fill, background: "linear-gradient(100deg,rgba(6,32,42,.93) 0%,rgba(6,32,42,.68) 48%,rgba(6,32,42,.2) 82%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>People and Culture</div>
            <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(32px,6.4vw,56px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              Life at <span style={{ color: "#3fc0dd" }}>Lexta</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.92)", maxWidth: 600, textWrap: "pretty" }}>
              We make products that hundreds of thousands of Ghanaian households depend on. That work is done by people, and how we treat them shows up in what leaves the factory.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
              <ArrowButton href="#openings" padding="12px 12px 12px 20px">View current openings</ArrowButton>
              <a href="#roles" style={ghostBtn}>Learn about our work</a>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="People first" className={p.pad76} style={{ background: "#fff" }}>
        <div style={{ ...twoColTight, alignItems: "center" }}>
          <div>
            <div style={eyebrow}>Why our people come first</div>
            <h2 style={h2}>A company grows at the speed of its team</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "#5d7883" }}>
                Our greatest asset is not our machinery or our distribution network. It is the several hundred people who run them.
              </p>
              <p style={{ ...body, margin: 0 }}>
                We have never believed that a company can outgrow the people inside it. So we build for the long term: an environment where your wellbeing is taken seriously, your voice carries weight regardless of your title, and your development is treated as a shared investment rather than a personal problem.
              </p>
              <p style={{ ...body, margin: 0 }}>
                Some of the people who joined Lexta in its early years are still here, in bigger roles than the ones they started in. That is not an accident, and it is the outcome we are most proud of.
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "180px 180px", gap: 16 }}>
            {peoplePhotos.map((ph, i) => (
              <div key={ph.placeholder} className={i === 0 ? p.spanRow2 : undefined} style={photoBox}>
                <ImageSlot placeholder={ph.placeholder} src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} style={slotFill} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dna" data-reveal="1" data-screen-label="The Lexta DNA" className={p.pad82} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>The Lexta DNA</div>
            <h2 style={{ ...h2, letterSpacing: "-.03em", color: "#fff" }}>What makes a Lexta team member</h2>
            <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>
              Our culture rests on five pillars. They are not posters on a wall. They are how decisions actually get made here.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 22, marginTop: 44 }}>
            {pillars.map((pl) => (
              <div
                key={pl.n}
                className={pc.dnaCard}
                style={{
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(63,192,221,.24)", borderRadius: 14, padding: "26px 24px 28px",
                  transition: "transform .28s cubic-bezier(.2,.7,.2,1),background .28s,border-color .28s,box-shadow .28s",
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 9, background: "rgba(63,192,221,.16)", border: "1px solid rgba(63,192,221,.4)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#3fc0dd",
                  }}
                >
                  {pl.n}
                </div>
                <div style={{ marginTop: 18, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{pl.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.8)" }}>{pl.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" data-reveal="1" data-screen-label="Where you could work" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 660 }}>
            <div style={eyebrow}>Where you could work</div>
            <h2 style={h2}>More roles than most people expect</h2>
            <p style={{ ...body, margin: "16px 0 0" }}>
              Lexta is a manufacturer, a marketer and a distributor at once. That means the range of work here is far wider than a consumer goods company usually looks from the outside.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22, marginTop: 42 }}>
            {roles.map((r) => (
              <div key={r.title} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}>
                <div style={{ height: 190 }}>
                  <ImageSlot placeholder={r.placeholder} src={r.src} alt={r.alt} width={r.w} height={r.h} style={slotFill} />
                </div>
                <div style={{ padding: "24px 26px 28px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#12313d" }}>{r.title}</div>
                  <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        data-reveal="1"
        data-screen-label="Growth"
        className={p.pad78}
        style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)", borderBottom: "1px solid rgba(18,163,196,.14)" }}
      >
        <div style={{ ...twoColTight, alignItems: "stretch" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", height: 420, display: "block", boxShadow: "0 20px 44px rgba(11,60,78,.18)" }}>
            <ImageSlot
              placeholder="Training or mentorship photo"
              src={photos.speaker.src}
              width={photos.speaker.w}
              height={photos.speaker.h}
              alt="Speaker addressing an audience at a microphone"
              style={{ display: "block", width: "100%", height: 420 }}
            />
          </div>
          <div>
            <div style={eyebrow}>Growth</div>
            <h2 style={h2Small}>We would rather promote you than replace you</h2>
            <p style={{ ...body, margin: "18px 0 0" }}>
              Our first instinct when a role opens is to look inside the building. We invest in continuous training, both technical and professional, and we pair newer team members with people who have done the job long enough to teach it properly.
            </p>
            <p style={{ ...body, margin: "14px 0 0" }}>
              Career paths here are discussed openly, not guessed at. You should know what the next role looks like, what it takes to get there, and who is helping you.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginTop: 32 }}>
              {growthPoints.map((g) => (
                <div
                  key={g.title}
                  className={pc.growthCard}
                  style={{
                    position: "relative", background: "#fff", border: "1px solid rgba(18,163,196,.16)", borderRadius: 12, padding: "22px 20px 24px",
                    overflow: "hidden", boxShadow: "0 8px 20px rgba(11,60,78,.06)",
                    transition: "transform .28s cubic-bezier(.2,.7,.2,1),box-shadow .28s,border-color .28s",
                  }}
                >
                  <div style={{ width: 34, height: 4, borderRadius: 2, background: "#12a3c4" }} />
                  <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: "#12313d" }}>{g.title}</div>
                  <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Diversity" style={{ position: "relative", background: "#0b2f3d", overflow: "hidden" }}>
        <div style={fill}>
          <ImageSlot placeholder="Diverse team photo" src={photos.donation.src} width={photos.donation.w} height={photos.donation.h} alt="" style={slotFill} />
        </div>
        <div style={{ ...fill, background: "linear-gradient(95deg,rgba(8,42,55,.95),rgba(8,42,55,.7))", pointerEvents: "none" }} />
        <div className={p.pad82} style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3fc0dd" }}>Diversity and inclusion</div>
            <h2 style={{ ...h2, letterSpacing: "-.03em", color: "#fff" }}>Innovation needs different perspectives in the room</h2>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.9, color: "rgba(255,255,255,.92)" }}>
              We build products for every kind of Ghanaian household, which means we need a workforce that actually reflects them.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>
              We champion equal opportunity across gender, background and physical ability, and we hold ourselves to it in hiring, in promotion and in how meetings are run. We do not merely accept difference. We rely on it. It makes our products better, our decisions sharper and our company a place more people want to stay.
            </p>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Beyond the job" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ ...twoColTight, alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, order: 1 }}>
            {csrPhotos.map((ph) => (
              <div key={ph.placeholder} style={{ ...photoBox, height: 230 }}>
                <ImageSlot placeholder={ph.placeholder} src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} style={slotFill} />
              </div>
            ))}
          </div>
          <div>
            <div style={eyebrow}>Beyond the job</div>
            <h2 style={h2Small}>Work that reaches past the factory gate</h2>
            <p style={{ ...body, margin: "18px 0 0" }}>
              Our teams do not only make and sell products. They run the outreach that takes those products where they are needed most.
            </p>
            <p style={{ ...body, margin: "14px 0 0" }}>
              Our people have delivered free cervical cancer screening nationwide alongside the Medical Women Association of Ghana, including in Tamale and at Accra Psychiatric Hospital. They have run menstrual health education in schools across the country and campaigned against period poverty. They have partnered with the Ghana Education Service and the Ghana Police Service on programmes for students.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "#12313d", fontWeight: 600 }}>If that kind of work matters to you, there is room for it here.</p>
            <Link
              href="/corporate-social-responsibility"
              style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}
            >
              See our CSR programmes <span style={{ fontSize: 14 }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="How we hire" className={p.pad78} style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>How we hire</div>
            <h2 style={h2}>What to expect from us</h2>
            <p style={{ ...body, margin: "16px 0 0" }}>We try to keep our process clear and quick, and we tell you where you stand.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 20, marginTop: 44 }}>
            {hireSteps.map((s) => (
              <div key={s.n} style={{ background: "#fff", borderRadius: 14, padding: "26px 24px 28px", boxShadow: "0 16px 34px rgba(11,60,78,.09)" }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 13, fontWeight: 700,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: "#12313d" }}>{s.title}</div>
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "View current openings" buttons point here (#openings), as in the prototype. Job listings live on Careers. */}
      <section id="openings" data-reveal="1" data-screen-label="Flexible paths" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 44, alignItems: "center" }}>
          <div>
            <div style={eyebrow}>Flexible paths</div>
            <h2 style={h2Small}>Different stages, different arrangements</h2>
            <p style={{ ...body, margin: "16px 0 0" }}>
              We offer roles across a range of engagement types, because good people are at different points in their lives and careers.
            </p>
          </div>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {arrangements.map((t) => (
                <span
                  key={t}
                  style={{
                    border: "1px solid rgba(18,163,196,.45)", background: "#f7fcfe", color: "#12313d", borderRadius: 999, padding: "10px 18px",
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <ArrowButton href="#openings" padding="12px 12px 12px 20px" style={{ marginTop: 26 }}>View current openings</ArrowButton>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Closing CTA" style={{ background: "#fff", padding: "20px 28px 76px" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14, padding: 46,
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 32, alignItems: "center",
            boxShadow: "0 22px 46px rgba(11,90,110,.26)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#fff", textWrap: "pretty" }}>Ready to make your mark?</h2>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              We are a Ghanaian manufacturer with room to grow, and we would rather grow with people who want to build something than people who want a desk.
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              If there is nothing open that fits you today, send us a general application anyway. We keep them, and we read them.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link
              href="/careers#openings"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
            >
              See open roles
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
            </Link>
            <Link href="/careers#general" style={ghostBtn}>Send a general application</Link>
          </div>
        </div>
      </section>
    </>
  );
}
