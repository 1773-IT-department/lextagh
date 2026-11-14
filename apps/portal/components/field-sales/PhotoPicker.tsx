"use client";

import { useRef } from "react";
import { FIELD_PHOTO_MAX_PER_VISIT } from "@lexta/db";
import { compressPhoto, newId, sizeLabel } from "./net";

export type PickedPhoto = {
  /** The photo's nonce: it becomes the photo id, so a retried upload never adds it twice. */
  id: string;
  blob: Blob;
  url: string;
  status: "waiting" | "uploading" | "done" | "failed";
  progress: number;
  error?: string;
};

type Props = {
  photos: PickedPhoto[];
  onAdd: (p: PickedPhoto[]) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  /** Photos the visit already has (on the visit page). */
  already?: number;
  onError: (msg: string) => void;
};

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", ""];

/** Take a photo with the camera or pick one from the phone. Photos are shrunk on the phone before they are sent. */
export default function PhotoPicker({ photos, onAdd, onRemove, disabled, already = 0, onError }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const room = FIELD_PHOTO_MAX_PER_VISIT - already - photos.length;

  async function take(files: FileList | null, input: HTMLInputElement | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, Math.max(0, room));
    if (files.length > list.length) onError(`A visit has at most ${FIELD_PHOTO_MAX_PER_VISIT} photos.`);
    const added: PickedPhoto[] = [];
    for (const f of list) {
      if (!TYPES.includes(f.type) && !f.type.startsWith("image/")) { onError("That file is not a photo. Use a JPG, PNG or WebP image."); continue; }
      const blob = await compressPhoto(f);
      added.push({ id: newId(), blob, url: URL.createObjectURL(blob), status: "waiting", progress: 0 });
    }
    if (input) input.value = "";
    if (added.length) onAdd(added);
  }

  return (
    <div className="fs-photos">
      <div className="fs-photo-buttons">
        <label className={`btn fs-big${disabled || room <= 0 ? " is-disabled" : ""}`}>
          <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" disabled={disabled || room <= 0}
            onChange={(e) => take(e.target.files, e.currentTarget)} aria-label="Take a photo" />
          Take a photo
        </label>
        <label className={`btn light fs-big${disabled || room <= 0 ? " is-disabled" : ""}`}>
          <input ref={gallery} type="file" accept="image/*" multiple className="sr-only" disabled={disabled || room <= 0}
            onChange={(e) => take(e.target.files, e.currentTarget)} aria-label="Choose photos from the phone" />
          Choose from phone
        </label>
      </div>
      {photos.length > 0 && (
        <ul className="fs-thumbs" aria-label="Photos">
          {photos.map((p, i) => (
            <li key={p.id} className={`fs-thumb s-${p.status}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} />
              <span className="fs-thumb-meta">
                {p.status === "uploading" ? `Uploading ${Math.round(p.progress * 100)}%`
                  : p.status === "done" ? "Uploaded" : p.status === "failed" ? "Not uploaded" : sizeLabel(p.blob.size)}
              </span>
              {onRemove && p.status !== "done" && p.status !== "uploading" && !disabled && (
                <button type="button" className="fs-thumb-remove" onClick={() => onRemove(p.id)} aria-label={`Remove photo ${i + 1}`}>&times;</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
