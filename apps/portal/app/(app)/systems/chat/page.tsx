import { Select } from "@lexta/ui";
import Link from "next/link";
import { CHAT_CONVERSATION_COLUMNS, CHAT_STATUSES, chatStatusLabel, isChatUnread, type ChatConversation } from "@lexta/db";
import InboxPoller from "@/components/chat/InboxPoller";
import { chatAgo, chatSiteName, chatStaffName, getChatAccess, NO_CHAT_ACCESS } from "@/lib/chat";
import { cleanSearch, PAGE_SIZE } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Live chat | Lexta Business System" };

type Search = { status?: string; who?: string; q?: string; page?: string; deleted?: string };

export default async function ChatInboxPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const access = await getChatAccess();
  if (!access.canView) return (<><h1>Live chat</h1><p className="small">{NO_CHAT_ACCESS}</p></>);

  // Default view: open chats (the visitor is waiting for a reply).
  const status = params.status === "all" || CHAT_STATUSES.some((s) => s.value === params.status) ? params.status! : "open";
  const who = params.who === "mine" || params.who === "unassigned" ? params.who : "";
  const q = cleanSearch(params.q, 80);
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const filtered = !!(q || who || status !== "open");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Builder = any;
  const applyFilters = (query: Builder): Builder => {
    let out = query;
    if (who === "mine") out = out.eq("assigned_to", access.userId);
    else if (who === "unassigned") out = out.is("assigned_to", null);
    if (q) {
      const parts = [`visitor_name.ilike.*${q}*`, `visitor_email.ilike.*${q}*`, `visitor_phone.ilike.*${q}*`, `reference.ilike.*${q}*`];
      out = out.or(parts.join(","));
    }
    return out;
  };

  let list = applyFilters(supabase.from("chat_conversations").select(CHAT_CONVERSATION_COLUMNS, { count: "exact" }));
  if (status !== "all") list = list.eq("status", status);
  const from = (page - 1) * PAGE_SIZE;
  const [listRes, unreadRes, ...countRes] = await Promise.all([
    list.order("last_message_at", { ascending: false }).order("id").range(from, from + PAGE_SIZE - 1),
    // Unread is worked out per row below; this is only for the heading.
    applyFilters(supabase.from("chat_conversations").select("last_visitor_message_at, staff_read_at").neq("status", "closed")).limit(1000),
    ...CHAT_STATUSES.map((s) => applyFilters(supabase.from("chat_conversations").select("id", { count: "exact", head: true })).eq("status", s.value)),
  ]);
  const { data, error, count } = listRes;
  if (error) console.error("[chat] list failed", error);
  const rows = (data ?? []) as unknown as ChatConversation[];
  const counts = CHAT_STATUSES.map((s, i) => ({ ...s, count: countRes[i]?.count ?? 0, failed: !!countRes[i]?.error }));
  const unread = ((unreadRes.data ?? []) as Pick<ChatConversation, "last_visitor_message_at" | "staff_read_at">[]).filter(isChatUnread).length;
  const total = count ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = new Date();

  const href = (over: Partial<Record<keyof Search, string>>) => {
    const sp = new URLSearchParams();
    const merged = { status, who, q, page: String(page), ...over };
    if (merged.status && merged.status !== "open") sp.set("status", merged.status);
    if (merged.who) sp.set("who", merged.who);
    if (merged.q) sp.set("q", merged.q);
    if (merged.page && merged.page !== "1") sp.set("page", merged.page);
    const s = sp.toString();
    return `/systems/chat${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <InboxPoller />
      <div className="page-head">
        <div>
          <h1>Live chat</h1>
          <p className="small">
            Chats from the website widget, newest activity first. Open means the visitor is waiting for a reply. New
            messages appear here by themselves.
          </p>
        </div>
        <p className="small chat-unread-total" aria-live="polite">
          {unreadRes.error ? "" : unread === 0 ? "Nothing unread" : `${unread} unread ${unread === 1 ? "chat" : "chats"}`}
        </p>
      </div>

      {params.deleted && <div className="alert ok" role="status">The chat was deleted.</div>}

      <nav className="pipeline chat-counts" aria-label="Chats by status">
        {counts.map((s) => (
          <Link key={s.value} href={href({ status: s.value, page: "1" })} className={`pipe ch-${s.value}`} aria-current={status === s.value ? "page" : undefined}>
            <b>{s.failed ? "?" : s.count}</b>
            <span>{s.label}</span>
          </Link>
        ))}
        <Link href={href({ status: "all", page: "1" })} className="pipe" aria-current={status === "all" ? "page" : undefined}>
          <b>{counts.some((c) => c.failed) ? "?" : counts.reduce((n, c) => n + c.count, 0)}</b>
          <span>All</span>
        </Link>
      </nav>

      <form className="filters chat-filters" method="get" role="search">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, email, phone or LC reference" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <Select id="status" name="status" defaultValue={status}>
            {CHAT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            <option value="all">All statuses</option>
          </Select>
        </div>
        <div className="field">
          <label htmlFor="who">Assigned</label>
          <Select id="who" name="who" defaultValue={who}>
            <option value="">Anyone</option>
            <option value="mine">Mine</option>
            <option value="unassigned">Unassigned</option>
          </Select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {filtered && <Link className="btn light" href="/systems/chat">Clear</Link>}
        </div>
      </form>

      {error ? (
        <div className="alert error" role="alert">We could not load the chats. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : rows.length === 0 ? (
        <div className="tile empty">
          <b>{filtered ? "No chats match" : "No open chats"}</b>
          <span>{filtered ? "Try another search or clear the filters." : "When a website visitor starts a chat it appears here."}</span>
        </div>
      ) : (
        <>
          <p className="small">{total} {total === 1 ? "chat" : "chats"}{pages > 1 && `, page ${page} of ${pages}`}</p>
          <ul className="chat-list">
            {rows.map((c) => {
              const isUnread = isChatUnread(c);
              return (
                <li key={c.id} className={isUnread ? "unread" : undefined}>
                  <Link href={`/systems/chat/${c.id}`} className="chat-row">
                    <span className="chat-dot" aria-hidden="true" />
                    <span className="chat-main">
                      <span className="chat-name">
                        {c.visitor_name}
                        {isUnread && <span className="badge chat-new">Unread</span>}
                      </span>
                      <span className="chat-preview">{c.last_message_preview ?? ""}</span>
                      <span className="hint">
                        <span className="mono">{c.reference}</span>, {chatSiteName(access, c.brand_id)}
                        {c.assigned_to ? `, ${chatStaffName(access, c.assigned_to)}` : ", unassigned"}
                      </span>
                    </span>
                    <span className="chat-side">
                      <span className={`badge chs ch-${c.status}`}>{chatStatusLabel(c.status)}</span>
                      <span className="small">{chatAgo(c.last_message_at, now)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {pages > 1 && (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn small light" href={href({ page: String(page - 1) })}>Previous</Link> : <span />}
              <span className="small">Page {page} of {pages}</span>
              {page < pages ? <Link className="btn small light" href={href({ page: String(page + 1) })}>Next</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </>
  );
}
