"use client";

import type { CSSProperties } from "react";
import { useActiveRoute } from "./RouteContext";

/* Values copied from partner-with-us.html. */
const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 600, color: "#12313d" };
const field: CSSProperties = {
  border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d",
  background: "#fff", minWidth: 0, fontFamily: "inherit",
};

const textFields = [
  { label: "Contact name", name: "contact_name", type: "text", placeholder: "Your name", autoComplete: "name" },
  { label: "Business name", name: "business_name", type: "text", placeholder: "Registered trading name", autoComplete: "organization" },
  { label: "Email", name: "email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
  { label: "Phone", name: "phone", type: "tel", placeholder: "+233", autoComplete: "tel" },
  { label: "Trading location", name: "trading_location", type: "text", placeholder: "City, region or country", autoComplete: "off" },
  { label: "Years trading", name: "years_trading", type: "text", placeholder: "e.g. 6", autoComplete: "off" },
];

/**
 * The partnership application card. Its title, note and message hint follow the route picked above, as in the prototype.
 *
 * Visually identical to the prototype but NOT wired yet: item 19 sends applications into the CRM. There is no <form>,
 * so nothing is submitted. "Submit application" keeps the prototype's behaviour: it opens an email to the trade desk
 * with the route in the subject line (the typed fields are not carried over).
 */
export default function ApplicationForm() {
  const { active } = useActiveRoute();
  const mailto = "mailto:sales@lextagh.com?subject=" + encodeURIComponent(active.title + " partnership application");

  return (
    <div style={{ background: "#f7fcfe", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}>
      <div aria-live="polite" style={{ fontSize: 19, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{active.title} application</div>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{active.note}</p>
      <input type="hidden" name="route" value={active.key} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 22 }}>
        {textFields.map((f) => (
          <label key={f.name} style={fieldLabel}>
            {f.label}
            <input type={f.type} name={f.name} autoComplete={f.autoComplete} placeholder={f.placeholder} style={field} />
          </label>
        ))}
      </div>
      <label style={{ ...fieldLabel, marginTop: 14 }}>
        Tell us more
        <textarea name="message" rows={4} placeholder={active.placeholder} style={{ ...field, minWidth: undefined, resize: "vertical" }} />
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 20 }}>
        <a
          href={mailto}
          style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 12px 12px 20px", borderRadius: 8 }}
        >
          Submit application
          <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
        </a>
        <span style={{ fontSize: 11.5, color: "#5d7883" }}>We reply within two working days.</span>
      </div>
    </div>
  );
}
