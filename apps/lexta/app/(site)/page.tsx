import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import ArrowText from "@/components/ArrowText";
import ImageSlot from "@/components/ImageSlot";
import CountUp from "@/components/CountUp";
import HeroSlider from "@/components/home/HeroSlider";
import RegionDropdown from "@/components/home/RegionDropdown";
import RevealOnScroll from "@/components/RevealOnScroll";
import StoriesCarousel from "@/components/home/StoriesCarousel";
import SubscribeForm from "@/components/home/SubscribeForm";
import VideoModule from "@/components/home/VideoModule";
import s from "@/components/home/home.module.css";

const title = "Lexta Ghana Limited | Home Care, Personal Care & Food Manufacturer";
const description =
  "Ghanaian manufacturer of Yazz, Hooch and Linzzy. Quality home care, personal care and food products for families across Ghana and West Africa since 2002.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/* ---------- Shared prototype styles (values copied from index.html) ---------- */

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", color: "#12a3c4", textTransform: "uppercase" };
const smallLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#8aa4ae", textTransform: "uppercase" };
const btnArrow: CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.28)", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 12,
};
const outlineArrow: CSSProperties = { ...btnArrow, background: "rgba(18,163,196,.14)" };
const outlineBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 12, border: "1px solid rgba(18,163,196,.5)", color: "#12a3c4",
  fontSize: 13, fontWeight: 600, padding: "11px 20px", borderRadius: 7,
};
const h2Base: CSSProperties = { fontWeight: 700, letterSpacing: "-.02em", color: "#12313d" };

/* ---------- Page data (copy exactly as in the approved prototype) ---------- */

const icon = { stroke: "#12a3c4", strokeWidth: "1.7" };
const values = [
  {
    title: "Quality You Can Trust", text: "High-quality products made with care and integrity.",
    svg: <><circle cx="15" cy="12" r="5" {...icon} /><path d="M5 25c2-5 6-7 10-7s8 2 10 7" {...icon} /></>,
  },
  {
    title: "Innovation", text: "Continuously improving our products to make life better.",
    svg: <><circle cx="15" cy="12" r="6.5" {...icon} /><path d="M12 22h6M13 26h4" {...icon} /></>,
  },
  {
    title: "Community Focused", text: "We care about people and the communities we serve.",
    svg: <><circle cx="10" cy="11" r="4" {...icon} /><circle cx="21" cy="13" r="3.2" {...icon} /><path d="M3 24c1.5-4 4-5.5 7-5.5s5.5 1.5 7 5.5" {...icon} /><path d="M19 24c1-2.6 2.4-4 4-4s2.6.9 3.4 2.6" {...icon} /></>,
  },
  {
    title: "Sustainable Growth", text: "Delivering long-term value for all our stakeholders.",
    svg: <><rect x="4" y="18" width="5" height="8" {...icon} /><rect x="12.5" y="13" width="5" height="13" {...icon} /><rect x="21" y="7" width="5" height="19" {...icon} /></>,
  },
];

const brands = [
  {
    name: "YAZZ", color: "#0f5fa8", anchor: "yazz", bg: "#f4f0f6", img: "/assets/brand-yazz.png", w: 1080, h: 1080, alt: "Yazz oral care", contain: false,
    text: "Sanitary pads, panty liners, baby wipes and diapers, toothpaste and toothbrushes, tissue and kitchen towels, washing powder. Ghana's most preferred sanitary and hygiene brand at the 2022 Home Builders Awards.",
  },
  {
    name: "HOOCH", color: "#c0272d", anchor: "hooch", bg: "#f6f2ea", img: "/assets/brand-hooch.png", w: 1080, h: 1080, alt: "Hooch Frosted Flakes", contain: true,
    text: "Corn flakes and frosted flakes. Vitamin fortified, low fat, made for mornings that need to last.",
  },
  {
    name: "LINZZY", color: "#6a2b8f", anchor: "linzzy", bg: "#eef2fa", img: "/assets/brand-linzzy.png", w: 447, h: 447, alt: "Linzzy baby wipes", contain: false,
    text: "Sanitary napkins in Cool Mint, Heavy Flow and Extra Long, plus fragrance free baby wipes formulated for sensitive skin.",
  },
];

