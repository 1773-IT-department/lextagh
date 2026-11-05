// Live chat office hours and the two fixed lines the widget shows itself. Nothing here is sent by the database, and
// there are no other automatic replies: every other answer comes from a person in the Lexta inbox.

/** Shown to visitors as is until Lexta confirms the hours. */
export const CHAT_OFFICE_HOURS_TEXT = "[PLACEHOLDER: Lexta chat office hours]";

/**
 * The hours the widget assumes when it decides to show the out of hours note, part of the same placeholder:
 * Monday to Friday, 08:00 to 17:00 Ghana time (Africa/Accra, which is UTC all year). Replace with Lexta's real hours.
 */
export const CHAT_OFFICE_HOURS = { days: [1, 2, 3, 4, 5], openHour: 8, closeHour: 17 } as const;

/** True inside office hours. Ghana keeps UTC all year, so UTC day and hour are Ghana's. */
export function chatTeamAvailable(now: Date = new Date()): boolean {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  return (CHAT_OFFICE_HOURS.days as readonly number[]).includes(day) && hour >= CHAT_OFFICE_HOURS.openHour && hour < CHAT_OFFICE_HOURS.closeHour;
}

export const CHAT_SUPPORT_EMAIL = "support@lextagh.com";

/** The one fixed reply, shown after the visitor's first message. */
export const CHAT_AUTO_REPLY = "Thank you. A member of the team will reply shortly.";

/** Shown instead of the fixed reply outside office hours, and above the start form. */
export const CHAT_OUT_OF_HOURS =
  `Our team is away right now. Office hours: ${CHAT_OFFICE_HOURS_TEXT}. Leave your message and we will reply when we are back, or email ${CHAT_SUPPORT_EMAIL}.`;
