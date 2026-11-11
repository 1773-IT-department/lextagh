"use client";

import { FIELD_PHOTO_MAX_BYTES } from "@lexta/db";

/** A random id made on the phone (a nonce): it becomes the visit or photo id, so a retry never saves twice. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** An answer the server gave on purpose (do not retry), or a network or server problem (retry). */
export class RequestError extends Error {
  /** auth: the session has ended; the person must sign in again (never retried). */
  constructor(message: string, readonly retry: boolean, readonly field?: string, readonly auth = false) { super(message); }
}

export const SESSION_ENDED = "Your session has ended, please sign in again.";

const NETWORK = "No connection, or the connection is too slow. We will keep trying.";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Waits between attempts: 1, 2, 4 and 8 seconds. */
export const RETRY_DELAYS = [1000, 2000, 4000, 8000];

/** Runs one attempt again after a network or server problem, up to five tries in all. onRetry hears each wait. */
export async function withRetry<T>(attempt: () => Promise<T>, onRetry?: (n: number, err: RequestError) => void): Promise<T> {
  for (let n = 0; ; n += 1) {
    try {
      return await attempt();
    } catch (e) {
      const err = e instanceof RequestError ? e : new RequestError(NETWORK, true);
      if (!err.retry || n >= RETRY_DELAYS.length) throw err;
      onRetry?.(n + 1, err);
      await sleep(RETRY_DELAYS[n]);
    }
  }
}

async function readError(status: number, text: string): Promise<RequestError> {
  if (status === 401) return new RequestError(SESSION_ENDED, false, undefined, true);
  let msg = "";
  let field: string | undefined;
  let told: boolean | undefined;
  try {
    const j = JSON.parse(text) as { error?: string; field?: string; retry?: boolean };
    msg = j.error ?? "";
    field = j.field;
    told = typeof j.retry === "boolean" ? j.retry : undefined;
  } catch { /* not JSON */ }
  const retry = told ?? (status >= 500 || status === 408 || status === 429);
  return new RequestError(msg || (retry ? "The server did not answer properly. We will keep trying." : "This could not be saved."), retry, field);
}

/** POST JSON once, with a time limit. Throws RequestError. */
export async function postJson<T>(url: string, body: unknown, timeoutMs = 30000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal, credentials: "same-origin" });
  } catch {
    throw new RequestError(NETWORK, true);
  } finally {
    clearTimeout(timer);
  }
  if (res.redirected && new URL(res.url).pathname === "/login") throw new RequestError(SESSION_ENDED, false, undefined, true);
  const text = await res.text().catch(() => "");
  if (!res.ok) throw await readError(res.status, text);
  try { return JSON.parse(text) as T; } catch { throw new RequestError("The server did not answer properly. We will keep trying.", true); }
}

/** GET JSON once, with a time limit. Throws RequestError. */
export async function getJson<T>(url: string, timeoutMs = 20000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { signal: ctl.signal, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new RequestError(NETWORK, true);
  } finally {
    clearTimeout(timer);
  }
  if (res.redirected && new URL(res.url).pathname === "/login") throw new RequestError(SESSION_ENDED, false, undefined, true);
  const text = await res.text().catch(() => "");
  if (!res.ok) throw await readError(res.status, text);
  try { return JSON.parse(text) as T; } catch { throw new RequestError("The server did not answer properly. We will keep trying.", true); }
}

/** Uploads one photo once, reporting progress from 0 to 1. Throws RequestError. */
export function uploadPhoto(visitId: string, photoId: string, blob: Blob, onProgress: (p: number) => void, timeoutMs = 120000): Promise<void> {
  return uploadPhotoTo(`/systems/field-sales/visits/${visitId}/photos`, photoId, blob, onProgress, timeoutMs);
}

/** Uploads one photo once to a photo route (field sales visits, CSR activities). Throws RequestError. */
export function uploadPhotoTo(url: string, photoId: string, blob: Blob, onProgress: (p: number) => void, timeoutMs = 120000): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = timeoutMs;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) { onProgress(1); resolve(); return; }
      reject(await readError(xhr.status, xhr.responseText));
    };
    xhr.onerror = () => reject(new RequestError(NETWORK, true));
    xhr.ontimeout = () => reject(new RequestError(NETWORK, true));
    const fd = new FormData();
    fd.append("photo_id", photoId);
    fd.append("file", blob, `photo.${blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"}`);
    xhr.send(fd);
  });
}

/** Longest side of a photo after shrinking on the phone. Plenty to read a shelf, and usually under 500 KB. */
const MAX_SIDE = 1600;

/**
 * Shrinks a photo on the phone before it is sent: at most 1600 px on its longest side, as JPEG. Keeps the original
 * when the browser cannot read it (the server still checks it) or when the original is already smaller.
 */
export async function compressPhoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    if (!blob) return file;
    return blob.size < file.size || file.size > FIELD_PHOTO_MAX_BYTES ? blob : file;
  } catch {
    return file;
  }
}

export const sizeLabel = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/** The sign in link shown when the session has ended. It opens in a new tab, so nothing typed here is lost. */
export const SIGN_IN_URL = "/login?next=%2Fsystems%2Ffield-sales";