const proof = [
  { figure: "24 years", label: "Manufacturing in Ghana" },
  { figure: "3 brands", label: "Across home, personal care and food" },
  { figure: "200+", label: "Distribution partners" },
  { figure: "2 markets", label: "Ghana and Liberia, with more coming" },
];

const quality = [
  { title: "Manufacturing", text: "Production runs to international hygiene and regulatory benchmarks, with batch level quality checks before anything ships." },
  { title: "Distribution", text: "An Accra based supply chain built for volume, serving retail across Ghana and into Liberia." },
  { title: "Research and development", text: "Products refined against how Ghanaian families actually use them, not against a laboratory assumption." },
];

const impactStroke = { stroke: "rgba(255,255,255,.85)", strokeWidth: "1.6" };
const impact = [
  {
    count: 25, suffix: "+", label: ["Years of", "Excellence"],
    svg: <><circle cx="12" cy="12" r="8" {...impactStroke} /><path d="M12 7v5l4 2" {...impactStroke} /></>,
  },
  {
    count: 500, suffix: "+", label: ["Dedicated", "Employees"],
    svg: <><circle cx="9" cy="9" r="3.4" {...impactStroke} /><circle cx="17" cy="10.5" r="2.6" {...impactStroke} /><path d="M3 20c1.2-3.2 3.3-4.6 6-4.6s4.8 1.4 6 4.6" {...impactStroke} /></>,
  },
  {
    count: 10, suffix: "M+", label: ["Lives", "Impacted"],
    svg: <><circle cx="12" cy="12" r="7.5" {...impactStroke} /><circle cx="12" cy="12" r="3" {...impactStroke} /></>,
  },
  {
    count: 4, suffix: "+", label: ["Trusted", "Brands"],
    svg: <><rect x="4" y="4" width="7" height="7" {...impactStroke} /><rect x="13" y="4" width="7" height="7" {...impactStroke} /><rect x="4" y="13" width="7" height="7" {...impactStroke} /><rect x="13" y="13" width="7" height="7" {...impactStroke} /></>,
  },
];

const partners = [
  { img: "/assets/partner-mwag.png", w: 447, h: 447, alt: "Medical Women Association of Ghana" },
  { img: "/assets/partner-ges.png", w: 316, h: 159, alt: "Ghana Education Service" },
  { img: "/assets/partner-police.png", w: 500, h: 500, alt: "Ghana Police Service" },
  { img: "/assets/partner-ghs.png", w: 250, h: 249, alt: "Ghana Health Service" },
  { img: "/assets/partner-kbth.png", w: 512, h: 512, alt: "Korle Bu Teaching Hospital" },
  { img: "/assets/partner-sofpog.png", w: 878, h: 349, alt: "SOFPOG" },
];

const business = [
  {
    title: "Distributors", link: "Apply to distribute →", href: "/partner-with-us",
    text: "Join a network of partners moving our brands across Ghana and the sub-region. We provide marketing support, trade terms and consumer insight.",
  },
  {
    title: "Bulk and institutional buyers", link: "Request a quote →", href: "/partner-with-us",
    text: "Schools, hospitals, hotels, NGOs and government agencies. Volume pricing, reliable supply, direct account management.",
  },
  {
    title: "Export and regional partners", link: "Talk to us →", href: "/contact-us",
    text: "Building on our Liberia operation, we are expanding into new West African markets.",
  },
];

const news = [
  {
    tag: "CSR", date: "15 July 2026", title: "The Bright Smiles School Tour",
    text: "Free biannual dental screenings and oral hygiene workshops in rural primary schools, with the Ghana Dental Association.",
  },
  {
    tag: "Brands", date: "29 May 2026", title: "Yazz partners MX24 TV for the 2026 CroxItOut High School Tour",
    text: "Awareness, mentorship and action, taking menstrual and oral care education into senior high schools.",
  },
  {
    tag: "Health", date: "February 2026", title: "Free public cervical cancer screening with SOFPOG, MWAG and Korle Bu Polyclinic",
    text: "Screening and education on HPV, vaccination and the warning signs too often missed.",
  },
];

