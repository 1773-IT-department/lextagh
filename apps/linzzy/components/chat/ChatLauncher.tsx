"use client";

import ChatWidget from "@lexta/chat/widget";
import { LINZZY_CHAT } from "@/lib/chat";

/** Floating "Chat with us" button on every page: the Lexta live chat in Linzzy berry, tagged linzzy. */
export default function ChatLauncher() {
  return <ChatWidget config={LINZZY_CHAT} />;
}
