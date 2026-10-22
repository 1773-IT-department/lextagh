import type { ReactNode } from "react";

export const metadata = { title: "Lexta Business System", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Poppins, system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
