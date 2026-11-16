"use client";

import { useEffect, useState } from "react";
import { chatSoundMuted, playChatSound, setChatSoundMuted } from "@lexta/chat/sound";
import { CHAT_DESKTOP_KEY, CHAT_UNREAD_EVENT } from "./ChatWatcher";

/** The unread chat count from ChatWatcher, for small badges. */
export function useChatUnread(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    try { setN(Number(window.sessionStorage.getItem(CHAT_UNREAD_EVENT) ?? 0) || 0); } catch { /* storage blocked */ }
    const on = (e: Event) => setN(Number((e as CustomEvent).detail) || 0);
    window.addEventListener(CHAT_UNREAD_EVENT, on);
    return () => window.removeEventListener(CHAT_UNREAD_EVENT, on);
  }, []);
  return n;
}

/** Red count next to "Live chat inbox" in the menu. */
export function ChatNavBadge() {
  const n = useChatUnread();
  if (n <= 0) return null;
  return <span className="nav-badge" aria-label={`${n} unread ${n === 1 ? "chat" : "chats"}`}>{n > 99 ? "99+" : n}</span>;
}

/**
 * Sound on or off, and desktop notifications, for this person on this device. Desktop notifications are only asked
 * for when the person presses the button, never by themselves.
 */
export default function ChatAlertControls() {
  const [muted, setMuted] = useState(false);
  const [desktop, setDesktop] = useState<"unsupported" | "off" | "on" | "blocked">("off");

  useEffect(() => {
    setMuted(chatSoundMuted());
    if (typeof Notification === "undefined") { setDesktop("unsupported"); return; }
    if (Notification.permission === "denied") { setDesktop("blocked"); return; }
    let on = false;
    try { on = window.localStorage.getItem(CHAT_DESKTOP_KEY) === "1"; } catch { /* storage blocked */ }
    setDesktop(on && Notification.permission === "granted" ? "on" : "off");
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setChatSoundMuted(next);
    if (!next) playChatSound("incoming", false);
  };

  const toggleDesktop = async () => {
    if (desktop === "on") {
      try { window.localStorage.removeItem(CHAT_DESKTOP_KEY); } catch { /* storage blocked */ }
      setDesktop("off");
      return;
    }
    const p = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (p === "granted") {
      try { window.localStorage.setItem(CHAT_DESKTOP_KEY, "1"); } catch { /* storage blocked */ }
      setDesktop("on");
    } else setDesktop(p === "denied" ? "blocked" : "off");
  };

  return (
    <div className="chat-alerts" role="group" aria-label="Chat alerts">
      <button type="button" className="btn small light" onClick={toggleSound} aria-pressed={!muted}>
        {muted ? "Sound off" : "Sound on"}
      </button>
      {desktop === "unsupported" ? null : desktop === "blocked" ? (
        <span className="small">Desktop alerts are blocked in this browser&apos;s settings.</span>
      ) : (
        <button type="button" className="btn small light" onClick={toggleDesktop} aria-pressed={desktop === "on"}>
          {desktop === "on" ? "Desktop alerts on" : "Turn on desktop alerts"}
        </button>
      )}
    </div>
  );
}
