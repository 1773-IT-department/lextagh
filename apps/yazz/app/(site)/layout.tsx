import type { ReactNode } from "react";
import ChatLauncher from "@/components/chat/ChatLauncher";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

/** Every Yazz page: skip link, header, the page, footer and the live chat button. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="yz-skip">Skip to content</a>
      <div className="yz-frame">
        <SiteHeader />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </div>
      <ChatLauncher />
    </>
  );
}
