"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FIELD_FACINGS_MAX, FIELD_NOTES_MAX, formatDistance, OUTLET_TYPES, type FieldShop, type FieldVisitPayload } from "@lexta/db";
import { getJson, newId, postJson, RequestError, uploadPhoto, withRetry } from "./net";
import PhotoPicker, { type PickedPhoto } from "./PhotoPicker";
import SessionEnded from "./SessionEnded";

type Option = { id: string; name: string };
export type StockSkuOption = { id: string; brandId: string; product: string; variant: string | null; pack: string; code: string };

type Props = {
  outcomes: { id: string; label: string }[];
  regions: Option[];
  myBrands: Option[];
  skus: StockSkuOption[];
  canAddShop: boolean;
};

type Geo =
  | { state: "asking" }
  | { state: "captured"; lat: number; lng: number; accuracy: number }
  | { state: "denied" }
  | { state: "unavailable" };

type Step = { key: string; label: string; status: "waiting" | "working" | "done" | "failed"; note?: string };
type Stock = Record<string, { on: boolean | null; facings: string }>;

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 };

/** The rep's phone flow: find the shop, then photos, outcome, notes and an optional stock check, then save. */
export default function VisitFlow({ outcomes, regions, myBrands, skus, canAddShop }: Props) {
  const [nonce, setNonce] = useState(() => newId());
  const [geo, setGeo] = useState<Geo>({ state: "asking" });
  const [query, setQuery] = useState("");
  const [shops, setShops] = useState<FieldShop[] | null>(null);
  const [shopsError, setShopsError] = useState("");
  const [shop, setShop] = useState<FieldShop | null>(null);
  const [adding, setAdding] = useState(false);
  const [newShop, setNewShop] = useState({ name: "", outlet_type: "general_trade", region_id: "", town: "", address: "", phone: "", brand_ids: myBrands.length === 1 ? [myBrands[0].id] : [] as string[] });
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [stock, setStock] = useState<Stock>({});
  const [logCrm, setLogCrm] = useState(true);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ id: string; crm: boolean } | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Location ---------------------------------------------------------------------------------------------------
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setGeo({ state: "unavailable" }); return; }
    setGeo({ state: "asking" });
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ state: "captured", lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      (e) => setGeo({ state: e.code === e.PERMISSION_DENIED ? "denied" : "unavailable" }),
      GEO_OPTIONS,
    );
  }, []);
  useEffect(() => { locate(); }, [locate]);

  // Shops, nearest first once the position is known --------------------------------------------------------------
  const pos = geo.state === "captured" ? `${geo.lat.toFixed(5)},${geo.lng.toFixed(5)}` : "";
  const loadShops = useCallback(async (q: string, at: string) => {
    setShopsError("");
    setSessionEnded(false);
    const sp = new URLSearchParams();
    if (at) { const [lat, lng] = at.split(","); sp.set("lat", lat); sp.set("lng", lng); }
    if (q.trim()) sp.set("q", q.trim());
    try {
      const res = await withRetry(() => getJson<{ shops: FieldShop[] }>(`/systems/field-sales/shops?${sp}`));
      setShops(res.shops);
    } catch (e) {
      if (e instanceof RequestError && e.auth) { setSessionEnded(true); setShopsError("The shops could not be loaded."); return; }
      setShopsError(e instanceof RequestError ? e.message : "The shops could not be loaded.");
    }
  }, []);
  useEffect(() => {
    if (geo.state === "asking" && shops === null) return; // wait a moment for the position before the first list
    const t = setTimeout(() => loadShops(query, pos), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [query, pos, geo.state, loadShops]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // If the phone takes long to answer, list the shops by name meanwhile.
    const t = setTimeout(() => { if (shops === null) loadShops("", ""); }, 4000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stock check: SKUs of the shop's brands that the rep works on ---------------------------------------------------
  const visitBrands = useMemo(() => {
    const mine = new Set(myBrands.map((b) => b.id));
    if (adding) return new Set(newShop.brand_ids);
    return new Set((shop?.brand_ids ?? []).filter((b) => mine.has(b)));
  }, [adding, newShop.brand_ids, shop, myBrands]);
  const stockSkus = skus.filter((s) => visitBrands.has(s.brandId));
  const brandName = (id: string) => myBrands.find((b) => b.id === id)?.name ?? "";

  const chosen = adding || !!shop;
  const locked = busy || !!saved;
  const pendingPhotos = photos.filter((p) => p.status !== "done");

  function pick(s: FieldShop) {
    setShop(s); setAdding(false); setError(""); setFieldError({}); setStock({});
    setLogCrm(true);
    top.current?.scrollIntoView({ block: "start" });
  }
  function startNewShop() {
    setShop(null); setAdding(true); setError(""); setFieldError({}); setStock({});
    setNewShop((n) => ({ ...n, name: query.trim() || n.name }));
  }
  function changeShop() {
    if (locked) return;
    setShop(null); setAdding(false); setFieldError({});
  }

  function payload(): FieldVisitPayload {
    const lines = Object.entries(stock).filter(([id, v]) => v.on !== null && stockSkus.some((s) => s.id === id))
      .map(([sku_id, v]) => ({ sku_id, on_shelf: !!v.on, facings: v.on && v.facings !== "" ? Number(v.facings) : null }));
    return {
      nonce,
      ...(adding
        ? { new_shop: { ...newShop, name: newShop.name.trim(), town: newShop.town.trim(), address: newShop.address.trim(), phone: newShop.phone.trim() } }
        : { stockist_id: shop!.id }),
      location: geo.state === "captured" ? { status: "captured", latitude: geo.lat, longitude: geo.lng, accuracy: geo.accuracy }
        : { status: geo.state === "denied" ? "denied" : "unavailable" },
      outcome_id: outcome,
      notes: notes.trim(),
      stock: lines,
      log_to_crm: logCrm,
    };
  }

  function validate(): boolean {
    const fe: Record<string, string> = {};
    if (adding) {
      if (!newShop.name.trim()) fe.shop_name = "Enter the shop's name.";
      if (!newShop.region_id) fe.region_id = "Choose the region.";
      if (!newShop.town.trim()) fe.town = "Enter the town.";
      if (!newShop.brand_ids.length) fe.brands = "Choose at least one brand.";
    }
    if (!outcome) fe.outcome = "Choose what happened.";
    if (notes.length > FIELD_NOTES_MAX) fe.notes = `At most ${FIELD_NOTES_MAX} characters.`;
    for (const [id, v] of Object.entries(stock)) {
      if (v.on && v.facings !== "" && !(Number.isInteger(Number(v.facings)) && Number(v.facings) >= 0 && Number(v.facings) <= FIELD_FACINGS_MAX)) {
        fe[`f_${id}`] = `A whole number up to ${FIELD_FACINGS_MAX}.`;
      }
    }
    setFieldError(fe);
    if (Object.keys(fe).length) { setError("Please check the highlighted fields."); return false; }
    return true;
  }

  const setStep = (key: string, patch: Partial<Step>) => setSteps((all) => all?.map((s) => (s.key === key ? { ...s, ...patch } : s)) ?? null);
  const setPhoto = (id: string, patch: Partial<PickedPhoto>) => setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function save() {
    if (busy) return;
    if (!saved && !validate()) return;
    setError("");
    setSessionEnded(false);
    setBusy(true);
    const todo = photos.filter((p) => p.status !== "done");
    setSteps([
      { key: "visit", label: "Saving the visit", status: saved ? "done" : "waiting" },
      ...todo.map((p) => ({ key: p.id, label: `Uploading photo ${photos.indexOf(p) + 1} of ${photos.length}`, status: "waiting" as const })),
    ]);
    let visitId = saved?.id ?? null;
    if (!visitId) {
      setStep("visit", { status: "working" });
      try {
        const res = await withRetry(() => postJson<{ id: string; crm_logged: boolean }>("/systems/field-sales/visits", payload()),
          (n) => setStep("visit", { note: `Connection problem. Trying again (${n} of 4)...` }));
        visitId = res.id;
        setSaved({ id: res.id, crm: res.crm_logged });
        setStep("visit", { status: "done", note: res.crm_logged ? "Also on the shop's CRM timeline." : undefined });
      } catch (e) {
        const err = e instanceof RequestError ? e : new RequestError("The visit could not be saved.", false);
        setStep("visit", { status: "failed", note: err.auth ? "Not saved yet: sign in again." : err.message });
        if (err.auth) { setSessionEnded(true); setBusy(false); return; }
        setError(err.retry ? "The visit is not saved yet. Check your connection, then press Try again. Nothing will be saved twice." : err.message);
        if (err.field) setFieldError({ [err.field]: err.message });
        setBusy(false);
        return;
      }
    }
    let failed = 0;
    let ended = false;
    for (const p of todo) {
      setStep(p.id, { status: "working" });
      setPhoto(p.id, { status: "uploading", progress: 0, error: undefined });
      try {
        await withRetry(
          () => uploadPhoto(visitId!, p.id, p.blob, (x) => { setPhoto(p.id, { progress: x }); setStep(p.id, { note: `${Math.round(x * 100)}%` }); }),
          (n) => setStep(p.id, { note: `Connection problem. Trying again (${n} of 4)...` }),
        );
        setPhoto(p.id, { status: "done", progress: 1 });
        setStep(p.id, { status: "done", note: undefined });
      } catch (e) {
        failed += 1;
        const msg = e instanceof RequestError ? e.message : "The photo could not be uploaded.";
        setPhoto(p.id, { status: "failed", error: msg });
        setStep(p.id, { status: "failed", note: msg });
        if (e instanceof RequestError && e.auth) { setSessionEnded(true); ended = true; break; }
      }
    }
    if (failed && !ended) setError(`The visit is saved, but ${failed === 1 ? "1 photo did" : `${failed} photos did`} not upload. Press Try again when you have a connection.`);
    setBusy(false);
  }

  function another() {
    for (const p of photos) URL.revokeObjectURL(p.url);
    setNonce(newId()); setShop(null); setAdding(false); setPhotos([]); setOutcome(""); setNotes(""); setStock({}); setLogCrm(true);
    setError(""); setFieldError({}); setSteps(null); setSaved(null); setQuery("");
    setNewShop((n) => ({ ...n, name: "", town: "", address: "", phone: "" }));
    locate();
    window.scrollTo({ top: 0 });
  }

  const allDone = !!saved && pendingPhotos.length === 0 && !busy;

  // Screens ----------------------------------------------------------------------------------------------------------
  const location = (
    <div className={`fs-geo g-${geo.state}`} role="status" aria-live="polite">
      {geo.state === "asking" && <span>Finding where you are...</span>}
      {geo.state === "captured" && <span><b>Location captured</b> (accurate to about {geo.accuracy} m)</span>}
      {geo.state === "denied" && <span><b>Location not shared.</b> You can still log the visit; it will be marked as having no location. To share it, allow location for this site in your phone&apos;s settings.</span>}
      {geo.state === "unavailable" && <span><b>Location not available.</b> You can still log the visit; it will be marked as having no location.</span>}
      {geo.state !== "asking" && !locked && <button type="button" className="btn small light" onClick={locate}>{geo.state === "captured" ? "Update location" : "Try again"}</button>}
    </div>
  );

  return (
    <div className="fs-flow" ref={top}>
      {location}
      {sessionEnded && <SessionEnded />}
      {error && <div className="alert error" role="alert">{error}</div>}

      {!chosen && (
        <section className="panel">
          <h2>Which shop are you at?</h2>
          <div className="field">
            <label htmlFor="shop_q">Find a shop</label>
            <input id="shop_q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Shop name or town" autoComplete="off" />
          </div>
          {shopsError && (
            <div className="alert error" role="alert">
              {shopsError} <button type="button" className="btn small light" onClick={() => loadShops(query, pos)}>Try again</button>
            </div>
          )}
          {shops === null && !shopsError && <p className="small" role="status">Loading shops near you...</p>}
          {shops !== null && shops.length === 0 && (
            <div className="tile empty"><b>No shops found</b><span>{query ? "Try another name or town." : "No shops of your brands are listed yet."}{canAddShop ? " You can add the shop below." : ""}</span></div>
          )}
          {shops !== null && shops.length > 0 && (
            <ul className="fs-shops" aria-label={pos ? "Shops, nearest first" : "Shops"}>
              {shops.map((s) => (
                <li key={s.id}>
                  <button type="button" className="fs-shop" onClick={() => pick(s)}>
                    <span className="fs-shop-name">{s.name}</span>
                    <span className="hint">{[s.town, s.region_name].filter(Boolean).join(", ")}{s.distance_m !== null ? `, ${formatDistance(s.distance_m)} away` : ""}</span>
                    {!s.is_active && <span className="badge off">New shop, waiting for staff</span>}
                    {s.my_last_visit_at && new Date(s.my_last_visit_at).toDateString() === new Date().toDateString() && <span className="badge on">Visited today</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {canAddShop ? (
            <button type="button" className="btn light block fs-big" onClick={startNewShop}>Shop not listed? Add a new shop</button>
          ) : (
            <p className="small">Only admin and sales reps add new shops. Pick a listed shop.</p>
          )}
        </section>
      )}

      {chosen && (
        <>
          <section className="panel fs-chosen">
            <div className="panel-head">
              <div>
                <span className="hint">{adding ? "New shop" : "Shop"}</span>
                <h2>{adding ? newShop.name.trim() || "New shop" : shop!.name}</h2>
                {!adding && <span className="hint">{[shop!.town, shop!.region_name].filter(Boolean).join(", ")}</span>}
              </div>
              {!locked && <button type="button" className="btn small light" onClick={changeShop}>Change shop</button>}
            </div>
            {adding && (
              <fieldset className="fs-newshop" disabled={locked}>
                <p className="small">Admin or marketing check new shops before they appear on Where to Buy.</p>
                <div className="field">
                  <label htmlFor="ns_name">Shop name</label>
                  <input id="ns_name" value={newShop.name} maxLength={160} onChange={(e) => setNewShop({ ...newShop, name: e.target.value })} aria-invalid={!!fieldError.shop_name} />
                  {fieldError.shop_name && <span className="ferr">{fieldError.shop_name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="ns_type">Type of shop</label>
                  <select id="ns_type" value={newShop.outlet_type} onChange={(e) => setNewShop({ ...newShop, outlet_type: e.target.value })}>
                    {OUTLET_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ns_region">Region</label>
                  <select id="ns_region" value={newShop.region_id} onChange={(e) => setNewShop({ ...newShop, region_id: e.target.value })} aria-invalid={!!fieldError.region_id}>
                    <option value="">Choose a region</option>
                    {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  {fieldError.region_id && <span className="ferr">{fieldError.region_id}</span>}
                </div>
                <div className="field">
                  <label htmlFor="ns_town">Town</label>
                  <input id="ns_town" value={newShop.town} maxLength={80} onChange={(e) => setNewShop({ ...newShop, town: e.target.value })} aria-invalid={!!fieldError.town} />
                  {fieldError.town && <span className="ferr">{fieldError.town}</span>}
                </div>
                <div className="field">
                  <label htmlFor="ns_address">Address or landmark (optional)</label>
                  <input id="ns_address" value={newShop.address} maxLength={300} onChange={(e) => setNewShop({ ...newShop, address: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="ns_phone">Shop phone (optional)</label>
                  <input id="ns_phone" type="tel" inputMode="tel" value={newShop.phone} maxLength={30} onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })} aria-invalid={!!fieldError.phone} />
                  {fieldError.phone && <span className="ferr">{fieldError.phone}</span>}
                </div>
                <div className="field">
                  <span className="label-like">Brands the shop sells</span>
                  <div className="brand-checks">
                    {myBrands.map((b) => (
                      <label key={b.id}>
                        <input type="checkbox" checked={newShop.brand_ids.includes(b.id)}
                          onChange={(e) => setNewShop({ ...newShop, brand_ids: e.target.checked ? [...newShop.brand_ids, b.id] : newShop.brand_ids.filter((x) => x !== b.id) })} />
                        {b.name}
                      </label>
                    ))}
                  </div>
                  {fieldError.brands && <span className="ferr">{fieldError.brands}</span>}
                </div>
              </fieldset>
            )}
          </section>

          <section className="panel">
            <h2>Photos</h2>
            <p className="small">Take a photo of the shelf or the shop front. Optional.</p>
            <PhotoPicker photos={photos} disabled={busy} onError={setError}
              onAdd={(p) => setPhotos((all) => [...all, ...p])}
              onRemove={(id) => setPhotos((all) => { const p = all.find((x) => x.id === id); if (p) URL.revokeObjectURL(p.url); return all.filter((x) => x.id !== id); })} />
          </section>

          <fieldset className="panel fs-fieldset" disabled={locked}>
            <legend className="sr-only">Outcome and notes</legend>
            <h2 id="outcome_label">What happened?</h2>
            <div className="fs-outcomes" role="radiogroup" aria-labelledby="outcome_label">
              {outcomes.map((o) => (
                <label key={o.id} className={`fs-outcome${outcome === o.id ? " on" : ""}`}>
                  <input type="radio" name="outcome" value={o.id} checked={outcome === o.id} onChange={() => setOutcome(o.id)} />
                  {o.label}
                </label>
              ))}
            </div>
            {fieldError.outcome && <span className="ferr">{fieldError.outcome}</span>}
            <div className="field fs-notes">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea id="notes" rows={4} maxLength={FIELD_NOTES_MAX} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Who you spoke to, what they need, when to come back" aria-invalid={!!fieldError.notes} />
              {fieldError.notes && <span className="ferr">{fieldError.notes}</span>}
            </div>
            {!adding && shop?.crm_organisation_name && (
              <label className="check-inline fs-crm">
                <input type="checkbox" checked={logCrm} onChange={(e) => setLogCrm(e.target.checked)} />
                Also log this visit on the CRM timeline of {shop.crm_organisation_name}
              </label>
            )}
          </fieldset>

          <details className="panel fs-stock">
            <summary><h2>Quick stock check (optional)</h2></summary>
            {stockSkus.length === 0 ? (
              <p className="small">{adding && !newShop.brand_ids.length ? "Choose the shop's brands first." : "No products of your brands to check yet."}</p>
            ) : (
              <fieldset className="fs-fieldset" disabled={locked}>
                <legend className="sr-only">Products on the shelf</legend>
                <p className="small">Mark what you see on the shelf. Leave a product unmarked if you did not check it.</p>
                <ul className="fs-stock-list">
                  {stockSkus.map((s) => {
                    const v = stock[s.id] ?? { on: null, facings: "" };
                    const label = `${s.product}${s.variant ? ` ${s.variant}` : ""}, ${s.pack}`;
                    const set = (patch: Partial<typeof v>) => setStock((all) => ({ ...all, [s.id]: { ...v, ...patch } }));
                    return (
                      <li key={s.id}>
                        <div className="sku-text">
                          <b>{s.product}{s.variant ? `, ${s.variant}` : ""}</b>
                          <span className="hint">{brandName(s.brandId)}, {s.pack} <span className="mono">{s.code}</span></span>
                        </div>
                        <div className="seg fs-seg" role="group" aria-label={`On the shelf: ${label}`}>
                          <button type="button" aria-pressed={v.on === true} onClick={() => set({ on: v.on === true ? null : true })}>On shelf</button>
                          <button type="button" aria-pressed={v.on === false} onClick={() => set({ on: v.on === false ? null : false, facings: "" })}>Not on shelf</button>
                        </div>
                        {v.on === true && (
                          <div className="field fs-facings">
                            <label htmlFor={`f_${s.id}`}>Facings (optional)</label>
                            <input id={`f_${s.id}`} type="number" inputMode="numeric" min={0} max={FIELD_FACINGS_MAX} step={1} value={v.facings}
                              onChange={(e) => set({ facings: e.target.value })} aria-invalid={!!fieldError[`f_${s.id}`]} />
                            {fieldError[`f_${s.id}`] && <span className="ferr">{fieldError[`f_${s.id}`]}</span>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            )}
          </details>

          {steps && (
            <section className="panel fs-progress" aria-live="polite">
              <h2>{allDone ? "Visit saved" : busy ? "Saving..." : saved ? "Visit saved, photos still to send" : "Not saved yet"}</h2>
              <ol className="fs-steps">
                {steps.map((s) => (
                  <li key={s.key} className={`st-${s.status}`}>
                    <span className="fs-step-label">{s.label}</span>
                    <span className="fs-step-state">{s.status === "done" ? "Done" : s.status === "working" ? "Working" : s.status === "failed" ? "Not done" : "Waiting"}</span>
                    {s.note && <span className="hint">{s.note}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {allDone ? (
            <div className="fs-done">
              <div className="alert ok" role="status">Visit saved{saved?.crm ? " and logged on the CRM" : ""}.</div>
              <button type="button" className="btn block fs-big" onClick={another}>Start another visit</button>
              <Link className="btn light block fs-big" href={`/systems/field-sales/visits/${saved!.id}`}>Open this visit</Link>
              <Link className="btn light block fs-big" href="/systems/field-sales">My visits today</Link>
            </div>
          ) : (
            <div className="fs-savebar">
              <button type="button" className="btn block fs-big" onClick={save} disabled={busy}>
                {busy ? "Saving..." : saved ? "Send photos" : steps ? "Try again" : "Save visit"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
