"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { StockistItem } from "@/lib/where-to-buy";
import s from "./contact.module.css";

const GHANA: [number, number] = [7.95, -1.03];
const HQ: [number, number] = [5.6037, -0.2]; // Lexta Square, Dzorwulu (approximate)

/** Tooltip content as a text node: Leaflet writes a string tooltip with innerHTML, and shop names come from the database. */
function textTooltip(text: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

/**
 * The Leaflet map (as on the Yazz site) with OpenStreetMap tiles: numbered pins for the listed stockists (plum, the chosen
 * one red) and the Lexta head office. Loaded in the browser only; without JavaScript the list above is the finder.
 */
export default function StockistMap({ stockists, selected, onSelect, viewKey }: {
  stockists: StockistItem[]; selected: string | null; onSelect: (id: string) => void;
  /** The view is fitted to the shops only when this (the region) or the selection changes, not on every search keystroke. */
  viewKey: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const L = useRef<typeof import("leaflet") | null>(null);
  // The latest props, for the map code that runs after Leaflet has loaded.
  const latest = useRef({ stockists, selected, onSelect });
  latest.current = { stockists, selected, onSelect };

  useEffect(() => {
    let alive = true;
    void import("leaflet").then((mod) => {
      if (!alive || !box.current || map.current) return;
      const leaflet = (mod as unknown as { default?: typeof import("leaflet") }).default ?? mod;
      L.current = leaflet;
      map.current = leaflet.map(box.current, { scrollWheelZoom: false }).setView(GHANA, 6);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map.current);
      leaflet.marker(HQ, { icon: leaflet.divIcon({ className: "", html: `<div class="${s.pin} ${s.pinHq}"><span>HQ</span></div>`, iconSize: [30, 30], iconAnchor: [15, 28] }), keyboard: false })
        .addTo(map.current).bindTooltip(textTooltip("Lexta Ghana head office"), { direction: "top", offset: [0, -20] });
      draw();
      fit(false); // the first view appears in place, without a zoom animation
    });
    return () => { alive = false; map.current?.remove(); map.current = null; };
  }, []);

  const draw = () => {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    const { stockists, selected, onSelect } = latest.current;
    markers.current.forEach((x) => x.remove());
    markers.current = [];
    const placed = stockists.filter((x) => x.position);
    placed.forEach((x, i) => {
      const on = x.id === selected;
      const mk = leaflet.marker([x.position!.lat, x.position!.lng], {
        icon: leaflet.divIcon({ className: "", html: `<div class="${s.pin} ${on ? s.pinOn : ""}"><span>${i + 1}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 28] }),
        title: x.name, alt: x.name,
      }).addTo(m);
      mk.on("click", () => onSelect(x.id));
      mk.bindTooltip(textTooltip(x.name), { direction: "top", offset: [0, -20] });
      markers.current.push(mk);
    });
  };

  // Moves the view: to the chosen shop, or to fit the region's shops. Not on search typing, so pan and zoom stay.
  const fit = (animate = true) => {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    const { stockists, selected } = latest.current;
    const placed = stockists.filter((x) => x.position);
    const sel = placed.find((x) => x.id === selected);
    if (sel) m.flyTo([sel.position!.lat, sel.position!.lng], 13, { duration: .6 });
    else if (placed.length === 1) m.setView([placed[0].position!.lat, placed[0].position!.lng], 12, { animate });
    else if (placed.length > 1) m.fitBounds(leaflet.latLngBounds(placed.map((x) => [x.position!.lat, x.position!.lng] as [number, number])), { padding: [40, 40], maxZoom: 12, animate });
    else m.setView(GHANA, 6, { animate });
  };

  useEffect(draw, [stockists, selected]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => fit(), [viewKey, selected]);

  return <div ref={box} className={s.map} role="region" aria-label="Map of Linzzy stockists" />;
}
