"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";
import type { ChatBrandConfig } from "../config";
import s from "./launcher.module.css";

// The panel (form, thread, polling) is its own chunk, fetched only when a visitor shows interest (hover, focus or
// tap on the button), so the chat costs every page only this small button.
const loadPanel = () => import("./ChatPanel");
const ChatPanel = lazy(loadPanel);

/**
 * Floating "Chat with us" button on every page. Opens the live chat panel, which talks to the site's own /api/chat.
 * Colours come from the --chat-* custom properties (launcher.module.css and panel.module.css); without them it is
 * the Lexta site's teal.
 */
export default function ChatLauncher({ config }: { config: ChatBrandConfig }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Back to the button, so keyboard and screen reader users keep their place.
    requestAnimationFrame(() => button.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={s.launcher}
        aria-expanded={open}
        aria-controls="lx-chat-panel"
        aria-label={`Chat with the ${config.teamName}`}
        hidden={open}
        onPointerEnter={() => { void loadPanel(); }}
        onFocus={() => { void loadPanel(); }}
        onClick={() => { setMounted(true); setOpen(true); }}
      >
        <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A.5.5 0 0 1 4 15.5z" />
        </svg>
        <span className={s.label}>Chat with us</span>
      </button>
      {mounted && (
        <Suspense fallback={open ? <div className={s.loading} role="status">Opening chat...</div> : null}>
          <ChatPanel open={open} onClose={close} config={config} />
        </Suspense>
      )}
    </>
  );
}
