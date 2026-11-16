import type { Metadata } from "next";
import ChatLauncher from "@/components/chat/ChatLauncher";
import NotFoundClient from "@/components/linzzy/pages/NotFoundClient";

export const metadata: Metadata = { title: "Page not found" };

/** Page not found, in the site's design, with the live chat button. */
export default function NotFound() {
  return (
    <>
      <main id="main" tabIndex={-1} style={{ outline: "none" }}><NotFoundClient /></main>
      <div className="lz-chat"><ChatLauncher /></div>
    </>
  );
}
