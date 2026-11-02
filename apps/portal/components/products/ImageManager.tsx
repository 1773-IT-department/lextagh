"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_IMAGES_BUCKET } from "@lexta/db";
import {
  addLinkedImage, addUploadedImage, moveImage, removeImage, setPrimaryImage, updateImageAlt, type ActionResult,
} from "@/app/(app)/systems/products/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type ImageItem = { id: string; url: string; alt_text: string; is_primary: boolean; is_upload: boolean };

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  return `${Date.now()}-${base}${ext ? `.${ext}` : ""}`;
}

export default function ImageManager({
  productId, brandSlug, images, canEdit,
}: { productId: string; brandSlug: string; images: ImageItem[]; canEdit: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [link, setLink] = useState("");

  function run(task: () => Promise<ActionResult>, done?: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await task();
      if (result.error) setError(result.error);
      else {
        if (done) setNotice(done);
        router.refresh();
      }
    });
  }

  function add() {
    if (!alt.trim()) return setError("Write alt text first: a short description of what the image shows.");
    if (mode === "link") {
      return run(async () => {
        const r = await addLinkedImage(productId, link, alt);
        if (!r.error) { setAlt(""); setLink(""); }
        return r;
      }, "Image added.");
    }
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose an image file to upload.");
    if (!TYPES.includes(file.type)) return setError("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > MAX_BYTES) return setError("The image is larger than 5 MB. Please use a smaller file.");
    run(async () => {
      const path = `${brandSlug}/${productId}/${safeFileName(file.name)}`;
      const supabase = createBrowserSupabase();
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError) return { error: "The upload did not go through. Check your connection and permission, then try again." };
      const r = await addUploadedImage(productId, path, alt);
      if (!r.error) {
        setAlt("");
        if (fileRef.current) fileRef.current.value = "";
      }
      return r;
    }, "Image uploaded.");
  }

  return (
    <section className="panel" aria-busy={busy}>
      <h2>Images</h2>
      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert ok" role="status">{notice}</div>}

      {images.length === 0 ? (
        <p className="small">No images yet.{canEdit ? " Add the main pack shot first." : ""}</p>
      ) : (
        <ul className="images">
          {images.map((img, i) => (
            <li key={img.id} className={img.is_primary ? "primary" : undefined}>
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt_text} loading="lazy" />
                {img.is_primary && <span className="badge on">Main image</span>}
              </div>
              <AltEditor
                key={`${img.id}-${img.alt_text}`}
                initial={img.alt_text}
                disabled={!canEdit || busy}
                onSave={(value) => run(() => updateImageAlt(productId, img.id, value), "Alt text saved.")}
              />
              <span className="hint">{img.is_upload ? "Uploaded file" : "Linked image"}</span>
              {canEdit && (
                <div className="img-actions">
                  {!img.is_primary && <button type="button" className="btn small light" disabled={busy} onClick={() => run(() => setPrimaryImage(productId, img.id))}>Make main</button>}
                  <button type="button" className="btn small light" disabled={busy || i === 0} onClick={() => run(() => moveImage(productId, img.id, "up"))} aria-label={`Move image ${i + 1} earlier`}>Earlier</button>
                  <button type="button" className="btn small light" disabled={busy || i === images.length - 1} onClick={() => run(() => moveImage(productId, img.id, "down"))} aria-label={`Move image ${i + 1} later`}>Later</button>
                  <button
                    type="button"
                    className="btn small danger"
                    disabled={busy}
                    onClick={() => { if (window.confirm("Remove this image from the product?")) run(() => removeImage(productId, img.id), "Image removed."); }}
                  >Remove</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="add-image">
          <h3>Add an image</h3>
          <div className="seg" role="group" aria-label="How to add the image">
            <button type="button" aria-pressed={mode === "upload"} onClick={() => setMode("upload")}>Upload a file</button>
            <button type="button" aria-pressed={mode === "link"} onClick={() => setMode("link")}>Use a link</button>
          </div>
          {mode === "upload" ? (
            <div className="field">
              <label htmlFor="image-file">Image file</label>
              <input id="image-file" ref={fileRef} type="file" accept={TYPES.join(",")} disabled={busy} />
              <span className="hint">JPG, PNG, WebP or AVIF, up to 5 MB.</span>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="image-link">Image link</label>
              <input id="image-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" disabled={busy} />
            </div>
          )}
          <div className="field">
            <label htmlFor="image-alt">Alt text</label>
            <input id="image-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="For example Yazz Herbal toothpaste" disabled={busy} />
            <span className="hint">Required. Describe what the image shows for people using screen readers.</span>
          </div>
          <button type="button" className="btn" disabled={busy} onClick={add}>{busy ? "Working..." : "Add image"}</button>
        </div>
      )}
    </section>
  );
}

function AltEditor({ initial, disabled, onSave }: { initial: string; disabled: boolean; onSave: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  const changed = value.trim() !== initial;
  return (
    <div className="alt-edit">
      <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={300} disabled={disabled} aria-label="Alt text" />
      {changed && !disabled && <button type="button" className="btn small" onClick={() => onSave(value)}>Save</button>}
    </div>
  );
}
