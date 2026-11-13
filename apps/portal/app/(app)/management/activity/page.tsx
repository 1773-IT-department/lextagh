import Link from "next/link";
import ActivityFeed from "@/components/management/ActivityFeed";
import ManagementHeader from "@/components/management/ManagementHeader";
import { ROLE_LABELS } from "@/lib/systems";
import { FEED_PAGE_SIZE, isFeedSystem, MANAGEMENT_BASE, MANAGEMENT_SECTIONS, managementHref, NO_MANAGEMENT_ACCESS, presentFeed, type FeedPage } from "@/lib/management";
import { managementContext } from "@/lib/management-data";
import type { AppRole } from "@lexta/db";

export const metadata = { title: "Activity | Management overview | Lexta Business System" };

type Search = Partial<Record<"range" | "from" | "to" | "brand" | "system" | "person" | "before_at" | "before_key", string>>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PATH = `${MANAGEMENT_BASE}/activity`;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const ctx = await managementContext(params);
  if (!ctx) return (<><h1>Activity</h1><p className="small">{NO_MANAGEMENT_ACCESS}</p></>);
  const { supabase, f, brands } = ctx;

  const { data: peopleData } = await supabase.from("profiles").select("id, full_name, email, role").order("full_name");
  const people = ((peopleData ?? []) as { id: string; full_name: string | null; email: string | null; role: AppRole | null }[])
    .filter((p): p is { id: string; full_name: string | null; email: string | null; role: AppRole } => !!p.role)
    .map((p) => ({ id: p.id, name: p.full_name?.trim() || p.email || "Unnamed", role: p.role }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const system = isFeedSystem(params.system) ? params.system : "";
  const person = params.person && UUID.test(params.person) && people.some((p) => p.id === params.person) ? params.person : "";
  // A page further on, for "Load more" without JavaScript: the cursor comes from the address.
  const beforeAt = params.before_at && !Number.isNaN(Date.parse(params.before_at)) ? params.before_at : "";
  const beforeKey = beforeAt && params.before_key && params.before_key.length <= 200 ? params.before_key : "";

  const { data, error } = await supabase.rpc("management_activity", {
    p_from: f.from, p_to: f.to, p_brand: f.brand || null, p_system: system || null, p_person: person || null,
    p_before_at: beforeKey ? beforeAt : null, p_before_key: beforeKey || null, p_limit: FEED_PAGE_SIZE,
  });
  if (error) console.error("[management] feed failed", error);
  const page = error ? null : (data as FeedPage);

  const keep: Record<string, string> = {};
  if (system) keep.system = system;
  if (person) keep.person = person;
  const last = page?.items[page.items.length - 1];
  const nextHref = last ? managementHref(PATH, f, { ...keep, before_at: last.at, before_key: last.key }) : PATH;
  const filtered = !!(system || person);

  return (
    <>
      <ManagementHeader path={PATH} title="Activity" f={f} brands={brands} keep={keep}
        intro="Everything recorded across the systems, newest first. Open a row to see the record in its own system." />

      <form key={`${system}|${person}|${f.from}|${f.to}|${f.brand}`} className="filters mgmt-feed-filters" method="get" action={PATH} role="search" aria-label="Activity filters">
        {f.range === "custom" ? (<><input type="hidden" name="from" value={f.from} /><input type="hidden" name="to" value={f.to} /></>)
          : f.range !== "30d" ? <input type="hidden" name="range" value={f.range} /> : null}
        {f.brand && <input type="hidden" name="brand" value={f.brand} />}
        <div className="field">
          <label htmlFor="system">System</label>
          <select id="system" name="system" defaultValue={system}>
            <option value="">Every system</option>
            {MANAGEMENT_SECTIONS.map((s) => <option key={s.system} value={s.system}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="person">Person</label>
          <select id="person" name="person" defaultValue={person}>
            <option value="">Anyone</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name} ({ROLE_LABELS[p.role] ?? p.role})</option>)}
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Show</button>
          {filtered && <Link className="btn light" href={managementHref(PATH, f)}>All activity</Link>}
        </div>
      </form>
      {f.brand && <p className="small">With a brand chosen, records with no brand (recruitment, corporate CSR, leads with no brand) are left out.</p>}
      {beforeKey && <p className="small"><Link href={managementHref(PATH, f, keep)}>Back to the newest</Link></p>}

      {!page ? (
        <div className="alert error" role="alert">We could not load the activity. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : page.items.length === 0 ? (
        <div className="alert info" role="status">Nothing has been recorded{filtered ? " for these filters" : ""} in this period yet.</div>
      ) : (
        <ActivityFeed key={`${f.from}|${f.to}|${f.brand}|${system}|${person}|${beforeKey}`} first={presentFeed(page.items, ctx.brandNames)} hasMore={page.has_more}
          query={{ from: f.from, to: f.to, brand: f.brand, system, person }} nextHref={nextHref} laterPage={!!beforeKey} />
      )}
    </>
  );
}
