import type { ReactNode } from "react";
import ChatLauncher from "@/components/chat/ChatLauncher";

/**
 * Every Linzzy page: the skip link, the page (each page carries the prototype's own header, menu and footer) and the
 * live chat button, which keeps its previous look (DM Sans, Linzzy berry).
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="lz-skip">Skip to content</a>
      <main id="main" tabIndex={-1} style={{ outline: "none" }}>{children}</main>
      <div className="lz-chat"><ChatLauncher /></div>
    </>
  );
}
