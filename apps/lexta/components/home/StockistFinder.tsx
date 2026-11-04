"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import RegionDropdown, { type RegionOption } from "./RegionDropdown";
import s from "./home.module.css";

/** One shop as /api/stockists returns it. */
export type StockistItem = {
  id: string;
  name: string;
  outletLabel: string;
  town: string;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  brands: string[];
};

type Result =
  | { state: "idle" }
  | { state: "loading"; region: string }
  | { state: "done"; region: string; stockists: StockistItem[] }
  | { state: "error"; region: string };

const smallLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#8aa4ae", textTransform: "uppercase" };
const findBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 10, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600,
  padding: "11px 18px", borderRadius: 7, border: 0, fontFamily: "inherit", lineHeight: "inherit", cursor: "pointer",
};
const outlineBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 10, border: "1px solid rgba(18,163,196,.5)", color: "#12a3c4",
  fontSize: 13, fontWeight: 600, padding: "11px 18px", borderRadius: 7,
};
const note: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.75, color: "#4d6a75" };
const contactLink: CSSProperties = { color: "#0b6d88", fontWeight: 600, textDecoration: "underline" };
const brandChip: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#0b6d88", background: "rgba(18,163,196,.1)", borderRadius: 999, padding: "3px 9px",
};

/**
 * Where to Buy finder (Home page): pick a region, press Find a stockist, and the live stockists of that region
 * appear under the buttons. Until then the card looks exactly like the approved prototype.
 * Without JavaScript the button still works as it did before item 20: the card is a form whose action is
 * /contact-us, so pressing it opens the contact page. With JavaScript the submit is intercepted and the list
 * loads in place. (A server rendered ?region= search is not used because it would stop Home being prerendered.)
 */
export default function StockistFinder({ regions }: { regions: RegionOption[] }) {
  const [region, setRegion] = useState(regions[0]?.slug ?? "");
  const [result, setResult] = useState<Result>({ state: "idle" });
  const request = useRef(0);

  const search = async (slug: string) => {
    if (!slug) return;
    const id = ++request.current;
    setResult({ state: "loading", region: slug });
    try {
      const res = await fetch(`/api/stockists?region=${encodeURIComponent(slug)}`, { headers: { accept: "application/json" } });
      const body = (await res.json()) as { ok?: boolean; stockists?: StockistItem[] };
      if (id !== request.current) return;
      if (!res.ok || !body.ok || !Array.isArray(body.stockists)) throw new Error(`status ${res.status}`);
      setResult({ state: "done", region: slug, stockists: body.stockists });
    } catch {
      if (id === request.current) setResult({ state: "error", region: slug });
    }
  };

  // Once the list is showing, choosing another region updates it straight away.
  const searched = result.state !== "idle";
  useEffect(() => {
    if (searched && result.region !== region) void search(region);
  }, [region]);

  const regionName = regions.find((r) => r.slug === (result.state === "idle" ? region : result.region))?.name ?? "";

  return (
    <form
      action="/contact-us"
      method="get"
      style={{ margin: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        void search(region);
      }}
    >
      <div style={smallLabel}>Your region</div>
      <RegionDropdown regions={regions} value={region} onChange={setRegion} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        <button type="submit" style={findBtn} aria-controls="stockist-results">
          Find a stockist
        </button>
        <Link href="/partner-with-us" className={s.outlineHover} style={outlineBtn}>
          Stock our products
        </Link>
      </div>

      <div id="stockist-results" aria-live="polite" aria-busy={result.state === "loading"}>
        {result.state !== "idle" && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #e6f1f5" }}>
            {result.state === "loading" && <p style={note}>Looking for stockists in {regionName}...</p>}

            {result.state === "error" && (
              <p style={note}>
                We could not load the stockist list just now. <Link href="/contact-us" style={contactLink}>Contact us</Link> to find your nearest shop.
              </p>
            )}

            {result.state === "done" && result.stockists.length === 0 && (
              <p style={note}>
                We are adding stockists in this region. <Link href="/contact-us" style={contactLink}>Contact us</Link> to find your nearest shop.
              </p>
            )}

            {result.state === "done" && result.stockists.length > 0 && (
              <>
                <div style={smallLabel}>
                  {result.stockists.length} {result.stockists.length === 1 ? "stockist" : "stockists"} in {regionName}
                </div>
                <ul
                  style={{
                    listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10,
                    maxHeight: 340, overflowY: "auto", overscrollBehavior: "contain", scrollbarWidth: "thin", scrollbarColor: "#bfe3ee #fff",
                  }}
                >
                  {result.stockists.map((st) => (
                    <li key={st.id} style={{ border: "1px solid #e6f1f5", borderRadius: 9, padding: "12px 14px", background: "#fbfeff" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#12313d", overflowWrap: "anywhere" }}>{st.name}</div>
                      <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.6, color: "#5d7883", overflowWrap: "anywhere" }}>
                        {st.outletLabel}, {st.town}
                        {st.address ? <><br />{st.address}</> : null}
                        {st.openingHours ? <><br />{st.openingHours}</> : null}
                        {st.phone ? (
                          <>
                            <br />
                            <a href={`tel:${st.phone.replace(/[^+\d]/g, "")}`} style={{ color: "#0b6d88", fontWeight: 600 }}>{st.phone}</a>
                          </>
                        ) : null}
                      </div>
                      {st.brands.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          <span className={s.srOnly}>Brands stocked: </span>
                          {st.brands.map((b) => <span key={b} style={brandChip}>{b}</span>)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
