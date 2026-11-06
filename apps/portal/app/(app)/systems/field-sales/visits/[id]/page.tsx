import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FIELD_EDIT_HOURS, FIELD_PHOTO_MAX_PER_VISIT, formatDistance, LOCATION_LABELS, mapLink,
  type FieldStockCheck, type FieldVisitPhoto, type FieldVisitRow,
} from "@lexta/db";
import { deleteVisit } from "@/app/(app)/systems/field-sales/actions";
import { PhotoAdder, RemovePhoto, VisitEditForm } from "@/components/field-sales/VisitForms";
import ConfirmButton from "@/components/products/ConfirmButton";
import { formatDateTime, UUID } from "@/lib/crm";
import { brandNames, getFieldAccess, NO_FIELD_ACCESS } from "@/lib/field-sales";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Visit | Lexta Business System" };

export default async function VisitPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const access = await getFieldAccess();
  if (!access.canView) return (<><h1>Visit</h1><p className="small">{NO_FIELD_ACCESS}</p></>);
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [visitRes, listRes, stockRes, photosRes] = await Promise.all([
    supabase.from("field_visits").select("id, outcome_id, notes, created_at, rep_id, crm_activity_id").eq("id", id).maybeSingle(),
    // The list row has the names, counts and distance.
    supabase.rpc("field_visit_list", { p_id: id, p_limit: 1, p_offset: 0 }),
    supabase.from("field_visit_stock_checks").select("id, visit_id, sku_id, brand_id, product_name_snapshot, sku_code_snapshot, variant_snapshot, pack_size_snapshot, on_shelf, facings")
      .eq("visit_id", id).order("product_name_snapshot").order("sku_code_snapshot"),
    supabase.from("field_visit_photos").select("id, visit_id, storage_path, mime_type, size_bytes, created_at, created_by").eq("visit_id", id).order("created_at").order("id"),
  ]);
  const visit = visitRes.data as { id: string; outcome_id: string; notes: string | null; created_at: string; rep_id: string | null; crm_activity_id: string | null } | null;
  if (!visit) notFound();
  const row = ((listRes.data ?? []) as FieldVisitRow[]).find((r) => r.id === id);
  if (!row) notFound();
  const stock = (stockRes.data ?? []) as FieldStockCheck[];
  const photos = (photosRes.data ?? []) as FieldVisitPhoto[];
  const editable = access.isAdmin
    || (visit.rep_id === access.userId && Date.now() - new Date(visit.created_at).getTime() < FIELD_EDIT_HOURS * 3600 * 1000);
  const hasPoint = row.latitude !== null && row.longitude !== null;
  const outcomes = access.outcomes.filter((o) => o.is_active || o.id === visit.outcome_id).map((o) => ({ id: o.id, label: o.label }));
  const del = deleteVisit.bind(null, id);

  return (
    <>
      <p className="crumbs"><Link href="/systems/field-sales">Field sales</Link></p>
      <div className="page-head">
        <div>
          <h1>{row.shop_name}</h1>
          <p className="small">{formatDateTime(row.visited_at)}, by {row.rep_name ?? "a former team member"}</p>
        </div>
        <span className="badge fs-outcome-badge">{row.outcome_label}</span>
      </div>
      {sp.error === "delete" && <div className="alert error" role="alert">The visit could not be deleted. Please try again.</div>}
      {row.new_shop && (
        <div className={`alert ${row.shop_is_active ? "ok" : "info"}`} role="status">
          {row.shop_is_active ? "The rep added this shop during the visit; staff have confirmed it." : "The rep added this shop during the visit. It is not on Where to Buy until staff check it and activate it in Stockists."}
          {row.stockist_id && access.seesAll && <> <Link href={`/systems/stockists/${row.stockist_id}`}>Open the shop in Stockists</Link></>}
        </div>
      )}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <h2>Visit</h2>
            <dl className="facts">
              <dt>Shop</dt><dd>{row.shop_name}{row.stockist_id === null && <span className="hint">The shop has since been removed from Stockists.</span>}</dd>
              <dt>Where</dt><dd>{[row.town, row.region_name].filter(Boolean).join(", ") || "Not known"}</dd>
              <dt>Brands</dt><dd>{brandNames(access, row.brand_ids) || "None"}</dd>
              <dt>Outcome</dt><dd>{row.outcome_label}</dd>
              <dt>Rep</dt><dd>{row.rep_name ?? "Former team member"}</dd>
              <dt>When</dt><dd>{formatDateTime(row.visited_at)}</dd>
              <dt>CRM</dt><dd>{row.crm_logged ? "Logged on the organisation's CRM timeline" : "Not on the CRM"}</dd>
            </dl>
            {row.notes && <p className="pre">{row.notes}</p>}
          </section>

          <section className="panel">
            <h2>Location</h2>
            {row.location_status === "captured" && hasPoint ? (
              <>
                <p className="small fs-loc">
                  {Number(row.latitude).toFixed(6)}, {Number(row.longitude).toFixed(6)}, accurate to about {row.accuracy_m} m.
                  {row.distance_from_shop_m !== null && <> The phone was {formatDistance(row.distance_from_shop_m)} from the shop&apos;s map position.</>}
                </p>
                <a className="btn light" href={mapLink(row.latitude!, row.longitude!)} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap</a>
              </>
            ) : (
              <p><span className="badge off">{LOCATION_LABELS[row.location_status]}</span></p>
            )}
          </section>

          <section className="panel">
            <h2>Stock check</h2>
            {stock.length === 0 ? <p className="small">No stock check on this visit.</p> : (
              <ul className="mini-list">
                {stock.map((s) => (
                  <li key={s.id}>
                    <span><b>{s.product_name_snapshot}{s.variant_snapshot ? `, ${s.variant_snapshot}` : ""}</b> <span className="hint">{s.pack_size_snapshot} <span className="mono">{s.sku_code_snapshot}</span></span></span>
                    <span className={`badge ${s.on_shelf ? "on" : "off"}`}>{s.on_shelf ? `On shelf${s.facings !== null ? `, ${s.facings} ${s.facings === 1 ? "facing" : "facings"}` : ""}` : "Not on shelf"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <section className="panel">
            <h2>Photos</h2>
            {photos.length === 0 ? <p className="small">No photos.</p> : (
              <ul className="fs-gallery">
                {photos.map((p, i) => (
                  <li key={p.id}>
                    <a href={`/systems/field-sales/visits/${id}/photos/${p.id}`} target="_blank" rel="noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/systems/field-sales/visits/${id}/photos/${p.id}`} alt={`Visit photo ${i + 1} at ${row.shop_name}`} loading="lazy" />
                    </a>
                    {access.isAdmin && <RemovePhoto visitId={id} photoId={p.id} n={i + 1} />}
                  </li>
                ))}
              </ul>
            )}
            {editable && photos.length < FIELD_PHOTO_MAX_PER_VISIT && (
              <div className="fs-add-photos"><PhotoAdder visitId={id} already={photos.length} /></div>
            )}
          </section>

          {editable ? (
            <section className="panel">
              <h2>Change this visit</h2>
              {!access.isAdmin && <p className="small">You can change your visit for {FIELD_EDIT_HOURS} hours after you made it.</p>}
              <VisitEditForm id={id} outcomeId={visit.outcome_id} notes={visit.notes ?? ""} outcomes={outcomes} />
            </section>
          ) : visit.rep_id === access.userId ? (
            <p className="small">This visit is more than {FIELD_EDIT_HOURS} hours old, so it can no longer be changed.</p>
          ) : null}

          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete visit</h2>
              <p className="small">Deletes the visit, its stock check and photos. The CRM activity and any new shop stay.</p>
              <form action={del}>
                <ConfirmButton className="btn danger" message="Delete this visit and its photos? This cannot be undone.">Delete visit</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
