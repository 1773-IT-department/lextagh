"use client";

import ChatWidget from "@lexta/chat/widget";
import { YAZZ_CHAT } from "@/lib/chat";

/** Floating "Chat with us" button on every page: the Lexta live chat in Yazz red, tagged yazz. */
export default function ChatLauncher() {
  return <ChatWidget config={YAZZ_CHAT} />;
}
