"use client";

import type { CSSProperties } from "react";
import { choiceCardReset, visuallyHidden } from "@/components/forms/FormParts";
import fx from "@/components/forms/forms.module.css";
import { routes } from "./data";
import { useActiveRoute } from "./RouteContext";

/* Values copied from partner-with-us.html. */
const panelLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" };

/**
 * "Six routes into the business": the six route cards (one is selected) and the selected-route panel below them.
 * Each card is a label around a real radio of the application form (form attribute), so the route is sent even
 * without JavaScript. The cards keep the look of the prototype's buttons.
 */
export default function RoutePicker() {
  const { active, select } = useActiveRoute();

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Ways to partner"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginTop: 34, maxWidth: 1100 }}
      >
        {routes.map((r) => {
          const on = r.key === active.key;
          return (
            <label
              key={r.key}
              className={fx.choice}
              style={{
                ...choiceCardReset, cursor: "pointer", textAlign: "left", border: `1px solid ${on ? "#12a3c4" : "rgba(18,163,196,.2)"}`,
                background: on ? "#f2fbfe" : "#fff", borderRadius: 13, padding: "26px 24px", display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <input
                type="radio"
                name="route"
                value={r.key}
                form="partner-application"
                defaultChecked={on}
                onChange={() => select(r.key)}
                style={visuallyHidden}
              />
              <span
                aria-hidden="true"
                style={{
                  width: 38, height: 38, borderRadius: 10, background: on ? "#12a3c4" : "#f0f9fc", color: on ? "#fff" : "#0b6d88",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                }}
              >
                {r.tag}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{r.title}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.8, color: "#5d7883" }}>{r.desc}</span>
              <span
                style={{
                  marginTop: 2, fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: on ? "#0b6d88" : "#8aa4ad",
                }}
              >
                {r.meta}
              </span>
            </label>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 26, border: "1px solid rgba(18,163,196,.2)", background: "#f7fcfe", borderRadius: 14, padding: "32px 30px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 32,
        }}
      >
        <div>
          <div style={panelLabel}>Selected route</div>
          <div aria-live="polite" style={{ marginTop: 10, fontSize: 22, fontWeight: 700, color: "#12313d", letterSpacing: "-.02em" }}>{active.title}</div>
          <p style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.9, color: "#5d7883" }}>{active.summary}</p>
        </div>
        <div>
          <div style={panelLabel}>What we look for</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {active.criteria.map((c) => (
              <div key={c} style={{ display: "flex", gap: 11, alignItems: "flex-start", fontSize: 13, lineHeight: 1.75, color: "#12313d" }}>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto", width: 18, height: 18, marginTop: 2, borderRadius: "50%", background: "#12a3c4", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                  }}
                >
                  ✓
                </span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
