// A tiny stand in for Supabase's REST API (PostgREST), for local tests only. It answers the three website intake
// calls the Lexta site makes, POST /rest/v1/rpc/submit_website_enquiry, /rest/v1/rpc/submit_complaint and
// /rest/v1/rpc/submit_job_application, by running the real database functions in the local harness database as the
// anon role, and answers errors the way PostgREST does ({ code, message } with HTTP 400 or 429). Connection settings
// come from PGHOST, PGPORT, PGUSER, PGDATABASE.
// It also answers the website reads (Our Brands products, Where to Buy regions and stockists, Careers open roles),
// see READS below, and a small part of Supabase Storage (upload, signed links, remove), see answerStorage below.
// Never pointed at the real Supabase project.
import { createHmac, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CALLS = {
  submit_website_enquiry: { args: ["form", "payload"], sql: "select public.submit_website_enquiry(:'form', :'payload'::jsonb);" },
  submit_complaint: { args: ["payload"], sql: "select public.submit_complaint(:'payload'::jsonb);" },
  submit_job_application: { args: ["payload"], sql: "select public.submit_job_application(:'payload'::jsonb);" },
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
  job_openings: {
    select: "reference,title,department,location,employment_type,level,summary,duties,requirements,opens_at,closes_at,urgent,sort",
    filters: { status: /^eq\.(open)$/ },
    order: "sort.asc,opens_at.desc,reference.asc",
    sql: `select coalesce(json_agg(row_to_json(x) order by x.sort, x.opens_at desc, x.reference), '[]'::json) from (
      select reference, title, department, location, employment_type, level, summary, duties, requirements, opens_at, closes_at, urgent, sort
      from public.job_openings where status = :'status') x;`,
    vars: (f) => ({ status: f.status }),
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

// Storage --------------------------------------------------------------------------------------------------
// Enough of the Supabase Storage API for the CV upload and the portal's signed links: POST /storage/v1/object/<bucket>/
// <path> (raw body or supabase-js multipart), POST /storage/v1/object/sign/<bucket>/<path>, GET the signed link, and
// DELETE /storage/v1/object/<bucket> with { prefixes }. Like the real service it checks the bucket's size and type
// limits itself, writes the storage.objects row as the caller (anon, or the signed in person of a JWT) so the real
// storage policies decide, and records { size, mimetype } in the metadata. Files are kept in SHIM_STORAGE_DIR.
const STORAGE_DIR = process.env.SHIM_STORAGE_DIR || path.join(os.tmpdir(), `lexta-shim-storage-${process.pid}`);
const SIGN_SECRET = randomUUID();
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-upsert, cache-control, x-client-info, x-metadata",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/** Who is calling: anon for a publishable key, or the role and person of a JWT (checked with verify, if given). */
export function callerOf(headers, verify) {
  const token = /^Bearer (.+)$/.exec(headers.authorization ?? "")?.[1] ?? "";
  const parts = token.split(".");
  if (parts.length !== 3) return { role: "anon", sub: "" };
  if (verify && !verify(token)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return { role: claims.role === "authenticated" ? "authenticated" : "anon", sub: claims.sub ?? "" };
  } catch {
    return null;
  }
}

const asCaller = (who) => `set role ${who.role === "authenticated" ? "authenticated" : "anon"};\n` +
  `select set_config('request.jwt.claim.sub', ${who.sub ? `'${who.sub.replace(/[^0-9a-f-]/g, "")}'` : "''"}, false) \\g /dev/null\n`;
const storageError = (send, http, code, error, message) => send(http, { statusCode: String(code), error, message });
const fileOn = (bucket, name) => path.join(STORAGE_DIR, bucket, ...name.split("/").map((p) => p.replace(/^\.+$/, "_")));

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export async function answerStorage(req, url, send, who) {
  const p = decodeURIComponent(url.pathname);
  if (req.method === "POST" && p.startsWith("/storage/v1/object/sign/")) {
    const [bucket, ...rest] = p.slice("/storage/v1/object/sign/".length).split("/");
    const name = rest.join("/");
    const r = await psql(asCaller(who) + "select count(*) from storage.objects where bucket_id = :'bucket' and name = :'name';", { bucket, name });
    if (r.code !== 0 || r.out !== "1") return storageError(send, 400, 404, "not_found", "Object not found");
    const token = createHmac("sha256", SIGN_SECRET).update(`${bucket}/${name}`).digest("base64url");
    return send(200, { signedURL: `/object/sign/${bucket}/${rest.map(encodeURIComponent).join("/")}?token=${token}` });
  }
  if (req.method === "GET" && p.startsWith("/storage/v1/object/sign/")) {
    const [bucket, ...rest] = p.slice("/storage/v1/object/sign/".length).split("/");
    const name = rest.join("/");
    const token = createHmac("sha256", SIGN_SECRET).update(`${bucket}/${name}`).digest("base64url");
    if (url.searchParams.get("token") !== token) return storageError(send, 400, 400, "InvalidSignature", "Invalid signature");
    const meta = await psql("select metadata ->> 'mimetype' from storage.objects where bucket_id = :'bucket' and name = :'name';", { bucket, name });
    let bytes;
    try { bytes = readFileSync(fileOn(bucket, name)); } catch { return storageError(send, 400, 404, "not_found", "Object not found"); }
    const download = url.searchParams.get("download");
    return send(200, bytes, {
      "content-type": meta.out || "application/octet-stream",
      ...(download !== null ? { "content-disposition": `attachment; filename="${(download || rest.at(-1)).replace(/"/g, "")}"` } : {}),
    });
  }
  if (req.method === "POST" && p.startsWith("/storage/v1/object/")) {
    const [bucket, ...rest] = p.slice("/storage/v1/object/".length).split("/");
    const name = rest.join("/");
    const raw = await readBody(req);
    let bytes = raw;
    let type = (req.headers["content-type"] ?? "").split(";")[0].trim();
    if (type === "multipart/form-data") {
      const form = await new Request("http://shim", { method: "POST", headers: { "content-type": req.headers["content-type"] }, body: raw }).formData();
      const file = [...form.values()].find((v) => typeof v === "object");
      if (!file) return storageError(send, 400, 400, "InvalidRequest", "no file");
      bytes = Buffer.from(await file.arrayBuffer());
      type = file.type || "application/octet-stream";
    }
    const b = await psql("select coalesce(file_size_limit, 0) || '|' || coalesce(array_to_string(allowed_mime_types, ','), '') from storage.buckets where id = :'bucket';", { bucket });
    if (b.code !== 0 || !b.out) return storageError(send, 400, 404, "Bucket not found", "Bucket not found");
    const [limit, types] = b.out.split("|");
    if (Number(limit) > 0 && bytes.length > Number(limit)) return storageError(send, 413, 413, "Payload too large", "The object exceeded the maximum allowed size");
    if (types && !types.split(",").includes(type)) return storageError(send, 400, 415, "invalid_mime_type", `mime type ${type} is not supported`);
    const meta = JSON.stringify({ size: bytes.length, mimetype: type });
    // No RETURNING: like Storage, uploading needs only the insert policy (RETURNING would also need a select policy).
    const id = randomUUID();
    const r = await psql(asCaller(who) + "insert into storage.objects (id, bucket_id, name, owner, metadata) values (:'id'::uuid, :'bucket', :'name', nullif(:'sub', '')::uuid, :'meta'::jsonb);",
      { id, bucket, name, sub: who.sub, meta });
    if (r.code !== 0) {
      if (/duplicate key/.test(r.err)) return storageError(send, 400, 409, "Duplicate", "The resource already exists");
      return storageError(send, 400, 403, "Unauthorized", "new row violates row-level security policy");
    }
    mkdirSync(path.dirname(fileOn(bucket, name)), { recursive: true });
    writeFileSync(fileOn(bucket, name), bytes);
    return send(200, { Id: id, Key: `${bucket}/${name}` });
  }
  if (req.method === "DELETE" && /^\/storage\/v1\/object\/[^/]+$/.test(p)) {
    const bucket = p.split("/").pop();
    let prefixes = [];
    try { prefixes = JSON.parse((await readBody(req)).toString() || "{}").prefixes ?? []; } catch { /* empty */ }
    const r = await psql(asCaller(who) + "with d as (delete from storage.objects where bucket_id = :'bucket' and name in (select jsonb_array_elements_text(:'names'::jsonb)) returning name, bucket_id) select coalesce(json_agg(json_build_object('name', name, 'bucket_id', bucket_id)), '[]') from d;",
      { bucket, names: JSON.stringify(prefixes) });
    if (r.code !== 0) return storageError(send, 400, 400, "error", r.err.split("\n")[0]);
    const removed = JSON.parse(r.out);
    for (const o of removed) rmSync(fileOn(bucket, o.name), { force: true });
    return send(200, removed);
  }
  return storageError(send, 404, 404, "not_found", "shim: unknown storage call");
}

/** Every request the shim answered (method and path with query), for tests that check caching. */
export const requestLog = [];

export function startShim(port = 0) {
  const server = http.createServer(async (req, res) => {
    const send = (status, body, headers) => {
      res.writeHead(status, { "content-type": "application/json", ...CORS, ...headers });
      res.end(status === 204 ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body));
    };
    requestLog.push(`${req.method} ${req.url}`);
    if (req.method === "OPTIONS") return send(204, "");
    if ((req.url ?? "").startsWith("/storage/v1/")) {
      // SHIM_DELAY_MS slows answers down so a browser check can see the "Uploading" state.
      const delay = Number(process.env.SHIM_DELAY_MS ?? 0);
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      const who = callerOf(req.headers);
      if (!who) return send(400, { statusCode: "403", error: "Unauthorized", message: "invalid token" });
      return answerStorage(req, new URL(req.url, "http://shim"), send, who);
    }
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
