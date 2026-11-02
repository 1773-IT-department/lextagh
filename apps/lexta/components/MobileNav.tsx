"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { isCurrent, mobileLinks, portalUrl } from "./site-links";

/**
 * Mobile top bar and slide-in drawer. React port of the prototype's site-mobile-nav.js,
 * same sizes, colours and timings. The bar is display:none until globals.css shows it under 900px.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onResize = () => { if (window.innerWidth > 900) setOpen(false); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Close the drawer after navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  const bun: CSSProperties = {
    display: "block", height: 2, width: "100%", background: "#12313d", borderRadius: 2,
    transition: "transform .25s ease,opacity .2s ease",
  };
  const here = (href: string) => isCurrent(href, pathname);
  const contactCurrent = here("/contact-us");
  const partnerCurrent = here("/partner-with-us");

  return (
    <>
      <div
        data-lxm-bar="1"
        style={{
          display: "none", position: "fixed", top: 0, left: 0, right: 0, height: 58, zIndex: 200, background: "#fff",
          boxShadow: "0 1px 0 rgba(10,55,70,.1)", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/lexta-logo.png" alt="Lexta" style={{ height: 36, width: "auto", display: "block" }} />
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="lx-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 44, height: 44, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5,
            padding: "0 10px", border: 0, background: "transparent", cursor: "pointer",
          }}
        >
          <span style={{ ...bun, transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
          <span style={{ ...bun, opacity: open ? 0 : 1 }} />
          <span style={{ ...bun, transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
        </button>
      </div>

      <div
        data-lxm-scrim="1"
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 210, background: "rgba(6,32,42,.55)", opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none", transition: "opacity .28s ease",
        }}
      />

      <div
        id="lx-mobile-menu"
        data-lxm-panel="1"
        aria-hidden={!open}
        inert={!open}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(330px,86vw)", zIndex: 220, background: "#fff",
          boxShadow: "-14px 0 40px rgba(6,32,42,.28)", transform: open ? "translateX(0)" : "translateX(104%)",
          transition: "transform .32s cubic-bezier(.3,.7,.2,1)", display: "flex", flexDirection: "column", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e6f1f5" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/lexta-logo.png" alt="Lexta" style={{ height: 34, width: "auto", display: "block" }} />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            style={{ width: 38, height: 38, border: 0, borderRadius: 9, background: "#f2f9fb", color: "#12313d", fontSize: 18, lineHeight: 1, cursor: "pointer" }}
          >
            &times;
          </button>
        </div>

        <nav aria-label="Mobile" style={{ display: "flex", flexDirection: "column", padding: "8px 18px 4px" }}>
          {mobileLinks.map((l) => {
            const current = here(l.href);
            const base: CSSProperties = { fontSize: 15, borderBottom: "1px solid #eef5f8", minHeight: 48, display: "flex", alignItems: "center" };
            const style: CSSProperties = current
              ? { ...base, fontWeight: 700, color: "#12a3c4", background: "rgba(18,163,196,.08)", borderLeft: "3px solid #12a3c4", margin: "0 -18px", padding: "15px 18px 15px 17px" }
              : { ...base, fontWeight: 500, color: "#1d3c48", padding: "15px 2px" };
            return (
              <Link key={l.href} href={l.href} style={style} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px 18px 26px" }}>
          <Link
            href="/contact-us"
            aria-current={contactCurrent ? "page" : undefined}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 9,
              background: contactCurrent ? "#0d8ba8" : "#12a3c4", color: "#fff", fontSize: 14, fontWeight: 700,
            }}
          >
            Contact Us
          </Link>
          <Link
            href="/partner-with-us"
            aria-current={partnerCurrent ? "page" : undefined}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 9,
              border: `1px solid ${partnerCurrent ? "#12a3c4" : "rgba(18,163,196,.45)"}`,
              background: partnerCurrent ? "rgba(18,163,196,.1)" : undefined,
              color: "#12a3c4", fontSize: 14, fontWeight: partnerCurrent ? 700 : 600,
            }}
          >
            Partner With Us
          </Link>
        </div>

        <div style={{ marginTop: "auto", padding: 18, borderTop: "1px solid #eef5f8", fontSize: 12, lineHeight: 1.7, color: "#5d7883" }}>
          Lexta Square, Dzorwulu, Accra<br />+233 (0) 501 619 588<br />support@lextagh.com
          <div style={{ marginTop: 10 }}>
            <a href={portalUrl} style={{ fontSize: 12, fontWeight: 600, color: "#128fb0" }}>Staff login</a>
          </div>
        </div>
      </div>
    </>
  );
}
