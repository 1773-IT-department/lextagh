"use client";

import { useEffect, useState } from "react";
import { isStandalone, usePwaInstall } from "./usePwaInstall";

const KEY = (app: string) => `lexta-pwa-banner-dismissed:${app}`;

/**
 * Invites people using a phone app's system on a phone to install it. Hidden on computers, inside the installed app
 * and once dismissed (remembered on this device; private windows simply show it again).
 */
export default function InstallBanner({ app, shortName, installPath }: { app: string; shortName: string; installPath: string }) {
  const { state, install } = usePwaInstall();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(KEY(app)) === "1"; } catch { /* storage blocked: show it */ }
    const phone = window.matchMedia?.("(pointer: coarse)").matches && window.matchMedia?.("(max-width: 900px)").matches;
    setShow(!dismissed && !!phone && !isStandalone());
  }, [app]);

  if (!show || state === "standalone" || state === "installed" || state === "checking") return null;
  const dismiss = () => {
    try { window.localStorage.setItem(KEY(app), "1"); } catch { /* not remembered: fine */ }
    setShow(false);
  };
  return (
    <div className="pwa-banner" role="region" aria-label={`Install the ${shortName} app`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/pwa/${app}-192.png`} alt="" width={40} height={40} />
      <p>Install <b>{shortName}</b> on your phone for one tap access in the field.</p>
      {state === "ready"
        ? <button type="button" className="btn" onClick={() => { void install(); }}>Install</button>
        : <a className="btn" href={installPath}>How</a>}
      <button type="button" className="pwa-banner-close" onClick={dismiss} aria-label="Hide this message">&times;</button>
    </div>
  );
}
