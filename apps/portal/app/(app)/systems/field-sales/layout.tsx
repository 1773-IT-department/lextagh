import type { ReactNode } from "react";
import AppPwaLayout, { pwaMetadata, pwaViewport } from "@/components/pwa/AppPwaLayout";

// Field sales is also the installable "Lexta Field Sales" phone app (lib/pwa.ts).
export const metadata = pwaMetadata("field-sales");
export const viewport = pwaViewport("field-sales");

export default function FieldSalesLayout({ children }: { children: ReactNode }) {
  return <AppPwaLayout app="field-sales">{children}</AppPwaLayout>;
}
