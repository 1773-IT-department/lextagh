import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CHAT_STATUSES, COMPLAINT_CATEGORIES, COMPLAINT_SEVERITIES, COMPLAINT_STATUSES, CRM_SOURCES, CRM_STAGES, JOB_APPLICATION_STAGES,
  OPEN_COMPLAINT_STATUSES, STAFF_ORDER_STATUSES,
} from "@lexta/db";
import Bars from "@/components/management/Bars";
import Figure from "@/components/management/Figure";
import ManagementHeader from "@/components/management/ManagementHeader";
import MiniChart from "@/components/management/MiniChart";
import { barsFrom, formatNumber, systemHref, type Dashboard } from "@/lib/dashboard";
import { formatWhen, leadDisplayTitle, MANAGEMENT_BASE, MANAGEMENT_SECTIONS, NO_MANAGEMENT_ACCESS, type SectionSlug, type Timeseries } from "@/lib/management";
import { loadNumbers, loadSeries, managementContext, type ManagementContext } from "@/lib/management-data";

type Search = Partial<Record<"range" | "from" | "to" | "brand", string>>;
const LATEST = 10;

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const s = MANAGEMENT_SECTIONS.find((x) => x.slug === section);
  return { title: `${s?.label ?? "Management"} | Management overview | Lexta Business System` };
}

