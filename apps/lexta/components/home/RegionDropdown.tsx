"use client";

import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from "react";
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
  const toggle = useRef<HTMLButtonElement>(null);
  const optionEls = useRef<(HTMLButtonElement | null)[]>([]);
  const focusOnOpen = useRef(-1);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    if (focusOnOpen.current >= 0) {
      // The panel fades in (visibility transition), so the option can only take focus from the next frame on.
      const target = optionEls.current[focusOnOpen.current];
      focusOnOpen.current = -1;
      let tries = 0;
      const tryFocus = () => {
        target?.focus();
        if (target && document.activeElement !== target && ++tries < 20) raf = requestAnimationFrame(tryFocus);
      };
      tryFocus();
    }
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => { document.removeEventListener("click", close); cancelAnimationFrame(raf); };
  }, [open]);

  // Keyboard: arrows open the list and move between options, Home/End jump, Escape closes.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = optionEls.current.findIndex((o) => o === document.activeElement);
    const last = regions.length - 1;
    let next = -1;
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      toggle.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") next = current < 0 ? regions.indexOf(value) : Math.min(last, current + 1);
    else if (e.key === "ArrowUp") next = current < 0 ? regions.indexOf(value) : Math.max(0, current - 1);
    else if (open && e.key === "Home") next = 0;
    else if (open && e.key === "End") next = last;
    else return;
    e.preventDefault();
    if (!open) { focusOnOpen.current = next; setOpen(true); } else optionEls.current[next]?.focus();
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (open && !box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  return (
    <div ref={box} data-region-dd="1" onKeyDown={onKeyDown} onBlur={onBlur} style={{ position: "relative", marginTop: 10 }}>
      <button
        ref={toggle}
        type="button"
        data-dd-toggle="1"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Your region: ${value}`}
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
        {regions.map((r, k) => {
          const selected = r === value;
          return (
            <button
              key={r}
              ref={(node) => { optionEls.current[k] = node; }}
              tabIndex={-1}
              type="button"
              data-dd-opt="1"
              role="option"
              aria-selected={selected}
              className={s.ddOpt}
              onClick={() => { setValue(r); setOpen(false); toggle.current?.focus(); }}
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
