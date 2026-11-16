import type { Metadata } from "next";
import { NOTICES, protoTips } from "@/components/linzzy/model";
import TipsClient from "@/components/linzzy/pages/TipsClient";

export const metadata: Metadata = {
  title: "Tips & Advice",
  description: "Linzzy Tips & Advice: practical articles on menstrual hygiene, choosing sanitary towels, diaper-changing routines, baby wipes, parenting and personal well-being.",
  alternates: { canonical: "/tips" },
  openGraph: { title: "Tips & Advice | Linzzy", url: "/tips" },
};

/** Tips & Advice (Linzzy Tips.dc.html), with the articles of content/articles.ts. */
export default function TipsPage() {
  return <TipsClient tips={protoTips()} notices={{ fem: NOTICES["feminine-care"], baby: NOTICES["baby-care"] }} />;
}
