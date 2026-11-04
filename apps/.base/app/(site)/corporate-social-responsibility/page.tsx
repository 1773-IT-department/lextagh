import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import ArrowButton from "@/components/ArrowButton";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import ScreeningCarousel from "@/components/csr/ScreeningCarousel";
import csr from "@/components/csr/csr.module.css";
import p from "@/components/proto.module.css";

// Title and description exactly as the prototype's <helmet> sets them.
const title = "Corporate Social Responsibility | Lexta Ghana";
const description =
  "Cervical cancer screening with MWAG, The Dignity Project against period poverty, oral health in schools, boreholes, reforestation and plastic recycling. See Lexta Ghana's CSR work.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/* ---------- Shared prototype styles (values copied from corporate-social-responsibility.html) ---------- */

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const eyebrowDark: CSSProperties = { ...eyebrow, letterSpacing: ".18em", color: "#3fc0dd" };
const h2: CSSProperties = { margin: "14px 0 0", fontSize: 34, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const h2Mid: CSSProperties = { ...h2, margin: 0, fontSize: 30, lineHeight: 1.18 };
const lead: CSSProperties = { margin: "18px 0 0", fontSize: 15, lineHeight: 1.9, color: "#5d7883" };
const body: CSSProperties = { margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" };
const twoCol: CSSProperties = { maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 52, alignItems: "center" };
const schoolRow: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "center" };
const photoBox: CSSProperties = { borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 44px rgba(11,60,78,.18)" };
const photoBoxSm: CSSProperties = { ...photoBox, boxShadow: "0 18px 38px rgba(11,60,78,.16)" };
const coverImg: CSSProperties = { display: "block", width: "100%", height: "100%", objectFit: "cover" };
const storyLink: CSSProperties = { marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#12a3c4" };

/** Photo exactly as the prototype shows it (plain cover-fitted image; the story photos come from the existing Lexta and Yazz sites). */
function Photo({ src, alt, box = photoBox }: { src: string; alt: string; box?: CSSProperties }) {
  return (
    <div style={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={coverImg} />
    </div>
  );
}

function StoryLink({ href, children, marginTop = 22 }: { href: string; children: ReactNode; marginTop?: number }) {
  return (
    <a href={href} style={{ ...storyLink, marginTop }}>
      {children} <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
    </a>
  );
}

const stats = [
  { n: "2017", label: "Year our first CSR programme launched" },
  { n: "5", label: "Pillars: health, dignity, oral care, water, environment" },
  { n: "19", label: "Locations activated in a single day, 28 May 2026" },
  { n: "10", label: "Partner associations, agencies and hospitals" },
];

const pillars = [
  { n: "01", title: "Health and early detection", text: "Free cervical cancer screening and education, delivered with the medical professionals who can act on what they find." },
  { n: "02", title: "Dignity and education", text: "Keeping adolescent girls in school by removing the barrier of period poverty, and giving them the knowledge to manage their health with confidence." },
  { n: "03", title: "Oral health", text: "Free screenings and hygiene workshops in schools, in partnership with dental professionals." },
  { n: "04", title: "Water and sanitation", text: "Access to clean water in communities where safe hygiene is not currently possible." },
  { n: "05", title: "Environment", text: "Restoring what our production takes, and building circular systems that give plastic waste a value." },
];

const programmes = [
  {
    tag: "Oral health", title: "The Bright Smiles School Tour", href: "/news/the-bright-smiles-school-tour",
    text: "In partnership with the Ghana Dental Association, providing free biannual screenings and oral hygiene workshops in rural primary schools.",
  },
  {
    tag: "Water and sanitation", title: "The Safe Bottoms Initiative", href: "/news/the-safe-bottoms-initiative",
    text: "For every jumbo pack sold, Lexta funds the construction and maintenance of mechanised boreholes in communities facing water scarcity, so that safe hygiene for infants is possible in the first place.",
  },
  {
    tag: "Environment", title: "The Lexta Forest Project", href: "/news/the-lexta-forest-project",
    text: "A commitment to plant 10 indigenous trees for every 1,000 rolls of 100 percent virgin pulp tissue sold, restoring degraded forest reserves in the Ashanti and Eastern regions.",
  },
  {
    tag: "Circular economy", title: "Clean Hands, Green Land", href: "/news/clean-hands-green-land",
    text: "A plastic buy back programme. Consumers return empty sachet and detergent wrappers to Lexta distributors in exchange for Eco Points, redeemable against our products. Waste gets a value, and our distribution network becomes a collection network.",
  },
];

const unityGallery = [
  "/pasted-1788866172992-0-mtskqczo-f66n.png",
  "/pasted-1788866180557-0-mtskqitv-i38n.png",
  "/pasted-1788866187455-0-mtskqo5f-c2db.png",
  "/pasted-1788866193973-0-mtskqt6i-pvy9.png",
  "/pasted-1788866200678-0-mtskqycq-dsu9.png",
  "/pasted-1788866207000-0-mtskr38c-9u9b.png",
];

const partners: { logo?: { src: string; maxH: number; maxW: number }; name: string; label: string }[] = [
  { logo: { src: "/assets/partner-mwag.png", maxH: 78, maxW: 150 }, name: "Medical Women Association of Ghana", label: "Medical Women Association of Ghana" },
  { logo: { src: "/assets/partner-gda.png", maxH: 78, maxW: 150 }, name: "Ghana Dental Association", label: "Ghana Dental Association" },
  { logo: { src: "/assets/partner-ges.png", maxH: 70, maxW: 170 }, name: "Ghana Education Service", label: "Ghana Education Service" },
  { logo: { src: "/assets/partner-ghs.png", maxH: 78, maxW: 150 }, name: "Ghana Health Service", label: "Ghana Health Service" },
  { logo: { src: "/assets/partner-kbth.png", maxH: 78, maxW: 150 }, name: "Korle Bu Teaching Hospital", label: "Korle Bu Polyclinic, Family Medicine Department" },
  { logo: { src: "/assets/partner-tth.png", maxH: 78, maxW: 150 }, name: "Tamale Teaching Hospital", label: "Tamale Teaching Hospital" },
  { logo: { src: "/assets/partner-sofpog.png", maxH: 56, maxW: 170 }, name: "Society of Family Physicians of Ghana", label: "SOFPOG, Society of Family Physicians of Ghana" },
  { logo: { src: "/assets/partner-police.png", maxH: 78, maxW: 150 }, name: "Ghana Police Service", label: "Ghana Police Service, Public Affairs Unit" },
  { logo: { src: "/assets/partner-mx24.png", maxH: 64, maxW: 150 }, name: "MX24 TV", label: "MX24 TV" },
  { name: "Domite", label: "Domite Foundation" },
];

const sdgs = [
  { n: "SDG 3", title: "Good health and wellbeing", text: "Cervical cancer screening, oral health workshops, reproductive health education." },
  { n: "SDG 4", title: "Quality education", text: "Keeping girls in school through The Dignity Project, and supporting skills development through the GES Cook Art Competition." },
  { n: "SDG 5", title: "Gender equality", text: "Menstrual health advocacy, girl child education, and the removal of a barrier that only affects half the population." },
  { n: "SDG 6", title: "Clean water and sanitation", text: "Mechanised boreholes through Safe Bottoms, and school sanitation through the Teen Care clean up competitions." },
  { n: "SDG 12", title: "Responsible consumption and production", text: "The Clean Hands, Green Land plastic buy back programme." },
  { n: "SDG 15", title: "Life on land", text: "Reforestation of degraded reserves through The Lexta Forest Project." },
];

export default function CorporateSocialResponsibilityPage() {
  return (
    <>
      <RevealOnScroll />

      <section
        data-screen-label="CSR hero"
        style={{ position: "relative", background: "#0c303e", overflow: "hidden", minHeight: 480, display: "flex", alignItems: "center", padding: "92px 28px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/hero-cervical-screening.png"
          alt="Lexta outreach team with students"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg,rgba(6,32,42,.93) 0%,rgba(6,32,42,.7) 48%,rgba(6,32,42,.22) 82%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Corporate Social Responsibility</div>
            <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(32px,6.4vw,56px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              Care that leaves <span style={{ color: "#3fc0dd" }}>the shelf</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.92)", maxWidth: 600, textWrap: "pretty" }}>
              We make products that help people stay healthy, clean and confident. Our responsibility does not end when the pack is sold. It continues in the schools, clinics, markets and communities where those products are needed most.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
              <ArrowButton href="#programmes" padding="12px 12px 12px 20px">Explore our programmes</ArrowButton>
              <a
                href="#involved"
                style={{
                  display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)",
                  color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7,
                }}
              >
                Partner with us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Our approach" className={p.pad76} style={{ background: "#fff" }}>
        <div style={{ ...twoCol, alignItems: "start" }}>
          <div>
            <div style={eyebrow}>Our approach</div>
            <h2 style={h2}>We give what we know</h2>
            {/* Figures exactly as the approved prototype shows them. */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 32, background: "rgba(18,163,196,.2)",
                border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, overflow: "hidden",
              }}
            >
              {stats.map((s) => (
                <div key={s.n} style={{ background: "#f7fcfe", padding: "24px 22px 26px" }}>
                  <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", color: "#12313d", lineHeight: 1 }}>{s.n}</div>
                  <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7, fontWeight: 600, color: "#5d7883" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 26, borderLeft: "3px solid #12a3c4", padding: "4px 0 4px 18px" }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, fontWeight: 600, color: "#12313d", textWrap: "pretty" }}>
                We work where our products, our expertise and our distribution network can actually change an outcome.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "#5d7883" }}>
              A company that makes sanitary pads should be doing something about period poverty. A company that makes toothpaste should be in schools talking about oral health. A company that makes tissue from virgin pulp should be putting trees back in the ground.
            </p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "#5d7883" }}>
              That is the whole of our CSR philosophy. We do not write cheques for causes we have nothing to do with. We work where our products, our expertise and our distribution network can actually change an outcome, and we partner with the people who know the subject better than we do.
            </p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "#5d7883" }}>
              Since 2017 that has meant standing in school assembly halls, market squares, teaching hospitals and community durbars across Ghana, alongside doctors, teachers, foundations and public agencies who were already doing the work.
            </p>
          </div>
        </div>
      </section>

      <section id="pillars" data-reveal="1" data-screen-label="Our pillars" className={p.pad82} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={eyebrowDark}>Our pillars</div>
            <h2 style={{ ...h2, letterSpacing: "-.03em", color: "#fff" }}>Five areas where we can make a difference</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12, marginTop: 44, alignItems: "stretch" }}>
            {pillars.map((pl) => (
              <div
                key={pl.n}
                className={csr.pillarCard}
                style={{
                  minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 14, borderRadius: 16,
                  padding: "20px 18px 22px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.14)",
                  transition: "transform .25s ease,border-color .25s ease,background .25s ease",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", color: "rgba(63,192,221,.85)" }}>{pl.n}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.01em", lineHeight: 1.25 }}>{pl.title}</div>
                  <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.75, color: "rgba(255,255,255,.82)" }}>{pl.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programmes" data-reveal="1" data-screen-label="Dignity Project" className={p.pad78top} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={eyebrow}>Flagship programmes</div>
          <div style={{ ...twoCol, maxWidth: undefined, margin: "20px 0 0" }}>
            <div>
              <h2 style={{ ...h2, margin: 0 }}>The Dignity Project</h2>
              <p style={lead}>
                Our flagship initiative, led by Yazz. The aim is simple and specific: keep adolescent girls in school, with dignity, comfort and confidence in their personal care.
              </p>
              <p style={body}>
                Period poverty is one of the quietest causes of school absenteeism in Ghana. Girls miss days every month because they do not have access to the products they need or a safe place to manage their period. The Dignity Project addresses that directly, through free product distribution, reproductive health education, and sustained presence in schools rather than a single visit.
              </p>
            </div>
            <Photo src="https://lextagh.com/wp-content/uploads/2026/06/KAKEL-1875-683x1024.jpg" alt="The Dignity Project in schools" box={{ ...photoBox, maxHeight: 520 }} />
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Empowered Periods" style={{ background: "#fff", padding: "58px 28px" }}>
        <div style={twoCol}>
          <Photo src="https://lextagh.com/wp-content/uploads/2026/06/KAKEL-1845-1024x683.jpg" alt="The Empowered Periods Campaign" />
          <div>
            <h2 style={h2Mid}>The Empowered Periods Campaign</h2>
            <p style={lead}>
              Our annual nationwide activation, led by Yazz and Linzzy. In 2026 we activated across at least 19 locations in a single day on 28 May, distributing free sanitary products and delivering menstrual hygiene education to thousands of young women.
            </p>
            <p style={body}>
              The campaign combats period poverty and school absenteeism by supplying free premium sanitary products and hosting reproductive health seminars for schoolgirls annually. We believe no girl should miss an education because of a lack of basic hygiene resources.
            </p>
            <StoryLink href="/news/empowered-periods-reaches-19-locations-in-a-single-day">Read the full story</StoryLink>
          </div>
        </div>
      </section>

      <section
        data-reveal="1"
        data-screen-label="CroxItOut tour"
        style={{ background: "#f7fcfe", padding: "70px 28px", borderTop: "1px solid rgba(18,163,196,.14)", borderBottom: "1px solid rgba(18,163,196,.14)" }}
      >
        <div style={twoCol}>
          <div>
            <h2 style={h2Mid}>CroxItOut High School Tour 2026</h2>
            <p style={lead}>In partnership with MX24 TV, running under the theme “Awareness, Mentorship, Action” and the hashtag #EmpowerHer.</p>
            <p style={body}>
              The tour takes our advocacy directly into senior high schools nationwide, combining education, mentorship sessions and product engagement across five focus areas: breast cancer awareness, menstrual hygiene, oral health, personal hygiene and mental health.
            </p>
            <StoryLink href="/news/yazz-partners-mx24-tv-for-the-2026-croxitout-high-school-tour">Read the full story</StoryLink>
          </div>
          <Photo src="https://yazzproducts.com/wp-content/uploads/2026/09/WhatsApp-Image-2026-05-29-at-15.58.53-780x470-1.webp" alt="CroxItOut High School Tour with MX24 TV" />
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Programme grid" style={{ background: "#fff", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <h2 style={{ ...h2Mid, maxWidth: 600 }}>Programmes running alongside</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22, marginTop: 38 }}>
            {programmes.map((pr) => (
              <div key={pr.title} style={{ background: "#fff", borderRadius: 14, padding: "28px 26px 30px", boxShadow: "0 16px 34px rgba(11,60,78,.1)", display: "flex", flexDirection: "column" }}>
                <div style={eyebrow}>{pr.tag}</div>
                <h3 style={{ margin: "12px 0 0", fontSize: 18, fontWeight: 700, color: "#12313d", letterSpacing: "-.01em" }}>{pr.title}</h3>
                <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{pr.text}</p>
                <a href={pr.href} style={{ marginTop: "auto", paddingTop: 18, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}>
                  Read the full story <span aria-hidden="true">→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Teen Care Campaign" className={p.pad76} style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={twoCol}>
          <Photo src="https://lextagh.com/wp-content/uploads/2026/06/Lexta-Teen-Care-Campaign.jpg" alt="The Lexta Teen Care Campaign" />
          <div>
            <div style={eyebrow}>Since February 2017</div>
            <h2 style={{ ...h2Mid, margin: "14px 0 0" }}>The Lexta Teen Care Campaign</h2>
            <p style={lead}>Launched in February 2017, our original CSR programme and the foundation everything since has been built on.</p>
            <p style={body}>
              The campaign teaches senior high school students how to build good personal care and hygiene habits during adolescence, a crucial phase in their development. It covers cervical cancer, menstrual hygiene and oral care, alongside clean up competitions run with schools to improve sanitation on their own campuses.
            </p>
            <p style={body}>
              Cervical cancer is the leading cause of cancer death for women in 40 of the 48 countries of sub Saharan Africa. Across the world, between 60 and 90 percent of school children have dental cavities. Poor sanitation drives cholera, diarrhoea, dysentery, hepatitis A and typhoid. Each of those is preventable, and each begins with education.
            </p>
            <StoryLink href="/news/the-lexta-teen-care-campaign-launches">Read the full story</StoryLink>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Cervical cancer awareness" className={p.pad82} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 52, alignItems: "start" }}>
            <div>
              <div style={eyebrowDark}>Cervical cancer awareness</div>
              <h2 style={{ margin: "14px 0 0", fontSize: 32, lineHeight: 1.16, fontWeight: 700, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
                Nearly a decade with the Medical Women Association of Ghana
              </h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "rgba(255,255,255,.92)" }}>
                Cervical cancer is the second most common cancer among women in Ghana. Of the 2,797 women diagnosed each year, 1,699 die. It is preventable and treatable when found early.
              </p>
              <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>
                Every January, we sponsor and support the Medical Women Association of Ghana in taking free screening and education directly to the communities that need it, alongside partners including SOFPOG, the Korle Bu Polyclinic Family Medicine Department, the Ablekuma South Sub Metro Health Directorate and regional health services.
              </p>
            </div>
          </div>
          <ScreeningCarousel />
        </div>
      </section>

      <section data-reveal="1" data-screen-label="In schools" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>In schools</div>
            <h2 style={h2}>Where the work actually happens</h2>
          </div>

          <div style={{ ...schoolRow, marginTop: 46 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>Mawuko Girls SHS, Ho</h3>
              <p style={body}>
                Alongside the Medical Women Association of Ghana, led by immediate past MWAG President Dr. Naa Sodzi Tettey, our team visited Mawuko Girls Senior High School to educate students on cervical cancer and femcare, as part of a national school tour. The session focused on prevention and the importance of periodic screening. Products and learning materials were distributed to students.
              </p>
              <StoryLink href="/news/lexta-ghana-visits-mawuko-girls-shs-ho" marginTop={20}>Read the full story</StoryLink>
            </div>
            <Photo src="https://lextagh.com/wp-content/uploads/2026/06/Lexta-Ghana-Limited-Visits-Mawuko-girls-SHS-Ho.jpeg" alt="Lexta Ghana visits Mawuko Girls SHS, Ho" box={photoBoxSm} />
          </div>

          <div style={{ ...schoolRow, marginTop: 62 }}>
            <Photo
              src="https://lextagh.com/wp-content/uploads/2026/06/Lexta-Ghana-Limited-spent-time-with-the-girls-of-Unity-high-JHS-in-Kotobabi-in-commemoration-of-the-internal-womens-day.jpg"
              alt="Unity High JHS, Kotobabi, International Women's Day"
              box={photoBoxSm}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>Unity High JHS, Kotobabi, International Women&apos;s Day</h3>
              <p style={body}>
                In collaboration with the Domite Foundation, our team spent International Women&apos;s Day with the girls of Unity High JHS, taking them through basic hygiene routines and encouraging them to focus on their studies. Yazz sanitary towels and free learning materials were distributed to support the wellbeing and education of the girl child.
              </p>
              <StoryLink href="/news/international-womens-day-with-the-girls-of-unity-high-jhs-kotobabi" marginTop={20}>
                Read the full story
              </StoryLink>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginTop: 34 }}>
            {unityGallery.map((src, i) => (
              <div key={src} style={{ borderRadius: 10, overflow: "hidden", height: 150 }}>
                <ImageSlot placeholder={`Unity High JHS gallery ${i + 1}`} src={src} width={918} height={479} alt={`Unity High JHS, Kotobabi, gallery photo ${i + 1}`} />
              </div>
            ))}
          </div>

          <div style={{ ...schoolRow, marginTop: 62 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>GES Cook Art Competition</h3>
              <p style={body}>
                We launched the second edition of the Cook Arts Schools Competition, an annual contest organised by the Ghana Education Service to promote Home Economics in second cycle schools. Ashaiman Senior High School took the title. The competition tours the country, with two students selected from each of the 16 regions to compete in the national final in Accra.
              </p>
              <StoryLink href="/news/yazz-partners-the-ges-cook-art-competition" marginTop={20}>Read the full story</StoryLink>
            </div>
            <Photo src="https://yazzproducts.com/wp-content/uploads/2020/02/WhatsApp-Image-2020-02-11-at-11.57.18-AM.jpeg" alt="GES Cook Art Competition" box={photoBoxSm} />
          </div>
        </div>
      </section>

      <section
        data-reveal="1"
        data-screen-label="Partners"
        style={{ background: "#f7fcfe", padding: "70px 28px", borderTop: "1px solid rgba(18,163,196,.14)", borderBottom: "1px solid rgba(18,163,196,.14)" }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>Our partners</div>
            <h2 style={{ ...h2, fontSize: 32, lineHeight: 1.18 }}>We do not do this alone</h2>
            <p style={{ ...body, margin: "16px 0 0" }}>The medical associations, public agencies, hospitals and foundations who bring the expertise we do not have.</p>
          </div>
          <div
            style={{
              display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 1, marginTop: 42, background: "rgba(18,163,196,.22)",
              border: "1px solid rgba(18,163,196,.22)", borderRadius: 14, overflow: "hidden",
            }}
          >
            {partners.map((pa) => (
              <div
                key={pa.label}
                style={{
                  background: "#fff", padding: "26px 22px 22px", display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: pa.logo ? undefined : "center", gap: 16, minHeight: 190,
                }}
              >
                {pa.logo ? (
                  <div style={{ height: 78, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pa.logo.src}
                      alt={pa.name}
                      style={{ maxHeight: pa.logo.maxH, maxWidth: pa.logo.maxW, width: "auto", height: "auto", display: "block", objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div aria-hidden="true" style={{ height: 78, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", color: "#12a3c4" }}>
                    {pa.name}
                  </div>
                )}
                <div style={{ fontSize: 12, lineHeight: 1.6, fontWeight: 600, color: "#12313d", textAlign: "center", textWrap: "pretty" }}>{pa.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="SDGs" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>Sustainable Development Goals</div>
            <h2 style={h2}>Where our work connects</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 22, marginTop: 42 }}>
            {sdgs.map((s) => (
              <div
                key={s.n}
                style={{
                  background: "#fff", border: "1px solid rgba(18,163,196,.2)", borderTop: "3px solid #12a3c4", borderRadius: 14,
                  padding: "26px 24px 28px", boxShadow: "0 14px 30px rgba(11,60,78,.08)", display: "flex", flexDirection: "column", gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".14em", color: "#8fb6c2" }}>{s.n}</span>
                  <span style={{ flex: 1, height: 1, background: "rgba(18,163,196,.22)" }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-.015em", color: "#12313d", textWrap: "pretty" }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="involved" data-reveal="1" data-screen-label="Get involved" style={{ background: "#fff", padding: "20px 28px 76px" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14, padding: 46,
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 36, alignItems: "start",
            boxShadow: "0 22px 46px rgba(11,90,110,.26)",
          }}
        >
          <div>
            <div style={{ ...eyebrow, color: "rgba(255,255,255,.85)" }}>Get involved</div>
            <h2 style={{ margin: "14px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#fff", textWrap: "pretty" }}>Partner with us</h2>
            <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              We work best with organisations that bring expertise we do not have. If you run a school, a health facility, an NGO or a community programme and you think our products, our people or our distribution network could help, we would like to hear from you.
            </p>
            <Link
              href="/about-us#contact"
              style={{
                marginTop: 24, display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13,
                fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7,
              }}
            >
              Propose a partnership
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 12, padding: "26px 24px 28px" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Request an outreach visit</h3>
              <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.92)" }}>
                Schools and institutions can request a Lexta or Yazz outreach session covering menstrual health, oral care, cervical cancer awareness or general hygiene.
              </p>
              <Link href="/about-us#contact" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                Request a visit <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
              </Link>
            </div>
            <div style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 12, padding: "26px 24px 28px" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Read every story</h3>
              <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,.92)" }}>
                Our full archive of screenings, school tours and campaigns, from 2017 to today.
              </p>
              <a href="/news?category=CSR" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                View all CSR stories <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
