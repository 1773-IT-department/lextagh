import type { Metadata } from "next";
import AboutClient from "@/components/linzzy/pages/AboutClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited. Our story, vision, mission and core values.",
  alternates: { canonical: "/about" },
};

/** About (Linzzy About.dc.html). */
export default function AboutPage() {
  return <AboutClient />;
}
