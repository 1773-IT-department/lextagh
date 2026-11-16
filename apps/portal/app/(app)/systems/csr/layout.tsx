import type { ReactNode } from "react";
import AppPwaLayout, { pwaMetadata, pwaViewport } from "@/components/pwa/AppPwaLayout";

// CSR activities is also the installable "Lexta CSR Tracker" phone app (lib/pwa.ts).
export const metadata = pwaMetadata("csr");
export const viewport = pwaViewport("csr");

export default function CsrLayout({ children }: { children: ReactNode }) {
  return <AppPwaLayout app="csr">{children}</AppPwaLayout>;
}
