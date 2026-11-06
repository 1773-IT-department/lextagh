"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FIELD_NOTES_MAX } from "@lexta/db";
import { deleteVisitPhoto, updateVisit } from "@/app/(app)/systems/field-sales/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";
import { RequestError, uploadPhoto, withRetry } from "./net";
import PhotoPicker, { type PickedPhoto } from "./PhotoPicker";

/** Change the outcome and notes of a visit. */
export function VisitEditForm({ id, outcomeId, notes, outcomes }: { id: string; outcomeId: string; notes: string; outcomes: { id: string; label: string }[] }) {
  const { state, pending, onSubmit, fe } = useCrmForm(updateVisit);
  return (
    <form onSubmit={onSubmit} noValidate className="fs-edit">
      <input type="hidden" name="id" value={id} />
      <FormAlerts state={state} />
      <fieldset className="fs-fieldset" disabled={pending}>
        <legend className="label-like">What happened?</legend>
        <div className="fs-outcomes">
          {outcomes.map((o) => (
            <label key={o.id} className="fs-outcome">
              <input type="radio" name="outcome_id" value={o.id} defaultChecked={o.id === outcomeId} />
              {o.label}
            </label>
          ))}
        </div>
        {fe.outcome_id && <span className="ferr">{fe.outcome_id}</span>}
        <div className="field fs-notes">
          <label htmlFor="edit_notes">Notes</label>
          <textarea id="edit_notes" name="notes" rows={4} maxLength={FIELD_NOTES_MAX} defaultValue={notes} aria-invalid={!!fe.notes} />
          {fe.notes && <span className="ferr">{fe.notes}</span>}
        </div>
      </fieldset>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
    </form>
  );
}

/** Add photos to a saved visit; each one is sent straight away, with retries. */
export function PhotoAdder({ visitId, already }: { visitId: string; already: number }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (id: string, patch: Partial<PickedPhoto>) => setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function send(list: PickedPhoto[]) {
    setBusy(true);
    setError("");
    let failed = 0;
    for (const p of list) {
      set(p.id, { status: "uploading", progress: 0 });
      try {
        await withRetry(() => uploadPhoto(visitId, p.id, p.blob, (x) => set(p.id, { progress: x })));
        set(p.id, { status: "done", progress: 1 });
      } catch (e) {
        failed += 1;
        set(p.id, { status: "failed", error: e instanceof RequestError ? e.message : "Not uploaded" });
        if (e instanceof RequestError && !e.retry) setError(e.message);
      }
    }
    setBusy(false);
    if (failed) setError((m) => m || "A photo did not upload. Check your connection and press Try again.");
    else { setPhotos([]); router.refresh(); }
  }

  const failed = photos.filter((p) => p.status === "failed");
  return (
    <div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <PhotoPicker photos={photos} already={already} disabled={busy} onError={setError}
        onAdd={(p) => { setPhotos((all) => [...all, ...p]); void send(p); }} />
      {failed.length > 0 && !busy && <button type="button" className="btn light" onClick={() => send(failed)}>Try again</button>}
    </div>
  );
}

/** Admin removes one photo. */
export function RemovePhoto({ visitId, photoId, n }: { visitId: string; photoId: string; n: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button type="button" className="btn small light" disabled={pending} onClick={() => {
        if (!window.confirm("Remove this photo? This cannot be undone.")) return;
        start(async () => {
          const r = await deleteVisitPhoto(visitId, photoId);
          if (r.error) setError(r.error); else router.refresh();
        });
      }}>{pending ? "Removing..." : `Remove photo ${n}`}</button>
      {error && <span className="ferr" role="alert">{error}</span>}
    </>
  );
}
