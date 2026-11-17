"use client";

import { useRouter } from "next/navigation";
import HomeView from "../views/HomeView";
import { h, tone, useChrome } from "../chrome";
import type { ProtoProduct, ProtoTip } from "../model";

// The home page of the prototype (Linzzy Home.dc.html): its renderVals, with the links pointed at the site's pages.

const WELCOME = "Welcome to Linzzy, where thoughtful care meets everyday comfort. From the beautiful journey of womanhood to the precious beginnings of motherhood, Linzzy is here to support the moments that matter.";
const ACCENT: Record<string, string> = { "Linzzy,": "#C2185B", womanhood: "#C2185B", "motherhood,": "#0E7A5B", "matter.": "#C2185B" };
const CHAPTERS: [string, string, string][] = [["ch-hero", "00", "Gentle Care"], ["ch-welcome", "01", "Welcome"], ["ch-grows", "02", "Care That Grows"], ["ch-fem", "03", "Feminine Care"], ["ch-baby", "04", "Baby Care"], ["ch-products", "05", "Featured Products"], ["ch-why", "06", "Why Linzzy"], ["ch-tips", "07", "Tips & Advice"], ["ch-corner", "08", "Parent Corner"], ["ch-connect", "09", "Connect"]];
// Lexta's top bar: Feminine Care and Baby Care as separate entries (both on the Products page; chrome.ts PAGES).
const PAGE_LINKS: [string, string][] = [["fem", "Feminine Care"], ["baby", "Baby Care"], ["about", "About Us"], ["tips", "Tips & Advice"], ["faqs", "FAQs"], ["contact", "Contact & Where to Buy"]];
const HREF: Record<string, string> = {
  products: "/products", about: "/about", tips: "/tips", faqs: "/faqs", contact: "/contact",
  wtb: "/contact#where-to-buy", corner: "/tips#parent-corner", fem: "/products#fem", baby: "/products#baby",
};

export default function HomeClient({ featured, tips }: { featured: ProtoProduct[]; tips: ProtoTip[] }) {
  const router = useRouter();
  const c = useChrome("/", "Gentle Care", { hashOffset: 0 });
  const go = (href: string) => router.push(href);
  const page = Object.fromEntries(Object.entries(HREF).map(([k, href]) => [k, h(() => go(href))]));
  const count = String(featured.length).padStart(2, "0");

  const v = {
    ...c.base,
    toTop: h(() => { c.setMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }),
    page,
    pageHref: HREF,
    jump: { products: h(() => c.jumpTo("ch-products", 0)), fem: h(() => c.jumpTo("ch-fem", 0)), baby: h(() => c.jumpTo("ch-baby", 0)) },
    chapters: CHAPTERS.map(([id, num, name]) => ({ num, name, href: `#${id}`, go: h(() => c.jumpTo(id, 0)) })),
    pages: PAGE_LINKS.map(([id, label]) => ({ label, go: h(() => go(HREF[id])), href: HREF[id] })),
    welcomeWords: WELCOME.split(" ").map((t) => ({ t, c: ACCENT[t] || "#23103a", s: ACCENT[t] ? "italic" : "normal" })),
    featured: featured.map((p, i) => ({ ...p, ...tone(p.g), num: String(i + 1).padStart(2, "0"), total: count, href: `/products?p=${encodeURIComponent(p.id)}`, open: h(() => go(`/products?p=${encodeURIComponent(p.id)}`)) })),
    whyRest: [
      ["03", "Comfort-Focused Design", "Product options designed with attention to fit, coverage, convenience and everyday use.", "#FFF1C9", "#23103a", "#C2185B", "170px"],
      ["04", "A Brand That Listens", "We value consumer feedback and believe that understanding real experiences helps us continuously improve.", "#C2185B", "#fff", "#FFF1C9", "200px"],
    ].map((x) => ({ n: x[0], t: x[1], d: x[2], bg: x[3], fg: x[4], num: x[5], top: x[6] })),
    homeTips: tips.map((t, i) => {
      const g = tone(t.g);
      return { ...t, img: t.img ?? "", tone: g.tone, catLabel: g.cat, mins: t.minutes ? ` · ${t.minutes} min read` : "", href: `/tips/${t.slug}`, open: h(() => go(`/tips/${t.slug}`)), speed: ["0.04", "0.14", "0.24"][i % 3], offset: ["0px", "80px", "160px"][i % 3] };
    }),
  };
  return <HomeView v={v} />;
}
