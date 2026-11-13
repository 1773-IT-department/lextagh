import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { metadataBase } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  title: { default: "Yazz® | Trusted Quality. Made for Everyday Living.", template: "%s | Yazz®" },
  description:
    "Yazz®, a trademark brand of Lexta Ghana Limited: feminine care, baby care, oral care, home care and tissue products made for everyday living. Find a stockist near you.",
  applicationName: "Yazz",
  openGraph: { siteName: "Yazz", type: "website", locale: "en_GH", images: [{ url: "/images/full-range.webp", width: 900, height: 900, alt: "The Yazz product range" }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#ED1B2E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GH">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* The prototype's fonts: Poppins with Caveat for the handwritten accents. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700;1,800&family=Caveat:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
