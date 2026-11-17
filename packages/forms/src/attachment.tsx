"use client";

// The browser side of the optional complaint photo or document (packages/forms/src/complaint-file.ts has the server
// side). With JavaScript the file goes straight from the browser to Storage with a one time ticket, so a 5 MB file
// never passes through the site's own request limit; without JavaScript it simply travels in the form post.
import { useRef, useState } from "react";
import type { ComplaintUploadRequest, ComplaintUploadTicket } from "./complaint-file";
import {
  ATTACHMENT_FIELD, ATTACHMENT_MAX_BYTES, ATTACHMENT_MESSAGES, ATTACHMENT_NAME_FIELD, ATTACHMENT_PATH_FIELD,
} from "./attachment-text";

export { ATTACHMENT_ACCEPT, ATTACHMENT_FIELD, ATTACHMENT_NAME_FIELD, ATTACHMENT_PATH_FIELD } from "./attachment-text";

const ALLOWED = /\.(jpe?g|png|pdf)$/i;

const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...Array.from(bytes)));

/**
 * prepare(data) runs before the form is sent: when the topic is a problem report and a file is chosen, it asks the
 * server for a ticket (requestUpload, a server action), uploads the file, and swaps the file in the form data for its
 * path and name. A file already uploaded from this page is not sent twice. Returns null (and sets error) when the
 * file cannot go; the visitor can choose another file or remove it.
 */
export function useComplaintAttachment(
  requestUpload: (req: ComplaintUploadRequest) => Promise<ComplaintUploadTicket>,
  isProblem: (data: FormData) => boolean = (data) => data.get("topic") === "problem",
) {
  const [error, setError] = useState<string | null>(null);
  const done = useRef(new WeakMap<File, string>());

  const prepare = async (data: FormData): Promise<FormData | null> => {
    setError(null);
    const value = data.get(ATTACHMENT_FIELD);
    data.delete(ATTACHMENT_FIELD);
    const file = value && typeof value === "object" && (value as File).size > 0 ? (value as File) : null;
    if (!isProblem(data)) {
      data.delete(ATTACHMENT_PATH_FIELD);
      data.delete(ATTACHMENT_NAME_FIELD);
      return data;
    }
    if (!file) return data;
    if (!ALLOWED.test(file.name)) { setError(ATTACHMENT_MESSAGES.type); return null; }
    if (file.size > ATTACHMENT_MAX_BYTES) { setError(ATTACHMENT_MESSAGES.size); return null; }
    let path = done.current.get(file);
    if (!path) {
      try {
        const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
        const ticket = await requestUpload({ name: file.name, size: file.size, head: base64(head) });
        if (!ticket.ok) { setError(ticket.message); return null; }
        const res = await fetch(ticket.uploadUrl, {
          method: "POST",
          headers: {
            apikey: ticket.apiKey,
            authorization: `Bearer ${ticket.apiKey}`,
            "content-type": ticket.contentType,
            "x-upsert": "false",
            "cache-control": "max-age=3600",
          },
          body: file,
        });
        if (!res.ok) { setError(ATTACHMENT_MESSAGES.upload); return null; }
        path = ticket.path;
        done.current.set(file, path);
      } catch {
        setError(ATTACHMENT_MESSAGES.upload);
        return null;
      }
    }
    data.set(ATTACHMENT_PATH_FIELD, path);
    data.set(ATTACHMENT_NAME_FIELD, file.name.slice(0, 200));
    return data;
  };

  return { prepare, error, clearError: () => setError(null) };
}