const perks = [
  {
    label: ["Growth", "Opportunities"],
    svg: <><path d="M8 3h13l7 7v23H8z" opacity=".95" /><path d="M21 3l7 7h-7z" fill="#0b2f3d" opacity=".35" /><rect x="12" y="15" width="12" height="2.2" fill="#0b2f3d" /><rect x="12" y="20" width="12" height="2.2" fill="#0b2f3d" /><rect x="12" y="25" width="7" height="2.2" fill="#0b2f3d" /></>,
  },
  {
    label: ["Diverse & Inclusive", "Environment"],
    svg: <><circle cx="18" cy="11" r="5" /><path d="M9 30c0-5 4-8.5 9-8.5S27 25 27 30z" /><circle cx="6" cy="14" r="3.6" /><path d="M0 28c0-3.6 2.7-6 6-6 1 0 2 .2 2.8.6C6.6 24.4 5.2 26 5 28z" /><circle cx="30" cy="14" r="3.6" /><path d="M36 28c0-3.6-2.7-6-6-6-1 0-2 .2-2.8.6 2.2 1.8 3.6 3.4 3.8 5.4z" /></>,
  },
  {
    label: ["Make a Positive", "Impact"],
    svg: <><circle cx="18" cy="9" r="5" /><path d="M9 26c0-5 4-9 9-9s9 4 9 9z" /><rect x="4" y="29" width="28" height="3.4" rx="1.7" /></>,
  },
];

const twoLines = (l: string[]) => <>{l[0]}<br />{l[1]}</>;

