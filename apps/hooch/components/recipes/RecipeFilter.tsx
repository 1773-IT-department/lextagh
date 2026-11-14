"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/cards/Cards";
import s from "@/components/pages/pages.module.css";
import type { Recipe } from "@/content/recipes";

/** Recipe cards with Breakfast and Snack filter chips (all show without JavaScript). */
export default function RecipeFilter({ recipes }: { recipes: Recipe[] }) {
  const [moment, setMoment] = useState<"all" | Recipe["moment"]>("all");
  const shown = recipes.filter((r) => moment === "all" || r.moment === moment);
  return (
    <>
      <div className={s.filters} role="group" aria-label="Filter recipes">
        {(["all", "Breakfast", "Snack"] as const).map((m) => (
          <button key={m} type="button" className="hc-chip" aria-pressed={moment === m} onClick={() => setMoment(m)}>{m === "all" ? "All ideas" : m}</button>
        ))}
      </div>
      <p className="hc-sr" aria-live="polite">{shown.length} recipes shown</p>
      <div className={`${s.grid4} ${s.mt}`}>{shown.map((r, i) => <RecipeCard key={r.slug} r={r} i={i} />)}</div>
    </>
  );
}
