"use client";

import { useEffect, useState } from "react";
import s from "./article.module.css";

type Props = { title: string; path: string; fallbackUrl: string; label?: string };

const icon = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/**
 * Share buttons: copy link plus plain share URLs for WhatsApp, Facebook, LinkedIn and X.
 * No third party scripts or trackers. The link shared is this page on whatever address it is served from
 * (preview or live), falling back to the configured site address before the page has loaded.
 */
export default function ShareRow({ title, path, fallbackUrl, label }: Props) {
  const [url, setUrl] = useState(fallbackUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setUrl(`${window.location.origin}${path}`); }, [path]);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, svg: (
      <svg {...icon}><path d="M3.6 20.4l1.2-3.9a8.4 8.4 0 1 1 3.1 3z" /><path d="M9.2 8.4c.2-.4.5-.5.8-.4l.7 1.5c.1.2 0 .4-.1.6l-.5.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.5c.2-.1.4-.2.6-.1l1.5.7c.1.3 0 .6-.4.8-.6.4-1.3.6-2 .4a7.3 7.3 0 0 1-4.6-4.6c-.2-.7 0-1.4.6-1.8z" /></svg>
    ) },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, svg: (
      <svg {...icon}><path d="M14.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a20 20 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H8.6v3h2.6V21" /></svg>
    ) },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, svg: (
      <svg {...icon}><path d="M6.5 10v8M6.5 6.3v.1M10.5 18v-8M10.5 13.5a3 3 0 0 1 6 0V18" /></svg>
    ) },
    { name: "X", href: `https://x.com/intent/post?url=${u}&text=${t}`, svg: (
      <svg {...icon}><path d="M5 4.5h4l10 15h-4z" /><path d="M18.5 4.5l-5.6 6.3M5.5 19.5l5.6-6.3" /></svg>
    ) },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className={s.share}>
      {label && <span className={s.shareLabel}>{label}</span>}
      <div className={s.shareButtons}>
        <button type="button" className={s.shareBtn} onClick={copy} aria-label="Copy link to this story" title="Copy link">
          <svg {...icon}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
        </button>
        {links.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={s.shareBtn} aria-label={`Share on ${l.name} (opens in a new tab)`} title={`Share on ${l.name}`}>
            {l.svg}
          </a>
        ))}
        <span role="status" aria-live="polite" className={copied ? s.copied : s.srOnly}>{copied ? "Link copied" : ""}</span>
      </div>
    </div>
  );
}
