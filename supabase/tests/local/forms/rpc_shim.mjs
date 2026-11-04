// A tiny stand in for Supabase's REST API (PostgREST), for local tests only. It answers the two website intake
// calls the Lexta site makes, POST /rest/v1/rpc/submit_website_enquiry and /rest/v1/rpc/submit_complaint, by running
// the real database functions in the local harness database as the anon role, and answers errors the way PostgREST
// does ({ code, message } with HTTP 400 or 429). Connection settings come from PGHOST, PGPORT, PGUSER, PGDATABASE.
// It also answers the three website reads (Our Brands products, Where to Buy regions and stockists), see READS below.
// Never pointed at the real Supabase project.
import { spawn } from "node:child_process";
import http from "node:http";

const CALLS = {
  submit_website_enquiry: { args: ["form", "payload"], sql: "select public.submit_website_enquiry(:'form', :'payload'::jsonb);" },
  submit_complaint: { args: ["payload"], sql: "select public.submit_complaint(:'payload'::jsonb);" },
};

/** Runs SQL through psql. vars become psql variables (quoted safely with :'name'). */
export function psql(sql, vars = {}) {
  return new Promise((resolve) => {
    const argv = ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"];
    for (const [k, v] of Object.entries(vars)) argv.push("-v", `${k}=${v}`);
    const child = spawn("psql", argv, { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, PGCLIENTENCODING: "UTF8" } });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim() }));
    child.stdin.end("\\set VERBOSITY verbose\n" + sql + "\n");
  });
}

// Website reads (item 20). Each one accepts only the exact query the helper in packages/db sends, so a change to a
// helper's select fails the tests loudly instead of being half emulated. The SQL runs as anon, so Row Level Security
// and the column grants decide what comes back, exactly as through PostgREST. Embedded rows use PostgREST's shapes.
const strip = (v) => v.replace(/\s+/g, "");
const READS = {
  products: {
    select: "*,brand:brands!inner(slug),skus:product_skus(*),images:product_images(*)",
    filters: { "brand.slug": /^eq\.([a-z0-9-]+)$/, is_published: /^eq\.(true)$/ },
    order: "sort_order.asc,name.asc",
    sql: `select coalesce(json_agg(row_to_json(x) order by x.sort_order, x.name), '[]'::json) from (
      select p.*, json_build_object('slug', b.slug) as brand,
        coalesce((select json_agg(s) from public.product_skus s where s.product_id = p.id), '[]'::json) as skus,
        coalesce((select json_agg(i) from public.product_images i where i.product_id = p.id), '[]'::json) as images
      from public.products p join public.brands b on b.id = p.brand_id
      where b.slug = :'brand_slug' and p.is_published = :'is_published'::boolean) x;`,
    vars: (f) => ({ brand_slug: f["brand.slug"], is_published: f.is_published }),
  },
  regions: {
    select: "slug,name,is_in_ghana,sort_order",
    filters: {},
    order: "sort_order.asc,name.asc",
    sql: `select coalesce(json_agg(r order by r.sort_order, r.name), '[]'::json)
      from (select slug, name, is_in_ghana, sort_order from public.regions) r;`,
    vars: () => ({}),
  },
  stockists: {
    select:
      "id,name,outlet_type,town,address,phone,latitude,longitude,opening_hours," +
      "region:regions!inner(slug,name,is_in_ghana,sort_order),stockist_brands(brand:brands(slug,name))",
    filters: { is_active: /^eq\.(true)$/, "region.slug": /^eq\.([a-z0-9-]+)$/ },
    optional: ["region.slug"],
    order: "id.asc",
    paged: true,
    sql: `select coalesce(json_agg(row_to_json(x) order by x.id), '[]'::json) from (
      select s.id, s.name, s.outlet_type, s.town, s.address, s.phone, s.latitude, s.longitude, s.opening_hours,
        json_build_object('slug', r.slug, 'name', r.name, 'is_in_ghana', r.is_in_ghana, 'sort_order', r.sort_order) as region,
        coalesce((select json_agg(json_build_object('brand',
            (select json_build_object('slug', b.slug, 'name', b.name) from public.brands b where b.id = sb.brand_id)))
          from public.stockist_brands sb where sb.stockist_id = s.id), '[]'::json) as stockist_brands
      from public.stockists s join public.regions r on r.id = s.region_id
      where s.is_active = :'is_active'::boolean and (:'region' = '' or r.slug = :'region')
      order by s.id offset :'offset'::int limit :'limit'::int) x;`,
    vars: (f, page) => ({ is_active: f.is_active, region: f["region.slug"] ?? "", ...page }),
  },
};

