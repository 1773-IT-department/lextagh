import Link from "next/link";
import type { ReactNode } from "react";
import { COMPLAINT_SEVERITIES, COMPLAINT_STATUSES, CRM_SOURCES, CRM_STAGES, JOB_APPLICATION_STAGES, OPEN_COMPLAINT_STATUSES, STAFF_ORDER_STATUSES } from "@lexta/db";
import {
  barsFrom, DASHBOARD_PRESETS, DASHBOARD_ROLES, dashboardHref, formatNumber, formatRangeDay, NO_DASHBOARD_ACCESS, parseDashboardFilters,
  systemHref, type Bar, type Dashboard,
} from "@/lib/dashboard";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Management dashboard | Lexta Business System" };

type Search = Partial<Record<"range" | "from" | "to" | "brand", string>>;

function Stat({ value, label, href, alert }: { value: number | string; label: string; href?: string; alert?: boolean }) {
  const body = (<><b>{typeof value === "number" ? formatNumber(value) : value}</b><span>{label}</span></>);
  const cls = `pipe dash-stat${alert ? " dash-alert" : ""}`;
  return href ? <Link className={cls} href={href}>{body}</Link> : <div className={cls}>{body}</div>;
}

function Bars({ title, bars, empty, hideZero = false }: { title: string; bars: Bar[]; empty: string; hideZero?: boolean }) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  const shown = hideZero ? bars.filter((b) => b.value > 0) : bars;
  return (
    <div className="dash-bars">
      <h3>{title}</h3>
      {max === 0 ? (
        <p className="small dash-empty">{empty}</p>
      ) : (
        <ul>
          {shown.map((b) => (
            <li key={b.label}>
              <span className="dash-bar-label">{b.label}</span>
              <span className="dash-bar-track" aria-hidden="true"><span className="dash-bar-fill" style={{ width: `${(b.value / max) * 100}%` }} /></span>
              <b className="dash-bar-value">{formatNumber(b.value)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({ id, title, href, linkLabel, note, children }: { id: string; title: string; href: string; linkLabel: string; note?: string; children: ReactNode }) {
  return (
    <section className="panel dash-tile" aria-labelledby={`dash_${id}`}>
      <div className="dash-tile-head">
        <h2 id={`dash_${id}`}><Link href={href}>{title}</Link></h2>
        <Link className="dash-open" href={href}>{linkLabel}</Link>
      </div>
      {note && <p className="small dash-note">{note}</p>}
      {children}
    </section>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  if (!role || !DASHBOARD_ROLES.includes(role)) {
    return (<><h1>Management dashboard</h1><p className="small">{NO_DASHBOARD_ACCESS}</p></>);
  }

  const supabase = await createClient();
  // The brand list and the numbers in one round trip: the numbers are asked for with the brand from the address, and
  // asked again for every brand only in the rare case that brand turns out not to be in the list.
  const loadNumbers = (brand: string, from: string, to: string) => supabase.rpc("management_dashboard", { p_from: from, p_to: to, p_brand: brand || null });
  const guess = parseDashboardFilters(params, params.brand ? [params.brand] : []);
  const [brandsRes, first] = await Promise.all([
    supabase.from("brands").select("id, name, is_active, is_corporate").order("name"),
    loadNumbers(guess.brand, guess.from, guess.to),
  ]);
  // Product brands only: the corporate Lexta brand is left out of the filter (every brand still counts it).
  const brands = ((brandsRes.data ?? []) as { id: string; name: string; is_active: boolean; is_corporate: boolean }[]).filter((b) => !b.is_corporate);
  const f = parseDashboardFilters(params, brands.map((b) => b.id));
  const res = f.brand === guess.brand && f.from === guess.from && f.to === guess.to ? first : await loadNumbers(f.brand, f.from, f.to);
  if (res.error) console.error("[dashboard] load failed", res.error);
  const d = res.error ? null : (res.data as Dashboard);
  const brandName = f.brand ? brands.find((b) => b.id === f.brand)?.name ?? "" : "";
  const period = `${formatRangeDay(f.from)} to ${formatRangeDay(f.to)}`;
  // Links into the systems keep the brand (and dates) where that list understands them.
  const brand = f.brand || undefined;
  const dates = { from: f.from, to: f.to };

  const nothingYet = !!d && [
    d.crm.new_leads, d.crm.open_now, d.complaints.opened, d.complaints.open_now, d.recruitment.applications, d.chat.conversations,
    d.orders.orders, d.field_sales.visits, d.csr.activities_done,
  ].every((n) => Number(n) === 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Management dashboard</h1>
          <p className="small">The headline numbers from every system for {period}{brandName ? `, ${brandName}` : ", every brand"}. Numbers marked now are as of this moment; the rest count what happened in the period. Open a tile to see the records.</p>
        </div>
      </div>

      <nav className="dash-presets" aria-label="Period">
        {DASHBOARD_PRESETS.map((p) => (
          <Link key={p.value} className="btn small light" href={dashboardHref({ range: p.value, brand: f.brand })} aria-current={f.range === p.value ? "page" : undefined}>{p.label}</Link>
        ))}
      </nav>
      <form className="filters dash-filters" method="get" role="search" aria-label="Dashboard filters">
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={f.from} required />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={f.to} required />
        </div>
        <div className="field">
          <label htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={f.brand}>
            <option value="">Every brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}{b.is_active ? "" : " (switched off)"}</option>)}
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn" type="submit">Apply</button>
          {(f.range !== "30d" || f.brand) && <Link className="btn light" href="/systems/dashboard">Clear</Link>}
        </div>
      </form>

      {!d ? (
        <div className="alert error" role="alert">We could not load the dashboard. Please refresh the page. If it keeps happening, tell the IT team.</div>
      ) : (
        <>
          {nothingYet && (
            <div className="alert info" role="status">Nothing has been recorded for this period{brandName ? ` and brand` : ""} yet. The numbers fill in as people use the systems.</div>
          )}
          <div className="dash-grid">
            <Tile id="crm" title="CRM leads" href={systemHref("/systems/crm/leads", { stage: "all", brand })} linkLabel="Open CRM">
              <div className="dash-stats">
                <Stat value={d.crm.new_leads} label="New in period" />
                <Stat value={d.crm.open_now} label="Open now" href={systemHref("/systems/crm/leads", { brand })} />
                <Stat value={d.crm.won} label="Won in period" href={systemHref("/systems/crm/leads", { stage: "won", brand })} />
                <Stat value={d.crm.lost} label="Lost in period" href={systemHref("/systems/crm/leads", { stage: "lost", brand })} />
                <Stat value={d.crm.unassigned_website} label="Website leads with no owner, now" alert={d.crm.unassigned_website > 0} />
              </div>
              <p className="dash-more"><Link href={systemHref("/systems/crm/leads", { owner: "unassigned", brand })}>See unassigned leads (every source)</Link></p>
              <Bars title="New leads by source" bars={barsFrom(CRM_SOURCES, d.crm.by_source)} hideZero empty="No new leads in this period." />
              <Bars title="New leads by stage they are at" bars={barsFrom(CRM_STAGES, d.crm.by_stage)} empty="No new leads in this period." />
            </Tile>

            <Tile id="complaints" title="Complaints" href={systemHref("/systems/complaints", { brand })} linkLabel="Open complaints">
              <div className="dash-stats">
                <Stat value={d.complaints.opened} label="Received in period" />
                <Stat value={d.complaints.closed} label="Closed in period" />
                <Stat value={d.complaints.avg_days_to_close === null ? "None" : formatNumber(d.complaints.avg_days_to_close)} label="Average days to close" />
                <Stat value={d.complaints.open_now} label="Open now" href={systemHref("/systems/complaints", { brand })} />
                <Stat value={d.complaints.overdue_now} label="Overdue now" alert={d.complaints.overdue_now > 0}
                  href={systemHref("/systems/complaints", { status: "open", overdue: "1", brand })} />
              </div>
              <Bars title="Open now by severity" bars={barsFrom(COMPLAINT_SEVERITIES, d.complaints.open_by_severity).reverse()} empty="No open complaints." />
              <Bars title="Open now by status" bars={barsFrom(COMPLAINT_STATUSES.filter((s) => OPEN_COMPLAINT_STATUSES.includes(s.value)), d.complaints.open_by_status)} empty="No open complaints." />
            </Tile>

            <Tile id="orders" title="Distributor orders" href={systemHref("/systems/orders", { ...dates, brand })} linkLabel="Open orders"
              note="Orders carry no prices yet, so value is shown as order lines and packs.">
              <div className="dash-stats">
                <Stat value={d.orders.orders} label="Submitted in period" />
                <Stat value={d.orders.lines} label="Order lines (not cancelled)" />
                <Stat value={d.orders.packs} label="Packs ordered (not cancelled)" />
                <Stat value={d.orders.to_confirm_now} label="Waiting to be confirmed, now" alert={d.orders.to_confirm_now > 0}
                  href={systemHref("/systems/orders", { status: "submitted", brand })} />
              </div>
              <Bars title="Orders in period by status" bars={barsFrom(STAFF_ORDER_STATUSES, d.orders.by_status)} empty="No orders in this period." />
            </Tile>

            <Tile id="field" title="Field sales" href={systemHref("/systems/field-sales/history", { ...dates, brand })} linkLabel="Open visits">
              <div className="dash-stats">
                <Stat value={d.field_sales.visits} label="Shop visits in period" />
                <Stat value={d.field_sales.reps} label="Reps visiting" />
                <Stat value={d.field_sales.new_shops_in_period} label="New shops found" />
                <Stat value={d.field_sales.shops_to_confirm_now} label="New shops to confirm, now" alert={d.field_sales.shops_to_confirm_now > 0}
                  href={systemHref("/systems/stockists", { status: "inactive", brand })} />
              </div>
              <Bars title="Top reps by visits" bars={d.field_sales.top_reps.map((r) => ({ label: r.name, value: r.visits }))} empty="No visits in this period." />
              <Bars title="Visit outcomes" bars={d.field_sales.outcomes.map((o) => ({ label: o.label, value: o.visits }))} empty="No visits in this period." />
            </Tile>

            <Tile id="chat" title="Live chat" href="/systems/chat" linkLabel="Open inbox"
              note={brandName ? "The numbers are for this brand; the inbox itself shows every brand." : undefined}>
              <div className="dash-stats">
                <Stat value={d.chat.conversations} label="Chats in period" />
                <Stat value={d.chat.awaiting_reply_now} label="Waiting for a reply, now" alert={d.chat.awaiting_reply_now > 0} href="/systems/chat" />
                <Stat value={d.chat.never_answered_now} label="Not answered at all, now" alert={d.chat.never_answered_now > 0} href="/systems/chat" />
                <Stat value={d.chat.leads_from_chat} label="Leads made from chats" href={systemHref("/systems/crm/leads", { stage: "all", source: "website_live_chat", brand })} />
              </div>
            </Tile>

            <Tile id="recruitment" title="Recruitment" href={systemHref("/systems/recruitment", dates)} linkLabel="Open recruitment"
              note={brandName ? "Recruitment is not split by brand: these are every role and application." : undefined}>
              <div className="dash-stats">
                <Stat value={d.recruitment.open_roles} label="Open roles, now" href="/systems/recruitment/roles" />
                <Stat value={d.recruitment.applications} label="Applications in period" />
                <Stat value={d.recruitment.in_progress_now} label="Applications in progress, now" href={systemHref("/systems/recruitment", { stage: "active" })} />
              </div>
              <Bars title="Applications in period by stage" bars={barsFrom(JOB_APPLICATION_STAGES, d.recruitment.by_stage)} hideZero empty="No applications in this period." />
            </Tile>

            <Tile id="csr" title="CSR activities" href={systemHref("/systems/csr", dates)} linkLabel="Open CSR"
              note={brandName ? "Only programmes of this brand; corporate programmes are left out." : undefined}>
              <div className="dash-stats">
                <Stat value={d.csr.activities_done} label="Activities done in period" />
                <Stat value={d.csr.people_reached} label="People reached" />
                <Stat value={d.csr.planned_ahead} label="Planned from today" />
              </div>
              <Bars title="People reached by programme" bars={d.csr.by_programme.map((p) => ({ label: `${p.name} (${formatNumber(p.activities)})`, value: p.people }))}
                empty="No activities done in this period." />
            </Tile>

            <Tile id="catalogue" title="Products and stockists" href={systemHref("/systems/products", { brand })} linkLabel="Open products">
              <div className="dash-stats">
                <Stat value={d.catalogue.published_products} label="Products on the websites" href={systemHref("/systems/products", { brand })} />
                <Stat value={d.catalogue.products} label="Products in all" />
                <Stat value={d.catalogue.active_stockists} label="Active stockists" href={systemHref("/systems/stockists", { brand })} />
              </div>
            </Tile>
          </div>
        </>
      )}
    </>
  );
}
