"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import s from "./home.module.css";

/** Static region list from the prototype. Live stockist data arrives with the Where to Buy card. */
const regions = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta", "Northern", "Upper East", "Upper West", "Bono",
  "Liberia (Monrovia)",
];

/** "Your region" picker, ported from the prototype's custom dropdown. */
export default function RegionDropdown() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(regions[0]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div ref={box} data-region-dd="1" style={{ position: "relative", marginTop: 10 }}>
      <button
        type="button"
        data-dd-toggle="1"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={s.ddToggle}
        style={{
          width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          border: `1px solid ${open ? "#12a3c4" : "#dceaef"}`, borderRadius: 9, padding: "0 14px",
          fontSize: 13.5, fontWeight: 600, color: "#12313d", background: "#fbfeff", cursor: "pointer",
          transition: "border-color .18s,box-shadow .18s,background .18s",
        }}
      >
        <span data-dd-value="1">{value}</span>
        <span
          data-dd-caret="1"
          aria-hidden="true"
          style={{
            width: 22, height: 22, borderRadius: "50%", background: "rgba(18,163,196,.12)", color: "#12a3c4", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 10, transition: "transform .22s cubic-bezier(.3,.7,.2,1)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▼
        </span>
      </button>
      <div
        data-dd-panel="1"
        role="listbox"
        aria-label="Your region"
        style={{
          position: "absolute", left: 0, right: 0, top: 54, zIndex: 60, background: "#fff", border: "1px solid #e2eff4",
          borderRadius: 10, boxShadow: "0 22px 44px rgba(11,60,78,.18)", padding: 6, maxHeight: 300, overflowY: "auto",
          overscrollBehavior: "contain", scrollbarWidth: "thin", scrollbarColor: "#bfe3ee #fff", WebkitOverflowScrolling: "touch",
          opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden", transform: open ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity .18s,transform .22s cubic-bezier(.3,.7,.2,1),visibility .18s",
        } as CSSProperties}
      >
        {regions.map((r) => {
          const selected = r === value;
          return (
            <button
              key={r}
              type="button"
              data-dd-opt="1"
              role="option"
              aria-selected={selected}
              className={s.ddOpt}
              onClick={() => { setValue(r); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", border: 0, background: "transparent", borderRadius: 7, padding: "11px 12px",
                fontSize: 13, fontWeight: selected ? 600 : 500, color: selected ? "#12a3c4" : "#3f5b66", cursor: "pointer",
                transition: "background .15s,color .15s",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
