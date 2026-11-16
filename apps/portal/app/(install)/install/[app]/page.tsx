import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import InstallPanel from "@/components/pwa/InstallPanel";
import PwaHead from "@/components/pwa/PwaHead";
import { isPwaKey, PWA_APPS } from "@/lib/pwa";

type Params = { app: string };

export function generateStaticParams() {
  return Object.keys(PWA_APPS).map((app) => ({ app }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { app } = await params;
  if (!isPwaKey(app)) return {};
  const a = PWA_APPS[app];
  return {
    title: `Install ${a.name}`,
    description: a.description,
    manifest: a.manifestPath,
    icons: { apple: `/pwa/${a.key}-apple-touch.png`, icon: `/pwa/${a.key}-192.png` },
    appleWebApp: { capable: true, title: a.shortName, statusBarStyle: "default" },
  };
}

export async function generateViewport({ params }: { params: Promise<Params> }): Promise<Viewport> {
  const { app } = await params;
  return { themeColor: isPwaKey(app) ? PWA_APPS[app].themeColor : "#0b2f3d", width: "device-width", initialScale: 1, viewportFit: "cover" };
}

/** Public page that installs a phone app. This is the link admins share with field agents (no login needed to open it). */
export default async function InstallPage({ params }: { params: Promise<Params> }) {
  const { app } = await params;
  if (!isPwaKey(app)) notFound();
  const a = PWA_APPS[app];
  return (
    <main className="pwa-install" style={{ ["--pwa-bg" as string]: a.backgroundColor }}>
      <PwaHead />
      <div className="pwa-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pwa-icon" src={`/pwa/${a.key}-192.png`} alt="" width={96} height={96} />
        <h1>{a.name}</h1>
        <p className="pwa-desc">{a.description}</p>
        <InstallPanel name={a.name} shortName={a.shortName} startUrl={a.startUrl} />
        <div className="pwa-after">
          <h2>After installing</h2>
          <p>Open the app and sign in with the email and password of your Lexta Business System account. No account yet? Ask your Lexta administrator to invite you.</p>
        </div>
      </div>
      <p className="pwa-foot">Lexta Ghana Limited</p>
    </main>
  );
}
