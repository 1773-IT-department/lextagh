// A tiny stand in for Supabase's REST API (PostgREST), for local tests only. It answers the two website intake
// calls the Lexta site makes, POST /rest/v1/rpc/submit_website_enquiry and /rest/v1/rpc/submit_complaint, by running
// the real database functions in the local harness database as the anon role, and answers errors the way PostgREST
// does ({ code, message } with HTTP 400 or 429). Connection settings come from PGHOST, PGPORT, PGUSER, PGDATABASE.
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
    const child = spawn("psql", argv, { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim() }));
    child.stdin.end("\\set VERBOSITY verbose\n" + sql + "\n");
  });
}

export function startShim(port = 0) {
  const server = http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
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
