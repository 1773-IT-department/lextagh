import Link from "next/link";
import { notFound } from "next/navigation";
import { CSR_PHOTO_MAX_PER_ACTIVITY, CSR_PHOTOS_BUCKET, CSR_STATUS_LABELS, type CsrActivityPhoto, type CsrActivityRow } from "@lexta/db";
import { deleteActivity } from "@/app/(app)/systems/csr/actions";
import ActivityForm from "@/components/csr/ActivityForm";
import { CsrPhotoAdder, RemoveCsrPhoto } from "@/components/csr/CsrPhotos";
import ConfirmButton from "@/components/products/ConfirmButton";
import { formatDateTime, UUID } from "@/lib/crm";
import { brandName, canEditProgrammeActivity, formatCount, formatDay, getCsrAccess, NO_CSR_ACCESS } from "@/lib/csr";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "CSR activity | Lexta Business System" };

/** Signed photo links last this long; the page is rendered fresh on every visit. */
const LINK_SECONDS = 600;

export default async function CsrActivityPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const access = await getCsrAccess();
  if (!access.canView) return (<><h1>CSR activity</h1><p className="small">{NO_CSR_ACCESS}</p></>);
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [listRes, photosRes] = await Promise.all([
    supabase.rpc("csr_activity_list", { p_id: id, p_limit: 1, p_offset: 0 }),
    supabase.from("csr_activity_photos").select("id, activity_id, storage_path, mime_type, size_bytes, created_at, created_by")
      .eq("activity_id", id).order("created_at").order("id"),
  ]);
  const a = ((listRes.data ?? []) as CsrActivityRow[]).find((r) => r.id === id);
  if (!a) notFound();
  const photos = (photosRes.data ?? []) as CsrActivityPhoto[];
  // Short lived links made with the person's own session: the bucket's policies decide again.
  const signed = new Map<string, string>();
  await Promise.all(photos.map(async (p) => {
    const { data, error } = await supabase.storage.from(CSR_PHOTOS_BUCKET).createSignedUrl(p.storage_path, LINK_SECONDS);
    if (error) console.error("[csr] signed link failed", error);
    else if (data?.signedUrl) signed.set(p.storage_path, data.signedUrl);
  }));

  const editable = canEditProgrammeActivity(access, a.programme_id);
  const programme = access.programmes.find((p) => p.id === a.programme_id);
  const programmeOptions = access.programmes
    .filter((p) => access.writableProgrammeIds.has(p.id) || p.id === a.programme_id)
    .map((p) => ({ id: p.id, label: p.is_active ? p.name : `${p.name} (switched off)` }));
  const del = deleteActivity.bind(null, id);

  return (
    <>
      <p className="crumbs"><Link href="/systems/csr">CSR activities</Link></p>
      <div className="page-head">
        <div>
          <h1>{a.programme_name}</h1>
          <p className="small">{formatDay(a.activity_date)}, {a.place}{a.region_name ? `, ${a.region_name}` : ""}</p>
        </div>
        <span className={`badge ${a.status === "done" ? "on" : "off"}`}>{CSR_STATUS_LABELS[a.status]}</span>
      </div>
      {sp.created && <div className="alert ok" role="status">The activity is saved. Add photos below.</div>}
      {sp.error === "delete" && <div className="alert error" role="alert">The activity could not be deleted. Please try again.</div>}

      <div className="crm-detail">
        <div>
          <section className="panel">
            <h2>Activity</h2>
            <dl className="facts">
              <dt>Programme</dt><dd>{a.programme_name}{programme && brandName(access, programme.brand_id) && <span className="hint">{brandName(access, programme.brand_id)}</span>}</dd>
              <dt>Date</dt><dd>{formatDay(a.activity_date)}</dd>
              <dt>Status</dt><dd>{CSR_STATUS_LABELS[a.status]}</dd>
              <dt>Where</dt><dd>{a.place}<span className="hint">{a.region_name ?? "The region has since been removed."}</span></dd>
              <dt>People reached</dt><dd>{formatCount(a.people_reached)}{a.status === "planned" && <span className="hint">Expected. Counted in the totals once marked done.</span>}</dd>
              <dt>Partners</dt><dd>{a.partners || "None"}</dd>
              <dt>Logged</dt><dd>{formatDateTime(a.created_at)}{a.created_by_name ? `, by ${a.created_by_name}` : ""}</dd>
              {a.updated_at !== a.created_at && <><dt>Last change</dt><dd>{formatDateTime(a.updated_at)}{a.updated_by_name ? `, by ${a.updated_by_name}` : ""}</dd></>}
            </dl>
            {a.notes && <p className="pre">{a.notes}</p>}
          </section>

          <section className="panel">
            <h2>Photos</h2>
            {photosRes.error ? <div className="alert error" role="alert">We could not load the photos. Please refresh the page.</div>
              : photos.length === 0 ? <p className="small">No photos yet.</p> : (
              <ul className="fs-gallery">
                {photos.map((p, i) => {
                  const url = signed.get(p.storage_path);
                  return (
                    <li key={p.id}>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Photo ${i + 1} of ${a.programme_name} at ${a.place}`} loading="lazy" />
                        </a>
                      ) : <span className="small">Photo {i + 1} could not be opened.</span>}
                      {(access.isAdmin || (editable && p.created_by === access.userId)) && <RemoveCsrPhoto activityId={id} photoId={p.id} n={i + 1} />}
                    </li>
                  );
                })}
              </ul>
            )}
            {editable && photos.length < CSR_PHOTO_MAX_PER_ACTIVITY && (
              <div className="fs-add-photos">
                <p className="small">JPG, PNG or WebP, up to {CSR_PHOTO_MAX_PER_ACTIVITY} photos an activity. Large photos are made smaller before they are sent.</p>
                <CsrPhotoAdder activityId={id} already={photos.length} />
              </div>
            )}
          </section>
        </div>

        <div>
          {editable && (
            <section className="panel">
              <h2>Change this activity</h2>
              <ActivityForm
                values={{
                  id: a.id, programme_id: a.programme_id, activity_date: a.activity_date, status: a.status, region_id: a.region_id ?? "",
                  place: a.place, people_reached: a.people_reached, partners: a.partners ?? "", notes: a.notes ?? "",
                }}
                programmes={programmeOptions}
                regions={access.regions.map((r) => ({ id: r.id, label: r.name }))}
              />
            </section>
          )}

          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete activity</h2>
              <p className="small">Deletes the activity and its photos. It no longer counts in the totals.</p>
              <form action={del}>
                <ConfirmButton className="btn danger" message="Delete this activity and its photos? This cannot be undone.">Delete activity</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
