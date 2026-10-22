import type { ReactNode } from "react";

export const metadata = {
  title: "Lexta Ghana Limited",
  description: "Lexta Ghana Limited, makers of Yazz, Linzzy and Hooch.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
