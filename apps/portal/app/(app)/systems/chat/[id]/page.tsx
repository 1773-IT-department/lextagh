import Link from "next/link";
import { notFound } from "next/navigation";
import { CHAT_CONVERSATION_COLUMNS, chatStatusLabel, isChatUnread, type ChatConversation, type ChatMessage } from "@lexta/db";
import { AssignControl, MakeComplaintForm, MakeLeadForm, ReplyForm, StatusButton, VisitorForm } from "@/components/chat/ChatForms";
import InboxPoller from "@/components/chat/InboxPoller";
import ConfirmButton from "@/components/products/ConfirmButton";
import { chatSiteName, chatStaffName, chatTime, getChatAccess, NO_CHAT_ACCESS } from "@/lib/chat";
import { UUID } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";
import { deleteChat } from "../actions";

export const metadata = { title: "Chat | Lexta Business System" };

export default async function ChatPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ made?: string; error?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  if (!UUID.test(id)) notFound();
  const access = await getChatAccess();
  if (!access.canView) return (<><h1>Live chat</h1><p className="small">{NO_CHAT_ACCESS}</p></>);

  const supabase = await createClient();
  const { data: c, error } = await supabase.from("chat_conversations").select(CHAT_CONVERSATION_COLUMNS).eq("id", id).maybeSingle<ChatConversation>();
  if (error) throw new Error("Could not load the chat");
  if (!c) notFound();
  const wasUnread = isChatUnread(c);
  // Opening the chat marks it read for the whole team (only writes when there is something new).
  if (wasUnread) {
    const { error: readError } = await supabase.rpc("chat_mark_read", { target_id: id });
    if (readError) console.error("[chat] mark read failed", readError);
  }
  const [messagesRes, leadRes, complaintRes] = await Promise.all([
    supabase.from("chat_messages").select("id, seq, sender, author_id, is_internal, body, created_at").eq("conversation_id", id)
      .order("seq", { ascending: true }).limit(1000),
    c.lead_id ? supabase.from("crm_leads").select("id, title").eq("id", c.lead_id).maybeSingle() : Promise.resolve({ data: null }),
    c.complaint_id ? supabase.from("complaints").select("id, case_number").eq("id", c.complaint_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (messagesRes.error) throw new Error("Could not load the messages");
  const messages = (messagesRes.data ?? []) as Pick<ChatMessage, "id" | "seq" | "sender" | "author_id" | "is_internal" | "body" | "created_at">[];
  const lead = leadRes.data as { id: string; title: string } | null;
  const complaint = complaintRes.data as { id: string; case_number: string } | null;
  const closed = c.status === "closed";
  const staff = access.staff.filter((s) => s.is_active).map((s) => ({ id: s.id, label: s.id === access.userId ? `${s.display_name} (me)` : s.display_name }));
  const reachable = !!(c.visitor_email || c.visitor_phone);

  return (
    <>
      <InboxPoller />
      <p className="crumbs"><Link href="/systems/chat">Live chat</Link></p>
      <div className="page-head">
        <div>
          <h1>{c.visitor_name}</h1>
          <p className="small">
            <span className={`badge chs ch-${c.status}`}>{chatStatusLabel(c.status)}</span>{" "}
            <span className="mono">{c.reference}</span>, {chatSiteName(access, c.brand_id)}, started {chatTime(c.created_at)}
            {c.start_page ? (c.start_page === "/" ? " on the home page" : ` on ${c.start_page}`) : ""}
          </p>
        </div>
        <AssignControl id={c.id} assignedTo={c.assigned_to} assignedName={chatStaffName(access, c.assigned_to)} userId={access.userId} staff={staff} />
      </div>
      {flags.made === "lead" && <div className="alert ok" role="status">Lead created in the CRM and linked below.</div>}
      {flags.made === "complaint" && <div className="alert ok" role="status">Complaint logged and linked below.</div>}
      {flags.error === "delete" && <div className="alert error" role="alert">The chat could not be deleted. You may not have permission, or it was already removed. Please reload and try again.</div>}

      <div className="chat-detail">
        <section className="panel chat-thread-panel" aria-labelledby="thread-title">
          <div className="panel-head">
            <h2 id="thread-title">Conversation</h2>
            <StatusButton id={c.id} closed={closed} />
          </div>
          <ol className="chat-thread" aria-label="Messages, oldest first">
            {messages.map((m) => {
              const kind = m.sender === "visitor" ? "visitor" : m.is_internal ? "note" : "staff";
              const who = m.sender === "visitor" ? c.visitor_name : chatStaffName(access, m.author_id) || "Former team member";
              return (
                <li key={m.id} className={`chat-msg m-${kind}`}>
                  <span className="chat-msg-head">
                    <b>{who}</b>
                    {kind === "note" && <span className="badge type">Internal note</span>}
                    <span className="small">{chatTime(m.created_at)}</span>
                  </span>
                  <p className="chat-msg-body">{m.body}</p>
                </li>
              );
            })}
          </ol>
          {closed && <p className="small chat-closed-note">Closed {chatTime(c.closed_at)}{c.closed_by ? ` by ${chatStaffName(access, c.closed_by)}` : ""}. Reopen it to reply; notes are still allowed. If the visitor writes again it opens by itself.</p>}
          <ReplyForm id={c.id} closed={closed} />
        </section>

        <div>
          <section className="panel">
            <h2>Visitor</h2>
            <dl className="facts">
              <dt>Email</dt>
              <dd>{c.visitor_email ? <a href={`mailto:${c.visitor_email}`}>{c.visitor_email}</a> : "Not given"}</dd>
              <dt>Phone</dt>
              <dd>{c.visitor_phone ? <a href={`tel:${c.visitor_phone.replace(/[^+0-9]/g, "")}`}>{c.visitor_phone}</a> : "Not given"}</dd>
              <dt>Messages</dt>
              <dd>{c.visitor_message_count} from the visitor</dd>
            </dl>
            <details className="chat-edit">
              <summary>Edit visitor details</summary>
              <VisitorForm id={c.id} name={c.visitor_name} email={c.visitor_email} phone={c.visitor_phone} />
            </details>
          </section>

          <section className="panel">
            <h2>CRM lead</h2>
            {c.lead_id ? (
              <p className="small" style={{ margin: 0 }}>
                {lead ? <Link href={`/systems/crm/leads/${lead.id}`}>{lead.title}</Link> : "A lead was made from this chat."}
              </p>
            ) : access.canMakeLead ? <MakeLeadForm id={c.id} /> : <p className="small" style={{ margin: 0 }}>Your role cannot create leads.</p>}
          </section>

          <section className="panel">
            <h2>Complaint</h2>
            {c.complaint_id ? (
              <p className="small" style={{ margin: 0 }}>
                {complaint ? <Link href={`/systems/complaints/${complaint.id}`} className="mono">{complaint.case_number}</Link> : "A complaint was logged from this chat."}
              </p>
            ) : access.canMakeComplaint ? <MakeComplaintForm id={c.id} reachable={reachable} />
              : <p className="small" style={{ margin: 0 }}>Customer care and admins log complaints. Assign the chat to customer care if it is a complaint.</p>}
          </section>

          {access.isAdmin && (
            <section className="panel danger-zone">
              <h2>Delete chat</h2>
              <p className="small">Removes the chat and every message for good, for example when the visitor asks for their data to be erased. A lead or complaint made from it stays.</p>
              <form action={deleteChat.bind(null, c.id)}>
                <ConfirmButton className="btn danger" message={`Delete chat ${c.reference} and all its messages for good? This cannot be undone.`}>Delete chat</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
