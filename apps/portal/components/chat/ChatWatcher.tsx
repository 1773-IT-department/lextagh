"use client";

import { useEffect, useRef } from "react";
import { chatSoundMuted, playChatSound, primeChatSound, setChatTitleAlert } from "@lexta/chat/sound";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Every few seconds while the tab is visible; less often in the background (browsers slow timers there anyway). */
const POLL_MS = 5000;
const BACKGROUND_POLL_MS = 15000;
/** The unread count the watcher last saw, for the menu badge and the inbox (see useChatUnread / ChatNavBadge). */
export const CHAT_UNREAD_EVENT = "lx-chat-unread";
export const CHAT_DESKTOP_KEY = "lx-chat-desktop";

type Row = { last_visitor_message_at: string | null; staff_read_at: string | null; status: string };

/**
 * Live chat alerts for staff who answer the chat, on every page of the Business System (mounted once in the
 * signed in layout for people who can see the inbox). It asks the database every few seconds for the conversations
 * this person can see (Row Level Security decides, as everywhere else) and works out:
 *   - unread chats: the visitor wrote after the team last read the chat (same rule as the inbox heading);
 *   - something new: the newest visitor message is newer than the last one it saw.
 * Something new plays a soft chime (unless muted), shows a desktop notification when this person turned them on
 * and is not looking at the inbox, and the inbox page refreshes itself (InboxPoller). The unread count goes to the
 * tab title and the menu badge. A staff member's own replies never chime: they do not change the visitor time.
 * Polling, not Realtime, for the same reasons as InboxPoller: one small query, the same RLS, nothing to set up.
 */
export default function ChatWatcher() {
  const newest = useRef<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    primeChatSound();
    let stop = false;
    let timer = 0;
    let supabase: ReturnType<typeof createBrowserSupabase> | null = null;
    try { supabase = createBrowserSupabase(); } catch { return; }

    const tick = async () => {
      if (stop) return;
      const { data, error } = await supabase!
        .from("chat_conversations")
        .select("last_visitor_message_at, staff_read_at, status")
        .not("last_visitor_message_at", "is", null)
        .order("last_visitor_message_at", { ascending: false })
        .limit(500);
      if (stop) return;
      if (!error && data) {
        const rows = data as Row[];
        const unread = rows.filter((r) => r.status !== "closed" && r.last_visitor_message_at && (!r.staff_read_at || r.last_visitor_message_at > r.staff_read_at)).length;
        const top = rows[0]?.last_visitor_message_at ?? null;
        if (!first.current && top && (!newest.current || top > newest.current)) {
          playChatSound("new", chatSoundMuted());
          notifyDesktop(unread);
        }
        first.current = false;
        if (top) newest.current = top;
        window.dispatchEvent(new CustomEvent(CHAT_UNREAD_EVENT, { detail: unread }));
        try { window.sessionStorage.setItem(CHAT_UNREAD_EVENT, String(unread)); } catch { /* storage blocked */ }
        setChatTitleAlert(unread, { flash: document.visibilityState === "hidden" });
      }
      if (!stop) timer = window.setTimeout(tick, document.visibilityState === "visible" ? POLL_MS : BACKGROUND_POLL_MS);
    };
    void tick();
    const onVisible = () => { if (document.visibilityState === "visible") { window.clearTimeout(timer); void tick(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stop = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); setChatTitleAlert(0); };
  }, []);

  return null;
}

/** A desktop notification, only when this person turned them on and is not already looking at the inbox. */
function notifyDesktop(unread: number) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (window.localStorage.getItem(CHAT_DESKTOP_KEY) !== "1") return;
    const onInbox = window.location.pathname.startsWith("/systems/chat");
    if (onInbox && document.visibilityState === "visible") return;
    const n = new Notification("New live chat message", {
      body: unread > 0 ? `${unread} unread ${unread === 1 ? "chat" : "chats"} in the Lexta live chat inbox.` : "A visitor wrote in the Lexta live chat.",
      tag: "lx-chat",
    });
    n.onclick = () => { window.focus(); window.location.href = "/systems/chat"; n.close(); };
  } catch {
    // Notifications not available here; the sound and the badge still work.
  }
}
