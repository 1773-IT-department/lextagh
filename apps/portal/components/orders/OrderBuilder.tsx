"use client";

import { useMemo, useState } from "react";
import { ORDER_MAX_QUANTITY } from "@lexta/db";
import { saveOrder } from "@/app/(app)/systems/orders/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

export type BuilderProduct = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  skus: { id: string; code: string; variant: string | null; pack: string }[];
};

type Props = {
  products: BuilderProduct[];
  regions: { id: string; name: string }[];
  /** Editing a draft: its id, quantities and details. */
  orderId?: string;
  reference?: string;
  initial?: { quantities: Record<string, number>; regionId: string; address: string; notes: string };
  /** Lines of the draft that can no longer be ordered (dropped when it is saved). */
  unavailable?: string[];
  pricePlaceholder: string;
};

const clamp = (n: number) => Math.max(0, Math.min(ORDER_MAX_QUANTITY, Math.floor(Number.isFinite(n) ? n : 0)));

function Stepper({ label, value, onChange, disabled }: { label: string; value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="stepper" role="group" aria-label={`Packs of ${label}`}>
      <button type="button" className="step-btn" onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= 0} aria-label={`One pack less of ${label}`}>
        <span aria-hidden="true">&minus;</span>
      </button>
      <input
        type="number" inputMode="numeric" min={0} max={ORDER_MAX_QUANTITY} step={1} value={value === 0 ? "" : value} placeholder="0"
        aria-label={`Packs of ${label}`} disabled={disabled}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
      />
      <button type="button" className="step-btn" onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= ORDER_MAX_QUANTITY} aria-label={`One pack more of ${label}`}>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

