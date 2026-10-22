import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import SideNav from "@/components/SideNav";
import { requireSession } from "@/lib/session";
import { ROLE_LABELS, systemsFor } from "@/lib/systems";

export const dynamic = "force-dynamic";

/** Signed in shell. Navigation is built on the server from the person's role. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const items = [{ href: "/", label: "Home" }, ...systemsFor(role).map((s) => ({ href: `/systems/${s.slug}`, label: s.name }))];

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Lexta<span>Business System</span></div>
        <SideNav items={items} />
        <div className="me">
          <div>
            {profile?.full_name || user.email}
            <br />
            <span style={{ opacity: 0.7 }}>{role ? ROLE_LABELS[role] : "No access yet"}</span>
          </div>
          <form action={signOut}><button className="btn ghost" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
