"use client";

import { Select } from "@lexta/ui";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, type CSSProperties, type DragEvent, type FormEvent } from "react";
import { JOB_CV_MAX_BYTES, jobCvExtension, looksLikeCv } from "@lexta/db/src/job-cv";
import { submitApplicationForm } from "@/app/actions/forms";
import { FieldError, FormMessage, Honeypot, idleState, invalidProps, useServerForm, visuallyHidden } from "@/components/forms/FormParts";
import forms from "@/components/forms/forms.module.css";
import { APPLY_EVENT, type ApplyDetail } from "./OpenRoles";

/* Values copied from careers.html. */
const fieldLabel: CSSProperties = { display: "flex", flexDirection: "column", gap: 7, fontSize: 12, fontWeight: 600, color: "#12313d" };
const field: CSSProperties = {
  border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d",
  background: "#fff", minWidth: 0, fontFamily: "inherit",
};
/* The dropdown's face (packages/ui Select): the native select's 47 px height, set so it holds while the font loads. */
const selectField: CSSProperties = { ...field, lineHeight: "21px" };
const cell: CSSProperties = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 };

/** Same words as lib/forms/careers.ts, for the checks made in the browser before sending. */
const CV_MSG = {
  type: "Your CV must be a PDF or Word file (.pdf, .doc or .docx).",
  size: "Your CV must be 4 MB or smaller.",
  content: "This file does not look like a PDF or Word document. Please choose your CV again.",
};

const errorId = (name: string) => `application-${name}-error`;

const fileSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

async function checkFile(file: File): Promise<string | null> {
  const ext = jobCvExtension(file.name);
  if (!ext) return CV_MSG.type;
  if (file.size > JOB_CV_MAX_BYTES) return CV_MSG.size;
  if (file.size < 8) return CV_MSG.content;
  try {
    return looksLikeCv(ext, new Uint8Array(await file.slice(0, 8).arrayBuffer())) ? null : CV_MSG.content;
  } catch {
    return null; // The server checks again.
  }
}

export type RoleOption = { reference: string; title: string };

/**
 * The Careers application form (item 21): a general application, or an application for the role picked with
 * "Apply for this role" (that role's reference goes in a hidden field, with an "Applying for" line and a way back to a
 * general application). Same pattern as the other website forms (item 19): useServerForm, honeypot, inline errors,
 * focus on the first problem or the message. The CV always travels in the form post to the website server, which
 * checks it and puts it in Storage; it posts without JavaScript too (a role list then stands in for "Apply for this
 * role").
 */