/** Answers GET /rest/v1/<table>?... for the reads above, or explains why the query is not one the shim knows. */
async function answerRead(url, send) {
  const m = /^\/rest\/v1\/(\w+)$/.exec(url.pathname);
  const read = m && READS[m[1]];
  if (!read) return send(404, { code: "PGRST205", message: "shim: unknown table" });
  const params = new URLSearchParams(url.search);
  if (strip(params.get("select") ?? "") !== read.select) return send(400, { code: "PGRST100", message: `shim: unexpected select ${params.get("select")}` });
  if ((params.get("order") ?? "") !== read.order) return send(400, { code: "PGRST100", message: `shim: unexpected order ${params.get("order")}` });
  const filters = {};
  for (const [key, value] of params) {
    if (["select", "order", "offset", "limit"].includes(key)) continue;
    const match = read.filters[key]?.exec(value);
    if (!match) return send(400, { code: "PGRST100", message: `shim: unexpected filter ${key}=${value}` });
    filters[key] = match[1];
  }
  for (const key of Object.keys(read.filters)) {
    if (!(key in filters) && !(read.optional ?? []).includes(key)) return send(400, { code: "PGRST100", message: `shim: missing filter ${key}` });
  }
  const page = { offset: String(Number(params.get("offset") ?? 0)), limit: String(Number(params.get("limit") ?? 100000)) };
  if (read.paged && !params.has("limit")) return send(400, { code: "PGRST100", message: "shim: expected a paged read" });
  const r = await psql("set role anon;\n" + read.sql, read.vars(filters, page));
  if (r.code !== 0) return send(500, { code: "XX000", message: r.err.split("\n")[0] });
  res200(send, r.out);
}
const res200 = (send, body) => send(200, JSON.parse(body));

/** Every request the shim answered (method and path with query), for tests that check caching. */
export const requestLog = [];

export function startShim(port = 0) {
  const server = http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    requestLog.push(`${req.method} ${req.url}`);
    if (req.method === "GET" || req.method === "HEAD") {
      if (!req.headers.apikey) return send(401, { code: "PGRST301", message: "no api key" });
      return answerRead(new URL(req.url ?? "/", "http://shim"), send);
    }
    const m = /^\/rest\/v1\/rpc\/(\w+)$/.exec((req.url ?? "").split("?")[0]);
    const call = m && CALLS[m[1]];
    if (req.method !== "POST" || !call) return send(404, { code: "PGRST202", message: "not found" });
    if (!req.headers.apikey) return send(401, { code: "PGRST301", message: "no api key" });
    let raw = "";
    for await (const chunk of req) raw += chunk;
    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return send(400, { code: "PGRST102", message: "invalid body" });
    }
    const vars = {};
    for (const a of call.args) vars[a] = typeof body[a] === "string" ? body[a] : JSON.stringify(body[a] ?? null);
    // SHIM_DELAY_MS slows answers down so a browser check can see the "Sending..." state.
    const delay = Number(process.env.SHIM_DELAY_MS ?? 0);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    const r = await psql("set role anon;\n" + call.sql, vars);
    if (r.code === 0) return send(200, r.out);
    const e = /ERROR:\s+([0-9A-Z]{5}):\s+([^\n]*)/.exec(r.err);
    const code = e?.[1] ?? "XX000";
    send(code === "PT429" ? 429 : code === "XX000" ? 500 : 400, { code, message: e?.[2] ?? "error", details: null, hint: null });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

// Run directly: node rpc_shim.mjs <port>  (used for the browser check)
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await startShim(Number(process.argv[2] ?? 54400));
  console.log(`rpc shim listening on http://127.0.0.1:${server.address().port}`);
}
