// The Hooch chat handler behind POST /api/chat. Plain server code (no Next.js imports), so the harness runs it too.
import { createChatHandler } from "@lexta/chat/server";
import { HOOCH_CHAT } from "./chat";

export const handleChat = createChatHandler(HOOCH_CHAT);
