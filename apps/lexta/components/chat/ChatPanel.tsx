"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CHAT_LIMITS, type ChatVisitorMessage } from "@lexta/db";
import { CHAT_AUTO_REPLY, CHAT_OUT_OF_HOURS, chatTeamAvailable } from "@/lib/chat/hours";
import s from "./panel.module.css";

// The live chat panel: a short start form, then the conversation. Everything goes through this site's own
// /api/chat route; the browser never holds a database key or the shared secret. The conversation id and its random
// token are kept in localStorage so the chat survives a reload (and simply starts fresh when storage is blocked).
// While the panel is open it asks for new messages every few seconds; when it is closed it does not ask at all.

const STORAGE_KEY = "lexta-chat-v1";
const POLL_MS = 4000;
const MAX_BACKOFF_MS = 30000;
const GENERIC = "Sorry, that did not go through. Please try again in a moment, or email marketing@lextagh.com.";

type Session = { id: string; token: string };
type Line = ChatVisitorMessage & { pending?: boolean };
type ApiError = { ok: false; code: string; message: string; fieldErrors?: Record<string, string> };

function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Session>;
    return typeof v.id === "string" && typeof v.token === "string" && /^[0-9a-f]{64}$/.test(v.token) ? { id: v.id, token: v.token } : null;
  } catch {
    return null;
  }
}
function saveSession(v: Session | null) {
  try {
    if (v) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode, settings): the chat still works until the page is reloaded.
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function api<T>(body: Record<string, unknown>): Promise<({ ok: true } & T) | ApiError> {
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = (await res.json()) as ({ ok: true } & T) | ApiError;
    return data && typeof data === "object" && "ok" in data ? data : { ok: false, code: "error", message: GENERIC };
  } catch {
    return { ok: false, code: "error", message: GENERIC };
  }
}

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ids = useId();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState<string>("open");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [ended, setEnded] = useState(false);
  const lastSeq = useRef(0);
  // The id of a start or message that has not gone through yet, with what it carried. Trying the same thing again
  // (after a timeout or a server error) reuses the id, so the database recognises the retry and never saves twice;
  // anything changed gets a new id.
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const idFor = (key: string) => {
    if (attempt.current?.key !== key) attempt.current = { key, id: newId() };
    return attempt.current.id;
  };
  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const logEnd = useRef<HTMLDivElement>(null);
  const available = chatTeamAvailable();

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  // Focus the first thing to do when the panel opens.
  useEffect(() => {
    if (!open || !ready) return;
    const t = window.setTimeout(() => (session ? composer.current : firstField.current)?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, ready, session]);

  const merge = useCallback((incoming: ChatVisitorMessage[]) => {
    if (!incoming.length) return;
    setLines((prev) => {
      const byId = new Map(prev.map((l) => [l.id, l]));
      // The first message shown while the chat was starting is now in the thread.
      byId.delete("first");
      for (const m of incoming) byId.set(m.id, m);
      return [...byId.values()].sort((a, b) => (a.pending ? 1 : 0) - (b.pending ? 1 : 0) || a.seq - b.seq);
    });
    lastSeq.current = Math.max(lastSeq.current, ...incoming.map((m) => m.seq));
  }, []);

  const forget = useCallback((message: string) => {
    saveSession(null);
    setSession(null);
    setLines([]);
    lastSeq.current = 0;
    setEnded(true);
    setError(message);
  }, []);

  // Poll for new messages while the panel is open and the tab is visible.
  useEffect(() => {
    if (!open || !session) return;
    let stop = false;
    let timer = 0;
    let wait = POLL_MS;
    const tick = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        const r = await api<{ reference: string; status: string; messages: ChatVisitorMessage[] }>({
          action: "read", conversationId: session.id, token: session.token, after: lastSeq.current,
        });
        if (stop) return;
        if (r.ok) {
          merge(r.messages);
          setStatus(r.status);
          wait = POLL_MS;
        } else if (r.code === "not_found") {
          forget(r.message);
          return;
        } else {
          wait = Math.min(wait * 2, MAX_BACKOFF_MS);
        }
      }
      timer = window.setTimeout(tick, wait);
    };
    void tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") { window.clearTimeout(timer); void tick(); }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stop = true; window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [open, session, merge, forget]);

  // Keep the newest message in view.
  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [lines.length, open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); }
  };

  async function start(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "");
    setBusy(true);
    setError("");
    setFieldErrors({});
    const fields = {
      action: "start", name: get("name"), email: get("email"), phone: get("phone"), message: get("message"),
      website: get("website"), page: window.location.pathname,
    };
    const id = idFor(JSON.stringify(fields));
    const r = await api<{ conversationId: string; token: string; reference: string }>({ ...fields, id });
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      setFieldErrors(r.fieldErrors ?? {});
      return;
    }
    attempt.current = null;
    const next = { id: r.conversationId, token: r.token };
    saveSession(next);
    setEnded(false);
    lastSeq.current = 0;
    setLines([{ id: "first", seq: 0, sender: "visitor", body: get("message").trim(), created_at: new Date().toISOString(), staff_name: null }]);
    setSession(next);
  }

  async function send(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!session || busy) return;
    const body = draft.trim();
    if (!body) return;
    if (body.length > CHAT_LIMITS.message) { setError(`Messages can be at most ${CHAT_LIMITS.message} characters.`); return; }
    const id = idFor(`send:${session.id}:${body}`);
    setBusy(true);
    setError("");
    setDraft("");
    setLines((prev) => [...prev, { id, seq: Number.MAX_SAFE_INTEGER, sender: "visitor", body, created_at: new Date().toISOString(), staff_name: null, pending: true }]);
    const r = await api<{ id: string; seq: number; createdAt: string }>({ action: "send", conversationId: session.id, token: session.token, id, body });
    setBusy(false);
    if (r.ok) {
      attempt.current = null;
      setStatus("open");
      setLines((prev) => prev.map((l) => (l.id === id ? { ...l, seq: r.seq, created_at: r.createdAt || l.created_at, pending: false } : l))
        .sort((a, b) => (a.pending ? 1 : 0) - (b.pending ? 1 : 0) || a.seq - b.seq));
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== id));
    if (r.code === "not_found") { forget(r.message); return; }
    setDraft(body);
    setError(r.message);
    composer.current?.focus();
  }

  function newChat() {
    saveSession(null);
    setSession(null);
    setLines([]);
    lastSeq.current = 0;
    setError("");
    setEnded(false);
    setStatus("open");
  }

  // The fixed line after the visitor's first message: the team will reply, or the out of hours note.
  const firstVisitor = lines.find((l) => l.sender === "visitor");
  const autoLine = firstVisitor ? (chatTeamAvailable(new Date(firstVisitor.created_at)) ? CHAT_AUTO_REPLY : CHAT_OUT_OF_HOURS) : "";
  const fe = fieldErrors;

  return (
    <div
      ref={panel}
      id="lx-chat-panel"
      className={s.panel}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${ids}-title`}
      hidden={!open}
      onKeyDown={onKeyDown}
    >
      <div className={s.head}>
        <div>
          <h2 id={`${ids}-title`} className={s.title}>Chat with Lexta</h2>
          <p className={s.sub}>{session ? "You are chatting with the Lexta team." : "A real person from our team will answer."}</p>
        </div>
        <div className={s.headActions}>
          {session && <button type="button" className={s.textButton} onClick={newChat}>New chat</button>}
          <button type="button" className={s.close} onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>

      {!ready ? null : !session ? (
        <form className={s.form} onSubmit={start} noValidate>
          {!available && <p className={s.note}>{CHAT_OUT_OF_HOURS}</p>}
          {ended && error ? <p className={s.note} role="status">{error}</p> : error && <p className={s.error} role="alert">{error}</p>}
          <div className={s.field}>
            <label htmlFor={`${ids}-name`}>Your name</label>
            <input ref={firstField} id={`${ids}-name`} name="name" autoComplete="name" required maxLength={CHAT_LIMITS.name}
              aria-invalid={!!fe.name} aria-describedby={fe.name ? `${ids}-name-err` : undefined} />
            {fe.name && <span id={`${ids}-name-err`} className={s.ferr}>{fe.name}</span>}
          </div>
          <div className={s.pair}>
            <div className={s.field}>
              <label htmlFor={`${ids}-email`}>Email <span className={s.opt}>(optional)</span></label>
              <input id={`${ids}-email`} name="email" type="email" autoComplete="email" maxLength={CHAT_LIMITS.email}
                aria-invalid={!!fe.email} aria-describedby={fe.email ? `${ids}-email-err` : `${ids}-reach`} />
              {fe.email && <span id={`${ids}-email-err`} className={s.ferr}>{fe.email}</span>}
            </div>
            <div className={s.field}>
              <label htmlFor={`${ids}-phone`}>Phone <span className={s.opt}>(optional)</span></label>
              <input id={`${ids}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={CHAT_LIMITS.phone}
                aria-invalid={!!fe.phone} aria-describedby={fe.phone ? `${ids}-phone-err` : `${ids}-reach`} />
              {fe.phone && <span id={`${ids}-phone-err`} className={s.ferr}>{fe.phone}</span>}
            </div>
          </div>
          <p id={`${ids}-reach`} className={s.hint}>An email or phone number lets us get back to you if the chat is closed.</p>
          <div className={s.field}>
            <label htmlFor={`${ids}-message`}>How can we help?</label>
            <textarea id={`${ids}-message`} name="message" rows={3} required maxLength={CHAT_LIMITS.message}
              aria-invalid={!!fe.message} aria-describedby={fe.message ? `${ids}-message-err` : undefined} />
            {fe.message && <span id={`${ids}-message-err`} className={s.ferr}>{fe.message}</span>}
          </div>
          {/* Spam trap: hidden from people and screen readers. */}
          <div className={s.trap} aria-hidden="true">
            <label htmlFor={`${ids}-website`}>Website</label>
            <input id={`${ids}-website`} name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button className={s.primary} type="submit" disabled={busy}>{busy ? "Starting..." : "Start chat"}</button>
          <p className={s.small}>We use your details only to answer you. See our <a href="/privacy-policy">privacy policy</a>.</p>
        </form>
      ) : (
        <>
          <div className={s.log} role="log" aria-live="polite" aria-relevant="additions" aria-label="Chat messages" tabIndex={0}>
            {lines.map((l, i) => (
              <div key={l.id}>
                <div className={`${s.msg} ${l.sender === "visitor" ? s.mine : s.theirs}`}>
                  <span className={s.who}>{l.sender === "visitor" ? "You" : `${l.staff_name ?? "Lexta team"}, Lexta`}</span>
                  <p className={s.bubble}>{l.body}</p>
                  <span className={s.meta}>{l.pending ? "Sending..." : timeOf(l.created_at)}</span>
                </div>
                {i === lines.indexOf(firstVisitor!) && autoLine && (
                  <div className={`${s.msg} ${s.theirs} ${s.auto}`}>
                    <span className={s.who}>Lexta</span>
                    <p className={s.bubble}>{autoLine}</p>
                  </div>
                )}
              </div>
            ))}
            {status === "closed" && (
              <p className={s.closedNote}>Our team closed this chat. Send a message to carry on, or start a new chat.</p>
            )}
            <div ref={logEnd} />
          </div>
          <form className={s.composer} onSubmit={send}>
            {error && <p className={s.error} role="alert">{error}</p>}
            <label htmlFor={`${ids}-compose`} className={s.srOnly}>Your message</label>
            <div className={s.composeRow}>
              <textarea
                ref={composer}
                id={`${ids}-compose`}
                rows={2}
                value={draft}
                maxLength={CHAT_LIMITS.message}
                placeholder="Write a message"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
                aria-describedby={`${ids}-enter`}
              />
              <button className={s.send} type="submit" disabled={busy || !draft.trim()}>Send</button>
            </div>
            <span id={`${ids}-enter`} className={s.srOnly}>Press Enter to send, Shift and Enter for a new line.</span>
          </form>
        </>
      )}
    </div>
  );
}
