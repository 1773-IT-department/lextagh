// Local stand in for a whole Supabase project, for browser checks of the portal against the harness database only.
// Never pointed at the real project. Start it from a HARNESS_THEN command (PGHOST and friends set):
//   node supabase/tests/local/browser/gateway.mjs <port>
//
//   /auth/v1    password sign in (every harness user's password is GATEWAY_PASSWORD, default "harness-password"),
//               refresh, user and logout, with HS256 tokens signed by a secret made at start
//   /rest/v1    a small PostgREST: select (columns, aliases, "rel(count)" embeds), filters (eq, neq, is, in, gt, gte,
//               lt, lte, like, ilike, or), order, offset and limit, exact counts, single objects, insert, update,
//               delete and rpc. Every statement runs through psql as anon or as the signed in person (role
//               authenticated, request.jwt.claim.sub set), so Row Level Security, grants and triggers decide as on
//               Supabase. Enough for the portal screens, not a full PostgREST.
//   /storage/v1 the Storage stand in of ../forms/rpc_shim.mjs (upload, signed links, remove), as the caller
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import http from "node:http";
import { answerStorage, callerOf, psql } from "../forms/rpc_shim.mjs";

const SECRET = randomUUID();
const PASSWORD = process.env.GATEWAY_PASSWORD || "harness-password";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, prefer, accept, range, x-client-info, x-upsert, accept-profile, content-profile",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS, HEAD",
  "access-control-expose-headers": "content-range",
};

// Tokens ------------------------------------------------------------------------------------------------
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function sign(claims) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(claims);
  return `${head}.${body}.${createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url")}`;
}
function verify(token) {
  const [h, b, s] = token.split(".");
  if (!h || !b || !s) return false;
  const want = createHmac("sha256", SECRET).update(`${h}.${b}`).digest();
  const got = Buffer.from(s, "base64url");
  if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
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

function selectList(table, select) {
  const cols = [];
  for (const raw of splitTop((select || "*").replace(/\s+/g, ""))) {
    const m = /^(?:([a-z_]+):)?([a-z_*]+)(?:\((.*)\))?$/.exec(raw);
    if (!m) throw Object.assign(new Error(`gateway: select ${raw}`), { status: 400 });
    const [, alias, name, inner] = m;
    if (inner !== undefined) {
      const fk = EMBED_FK[`${table}.${name}`];
      if (!fk || inner !== "count") throw Object.assign(new Error(`gateway: embed ${raw}`), { status: 400 });
      cols.push(`(select json_build_array(json_build_object('count', count(*))) from public.${ident(name)} e where e.${ident(fk)} = t.id) as ${ident(alias || name)}`);
    } else if (name === "*") cols.push("t.*");
    else cols.push(`t.${ident(name)}${alias ? ` as ${ident(alias)}` : ""}`);
  }
  return cols.join(", ");
}

function condition(col, expr) {
  const m = /^(not\.)?(eq|neq|is|in|gt|gte|lt|lte|like|ilike)\.(.*)$/s.exec(expr);
  if (!m) throw Object.assign(new Error(`gateway: filter ${col}=${expr}`), { status: 400 });
  const [, not, op, val] = m;
  const c = `t.${ident(col)}`;
  let sql;
  if (op === "is") sql = `${c} is ${{ null: "null", true: "true", false: "false" }[val] ?? "null"}`;
  else if (op === "in") sql = `${c}::text in (${splitTop(val.replace(/^\(|\)$/g, "")).map((v) => lit(v.replace(/^"|"$/g, ""))).join(", ") || "null"})`;
  else if (op === "like" || op === "ilike") sql = `${c}::text ${op} ${lit(val.replace(/\*/g, "%"))}`;
  else sql = `${c} ${{ eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" }[op]} ${lit(val)}`;
  return not ? `not (${sql})` : sql;
}

function orGroup(expr, joiner) {
  return `(${splitTop(expr).map((part) => {
    const g = /^(and|or)\((.*)\)$/.exec(part);
    if (g) return orGroup(g[2], g[1]);
    const i = part.indexOf(".");
    return condition(part.slice(0, i), part.slice(i + 1));
  }).join(` ${joiner} `)})`;
}

function whereOf(params) {
  const parts = [];
  for (const [k, v] of params) {
    if (["select", "order", "offset", "limit", "columns", "on_conflict"].includes(k)) continue;
    if (k === "or" || k === "and") parts.push(orGroup(v.replace(/^\(|\)$/g, ""), k));
    else parts.push(condition(k, v));
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
      .map((a) => `${ident(a.name)} => ${body[a.name] === null ? "null" : lit(typeof body[a.name] === "object" ? JSON.stringify(body[a.name]) : body[a.name])}::${a.type}`);
    const call = `public.${ident(name)}(${args.join(", ")})`;
    const sql = info.set ? `select coalesce(json_agg(t), '[]') from ${call} t;`
      : info.void ? `select ${call} \\g /dev/null\nselect 'null';` : `select coalesce(to_json(${call}), 'null'::json);`;
    const r = await psql(asWho(who) + sql);
    return r.code === 0 ? send(200, JSON.parse(r.out || "null")) : pgError(r.err, send);
  }

  const table = `public.${ident(name)}`;
  const where = whereOf(params);
  const cols = selectList(name, params.get("select"));
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
server.listen(port, "127.0.0.1", () => console.log(`gateway listening on http://127.0.0.1:${port}`));
