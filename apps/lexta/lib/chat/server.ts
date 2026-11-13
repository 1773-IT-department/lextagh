// Live chat, the Lexta website server's side (scoreboard item 22). The work happens in packages/chat (shared with the
// brand sites); this makes the Lexta handler, whose conversations are tagged lexta. Plain server code with no Next.js
// imports, so the local harness test (supabase/tests/local/live-chat) runs the very same function. The route handler
// app/api/chat/route.ts is a thin wrapper around handleChat.
import { chatMessages, createChatHandler } from "@lexta/chat/server";
import { CHAT_SUPPORT_EMAIL, LEXTA_CHAT } from "./hours";

export { CHAT_FIELD_MESSAGES, CHAT_HONEYPOT_FIELD, checkStart, signChatRequest, type ChatApiResponse } from "@lexta/chat/server";

export const CHAT_MESSAGES = chatMessages(CHAT_SUPPORT_EMAIL);

export const handleChat = createChatHandler(LEXTA_CHAT);
