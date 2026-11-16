import { headers } from "next/headers";
import { PWA_APPS, portalOrigin, shareMessage, type PwaKey } from "@/lib/pwa";
import QrCode from "./QrCode";
import ShareActions from "./ShareActions";

/**
 * "Share install link" for a phone app. Only rendered for roles allowed to share it (canSharePwa); callers check.
 * The link is the public install page; agents still sign in with their own account once the app is installed.
 */
export default async function SharePanel({ app, compact = false }: { app: PwaKey; compact?: boolean }) {
  const a = PWA_APPS[app];
  const h = await headers();
  const url = `${portalOrigin(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"))}${a.installPath}`;
  const Heading = compact ? "h3" : "h2";
  return (
    <section className="panel pwa-share" aria-labelledby={`pwa_share_${a.key}`}>
      <div>
        <Heading id={`pwa_share_${a.key}`}>Install the {a.name} app</Heading>
        <p className="small" style={{ margin: 0 }}>
          Send this link to {a.audience}. They open it on their phone, tap Install app, then sign in with their own login. Or let them scan the code.
        </p>
        <ShareActions url={url} message={shareMessage(a, url)} title={`Install ${a.name}`} />
      </div>
      <div className="pwa-qr">
        <QrCode value={url} label={`QR code for the ${a.name} install link`} />
        <span>Scan to install</span>
      </div>
    </section>
  );
}
