import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import BioToggle from "@/components/about/BioToggle";
import Journey from "@/components/about/Journey";
import a from "@/components/about/about.module.css";
import p from "@/components/proto.module.css";

// The prototype page had no title or description; these reuse its own hero copy.
const title = "About Us | Lexta Ghana Limited";
const description =
  "Lexta Ghana Limited is a Ghanaian consumer-goods company committed to making dependable everyday products more accessible to households. Across Yazz, Linzzy and Hooch, we bring care, innovation and value together with an ambition to serve families throughout Africa.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/* ---------- Shared prototype styles (values copied from about-us.html) ---------- */

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const h2: CSSProperties = { margin: "14px 0 0", fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const body: CSSProperties = { fontSize: 14, lineHeight: 1.9, color: "#5d7883" };
const card: CSSProperties = { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 34px rgba(11,60,78,.1)" };
const fill: CSSProperties = { position: "absolute", inset: 0 };
const slotFill: CSSProperties = { display: "block", width: "100%", height: "100%" };
const ghostBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)",
  color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7,
};

type Photo = { placeholder: string; src: string; alt: string; w: number; h: number };

const photos = {
  aboutHero: { src: "/assets/about-hero.png", w: 1774, h: 887 },
  production: { src: "/pasted-1788862892966-0-mtsis246-yfed.png", w: 1672, h: 941 },
  campus: { src: "/pasted-1788863146762-0-mtsixhy1-fej8.png", w: 1671, h: 941 },
  stall: { src: "/pasted-1788863589556-0-mtsj6zlp-gm1a.png", w: 640, h: 457 },
  stall2: { src: "/pasted-1788863569187-0-mtsj6jyu-9jac.png", w: 640, h: 457 },
  truck: { src: "/pasted-1788863416272-0-mtsj39w5-y1jr.png", w: 640, h: 480 },
  lineup: { src: "/pasted-1788863699695-0-mtsj9cl9-7qaa.png", w: 1536, h: 1024 },
  kitchen: { src: "/pasted-1788863665969-0-mtsj8mkd-3thf.png", w: 1774, h: 887 },
  donation: { src: "/pasted-1788864443586-0-mtsjpakl-bqdh.png", w: 620, h: 413 },
  founder: { src: "/pasted-1788862581207-0-mtsildjv-3sh7.png", w: 820, h: 1024 },
};

const ALT = {
  production: "Lexta production line with staff packing Yazz products",
  campus: "Lexta staff outside the Lexta facility",
  stall: "Yazz team speaking with a trader at a market stall",
  lineup: "Woman holding Hooch Corn Flakes, Linzzy and Yazz packs",
  kitchen: "Mother and daughter with Lexta products at a kitchen table",
  truck: "Yazz branded truck with a team in red shirts",
  factory: "Lexta manufacturing and distribution in Accra, Ghana",
};

const story: Photo[] = [
  { placeholder: "Production line photo", ...photos.production, alt: ALT.production },
  { placeholder: "Team at work", ...photos.campus, alt: ALT.campus },
  { placeholder: "Product shelf photo", ...photos.stall, alt: ALT.stall },
];

const storyStats = [
  { figure: "2002", label: "Founded in Accra" },
  { figure: "3", label: "Brands in the portfolio" },
  { figure: "2", label: "Countries of operation" },
];

const strip: Photo[] = [
  { placeholder: "Factory floor", ...photos.aboutHero, alt: ALT.factory },
  { placeholder: "Packing / filling line", ...photos.kitchen, alt: ALT.kitchen },
  { placeholder: "Retail shelf", ...photos.stall2, alt: ALT.stall },
  { placeholder: "Delivery fleet", ...photos.lineup, alt: ALT.lineup },
];

const pillars: (Photo & { title: string; text: string })[] = [
  {
    placeholder: "Production line photo", ...photos.aboutHero, alt: ALT.factory, title: "Manufacturing excellence",
    text: "Our production operates under stringent international hygiene and regulatory benchmarks. Every batch meets defined safety criteria before it leaves our facility.",
  },
  {
    placeholder: "Warehouse / logistics photo", ...photos.campus, alt: ALT.campus, title: "Sub-regional logistics",
    text: "Headquartered in Accra, our supply chain is built for high-volume delivery across the domestic market and into West Africa, including our Liberian operation.",
  },
  {
    placeholder: "Product testing photo", ...photos.kitchen, alt: ALT.kitchen, title: "Consumer-centred R&D",
    text: "We refine our products against how Ghanaian families actually use them. Quality, safety, freshness and value are measured against real households, not laboratory assumptions.",
  },
];

