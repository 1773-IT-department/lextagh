"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { Product, ProductSku } from "@lexta/db";
import { saveProduct, type ProductFormState } from "@/app/(app)/systems/products/actions";

type BrandOption = { id: string; name: string };

type SkuRow = {
  key: string;
  id?: string;
  sku_code: string;
  variant_name: string;
  pack_size_label: string;
  unit_quantity: string;
  unit: string;
  barcode: string;
  is_active: boolean;
};

let counter = 0;
const newKey = () => `new-${Date.now()}-${counter++}`;

const blankSku = (): SkuRow => ({
  key: newKey(), sku_code: "", variant_name: "", pack_size_label: "", unit_quantity: "", unit: "", barcode: "", is_active: true,
});

const toRow = (s: ProductSku): SkuRow => ({
  key: s.id,
  id: s.id,
  sku_code: s.sku_code,
  variant_name: s.variant_name ?? "",
  pack_size_label: s.pack_size_label,
  unit_quantity: s.unit_quantity === null ? "" : String(s.unit_quantity),
  unit: s.unit ?? "",
  barcode: s.barcode ?? "",
  is_active: s.is_active,
});

const empty: ProductFormState = {};

export default function ProductForm({
  product,
  skus = [],
  brands,
  categories,
  canEdit,
}: {
  product?: Product;
  skus?: ProductSku[];
  brands: BrandOption[];
  categories: string[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(saveProduct, empty);
  const [rows, setRows] = useState<SkuRow[]>(() => (skus.length ? skus.map(toRow) : product ? [] : [blankSku()]));
  const isNew = !product;

  // After every save, show the SKUs exactly as stored, so new rows carry their ids into the next save.
  useEffect(() => {
    if (state.skus) setRows(state.skus.map(toRow));
  }, [state.skus]);
  const fe = state.fieldErrors ?? {};

  const update = (key: string, patch: Partial<SkuRow>) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const remove = (key: string) => setRows((r) => r.filter((row) => row.key !== key));

  const skuJson = JSON.stringify(rows.map(({ key: _key, ...row }) => row));

  return (
    <form
      className="pform"
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
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="skus" value={skuJson} />

      <fieldset disabled={!canEdit || pending}>
        <section className="panel">
          <h2>Details</h2>
          <div className="row2">
            <div className="field">
              <label htmlFor="brand_id">Brand</label>
              <select id="brand_id" name="brand_id" defaultValue={product?.brand_id ?? (brands.length === 1 ? brands[0].id : "")} disabled={!isNew} aria-invalid={!!fe.brand_id} required>
                <option value="" disabled>Choose a brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {fe.brand_id ? <span className="ferr">{fe.brand_id}</span> : !isNew && <span className="hint">The brand cannot be changed after the product is created.</span>}
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <input id="category" name="category" list="category-options" defaultValue={product?.category ?? ""} maxLength={80} placeholder="For example Baby care" />
              <datalist id="category-options">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="name">Product name</label>
              <input id="name" name="name" defaultValue={product?.name ?? ""} maxLength={160} aria-invalid={!!fe.name} required />
              {fe.name && <span className="ferr">{fe.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="slug">Web address</label>
              <input id="slug" name="slug" defaultValue={product?.slug ?? ""} maxLength={120} placeholder="Made from the name if left empty" aria-invalid={!!fe.slug} />
              {fe.slug ? <span className="ferr">{fe.slug}</span> : <span className="hint">Lowercase words joined by dashes, for example baby-wipes.</span>}
            </div>
          </div>
          <div className="field">
            <label htmlFor="short_description">Short description</label>
            <textarea id="short_description" name="short_description" rows={2} maxLength={400} defaultValue={product?.short_description ?? ""} />
            <span className="hint">One or two sentences for product cards.</span>
          </div>
          <div className="field">
            <label htmlFor="long_description">Full description</label>
            <textarea id="long_description" name="long_description" rows={5} maxLength={5000} defaultValue={product?.long_description ?? ""} />
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="sort_order">Display order</label>
              <input id="sort_order" name="sort_order" type="number" step={1} defaultValue={product?.sort_order ?? 0} aria-invalid={!!fe.sort_order} />
              {fe.sort_order ? <span className="ferr">{fe.sort_order}</span> : <span className="hint">Lower numbers show first on the brand page.</span>}
            </div>
            <div className="field check">
              <label><input type="checkbox" name="is_published" defaultChecked={product?.is_published ?? false} /> Show on the websites</label>
              <span className="hint">Unticked products stay as drafts that only staff can see.</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Approved information</h2>
          <p className="small">Only information Lexta has approved. The websites show it exactly as written here.</p>
          <div className="field">
            <label htmlFor="key_features">Key features</label>
            <textarea id="key_features" name="key_features" rows={4} defaultValue={(product?.key_features ?? []).join("\n")} />
            <span className="hint">One feature per line.</span>
          </div>
          <div className="field">
            <label htmlFor="usage_instructions">How to use</label>
            <textarea id="usage_instructions" name="usage_instructions" rows={3} maxLength={3000} defaultValue={product?.usage_instructions ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="ingredients">Ingredients or materials</label>
            <textarea id="ingredients" name="ingredients" rows={3} maxLength={3000} defaultValue={product?.ingredients ?? ""} />
          </div>
        </section>

        <section className="panel">
          <h2>SKUs and pack sizes</h2>
          {rows.length === 0 && <p className="small">No SKUs yet. Add one for each variant and pack size.</p>}
          <div className="skus">
            {rows.map((r, i) => (
              <fieldset key={r.key} className="sku">
                <legend>SKU {i + 1}{!r.is_active && " (hidden)"}</legend>
                <div className="field">
                  <label htmlFor={`sku-code-${r.key}`}>SKU code</label>
                  <input id={`sku-code-${r.key}`} value={r.sku_code} maxLength={64} onChange={(e) => update(r.key, { sku_code: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`sku-variant-${r.key}`}>Variant</label>
                  <input id={`sku-variant-${r.key}`} value={r.variant_name} maxLength={120} placeholder="For example Herbal" onChange={(e) => update(r.key, { variant_name: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`sku-pack-${r.key}`}>Pack size</label>
                  <input id={`sku-pack-${r.key}`} value={r.pack_size_label} maxLength={120} placeholder="For example 375g" onChange={(e) => update(r.key, { pack_size_label: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`sku-qty-${r.key}`}>Quantity</label>
                  <input id={`sku-qty-${r.key}`} value={r.unit_quantity} inputMode="decimal" onChange={(e) => update(r.key, { unit_quantity: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`sku-unit-${r.key}`}>Unit</label>
                  <input id={`sku-unit-${r.key}`} value={r.unit} maxLength={30} placeholder="g, ml, pieces" onChange={(e) => update(r.key, { unit: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`sku-barcode-${r.key}`}>Barcode</label>
                  <input id={`sku-barcode-${r.key}`} value={r.barcode} inputMode="numeric" maxLength={14} onChange={(e) => update(r.key, { barcode: e.target.value })} />
                </div>
                <div className="sku-actions">
                  <label><input type="checkbox" checked={r.is_active} onChange={(e) => update(r.key, { is_active: e.target.checked })} /> Active</label>
                  {canEdit && <button type="button" className="btn small light" onClick={() => remove(r.key)}>Remove</button>}
                </div>
              </fieldset>
            ))}
          </div>
          {canEdit && <button type="button" className="btn small light" onClick={() => setRows((r) => [...r, blankSku()])}>Add a SKU</button>}
        </section>
      </fieldset>

      {canEdit && (
        <div className="form-actions">
          <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : isNew ? "Create product" : "Save changes"}</button>
          {isNew && <span className="small">You can add images after the product is created.</span>}
        </div>
      )}
    </form>
  );
}
