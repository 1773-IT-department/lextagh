import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import SideNav from "@/components/SideNav";
import { requireSession } from "@/lib/session";
import { PATH_HEADER } from "@/lib/supabase/middleware";
import { DISTRIBUTOR_HOME, DISTRIBUTOR_NAV, isDistributorPath, ROLE_LABELS, systemsFor } from "@/lib/systems";

export const dynamic = "force-dynamic";

/** Signed in shell. Navigation is built on the server from the person's role. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  // Distributors only ever see their ordering area: anything else sends them there, checked here on the server
  // (every other system also refuses them itself, and the database gives them nothing outside their orders).
  if (role === "distributor") {
    const path = (await headers()).get(PATH_HEADER);
    if (path !== null && !isDistributorPath(path)) redirect(DISTRIBUTOR_HOME);
  }
  const items = role === "distributor"
    ? DISTRIBUTOR_NAV
    : [{ href: "/", label: "Home" }, ...systemsFor(role).map((s) => ({ href: `/systems/${s.slug}`, label: s.name }))];

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
