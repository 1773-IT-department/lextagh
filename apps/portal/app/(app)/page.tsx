import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isManager, MANAGEMENT_BASE } from "@/lib/management";
import { DISTRIBUTOR_HOME, systemPath, systemsFor } from "@/lib/systems";

export default async function Home() {
  const { user, profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  // A distributor's home is their ordering area.
  if (role === "distributor") redirect(DISTRIBUTOR_HOME);
  // Admin and management land on the management overview.
  if (isManager(role)) redirect(MANAGEMENT_BASE);
  const systems = systemsFor(role);
  const name = profile?.full_name?.split(" ")[0] || user.email;

  if (!role) {
    return (
      <>
        <h1>Welcome, {name}</h1>
        <p className="small">Your login works, but an administrator has not given you a role yet. Ask your Lexta administrator to set your access.</p>
      </>
    );
  }

  return (
    <>
      <h1>Welcome, {name}</h1>
      <p className="small">Choose where you want to work.</p>
      <div className="grid">
        {systems.map((s) => (
          <Link key={s.slug} className="tile" href={systemPath(s)}><b>{s.name}</b><span>{s.summary}</span></Link>
        ))}
      </div>
    </>
  );
}
