"use client";

import { Select } from "@lexta/ui";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { ALL_REGIONS, type RegionOption, type StockistItem } from "@/lib/where-to-buy";
import StockistMap from "./StockistMap";
import s from "./contact.module.css";

const REMEMBER = "linzzy-region";
const remember = (slug: string) => { try { localStorage.setItem(REMEMBER, slug); } catch { /* storage blocked */ } };
const remembered = () => { try { return localStorage.getItem(REMEMBER) ?? ""; } catch { return ""; } };

type Result = { state: "done"; region: string; stockists: StockistItem[] } | { state: "loading"; region: string } | { state: "error"; region: string };

/**
 * Where to Buy: the stockist locator of the Yazz site (search, filter chips, list and Leaflet map), reading the Linzzy
 * stockists of the Lexta Business System. The page renders the chosen region's stockists on the server, and the
 * picker is a GET form (?region=), so it works without JavaScript. With JavaScript the list reloads in place from
 * /api/stockists, the choice is remembered for the next visit (region preselected from a product's "Where to buy").
 */
export default function WhereToBuy({
  regions, initialRegion, initial, regionFromUrl, product,
}: {
  regions: RegionOption[];
  initialRegion: string;
  initial: StockistItem[] | null;
  regionFromUrl: boolean;
  product: { slug: string; name: string } | null;
}) {
  const [region, setRegion] = useState(initialRegion);
  const [result, setResult] = useState<Result>(initial ? { state: "done", region: initialRegion, stockists: initial } : { state: "error", region: initialRegion });
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const req = useRef(0);

  const load = async (slug: string) => {
    const id = ++req.current;
    setResult({ state: "loading", region: slug });
    setSelected(null);
    try {
      const res = await fetch(`/api/stockists?region=${encodeURIComponent(slug)}`, { headers: { accept: "application/json" } });
      const body = (await res.json()) as { ok?: boolean; stockists?: StockistItem[] };
      if (id !== req.current) return;
      if (!res.ok || !body.ok || !Array.isArray(body.stockists)) throw new Error(String(res.status));
      setResult({ state: "done", region: slug, stockists: body.stockists });
    } catch {
      if (id === req.current) setResult({ state: "error", region: slug });
    }
  };

  // No region in the address: use the one this visitor chose last time.
  useEffect(() => {
    if (regionFromUrl) { remember(initialRegion); return; }
    const r = remembered();
    if (r && r !== initialRegion && (r === ALL_REGIONS || regions.some((x) => x.slug === r))) { setRegion(r); void load(r); }
  }, []);

  const choose = (slug: string) => {
    setRegion(slug);
    remember(slug);
    void load(slug);
  };

  const all = result.state === "done" ? result.stockists : [];
  const types = useMemo(() => [...new Map(all.map((x) => [x.outletType, x.outletLabel])).entries()], [all]);
  const q = query.trim().toLowerCase();
  const list = useMemo(
    () => all.filter((x) => (type === "all" || x.outletType === type) && (!q || `${x.name} ${x.town} ${x.address ?? ""} ${x.region}`.toLowerCase().includes(q))),
    [all, type, q],
  );
  const regionName = region === ALL_REGIONS ? "Ghana" : regions.find((r) => r.slug === region)?.name ?? "";

  return (
    <div className={s.locator}>
      {product && (
        <p className={s.productNote}>
          <Icon name="box" size={18} /> Looking for <strong>{product.name}</strong>? These shops stock Linzzy products; call ahead to check the pack you need.
        </p>
      )}
      <form action="/contact#where-to-buy" method="get" className={s.finder} onSubmit={(e) => { e.preventDefault(); choose(region); }}>
        {product && <input type="hidden" name="product" value={product.slug} />}
        <div className={s.finderField}>
          <label htmlFor="wtb-region" className={s.smallLabel}>Your region</label>
          <Select id="wtb-region" name="region" value={region} onChange={(e) => choose(e.target.value)} className={s.selectFace} nativeOnTouch={false}>
            <option value={ALL_REGIONS}>All regions</option>
            {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </Select>
        </div>
        <div className={s.finderField}>
          <label htmlFor="wtb-search" className={s.smallLabel}>Search town or shop</label>
          <div className={s.searchBox}>
            <input id="wtb-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter a town or shop name" />
            <Icon name="search" size={18} />
          </div>
        </div>
        <noscript><button type="submit" className="lz-btn lz-btn--berry">Find stockists</button></noscript>
      </form>

      {types.length > 1 && (
        <div className={s.typeChips} role="group" aria-label="Type of shop">
          <button type="button" className="lz-chip" aria-pressed={type === "all"} onClick={() => setType("all")}>All types</button>
          {types.map(([v, label]) => <button key={v} type="button" className="lz-chip" aria-pressed={type === v} onClick={() => setType(v)}>{label}</button>)}
        </div>
      )}

      <div className={s.locatorGrid}>
        <div className={s.listCol}>
          <div className={s.listHead} aria-live="polite">
            {result.state === "loading" ? "Looking for stockists..." : result.state === "error" ? "Stockists unavailable" : `${list.length} ${list.length === 1 ? "stockist" : "stockists"} in ${regionName}`}
          </div>
          <ul className={s.list} aria-busy={result.state === "loading"}>
            {result.state === "error" && (
              <li className={s.listNote}>We could not load the stockist list just now. <Link href="/contact?topic=stockist#message">Ask us</Link> where to find Linzzy near you.</li>
            )}
            {result.state === "done" && list.length === 0 && (
              <li className={s.listNote}>
                We are adding Linzzy stockists {region === ALL_REGIONS ? "across Ghana" : `in ${regionName}`}. Try another region, or{" "}
                <Link href="/contact?topic=stockist#message">ask us</Link> to find your nearest shop.
              </li>
            )}
            {list.map((x) => (
              <li key={x.id} className={s.shop} data-selected={selected === x.id ? "" : undefined}>
                <div className={s.shopTop}>
                  <h3>{x.name}</h3>
                  <span className={s.badge}>{x.outletLabel}</span>
                </div>
                <p><Icon name="pin" size={14} /> {[x.address, x.town, `${x.region} Region`].filter(Boolean).join(", ")}</p>
                {x.phone && <p><Icon name="phone" size={14} /> <a href={`tel:${x.phone.replace(/[^+\d]/g, "")}`}>{x.phone}</a></p>}
                {x.openingHours && <p><Icon name="clock" size={14} /> {x.openingHours}</p>}
                <div className={s.shopActions}>
                  {x.position && (
                    <>
                      <button type="button" className={s.mapBtn} onClick={() => setSelected(x.id)} aria-label={`Show ${x.name} on the map`}><Icon name="pin" size={14} /> Show on map</button>
                      <a className={s.dirBtn} href={`https://www.google.com/maps/dir/?api=1&destination=${x.position.lat},${x.position.lng}`} target="_blank" rel="noopener">
                        Directions <Icon name="arrow" size={13} />
                      </a>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <StockistMap stockists={list} selected={selected} onSelect={setSelected} viewKey={`${result.state}:${result.region}:${type}`} />
      </div>
      <p className={s.mapNote}>Shops are listed by Lexta&apos;s sales team. Your shop stocks Linzzy and is not listed? <Link href="/contact#trade">Tell us</Link>.</p>
    </div>
  );
}
