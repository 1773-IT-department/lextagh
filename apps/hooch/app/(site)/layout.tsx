import type { ReactNode } from "react";
import ChatLauncher from "@/components/chat/ChatLauncher";
import Playground from "@/components/fun/Playground";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

/** Every Hooch page: skip link, header, the page, footer, the live chat button and the fun layer (sprinkles, reveals). */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="hc-skip">Skip to content</a>
      <div className="hc-frame">
        <SiteHeader />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </div>
      <ChatLauncher />
      <Playground />
    </>
  );
}
