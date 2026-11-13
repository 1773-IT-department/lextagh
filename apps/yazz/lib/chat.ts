// The Yazz site's live chat: the shared widget and server handler (packages/chat), tagged with the Yazz brand, so
// conversations land in the one Lexta inbox marked Yazz. Same secret and limits as the Lexta site (CHAT_INTAKE_SECRET).
import type { ChatBrandConfig } from "@lexta/chat/config";
import { contact, lexta } from "./site";

export const YAZZ_CHAT: ChatBrandConfig = {
  brand: "yazz",
  brandName: "Yazz",
  teamName: "Yazz care team",
  supportEmail: contact.supportEmail,
  officeHoursText: contact.officeHours,
  storageKey: "yazz-chat-v1",
  privacyUrl: lexta.privacy,
};