const values = [
  { n: "01", title: "Committed", text: "To building sustainable brands.", dark: false, offset: false },
  { n: "02", title: "Aspiring", text: "To become better versions of ourselves.", dark: true, offset: true },
  { n: "03", title: "Respect", text: "For each other, our business partners, our consumers and our community.", dark: true, offset: false },
  { n: "04", title: "Care", text: "It is what truly makes the world go round.", dark: false, offset: true },
];

const asks = [
  { n: "01", q: "What is care if it is not of the utmost quality?", a: "So we make the best products we can, using premium materials, for you." },
  { n: "02", q: "What is care if the people we create it for cannot share in it?", a: "So we make our products affordable, without compromising quality." },
  { n: "03", q: "How do we make sure that affordable quality becomes the standard, enjoyed by far more people?" },
];

const directors = [
  {
    name: "Rev. Albert Ocran", role: "Board Chairman", src: "/pasted-1788862404857-0-mtsihlh8-zqob.png",
    bio: [
      "Rev. Albert Ocran is an international motivational speaker, minister and executive coach. He is Lead Consultant of Legacy & Legacy, Executive Director of the Springboard Road Show Foundation, and Executive Pastor at ICGC Christ Temple.",
      "As a corporate trainer and executive coach, his client list spans the mining, banking, telecommunications, insurance, petrochemical and not-for-profit sectors. He was voted by his peers as Ghana's 7th Most Respected CEO in 2009, received the Millennium Excellence Award in 2010, and has been named four consecutive years among the 100 most influential Ghanaians by viewers of ETV Ghana.",
      "He is a fellow of the Africa Leadership Initiative and the Aspen Global Leaders Network. Together with his wife Comfort, he has published 21 bestselling books, including the leadership work “The Lord, Madiba and The Eagle.” The couple travel across Ghana annually with the Springboard Road Show.",
    ],
  },
  {
    name: "Mr. Martin Brobbey", role: "Founder and Managing Director", src: "/pasted-1788862416064-0-mtsihu4k-1tx9.png",
    bio: [
      "Martin Brobbey established Lexta Ghana Limited in 2002 on his return to Ghana after more than ten years in the United Kingdom, driven by a desire to see a cleaner, more hygienic Africa. His leadership and interpersonal skills have taken Lexta from a single-category supplier to a leader in home and personal care both locally and beyond.",
      "A product of Opoku Ware School, he holds a Bachelor of Business Administration in Business, Management and Marketing from the Ghana Institute of Management and Public Administration. His passion lies in marketing and new product development.",
    ],
  },
  {
    name: "Mrs. Mary Asare-Yeboah", role: "Board Member", src: "/pasted-1788862424012-0-mtsii09b-wwea.png",
    bio: [
      "Mrs. Asare-Yeboah is an accomplished banker with more than 19 years of senior management experience at HFC Bank Ghana Limited, where she served in roles from Senior Finance Officer to Head of Banking Operations until her retirement in 2013.",
      "Before banking, she worked with Texaco Ghana Limited and Shell Ghana Limited as Management Secretary and Administrative Manager respectively, and earlier in her career at GETZ Jewellers in the United States.",
      "She holds an MBA in Finance and a BSc in Banking and Finance, and is an Associate member of the Chartered Institute of Bankers. She serves on the board of the Accra Symphony Orchestra and previously served on the board of Central Aid, Ghana.",
    ],
  },
  {
    name: "Mr. Kojo Ohene-Kyei", role: "Board Member", src: "/pasted-1788862429966-0-mtsii4ur-kj1t.png",
    bio: [
      "Mr. Ohene-Kyei is Chief Executive Officer of IFS Financial Services Limited, a leading non-bank financial institution founded in Ghana in 2006.",
      "An astute finance professional, he brings over 30 years of experience spanning corporate banking, risk management, corporate governance and business transformation. His leadership roles include Deputy Risk Management Director, Business Banking Director and Country Credit Director, all at Barclays Bank Ghana.",
      "He is a Fellow of the Chartered Institute of Bankers in Ghana and an Associate of the Chartered Institute of Bankers in the United Kingdom, and holds an MBA from Henley Management College. He is currently Chief Executive Officer of IFS Capital Management and a Non-Executive Director of the Council for Scientific and Industrial Research, Plant Genetic Resources Research Institute.",
    ],
  },
  {
    name: "Mr. Ebo Hammond", role: "Board Member", src: "/pasted-1788862437111-0-mtsiiad5-0a2z.png",
    bio: [
      "Mr. Hammond holds a BSc in Business Administration from the University of Ghana Business School and an MBA from the University of Edinburgh Business School. He also holds a Postgraduate Diploma in Marketing from the Chartered Institute of Marketing in the United Kingdom, and is a third-year PhD candidate at the University of Ghana Business School.",
      "His professional qualifications include certificates in Vehicle Fleet Management (United Kingdom), Physical Distribution (Japan), World Bank Procurement of Goods (Ghana), Logistics and Supply Chain Management (South Africa) and Logistics and Distribution Management (Singapore).",
      "He is a Chartered Fellow of the Chartered Institute of Logistics and Transport and a part-time university lecturer in logistics, supply chain and strategy. He currently serves as Executive Secretary of CILT Ghana and Deputy Director in charge of Transportation Management at the Ghana Health Service.",
    ],
  },
  {
    name: "Mrs. Yvonne Brobbey", role: "Board Member", src: "/pasted-1788862442898-0-mtsiietz-z88y.png",
    bio: [
      "Mrs. Brobbey is an accomplished entrepreneur with deep experience in marketing and customer service, gained in part during her time with NatWest in the United Kingdom.",
      "She was instrumental in building the Yazz brand, leading marketing campaigns across the country in Lexta's early years. She currently owns and manages Ivie Collections, a high-end fashion boutique stocking local and international labels, and was the founder of Fresherz Eatery in East Legon, Accra.",
    ],
  },
  {
    name: "Mr. Samuel Hagan", role: "Board Member", src: "/pasted-1788862450734-0-mtsiikvm-6oo6.png",
    bio: [
      "Mr. Hagan brings over 26 years of experience in administration and logistics management, gained across the public service and with an international organisation.",
      "He holds an MBA in Corporate Governance from the Australian Institute of Business, a Bachelor of Arts, and an Advanced Diploma in Logistics and Transport from CILT in the United Kingdom. He also serves as a Director on the board of Capital and More Savings and Loans Limited.",
    ],
  },
];

