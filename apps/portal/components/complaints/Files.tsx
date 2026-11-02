"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COMPLAINT_FILE_MAX_BYTES, COMPLAINT_FILE_TYPES, COMPLAINT_FILES_BUCKET } from "@lexta/db";
import { addComplaintFile, deleteComplaintFile, type FileResult } from "@/app/(app)/systems/complaints/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type FileItem = { id: string; file_name: string; mime_type: string; size_bytes: number; added: string };

function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  return `${Date.now()}-${base}${ext ? `.${ext}` : ""}`;
}

const sizeLabel = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * Photos and documents for a complaint, in the private complaint-files bucket. Downloads go through a short lived
 * signed link made on the server for people who can see the complaint. Admin and customer care upload; admin removes.
 */
export default function Files({ complaintId, files, canUpload, canRemove }: {
  complaintId: string;
  files: FileItem[];
  canUpload: boolean;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function run(task: () => Promise<FileResult>, done: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await task();
      if (result.error) setError(result.error);
      else {
        setNotice(done);
        router.refresh();
      }
    });
  }

  function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a photo or PDF to upload.");
    if (!(COMPLAINT_FILE_TYPES as readonly string[]).includes(file.type)) return setError("Use a photo (JPG, PNG, WebP, HEIC) or a PDF.");
    if (file.size > COMPLAINT_FILE_MAX_BYTES) return setError("The file is larger than 10 MB. Please use a smaller file.");
    run(async () => {
      const path = `${complaintId}/${safeFileName(file.name)}`;
      const supabase = createBrowserSupabase();
      const { error: uploadError } = await supabase.storage
        .from(COMPLAINT_FILES_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) return { error: "The upload did not go through. Check your connection and permission, then try again." };
      const r = await addComplaintFile(complaintId, path, file.name, file.type, file.size);
      if (!r.error && fileRef.current) fileRef.current.value = "";
      return r;
    }, "File added.");
  }

  return (
    <section className="panel" aria-busy={busy}>
      <h2>Files</h2>
      {error && <div className="alert error" role="alert">{error}</div>}
      {notice && <div className="alert ok" role="status">{notice}</div>}
      {files.length === 0 ? (
        <p className="small">No files yet.{canUpload ? " Add photos of the product, the batch code or the receipt." : ""}</p>
      ) : (
        <ul className="mini-list">
          {files.map((f) => (
            <li key={f.id}>
              <a href={`/systems/complaints/${complaintId}/files/${f.id}`} target="_blank" rel="noopener noreferrer">{f.file_name}</a>
              <span className="small">{f.mime_type === "application/pdf" ? "PDF" : "Photo"}, {sizeLabel(f.size_bytes)}, {f.added}</span>
              {canRemove && (
                <button
                  type="button"
                  className="btn small danger"
                  disabled={busy}
                  onClick={() => { if (window.confirm(`Remove ${f.file_name} for good?`)) run(() => deleteComplaintFile(complaintId, f.id), "File removed."); }}
                >Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canUpload && (
        <div className="add-image">
          <div className="field">
            <label htmlFor="complaint-file">Add a file</label>
            <input id="complaint-file" ref={fileRef} type="file" accept={COMPLAINT_FILE_TYPES.join(",")} disabled={busy} />
            <span className="hint">Photos (JPG, PNG, WebP, HEIC) or PDF, up to 10 MB. Only people who can see this complaint can open them.</span>
          </div>
          <button type="button" className="btn small" disabled={busy} onClick={upload}>{busy ? "Working..." : "Upload"}</button>
        </div>
      )}
    </section>
  );
}
