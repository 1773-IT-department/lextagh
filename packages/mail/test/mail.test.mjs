// @lexta/mail with a stubbed fetch: sends when configured, skips when not, never throws.
// Run with: node --experimental-strip-types --no-warnings packages/mail/test/mail.test.mjs (also part of the forms suite).
const mail = await import("../src/index.ts");

let failures = 0;
const check = (ok, msg, detail) => {
  if (ok) console.log(`  PASS: ${msg}`);
  else { failures += 1; console.log(`  FAIL: ${msg}`); if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 800)}`); }
};
const calls = [];
const stub = (status = 200, body = { id: "msg_1" }) => async (url, init) => {
  calls.push({ url, init, body: JSON.parse(init.body) });
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
};
console.warn = () => {};

const ack = {
  kind: "complaint", site: "Yazz", form: "Report a problem", reference: "LX-2026-0042", routeTo: "support@example.com",
  name: "Ama Mensah", email: "ama@example.org", phone: "+233 24 123 4567",
  details: [["Product", "Toothpaste"], ["Batch", "YZ-1"], ["Message", "The cap was broken.\nPhoto attached."], ["Empty", ""]],
};
const settings = { apiKey: "re_test_key", from: "Lexta Ghana <no-reply@mail.example.com>" };

// Off unless both variables are set.
check(mail.mailSettings({}) === null && mail.mailSettings({ RESEND_API_KEY: "x" }) === null && mail.mailSettings({ MAIL_FROM: "a@b.co" }) === null,
  "settings: off unless RESEND_API_KEY and MAIL_FROM are both set");
check(JSON.stringify(mail.mailSettings({ RESEND_API_KEY: " k ", MAIL_FROM: "a@b.co", MAIL_REDIRECT_TO: "not an email" })) === JSON.stringify({ apiKey: "k", from: "a@b.co" }),
  "settings: trimmed, and a bad MAIL_REDIRECT_TO is ignored");

// Skips when not configured: no network call at all.
{
  calls.length = 0;
  const saved = { k: process.env.RESEND_API_KEY, f: process.env.MAIL_FROM };
  delete process.env.RESEND_API_KEY; delete process.env.MAIL_FROM;
  const r = await mail.sendAcknowledgement(ack, { fetch: stub() });
  check(r.sender.reason === "off" && r.team.reason === "off" && calls.length === 0, "not configured: nothing is sent, no fetch, no error", r);
  const r2 = await mail.sendMail({ to: ["a@b.co"], subject: "s", text: "t" }, { fetch: stub() });
  check(r2.ok === false && r2.reason === "off" && calls.length === 0, "not configured: sendMail is off too");
  process.env.RESEND_API_KEY = saved.k ?? ""; process.env.MAIL_FROM = saved.f ?? "";
  if (!saved.k) delete process.env.RESEND_API_KEY;
  if (!saved.f) delete process.env.MAIL_FROM;
}

// Sends when configured: one to the sender, one to the routing inbox, the reference in both subjects.
{
  calls.length = 0;
  const r = await mail.sendAcknowledgement(ack, { settings, fetch: stub(), portalUrl: "https://portal.example.com/" });
  check(r.sender.ok && r.team.ok && calls.length === 2, "configured: two emails sent", r);
  const toSender = calls.find((c) => c.body.to[0] === "ama@example.org");
  const toTeam = calls.find((c) => c.body.to[0] === "support@example.com");
  check(calls.every((c) => c.url === "https://api.resend.com/emails" && c.init.method === "POST" && c.init.headers.authorization === "Bearer re_test_key"
    && c.init.headers["content-type"] === "application/json" && c.body.from === settings.from), "configured: Resend HTTP API with the key and the from address");
  check(toSender && toSender.body.subject === "[LX-2026-0042] Yazz: your report" && toSender.body.reply_to === "support@example.com",
    "sender: reference in the subject, replies go to the routing inbox", toSender?.body);
  const st = toSender?.body.text ?? "";
  check(st.includes("Your reference: LX-2026-0042") && st.includes("What happens next") && st.includes("How to reply") && st.includes("Keep LX-2026-0042 in the subject")
    && st.startsWith("Hello Ama Mensah,"), "sender: reference, what happens next and how to reply", st);
  check(toTeam && toTeam.body.subject === toSender.body.subject && toTeam.body.reply_to === "ama@example.org", "team copy: same subject (one thread), replies go to the sender", toTeam?.body);
  const tt = toTeam?.body.text ?? "";
  check(tt.includes("Product: Toothpaste") && tt.includes("Message:\nThe cap was broken.\nPhoto attached.") && !tt.includes("Empty") && tt.includes("https://portal.example.com)")
    && tt.includes("Phone: +233 24 123 4567"), "team copy: what was sent, blanks left out, where the record is", tt);
  const all = calls.map((c) => c.body.text + c.body.subject).join("\n");
  check(!/—|–| - /.test(all), "wording: no em or en dashes and no spaced hyphens");
}

// No email given (phone only): only the team copy, which says to call.
{
  calls.length = 0;
  const r = await mail.sendAcknowledgement({ ...ack, email: undefined }, { settings, fetch: stub() });
  check(r.sender.ok === false && r.team.ok && calls.length === 1 && calls[0].body.reply_to === undefined && calls[0].body.text.includes("call them"),
    "phone only: no acknowledgement, the team copy says to call", r);
}

// Newsletter: the unsubscribe link in the text and as List-Unsubscribe.
{
  calls.length = 0;
  const url = "https://lextagh.vercel.app/unsubscribe?token=abc";
  await mail.sendAcknowledgement({ kind: "newsletter", site: "Lexta Ghana", form: "Newsletter", reference: "NWS-1234567890", routeTo: "marketing@example.com", email: "n@example.org", unsubscribeUrl: url }, { settings, fetch: stub() });
  const s = calls.find((c) => c.body.to[0] === "n@example.org");
  check(s && s.body.text.includes(url) && s.body.headers?.["List-Unsubscribe"] === `<${url}>`, "newsletter: unsubscribe link in the email and its header", s?.body);
}

// Redirect for testing routing without writing to real inboxes.
{
  calls.length = 0;
  await mail.sendAcknowledgement(ack, { settings: { ...settings, redirectTo: "qa@example.net" }, fetch: stub() });
  check(calls.length === 2 && calls.every((c) => c.body.to.length === 1 && c.body.to[0] === "qa@example.net" && c.body.subject.startsWith("[TEST to ")),
    "MAIL_REDIRECT_TO: every email goes to the test inbox, marked with its real recipient", calls.map((c) => c.body));
}

// Never throws: network error, provider error, bad body, header injection.
{
  const thrower = async () => { throw new TypeError("fetch failed"); };
  let threw = false;
  let r1, r2, r3;
  try {
    r1 = await mail.sendAcknowledgement(ack, { settings, fetch: thrower });
    r2 = await mail.sendAcknowledgement(ack, { settings, fetch: stub(500, { message: "boom" }) });
    r3 = await mail.sendMail({ to: ["not-an-email"], subject: "x", text: "y" }, { settings, fetch: stub() });
    await mail.sendAcknowledgement(null, { settings, fetch: stub() });
    await mail.sendAcknowledgement({ ...ack, details: null, name: undefined }, { settings, fetch: stub(200, "not json") });
  } catch { threw = true; }
  check(!threw && r1.sender.reason === "error" && r1.team.reason === "error" && r2.sender.reason === "error" && r3.reason === "invalid", "never throws: network failure, HTTP 500 and bad input are results, not exceptions", { r1, r2, r3 });
  calls.length = 0;
  await mail.sendAcknowledgement({ ...ack, reference: "LX-1\r\nBcc: evil@example.com", name: "Eve\r\nBcc: x@y.z" }, { settings, fetch: stub() });
  check(calls.every((c) => !/[\r\n]/.test(c.body.subject)), "subjects stay on one line (no header injection)", calls.map((c) => c.body.subject));
}

if (failures) { console.log(`${failures} mail checks failed`); process.exit(1); }
console.log("All mail checks passed");