const reach: (Photo & { title: string; text: string })[] = [
  {
    placeholder: "Lexta Square, Accra photo", ...photos.campus, alt: ALT.campus, title: "Ghana",
    text: "Headquartered at Lexta Square in Dzorwulu, Accra, with distribution reaching supermarkets, pharmacies, market traders and neighbourhood shops nationwide.",
  },
  {
    placeholder: "Monrovia operation photo", ...photos.truck, alt: ALT.truck, title: "Liberia",
    text: "A wholly owned subsidiary in Monrovia, operating since 2010 and serving as the base for our regional growth.",
  },
  {
    placeholder: "Regional distribution photo", ...photos.stall, alt: ALT.stall, title: "West Africa and beyond",
    text: "Active expansion plans into additional markets across the sub-region, built on the same standards that established us at home.",
  },
];

const csrStats = [
  { figure: "10M+", label: "Lives touched by our products" },
  { figure: "100+", label: "Schools reached with health education" },
  { figure: "Free", label: "Screening clinics with MWAG" },
];

export default function AboutUsPage() {
  return (
    <>
      <RevealOnScroll />

      <section
        data-screen-label="About hero"
        style={{ position: "relative", background: "#0c303e", overflow: "hidden", minHeight: 460, display: "flex", alignItems: "center", padding: "92px 28px" }}
      >
        <div style={fill}>
          <ImageSlot placeholder="Lexta team / factory photo" src={photos.aboutHero.src} width={photos.aboutHero.w} height={photos.aboutHero.h} alt="" />
        </div>
        <div style={{ ...fill, background: "linear-gradient(100deg,rgba(6,32,42,.92) 0%,rgba(6,32,42,.66) 48%,rgba(6,32,42,.2) 80%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>About Lexta Ghana</div>
            <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(30px,6vw,52px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              We make what we sell, <span style={{ color: "#3fc0dd" }}>under our own roof</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.92)", maxWidth: 600, textWrap: "pretty" }}>{description}</p>
          </div>
        </div>
      </section>

      <section data-reveal="1" style={{ background: "#fff", padding: "60px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 52, alignItems: "stretch" }}>
          <div>
            <div style={eyebrow}>Welcome from the Founder</div>
            <h2 style={{ ...h2, fontSize: 32, lineHeight: 1.18 }}>Welcome to Lexta Ghana Limited</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              <p style={{ ...body, margin: 0 }}>
                At Lexta, we believe that great brands and quality products have the power to transform lives, create opportunities and inspire communities. Since our inception, our commitment has been to deliver excellence, innovation and value across every product and service we offer.
              </p>
              <p style={{ ...body, margin: 0 }}>
                As a proudly Ghanaian company, we are driven by a passion for growth, customer satisfaction and meaningful impact. Every step we take is guided by integrity, quality and a desire to exceed expectations.
              </p>
              <p style={{ ...body, margin: 0 }}>
                Whether you are a customer, partner, distributor or visitor, thank you for taking the time to learn more about us. We are excited to have you on this journey and look forward to building lasting relationships that create shared success.
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#12313d", fontWeight: 600 }}>Welcome to the Lexta family.</p>
            </div>
            <div style={{ marginTop: 26, paddingTop: 20, borderTop: "1px solid rgba(18,163,196,.25)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#12313d" }}>Martin Osei Kwaku Brobbey</div>
              <div style={{ marginTop: 3, fontSize: 12, color: "#5d7883" }}>Founder and Managing Director, Lexta Ghana Limited</div>
            </div>
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", minHeight: 420, boxShadow: "0 20px 44px rgba(11,60,78,.18)", alignSelf: "stretch", display: "flex" }}>
            <ImageSlot
              placeholder="Martin Brobbey portrait"
              src={photos.founder.src}
              width={photos.founder.w}
              height={photos.founder.h}
              alt="Martin Osei Kwaku Brobbey, Founder and Managing Director"
              style={slotFill}
            />
          </div>
        </div>
      </section>

      <section data-reveal="1" style={{ background: "#fff", padding: "60px 28px 30px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 54, alignItems: "center" }}>
          <div className={p.rows170} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {story.map((ph, i) => (
              <div
                key={ph.placeholder}
                className={i === 0 ? p.spanRow2 : undefined}
                style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 38px rgba(11,60,78,.16)" }}
              >
                <ImageSlot placeholder={ph.placeholder} src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} />
              </div>
            ))}
          </div>
          <div>
            <div style={eyebrow}>Our Story</div>
            <h2 style={{ ...h2, fontSize: 34, lineHeight: 1.15 }}>A return home, and a clear ambition</h2>
            <p style={{ ...body, margin: "18px 0 0" }}>
              Lexta Ghana Limited was established in 2002 by Martin Brobbey, following more than ten years in the United Kingdom and a return home with a clear ambition: to improve everyday living through quality consumer products that ordinary Ghanaian households could actually afford.
            </p>
            <p style={{ ...body, margin: "14px 0 0" }}>
              The company began as a supplier of home care products. It has since grown into one of Ghana&apos;s established consumer goods manufacturers, expanding across home care, personal care and food, and building a distribution network that reaches supermarkets, pharmacies, market traders and neighbourhood shops nationwide.
            </p>
            <p style={{ ...body, margin: "14px 0 0" }}>
              Our mission is to combine quality, innovation and affordability in products that meet family needs and deliver value to stakeholders. Our vision is to be the preferred choice for family-care products across Africa.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 18, marginTop: 30 }}>
              {storyStats.map((st) => (
                <div key={st.label} style={{ borderLeft: "3px solid #12a3c4", paddingLeft: 14 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#12313d", letterSpacing: "-.02em" }}>{st.figure}</div>
                  <div style={{ fontSize: 12, color: "#5d7883", marginTop: 2 }}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Journey />

      <section data-reveal="1" style={{ position: "relative", background: "#0b2f3d", overflow: "hidden" }}>
        <div style={fill}>
          <ImageSlot placeholder="Quality lab / QC photo" src={photos.production.src} width={photos.production.w} height={photos.production.h} alt="" />
        </div>
        <div style={{ ...fill, background: "linear-gradient(95deg,rgba(8,42,55,.95),rgba(8,42,55,.7))", pointerEvents: "none" }} />
        <div className={p.pad80} style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 660 }}>
            <h2 style={{ margin: 0, fontSize: 36, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>What is care without quality?</h2>
            <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.9, color: "rgba(255,255,255,.92)" }}>
              Our operational philosophy rests on a single conviction: real care requires uncompromising standards.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>
              We have grown from a local supplier into a competitive pan-African enterprise by investing where it matters. Rigorous quality control. Manufacturing infrastructure that can move at the pace the market demands. Distribution networks that carry our promises intact from our factory floor to a shelf in a village shop.
            </p>
            <div style={{ marginTop: 26, fontSize: 18, fontWeight: 700, color: "#3fc0dd" }}>Affordable, accessible, and made with care.</div>
          </div>
        </div>
      </section>

      <section data-reveal="1" style={{ background: "#fff", padding: "24px 28px 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {strip.map((ph) => (
            <div key={ph.placeholder} style={{ borderRadius: 12, overflow: "hidden", height: 230 }}>
              <ImageSlot placeholder={ph.placeholder} src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} />
            </div>
          ))}
        </div>
      </section>

      <section data-reveal="1" className={p.pad76} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>Corporate Pillars</div>
            <h2 style={{ ...h2, fontSize: 32 }}>Three things we invest in, without exception</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22, marginTop: 40 }}>
            {pillars.map((pl) => (
              <div key={pl.title} style={card}>
                <div style={{ height: 200 }}>
                  <ImageSlot placeholder={pl.placeholder} src={pl.src} alt={pl.alt} width={pl.w} height={pl.h} />
                </div>
                <div style={{ padding: "26px 28px 30px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#12313d" }}>{pl.title}</div>
                  <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{pl.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" className={p.pad76} style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 52, alignItems: "stretch" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", minHeight: 440, display: "flex", boxShadow: "0 20px 44px rgba(11,60,78,.18)" }}>
            <ImageSlot
              placeholder="Staff / team culture photo"
              src={photos.donation.src}
              width={photos.donation.w}
              height={photos.donation.h}
              alt="Lexta team handing over Yazz products at a donation"
              style={slotFill}
            />
          </div>
          <div>
            <div style={eyebrow}>Our Core Values</div>
            <h2 style={{ ...h2, fontSize: 32 }}>Four words we hold each other to</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18, marginTop: 34 }}>
              {values.map((v) => (
                <div
                  key={v.n}
                  className={v.dark ? a.valueDark : a.valueLight}
                  style={{
                    background: v.dark ? "#0b2f3d" : "#f4fafc", border: `1px solid ${v.dark ? "#0b2f3d" : "#dceef3"}`, borderRadius: 14,
                    padding: "24px 22px 26px", marginTop: v.offset ? 26 : undefined, transition: "transform .25s ease,box-shadow .25s ease",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", color: v.dark ? "#3fc0dd" : "#12a3c4" }}>{v.n}</div>
                  <div style={{ marginTop: 14, fontSize: 17, fontWeight: 700, color: v.dark ? "#fff" : "#12313d" }}>{v.title}</div>
                  <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.8, color: v.dark ? "rgba(255,255,255,.82)" : "#5d7883" }}>{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal="1" className={p.pad82} style={{ background: "#0b2f3d" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>At Lexta, we ask</div>
          <div style={{ marginTop: 26 }}>
            {asks.map((q) => (
              <div
                key={q.n}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px 44px", padding: "30px 0", borderTop: "1px solid rgba(255,255,255,.14)" }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", color: "#3fc0dd", paddingTop: 8 }}>{q.n}</div>
                <div className={p.spanCol2}>
                  <div style={{ fontSize: "clamp(19px,2.2vw,24px)", lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.02em", color: "#fff", textWrap: "pretty" }}>{q.q}</div>
                  {q.a && <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.78)", maxWidth: 560 }}>{q.a}</p>}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 44, paddingTop: 34, borderTop: "2px solid #3fc0dd", display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px 44px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd", paddingTop: 8 }}>Our Pledge</div>
            <p
              className={p.spanCol2}
              style={{ margin: 0, fontSize: "clamp(22px,2.9vw,30px)", lineHeight: 1.45, fontWeight: 700, letterSpacing: "-.025em", color: "#fff", textWrap: "pretty" }}
            >
              We pledge to be true to our purpose and to bring quality, affordable care to all of Africa, every day.
            </p>
          </div>
        </div>
      </section>

      <section id="leadership" data-reveal="1" className={p.pad78} style={{ background: "#f7fcfe", borderBottom: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 760 }}>
            <div style={eyebrow}>Leadership</div>
            <h2 style={{ ...h2, fontSize: 34, lineHeight: 1.15 }}>Guided by vision, driven by excellence</h2>
            <p style={{ ...body, margin: "18px 0 0" }}>
              Our strategic direction and operational integrity are anchored by an experienced leadership team. We combine seasoned industry veterans with forward-thinking professionals who share a single commitment: delivering exceptional value to our consumers while driving sustainable growth for our stakeholders.
            </p>
            <p style={{ ...body, margin: "14px 0 0" }}>
              Our governance structure ensures that we operate with transparency, uphold our core values, and maintain our position as a trusted manufacturer in the West African consumer goods sector.
            </p>
          </div>

          <h3 style={{ margin: "52px 0 0", fontSize: 13, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" }}>Board of Directors</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, marginTop: 24 }}>
            {directors.map((d) => (
              <div key={d.name} style={{ ...card, display: "flex", flexDirection: "column" }}>
                <div style={{ height: 250 }}>
                  <ImageSlot placeholder={`${d.name} portrait`} src={d.src} alt={`Portrait of ${d.name}`} width={500} height={500} />
                </div>
                <div style={{ padding: 22, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#12313d" }}>{d.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: "#12a3c4" }}>{d.role}</div>
                  <BioToggle name={d.name} paragraphs={d.bio} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal="1" className={p.pad76} style={{ background: "#f7fcfe", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow}>Our Reach</div>
            <h2 style={{ ...h2, fontSize: 32 }}>Accra, Monrovia, and the sub-region next</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22, marginTop: 40 }}>
            {reach.map((r) => (
              <div key={r.title} style={card}>
                <div style={{ height: 210 }}>
                  <ImageSlot placeholder={r.placeholder} src={r.src} alt={r.alt} width={r.w} height={r.h} />
                </div>
                <div style={{ padding: "24px 26px 28px", borderTop: "3px solid #12a3c4" }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#12313d" }}>{r.title}</div>
                  <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="csr" data-reveal="1" style={{ position: "relative", background: "#0b2f3d", overflow: "hidden" }}>
        <div style={fill}>
          <ImageSlot placeholder="CSR / screening photo" src={photos.kitchen.src} width={photos.kitchen.w} height={photos.kitchen.h} alt="" />
        </div>
        <div style={{ ...fill, background: "linear-gradient(90deg,rgba(8,42,55,.94),rgba(8,42,55,.72))", pointerEvents: "none" }} />
        <div
          style={{
            position: "relative", maxWidth: 1240, margin: "0 auto", padding: "74px 28px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 44, alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3fc0dd" }}>Beyond the product</div>
            <h2 style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 700, letterSpacing: "-.025em", color: "#fff" }}>Care that leaves the shelf</h2>
            <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.88)", maxWidth: 440 }}>
              Free cervical cancer screening with the Medical Women Association of Ghana. Menstrual health education in schools nationwide. Ongoing work against period poverty.
            </p>
            <ArrowButton href="/corporate-social-responsibility" padding="11px 11px 11px 20px" style={{ marginTop: 26 }}>Our CSR work</ArrowButton>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16 }}>
            {csrStats.map((st) => (
              <div key={st.label} style={{ border: "1px solid rgba(255,255,255,.35)", borderRadius: 12, padding: "22px 16px" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>{st.figure}</div>
                <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,.82)" }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" data-reveal="1" style={{ background: "#fff", padding: "70px 28px" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14, padding: 42,
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 32, alignItems: "center",
            boxShadow: "0 22px 46px rgba(11,90,110,.26)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-.025em", color: "#fff" }}>Work with us</h2>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 440 }}>
              Whether you want to distribute our brands, place a bulk order, join our team or simply learn more about what we make, we would like to hear from you.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link
              href="/contact-us"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
            >
              Contact us
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#12a3c4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
            </Link>
            <Link href="/contact-us" style={ghostBtn}>Request a bulk quote</Link>
            <Link href="/careers#openings" style={ghostBtn}>View current openings</Link>
            <Link href="/contact-us" style={ghostBtn}>Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
