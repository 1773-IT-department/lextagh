// What makes one website's live chat its own: the brand its conversations are tagged with in the shared inbox, the
// names and addresses the widget shows, and where the visitor's chat is remembered in the browser. Plain data, so a
// server or client component can pass it to the widget.

export type ChatBrandConfig = {
  /** Brand slug the conversations are tagged with (public.brands.slug): lexta, yazz, linzzy or hooch. */
  brand: string;
  /** Shown in the panel title: "Chat with <brandName>". */
  brandName: string;
  /** The button's accessible name: "Chat with the <teamName>". */
  teamName: string;
  /** Where visitors can write instead when the chat cannot answer. */
  supportEmail: string;
  /** Office hours as visitors read them (a placeholder until the client confirms them). */
  officeHoursText: string;
  /** localStorage key that keeps the visitor's open chat across reloads. One per site. */
  storageKey: string;
  /** The privacy policy the start form links to. */
  privacyUrl: string;
};
