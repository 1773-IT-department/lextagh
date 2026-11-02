"use client";

import { useState } from "react";
import { COMPLAINT_CATEGORIES, COMPLAINT_CHANNELS, COMPLAINT_SEVERITIES, HIGH_FLOOR_CATEGORIES, type Complaint, type ComplaintCategory } from "@lexta/db";
import { saveComplaint } from "@/app/(app)/systems/complaints/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

type Option = { id: string; label: string };
export type ProductOption = Option & { brand_id: string };
export type SkuOption = Option & { product_id: string };

const KEEP = "keep";

/**
 * Log a complaint (phone call, walk in and so on) or edit its details. Status, owner and files have their own
 * controls. The case number, targets and dates are set by the database.
 */
export default function ComplaintForm({
  mode, complaint, brands, products, skus, stockists, organisations, owners, contact, hiddenProduct, hiddenSku, hiddenOrganisation,
}: {
  mode: "new" | "edit";
  complaint?: Complaint;
  brands: Option[];
  products: ProductOption[];
  skus: SkuOption[];
  stockists: Option[];
  organisations: Option[];
  /** Who a new complaint may belong to (new only). */
  owners?: Option[];
  /** The existing customer chosen on the new complaint page. */
  contact?: { id: string; label: string } | null;
  /** The linked product or pack size is not in this person's list: it is kept as it is. */
  hiddenProduct?: boolean;
  hiddenSku?: boolean;
  hiddenOrganisation?: boolean;
}) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveComplaint);
  const c = complaint;
  const [brand, setBrand] = useState(c?.brand_id ?? "");
  const originalProduct = hiddenProduct ? KEEP : c?.product_id ?? "";
  const [product, setProduct] = useState(originalProduct);
  const [category, setCategory] = useState<string>(c?.category ?? "");
  const brandProducts = products.filter((p) => p.brand_id === brand);
  const productSkus = skus.filter((s) => s.product_id === product);
  const highFloor = HIGH_FLOOR_CATEGORIES.includes(category as ComplaintCategory);

  return (
    <form className="pform crm-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      {c && <input type="hidden" name="id" value={c.id} />}
      <fieldset disabled={pending}>
        {mode === "new" && (
          <section className="panel">
            <h2>Customer</h2>
            {contact ? (
              <>
                <input type="hidden" name="contact_id" value={contact.id} />
                <p className="small"><b>{contact.label}</b> (from the CRM)</p>
              </>
            ) : (
              <>
                <p className="small">Find the customer above first. If they are not in the CRM yet, enter their details: we match them by email or phone, and add them when they are new.</p>
                <div className="field">
                  <label htmlFor="contact_name">Name</label>
                  <input id="contact_name" name="contact_name" maxLength={120} autoComplete="off" aria-invalid={!!fe.contact_name} />
                  {fe.contact_name && <span className="ferr">{fe.contact_name}</span>}
                </div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor="contact_phone">Phone</label>
                    <input id="contact_phone" name="contact_phone" type="tel" inputMode="tel" maxLength={24} autoComplete="off" aria-invalid={!!fe.contact_phone} />
                    {fe.contact_phone && <span className="ferr">{fe.contact_phone}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="contact_email">Email</label>
                    <input id="contact_email" name="contact_email" type="email" maxLength={254} autoComplete="off" aria-invalid={!!fe.contact_email} />
                    {fe.contact_email && <span className="ferr">{fe.contact_email}</span>}
                  </div>
                </div>
              </>
            )}
            {fe.contact_id && <span className="ferr">{fe.contact_id}</span>}
          </section>
        )}

        <section className="panel">
          <h2>The complaint</h2>
          <div className="row2">
            <div className="field">
              <label htmlFor="channel">How it came in</label>
              <select id="channel" name="channel" defaultValue={c?.channel ?? "phone"} aria-invalid={!!fe.channel}>
                {COMPLAINT_CHANNELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {fe.channel && <span className="ferr">{fe.channel}</span>}
            </div>
            <div className="field">
              <label htmlFor="category">What it is about</label>
              <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} aria-invalid={!!fe.category}>
                <option value="">Choose</option>
                {COMPLAINT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {fe.category && <span className="ferr">{fe.category}</span>}
            </div>
          </div>
          <div className="field">
            <label htmlFor="severity">Severity</label>
            <select id="severity" name="severity" defaultValue={c?.severity ?? "normal"} aria-invalid={!!fe.severity}>
              {COMPLAINT_SEVERITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="hint">
              {highFloor
                ? "A health or safety concern or a foreign object is always at least High."
                : "Sets the targets: Critical 4 hours to respond and 2 days to resolve, High 1 and 5 days, Normal 2 and 10 days, Low 3 and 15 days."}
            </span>
            {fe.severity && <span className="ferr">{fe.severity}</span>}
          </div>
          <div className="field">
            <label htmlFor="description">What the customer said</label>
            <textarea id="description" name="description" rows={5} maxLength={5000} defaultValue={c?.description ?? ""} aria-invalid={!!fe.description} />
            {fe.description && <span className="ferr">{fe.description}</span>}
          </div>
        </section>

        <section className="panel">
          <h2>Product and purchase</h2>
          <div className="field">
            <label htmlFor="brand_id">Brand</label>
            <select
              id="brand_id"
              name="brand_id"
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setProduct(""); }}
              aria-invalid={!!fe.brand_id}
            >
              <option value="">Choose</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            <span className="hint">Use Lexta Ghana for anything not about one brand.</span>
            {fe.brand_id && <span className="ferr">{fe.brand_id}</span>}
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="product_id">Product (optional)</label>
              <select id="product_id" name="product_id" value={product} onChange={(e) => setProduct(e.target.value)} aria-invalid={!!fe.product_id}>
                <option value="">Not known</option>
                {hiddenProduct && product === KEEP && <option value={KEEP}>Keep the current product</option>}
                {brandProducts.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              {fe.product_id && <span className="ferr">{fe.product_id}</span>}
            </div>
            <div className="field">
              <label htmlFor="sku_id">Pack size (optional)</label>
              <select
                key={product}
                id="sku_id"
                name="sku_id"
                defaultValue={product === originalProduct ? (hiddenSku ? KEEP : c?.sku_id ?? "") : ""}
                aria-invalid={!!fe.sku_id}
                disabled={!product}
              >
                <option value="">Not known</option>
                {hiddenSku && product === originalProduct && <option value={KEEP}>Keep the current pack size</option>}
                {productSkus.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {fe.sku_id && <span className="ferr">{fe.sku_id}</span>}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="batch_number">Batch or lot number</label>
              <input id="batch_number" name="batch_number" maxLength={60} defaultValue={c?.batch_number ?? ""} aria-invalid={!!fe.batch_number} />
              {fe.batch_number && <span className="ferr">{fe.batch_number}</span>}
            </div>
            <div className="field">
              <label htmlFor="purchase_date">Date bought</label>
              <input id="purchase_date" name="purchase_date" type="date" defaultValue={c?.purchase_date ?? ""} aria-invalid={!!fe.purchase_date} />
              {fe.purchase_date && <span className="ferr">{fe.purchase_date}</span>}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="stockist_id">Bought at (stockist)</label>
              <select id="stockist_id" name="stockist_id" defaultValue={c?.stockist_id ?? ""} aria-invalid={!!fe.stockist_id}>
                <option value="">Not in the list</option>
                {stockists.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {fe.stockist_id && <span className="ferr">{fe.stockist_id}</span>}
            </div>
            <div className="field">
              <label htmlFor="purchase_place">Or where, in their words</label>
              <input id="purchase_place" name="purchase_place" maxLength={200} defaultValue={c?.purchase_place ?? ""} aria-invalid={!!fe.purchase_place} />
              {fe.purchase_place && <span className="ferr">{fe.purchase_place}</span>}
            </div>
          </div>
          <div className="field">
            <label htmlFor="organisation_id">Organisation (optional)</label>
            <select id="organisation_id" name="organisation_id" defaultValue={hiddenOrganisation ? KEEP : c?.organisation_id ?? ""} aria-invalid={!!fe.organisation_id}>
              <option value="">None</option>
              {hiddenOrganisation && <option value={KEEP}>Keep the current organisation</option>}
              {organisations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <span className="hint">For a complaint from a shop, distributor or institution in the CRM.</span>
            {fe.organisation_id && <span className="ferr">{fe.organisation_id}</span>}
          </div>
        </section>

        {mode === "new" && owners && (
          <section className="panel">
            <h2>Owner</h2>
            <div className="field">
              <label htmlFor="owner_id">Who works this case</label>
              <select id="owner_id" name="owner_id" defaultValue="me" aria-invalid={!!fe.owner_id}>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              {fe.owner_id && <span className="ferr">{fe.owner_id}</span>}
            </div>
          </section>
        )}
      </fieldset>
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Saving..." : mode === "new" ? "Log complaint" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
