"use client";

import ChatWidget from "@lexta/chat/widget";
import { LEXTA_CHAT } from "@/lib/chat/hours";

/** Floating "Chat with us" button on every page (packages/chat), in the Lexta site's teal, tagged lexta. */
export default function ChatLauncher() {
  return <ChatWidget config={LEXTA_CHAT} />;
}
