import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { metadataBase } from "@/lib/site";
import "./globals.css";

import "./linzzy-hover.css";

// The pages use DM Serif Display and Hanken Grotesk (app/globals.css, public/fonts). DM Sans (SIL Open Font License,
// public/fonts/OFL.txt) is kept for the live chat button and panel, which keep their previous look. All served from this
// site: no request to Google from visitors' browsers or from the build.
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
    <html lang="en-GH" className={body.variable}>
      <body>
        {/* Without JavaScript the scroll animations cannot run: show everything in its end state. */}
        <noscript>
          <style>{"[data-reveal]{--r:1!important}[data-pin]{--p:1!important}[data-w]{opacity:1!important}:has(>[data-track]){overflow-x:auto!important}[data-faq-a]{display:block!important}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
