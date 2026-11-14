import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { metadataBase } from "@/lib/site";
import "./globals.css";

// Bricolage Grotesque (display) and DM Sans (text): free Google fonts (SIL Open Font License, app/fonts/OFL.txt), the
// variable latin files kept in the repo and served by next/font from this site: no request to Google from visitors'
// browsers or from the build, and no layout shift.
const display = localFont({ src: "./fonts/BricolageGrotesque-latin.woff2", weight: "200 800", variable: "--font-display", display: "swap" });
const body = localFont({
  src: [
    { path: "./fonts/DMSans-latin.woff2", weight: "100 1000", style: "normal" },
    { path: "./fonts/DMSans-latin-italic.woff2", weight: "100 1000", style: "italic" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase,
  title: { default: "Linzzy | Gentle Care for Bright Beginnings", template: "%s | Linzzy" },
  description:
    "Linzzy, a feminine, maternal and baby care brand of Lexta Ghana Limited: sanitary towels, panty liners, baby diapers and baby wipes. Find a stockist near you.",
  applicationName: "Linzzy",
  openGraph: { siteName: "Linzzy", type: "website", locale: "en_GH", images: [{ url: "/images/nursery/diaper-bag.webp", width: 1400, height: 788, alt: "Linzzy Baby Wipes and Baby Diapers in a nursery" }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#23103a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GH" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