/** Pick quantities with steppers, then review, add delivery details and save as a draft or submit. */
export default function OrderBuilder({ products, regions, orderId, reference, initial, unavailable = [], pricePlaceholder }: Props) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveOrder);
  const [qty, setQty] = useState<Record<string, number>>(initial?.quantities ?? {});
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState(initial?.regionId ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const brands = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) seen.set(p.brandId, p.brandName);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [products]);
  const skuIndex = useMemo(() => {
    const m = new Map<string, { product: BuilderProduct; sku: BuilderProduct["skus"][number] }>();
    for (const p of products) for (const s of p.skus) m.set(s.id, { product: p, sku: s });
    return m;
  }, [products]);

  const chosen = Object.entries(qty).filter(([id, n]) => n > 0 && skuIndex.has(id));
  const packs = chosen.reduce((sum, [, n]) => sum + n, 0);
  const set = (id: string, n: number) => setQty((q) => ({ ...q, [id]: n }));
  const term = search.trim().toLowerCase();
  const shown = products.filter((p) => (!brand || p.brandId === brand)
    && (!term || p.name.toLowerCase().includes(term) || p.skus.some((s) => s.code.toLowerCase().includes(term))));
  const lines = JSON.stringify(chosen.map(([sku_id, quantity]) => ({ sku_id, quantity })));

  return (
    <form className="order-builder" noValidate onSubmit={onSubmit}>
      <input type="hidden" name="id" value={orderId ?? ""} />
      <input type="hidden" name="lines" value={lines} />
      <ol className="order-steps" aria-label="Steps">
        <li aria-current={step === "pick" ? "step" : undefined}><span>1</span> Choose products</li>
        <li aria-current={step === "review" ? "step" : undefined}><span>2</span> Review and send</li>
      </ol>
      {reference && <p className="small">Editing draft <span className="mono">{reference}</span></p>}
      <FormAlerts state={state} />
      {unavailable.length > 0 && (
        <div className="alert info" role="status">
          No longer available, so these will be removed when you save: {unavailable.join(", ")}.
        </div>
      )}

      <div hidden={step !== "pick"}>
        <div className="cat-tools">
          {brands.length > 1 && (
            <div className="seg" role="group" aria-label="Brand">
              <button type="button" aria-pressed={brand === ""} onClick={() => setBrand("")}>All brands</button>
              {brands.map((b) => <button key={b.id} type="button" aria-pressed={brand === b.id} onClick={() => setBrand(b.id)}>{b.name}</button>)}
            </div>
          )}
          <div className="field">
            <label htmlFor="cat_search">Find a product</label>
            <input id="cat_search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or SKU code" />
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="tile empty"><b>No products match</b><span>Try another name or brand.</span></div>
        ) : (
          <ul className="cat-list">
            {shown.map((p) => (
              <li key={p.id} className="cat-item">
                <div className="cat-head">
                  <span className="pthumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">No image</span>}
                  </span>
                  <div>
                    <b>{p.name}</b>
                    <span className="hint">{p.brandName}{p.category ? `, ${p.category}` : ""}</span>
                  </div>
                </div>
                <ul className="sku-rows">
                  {p.skus.map((s) => {
                    const label = `${p.name}${s.variant ? ` ${s.variant}` : ""}, ${s.pack}`;
                    return (
                      <li key={s.id} className={qty[s.id] ? "on" : undefined}>
                        <div className="sku-text">
                          <span>{s.variant ?? "Standard"}</span>
                          <span className="hint">{s.pack} <span className="mono">{s.code}</span></span>
                        </div>
                        <Stepper label={label} value={qty[s.id] ?? 0} onChange={(n) => set(s.id, n)} disabled={pending} />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <div className="order-bar">
          <span aria-live="polite">{chosen.length === 0 ? "Nothing chosen yet" : `${chosen.length} ${chosen.length === 1 ? "product" : "products"}, ${packs} ${packs === 1 ? "pack" : "packs"}`}</span>
          <button type="button" className="btn" disabled={chosen.length === 0} onClick={() => { setStep("review"); window.scrollTo({ top: 0 }); }}>Review order</button>
        </div>
      </div>

      <div hidden={step !== "review"}>
        <section className="panel">
          <h2>Your order</h2>
          {chosen.length === 0 ? <p className="small">No products chosen. Go back and add some.</p> : (
            <ul className="review-lines">
              {chosen.map(([id, n]) => {
                const { product, sku } = skuIndex.get(id)!;
                const label = `${product.name}${sku.variant ? ` ${sku.variant}` : ""}, ${sku.pack}`;
                return (
                  <li key={id}>
                    <div className="sku-text">
                      <b>{product.name}{sku.variant ? `, ${sku.variant}` : ""}</b>
                      <span className="hint">{product.brandName}, {sku.pack} <span className="mono">{sku.code}</span></span>
                    </div>
                    <Stepper label={label} value={n} onChange={(v) => set(id, v)} disabled={pending} />
                  </li>
                );
              })}
            </ul>
          )}
          <p className="small review-total">{chosen.length} {chosen.length === 1 ? "product" : "products"}, {packs} {packs === 1 ? "pack" : "packs"} in all.</p>
          <p className="small placeholder-note">Prices are not shown in the portal. {pricePlaceholder}</p>
        </section>

        <section className="panel">
          <h2>Delivery</h2>
          <div className="field">
            <label htmlFor="delivery_region_id">Region</label>
            <select id="delivery_region_id" name="delivery_region_id" value={regionId} onChange={(e) => setRegionId(e.target.value)}
              aria-invalid={!!fe.delivery_region_id} disabled={pending}>
              <option value="">Choose a region</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {fe.delivery_region_id && <span className="ferr">{fe.delivery_region_id}</span>}
          </div>
          <div className="field">
            <label htmlFor="delivery_address">Delivery address</label>
            <textarea id="delivery_address" name="delivery_address" rows={2} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Warehouse, street and town" aria-invalid={!!fe.delivery_address} disabled={pending} />
            {fe.delivery_address && <span className="ferr">{fe.delivery_address}</span>}
          </div>
          <div className="field">
            <label htmlFor="distributor_notes">Notes for Lexta (optional)</label>
            <textarea id="distributor_notes" name="distributor_notes" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="For example: deliver before Friday, call on arrival" aria-invalid={!!fe.distributor_notes} disabled={pending} />
            {fe.distributor_notes && <span className="ferr">{fe.distributor_notes}</span>}
          </div>
        </section>

        <div className="order-actions">
          <button type="button" className="btn light" onClick={() => setStep("pick")} disabled={pending}>Back to products</button>
          <button type="submit" name="intent" value="draft" className="btn light" disabled={pending}>{pending ? "Saving..." : "Save as draft"}</button>
          <button type="submit" name="intent" value="submit" className="btn" disabled={pending || chosen.length === 0}>{pending ? "Sending..." : "Submit order"}</button>
        </div>
        <p className="small">You can cancel a submitted order until Lexta confirms it.</p>
      </div>
    </form>
  );
}
