"use client";

import s from "./news.module.css";

/**
 * "Get our stories by email", visually as in the prototype. Not wired yet: saving into the CRM is the forms card
 * (item 19), so submitting does nothing (no fake "Subscribed" message).
 */
export default function SubscribeBox() {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, padding: "32px 30px 34px", boxShadow: "0 16px 34px rgba(11,60,78,.1)" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#12313d", letterSpacing: "-.015em" }}>Get our stories by email</div>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.8, color: "#5d7883" }}>One short note a month: outreach reports, new products and where our teams will be next.</p>
      <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
        <label htmlFor="news-subscribe-email" className={s.srOnly}>Your email address</label>
        <input
          id="news-subscribe-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Your email address"
          className={s.field}
          style={{ flex: "1 1 180px", minWidth: 0, border: "1px solid rgba(18,163,196,.35)", borderRadius: 7, padding: "12px 14px", fontSize: 13, color: "#12313d", background: "#f7fcfe" }}
        />
        <button type="submit" style={{ border: 0, background: "#12313d", color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 22px", borderRadius: 7, cursor: "pointer" }}>
          Subscribe
        </button>
      </form>
      <div style={{ marginTop: 12, fontSize: 11, color: "#8fa8b2" }}>We never share your address. Unsubscribe anytime.</div>
    </div>
  );
}