const label = (options: readonly { value: string; label: string }[], v: string) => options.find((o) => o.value === v)?.label ?? v;
const day = (v: string) => new Date(`${v.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** The figures, breakdowns, chart and latest records of one system. Read only: every link opens the system itself. */
export default async function SectionPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Search> }) {
  const { section } = await params;
  const def = MANAGEMENT_SECTIONS.find((s) => s.slug === section);
  if (!def) notFound();
  const ctx = await managementContext(await searchParams);
  if (!ctx) return (<><h1>{def.label}</h1><p className="small">{NO_MANAGEMENT_ACCESS}</p></>);

  const path = `${MANAGEMENT_BASE}/${def.slug}`;
  const charted = ["orders", "field-sales", "crm", "complaints"].includes(def.slug);
  const [numbers, series, latest] = await Promise.all([loadNumbers(ctx), charted ? loadSeries(ctx) : Promise.resolve(null), loadLatest(def.slug, ctx)]);
  const header = (
    <ManagementHeader path={path} title={def.label} f={ctx.f} brands={ctx.brands}
      intro={`The figures and latest records of ${def.label === "CRM" ? "the CRM" : def.label.toLowerCase()}, read only.`} />
  );
  if (!numbers) {
    return (<>{header}<div className="alert error" role="alert">We could not load these figures. Please refresh the page. If it keeps happening, tell the IT team.</div></>);
  }
  const view = render(def.slug, ctx, numbers.now, numbers.before, series, latest);
  return (
    <>
      {header}
      {view.note && <div className="alert info" role="note">{view.note}</div>}
      <section className="panel" aria-labelledby="sec_figures">
        <h2 id="sec_figures">Figures</h2>
        <p className="small">Compared with the {ctx.prev.days === 1 ? "day" : `${ctx.prev.days} days`} before the period. Numbers marked now ignore the period.</p>
        <div className="mgmt-figs wide">{view.figures}</div>
        {view.bars && <div className="mgmt-bars-grid">{view.bars}</div>}
      </section>
      {view.chart}
      <section className="panel" aria-labelledby="sec_latest">
        <div className="dash-tile-head">
          <h2 id="sec_latest">{view.latestTitle}</h2>
          <span className="mgmt-full-links">{view.fullLinks}</span>
        </div>
        {latest.error ? <div className="alert error" role="alert">We could not load the latest records.</div> : view.latest}
      </section>
    </>
  );
}

// Latest records ------------------------------------------------------------------------------------------------------
type Row = Record<string, unknown>;
type Latest = { error: boolean; rows: Row[]; rows2?: Row[] };

async function loadLatest(slug: SectionSlug, ctx: ManagementContext): Promise<Latest> {
  const { supabase, f } = ctx;
  const brand = f.brand || null;
  const start = `${f.from}T00:00:00Z`;
  const end = new Date(Date.parse(`${f.to}T00:00:00Z`) + 86_400_000).toISOString();
  const done = (r: { data: unknown; error: unknown }, r2?: { data: unknown; error: unknown }): Latest => {
    if (r.error || r2?.error) console.error("[management] latest records failed", r.error ?? r2?.error);
    return { error: !!(r.error || r2?.error), rows: (r.data ?? []) as Row[], rows2: r2 ? ((r2.data ?? []) as Row[]) : undefined };
  };
  switch (slug) {
    case "orders":
      return done(await supabase.rpc("distributor_order_inbox", { p_status: null, p_brand: brand, p_org: null, p_from: f.from, p_to: f.to, p_q: null, p_limit: LATEST, p_offset: 0 }));
    case "field-sales":
      return done(await supabase.rpc("field_visit_list", { p_from: f.from, p_to: f.to, p_brand: brand, p_limit: LATEST, p_offset: 0 }));
    case "crm": {
      let q = supabase.from("crm_leads").select("id, title, source, intake_reference, stage, brand_id, created_at").gte("created_at", start).lt("created_at", end);
      if (brand) q = q.eq("brand_id", brand);
      return done(await q.order("created_at", { ascending: false }).limit(LATEST));
    }
    case "complaints": {
      let q = supabase.from("complaints").select("id, case_number, category, severity, status, brand_id, created_at").gte("created_at", start).lt("created_at", end);
      if (brand) q = q.eq("brand_id", brand);
      return done(await q.order("created_at", { ascending: false }).limit(LATEST));
    }
    case "recruitment":
      return done(await supabase.from("job_applications").select("id, reference, full_name, opening_title_snapshot, interest, stage, created_at")
        .gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(LATEST));
    case "chat": {
      let q = supabase.from("chat_conversations").select("id, reference, brand_id, visitor_name, status, start_page, created_at").gte("created_at", start).lt("created_at", end);
      if (brand) q = q.eq("brand_id", brand);
      return done(await q.order("created_at", { ascending: false }).limit(LATEST));
    }
    case "csr": {
      let q = supabase.from("csr_activities").select("id, activity_date, status, place, people_reached, csr_programmes!inner(name, brand_id)")
        .gte("activity_date", f.from).lte("activity_date", f.to);
      if (brand) q = q.eq("csr_programmes.brand_id", brand);
      return done(await q.order("activity_date", { ascending: false }).limit(LATEST));
    }
    case "catalogue": {
      let p = supabase.from("products").select("id, name, brand_id, is_published, updated_at");
      if (brand) p = p.eq("brand_id", brand);
      let s = brand
        ? supabase.from("stockists").select("id, name, town, is_active, updated_at, stockist_brands!inner(brand_id)").eq("stockist_brands.brand_id", brand)
        : supabase.from("stockists").select("id, name, town, is_active, updated_at");
      s = s.order("updated_at", { ascending: false }).limit(LATEST);
      const [a, b] = await Promise.all([p.order("updated_at", { ascending: false }).limit(LATEST), s]);
      return done(a, b);
    }
  }
}

// One view per system -------------------------------------------------------------------------------------------------
type View = { note?: string; figures: ReactNode; bars?: ReactNode; chart?: ReactNode; latestTitle: string; latest: ReactNode; fullLinks: ReactNode };

function Table({ caption, head, rows, empty }: { caption: string; head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="small">{empty}</p>;
  return (
    <div className="table-wrap">
      <table className="ptable">
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <td key={j}>{c}</td> : <td key={j} data-label={head[j]}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function Chart({ series, id, title, k, word, one }: { series: Timeseries | null; id: string; title: string; k: "orders" | "leads" | "complaints" | "visits"; word: string; one: string }) {
  if (!series) return <div className="alert error" role="alert">We could not load the chart.</div>;
  return <section className="panel" aria-label={`${title} over time`}><MiniChart id={id} title={title} series={k} unitWord={word} unitOne={one} data={series} /></section>;
}

function render(slug: SectionSlug, ctx: ManagementContext, d: Dashboard, b: Dashboard, series: Timeseries | null, latest: Latest): View {
  const { f, prev } = ctx;
  const days = prev.days;
  const brand = f.brand || undefined;
  const dates = { from: f.from, to: f.to };
  const bn = (id: unknown) => ctx.brandName(String(id ?? ""));
  const rows = latest.rows;
  const none = "Nothing in this period.";
  const n = (v: unknown) => Number(v ?? 0);

  switch (slug) {
    case "orders":
      return {
        note: "Orders carry no prices yet, so order size is shown as order lines and packs.",
        figures: (<>
          <Figure value={d.orders.orders} before={b.orders.orders} days={days} label="orders submitted" />
          <Figure value={d.orders.lines} before={b.orders.lines} days={days} label="order lines (not cancelled)" />
          <Figure value={d.orders.packs} before={b.orders.packs} days={days} label="packs ordered (not cancelled)" />
          <Figure value={d.orders.to_confirm_now} label="waiting to be confirmed, now" href={systemHref("/systems/orders", { status: "submitted", brand })} />
        </>),
        bars: <Bars title="Orders in the period by status" bars={barsFrom(STAFF_ORDER_STATUSES, d.orders.by_status)} empty="No orders in this period." />,
        chart: <Chart series={series} id="s_orders" title="Orders submitted" k="orders" word="orders" one="order" />,
        latestTitle: "Latest orders",
        fullLinks: <Link href={systemHref("/systems/orders", { ...dates, brand })}>All orders in Distributor ordering</Link>,
        latest: <Table caption="Latest orders submitted in the period" head={["Order", "Distributor", "Status", "Packs", "Submitted"]} empty={none}
          rows={rows.map((r) => [<Link key="l" href={`/systems/orders/${r.id}`}>{String(r.reference)}</Link>, String(r.organisation_name ?? ""),
            label(STAFF_ORDER_STATUSES, String(r.status)), formatNumber(n(r.pack_count)), formatWhen(String(r.submitted_at))])} />,
      };
    case "field-sales":
      return {
        figures: (<>
          <Figure value={d.field_sales.visits} before={b.field_sales.visits} days={days} label="shop visits" />
          <Figure value={d.field_sales.reps} before={b.field_sales.reps} days={days} label="reps visiting" />
          <Figure value={d.field_sales.new_shops_in_period} before={b.field_sales.new_shops_in_period} days={days} label="new shops found" />
          <Figure value={d.field_sales.shops_to_confirm_now} label="new shops to confirm, now" href={systemHref("/systems/stockists", { status: "inactive", brand })} />
        </>),
        bars: (<>
          <Bars title="Top reps by visits" bars={d.field_sales.top_reps.map((r) => ({ label: r.name, value: r.visits }))} empty="No visits in this period." />
          <Bars title="Visit outcomes" bars={d.field_sales.outcomes.map((o) => ({ label: o.label, value: o.visits }))} empty="No visits in this period." />
        </>),
        chart: <Chart series={series} id="s_visits" title="Shop visits" k="visits" word="visits" one="visit" />,
        latestTitle: "Latest shop visits",
        fullLinks: <Link href={systemHref("/systems/field-sales", { ...dates, brand })}>All visits in Field sales</Link>,
        latest: <Table caption="Latest shop visits in the period" head={["Shop", "Rep", "Outcome", "When"]} empty={none}
          rows={rows.map((r) => [<Link key="l" href={`/systems/field-sales/visits/${r.id}`}>{String(r.shop_name)}{r.new_shop ? " (new shop)" : ""}</Link>,
            String(r.rep_name ?? "Former staff"), String(r.outcome_label ?? ""), formatWhen(String(r.visited_at))])} />,
      };
    case "crm":
      return {
        figures: (<>
          <Figure value={d.crm.new_leads} before={b.crm.new_leads} days={days} label="new leads" />
          <Figure value={d.crm.won} before={b.crm.won} days={days} label="leads won" />
          <Figure value={d.crm.lost} before={b.crm.lost} days={days} label="leads lost" />
          <Figure value={d.crm.open_now} label="open leads, now" href={systemHref("/systems/crm/leads", { brand })} />
          <Figure value={d.crm.unassigned_website} label="website leads with no owner, now" href={systemHref("/systems/crm/leads", { owner: "unassigned", brand })} />
        </>),
        bars: (<>
          <Bars title="New leads by source" bars={barsFrom(CRM_SOURCES, d.crm.by_source)} hideZero empty="No new leads in this period." />
          <Bars title="New leads by the stage they are at" bars={barsFrom(CRM_STAGES, d.crm.by_stage)} empty="No new leads in this period." />
        </>),
        chart: <Chart series={series} id="s_leads" title="New leads" k="leads" word="leads" one="lead" />,
        latestTitle: "Latest leads",
        fullLinks: <Link href={systemHref("/systems/crm/leads", { stage: "all", sort: "newest", brand })}>All leads in the CRM</Link>,
        latest: <Table caption="Latest leads created in the period" head={["Lead", "Source", "Stage", "Brand", "Created"]} empty={none}
          rows={rows.map((r) => [<Link key="l" href={`/systems/crm/leads/${r.id}`}>{leadDisplayTitle(r)}</Link>, label(CRM_SOURCES, String(r.source)),
            label(CRM_STAGES, String(r.stage)), r.brand_id ? bn(r.brand_id) : "No brand", formatWhen(String(r.created_at))])} />,
      };
    case "complaints":
      return {
        figures: (<>
          <Figure value={d.complaints.opened} before={b.complaints.opened} days={days} label="complaints received" />
          <Figure value={d.complaints.closed} before={b.complaints.closed} days={days} label="complaints closed" />
          <Figure value={d.complaints.resolved} before={b.complaints.resolved} days={days} label="complaints resolved" />
          <Figure value={d.complaints.open_now} label="open, now" href={systemHref("/systems/complaints", { brand })} />
          <Figure value={d.complaints.overdue_now} label="overdue, now" href={systemHref("/systems/complaints", { status: "open", overdue: "1", brand })} />
        </>),
        bars: (<>
          <p className="small mgmt-avg">Average days to close in the period: <b>{d.complaints.avg_days_to_close === null ? "none closed" : formatNumber(d.complaints.avg_days_to_close)}</b>
            {b.complaints.avg_days_to_close !== null ? ` (the period before: ${formatNumber(b.complaints.avg_days_to_close)})` : ""}</p>
          <Bars title="Open now by severity" bars={barsFrom(COMPLAINT_SEVERITIES, d.complaints.open_by_severity).reverse()} empty="No open complaints." />
          <Bars title="Open now by status" bars={barsFrom(COMPLAINT_STATUSES.filter((s) => OPEN_COMPLAINT_STATUSES.includes(s.value)), d.complaints.open_by_status)} empty="No open complaints." />
        </>),
        chart: <Chart series={series} id="s_complaints" title="Complaints received" k="complaints" word="complaints" one="complaint" />,
        latestTitle: "Latest complaints",
        fullLinks: <Link href={systemHref("/systems/complaints", { status: "all", brand })}>All complaints</Link>,
        latest: <Table caption="Latest complaints received in the period" head={["Case", "Category", "Severity", "Status", "Brand", "Received"]} empty={none}
          rows={rows.map((r) => [<Link key="l" href={`/systems/complaints/${r.id}`}>{String(r.case_number)}</Link>, label(COMPLAINT_CATEGORIES, String(r.category)),
            label(COMPLAINT_SEVERITIES, String(r.severity)), label(COMPLAINT_STATUSES, String(r.status)), bn(r.brand_id), formatWhen(String(r.created_at))])} />,
      };
    case "recruitment":
      return {
        note: brand ? "Recruitment is not split by brand: these are every role and application." : undefined,
        figures: (<>
          <Figure value={d.recruitment.applications} before={b.recruitment.applications} days={days} label="applications received" />
          <Figure value={d.recruitment.open_roles} label="open roles, now" href="/systems/recruitment/roles" />
          <Figure value={d.recruitment.in_progress_now} label="applications in progress, now" href={systemHref("/systems/recruitment", { stage: "active" })} />
        </>),
        bars: <Bars title="Applications in the period by stage" bars={barsFrom(JOB_APPLICATION_STAGES, d.recruitment.by_stage)} hideZero empty="No applications in this period." />,
        latestTitle: "Latest applications",
        fullLinks: <Link href={systemHref("/systems/recruitment", dates)}>All applications in Recruitment</Link>,
        latest: <Table caption="Latest applications received in the period" head={["Application", "Applicant", "Role", "Stage", "Received"]} empty={none}
          rows={rows.map((r) => [<Link key="l" href={`/systems/recruitment/applications/${r.id}`}>{String(r.reference)}</Link>, String(r.full_name),
            String(r.opening_title_snapshot ?? r.interest ?? "General application"), label(JOB_APPLICATION_STAGES, String(r.stage)), formatWhen(String(r.created_at))])} />,
      };
    case "chat":
      return {
        note: brand ? "The numbers and the list are for this brand; the inbox itself shows every brand." : undefined,
        figures: (<>
          <Figure value={d.chat.conversations} before={b.chat.conversations} days={days} label="chats started" />
          <Figure value={d.chat.leads_from_chat} before={b.chat.leads_from_chat} days={days} label="leads made from chats" />
          <Figure value={d.chat.awaiting_reply_now} label="waiting for a reply, now" href="/systems/chat" />
          <Figure value={d.chat.never_answered_now} label="not answered at all, now" href="/systems/chat" />
        </>),
        latestTitle: "Latest chats",
        fullLinks: <Link href={systemHref("/systems/chat", { status: "all" })}>The live chat inbox</Link>,
        latest: <Table caption="Latest chats started in the period" head={["Chat", "Visitor", "Site", "Status", "Started"]} empty={none}
          rows={rows.map((r) => [<Link key="l" href={`/systems/chat/${r.id}`}>{String(r.reference)}</Link>, String(r.visitor_name),
            `${bn(r.brand_id)}${r.start_page ? `, ${r.start_page}` : ""}`, label(CHAT_STATUSES, String(r.status)), formatWhen(String(r.created_at))])} />,
      };
    case "csr":
      return {
        note: brand ? "Only programmes of this brand; corporate programmes are left out." : undefined,
        figures: (<>
          <Figure value={d.csr.activities_done} before={b.csr.activities_done} days={days} label="activities done" />
          <Figure value={d.csr.people_reached} before={b.csr.people_reached} days={days} label="people reached" />
          <Figure value={d.csr.planned_ahead} label="planned from today" />
        </>),
        bars: <Bars title="People reached by programme" bars={d.csr.by_programme.map((p) => ({ label: `${p.name} (${formatNumber(p.activities)})`, value: p.people }))} empty="No activities done in this period." />,
        latestTitle: "Latest activities",
        fullLinks: <Link href={systemHref("/systems/csr", dates)}>All activities in CSR</Link>,
        latest: <Table caption="Latest CSR activities in the period" head={["Programme", "Place", "Date", "Status", "People"]} empty={none}
          rows={rows.map((r) => {
            const pr = (Array.isArray(r.csr_programmes) ? r.csr_programmes[0] : r.csr_programmes) as { name?: string } | null;
            return [<Link key="l" href={`/systems/csr/${r.id}`}>{pr?.name ?? "Programme"}</Link>, String(r.place), day(String(r.activity_date)),
              r.status === "planned" ? "Planned" : "Done", formatNumber(n(r.people_reached))];
          })} />,
      };
    case "catalogue":
      return {
        figures: (<>
          <Figure value={d.catalogue.published_products} label="products on the websites, now" href={systemHref("/systems/products", { status: "published", brand })} />
          <Figure value={d.catalogue.products} label="products in all, now" href={systemHref("/systems/products", { brand })} />
          <Figure value={d.catalogue.active_stockists} label="active stockists, now" href={systemHref("/systems/stockists", { status: "active", brand })} />
          <Figure value={d.field_sales.shops_to_confirm_now} label="new shops to confirm, now" href={systemHref("/systems/stockists", { status: "inactive", brand })} />
        </>),
        latestTitle: "Latest changes",
        fullLinks: (<><Link href={systemHref("/systems/products", { brand })}>All products</Link> <Link href={systemHref("/systems/stockists", { brand })}>All stockists</Link></>),
        latest: (<>
          <h3 className="mgmt-h3">Products, last changed first</h3>
          <Table caption="Products, last changed first" head={["Product", "Brand", "On the websites", "Last changed"]} empty="No products yet."
            rows={rows.map((r) => [<Link key="l" href={`/systems/products/${r.id}`}>{String(r.name)}</Link>, bn(r.brand_id), r.is_published ? "Yes" : "No (draft)",
              formatWhen(String(r.updated_at))])} />
          <h3 className="mgmt-h3">Stockists, last changed first</h3>
          <Table caption="Stockists, last changed first" head={["Stockist", "Town", "Active", "Last changed"]} empty="No stockists yet."
            rows={(latest.rows2 ?? []).map((r) => [<Link key="l" href={`/systems/stockists/${r.id}`}>{String(r.name)}</Link>, String(r.town), r.is_active ? "Yes" : "No",
              formatWhen(String(r.updated_at))])} />
        </>),
      };
  }
}
