// The Linzzy site's live chat: the shared widget and server handler (packages/chat), tagged with the Linzzy brand, so
// conversations land in the one Lexta inbox marked Linzzy. Same secret and limits as the other sites (CHAT_INTAKE_SECRET).
import type { ChatBrandConfig } from "@lexta/chat/config";
import { contact, lexta } from "./site";

export const LINZZY_CHAT: ChatBrandConfig = {
  brand: "linzzy",
  brandName: "Linzzy",
  teamName: "Linzzy care team",
  supportEmail: contact.supportEmail,
  officeHoursText: contact.officeHours,
  storageKey: "linzzy-chat-v1",
  privacyUrl: lexta.privacy,
};
