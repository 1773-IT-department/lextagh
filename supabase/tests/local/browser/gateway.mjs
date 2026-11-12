// Local stand in for a whole Supabase project, for browser checks of the portal against the harness database only.
// Never pointed at the real project. Start it from a HARNESS_THEN command (PGHOST and friends set):
//   node supabase/tests/local/browser/gateway.mjs <port>
//
//   /auth/v1    password sign in (every harness user's password is GATEWAY_PASSWORD, default "harness-password"),
//               refresh, user and logout, with HS256 tokens signed by a secret made at start (or ES256, see Tokens)
//   /rest/v1    a small PostgREST: select (columns, aliases, and embeds found through single column foreign keys:
//               "target(cols)" and "alias:target(cols)" many to one as an object or one to many as an array, nested,
//               "target(count)", "target!<fk name>(cols)" and "target!inner(cols)"), filters (eq, neq, is, in, gt, gte,
//               lt, lte, like, ilike, or, and on an "!inner" embed's column such as "region.slug"), order, offset and
//               limit, exact counts, single objects, insert, update, delete and rpc (JSON arrays become Postgres arrays). Every statement runs through psql as anon or as the signed in person (role
//               authenticated, request.jwt.claim.sub set), so Row Level Security, grants and triggers decide as on
//               Supabase. Enough for the portal screens, not a full PostgREST.
//   /storage/v1 the Storage stand in of ../forms/rpc_shim.mjs (upload, signed links, remove), as the caller
import { createHmac, createSign, createVerify, generateKeyPairSync, randomUUID, timingSafeEqual } from "node:crypto";
import { appendFileSync } from "node:fs";
import http from "node:http";
import { answerStorage, callerOf, psql } from "../forms/rpc_shim.mjs";

const SECRET = randomUUID();
const PASSWORD = process.env.GATEWAY_PASSWORD || "harness-password";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, prefer, accept, range, x-client-info, x-upsert, cache-control, x-metadata, accept-profile, content-profile",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS, HEAD",
  "access-control-expose-headers": "content-range",
};

