"use client";

import { Select } from "@lexta/ui";
import { useEffect, useRef, useState } from "react";
import { COMPLAINT_CATEGORIES } from "@lexta/db";
import { assignChat, makeComplaint, makeLead, saveVisitor, sendReply, setChatStatus } from "@/app/(app)/systems/chat/actions";
import FormAlerts from "@/components/crm/FormAlerts";
import { useCrmForm } from "@/components/crm/useCrmForm";

/** Reply to the visitor, or add an internal note only staff see. Enter sends, Shift and Enter for a new line. */
export function ReplyForm({ id, closed }: { id: string; closed: boolean }) {
  const { state, pending, onSubmit, fe } = useCrmForm(sendReply);
  const [internal, setInternal] = useState(closed);
  const form = useRef<HTMLFormElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  // Clear the box after a successful send (the thread refreshes with the new message).
  useEffect(() => {
    if (state.message && box.current) box.current.value = "";
  }, [state]);
  useEffect(() => { if (closed) setInternal(true); }, [closed]);
  return (
    <form ref={form} className={`chat-reply${internal ? " is-note" : ""}`} noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label htmlFor="reply-body">{internal ? "Internal note (only staff see this)" : "Reply to the visitor"}</label>
        <textarea
          ref={box}
          id="reply-body"
          name="body"
          rows={3}
          maxLength={2000}
          aria-invalid={!!fe.body}
          disabled={pending}
          placeholder={internal ? "For example: called back, they want a price list" : closed ? "Reopen the chat to reply" : "Write your reply"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); form.current?.requestSubmit(); }
          }}
        />
        {fe.body && <span className="ferr">{fe.body}</span>}
      </div>
      <div className="chat-reply-actions">
        <label className="check-inline">
          <input type="checkbox" name="internal" value="yes" checked={internal} disabled={closed || pending}
            onChange={(e) => setInternal(e.target.checked)} />
          Internal note
        </label>
        {closed && <input type="hidden" name="internal" value="yes" />}
        <button className="btn" type="submit" disabled={pending}>{pending ? "Sending..." : internal ? "Add note" : "Send reply"}</button>
      </div>
      <p className="small chat-reply-hint">Enter sends, Shift and Enter makes a new line. The visitor sees your first name only.</p>
    </form>
  );
}

export function AssignControl({ id, assignedTo, assignedName, userId, staff }: {
  id: string;
  assignedTo: string | null;
  assignedName: string;
  userId: string;
  staff: { id: string; label: string }[];
}) {
  const { state, pending, onSubmit } = useCrmForm(assignChat);
  return (
    <div className="owner-box">
      <p className="small"><b>Assigned to:</b> {assignedName || "Nobody yet"}</p>
      <FormAlerts state={state} />
      {assignedTo !== userId && (
        <form onSubmit={onSubmit}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="assignee" value="me" />
          <button className="btn small" type="submit" disabled={pending}>Assign to me</button>
        </form>
      )}
      <form className="owner-form" onSubmit={onSubmit}>
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`assignee-${id}`}>Assign to</label>
        <Select id={`assignee-${id}`} name="assignee" defaultValue={assignedTo ?? "none"} disabled={pending} key={assignedTo ?? "none"}>
          <option value="none">Nobody</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
        <button className="btn small light" type="submit" disabled={pending}>{pending ? "Saving..." : "Assign"}</button>
      </form>
    </div>
  );
}

export function StatusButton({ id, closed }: { id: string; closed: boolean }) {
  const { state, pending, onSubmit } = useCrmForm(setChatStatus);
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={closed ? "open" : "closed"} />
      <button className={`btn small${closed ? "" : " light"}`} type="submit" disabled={pending}>
        {pending ? "Saving..." : closed ? "Reopen chat" : "Close chat"}
      </button>
    </form>
  );
}

export function VisitorForm({ id, name, email, phone }: { id: string; name: string; email: string | null; phone: string | null }) {
  const { state, pending, onSubmit, fe } = useCrmForm(saveVisitor);
  return (
    <form className="chat-visitor-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label htmlFor="v-name">Name</label>
        <input id="v-name" name="name" defaultValue={name} maxLength={80} aria-invalid={!!fe.name} disabled={pending} />
        {fe.name && <span className="ferr">{fe.name}</span>}
      </div>
      <div className="field">
        <label htmlFor="v-email">Email</label>
        <input id="v-email" name="email" type="email" defaultValue={email ?? ""} maxLength={254} aria-invalid={!!fe.email} disabled={pending} />
        {fe.email && <span className="ferr">{fe.email}</span>}
      </div>
      <div className="field">
        <label htmlFor="v-phone">Phone</label>
        <input id="v-phone" name="phone" type="tel" defaultValue={phone ?? ""} maxLength={24} aria-invalid={!!fe.phone} disabled={pending} />
        {fe.phone && <span className="ferr">{fe.phone}</span>}
      </div>
      <button className="btn small light" type="submit" disabled={pending}>{pending ? "Saving..." : "Save visitor details"}</button>
    </form>
  );
}

export function MakeLeadForm({ id }: { id: string }) {
  const { state, pending, onSubmit } = useCrmForm(makeLead);
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      <p className="small" style={{ margin: 0 }}>Adds the visitor as a CRM contact (or uses the one with the same email or phone) and a new lead with this chat as its description.</p>
      <button className="btn small" type="submit" disabled={pending}>{pending ? "Creating..." : "Make a CRM lead"}</button>
    </form>
  );
}

export function MakeComplaintForm({ id, reachable }: { id: string; reachable: boolean }) {
  const { state, pending, onSubmit, fe } = useCrmForm(makeComplaint);
  return (
    <form className="stage-form" noValidate onSubmit={onSubmit}>
      <FormAlerts state={state} />
      <input type="hidden" name="id" value={id} />
      {!reachable && <p className="small" style={{ margin: 0 }}>Add the visitor&apos;s email or phone first: a complaint needs a way to reach the customer.</p>}
      <div className="field">
        <label htmlFor="complaint-category">What is the complaint about?</label>
        <Select id="complaint-category" name="category" defaultValue="" aria-invalid={!!fe.category} disabled={pending}>
          <option value="" disabled>Choose a category</option>
          {COMPLAINT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        {fe.category && <span className="ferr">{fe.category}</span>}
      </div>
      <button className="btn small" type="submit" disabled={pending || !reachable}>{pending ? "Logging..." : "Log a complaint"}</button>
    </form>
  );
}
