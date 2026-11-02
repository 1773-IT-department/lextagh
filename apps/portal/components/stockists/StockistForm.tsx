"use client";

import { startTransition, useActionState, useState } from "react";
import { OUTLET_TYPES, type Region, type Stockist } from "@lexta/db";
import { saveStockist, type StockistFormState } from "@/app/(app)/systems/stockists/actions";

type BrandOption = { id: string; name: string };
type Mode = "full" | "brands" | "view";

const empty: StockistFormState = {};

const GEO_ERRORS: Record<number, string> = {
  1: "Location access was blocked. Allow location for this site in your browser settings, or type the numbers.",
  2: "Your position could not be found. Move to an open area or type the numbers.",
  3: "Finding your position took too long. Try again, or type the numbers.",
};

export default function StockistForm({
  mode,
  stockist,
  notes = "",
  regions,
  allBrands,
  myBrands,
  carried,
}: {
  mode: Mode;
  stockist?: Stockist;
  notes?: string;
  regions: Pick<Region, "id" | "name" | "is_in_ghana">[];
  allBrands: BrandOption[];
  myBrands: BrandOption[];
  carried: string[];
}) {
  const [state, action, pending] = useActionState(saveStockist, empty);
  const [lat, setLat] = useState(stockist?.latitude === null || stockist?.latitude === undefined ? "" : String(stockist.latitude));
  const [lng, setLng] = useState(stockist?.longitude === null || stockist?.longitude === undefined ? "" : String(stockist.longitude));
  const [geo, setGeo] = useState<{ busy?: boolean; error?: string; note?: string }>({});
  const isNew = !stockist;
  const fe = state.fieldErrors ?? {};
  const mine = new Set(myBrands.map((b) => b.id));
  const detailsLocked = mode !== "full";
  const ghana = regions.filter((r) => r.is_in_ghana);
  const abroad = regions.filter((r) => !r.is_in_ghana);
  const mapLink = lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
    : null;

  function locateMe() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeo({ error: "This browser cannot share its location. Type the numbers instead." });
      return;
    }
    if (!window.isSecureContext) {
      setGeo({ error: "Location only works on a secure (https) address. Type the numbers instead." });
      return;
    }
    setGeo({ busy: true });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);
        setGeo({ note: `Position set, accurate to about ${accuracy} m. Stand at the shop entrance for the best result, then save.` });
      },
      (err) => setGeo({ error: GEO_ERRORS[err.code] ?? "Your position could not be found. Type the numbers instead." }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  return (
    <form
      className="pform stockist-form"
      noValidate
      onSubmit={(e) => {
        // Submit by hand so React does not reset the fields: on an error the person keeps what they typed.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      {state.message && <div className="alert ok" role="status">{state.message}</div>}
      <input type="hidden" name="id" value={stockist?.id ?? ""} />
      {mode === "brands" && <input type="hidden" name="mode" value="brands" />}

      <fieldset disabled={mode === "view" || pending}>
        <div className="edit-grid">
          <div>
            <fieldset disabled={detailsLocked}>
              <section className="panel">
                <h2>Shop details</h2>
                <div className="field">
                  <label htmlFor="name">Shop name</label>
                  <input id="name" name="name" defaultValue={stockist?.name ?? ""} maxLength={160} aria-invalid={!!fe.name} autoComplete="off" required />
                  {fe.name && <span className="ferr">{fe.name}</span>}
                </div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor="outlet_type">Outlet type</label>
                    <select id="outlet_type" name="outlet_type" defaultValue={stockist?.outlet_type ?? ""} aria-invalid={!!fe.outlet_type} required>
                      <option value="" disabled>Choose a type</option>
                      {OUTLET_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {fe.outlet_type && <span className="ferr">{fe.outlet_type}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="region_id">Region</label>
                    <select id="region_id" name="region_id" defaultValue={stockist?.region_id ?? ""} aria-invalid={!!fe.region} required>
                      <option value="" disabled>Choose a region</option>
                      <optgroup label="Ghana">{ghana.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>
                      {abroad.length > 0 && <optgroup label="Outside Ghana">{abroad.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>}
                    </select>
                    {fe.region && <span className="ferr">{fe.region}</span>}
                  </div>
                </div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor="town">Town</label>
                    <input id="town" name="town" defaultValue={stockist?.town ?? ""} maxLength={80} aria-invalid={!!fe.town} required />
                    {fe.town && <span className="ferr">{fe.town}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={stockist?.phone ?? ""} maxLength={24} placeholder="+233 20 123 4567" aria-invalid={!!fe.phone} />
                    {fe.phone && <span className="ferr">{fe.phone}</span>}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="address">Address or landmark (optional)</label>
                  <input id="address" name="address" defaultValue={stockist?.address ?? ""} maxLength={300} placeholder="For example opposite the main lorry station" aria-invalid={!!fe.address} />
                  {fe.address && <span className="ferr">{fe.address}</span>}
                </div>
                <div className="field">
                  <label htmlFor="opening_hours">Opening hours (optional)</label>
                  <input id="opening_hours" name="opening_hours" defaultValue={stockist?.opening_hours ?? ""} maxLength={200} placeholder="For example Mon to Sat, 8am to 7pm" aria-invalid={!!fe.opening_hours} />
                  {fe.opening_hours && <span className="ferr">{fe.opening_hours}</span>}
                </div>
              </section>

              <section className="panel">
                <h2>Map position (optional)</h2>
                <p className="small">At the shop, tap Use my location. Or type the numbers from Google Maps.</p>
                <div className="geo-actions">
                  <button type="button" className="btn light" onClick={locateMe} disabled={geo.busy}>
                    {geo.busy ? "Finding your position..." : "Use my location"}
                  </button>
                  {(lat || lng) && <button type="button" className="btn small light" onClick={() => { setLat(""); setLng(""); setGeo({}); }}>Clear position</button>}
                </div>
                {geo.error && <div className="alert error" role="alert">{geo.error}</div>}
                {geo.note && <div className="alert ok" role="status">{geo.note}</div>}
                <div className="row2">
                  <div className="field">
                    <label htmlFor="latitude">Latitude</label>
                    <input id="latitude" name="latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="For example 5.6037" aria-invalid={!!fe.latitude} />
                    {fe.latitude && <span className="ferr">{fe.latitude}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="longitude">Longitude</label>
                    <input id="longitude" name="longitude" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="For example -0.1870" aria-invalid={!!fe.longitude} />
                    {fe.longitude && <span className="ferr">{fe.longitude}</span>}
                  </div>
                </div>
                {mapLink && <a className="small" href={mapLink} target="_blank" rel="noopener noreferrer">Check this position on Google Maps</a>}
              </section>
            </fieldset>
          </div>

          <div>
            <section className="panel">
              <h2>Brands carried</h2>
              {mode !== "view" && myBrands.length < allBrands.length && (
                <p className="small">You can tick or untick the brands you work on. Other brands are managed by their own teams.</p>
              )}
              <div className="brand-checks" role="group" aria-label="Brands carried">
                {allBrands.map((b) => (
                  <label key={b.id} className={mine.has(b.id) ? "" : "locked"}>
                    <input type="checkbox" name="brand_ids" value={b.id} defaultChecked={carried.includes(b.id)} disabled={!mine.has(b.id)} />
                    {b.name}
                  </label>
                ))}
              </div>
              {fe.brands && <span className="ferr">{fe.brands}</span>}
            </section>

            <fieldset disabled={detailsLocked}>
              <section className="panel">
                <h2>Staff notes</h2>
                <div className="field">
                  <label htmlFor="notes">Notes (staff only, never on the websites)</label>
                  <textarea id="notes" name="notes" rows={4} maxLength={2000} defaultValue={notes} aria-invalid={!!fe.notes} />
                  {fe.notes && <span className="ferr">{fe.notes}</span>}
                </div>
              </section>
            </fieldset>
          </div>
        </div>
      </fieldset>

      {mode !== "view" && (
        <div className="form-actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Saving..." : isNew ? "Add stockist" : mode === "brands" ? "Save my brands" : "Save changes"}
          </button>
        </div>
      )}
    </form>
  );
}
