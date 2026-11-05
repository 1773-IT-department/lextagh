// Live chat (item 22) through the real website server code, against the local harness database.
// Run with: bash supabase/tests/local/live-chat/run.sh
//
// Loads apps/lexta/lib/chat/server.ts (what POST /api/chat runs) and the helpers in packages/db, points them at
// rpc_shim.mjs, which runs chat_start, chat_send and chat_read as anon in the harness database, then checks the
// database and answers as staff with psql (role authenticated, as a customer care person). The shared chat secret
// is set in the database and in CHAT_INTAKE_SECRET, as on Vercel after the one time set up.
import { createHmac, randomUUID } from "node:crypto";
import { register } from "node:module";

const { psql, startShim } = await import("../forms/rpc_shim.mjs");
register(new URL("../forms/ts-hook.mjs", import.meta.url));

let failures = 0;
const pass = (msg) => console.log(`  PASS: ${msg}`);
const fail = (msg, detail) => {
  failures += 1;
  console.log(`  FAIL: ${msg}`);
  if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 600)}`);
};
const check = (ok, msg, detail) => (ok ? pass(msg) : fail(msg, detail));

async function q(sql, vars) {
  const r = await psql(sql, vars);
  if (r.code !== 0) throw new Error(`query failed: ${r.err}`);
  return r.out;
}

const SECRET = "harness-chat-secret-0123456789abcdef0";
const CARE = "00000000-0000-0000-0000-00000000d001";
/** Runs SQL as the customer care person (role authenticated), like the portal does through PostgREST. */
const asCare = (sql, vars) => q(`set role authenticated;\nselect set_config('request.jwt.claim.sub', '${CARE}', false) \\g /dev/null\n${sql}`, vars);

const server = await startShim(0);
const shimUrl = `http://127.0.0.1:${server.address().port}`;
const warnings = [];
console.warn = (...args) => warnings.push(args.join(" "));

delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
delete process.env.CHAT_INTAKE_SECRET;
const chat = await import("../../../../apps/lexta/lib/chat/server.ts");
const hours = await import("../../../../apps/lexta/lib/chat/hours.ts");

let ips = 0;
const nextIp = () => `10.20.${Math.floor((ips += 1) / 250)}.${ips % 250}`;
const start = (fields, ip = nextIp()) => chat.handleChat({ action: "start", name: "Ama Owusu", message: "Hello there", ...fields }, { ip });
const send = (c, body, ip, extra = {}) => chat.handleChat({ action: "send", conversationId: c.conversationId, token: c.token, body, ...extra }, { ip });
const read = (c, ip, after = 0) => chat.handleChat({ action: "read", conversationId: c.conversationId, token: c.token, after }, { ip });

