"use client";

import { useState } from "react";
import s from "./home.module.css";

/**
 * "10 Packs, 10 Breakfast Moments": ten little packs in a row that hop in a wave. Tap one and it pops open into a bowl
 * (a toy, nothing more: no data is kept). Buttons with aria-pressed, so it works from the keyboard too.
 */
export default function PackRow({ flavour }: { flavour: "classic" | "frosted" }) {
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
  return (
    <div className={s.packs} data-flavour={flavour} role="group" aria-label="Ten individual packs">
      {Array.from({ length: 10 }, (_, i) => {
        const on = open.includes(i);
        return (
          <button key={i} type="button" className={s.pack} aria-pressed={on} aria-label={`Pack ${i + 1} of 10`} onClick={() => toggle(i)} style={{ "--i": i } as React.CSSProperties}>
            <svg viewBox="0 0 48 60" aria-hidden="true" className={s.packBag}>
              <path d="M8 6h32l-2 5 2 5v34a4 4 0 01-4 4H12a4 4 0 01-4-4V16l2-5z" />
              <ellipse cx="24" cy="31" rx="12" ry="8.5" className={s.packOval} />
              <text x="24" y="35" textAnchor="middle" className={s.packNum}>{i + 1}</text>
            </svg>
            <svg viewBox="0 0 48 40" aria-hidden="true" className={s.packBowl}>
              <path d="M6 18h36c0 10-8 18-18 18S6 28 6 18z" className={s.bowlRed} />
              <ellipse cx="24" cy="18" rx="18" ry="4" className={s.bowlMilk} />
              <path d="M12 16c2-5 6-7 9-5 2-4 7-4 9 0 3-2 7 0 7 4" className={s.bowlFlakes} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
