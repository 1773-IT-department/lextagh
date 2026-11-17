import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import ArrowButton from "@/components/ArrowButton";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import csr from "@/components/csr/csr.module.css";
import p from "@/components/proto.module.css";
import { isLiveStoryHref } from "@/content/news/held";

// Title as the prototype's <helmet> sets it; description from Lexta's Drive CSR text.
const title = "Corporate Social Responsibility | Lexta Ghana";
const description =
  "Our care extends beyond our products. Through education, hygiene awareness, environmental responsibility and community partnerships, Lexta seeks to help create healthier, more informed and more sustainable communities.";

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
  if (!isLiveStoryHref(href)) return null; // the story is held back until Lexta approves it (content/news/held.ts)
  return (
    <a href={href} style={{ ...storyLink, marginTop }}>
      {children} <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
    </a>
  );
}

const stats = [
  { n: "2017", label: "The Lexta Teen Care Campaign launched in February 2017" },
  { n: "6", label: "CSR initiatives" },
  { n: "[PLACEHOLDER: Empowered Periods reach figure]", label: "Schools or locations reached by Empowered Periods" },
  { n: "[PLACEHOLDER: number of partner organisations]", label: "Partner associations, agencies and hospitals" },
];

const pillars = [
  { n: "01", title: "Cervical cancer awareness", text: "Knowledge can support prevention and earlier action. Yazz seeks to amplify professionally guided education on cervical health, screening and HPV vaccination through suitable health-sector partnerships." },
  { n: "02", title: "Empowered Periods", text: "Every period deserves dignity. Through menstrual education, product-access partnerships and school/community conversations, Empowered Periods aims to help girls and women manage menstruation with knowledge, confidence and support." },
  { n: "03", title: "Bright Smiles", text: "Healthy smiles begin with everyday habits. The Bright Smiles School Tour proposes age-appropriate oral-hygiene education and partnerships with qualified dental professionals and schools." },
  { n: "04", title: "Safe Bottoms", text: "Good baby hygiene begins with information and access. Safe Bottoms is designed to support caregiver education, responsible diaper and wipe disposal and community hygiene partnerships." },
  { n: "05", title: "Forest and Clean Hands", text: "Care for our homes should go hand in hand with care for the environment. Clean homes and a cleaner environment belong together." },
];

