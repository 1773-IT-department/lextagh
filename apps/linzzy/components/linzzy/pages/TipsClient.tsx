"use client";

import { useServerForm } from "@lexta/forms/react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { submitNewsletterForm } from "@/app/actions/forms";
import { idleState } from "../FormBits";
import TipsView from "../views/TipsView";
import { h, tone, useChrome } from "../chrome";
import type { ProtoTip } from "../model";

// Tips & Advice (Linzzy Tips.dc.html): the articles of content/articles.ts (each card opens its article at
// /tips/<slug>), Six Quick Tips, Parent Corner and the newsletter form, which subscribes through the Business System.

const CHAPTERS: [string, string, string][] = [["top", "00", "Care Beyond the Product"], ["fem", "01", "Feminine Care & Wellness"], ["quick", "02", "Six Quick Tips"], ["baby", "03", "Baby Diapers & Wipes"], ["parent-corner", "04", "Parent Corner"], ["subscribe", "05", "Stay Connected"]];
const QUICK = [
  { k: "Know Your Flow", t: "Know Your Flow", d: "Choose sanitary protection according to your bleeding pattern, preferred fit and absorbency needs. Check the product label before use." },
  { k: "Change Regularly", t: "Freshness Starts with Good Habits", d: "Change sanitary towels approximately every 4 to 6 hours or sooner when needed. Change panty liners whenever damp or soiled." },
  { k: "Keep a Period Pouch", t: "Prepared Wherever You Go", d: "Carry spare sanitary towels, clean underwear and a disposal bag to stay prepared at school, work or while travelling." },
  { k: "Use Panty Liners Wisely", t: "Little Care, Everyday Confidence", d: "Panty liners are suitable for light spotting or small amounts of moisture, not for managing heavy menstrual bleeding." },
  { k: "Listen to Your Skin", t: "Comfort Comes First", d: "Stop using any menstrual product that causes irritation. Fragrance or cooling sensations do not necessarily mean better hygiene." },
  { k: "Track Your Cycle", t: "Know Your Cycle, Know Your Body", d: "Record your period dates and symptoms to understand your usual pattern and recognise changes worth discussing with a healthcare professional." },
];
const CORNER = ["Diaper-changing routines and hygiene", "Understanding diaper fit and sizing", "Baby wipes and responsible usage", "Everyday baby skin care", "Recognising when professional medical advice may be needed", "Common baby care myths and misconceptions"];

export default function TipsClient({ tips, notices }: { tips: ProtoTip[]; notices: Record<"fem" | "baby", { title: string; text: string }> }) {
  const router = useRouter();
  const c = useChrome("/tips", "Care Beyond the Product");
  const [state, action, pending] = useActionState(submitNewsletterForm, idleState);
  const { ref, onSubmit } = useServerForm(state, action, pending);
  const sent = state.status === "success";

  const items = (g: "fem" | "baby") =>
    tips.filter((t) => t.g === g).map((t, i) => ({
      ...t, hasImg: !!t.img, noImg: !t.img, img: t.img ?? "", mins: `${t.minutes} min read`,
      href: `/tips/${t.slug}`, open: h(() => router.push(`/tips/${t.slug}`)), speed: ["0", "0.06", "0.12"][i % 3],
    }));

  const v = {
    ...c.base,
    chapters: c.chapters(CHAPTERS),
    jump: { fem: h(() => c.jumpTo("fem")), baby: h(() => c.jumpTo("baby")), corner: h(() => c.jumpTo("parent-corner")) },
    sections: [
      { id: "fem", num: "01", chapter: "Feminine Care & Wellness", label: "02 Feminine Care Tips", isFem: true, title: "Linzzy Tips Just for You: Feminine Care & Wellness", tagline: "Your Comfort. Your Confidence. Your Everyday Care.", ...tone("fem"), bg: "#FBF8FF", noticeTitle: notices.fem.title, notice: notices.fem.text, items: items("fem") },
      { id: "baby", num: "03", chapter: "Baby Diapers & Wipes", label: "04 Baby Care Tips", isFem: false, title: "Baby Diapers & Baby Wipes", tagline: "Little Moments, Loving Care, Bright Beginnings.", ...tone("baby"), bg: "#F3FBF7", noticeTitle: notices.baby.title, notice: notices.baby.text, items: items("baby") },
    ],
    quickTips: QUICK.map((q, i) => ({ ...q, n: "0" + (i + 1), bg: ["#EFE6FF", "#FFE3EE", "#FFF1C9", "#DDF7EC", "#EFE6FF", "#FFE3EE"][i] })),
    cornerTopics: CORNER.map((t, i) => ({ t, n: "0" + (i + 1), dx: 40 + i * 30 + "px" })),
    subSent: sent,
    subOpen: !sent,
    sub: { state, action, pending, ref, onSubmit },
  };
  return <TipsView v={v} />;
}
