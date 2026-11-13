import Link from "next/link";
import Figure from "@/components/management/Figure";
import FeedRow from "@/components/management/FeedRow";
import ManagementHeader from "@/components/management/ManagementHeader";
import MiniChart from "@/components/management/MiniChart";
import { formatNumber, systemHref } from "@/lib/dashboard";
import { MANAGEMENT_BASE, managementHref, NO_MANAGEMENT_ACCESS, plural, presentFeed, type FeedPage } from "@/lib/management";
import { loadNumbers, loadSeries, managementContext } from "@/lib/management-data";

export const metadata = { title: "Management overview | Lexta Business System" };

type Search = Partial<Record<"range" | "from" | "to" | "brand", string>>;

export default async function ManagementOverview({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const ctx = await managementContext(params);
  if (!ctx) return (<><h1>Management overview</h1><p className="small">{NO_MANAGEMENT_ACCESS}</p></>);
  const { supabase, f, brands, prev } = ctx;
  const brand = f.brand || undefined;

  const [numbers, series, feedRes, firstStage] = await Promise.all([
    loadNumbers(ctx),
    loadSeries(ctx),
    supabase.rpc("management_activity", { p_from: f.from, p_to: f.to, p_brand: f.brand || null, p_limit: 8 }),
    // Applications still at the first stage, now (recruitment has no brand).
    supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("stage", "new"),
  ]);
  if (feedRes.error) console.error("[management] latest activity failed", feedRes.error);
  const feed = feedRes.error ? null : (feedRes.data as FeedPage);

  const header = (
    <ManagementHeader path={MANAGEMENT_BASE} title="Management overview" f={f} brands={brands}
      intro="What is happening across every system, read only. Open any number or row to work on it in its own system." />
  );
  if (!numbers) {
    return (<>{header}<div className="alert error" role="alert">We could not load the overview. Please refresh the page. If it keeps happening, tell the IT team.</div></>);
  }
  const { now: d, before: b } = numbers;
  const days = prev.days;

  const alerts = [
    { n: d.complaints.overdue_now, text: plural(d.complaints.overdue_now, "complaint overdue", "complaints overdue"), href: systemHref("/systems/complaints", { status: "open", overdue: "1", brand }) },
    { n: d.chat.awaiting_reply_now, text: plural(d.chat.awaiting_reply_now, "chat waiting for a reply", "chats waiting for a reply"), href: systemHref("/systems/chat", { status: "open" }),
      note: brand ? "the inbox shows every brand" : undefined },
    { n: d.orders.to_confirm_now, text: plural(d.orders.to_confirm_now, "order waiting to be confirmed", "orders waiting to be confirmed"), href: systemHref("/systems/orders", { status: "submitted", brand }) },
    { n: d.crm.unassigned_website, text: plural(d.crm.unassigned_website, "website lead with no owner", "website leads with no owner"), href: systemHref("/systems/crm/leads", { owner: "unassigned", brand }),
      note: "the list shows every unassigned lead" },
    { n: d.field_sales.shops_to_confirm_now, text: plural(d.field_sales.shops_to_confirm_now, "new shop waiting for confirmation", "new shops waiting for confirmation"), href: systemHref("/systems/stockists", { status: "inactive", brand }) },
    ...(firstStage.error || firstStage.count === null ? [] : [{ n: firstStage.count, text: plural(firstStage.count, "application waiting at the first stage (New)", "applications waiting at the first stage (New)"), href: systemHref("/systems/recruitment", { stage: "new" }),
      note: brand ? "every brand" : undefined }]),
  ].filter((a) => Number(a.n) > 0);

  const dates = { from: f.from, to: f.to };
  const tab = (slug: string) => managementHref(`${MANAGEMENT_BASE}/${slug}`, f);

  return (
    <>
      {header}

      <section className="panel mgmt-attention" aria-labelledby="mgmt_attention">
        <h2 id="mgmt_attention">Needs attention</h2>
        <p className="small">As of now, whatever the period.</p>
        {alerts.length === 0 ? (
          <p className="mgmt-calm">Nothing needs attention right now.</p>
        ) : (
          <ul className="mgmt-alerts">
            {alerts.map((a) => (
              <li key={a.text}>
                <Link href={a.href}><b>{formatNumber(a.n)}</b> <span>{a.text}{a.note ? ` (${a.note})` : ""}</span></Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mgmt_figures">
        <h2 id="mgmt_figures" className="mgmt-h2">Key figures</h2>
        <p className="small">Each number counts what happened in the period, compared with the {days === 1 ? "day" : `${days} days`} before it.</p>
        <div className="mgmt-systems">
          <SystemCard title="Orders" href={tab("orders")}>
            <Figure value={d.orders.orders} before={b.orders.orders} days={days} label="orders submitted" href={systemHref("/systems/orders", { ...dates, brand })} />
            <Figure value={d.orders.packs} before={b.orders.packs} days={days} label="packs ordered (not cancelled)" href={systemHref("/systems/orders", { ...dates, brand })} />
          </SystemCard>
          <SystemCard title="Field sales" href={tab("field-sales")}>
            <Figure value={d.field_sales.visits} before={b.field_sales.visits} days={days} label="shop visits" href={systemHref("/systems/field-sales", { ...dates, brand })} />
            <Figure value={d.field_sales.new_shops_in_period} before={b.field_sales.new_shops_in_period} days={days} label="new shops found" href={systemHref("/systems/field-sales", { ...dates, brand })} />
          </SystemCard>
          <SystemCard title="CRM" href={tab("crm")}>
            <Figure value={d.crm.new_leads} before={b.crm.new_leads} days={days} label="new leads" href={systemHref("/systems/crm/leads", { stage: "all", sort: "newest", brand })} />
            <Figure value={d.crm.won} before={b.crm.won} days={days} label="leads won" href={systemHref("/systems/crm/leads", { stage: "won", brand })} />
          </SystemCard>
          <SystemCard title="Complaints" href={tab("complaints")}>
            <Figure value={d.complaints.opened} before={b.complaints.opened} days={days} label="complaints received" href={systemHref("/systems/complaints", { status: "all", brand })} />
            <Figure value={d.complaints.closed} before={b.complaints.closed} days={days} label="complaints closed" href={systemHref("/systems/complaints", { status: "closed", brand })} />
          </SystemCard>
          <SystemCard title="Recruitment" href={tab("recruitment")} note={brand ? "Every brand: recruitment is not split by brand." : undefined}>
            <Figure value={d.recruitment.applications} before={b.recruitment.applications} days={days} label="applications received" href={systemHref("/systems/recruitment", dates)} />
            <Figure value={d.recruitment.open_roles} label="open roles, now" href="/systems/recruitment/roles" />
          </SystemCard>
          <SystemCard title="Live chat" href={tab("chat")}>
            <Figure value={d.chat.conversations} before={b.chat.conversations} days={days} label="chats started" href={systemHref("/systems/chat", { status: "all" })} />
            <Figure value={d.chat.leads_from_chat} before={b.chat.leads_from_chat} days={days} label="leads made from chats" href={systemHref("/systems/crm/leads", { stage: "all", source: "website_live_chat", brand })} />
          </SystemCard>
          <SystemCard title="Products and stockists" href={tab("catalogue")}>
            <Figure value={d.catalogue.published_products} label="products on the websites, now" href={systemHref("/systems/products", { status: "published", brand })} />
            <Figure value={d.catalogue.active_stockists} label="active stockists, now" href={systemHref("/systems/stockists", { status: "active", brand })} />
          </SystemCard>
          <SystemCard title="CSR" href={tab("csr")}>
            <Figure value={d.csr.activities_done} before={b.csr.activities_done} days={days} label="activities done" href={systemHref("/systems/csr", { ...dates, status: "done" })} />
            <Figure value={d.csr.people_reached} before={b.csr.people_reached} days={days} label="people reached" href={systemHref("/systems/csr", { ...dates, status: "done" })} />
          </SystemCard>
        </div>
      </section>

      <section aria-labelledby="mgmt_charts">
        <h2 id="mgmt_charts" className="mgmt-h2">Over time</h2>
        {!series ? (
          <div className="alert error" role="alert">We could not load the charts. Please refresh the page.</div>
        ) : (
          <>
            <p className="small">One column a {series.unit}. Point at a column, or open &quot;Show the numbers&quot;, to read it.</p>
            <div className="mgmt-charts">
              <MiniChart id="c_orders" title="Orders submitted" series="orders" unitWord="orders" unitOne="order" data={series} />
              <MiniChart id="c_leads" title="New leads" series="leads" unitWord="leads" unitOne="lead" data={series} />
              <MiniChart id="c_complaints" title="Complaints received" series="complaints" unitWord="complaints" unitOne="complaint" data={series} />
              <MiniChart id="c_visits" title="Shop visits" series="visits" unitWord="visits" unitOne="visit" data={series} />
            </div>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="mgmt_latest">
        <div className="dash-tile-head">
          <h2 id="mgmt_latest">Latest activity</h2>
          <Link className="dash-open" href={managementHref(`${MANAGEMENT_BASE}/activity`, f)}>See all activity</Link>
        </div>
        {!feed ? (
          <div className="alert error" role="alert">We could not load the latest activity.</div>
        ) : feed.items.length === 0 ? (
          <p className="small">Nothing has been recorded in this period{brand ? " for this brand" : ""} yet.</p>
        ) : (
          <ol className="mgmt-feed" aria-label="Latest activity, newest first">
            {presentFeed(feed.items, ctx.brandNames).map((i) => <FeedRow key={i.key} item={i} />)}
          </ol>
        )}
      </section>
    </>
  );
}

function SystemCard({ title, href, note, children }: { title: string; href: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="panel mgmt-system">
      <div className="dash-tile-head">
        <h3><Link href={href}>{title}</Link></h3>
        <Link className="dash-open" href={href} aria-label={`More about ${title}`}>More</Link>
      </div>
      {note && <p className="small dash-note">{note}</p>}
      <div className="mgmt-figs">{children}</div>
    </div>
  );
}
