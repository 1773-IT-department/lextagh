"use client";

import s from "./home.module.css";

/**
 * Newsletter sign-up, visually as in the prototype, with a visually hidden label. Not wired yet: saving into the CRM
 * is the forms card (item 19), so submitting does nothing (no fake "subscribed" message).
 */
export default function SubscribeForm() {
  return (
    <form data-subscribe="1" onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
      <label htmlFor="home-subscribe-email" className={s.srOnly}>Email address</label>
      <input
        id="home-subscribe-email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Enter your email address"
        className={s.subscribeInput}
        style={{ flex: 1, minWidth: 0, border: 0, borderRadius: "5px 0 0 5px", padding: "11px 14px", fontSize: 13, color: "#12313d" }}
      />
      <button
        type="submit"
        style={{ border: 0, background: "#0b2f3d", color: "#fff", fontSize: 13, fontWeight: 600, padding: "0 22px", borderRadius: "0 5px 5px 0", cursor: "pointer" }}
      >
        Subscribe
      </button>
    </form>
  );
}
