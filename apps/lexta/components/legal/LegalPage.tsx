import type { CSSProperties } from "react";

export type LegalSection = { heading: string; paras: string[] };

type Props = {
  kicker: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

const h2: CSSProperties = { margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 700, letterSpacing: "-.02em", color: "#12313d", textWrap: "pretty" };
const para: CSSProperties = { margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.9, color: "#4c6a75", textWrap: "pretty" };

/**
 * Shared layout of the Privacy Policy and Terms & Conditions pages, ported 1:1 from privacy-policy.html and
 * terms-and-conditions.html (dark hero with "Last updated", numbered sections, "Questions" box).
 * The legal text itself is passed in word for word; Lexta must supply and approve it before go-live.
 */
export default function LegalPage({ kicker, title, intro, updated, sections }: Props) {
  return (
    <>
      <section data-screen-label="Hero" style={{ background: "#0c303e", padding: "70px 28px 60px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>{kicker}</div>
          <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
          <h1 style={{ margin: "20px 0 0", fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
            {title}
          </h1>
          <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.9)", maxWidth: 620, textWrap: "pretty" }}>{intro}</p>
          <div style={{ marginTop: 22, fontSize: 12, color: "rgba(255,255,255,.6)" }}>{`Last updated: ${updated}`}</div>
        </div>
      </section>

      <section data-screen-label="Content" style={{ background: "#fff", padding: "64px 28px 74px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 38 }}>
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 style={h2}>{s.heading}</h2>
              {s.paras.map((t) => <p key={t} style={para}>{t}</p>)}
            </div>
          ))}
          <div style={{ border: "1px solid rgba(18,163,196,.2)", background: "#f7fcfe", borderRadius: 14, padding: "26px 26px 28px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" }}>Questions</div>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.85, color: "#4c6a75" }}>
              Write to <a href="mailto:sales@lextagh.com">sales@lextagh.com</a> or call +233 (0) 501 619 588. Postal enquiries: Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
