import { SESSION_ENDED, SIGN_IN_URL } from "./net";

/** Shown when a call answers 401: sign in again in a new tab, then come back and press Try again. */
export default function SessionEnded() {
  return (
    <div className="alert error" role="alert">
      {SESSION_ENDED}{" "}
      <a href={SIGN_IN_URL} target="_blank" rel="noopener">Sign in</a> (it opens in a new tab, so nothing here is lost), then
      come back and press Try again.
    </div>
  );
}
