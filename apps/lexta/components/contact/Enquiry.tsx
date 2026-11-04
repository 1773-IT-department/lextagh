"use client";

import { useState, type CSSProperties } from "react";
import { reasons, regions } from "./data";

/* Values copied from contact-us.html. */
const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 600, color: "#12313d" };
const field: CSSProperties = {
  border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d",
  background: "#fff", minWidth: 0, fontFamily: "inherit",
};

/**
 * "What is this about?": the six enquiry routes and the enquiry form that changes with them (title, note,
 * fourth field, message hint and the routing email), as in the prototype.
 *
 * The form is visually identical to the prototype but NOT wired yet: item 19 sends it into the CRM and
 * complaints tracker. Until then "Send message" does nothing; the prototype's fake "Message sent" label is dropped.
 */
export default function Enquiry() {
  const [selected, setSelected] = useState(0);
  const active = reasons[selected];

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "start" }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>Send a message</div>
        <h2 style={{ margin: "12px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>What is this about?</h2>
        <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883", maxWidth: 460 }}>
          Choose the reason for your enquiry and we route it straight to the responsible team, with the detail they need to respond properly the first time.
        </p>

        <div role="group" aria-label="Reason for your enquiry" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
          {reasons.map((r, i) => {
            const on = i === selected;
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(i)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${on ? "#12a3c4" : "rgba(18,163,196,.2)"}`,
                  background: on ? "#f0f9fc" : "#fff", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto", width: 34, height: 34, borderRadius: 9, background: on ? "#12a3c4" : "#f0f9fc", color: on ? "#fff" : "#0b6d88",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                  }}
                >
                  {r.tag}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#12313d" }}>{r.key}</span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 12, lineHeight: 1.7, color: "#5d7883" }}>{r.desc}</span>
                </span>
                <span aria-hidden="true" style={{ flex: "0 0 auto", fontSize: 13, fontWeight: 700, color: "#12a3c4" }}>{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "#f7fcfe", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}>
        <div aria-live="polite" style={{ fontSize: 19, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{active.formTitle}</div>
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>{active.formNote}</p>
        <input type="hidden" name="reason" value={active.key} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 22 }}>
          <label style={fieldLabel}>
            Full name
            <input type="text" name="name" autoComplete="name" placeholder="Your name" style={field} />
          </label>
          <label style={fieldLabel}>
            Email
            <input type="email" name="email" autoComplete="email" placeholder="you@example.com" style={field} />
          </label>
          <label style={fieldLabel}>
            Phone
            <input type="tel" name="phone" autoComplete="tel" placeholder="+233" style={field} />
          </label>
          <label style={fieldLabel}>
            {active.extraLabel}
            <input type="text" name="detail" placeholder={active.extraPlaceholder} style={field} />
          </label>
        </div>
        <label style={{ ...fieldLabel, marginTop: 14 }}>
          Region
          <select name="region" style={field}>
            {regions.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label style={{ ...fieldLabel, marginTop: 14 }}>
          Your message
          <textarea
            name="message"
            rows={5}
            placeholder={active.messagePlaceholder}
            style={{ ...field, lineHeight: 1.7, resize: "vertical", minWidth: undefined }}
          />
        </label>
        <button
          type="button"
          style={{ marginTop: 20, width: "100%", border: 0, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "14px 20px", borderRadius: 7, cursor: "pointer" }}
        >
          Send message
        </button>
        <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.7, color: "#8fa8b2" }}>
          Your details are used only to answer this enquiry. Enquiries go to {active.email}.
        </div>
      </div>
    </div>
  );
}
