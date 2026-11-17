"use client";

import { useEffect, useRef, useState } from "react";
import ProductsView from "../views/ProductsView";
import { h, tone, useChrome } from "../chrome";
import type { ProtoProduct } from "../model";

// Products (Linzzy Products.dc.html): the two bands and the product details panel, with the products of Product
// Management in the Business System (lib/products.ts). ?p=<product slug> opens a product's details.

const CHAPTERS: [string, string, string][] = [["top", "00", "Our Collection"], ["fem", "01", "Feminine Care"], ["baby", "02", "Baby Care"], ["distributors", "03", "Distributors"]];
const BANDS = [
  { id: "fem" as const, num: "01", label: "02 Feminine Care", eyebrow: "Linzzy Feminine Care", title: "Comfort Through Every Cycle", lead: "Your period is personal, and your choice of sanitary protection should reflect your individual needs. Discover the Linzzy Feminine Care Collection, featuring sanitary towels and panty liners developed for different menstrual flows, coverage preferences and everyday routines.", bg: "#3a1150", accent: "#F48FB1", body: "#eee5f7", cat: "Feminine Care" },
  { id: "baby" as const, num: "02", label: "03 Baby Care", eyebrow: "Linzzy Baby Care", title: "Little Beginnings Deserve Loving Care", lead: "From your baby's earliest days to the exciting stages of growth, Linzzy Baby Care supports the everyday hygiene routines of parents and caregivers. Explore our baby diapers and wipes, created for families who value comfort, cleanliness and convenient care.", bg: "#0B3D2E", accent: "#9EE6C8", body: "#e6fbf2", cat: "Baby Care" },
];
/** The rows of the panel's "Usage, Ingredients & Skin Sensitivity" section, in Lexta's order; missing fields are left out. */
function careRows(p: ProtoProduct) {
  const rows: { label: string; text: string | null }[] = [
    { label: "Recommended Use", text: p.recommended },
    { label: "How to Use", text: p.usage },
    { label: "Skin Sensitivity & Allergy Precautions", text: p.sensitivity },
    { label: "Ingredients", text: p.ingredients },
  ];
  const care = rows.filter((r): r is { label: string; text: string } => Boolean(r.text));
  return { care, hasCare: care.length > 0 };
}
const two = (n: number) => String(n).padStart(2, "0");

export default function ProductsClient({ products }: { products: ProtoProduct[] }) {
  const c = useChrome("/products", "Our Collection");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search).get("p");
      if (p && products.some((x) => x.id === p)) setDetail(p);
    } catch { /* no query */ }
  }, []);
  // The details panel takes the focus (its Close button) and gives it back to the button that opened it.
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (detail) {
      document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close product details"]')?.focus();
    } else if (opener.current) {
      opener.current.focus();
      opener.current = null;
    }
  }, [detail]);
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  const all = products.map((p) => ({
    ...p, ...tone(p.g), anchor: "p-" + p.id,
    wtb: `/contact?product=${encodeURIComponent(p.id)}#where-to-buy`,
    ask: `/contact?topic=question&product=${encodeURIComponent(p.id)}#message`,
    open: h(() => { opener.current = document.activeElement as HTMLElement | null; setDetail(p.id); }),
  }));
  const d = detail ? all.find((p) => p.id === detail) : null;
  const bands = BANDS.map((b) => {
    const items = all.filter((p) => p.g === b.id).map((p, i) => ({ ...p, num: two(i + 1) }));
    return { ...b, items, count: two(items.length) };
  });

  const v = {
    ...c.base,
    chapters: c.chapters(CHAPTERS),
    jump: { fem: h(() => c.jumpTo("fem")), baby: h(() => c.jumpTo("baby")) },
    femCount: two(bands[0].items.length),
    babyCount: two(bands[1].items.length),
    bands,
    hasDetail: !!d,
    // The panel's description slot shows Lexta's full product description (Drive, "3. Products Page"); the cards keep
    // the short summary; Z1 adds the other product page fields (headline, features, usage and care, Linzzy says, reads).
    detail: d ? { ...d, desc: d.long, ...careRows(d) } : {},
    closeDetail: () => setDetail(null),
    stop: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  };
  return <ProductsView v={v} />;
}
