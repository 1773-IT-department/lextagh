"use client";

import ChatWidget from "@lexta/chat/widget";
import { HOOCH_CHAT } from "@/lib/chat";

/** Floating "Chat with us" button on every page: the Lexta live chat in Hooch berry, tagged hooch. */
export default function ChatLauncher() {
  return <ChatWidget config={HOOCH_CHAT} />;
}
