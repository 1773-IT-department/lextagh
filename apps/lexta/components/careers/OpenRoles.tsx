"use client";

import { useState, type CSSProperties } from "react";
import ArrowButton from "@/components/ArrowButton";
import { departments, jobs, locations, types } from "./data";

/* Values copied from careers.html. */
const rowLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#5d7883", minWidth: 96 };
const row: CSSProperties = { display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" };
const divider: CSSProperties = { height: 1, background: "rgba(18,163,196,.14)" };
const blueLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" };
const bulletList: CSSProperties = { display: "flex", flexDirection: "column", gap: 9, marginTop: 12 };
const bulletRow: CSSProperties = { display: "flex", gap: 10, fontSize: 13, lineHeight: 1.75, color: "#5d7883" };
const dot: CSSProperties = { flex: "0 0 auto", marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: "#12a3c4" };

type FilterKey = "dept" | "loc" | "type";

function Chips({ label, names, active, onSelect }: { label: string; names: string[]; active: string; onSelect: (v: string) => void }) {
  return (
    <div style={row}>
      <div style={rowLabel}>{label}</div>
      <div role="group" aria-label={`Filter roles by ${label.toLowerCase()}`} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {names.map((name) => {
          const on = name === active;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(name)}
              style={{
                border: `1px solid ${on ? "#12313d" : "rgba(18,163,196,.3)"}`, background: on ? "#12313d" : "#fff", color: on ? "#fff" : "#3f5f6b",
                fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 20, cursor: "pointer",
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <div style={bulletList}>
      {items.map((t) => (
        <div key={t} style={bulletRow}>
          <span style={dot} />
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * "Find your role": search, department / location / type chips, result count, "Clear all filters", the role
 * accordion and the empty state, behaving like the prototype (any filter change closes the open role).
 */
export default function OpenRoles() {
  const [filters, setFilters] = useState<Record<FilterKey, string>>({ dept: "All", loc: "All", type: "All" });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const select = (key: FilterKey) => (v: string) => { setFilters((f) => ({ ...f, [key]: v })); setOpen(null); };

  const needle = q.trim().toLowerCase();
  const filtered = jobs.filter((j) =>
    (filters.dept === "All" || j.dept === filters.dept) &&
    (filters.loc === "All" || j.location === filters.loc) &&
    (filters.type === "All" || j.type === filters.type) &&
    (!needle || `${j.title} ${j.dept} ${j.summary} ${j.location}`.toLowerCase().includes(needle)),
  );
  const n = filtered.length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#12a3c4" }}>Current openings</div>
          <h2 style={{ margin: "12px 0 0", fontSize: 34, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-.025em", color: "#12313d", textWrap: "pretty" }}>Find your role</h2>
          <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.9, color: "#5d7883" }}>
            Filter by department, location or engagement type. Open a role to see the full brief before you apply.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 260px", maxWidth: 360, border: "1px solid rgba(18,163,196,.35)", borderRadius: 9, padding: "12px 15px", background: "#f7fcfe" }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flex: "0 0 auto", color: "#5d7883" }}>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            type="search"
            aria-label="Search roles"
            placeholder="Search roles, e.g. quality, sales"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(null); }}
            style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", outline: "none", fontSize: 13, color: "#12313d" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 34, padding: "22px 24px", border: "1px solid rgba(18,163,196,.18)", borderRadius: 14, background: "#f7fcfe" }}>
        <Chips label="Department" names={departments} active={filters.dept} onSelect={select("dept")} />
        <div style={divider} />
        <Chips label="Location" names={locations} active={filters.loc} onSelect={select("loc")} />
        <div style={divider} />
        <Chips label="Type" names={types} active={filters.type} onSelect={select("type")} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 26 }}>
        <div aria-live="polite" style={{ fontSize: 13, fontWeight: 600, color: "#5d7883" }}>{n === 1 ? "1 role matches" : `${n} roles match`}</div>
        <button
          type="button"
          onClick={() => { setFilters({ dept: "All", loc: "All", type: "All" }); setQ(""); setOpen(null); }}
          style={{ border: 0, background: "transparent", color: "#12a3c4", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 4 }}
        >
          Clear all filters
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        {filtered.map((j, i) => {
          const isOpen = open === i;
          const panelId = `role-${j.ref}`;
          return (
            <div key={j.ref} style={{ border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, background: "#fff", boxShadow: "0 12px 28px rgba(11,60,78,.07)", overflow: "hidden" }}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen((o) => (o === i ? null : i))}
                style={{ width: "100%", textAlign: "left", border: 0, background: "transparent", cursor: "pointer", padding: "24px 26px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}
              >
                <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#12a3c4" }}>{j.dept}</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#b7cdd6" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8fa8b2" }}>Posted {j.posted}</span>
                    {j.urgent && (
                      <span style={{ background: "rgba(18,163,196,.12)", color: "#0b6d88", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 5 }}>
                        Closing soon
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 9, fontSize: 19, fontWeight: 700, letterSpacing: "-.02em", color: "#12313d", textWrap: "pretty" }}>{j.title}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, fontWeight: 600, color: "#5d7883" }}>
                    <span>{j.location}</span>
                    <span>{j.type}</span>
                    <span>{j.level}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#12a3c4" }}>{isOpen ? "Close" : "View role"}</span>
                  <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: "50%", background: "#f0f9fc", color: "#0b6d88", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </div>
              </button>
              {isOpen && (
                <div
                  id={panelId}
                  style={{ borderTop: "1px solid rgba(18,163,196,.16)", background: "#fbfeff", padding: "28px 26px 30px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 34 }}
                >
                  <div>
                    <div style={blueLabel}>The role</div>
                    <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.9, color: "#5d7883", textWrap: "pretty" }}>{j.summary}</p>
                    <div style={{ ...blueLabel, marginTop: 22 }}>What you will do</div>
                    <Bullets items={j.duties} />
                  </div>
                  <div>
                    <div style={blueLabel}>What we are looking for</div>
                    <Bullets items={j.reqs} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
                      <ArrowButton href="#general" padding="12px 12px 12px 20px">Apply for this role</ArrowButton>
                      <a
                        href="mailto:support@lextagh.com"
                        style={{ display: "inline-flex", alignItems: "center", border: "1px solid rgba(18,163,196,.45)", background: "#fff", color: "#0b6d88", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 7 }}
                      >
                        Ask a question
                      </a>
                    </div>
                    <div style={{ marginTop: 14, fontSize: 11, color: "#8fa8b2" }}>Applications close {j.closes}. Reference {j.ref}.</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {n === 0 && (
        <div style={{ marginTop: 20, border: "1px dashed rgba(18,163,196,.35)", borderRadius: 14, padding: "44px 26px", textAlign: "center", background: "#f7fcfe" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#12313d" }}>No roles match those filters</div>
          <p style={{ margin: "10px auto 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883", maxWidth: 420 }}>
            Try widening your search, or send us a general application and we will keep you in mind when something opens.
          </p>
          <a href="#general" style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#12a3c4" }}>
            Send a general application <span style={{ fontSize: 14 }}>→</span>
          </a>
        </div>
      )}
    </>
  );
}
