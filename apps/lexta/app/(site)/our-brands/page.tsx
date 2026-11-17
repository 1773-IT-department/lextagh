import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import ImageSlot from "@/components/ImageSlot";
import RevealOnScroll from "@/components/RevealOnScroll";
import BrandJumpBar from "@/components/brands/BrandJumpBar";
import ProductCardView from "@/components/brands/ProductCardView";
import type { ProductCard } from "@/components/brands/data";
import { getBrandRanges } from "@/components/brands/live";
import p from "@/components/proto.module.css";
import { hoochSiteUrl, linzzySiteUrl, yazzSiteUrl } from "@/components/site-links";

const title = "Our Brands | Yazz, Linzzy and Hooch by Lexta Ghana";
const description =
  "Discover the Lexta family of brands serving personal care, feminine care, oral care, home and tissue needs, baby care and food.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description, type: "website" },
};

/**
 * Product cards come live from Product Management. The page is rebuilt when the portal saves a product
 * (/api/revalidate clears the "products" tag and this path) and at the latest every hour.
 */
export const revalidate = 3600;

/* ---------- Shared prototype styles (values copied from our-brands.html) ---------- */

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" };
const brandH2: CSSProperties = { margin: "12px 0 0", fontSize: 34, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" };
const lead: CSSProperties = { margin: "18px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" };
const rangeLabel: CSSProperties = { marginTop: 56, fontSize: 13, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" };
const twoCol: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 48, alignItems: "center" };
const pointGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22 };
const rangeGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24, marginTop: 24 };
const raisedPoint: CSSProperties = { background: "#fff", borderRadius: 14, padding: 28, borderTop: "3px solid #12a3c4", boxShadow: "0 16px 34px rgba(11,60,78,.1)" };
const flatPoint: CSSProperties = { background: "#f7fcfe", borderRadius: 14, padding: 28, borderTop: "3px solid #12a3c4" };
const logoBadge: CSSProperties = { background: "#fff", borderRadius: 12, padding: "14px 18px", display: "inline-flex", boxShadow: "0 12px 26px rgba(11,60,78,.1)" };
const arrowBadge: CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
};
const brandBtn: CSSProperties = {
  marginTop: 36, display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13,
  fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7,
};
const whiteBtnArrow: CSSProperties = { ...arrowBadge, background: "#12a3c4", color: "#fff" };
const ghostBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.55)",
  color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7,
};

/* eslint-disable @next/next/no-img-element -- remote brand logos and pack shots, sized as in the prototype */

function Points({ items, style }: { items: { title: string; text: string }[]; style: CSSProperties }) {
  return (
    <>
      {items.map((it) => (
        <div key={it.title} style={style}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#12313d" }}>{it.title}</div>
          <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{it.text}</p>
        </div>
      ))}
    </>
  );
}

function Range({ label, products, variant }: { label: string; products: ProductCard[]; variant: "raised" | "outlined" }) {
  // A brand with nothing published (or switched off) shows its story without an empty range.
  if (products.length === 0) return null;
  return (
    <>
      <h3 style={{ ...rangeLabel, marginBottom: 0 }}>{label}</h3>
      <div style={rangeGrid}>
        {products.map((pr) => <ProductCardView key={pr.slug} product={pr} variant={variant} />)}
      </div>
    </>
  );
}