export default function ApplicationForm({ roles, interests }: { roles: RoleOption[]; interests: string[] }) {
  const [state, formAction, pending] = useActionState(submitApplicationForm, idleState);
  const v = state.values ?? {};
  const { ref } = useServerForm(state, formAction, pending);

  const [role, setRole] = useState<RoleOption | null>(() => roles.find((r) => r.reference === v.opening) ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [attached, setAttached] = useState<{ path: string; name: string } | null>(v.cv_path ? { path: v.cv_path, name: v.cv_name ?? "" } : null);
  const [cvError, setCvError] = useState<string | null>(null);
    const [drag, setDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const roleNote = useRef<HTMLDivElement>(null);
  const busy = pending;

  // "Apply for this role" on a role above.
  useEffect(() => {
    const onApply = (e: Event) => {
      const detail = (e as CustomEvent<ApplyDetail>).detail;
      if (!detail?.reference) return;
      setRole({ reference: detail.reference, title: detail.title });
      requestAnimationFrame(() => roleNote.current?.focus({ preventScroll: true }));
    };
    window.addEventListener(APPLY_EVENT, onApply);
    return () => window.removeEventListener(APPLY_EVENT, onApply);
  }, []);

  // Each answer from the server: a kept upload is reused (the file box shows it), success starts afresh.
  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status === "success") {
      setRole(null);
      setFile(null);
      setAttached(null);
    } else if (state.values?.cv_path) {
      setAttached({ path: state.values.cv_path, name: state.values.cv_name ?? "" });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    } else {
      setAttached(null);
    }
    setCvError(null);
  }, [state]);

  const choose = async (picked: File | null) => {
    setFile(picked);
    setCvError(picked ? await checkFile(picked) : null);
    if (picked) setAttached(null);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || !fileInput.current) return;
    const dt = new DataTransfer();
    dt.items.add(dropped);
    fileInput.current.files = dt.files;
    void choose(dropped);
  };

  // Checks the file in the browser first (the server checks again), then posts the form with the file.
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    if (file) {
      const problem = await checkFile(file);
      if (problem) {
        setCvError(problem);
        fileInput.current?.focus();
        return;
      }
    }
    startTransition(() => formAction(data));
  };

  const cvMessage = cvError ?? state.fieldErrors?.cv;
  const shownName = file?.name ?? attached?.name ?? "";
  const roleError = state.fieldErrors?.opening;

  return (
    <form
      ref={ref}
      action={formAction}
      onSubmit={onSubmit}
      aria-label={role ? `Application for ${role.title}` : "General application"}
      style={{ position: "relative", background: "#f7fcfe", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}
    >
      <div style={{ fontSize: 19, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>{role ? "Role application" : "General application"}</div>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>Takes about two minutes. We read every one.</p>

      <input type="hidden" name="opening" value={role?.reference ?? ""} />
      {role && (
        <div
          ref={roleNote}
          tabIndex={-1}
          role="status"
          style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "#fff", border: "1px solid rgba(18,163,196,.35)", borderRadius: 9, padding: "12px 14px" }}
        >
          <span style={{ fontSize: 13, lineHeight: 1.6, color: "#12313d" }}>
            Applying for: <b>{role.title}</b> <span style={{ color: "#8fa8b2", fontSize: 11.5 }}>({role.reference})</span>
          </span>
          <button
            type="button"
            onClick={() => setRole(null)}
            style={{ border: 0, background: "transparent", color: "#12a3c4", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 4, fontFamily: "inherit" }}
          >
            Switch to a general application
          </button>
        </div>
      )}
      <FieldError id={errorId("opening")} message={roleError} style={{ display: "block", marginTop: 6 }} />
      {roles.length > 0 && (
        <noscript>
          <label style={{ ...fieldLabel, marginTop: 16 }}>
            Role
            <Select name="opening_choice" defaultValue={v.opening ?? ""} style={selectField}>
              <option value="">General application</option>
              {roles.map((r) => <option key={r.reference} value={r.reference}>{r.title} ({r.reference})</option>)}
            </Select>
          </label>
        </noscript>
      )}
      <Honeypot />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 22 }}>
        <div style={cell}>
          <label style={fieldLabel}>
            Full name
            <input type="text" name="name" autoComplete="name" placeholder="Your name" required maxLength={120} defaultValue={v.name}
              {...invalidProps(state, "name", errorId("name"))} style={field} />
          </label>
          <FieldError id={errorId("name")} message={state.fieldErrors?.name} />
        </div>
        <div style={cell}>
          <label style={fieldLabel}>
            Email
            <input type="email" name="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} defaultValue={v.email}
              {...invalidProps(state, "email", errorId("email"))} style={field} />
          </label>
          <FieldError id={errorId("email")} message={state.fieldErrors?.email} />
        </div>
        <div style={cell}>
          <label style={fieldLabel}>
            Phone
            <input type="tel" name="phone" autoComplete="tel" placeholder="+233" maxLength={24} defaultValue={v.phone}
              {...invalidProps(state, "phone", errorId("phone"))} style={field} />
          </label>
          <FieldError id={errorId("phone")} message={state.fieldErrors?.phone} />
        </div>
        {!role && (
          <div style={cell}>
            <label style={fieldLabel}>
              Area of interest
              <Select name="interest" defaultValue={v.interest || interests[0]} {...invalidProps(state, "interest", errorId("interest"))} style={selectField}>
                {interests.map((o) => <option key={o}>{o}</option>)}
              </Select>
            </label>
            <FieldError id={errorId("interest")} message={state.fieldErrors?.interest} />
          </div>
        )}
      </div>
      <div style={{ ...cell, marginTop: 14 }}>
        <label style={fieldLabel}>
          Tell us briefly why Lexta
          <textarea
            name="message"
            rows={4}
            maxLength={3000}
            placeholder="A few sentences on your experience and what you are looking for."
            defaultValue={v.message}
            {...invalidProps(state, "message", errorId("message"))}
            style={{ ...field, lineHeight: 1.7, resize: "vertical", minWidth: undefined }}
          />
        </label>
        <FieldError id={errorId("message")} message={state.fieldErrors?.message} />
      </div>

      <div style={{ ...cell, marginTop: 16 }}>
        <label
          className={forms.dropzone}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          style={{
            display: "block", border: `1px dashed ${cvMessage ? "#b42318" : drag ? "#12a3c4" : "rgba(18,163,196,.45)"}`, borderRadius: 9, padding: 18,
            textAlign: "center", background: drag ? "#f0f9fc" : "#fff", cursor: "pointer",
          }}
        >
          <input
            ref={fileInput}
            type="file"
            name="cv"
            className="application-cv-input"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => void choose(e.target.files?.[0] ?? null)}
            aria-invalid={cvMessage ? true : undefined}
            aria-describedby={`application-cv-hint${cvMessage ? ` ${errorId("cv")}` : ""}`}
            style={visuallyHidden}
          />
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#12313d", overflowWrap: "anywhere" }}>{shownName || "Attach your CV"}</span>
          <span id="application-cv-hint" style={{ display: "block", marginTop: 5, fontSize: 11, color: "#8fa8b2" }}>
            {file ? `${fileSize(file.size)}. Choose another file to replace it.` : attached ? "Attached. Choose another file to replace it." : "PDF or Word, up to 4 MB"}
          </span>
        </label>
        {attached && (
          <>
            <input type="hidden" name="cv_path" value={attached.path} />
            <input type="hidden" name="cv_name" value={attached.name} />
          </>
        )}
        <FieldError id={errorId("cv")} message={cvMessage ?? undefined} />
      </div>
      {/* Without JavaScript the file name cannot be shown in the box, so the browser's own file field shows instead. */}
      <noscript>
        <style>{".application-cv-input{position:static!important;width:auto!important;height:auto!important;margin:10px auto 0!important;overflow:visible!important;clip:auto!important;white-space:normal!important;max-width:100%}"}</style>
      </noscript>

      <div style={{ ...cell, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12, lineHeight: 1.6, color: "#3f5f6b" }}>
          <input
            id="application-consent"
            type="checkbox"
            name="consent"
            value="yes"
            required
            defaultChecked={v.consent === "yes"}
            {...invalidProps(state, "consent", errorId("consent"))}
            style={{ margin: "3px 0 0", width: 15, height: 15, flex: "0 0 auto", accentColor: "#12a3c4" }}
          />
          <label htmlFor="application-consent">Lexta may keep my details and CV for this application and for future roles that may suit me.</label>
        </div>
        <FieldError id={errorId("consent")} message={state.fieldErrors?.consent} />
      </div>

      <button
        type="submit"
        aria-disabled={busy}
        style={{ marginTop: 20, width: "100%", border: 0, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600, padding: "14px 20px", borderRadius: 7, cursor: busy ? "progress" : "pointer", opacity: busy ? 0.75 : 1, fontFamily: "inherit" }}
      >
        {pending ? (file ? "Sending your application and CV..." : "Sending...") : "Submit application"}
      </button>
      <FormMessage state={state} style={{ marginTop: 14 }} />
      <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.7, color: "#8fa8b2" }}>
        Lexta Ghana is an equal opportunity employer. We consider every application on merit, regardless of gender, background or physical ability.
        {" "}We use your details only for recruitment. See our <Link href="/privacy-policy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</Link>.
      </div>
    </form>
  );
}