const programmes: { tag: string; title: string; href?: string; text: string }[] = [
  {
    tag: "Lexta Foundation", title: "Lexta Legacy Project",
    text: "Supporting deprived communities with education, clean and safe water, one community at a time.",
  },
  {
    tag: "Oral health", title: "The Bright Smiles School Tour", href: "/news/the-bright-smiles-school-tour",
    text: "Healthy smiles begin with everyday habits. The Bright Smiles School Tour proposes age-appropriate oral-hygiene education and partnerships with qualified dental professionals and schools.",
  },
  {
    tag: "Water and sanitation", title: "The Safe Bottoms Initiative", href: "/news/the-safe-bottoms-initiative",
    text: "For every jumbo pack sold, Yazz Diapers/Wipes funds the construction/maintenance of mechanised boreholes in communities facing water scarcity to ensure safe hygiene for infants. Safe Bottoms is designed to support caregiver education, responsible diaper and wipe disposal and community hygiene partnerships.",
  },
  {
    tag: "Environment", title: "The Lexta Forest Project", href: "/news/the-lexta-forest-project",
    text: "The Lexta Forest Project is a proposed tree-planting and environmental-education platform linking everyday paper use with responsible stewardship. Commitment to plant 10 indigenous trees for every 1,000 rolls of 100% Virgin Pulp tissue sold, restoring degraded forest reserves.",
  },
  {
    tag: "Responsible consumption", title: "Clean Hands, Green Land", href: "/news/clean-hands-green-land",
    text: "Clean homes and a cleaner environment belong together. This proposed programme focuses on practical hygiene education, responsible packaging disposal and community clean-up partnerships.",
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


/**
 * Cervical cancer awareness band: Lexta's own stories, from lextagh.com posts (Mawuko Girls SHS, 4 February 2019;
 * Lexta Teen Care Campaign, 30 May 2017). The third card stays a placeholder until Lexta supplies its screening stories.
 */
const cervicalStories: { when: string; title: string; text: string; href?: string }[] = [
  {
    when: "February 2019", title: "Mawuko Girls SHS, Ho",
    text: "With MWAG, as part of the national tour to schools and other institutions to educate Ghanaians, especially women and girls, on the deadly cervical cancer disease.",
    href: "/news/lexta-ghana-visits-mawuko-girls-shs-ho",
  },
  {
    when: "Since February 2017", title: "Lexta Teen Care Campaign",
    text: "Educating Ghanaian teenagers, both boys and girls, on the dangers of cervical cancer serves as a preventive measure aimed at reducing the infection rate of the disease in the country.",
    href: "/news/the-lexta-teen-care-campaign-launches",
  },
  {
    when: "Screening", title: "Screening stories",
    text: "[PLACEHOLDER: Lexta's own cervical cancer screening stories (place, date, partners, one line each)]",
  },
];

const partners: { logo?: { src: string; maxH: number; maxW: number }; name: string; label: string }[] = [
  { logo: { src: "/assets/partner-mwag.png", maxH: 78, maxW: 150 }, name: "Medical Women Association of Ghana", label: "Medical Women Association of Ghana" },
  { name: "Domite", label: "Domite Foundation" },
  { logo: { src: "/assets/partner-police.png", maxH: 78, maxW: 150 }, name: "Ghana Police Service", label: "Ghana Police Service" },
  { name: "TBC", label: "[PLACEHOLDER: oral health partner, to be confirmed by Lexta]" },
  { name: "TBC", label: "[PLACEHOLDER: other CSR partners Lexta wants listed, with their logos]" },
];

const sdgs = [
  { n: "SDG 3", title: "Good Health", text: "Oral Care (Paste & Brush): The \"Bright Smiles\" School Tour." },
  { n: "SDG 4", title: "Quality education", text: "[PLACEHOLDER: which initiative, if any, Lexta links to SDG 4]" },
  { n: "SDG 5", title: "Gender Equality", text: "Feminine Care (Pads & Liners): The \"Empowered Periods\" Campaign/Tours." },
  { n: "SDG 6", title: "Clean Water & Sanitation", text: "Baby Care (Diapers & Wipes): The \"Safe Bottoms\" Initiative." },
  { n: "SDG 12", title: "Responsible Consumption", text: "Home Care (Washing Powder/Detergents): \"Clean Hands, Green Land\"." },
  { n: "SDG 15", title: "Life on Land", text: "Paper & Hygiene (Tissue/Napkins): The \"Yazz Forest\" Project." },
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
              Our care extends beyond <span style={{ color: "#3fc0dd" }}>our products</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.92)", maxWidth: 600, textWrap: "pretty" }}>
              Through education, hygiene awareness, environmental responsibility and community partnerships, Lexta seeks to help create healthier, more informed and more sustainable communities. Explore initiatives by brand, submit a partnership proposal or request information about a programme.
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
            <h2 style={h2}>Corporate Social Responsibility</h2>
            {/* Figures exactly as the approved prototype shows them. */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 32, background: "rgba(18,163,196,.2)",
                border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, overflow: "hidden",
              }}
            >
              {stats.map((s) => (
                <div key={s.n} style={{ background: "#f7fcfe", padding: "24px 22px 26px" }}>
                  <div style={s.n.startsWith("[PLACEHOLDER") ? { fontSize: 13, fontWeight: 700, lineHeight: 1.45, color: "#12313d" } : { fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", color: "#12313d", lineHeight: 1 }}>{s.n}</div>
                  <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7, fontWeight: 600, color: "#5d7883" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "#5d7883" }}>
              As a socially conscious organization, we passionately believe in positively impacting the lives of our customers, as well as the communities in which we operate, and we achieve this through our Corporate Social Responsibility (CSR) projects.
            </p>
          </div>
        </div>
      </section>

      <section id="pillars" data-reveal="1" data-screen-label="Our pillars" className={p.pad82} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={eyebrowDark}>Our pillars</div>
            <h2 style={{ ...h2, letterSpacing: "-.03em", color: "#fff" }}>CSR / Community Impact</h2>
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
                Every period deserves dignity. Empowered Periods, Dignity Project: Women's Health (Cervical / Breast Cancer Awareness); Yazz / Linzzy sanitary towels and panty liners.
              </p>
              <p style={body}>
                Through menstrual education, product-access partnerships and school/community conversations, Empowered Periods aims to help girls and women manage menstruation with knowledge, confidence and support.
              </p>
            </div>
            <Photo src="/assets/original/web/lexta-kakel-1875-683x1024.webp" alt="The Dignity Project in schools" box={{ ...photoBox, maxHeight: 520 }} />
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Empowered Periods" style={{ background: "#fff", padding: "58px 28px" }}>
        <div style={twoCol}>
          <Photo src="/assets/original/web/lexta-kakel-1845-1024x683.webp" alt="The Empowered Periods Campaign" />
          <div>
            <h2 style={h2Mid}>The Empowered Periods Campaign</h2>
            <p style={lead}>
              Led by our flagship brands Yazz and Linzzy, this initiative directly combats period poverty and school absenteeism.
            </p>
            <p style={body}>
              We achieve this by supplying free premium sanitary products and hosting comprehensive reproductive health seminars for thousands of schoolgirls annually. We believe that no girl should miss an education due to a lack of basic hygiene resources.
            </p>
            <StoryLink href="/news/empowered-periods-reaches-19-locations-in-a-single-day">Read the full story</StoryLink>
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Programme grid" style={{ background: "#fff", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <h2 style={{ ...h2Mid, maxWidth: 600 }}>Initiatives by brand</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 16, marginTop: 38 }}>
            {programmes.map((pr) => (
              <div key={pr.title} style={{ background: "#fff", borderRadius: 14, padding: "26px 20px 28px", boxShadow: "0 16px 34px rgba(11,60,78,.1)", display: "flex", flexDirection: "column" }}>
                <div style={eyebrow}>{pr.tag}</div>
                <h3 style={{ margin: "12px 0 0", fontSize: 18, fontWeight: 700, color: "#12313d", letterSpacing: "-.01em" }}>{pr.title}</h3>
                <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{pr.text}</p>
                {pr.href ? (
                  <a href={pr.href} style={{ marginTop: "auto", paddingTop: 18, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}>
                    Read the full story <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <a href="#involved" style={{ marginTop: "auto", paddingTop: 18, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}>
                    Propose a partnership <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="Teen Care Campaign" className={p.pad76} style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={twoCol}>
          <Photo src="/assets/original/web/lexta-lexta-teen-care-campaign.webp" alt="The Lexta Teen Care Campaign" />
          <div>
            <div style={eyebrow}>Since February 2017</div>
            <h2 style={{ ...h2Mid, margin: "14px 0 0" }}>The Lexta Teen Care Campaign</h2>
            <p style={lead}>As our flagship CSR project, the Lexta Teen Care Campaign aims at teaching students in Senior High Schools (SHS) how to properly cultivate good personal care and general hygiene habits in their adolescent years, a crucial phase in their development.</p>
            <p style={body}>
              The Campaign which was launched in February 2017 is set to educate SHS students across the country on cervical cancer, menstrual hygiene and oral care. A number of clean-up competitions will be executed to keep our school environments neat and tidy.
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
                Cervical cancer awareness with the Medical Women Association of Ghana
              </h2>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "rgba(255,255,255,.92)" }}>
                Knowledge can support prevention and earlier action. Yazz seeks to amplify professionally guided education on cervical health, screening and HPV vaccination through suitable health-sector partnerships.
              </p>
            </div>
          </div>
          {/* The screening carousel (components/csr/ScreeningCarousel.tsx) held five press summaries with no Lexta source; it returns when Lexta supplies its own stories. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 40 }}>
            {cervicalStories.map((st) => (
              <div key={st.title} style={{ borderRadius: 14, padding: "22px 22px 24px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.14)", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(63,192,221,.85)" }}>{st.when}</div>
                <div style={{ marginTop: 10, fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.01em", lineHeight: 1.3 }}>{st.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "rgba(255,255,255,.82)" }}>{st.text}</p>
                {st.href ? (
                  <a href={st.href} style={{ marginTop: "auto", paddingTop: 16, fontSize: 13, fontWeight: 600, color: "#3fc0dd" }}>
                    Read the full story <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" data-screen-label="In schools" className={p.pad78} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>In schools</div>
            <h2 style={h2}>Latest Activities &amp; Campaigns</h2>
          </div>

          <div style={{ ...schoolRow, marginTop: 46 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>Mawuko Girls SHS, Ho</h3>
              <p style={body}>
                In collaboration with the Medical Women Association of Ghana (MWAG), led by the immediate past President of MWAG Dr. Naa Sodzi Tettey, Lexta paid a visit to Mawuko girls SHS, Ho to educate on cervical cancer and Femcare as part of the national tour to schools and other institutions. The interaction stressed on prevention and the need to screen periodically. Some products and learning materials were also given out as part of the company&apos;s CSR.
              </p>
              <StoryLink href="/news/lexta-ghana-visits-mawuko-girls-shs-ho" marginTop={20}>Read the full story</StoryLink>
            </div>
            <Photo src="/assets/original/web/lexta-lexta-ghana-limited-visits-mawuko-girls-shs-ho.webp" alt="Lexta Ghana visits Mawuko Girls SHS, Ho" box={photoBoxSm} />
          </div>

          <div style={{ ...schoolRow, marginTop: 62 }}>
            <Photo
              src="/assets/original/web/lexta-lexta-ghana-limited-spent-time-with-the-girls-of-unity-high-jhs-in-kot.webp"
              alt="Unity High JHS, Kotobabi, International Women's Day"
              box={photoBoxSm}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>Unity High JHS, Kotobabi, International Women&apos;s Day</h3>
              <p style={body}>
                The team spent time with the girls of Unity high JHS in Kotobabi in commemoration of the International Women&apos;s Day. The pupils were taken through basic female hygiene routines and the need to focus on their studies. Yazz in collaboration with Domite foundation stormed the school with Yazz sanitary towels and free learning materials to enhance the learning and the well being of the girl child.
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
        </div>
      </section>

      <section
        data-reveal="1"
        data-screen-label="Partners"
        style={{ background: "#f7fcfe", padding: "70px 28px", borderTop: "1px solid rgba(18,163,196,.14)", borderBottom: "1px solid rgba(18,163,196,.14)" }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>CSR</div>
            <h2 style={{ ...h2, fontSize: 32, lineHeight: 1.18 }}>Our partners</h2>
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
            <h2 style={h2}>Initiatives by product line</h2>
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
              Explore initiatives by brand, submit a partnership proposal or request information about a programme.
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
                [PLACEHOLDER: how schools and institutions can request a Lexta or Yazz outreach session]
              </p>
              <Link href="/about-us#contact" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                Request a visit <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
              </Link>
            </div>
            <div style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.4)", borderRadius: 12, padding: "26px 24px 28px" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Read every story</h3>
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
