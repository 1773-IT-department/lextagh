import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/session";
import { PWA_APPS, type PwaKey } from "@/lib/pwa";
import InstallBanner from "./InstallBanner";
import PwaHead from "./PwaHead";

/** Manifest, home screen icon and status bar colour for a phone app's pages (used by its system's layout.tsx). */
export const pwaMetadata = (key: PwaKey): Metadata => {
  const a = PWA_APPS[key];
  return {
    manifest: a.manifestPath,
    icons: { apple: `/pwa/${a.key}-apple-touch.png` },
    appleWebApp: { capable: true, title: a.shortName, statusBarStyle: "default" },
  };
};
export const pwaViewport = (key: PwaKey): Viewport => ({ themeColor: PWA_APPS[key].themeColor });

/** Wraps a phone app's system pages: registers the service worker and shows the install banner to people who use it. */
export default async function AppPwaLayout({ app, children }: { app: PwaKey; children: ReactNode }) {
  const a = PWA_APPS[app];
  const { profile } = await requireSession();
  const role = profile?.is_active ? profile.role : null;
  const uses = !!role && a.useRoles.includes(role);
  return (
    <>
      <PwaHead />
      {uses && <InstallBanner app={a.key} shortName={a.shortName} installPath={a.installPath} />}
      {children}
    </>
  );
}
