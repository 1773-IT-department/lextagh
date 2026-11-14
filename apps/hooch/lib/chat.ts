// The Hooch site's live chat: the shared widget and server handler (packages/chat), tagged with the Hooch brand, so
// conversations land in the one Lexta inbox marked Hooch. Same secret and limits as the other sites (CHAT_INTAKE_SECRET).
import type { ChatBrandConfig } from "@lexta/chat/config";
import { contact, lexta } from "./site";

export const HOOCH_CHAT: ChatBrandConfig = {
  brand: "hooch",
  brandName: "Hooch",
  teamName: "Hooch care team",
  supportEmail: contact.supportEmail,
  officeHoursText: contact.officeHours,
  storageKey: "hooch-chat-v1",
  privacyUrl: lexta.privacy,
};