try {
  // Not set up: a kind message with the email address, nothing sent anywhere.
  {
    const r = await start({});
    check(r.status === 503 && r.body.code === "unavailable" && r.body.message.includes("support@lextagh.com"),
      "without settings the chat says it is not available and gives the email address", r);
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = shimUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_harness";
  process.env.CHAT_INTAKE_SECRET = SECRET;

  // The site has the secret but the database does not yet.
  {
    const r = await start({});
    check(r.status === 503 && r.body.code === "unavailable", "with the secret only on the site, chat is not available (55000)", r);
  }
  await q("insert into private.chat_intake_secret (secret) values (:'s')", { s: SECRET });
  await q(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
    ('${CARE}', 'chat.care@test.local', '{"role":"customer_care"}', '{"full_name":"Efua Asante"}')`);

  // Field checks on the server, before the database.
  {
    const r = await chat.handleChat({ action: "start", name: "", message: "", email: "nope", phone: "call me" }, { ip: nextIp() });
    check(r.status === 400 && r.body.fieldErrors?.name && r.body.fieldErrors?.message && r.body.fieldErrors?.email && r.body.fieldErrors?.phone,
      "the start form checks name, message, email and phone", r);
    const long = await start({ message: "x".repeat(2001) });
    check(long.status === 400 && long.body.fieldErrors?.message, "a 2001 character first message is refused", long);
    const junk = await chat.handleChat("not an object", { ip: nextIp() });
    const action = await chat.handleChat({ action: "delete" }, { ip: nextIp() });
    check(junk.status === 400 && action.status === 400, "a body that is not a chat call is refused");
  }

  // Honeypot: a start shaped reply, nothing saved, the database is not even asked.
  {
    const before = await q("select count(*) from public.chat_conversations");
    const r = await start({ website: "http://spam.example" });
    const after = await q("select count(*) from public.chat_conversations");
    check(r.status === 200 && r.body.ok && /^[0-9a-f]{64}$/.test(r.body.token) && before === after, "a filled honeypot gets a normal looking reply and saves nothing", r);
  }

  // No visitor address: nothing goes through (everyone without one must not share a limit).
  {
    const r = await start({}, "");
    check(r.status === 503 && warnings.some((w) => w.includes("[chat] no visitor address")), "a call without a visitor address is refused and logged", r);
  }

  // A real chat.
  const ip = "203.0.113.7";
  const started = await start({ email: "Ama@Example.com", phone: "+233 24 555 0101", page: "/our-brands?utm=x" }, ip);
  const conv = started.body;
  check(started.status === 200 && conv.ok && /^LC-[0-9A-F]{8}$/.test(conv.reference) && /^[0-9a-f]{64}$/.test(conv.token), "a chat starts and returns its id, token and reference", started);
  {
    const row = JSON.parse(await q(`select row_to_json(c) from (select visitor_name, visitor_email, visitor_phone, start_page, token_hash, status
      from public.chat_conversations where id = :'id') c`, { id: conv.conversationId }));
    check(row.visitor_email === "ama@example.com" && row.start_page === null && row.status === "open"
      && row.token_hash !== conv.token && row.token_hash.length === 64, "saved with a lower case email, no query string page, only the token hash", row);
    const events = await q("select string_agg(distinct ip_hash, ',') from public.chat_rate_events");
    const expected = createHmac("sha256", SECRET).update("chat-ip:v4:203.0.113.7").digest("hex");
    check(!events.includes("203.0.113.7") && events.includes(expected), "the visitor address is only kept as an HMAC with the secret");
  }
  let firstSeq = 0;
  {
    const r = await read(conv, ip);
    firstSeq = r.body.messages?.[0]?.seq ?? 0;
    check(r.status === 200 && r.body.messages.length === 1 && r.body.messages[0].body === "Hello there" && r.body.status === "open", "the visitor reads their first message back", r);
  }

  // Staff answer in the inbox (as the database sees a portal call), with a note the visitor must never see.
  await asCare("select public.chat_reply(:'id', 'Hello Ama, how can we help?', false);", { id: conv.conversationId });
  await asCare("select public.chat_reply(:'id', 'VIP customer, check the distributor list', true);", { id: conv.conversationId });
  {
    const r = await read(conv, ip, firstSeq);
    const text = JSON.stringify(r.body);
    check(r.body.messages.length === 1 && r.body.messages[0].staff_name === "Efua" && r.body.messages[0].sender === "staff" && r.body.status === "waiting"
      && !text.includes("VIP") && !text.includes("Asante") && !text.includes("@test.local") && !text.includes("author"),
      "the visitor sees the reply with the first name only, never the note, the full name or an email", r.body);
  }

  // Sending: idempotent by message id; from another network the same chat still works.
  {
    const id = randomUUID();
    const a = await send(conv, "I run a shop in Kumasi", ip, { id });
    const b = await send(conv, "I run a shop in Kumasi", ip, { id });
    const n = await q("select count(*) from public.chat_messages where conversation_id = :'c' and body = 'I run a shop in Kumasi'", { c: conv.conversationId });
    check(a.status === 200 && b.status === 200 && a.body.id === id && b.body.id === id && n === "1", "a retried send with the same id saves once", { a, b, n });
    const moved = await send(conv, "Now on mobile data", "2001:db8:aa:bb::5");
    check(moved.status === 200, "the same chat works from another address", moved);
    const empty = await send(conv, "   ", ip);
    check(empty.status === 400 && empty.body.fieldErrors?.message, "an empty message is refused", empty);
  }

  // Tokens: wrong, swapped or malformed tokens get "this chat has ended", never data.
  {
    const other = (await start({ name: "Kofi", message: "Different chat" }, "198.51.100.20")).body;
    const swapped = await read({ conversationId: conv.conversationId, token: other.token }, ip);
    const wrongId = await read({ conversationId: other.conversationId, token: conv.token }, ip);
    const bad = await read({ conversationId: conv.conversationId, token: "x" }, ip);
    const sendSwapped = await send({ conversationId: conv.conversationId, token: other.token }, "sneaky", ip);
    check([swapped, wrongId, bad, sendSwapped].every((r) => r.status === 404 && r.body.code === "not_found" && !JSON.stringify(r.body).includes("Hello")),
      "wrong, swapped and malformed tokens get not found and no messages", [swapped.body, wrongId.body, bad.body]);
    const sneaky = await q("select count(*) from public.chat_messages where body = 'sneaky'");
    check(sneaky === "0", "a swapped token cannot write into another chat");
  }

  // A forged secret on the site: the database refuses, nothing saved.
  {
    process.env.CHAT_INTAKE_SECRET = "a-different-secret-that-is-long-enough-000";
    const before = await q("select count(*) from public.chat_conversations");
    const r = await start({ name: "Forger" });
    const after = await q("select count(*) from public.chat_conversations");
    check(r.status === 400 && !r.body.ok && before === after, "a request signed with the wrong secret is refused", r);
    process.env.CHAT_INTAKE_SECRET = SECRET;
  }

  // Per token: 8 messages a minute, with a kind message.
  {
    const c = (await start({ message: "one" }, "192.0.2.50")).body;
    let last;
    for (let i = 2; i <= 9; i += 1) last = await send(c, `message ${i}`, "192.0.2.50");
    check(last.status === 429 && last.body.message === chat.CHAT_MESSAGES.tooFast, "the ninth message in a minute is refused with a wait message", last);
  }

  // Per address: 10 new chats an hour, however many throwaway names and tokens; IPv6 counts by /64.
  {
    const results = [];
    for (let i = 0; i < 11; i += 1) results.push(await start({ name: `Throwaway ${i}` }, `2001:db8:1234:5678::${i + 1}`));
    check(results.slice(0, 10).every((r) => r.status === 200) && results[10].status === 429 && results[10].body.message === chat.CHAT_MESSAGES.limited,
      "an eleventh chat from the same IPv6 /64 in an hour is refused", results[10]);
    const neighbour = await start({ name: "Neighbour" }, "2001:db8:1234:9999::1");
    check(neighbour.status === 200, "another /64 is not locked out", neighbour);
  }

  // Site wide breaker, reached only by a flood from many addresses.
  {
    await q(`insert into public.chat_rate_events (kind, ip_hash)
             select 'start', md5('flood' || g) || md5('flood2' || g) from generate_series(1, 300) g`);
    const r = await start({ name: "During a flood" }, "198.51.100.99");
    check(r.status === 429 && r.body.message === chat.CHAT_MESSAGES.busy, "during a flood of new chats the busy message shows", r);
    const ongoing = await send(conv, "Still chatting during the flood", ip);
    check(ongoing.status === 200, "an ongoing chat carries on during a flood of new chats", ongoing);
    await q("delete from public.chat_rate_events where ip_hash in (select md5('flood' || g) || md5('flood2' || g) from generate_series(1, 300) g)");
  }

  // Staff close: the visitor sees it, and writing again reopens it.
  {
    await asCare("select public.chat_set_status(:'id', 'closed');", { id: conv.conversationId });
    const r = await read(conv, ip);
    check(r.body.status === "closed", "the visitor sees that staff closed the chat", r.body.status);
    await send(conv, "One more question", ip);
    const status = await q("select status from public.chat_conversations where id = :'id'", { id: conv.conversationId });
    check(status === "open", "a visitor message reopens a closed chat", status);
  }

  // A chat deleted by an admin ends for the visitor.
  {
    const c = (await start({ name: "Erase me" }, "192.0.2.77")).body;
    await q("delete from public.chat_conversations where id = :'id'", { id: c.conversationId });
    const r = await read(c, "192.0.2.77");
    check(r.status === 404 && r.body.message === chat.CHAT_MESSAGES.ended, "a deleted chat tells the visitor it has ended", r);
  }

  // Office hours: a clearly marked placeholder, used for the out of hours note.
  check(hours.CHAT_OFFICE_HOURS_TEXT === "[PLACEHOLDER: Lexta chat office hours]" && hours.CHAT_OUT_OF_HOURS.includes(hours.CHAT_OFFICE_HOURS_TEXT),
    "office hours are a marked placeholder in the out of hours note");
  check(hours.chatTeamAvailable(new Date("2026-11-04T10:00:00Z")) && !hours.chatTeamAvailable(new Date("2026-11-04T20:00:00Z"))
    && !hours.chatTeamAvailable(new Date("2026-11-07T10:00:00Z")), "inside and outside the assumed hours (weekday 10:00 yes, 20:00 no, Saturday no)");
  const copy = [...Object.values(chat.CHAT_MESSAGES), ...Object.values(chat.CHAT_FIELD_MESSAGES), hours.CHAT_AUTO_REPLY, hours.CHAT_OUT_OF_HOURS].join("\n");
  check(!/\u2014| - /.test(copy), "no em dashes or spaced hyphens in the chat copy");
} catch (e) {
  fail("unexpected error", String(e?.stack ?? e));
} finally {
  server.close();
}

if (failures) {
  console.log(`${failures} live chat check(s) failed`);
  process.exit(1);
}
console.log("All live chat checks passed");
