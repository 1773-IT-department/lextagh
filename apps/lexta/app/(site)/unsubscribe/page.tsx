import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { isNewsletterToken } from "@lexta/db";
import { unsubscribeAction } from "@/app/actions/unsubscribe";
import Breadcrumbs from "@/components/Breadcrumbs";

// Newsletter unsubscribe (Drive requests P4). Linked from every newsletter acknowledgement email as
// /unsubscribe?token=<48 hex>. No nav entry, not in the sitemap, not indexed.
// Opening the link only shows a button: mail scanners and link previews open links on their own, and a click must not
// unsubscribe anyone by accident. The button posts the token (a plain form, so it works without JavaScript) and the
// page comes back with ?result=done, invalid or error. A missing or malformed token shows "not valid" straight away.
const title = "Unsubscribe | Lexta Ghana";
export const metadata: Metadata = {
  title: { absolute: title },
  description: "Stop Lexta Ghana newsletter emails.",
  robots: { index: false, follow: false },
};

type State = "confirm" | "done" | "invalid" | "error";

const COPY: Record<State, { heading: string; text: string }> = {
  confirm: {
    heading: "Unsubscribe from our emails",
    text: "Press the button below to stop receiving the Lexta Ghana newsletter and updates. You can sign up again at any time.",
  },
  done: {
    heading: "You are unsubscribed",
    text: "We will not send you our newsletter or updates any more. If you change your mind, you can sign up again on our home page.",
  },
  invalid: {
    heading: "This link is not valid",
    text: "This unsubscribe link is not valid or is no longer in use. To stop our emails, write to marketing@lextagh.com and we will take you off the list.",
  },
  error: {
    heading: "We could not do this just now",
    text: "Please open the link from your email again in a few minutes, or write to marketing@lextagh.com and we will take you off the list.",
  },
};

const card: CSSProperties = { border: "1px solid rgba(18,163,196,.2)", background: "#f7fcfe", borderRadius: 14, padding: "28px 26px 30px" };
const button: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13, fontWeight: 600,
  padding: "13px 22px", borderRadius: 7, border: 0, cursor: "pointer", font: "inherit",
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; result?: string }> }) {
  const { token, result } = await searchParams;
  const state: State = result === "done" || result === "invalid" || result === "error"
    ? result
    : isNewsletterToken(token) ? "confirm" : "invalid";
  const copy = COPY[state];

  return (
    <>
      <section data-screen-label="Hero" style={{ background: "#0c303e", padding: "70px 28px 60px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Breadcrumbs items={[{ label: "Unsubscribe" }]} />
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3fc0dd" }}>Newsletter</div>
          <div style={{ width: 46, height: 4, background: "#12a3c4", borderRadius: 2, marginTop: 18 }} />
          <h1 style={{ margin: "20px 0 0", fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-.03em", color: "#fff", textWrap: "pretty" }}>
            {copy.heading}
          </h1>
        </div>
      </section>

      <section data-screen-label="Content" style={{ background: "#fff", padding: "56px 28px 74px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={card} data-unsubscribe-state={state} role={state === "confirm" ? undefined : "status"}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: "#4c6a75", textWrap: "pretty" }}>{copy.text}</p>
            {state === "confirm" && (
              <form action={unsubscribeAction} style={{ marginTop: 22 }}>
                <input type="hidden" name="token" value={token} />
                <button type="submit" style={button}>
                  Unsubscribe
                  <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>→</span>
                </button>
              </form>
            )}
            {state === "done" && (
              <p style={{ margin: "18px 0 0", fontSize: 13.5 }}><a href="/" style={{ color: "#12a3c4", fontWeight: 600 }}>Back to the home page</a></p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
