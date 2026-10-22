import type { ReactNode } from "react";

export default function AuthCard({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lexta-logo.png" alt="Lexta" style={{ height: 40, width: "auto", display: "block" }} />
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        {children}
      </div>
    </main>
  );
}
