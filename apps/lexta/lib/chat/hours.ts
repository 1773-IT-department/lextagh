// Live chat office hours and the two fixed lines the widget shows itself, for the Lexta site. The rules live in
// packages/chat (shared with the brand sites); these are the Lexta values. Nothing here is sent by the database, and
// there are no other automatic replies: every other answer comes from a person in the Lexta inbox.
import type { ChatBrandConfig } from "@lexta/chat/config";
import { CHAT_AUTO_REPLY, CHAT_OFFICE_HOURS, chatOutOfHours, chatTeamAvailable } from "@lexta/chat/hours";

export { CHAT_AUTO_REPLY, CHAT_OFFICE_HOURS, chatTeamAvailable };

/** Shown to visitors as is until Lexta confirms the hours. */
export const CHAT_OFFICE_HOURS_TEXT = "[PLACEHOLDER: Lexta chat office hours]";

export const CHAT_SUPPORT_EMAIL = "support@lextagh.com";

/** Shown instead of the fixed reply outside office hours, and above the start form. */
export const CHAT_OUT_OF_HOURS = chatOutOfHours(CHAT_OFFICE_HOURS_TEXT, CHAT_SUPPORT_EMAIL);

/** The Lexta site's chat: conversations tagged lexta, the Lexta names and the site's own privacy policy. */
export const LEXTA_CHAT: ChatBrandConfig = {
  brand: "lexta",
  brandName: "Lexta",
  teamName: "Lexta team",
  supportEmail: CHAT_SUPPORT_EMAIL,
  officeHoursText: CHAT_OFFICE_HOURS_TEXT,
  storageKey: "lexta-chat-v1",
  privacyUrl: "/privacy-policy",
};
