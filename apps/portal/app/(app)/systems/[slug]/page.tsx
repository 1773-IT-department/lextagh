import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { SYSTEMS, systemsFor } from "@/lib/systems";

export default async function SystemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const system = SYSTEMS.find((s) => s.slug === slug);
  if (!system) notFound();

  const { profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  if (!systemsFor(role).some((s) => s.slug === slug)) {
    return (
      <>
        <h1>{system.name}</h1>
        <p className="small">Your role does not include this system. Ask your Lexta administrator if you need it.</p>
      </>
    );
  }

  return (
    <>
      <h1>{system.name}</h1>
      <p className="small">{system.summary}</p>
      <div className="tile" style={{ marginTop: 20 }}>
        <b>Being built</b>
        <span>This screen is on the build plan and will appear here soon.</span>
      </div>
    </>
  );
}
