"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { footerQuickLinks, footerSupportLinks, portalUrl } from "./site-links";

const colTitle: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 };
const colLinks: CSSProperties = { display: "flex", flexDirection: "column", gap: 11 };
const footLink: CSSProperties = { fontSize: 12, color: "rgba(255,255,255,.7)" };
const contactRow: CSSProperties = { display: "flex", gap: 10, fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,.7)" };
const iconStyle: CSSProperties = { flex: "0 0 auto", marginTop: 4 };
const socialStyle: CSSProperties = {
  width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.12)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
};

/**
 * Social links keep the prototype's look ("f", "ig", "in", "tk" text badges) for now.
 * Swapping them for real icons is the separate "Fix prototype gaps" card.
 */
const socials = [
  { label: "Facebook", short: "f", href: "https://www.facebook.com/lextagh" },
  { label: "Instagram", short: "ig", href: "https://www.instagram.com/lextagh" },
  { label: "LinkedIn", short: "in", href: "https://www.linkedin.com/company/lextagh" },
  { label: "TikTok", short: "tk", href: "https://www.tiktok.com/@lextagh" },
];

/** Shared footer, ported from the prototype home page footer (the most complete version). */
export default function SiteFooter() {
  const pathname = usePathname();
  // On Home the newsletter band sits right above the footer, so the prototype uses a 10px top padding there.
  const topPad = pathname === "/" ? 10 : 60;
  const stroke = "rgba(255,255,255,.7)";

  return (
    <footer style={{ background: "#0b2f3d", padding: `${topPad}px 28px 34px` }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 38 }}>
        <div>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/lexta-logo-white.png" alt="Lexta" style={{ height: 40, width: "auto", display: "block" }} />
          </Link>
          <p style={{ margin: "16px 0 0", fontSize: 12, lineHeight: 1.8, color: "rgba(255,255,255,.65)", maxWidth: 210 }}>
            Caring for you every day through quality products, innovation and community impact.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={s.label} style={socialStyle}>{s.short}</a>
            ))}
          </div>
        </div>

        <div>
          <div style={colTitle}>Quick Links</div>
          <div style={colLinks}>
            {footerQuickLinks.map((l) => <Link key={l.href} href={l.href} style={footLink}>{l.label}</Link>)}
          </div>
        </div>

        <div>
          <div style={colTitle}>Support</div>
          <div style={colLinks}>
            {footerSupportLinks.map((l) => <Link key={l.href} href={l.href} style={footLink}>{l.label}</Link>)}
            <a href={portalUrl} style={footLink}>Staff login</a>
          </div>
        </div>

        <div>
          <div style={colTitle}>Contact Us</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={contactRow}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={iconStyle} aria-hidden="true"><circle cx="7" cy="6" r="2.4" stroke={stroke} strokeWidth="1.4" /><path d="M7 13c3-4 5-6 5-8a5 5 0 10-10 0c0 2 2 4 5 8z" stroke={stroke} strokeWidth="1.4" /></svg>
              <span>Lexta Square, Olusegun Obasanjo Highway, Dzorwulu, Accra, Ghana.</span>
            </div>
            <div style={contactRow}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={iconStyle} aria-hidden="true"><path d="M2 3c0 5 4 9 9 9l1.5-2.5-3-1.5-1.5 1.5C6.5 8.5 5.5 7.5 4.5 5.5L6 4 4.5 1 2 3z" stroke={stroke} strokeWidth="1.4" /></svg>
              <span>+233 (0) 501 619 588<br />+233 (0) 302 235 296</span>
            </div>
            <div style={contactRow}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={iconStyle} aria-hidden="true"><rect x="1" y="3" width="12" height="9" stroke={stroke} strokeWidth="1.4" /><path d="M1 3.5l6 4.5 6-4.5" stroke={stroke} strokeWidth="1.4" /></svg>
              <span>support@lextagh.com</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.12)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>© 2026. Lexta Ghana LTD. All Rights Reserved.</div>
        <button
          type="button"
          data-totop="1"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ width: 30, height: 30, borderRadius: 6, border: 0, background: "rgba(255,255,255,.14)", color: "#fff", cursor: "pointer", fontSize: 12 }}
        >
          ▲
        </button>
      </div>
    </footer>
  );
}