function BrandButton({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  const inner = (
    <>
      {children}
      <span aria-hidden="true" style={arrowBadge}>→</span>
    </>
  );
  return external ? <a href={href} style={brandBtn}>{inner}</a> : <Link href={href} style={brandBtn}>{inner}</Link>;
}

export default async function OurBrandsPage() {
  const ranges = await getBrandRanges();
  return (
    <>
      <RevealOnScroll />

      <section
        data-screen-label="Brands hero"
        style={{ position: "relative", background: "#0c303e", overflow: "hidden", minHeight: 440, display: "flex", alignItems: "center", padding: "88px 28px" }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <ImageSlot
            placeholder="Group shot of all three brands together"
            src="/brands-hero-family.png"
            width={1536}
            height={1024}
            alt=""
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg,rgba(6,32,42,.94) 0%,rgba(6,32,42,.7) 46%,rgba(6,32,42,.22) 82%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Our Brands</div>
            <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
            <h1 style={{ margin: "20px 0 0", fontSize: "clamp(30px,6vw,52px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              The Lexta family <span style={{ color: "rgb(63, 192, 221)" }}>of brands</span>
            </h1>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.92)", maxWidth: 600, textWrap: "pretty" }}>
              Discover the Lexta family of brands serving personal care, feminine care, oral care, home and tissue needs, baby care and food.
            </p>
          </div>
        </div>
      </section>

      <BrandJumpBar />

      <section data-reveal="1" style={{ background: "#fff", padding: "72px 28px 60px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 54, alignItems: "start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "clamp(24px,3.4vw,34px)", lineHeight: 1.25, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>
              At the heart of our portfolio are our flagship brands Yazz, Hooch and Linzzy
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: "#5d7883" }}>
              Each carefully developed to provide dependable, high-quality solutions that enhance everyday life.
            </p>
          </div>
        </div>
      </section>

      {/* Yazz (other pages link to /our-brands#yazz) */}
      <section id="yazz" data-screen-label="Yazz" data-reveal="1" style={{ background: "#f7fcfe", padding: "74px 28px", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={twoCol}>
            <div>
              <div style={logoBadge}>
                <img src="/assets/original/web/lexta-lexta-brand-yazz1-e1779978936763.webp" alt="Yazz" style={{ height: 56, width: "auto", display: "block" }} />
              </div>
              <div style={{ ...eyebrow, marginTop: 22 }}>The champion of the everyday</div>
              <h2 style={brandH2}>Yazz</h2>
              <p style={lead}>
                Trusted quality made for everyday living. From feminine care and baby essentials to oral care, home care and tissues, Yazz brings practical care into the moments that matter. Yazz is the Preferred Sanitary and Hygiene Brand in 2022 (Home Builders Africa Awards).
              </p>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", minHeight: 330, display: "flex", boxShadow: "0 20px 44px rgba(11,60,78,.18)", background: "#fff" }}>
              <ImageSlot
                placeholder="Yazz range group shot"
                src="/pasted-1788770621047-0-mtqzucne-o23m.png"
                width={1254}
                height={1254}
                alt="The Yazz range of products"
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </div>
          </div>

          <div style={{ ...pointGrid, marginTop: 44 }}>
            <Points
              style={raisedPoint}
              items={[
                { title: "Core Philosophy", text: "To deliver high-performance hygiene staples that give people the security to face their daily ambitions with unshakeable confidence." },
                { title: "Value Proposition", text: "High-quality essentials built to fit household budgets without sacrificing materials, structural durability, or design safety." },
              ]}
            />
          </div>

          <Range label="The Yazz range" products={ranges.yazz} variant="raised" />

          <BrandButton href={yazzSiteUrl}>Visit yazzproducts.com</BrandButton>
        </div>
      </section>

      {/* Linzzy */}
      <section id="linzzy" data-screen-label="Linzzy" data-reveal="1" style={{ background: "#fff", padding: "74px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={twoCol}>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 44px rgba(11,60,78,.18)", order: -1 }}>
              <img src="/assets/original/web/lexta-linzzy-your-trusted-partner-copy.webp" alt="Linzzy" style={{ display: "block", width: "100%", height: "auto" }} />
            </div>
            <div>
              <div style={eyebrow}>Sophisticated protection</div>
              <h2 style={brandH2}>Linzzy</h2>
              <p style={lead}>
                Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited, created to support the personal care needs of women, mothers and growing families. Its portfolio includes sanitary towels, panty liners, baby diapers and baby wipes, offering practical choices for different care routines.
              </p>
            </div>
          </div>

          <div style={{ ...pointGrid, marginTop: 44 }}>
            <Points
              style={flatPoint}
              items={[
                { title: "Comfort-focused design", text: "Product options designed with attention to fit, coverage, convenience and everyday use, built around the Absorb, Lock and Breathe positioning." },
                { title: "A brand that listens", text: "We value consumer feedback and believe that understanding real experiences helps us continuously improve." },
              ]}
            />
          </div>

          <Range label="The Linzzy range" products={ranges.linzzy} variant="outlined" />

          <BrandButton href={linzzySiteUrl}>Visit linzzyproducts.com</BrandButton>
        </div>
      </section>

      {/* Hooch */}
      <section id="hooch" data-screen-label="Hooch" data-reveal="1" style={{ background: "#f7fcfe", padding: "74px 28px", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={twoCol}>
            <div>
              <div style={logoBadge}>
                <img src="/assets/original/web/lexta-hooch-logo.webp" alt="Hooch" style={{ height: 52, width: "auto", display: "block" }} />
              </div>
              <div style={{ ...eyebrow, marginTop: 22 }}>Fuelled by integrity</div>
              <h2 style={brandH2}>Hooch</h2>
              <p style={lead}>
                Hooch is a food brand within the Lexta Ghana Limited family, created to make breakfast and snack moments enjoyable, practical and accessible. We believe that a positive start can open the door to learning, creativity and connection. Our ambition is to support families with dependable food choices and useful everyday ideas.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <img
                src="/assets/original/web/lexta-hooch-mascot-rr0nb0dsah3quka9ki3k3ixuza0in0lgws11dpir2g.webp"
                alt="Hooch mascot"
                style={{ maxWidth: "100%", maxHeight: 340, display: "block" }}
              />
            </div>
          </div>

          <div style={{ ...pointGrid, marginTop: 36 }}>
            <Points
              style={raisedPoint}
              items={[
                { title: "Enriched with vitamins", text: "Vit E, Thiamine B1, Riboflavin B2, Niacin B3, Pantothenic Acid B5, Vit B6, Vit B12, Folic Acid." },
                { title: "Convenience", text: "Making busy mornings easier with individually portioned cereal packs." },
              ]}
            />
          </div>

          <Range label="The Hooch range" products={ranges.hooch} variant="raised" />

          <BrandButton href={hoochSiteUrl}>Visit hoochfoods.com</BrandButton>
        </div>
      </section>

      <section id="standard" data-screen-label="One standard" data-reveal="1" style={{ position: "relative", background: "#0b2f3d", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {/* [PLACEHOLDER: real factory floor or production line photo from Lexta] */}
          <ImageSlot placeholder="Real factory floor / production line photo" />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(95deg,rgba(8,42,55,.95),rgba(8,42,55,.7))", pointerEvents: "none" }} />
        <div className={p.pad82} style={{ position: "relative", maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>At Lexta, we ask</div>
            <h2 style={{ margin: "14px 0 0", fontSize: "clamp(26px,4vw,36px)", lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
              What is care if it's not of the utmost quality?
            </h2>
            <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.9, color: "rgba(255,255,255,.92)" }}>
              So we make the best products, using the most premium materials, for you.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>
              What is care if the people we create it for cannot share in it? So we make our products affordable, without compromising quality.
            </p>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "rgba(255,255,255,.82)" }}>
              How do we make sure the affordable quality becomes the standard, to be enjoyed by a lot more people?
            </p>
            <div style={{ marginTop: 26, fontSize: 18, fontWeight: 700, lineHeight: 1.5, color: "#3fc0dd", textWrap: "pretty" }}>
              So we pledge to be true to our purpose and bring quality, affordable care to all of Africa, every day.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginTop: 44 }}>
            {[
              { figure: "2002", label: "Established as a proudly Ghanaian-owned company" },
              { figure: "2", label: "Ghana, and a wholly-owned subsidiary in Monrovia, Liberia" },
              { figure: "Batch", label: "Every batch meets rigorous safety criteria" },
            ].map((st) => (
              <div key={st.label} style={{ border: "1px solid rgba(255,255,255,.35)", borderRadius: 12, padding: 22 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>{st.figure}</div>
                <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,.82)" }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where to find them: the stockist finder itself is the Where to Buy section of the Home page. */}
      <section data-screen-label="Where to find them" data-reveal="1" style={{ background: "#f7fcfe", padding: "74px 28px", borderTop: "1px solid rgba(18,163,196,.14)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <div style={eyebrow}>Where to find them</div>
            <h2 style={{ margin: "14px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>On shelves near you</h2>
            <p style={lead}>
              Search by region to find your nearest stockist.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <Link
                href="/#where-to-buy"
                style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
              >
                Find a stockist
                <span aria-hidden="true" style={arrowBadge}>→</span>
              </Link>
              <a
                href="#trade"
                style={{ display: "inline-flex", alignItems: "center", background: "#fff", border: "1px solid rgba(18,163,196,.5)", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
              >
                Stock our brands
              </a>
            </div>
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", minHeight: 320, display: "flex", boxShadow: "0 20px 44px rgba(11,60,78,.16)" }}>
            <ImageSlot
              placeholder="Retail shelf / market stall photo"
              src="/pasted-1788864602539-0-mtsjsp8a-bvzb.png"
              width={1670}
              height={941}
              alt="Lexta products on a retail shelf"
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </section>

      <section id="trade" data-screen-label="For trade" data-reveal="1" style={{ background: "#fff", padding: "70px 28px" }}>
        <div
          style={{
            maxWidth: 1240, margin: "0 auto", background: "linear-gradient(100deg,#0e7f97,#18a9c6)", borderRadius: 14, padding: 42,
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 34, alignItems: "center", boxShadow: "0 22px 46px rgba(11,90,110,.26)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>For trade</div>
            <h2 style={{ margin: "12px 0 0", fontSize: 30, fontWeight: 700, letterSpacing: "-.025em", color: "#fff" }}>Sell our brands</h2>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,.92)", maxWidth: 460 }}>
              For distributors, wholesalers and modern trade, select your partnership type and share your region and contact details.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link
              href="/contact-us"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 7 }}
            >
              Contact us
              <span aria-hidden="true" style={whiteBtnArrow}>→</span>
            </Link>
            <Link href="/partner-with-us" style={ghostBtn}>Partner with Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
