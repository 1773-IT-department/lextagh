"use client";

import { usePwaInstall } from "./usePwaInstall";

type Props = { name: string; shortName: string; startUrl: string };

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const AddIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** The install button and, where browsers have no install dialog, step by step instructions. */
export default function InstallPanel({ name, shortName, startUrl }: Props) {
  const { state, install } = usePwaInstall();

  if (state === "standalone") {
    return (
      <div className="pwa-panel">
        <p className="pwa-lead">The app is installed and open.</p>
        <a className="btn block pwa-big" href={startUrl}>Open {shortName}</a>
      </div>
    );
  }
  if (state === "installed") {
    return (
      <div className="pwa-panel" role="status">
        <p className="pwa-lead"><b>Installed.</b> Find <b>{shortName}</b> on your home screen, open it and sign in with your Lexta login.</p>
        <a className="btn block light pwa-big" href={startUrl}>Open it here instead</a>
      </div>
    );
  }
  if (state === "ios") {
    return (
      <div className="pwa-panel">
        <p className="pwa-lead">On iPhone and iPad, add the app from Safari&apos;s Share menu. It takes three taps:</p>
        <ol className="pwa-steps">
          <li><span className="pwa-step-icon"><ShareIcon /></span><span>Tap the <b>Share</b> button at the bottom of Safari (in Chrome, tap Share next to the address).</span></li>
          <li><span className="pwa-step-icon"><AddIcon /></span><span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>
          <li><span className="pwa-step-icon pwa-step-num">3</span><span>Tap <b>Add</b>. <b>{shortName}</b> appears on your home screen: open it and sign in.</span></li>
        </ol>
        <p className="small">If you opened this link inside WhatsApp, first tap the menu and choose Open in Safari.</p>
      </div>
    );
  }
  if (state === "ready") {
    return (
      <div className="pwa-panel">
        <button type="button" className="btn block pwa-big" onClick={() => { void install(); }}>Install app</button>
        <p className="small pwa-center">Free, and takes a few seconds. {name} then opens from your home screen like any other app.</p>
      </div>
    );
  }
  return (
    <div className="pwa-panel" aria-busy={state === "checking"}>
      {state === "checking" ? (
        <p className="pwa-lead">Getting the app ready&hellip;</p>
      ) : (
        <>
          <p className="pwa-lead">To install, open this link in <b>Chrome</b> on an Android phone or <b>Safari</b> on an iPhone.</p>
          <ol className="pwa-steps">
            <li><span className="pwa-step-icon pwa-step-num">1</span><span>In Chrome, tap the <b>menu</b> (three dots) and choose <b>Install app</b> or <b>Add to Home screen</b>.</span></li>
            <li><span className="pwa-step-icon pwa-step-num">2</span><span>Open <b>{shortName}</b> from your home screen and sign in with your Lexta login.</span></li>
          </ol>
          <p className="small">If you opened this link inside WhatsApp, tap the menu and choose Open in browser first.</p>
        </>
      )}
      <a className="btn block light" href={startUrl}>Use it in the browser instead</a>
    </div>
  );
}
