"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CSR_PHOTO_MAX_PER_ACTIVITY } from "@lexta/db";
import { deleteCsrPhoto } from "@/app/(app)/systems/csr/actions";
import { compressPhoto, newId, RequestError, sizeLabel, uploadPhotoTo, withRetry } from "@/components/field-sales/net";

type Picked = { id: string; blob: Blob; url: string; status: "waiting" | "uploading" | "done" | "failed"; progress: number };

const SIGN_IN = "/login?next=%2Fsystems%2Fcsr";

/**
 * Add photos to an activity: take one with the camera or choose from the phone or computer. Each photo is shrunk in the
 * browser, then sent on its own with retries; the server checks it is really an image before it is recorded.
 */
export function CsrPhotoAdder({ activityId, already }: { activityId: string; already: number }) {
  const router = useRouter();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  // Photos in this list are not in `already` yet (it is refreshed only once the list is cleared), uploaded ones included.
  const room = CSR_PHOTO_MAX_PER_ACTIVITY - already - photos.length;
  const set = (id: string, patch: Partial<Picked>) => setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function send(list: Picked[]) {
    setBusy(true);
    setError("");
    setEnded(false);
    let failed = 0;
    const refused: string[] = [];
    for (const p of list) {
      set(p.id, { status: "uploading", progress: 0 });
      try {
        await withRetry(() => uploadPhotoTo(`/systems/csr/${activityId}/photos`, p.id, p.blob, (x) => set(p.id, { progress: x })));
        set(p.id, { status: "done", progress: 1 });
      } catch (e) {
        failed += 1;
        set(p.id, { status: "failed" });
        if (e instanceof RequestError && e.auth) { setEnded(true); break; }
        // Refused for good (not a photo, too big, not allowed): drop it, trying again will not help.
        if (e instanceof RequestError && !e.retry) { setError(e.message); refused.push(p.id); }
      }
    }
    if (refused.length) setPhotos((all) => all.filter((x) => !refused.includes(x.id)));
    failed -= refused.length;
    setBusy(false);
    if (failed) setError((m) => m || "A photo did not upload. Check your connection and press Try again.");
    else if (!refused.length) { setPhotos([]); router.refresh(); }
    else { setPhotos((all) => all.filter((x) => x.status !== "done")); router.refresh(); }
  }

  async function take(files: FileList | null, input: HTMLInputElement | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, Math.max(0, room));
    if (files.length > list.length) setError(`An activity has at most ${CSR_PHOTO_MAX_PER_ACTIVITY} photos.`);
    const added: Picked[] = [];
    for (const f of list) {
      if (f.type && !f.type.startsWith("image/")) { setError("That file is not a photo. Use a JPG, PNG or WebP image."); continue; }
      const blob = await compressPhoto(f);
      added.push({ id: newId(), blob, url: URL.createObjectURL(blob), status: "waiting", progress: 0 });
    }
    if (input) input.value = "";
    if (added.length) { setPhotos((all) => [...all, ...added]); void send(added); }
  }

  const failed = photos.filter((p) => p.status === "failed");
  const off = busy || room <= 0;
  return (
    <div className="fs-photos">
      {ended && (
        <div className="alert error" role="alert">
          Your session has ended, please sign in again. <a href={SIGN_IN} target="_blank" rel="noopener">Sign in</a> (it opens in a
          new tab), then come back and press Try again.
        </div>
      )}
      {error && !ended && <div className="alert error" role="alert">{error}</div>}
      <div className="fs-photo-buttons">
        <label className={`btn${off ? " is-disabled" : ""}`}>
          <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" disabled={off}
            onChange={(e) => take(e.target.files, e.currentTarget)} aria-label="Take a photo" />
          Take a photo
        </label>
        <label className={`btn light${off ? " is-disabled" : ""}`}>
          <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple className="sr-only" disabled={off}
            onChange={(e) => take(e.target.files, e.currentTarget)} aria-label="Choose photos" />
          Choose photos
        </label>
      </div>
      {photos.length > 0 && (
        <ul className="fs-thumbs" aria-label="Photos being added">
          {photos.map((p, i) => (
            <li key={p.id} className={`fs-thumb s-${p.status}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`New photo ${i + 1}`} />
              <span className="fs-thumb-meta">
                {p.status === "uploading" ? `Uploading ${Math.round(p.progress * 100)}%`
                  : p.status === "done" ? "Uploaded" : p.status === "failed" ? "Not uploaded" : sizeLabel(p.blob.size)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {failed.length > 0 && !busy && <button type="button" className="btn light csr-retry" onClick={() => send(failed)}>Try again</button>}
    </div>
  );
}

/** Removes one photo (admin, or the person who added it). */
export function RemoveCsrPhoto({ activityId, photoId, n }: { activityId: string; photoId: string; n: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button type="button" className="btn small light" disabled={pending} onClick={() => {
        if (!window.confirm("Remove this photo? This cannot be undone.")) return;
        start(async () => {
          const r = await deleteCsrPhoto(activityId, photoId);
          if (r.error) setError(r.error); else router.refresh();
        });
      }}>{pending ? "Removing..." : `Remove photo ${n}`}</button>
      {error && <span className="ferr" role="alert">{error}</span>}
    </>
  );
}
