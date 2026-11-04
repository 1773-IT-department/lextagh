"use client";

import { useState } from "react";
import { faqs } from "./data";

/** "Questions we get most": one answer open at a time, as in the prototype (+ / minus badge). */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
      {faqs.map((f, i) => {
        const isOpen = open === i;
        const panelId = `contact-faq-${i}`;
        return (
          <div key={f.q} style={{ border: "1px solid rgba(18,163,196,.2)", borderRadius: 12, background: "#fff", overflow: "hidden", boxShadow: "0 10px 24px rgba(11,60,78,.06)" }}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={isOpen ? panelId : undefined}
              onClick={() => setOpen((o) => (o === i ? null : i))}
              style={{ width: "100%", textAlign: "left", border: 0, background: "transparent", cursor: "pointer", padding: "20px 22px", display: "flex", alignItems: "center", gap: 18 }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: "#12313d", textWrap: "pretty" }}>{f.q}</span>
              <span
                aria-hidden="true"
                style={{ flex: "0 0 auto", width: 28, height: 28, borderRadius: "50%", background: "#f0f9fc", color: "#0b6d88", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <p id={panelId} style={{ margin: 0, borderTop: "1px solid rgba(18,163,196,.14)", padding: "18px 22px 22px", fontSize: 13, lineHeight: 1.9, color: "#5d7883", textWrap: "pretty" }}>
                {f.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