export default function HomePage() {
  return (
    <>
      <RevealOnScroll />
      <HeroSlider />

      <div style={{ background: "linear-gradient(180deg,#eaf6fb,#f4fbfd)", padding: "0 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", background: "#fff", borderRadius: 16,
              boxShadow: "0 24px 50px rgba(11,60,78,.12)", marginTop: -96, position: "relative", zIndex: 5,
            }}
          >
            {values.map((v, k) => (
              <div
                key={v.title}
                style={{ padding: "26px 24px", display: "flex", gap: 16, alignItems: "flex-start", borderRight: k < values.length - 1 ? "1px solid #e6f1f5" : undefined }}
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ flex: "0 0 auto" }} aria-hidden="true">{v.svg}</svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#12313d" }}>{v.title}</div>
                  <p style={{ margin: "7px 0 0", fontSize: 12, lineHeight: 1.65, color: "#5d7883" }}>{v.text}</p>
                </div>
              </div>
            ))}
          </div>

          <section
            data-screen-label="Who we are"
            data-reveal="1"
            style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)", gap: 52, alignItems: "center", padding: "70px 0 10px" }}
          >
            <div>
              <div style={eyebrow}>Who We Are</div>
              <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 33, lineHeight: 1.18, textWrap: "pretty" }}>A Ghanaian manufacturer, not a middleman</h2>
              <p style={{ margin: "20px 0 0", fontSize: 14, lineHeight: 1.85, color: "#4d6a75", textWrap: "pretty" }}>
                We make what we sell. From our facility in Accra, Lexta produces the home care, personal care and food products that carry the Yazz, Hooch and Linzzy names, and moves them through a distribution network reaching supermarkets, market traders and corner shops nationwide.
              </p>
              <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.85, color: "#4d6a75", textWrap: "pretty" }}>
                Founded in 2002 by Martin Brobbey on his return to Ghana, the company has grown from a single category supplier into one of the country's established consumer goods manufacturers, with a wholly owned subsidiary in Monrovia and plans for further expansion across the sub-region.
              </p>
              <ArrowButton href="/about-us" padding="10px 10px 10px 20px" style={{ marginTop: 26 }}>More about Lexta</ArrowButton>
            </div>
            <div style={{ position: "relative", height: 360, borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 44px rgba(11,60,78,.18)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/about-hero.png"
                alt="Lexta manufacturing and distribution in Accra, Ghana"
                width={1774}
                height={887}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </section>

          <section
            data-screen-label="Activities"
            data-reveal="1"
            style={{ display: "grid", gridTemplateColumns: "minmax(240px,1fr) minmax(0,2.1fr)", gap: 40, padding: "76px 0 90px", alignItems: "center" }}
          >
            <div>
              <div style={eyebrow}>What We Do</div>
              <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 34, lineHeight: 1.15, textWrap: "pretty" }}>Latest Activities &amp; Campaigns</h2>
              <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.8, color: "#5d7883", maxWidth: 330 }}>
                We are committed to creating positive impact in communities through meaningful initiatives and partnerships.
              </p>
              <ArrowButton href="/news" padding="10px 10px 10px 20px" style={{ marginTop: 26 }}>More Stories</ArrowButton>
            </div>
            <StoriesCarousel />
          </section>
        </div>
      </div>

      <section id="brands" data-screen-label="Brands" data-reveal="1" style={{ background: "#fff", padding: "74px 28px 20px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
            <div style={eyebrow}>Our Brands</div>
            <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 32 }}>Three brands. One standard.</h2>
            <div style={{ width: 56, height: 3, background: "#12a3c4", borderRadius: 2, margin: "14px auto 0" }} />
            <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.8, color: "#5d7883" }}>
              Different needs, different aisles, the same commitment to quality you can afford.
            </p>
          </div>
          <div
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 30, marginTop: 42, maxWidth: 1000,
              marginLeft: "auto", marginRight: "auto",
            }}
          >
            {brands.map((b) => (
              <article
                key={b.name}
                style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 14px 32px rgba(11,60,78,.12)", background: "#fff", display: "flex", flexDirection: "column" }}
              >
                {b.contain ? (
                  <div style={{ height: 212, background: b.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.img} alt={b.alt} width={b.w} height={b.h} style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", display: "block" }} />
                  </div>
                ) : (
                  <div style={{ height: 212, background: b.bg }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.img} alt={b.alt} width={b.w} height={b.h} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                )}
                <div style={{ padding: "20px 20px 22px", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".06em", color: b.color }}>{b.name}</div>
                  <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.75, color: "#5d7883" }}>{b.text}</p>
                </div>
                <Link
                  href={`/our-brands#${b.anchor}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: b.color, color: "#fff", fontSize: 12, fontWeight: 600, padding: 12 }}
                >
                  Explore Brand{" "}
                  <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>→</span>
                </Link>
              </article>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
            <Link href="/our-brands" className={s.outlineHover} style={outlineBtn}>
              See the full range
              <span aria-hidden="true" style={outlineArrow}>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section data-screen-label="Proof bar" data-reveal="1" aria-label="Lexta at a glance" style={{ background: "#0b2f3d", padding: "44px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 30 }}>
          {proof.map((p) => (
            <div key={p.figure}>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.03em", color: "#3fc0dd" }}>{p.figure}</div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,.75)" }}>{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section data-screen-label="Quality" data-reveal="1" className={s.qualitySection}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={eyebrow}>Quality</div>
            <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 33, lineHeight: 1.18, textWrap: "pretty" }}>Standards you don&apos;t have to take on trust</h2>
            <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.8, color: "#5d7883", textWrap: "pretty" }}>
              Being affordable and being well made are not in tension. Here is how we hold both.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 24, marginTop: 40 }}>
            {quality.map((q) => (
              <div key={q.title} style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 12px 30px rgba(11,60,78,.08)" }}>
                <div style={{ width: 34, height: 4, background: "#12a3c4", borderRadius: 2 }} />
                <div style={{ marginTop: 18, fontSize: 16, fontWeight: 700, color: "#12313d" }}>{q.title}</div>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{q.text}</p>
              </div>
            ))}
          </div>
          <ArrowButton href="/about-us" padding="11px 11px 11px 20px" style={{ marginTop: 34 }}>Inside our operation</ArrowButton>
        </div>
      </section>

      <section data-screen-label="Impact" data-reveal="1" style={{ background: "#fff", padding: "56px 28px" }}>
        <div
          className={s.impactBox}
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14,
            boxShadow: "0 22px 46px rgba(11,90,110,.28)", display: "grid", gridTemplateColumns: "minmax(240px,1fr) minmax(0,1.7fr)",
            gap: 34, alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 27, fontWeight: 700, letterSpacing: "-.02em", color: "#fff" }}>Our Impact in Numbers</h2>
            <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,.88)", maxWidth: 320 }}>
              Every number represents a life touched, a community empowered, and a commitment we continue to uphold.
            </p>
            <Link
              href="/corporate-social-responsibility"
              style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: "#0e7f97", fontSize: 12, fontWeight: 600, padding: "9px 9px 9px 18px", borderRadius: 6 }}
            >
              See Our Impact
              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>→</span>
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 16 }}>
            {impact.map((m) => (
              <div key={m.label.join(" ")} style={{ border: "1px solid rgba(255,255,255,.4)", borderRadius: 10, padding: "20px 12px", textAlign: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8 }} aria-hidden="true">{m.svg}</svg>
                <CountUp target={m.count} suffix={m.suffix} style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }} />
                <div style={{ fontSize: 12, lineHeight: 1.4, color: "rgba(255,255,255,.85)", marginTop: 4 }}>{twoLines(m.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-screen-label="CSR narrative" data-reveal="1" style={{ background: "#fff", padding: "20px 28px 70px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: 52, alignItems: "center" }}>
          <div>
            <div style={eyebrow}>Impact</div>
            <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 31, lineHeight: 1.2, textWrap: "pretty" }}>Care that leaves the shelf</h2>
            <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.85, color: "#4d6a75", textWrap: "pretty" }}>
              Our CSR work runs where our products do. Alongside the Medical Women Association of Ghana we have delivered free cervical cancer screening nationwide, including in Tamale and at Accra Psychiatric Hospital. Our school outreach programmes tackle period poverty and adolescent health, and we have partnered with the Ghana Education Service and the Ghana Police Service on education campaigns.
            </p>
            <ArrowButton href="/corporate-social-responsibility" padding="11px 11px 11px 20px" style={{ marginTop: 26 }}>See our CSR programmes</ArrowButton>
          </div>
          <div style={{ border: "1px solid #e6f1f5", borderRadius: 12, padding: 26 }}>
            <div style={smallLabel}>Partners in the work</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, alignItems: "center", marginTop: 20 }}>
              {partners.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.img} src={p.img} alt={p.alt} width={p.w} height={p.h} style={{ width: "100%", height: 52, objectFit: "contain", display: "block" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-screen-label="Where to buy" data-reveal="1" style={{ background: "#f6fbfd", padding: "70px 28px", position: "relative", zIndex: 40 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 48, alignItems: "center" }}>
          <div>
            <div style={eyebrow}>Where to Buy</div>
            <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 31, lineHeight: 1.2, textWrap: "pretty" }}>Find Lexta products near you</h2>
            <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.85, color: "#4d6a75", textWrap: "pretty" }}>
              Our brands are stocked in supermarkets, pharmacies, market stalls and neighbourhood shops across Ghana. Search by region to find your nearest stockist.
            </p>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 14px 34px rgba(11,60,78,.1)", padding: 26, position: "relative", zIndex: 41 }}>
            <div style={smallLabel}>Your region</div>
            <RegionDropdown />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <Link
                href="/contact-us"
                style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "11px 18px", borderRadius: 7 }}
              >
                Find a stockist
              </Link>
              <Link href="/partner-with-us" className={s.outlineHover} style={{ ...outlineBtn, gap: 10, padding: "11px 18px" }}>
                Stock our products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section data-screen-label="For business" data-reveal="1" style={{ background: "#fff", padding: "74px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 600 }}>
            <div style={eyebrow}>For Business</div>
            <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 31, lineHeight: 1.2 }}>Working with Lexta</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24, marginTop: 38 }}>
            {business.map((b) => (
              <div key={b.title} style={{ border: "1px solid #e6f1f5", borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#12313d" }}>{b.title}</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "#5d7883", flex: 1 }}>{b.text}</p>
                <Link href={b.href} style={{ fontSize: 13, fontWeight: 600, color: "#12a3c4" }}><ArrowText text={b.link} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-screen-label="Videos" data-reveal="1" style={{ background: "#fff", padding: "56px 28px 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(240px,1fr) minmax(0,1.9fr)", gap: 44, alignItems: "center" }}>
          <div>
            <h2 style={{ ...h2Base, margin: 0, fontSize: 30 }}>Lexta Videos</h2>
            <div style={{ width: 52, height: 3, background: "#12a3c4", borderRadius: 2, marginTop: 12 }} />
            <p style={{ margin: "26px 0 0", fontSize: 14, lineHeight: 1.8, color: "#5d7883", maxWidth: 300 }}>
              Watch stories of impact, care and innovation that drive everything we do.
            </p>
            <ArrowButton href="/news" padding="10px 10px 10px 20px" style={{ marginTop: 24 }}>More Videos</ArrowButton>
          </div>
          <VideoModule />
        </div>
      </section>

      <section data-screen-label="News" data-reveal="1" style={{ background: "#f6fbfd", padding: "74px 28px 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={eyebrow}>News</div>
              <h2 style={{ ...h2Base, margin: "14px 0 0", fontSize: 31, lineHeight: 1.2 }}>Latest from Lexta</h2>
            </div>
            <Link href="/news" className={s.outlineHover} style={outlineBtn}>
              Read all news
              <span aria-hidden="true" style={outlineArrow}>→</span>
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24, marginTop: 36 }}>
            {news.map((n) => (
              <Link
                key={n.title}
                href="/news"
                className={s.newsCard}
                style={{ background: "#fff", borderRadius: 12, padding: 26, boxShadow: "0 12px 30px rgba(11,60,78,.08)", display: "flex", flexDirection: "column", gap: 10, color: "inherit" }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#12a3c4" }}>
                  {n.tag}{" "}
                  <span style={{ color: "#a9bcc4", fontWeight: 500, letterSpacing: 0, textTransform: "none" }}>{n.date}</span>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.4, color: "#12313d" }}>{n.title}</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "#5d7883" }}>{n.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-screen-label="Careers" data-reveal="1" style={{ position: "relative", background: "#0b2f3d", padding: 0 }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {/* [PLACEHOLDER: team celebration photo from Lexta] */}
          <ImageSlot placeholder="Team celebration photo" />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(8,42,55,.94),rgba(8,42,55,.72))", pointerEvents: "none" }} />
        <div
          style={{
            position: "relative", maxWidth: 1240, margin: "0 auto", padding: "70px 28px 120px", display: "grid",
            gridTemplateColumns: "minmax(260px,1.1fr) minmax(0,1fr)", gap: 50, alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3fc0dd" }}>Join Our Mission</div>
            <h2 style={{ margin: "12px 0 0", fontSize: 34, fontWeight: 700, letterSpacing: "-.02em", color: "#fff" }}>Current Opportunities</h2>
            <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,.85)", maxWidth: 380 }}>
              Ready to make your mark? Explore our flexible career paths and be part of a team that is building a better tomorrow.
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,.85)", maxWidth: 380 }}>
              Lexta employs hundreds of people across manufacturing, sales, marketing and distribution. We hire for drive and we promote from within.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
              <ArrowButton href="/careers#openings" padding="11px 11px 11px 20px">Current openings</ArrowButton>
              <Link
                href="/people-and-culture"
                style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.45)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "11px 20px", borderRadius: 7 }}
              >
                Life at Lexta
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 18, textAlign: "center" }}>
            {perks.map((p) => (
              <div key={p.label[0]}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="#fff" aria-hidden="true">{p.svg}</svg>
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: "#fff" }}>{twoLines(p.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ background: "#0b2f3d", padding: "0 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", top: -52 }}>
          <div
            className={s.subscribeBox}
            style={{
              background: "linear-gradient(100deg,#14a0be,#2cbcd6)", borderRadius: 12, display: "grid",
              gridTemplateColumns: "minmax(260px,1.2fr) minmax(0,1fr)", gap: 28, alignItems: "center", boxShadow: "0 18px 40px rgba(4,40,52,.35)",
            }}
          >
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <svg width="52" height="42" viewBox="0 0 52 42" fill="none" style={{ flex: "0 0 auto" }} aria-hidden="true">
                <rect x="2" y="4" width="48" height="34" stroke="#fff" strokeWidth="2" />
                <path d="M2 6l24 18L50 6" stroke="#fff" strokeWidth="2" />
              </svg>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>Stay Connected</div>
                <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,.9)" }}>
                  Subscribe to get the latest updates on our brands, initiatives and opportunities.
                </p>
              </div>
            </div>
            <SubscribeForm />
          </div>
        </div>
      </div>
    </>
  );
}
