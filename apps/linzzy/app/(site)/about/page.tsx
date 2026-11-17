import type { Metadata } from "next";
import AboutClient from "@/components/linzzy/pages/AboutClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited, created to support the personal care needs of women, mothers and growing families.",
  alternates: { canonical: "/about" },
};

/** About (Linzzy About.dc.html). */
export default function AboutPage() {
  return <AboutClient />;
}
