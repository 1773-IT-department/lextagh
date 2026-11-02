import type { ReactNode } from "react";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

/** Shared frame for every converted Lexta page: header, page content, footer, mobile bar and drawer. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ width: "100%", overflowX: "hidden" }}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
      <MobileNav />
    </>
  );
}
