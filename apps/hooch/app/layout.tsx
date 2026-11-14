import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { metadataBase } from "@/lib/site";
import "./globals.css";

// Fredoka (round, playful display) and Nunito (soft text): free Google fonts (SIL Open Font License, app/fonts/OFL.txt),
// the variable latin files kept in the repo and served by next/font from this site: no request to Google.
const display = localFont({ src: "./fonts/Fredoka-latin.woff2", weight: "300 700", variable: "--font-display", display: "swap" });
const body = localFont({
  src: [
    { path: "./fonts/Nunito-latin.woff2", weight: "200 1000", style: "normal" },
    { path: "./fonts/Nunito-latin-italic.woff2", weight: "200 1000", style: "italic" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase,
  title: { default: "Hooch® | Good Nutrition, Brighter Tomorrow", template: "%s | Hooch®" },
  description:
    "Hooch® Cornflakes and Hooch® Frosted Flakes, breakfast cereals from Lexta Ghana Limited in 10 convenient individual packs. Breakfast ideas, family tips and where to buy.",
  applicationName: "Hooch",
  openGraph: { siteName: "Hooch®", type: "website", locale: "en_GH", images: [{ url: "/images/hooch/cornflakes-bowl.webp", width: 1200, height: 1200, alt: "A bowl of golden Hooch cornflakes with milk and banana slices" }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#ffd23f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GH" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
