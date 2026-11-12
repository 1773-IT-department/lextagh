import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import NavProgress from "@/components/NavProgress";
import "./globals.css";

export const metadata: Metadata = { title: "Lexta Business System", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Suspense: the bar reads the address (useSearchParams), which must not hold back a static page. */}
        <Suspense fallback={null}><NavProgress /></Suspense>
        {children}
      </body>
    </html>
  );
}
