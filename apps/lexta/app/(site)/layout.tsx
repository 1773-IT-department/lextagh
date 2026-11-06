import type { ReactNode } from "react";
import ChatLauncher from "@/components/chat/ChatLauncher";
import MobileNav from "@/components/MobileNav";
import SiteFooter from "@/components/SiteFooter";
import SiteFrame from "@/components/SiteFrame";
import SiteHeader from "@/components/SiteHeader";

/** Shared frame for every converted Lexta page: header, page content, footer, mobile bar and drawer, live chat button. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteFrame>
        <SiteHeader />
        {/* Plain block wrapper (no styles) so every page has a main landmark for screen readers and skip navigation. */}
        <main id="main">{children}</main>
        <SiteFooter />
      </SiteFrame>
      <MobileNav />
      <ChatLauncher />
    </>
  );
}
