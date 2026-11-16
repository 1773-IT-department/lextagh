"use client";

import { useState } from "react";

/** Copy the install link, or send it on WhatsApp or SMS (the phone's own share sheet where there is one). */
export default function ShareActions({ url, message, title }: { url: string; message: string; title: string }) {
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied(""), 2500);
  };
  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title, text: message }); return; } catch { /* closed by the person: nothing to do */ return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  return (
    <>
      <div className="pwa-share-link">
        <input type="text" readOnly value={url} aria-label="Install link" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn small" onClick={() => { void copy(); }}>{copied === "ok" ? "Copied" : "Copy link"}</button>
      </div>
      <p className="small" aria-live="polite" style={{ margin: "0 0 8px", minHeight: 18 }}>
        {copied === "ok" ? "Link copied. Paste it into a message to your team." : copied === "fail" ? "Could not copy. Select the link and copy it by hand." : ""}
      </p>
      <div className="pwa-share-actions">
        <button type="button" className="btn small" onClick={() => { void share(); }}>Share</button>
        <a className="btn small light" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className="btn small light" href={`sms:?&body=${encodeURIComponent(message)}`}>SMS</a>
        <a className="btn small light" href={url} target="_blank" rel="noopener noreferrer">Open install page</a>
      </div>
    </>
  );
}
