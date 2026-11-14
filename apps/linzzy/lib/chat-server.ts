// The Linzzy chat handler behind POST /api/chat. Plain server code (no Next.js imports), so the harness runs it too.
import { createChatHandler } from "@lexta/chat/server";
import { LINZZY_CHAT } from "./chat";

export const handleChat = createChatHandler(LINZZY_CHAT);