// Tokens ------------------------------------------------------------------------------------------------
// HS256 by default. GATEWAY_JWT_ALG=ES256 signs with an asymmetric key instead (with a kid, public key served at
// /auth/v1/.well-known/jwks.json), like a project on Supabase's asymmetric signing keys, where getClaims checks a token
// without calling Auth.
const ES256 = process.env.GATEWAY_JWT_ALG === "ES256";
const KID = randomUUID();
const EC = ES256 ? generateKeyPairSync("ec", { namedCurve: "P-256" }) : null;
const JWKS = EC ? { keys: [{ ...EC.publicKey.export({ format: "jwk" }), kid: KID, alg: "ES256", use: "sig", key_ops: ["verify"] }] } : { keys: [] };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function sign(claims) {
  const head = b64(ES256 ? { alg: "ES256", typ: "JWT", kid: KID } : { alg: "HS256", typ: "JWT" });
  const body = b64(claims);
  const sig = ES256
    ? createSign("SHA256").update(`${head}.${body}`).sign({ key: EC.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")
    : createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
function verify(token) {
  const [h, b, s] = token.split(".");
  if (!h || !b || !s) return false;
  const got = Buffer.from(s, "base64url");
  if (ES256) {
    if (!createVerify("SHA256").update(`${h}.${b}`).verify({ key: EC.publicKey, dsaEncoding: "ieee-p1363" }, got)) return false;
  } else {
    const want = createHmac("sha256", SECRET).update(`${h}.${b}`).digest();
    if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
  }
  const claims = JSON.parse(Buffer.from(b, "base64url").toString());
  return claims.exp > Date.now() / 1000;
}

const lit = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const ident = (v) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(v)) throw Object.assign(new Error(`bad name ${v}`), { status: 400 });
  return `"${v}"`;
};

async function userJson(where) {
  const r = await psql(`select json_build_object('id', id, 'aud', 'authenticated', 'role', 'authenticated', 'email', email,
    'app_metadata', raw_app_meta_data, 'user_metadata', raw_user_meta_data, 'created_at', created_at) from auth.users where ${where};`);
  return r.code === 0 && r.out ? JSON.parse(r.out) : null;
}

function session(user) {
  const now = Math.floor(Date.now() / 1000);
  const access = sign({ sub: user.id, role: "authenticated", aud: "authenticated", email: user.email, exp: now + 3600, iat: now });
  return { access_token: access, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: `${user.id}.${randomUUID()}`, user };
}

async function answerAuth(req, url, body, send) {
  if (req.method === "POST" && url.pathname === "/auth/v1/token") {
    const grant = url.searchParams.get("grant_type");
    let user = null;
    if (grant === "password" && body.password === PASSWORD) user = await userJson(`lower(email) = lower(${lit(body.email ?? "")})`);
    if (grant === "refresh_token") {
      const id = String(body.refresh_token ?? "").split(".")[0];
      if (/^[0-9a-f-]{36}$/.test(id)) user = await userJson(`id = ${lit(id)}`);
    }
    if (!user) return send(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
    return send(200, session(user));
  }
  if (req.method === "GET" && url.pathname === "/auth/v1/user") {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1] ?? "";
    if (!verify(token)) return send(401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    const sub = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub;
    const user = await userJson(`id = ${lit(sub)}`);
    return user ? send(200, user) : send(403, { code: 403, error_code: "user_not_found", msg: "User not found" });
  }
  if (url.pathname === "/auth/v1/logout") return send(204, "");
  if (req.method === "GET" && url.pathname === "/auth/v1/.well-known/jwks.json") return send(200, JWKS);
  return send(404, { msg: "gateway: unknown auth call" });
}

// REST --------------------------------------------------------------------------------------------------
/** Splits on commas outside parentheses. */
function splitTop(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Embedded counts the portal uses: parent table and child table to the child's foreign key column. */
const EMBED_FK = { "job_openings.job_applications": "opening_id" };

// Single column foreign keys of the public schema, read once: { table, col, target, name }.
let FKS = [];
async function loadFks() {
  const r = await psql(`select coalesce(json_agg(json_build_object('table', c.relname, 'col', a.attname, 'target', f.relname, 'name', k.conname)), '[]')
    from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_class f on f.oid = k.confrelid
    join pg_namespace n on n.oid = c.relnamespace join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
    where k.contype = 'f' and n.nspname = 'public' and array_length(k.conkey, 1) = 1;`);
  if (r.code !== 0 || !r.out) throw new Error(`gateway: could not read the foreign keys: ${r.err}`);
  FKS = JSON.parse(r.out);
}

/**
 * How an embed "target" hangs off "table": many to one (table.col points at target.id) or one to many (target.col
 * points at table.id), like PostgREST's own lookup. A hint ("!<fk name>" or "!inner") picks or narrows it.
 */
function relation(table, target, hint) {
  const named = hint && hint !== "inner" ? FKS.filter((f) => f.name === hint) : FKS;
  const up = named.filter((f) => f.table === table && f.target === target);
  if (up.length === 1) return { kind: "one", col: up[0].col };
  const down = named.filter((f) => f.table === target && f.target === table);
  if (down.length === 1) return { kind: "many", col: down[0].col };
  const legacy = EMBED_FK[`${table}.${target}`];
  if (legacy) return { kind: "many", col: legacy };
  return null;
}

let aliasNo = 0;
/**
 * The select list for one table read as alias "a". Embeds (many to one as an object, one to many as an array or
 * [{ count }]) nest as deep as asked. Each "!inner" embed and its name are noted in "embeds" so filters such as
 * "region.slug=eq.x" and the inner join can be applied to the parent rows.
 */
function selectList(table, select, a = "t", embeds = null) {
  const cols = [];
  for (const raw of splitTop((select || "*").replace(/\s+/g, ""))) {
    const m = /^(?:([a-z_]+):)?([a-z_*]+)(?:!([a-z_]+))?(?:\((.*)\))?$/.exec(raw);
    if (!m) throw Object.assign(new Error(`gateway: select ${raw}`), { status: 400 });
    const [, alias, name, hint, inner] = m;
    if (inner === undefined) {
      if (name === "*") cols.push(`${a}.*`);
      else cols.push(`${a}.${ident(name)}${alias ? ` as ${ident(alias)}` : ""}`);
      continue;
    }
    const rel = relation(table, name, hint);
    if (!rel) throw Object.assign(new Error(`gateway: embed ${raw}`), { status: 400 });
    const e = `e${(aliasNo += 1)}`;
    const join = rel.kind === "one" ? `${e}.id = ${a}.${ident(rel.col)}` : `${e}.${ident(rel.col)} = ${a}.id`;
    const key = alias || name;
    if (embeds) embeds[key] = { target: name, join, e, inner: hint === "inner" };
    if (inner === "count" && rel.kind === "many") {
      cols.push(`(select json_build_array(json_build_object('count', count(*))) from public.${ident(name)} ${e} where ${join}) as ${ident(key)}`);
      continue;
    }
    const innerCols = selectList(name, inner, e);
    // /*filters:eN*/ is replaced by the embed's own filters once the query string has been read (see embedFilters).
    cols.push(rel.kind === "one"
      ? `(select row_to_json(x) from (select ${innerCols} from public.${ident(name)} ${e} where ${join}/*filters:${e}*/) x) as ${ident(key)}`
      : `(select coalesce(json_agg(x), '[]') from (select ${innerCols} from public.${ident(name)} ${e} where ${join}/*filters:${e}*/) x) as ${ident(key)}`);
  }
  return cols.join(", ");
}

function condition(col, expr, embeds = {}) {
  const m = /^(not\.)?(eq|neq|is|in|gt|gte|lt|lte|like|ilike)\.(.*)$/s.exec(expr);
  if (!m) throw Object.assign(new Error(`gateway: filter ${col}=${expr}`), { status: 400 });
  const [, not, op, val] = m;
  // A filter on an embedded column ("region.slug"): the parent rows whose embedded row matches.
  const dot = col.indexOf(".");
  const emb = dot > 0 ? embeds[col.slice(0, dot)] : null;
  if (dot > 0 && !emb) throw Object.assign(new Error(`gateway: filter ${col}`), { status: 400 });
  // PostgREST filters the parent rows by an embedded column only for "!inner" embeds; anything else is not supported here.
  if (emb && !emb.inner) throw Object.assign(new Error(`gateway: filter ${col} needs an !inner embed`), { status: 400 });
  const c = emb ? `${emb.e}.${ident(col.slice(dot + 1))}` : `t.${ident(col)}`;
  let sql;
  if (op === "is") sql = `${c} is ${{ null: "null", true: "true", false: "false" }[val] ?? "null"}`;
  else if (op === "in") sql = `${c}::text in (${splitTop(val.replace(/^\(|\)$/g, "")).map((v) => lit(v.replace(/^"|"$/g, ""))).join(", ") || "null"})`;
  else if (op === "like" || op === "ilike") sql = `${c}::text ${op} ${lit(val.replace(/\*/g, "%"))}`;
  else sql = `${c} ${{ eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" }[op]} ${lit(val)}`;
  if (not) sql = `not (${sql})`;
  if (emb) (emb.filters ??= []).push(sql);
  return emb ? `exists (select 1 from public.${ident(emb.target)} ${emb.e} where ${emb.join} and ${sql})` : sql;
}

function orGroup(expr, joiner) {
  return `(${splitTop(expr).map((part) => {
    const g = /^(and|or)\((.*)\)$/.exec(part);
    if (g) return orGroup(g[2], g[1]);
    const i = part.indexOf(".");
    return condition(part.slice(0, i), part.slice(i + 1));
  }).join(` ${joiner} `)})`;
}

/** An "!inner" embed filtered on its own column keeps only the matching embedded rows too, like PostgREST. */
function embedFilters(cols, embeds) {
  let out = cols;
  for (const emb of Object.values(embeds)) out = out.replace(`/*filters:${emb.e}*/`, (emb.filters ?? []).map((f) => ` and ${f}`).join(""));
  return out.replace(/\/\*filters:e\d+\*\//g, "");
}

function whereOf(params, embeds = {}) {
  const parts = [];
  // "!inner" embeds keep only the parent rows that have one.
  for (const emb of Object.values(embeds)) if (emb.inner) parts.push(`exists (select 1 from public.${ident(emb.target)} ${emb.e} where ${emb.join})`);
  for (const [k, v] of params) {
    if (["select", "order", "offset", "limit", "columns", "on_conflict"].includes(k)) continue;
    if (k === "or" || k === "and") parts.push(orGroup(v.replace(/^\(|\)$/g, ""), k));
    else parts.push(condition(k, v, embeds));
  }
  return parts.length ? `where ${parts.join(" and ")}` : "";
}

function orderOf(order) {
  if (!order) return "";
  return `order by ${order.split(",").map((o) => {
    const [col, dir, nulls] = o.split(".");
    return `t.${ident(col)} ${dir === "desc" ? "desc" : "asc"}${nulls === "nullsfirst" ? " nulls first" : nulls === "nullslast" ? " nulls last" : ""}`;
  }).join(", ")}`;
}

const asWho = (who) => `set role ${who.role};\nselect set_config('request.jwt.claim.sub', ${lit(who.sub)}, false) \\g /dev/null\n`;

function pgError(err, send) {
  const m = /ERROR:\s+([0-9A-Z]{5}):\s+([^\n]*)/.exec(err);
  const code = m?.[1] ?? "XX000";
  const status = code === "42501" ? 403 : code === "PT429" ? 429 : code.startsWith("23") ? 409 : code === "XX000" ? 500 : 400;
  return send(status, { code, message: m?.[2] ?? err.split("\n")[0], details: null, hint: null });
}

const procCache = new Map();
async function procInfo(name) {
  if (!procCache.has(name)) {
    const r = await psql(`select json_build_object('set', p.proretset, 'void', p.prorettype = 'void'::regtype, 'args', coalesce((select json_agg(json_build_object('name', a.n, 'type', format_type(a.t, null)) order by a.o)
      from unnest(p.proargnames[1:p.pronargs], p.proargtypes::oid[]) with ordinality as a(n, t, o)), '[]'))
      from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname = ${lit(name)} limit 1;`);
    procCache.set(name, r.code === 0 && r.out ? JSON.parse(r.out) : null);
  }
  return procCache.get(name);
}

async function answerRest(req, url, body, send, who) {
  const m = /^\/rest\/v1\/(rpc\/)?([a-z_]+)$/.exec(url.pathname);
  if (!m) return send(404, { code: "PGRST", message: "gateway: unknown path" });
  const [, rpc, name] = m;
  const params = url.searchParams;
  const prefer = req.headers.prefer ?? "";
  const wantObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");

  if (rpc) {
    const info = await procInfo(name);
    if (!info) return send(404, { code: "PGRST202", message: "function not found" });
    const args = info.args.filter((a) => body && a.name in body)
      .map((a) => {
        const v = body[a.name];
        // A JSON array for an array argument (uuid[], text[]) becomes a Postgres array, as PostgREST does.
        if (Array.isArray(v) && a.type.endsWith("[]")) return `${ident(a.name)} => array[${v.map((x) => (x === null ? "null" : lit(typeof x === "object" ? JSON.stringify(x) : x))).join(", ")}]::${a.type}`;
        return `${ident(a.name)} => ${v === null ? "null" : lit(typeof v === "object" ? JSON.stringify(v) : v)}::${a.type}`;
      });
    const call = `public.${ident(name)}(${args.join(", ")})`;
    const sql = info.set ? `select coalesce(json_agg(t), '[]') from ${call} t;`
      : info.void ? `select ${call} \\g /dev/null\nselect 'null';` : `select coalesce(to_json(${call}), 'null'::json);`;
    const r = await psql(asWho(who) + sql);
    return r.code === 0 ? send(200, JSON.parse(r.out || "null")) : pgError(r.err, send);
  }

  const table = `public.${ident(name)}`;
  const embeds = {};
  const selected = selectList(name, params.get("select"), "t", embeds);
  const where = whereOf(params, embeds);
  const cols = embedFilters(selected, embeds);
  let sql;
  let countSql = null;
  if (req.method === "GET" || req.method === "HEAD") {
    const limit = params.get("limit") ? `limit ${Number(params.get("limit"))}` : "";
    const offset = params.get("offset") ? `offset ${Number(params.get("offset"))}` : "";
    sql = `select coalesce(json_agg(x), '[]') from (select ${cols} from ${table} t ${where} ${orderOf(params.get("order"))} ${limit} ${offset}) x;`;
    if (prefer.includes("count=exact")) countSql = `select count(*) from ${table} t ${where};`;
  } else if (req.method === "POST") {
    const rows = Array.isArray(body) ? body : [body];
    const keys = Object.keys(rows[0] ?? {});
    sql = `with ins as (insert into ${table} (${keys.map(ident).join(", ")}) select ${keys.map((k) => `r.${ident(k)}`).join(", ")}
      from jsonb_populate_recordset(null::${table}, ${lit(JSON.stringify(rows))}::jsonb) r returning *)
      select coalesce(json_agg(x), '[]') from (select ${cols} from ins t) x;`;
  } else if (req.method === "PATCH") {
    const keys = Object.keys(body ?? {});
    sql = `with upd as (update ${table} t set ${keys.map((k) => `${ident(k)} = r.${ident(k)}`).join(", ")}
      from jsonb_populate_record(null::${table}, ${lit(JSON.stringify(body))}::jsonb) r ${where} returning t.*)
      select coalesce(json_agg(x), '[]') from (select ${cols} from upd t) x;`;
  } else if (req.method === "DELETE") {
    sql = `with del as (delete from ${table} t ${where} returning t.*) select coalesce(json_agg(x), '[]') from (select ${cols} from del t) x;`;
  } else return send(405, { message: "method" });

  const r = await psql(asWho(who) + sql);
  if (r.code !== 0) return pgError(r.err, send);
  const rows = JSON.parse(r.out || "[]");
  const headers = {};
  if (countSql) {
    const c = await psql(asWho(who) + countSql);
    if (c.code !== 0) return pgError(c.err, send);
    const from = Number(params.get("offset") ?? 0);
    headers["content-range"] = `${rows.length ? `${from}-${from + rows.length - 1}` : "*"}/${c.out}`;
  }
  if (req.method === "HEAD") return send(200, "", headers);
  if (req.method !== "GET" && !prefer.includes("return=representation")) return send(204, "", headers);
  if (wantObject) {
    if (rows.length !== 1) return send(406, { code: "PGRST116", message: `JSON object requested, multiple (or no) rows returned`, details: `${rows.length} rows` });
    return send(200, rows[0], headers);
  }
  return send(200, rows, headers);
}

// Server ------------------------------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const send = (status, payload, headers = {}) => {
    res.writeHead(status, { "content-type": "application/json", ...CORS, ...headers });
    res.end(status === 204 || payload === "" ? undefined : Buffer.isBuffer(payload) ? payload : JSON.stringify(payload));
  };
  // GATEWAY_LOG=<file> writes one line per request (method and path), to count Supabase calls per portal screen.
  // GATEWAY_DELAY_MS=<ms> holds every answer that long, to stand in for the distance to the real project.
  if (process.env.GATEWAY_LOG) appendFileSync(process.env.GATEWAY_LOG, `${req.method} ${(req.url ?? "").split("?")[0]}\n`);
  if (Number(process.env.GATEWAY_DELAY_MS) > 0) await new Promise((r) => setTimeout(r, Number(process.env.GATEWAY_DELAY_MS)));
  try {
    if (req.method === "OPTIONS") return send(204, "");
    const url = new URL(req.url ?? "/", "http://gateway");
    if (url.pathname.startsWith("/storage/v1/")) {
      const who = callerOf(req.headers, verify);
      if (!who) return send(400, { statusCode: "403", error: "Unauthorized", message: "invalid token" });
      return await answerStorage(req, url, send, who);
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname.startsWith("/auth/v1/")) return await answerAuth(req, url, body, send);
    if (url.pathname.startsWith("/rest/v1/")) {
      const who = callerOf(req.headers, verify);
      if (!who) return send(401, { code: "PGRST301", message: "JWT invalid" });
      return await answerRest(req, url, body, send, who);
    }
    send(404, { message: "gateway: unknown path" });
  } catch (e) {
    send(e.status ?? 500, { code: "XX000", message: e instanceof Error ? e.message : String(e) });
  }
});

const port = Number(process.argv[2] ?? 54401);
await loadFks();
server.listen(port, "127.0.0.1", () => console.log(`gateway listening on http://127.0.0.1:${port}`));
