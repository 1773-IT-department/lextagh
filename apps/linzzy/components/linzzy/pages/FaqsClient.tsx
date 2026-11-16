"use client";

import { useState, type ChangeEvent } from "react";
import FaqsView from "../views/FaqsView";
import { h, useChrome } from "../chrome";
import { scrollToId } from "../scroll";

// FAQs (Linzzy FAQs.dc.html): topic chips, search and the answers, as in the prototype. The "Read the article" links
// go to the article that answers the question.

import { CHIPS, FAQ, LINKS } from "../faq-data";

export default function FaqsClient() {
  const c = useChrome("/faqs", "Got a Question?");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ "fem-0": true });
  const query = q.trim().toLowerCase();

  const faqGroups = FAQ.map((g, gi) => ({ ...g, gi }))
    .filter((g) => cat === "all" || cat === g.id)
    .map((g) => ({
      title: g.title, tone: g.tone, anchor: "faq-" + g.id, num: "0" + (g.gi + 1),
      items: g.items
        .map((it, i) => ({ key: g.id + "-" + i, q: it[0], a: it[1], link: it[2], href: LINKS[it[3]] }))
        .filter((f) => !query || (f.q + " " + f.a).toLowerCase().includes(query))
        .map((f) => {
          const isOpen = !!open[f.key] || !!query;
          return { ...f, open: isOpen, expanded: isOpen ? "true" : "false", icon: isOpen ? "−" : "+", iconBg: isOpen ? "#C2185B" : "#23103a", bg: isOpen ? "#F4EEFF" : "transparent", toggle: () => setOpen((o) => ({ ...o, [f.key]: !o[f.key] })) };
        }),
    }))
    .filter((g) => g.items.length);

  const v = {
    ...c.base,
    chapters: ([["top", "00", "Got a Question?"]] as [string, string, string][])
      .concat(FAQ.map((g, i) => ["faq-" + g.id, "0" + (i + 1), g.title]))
      .map(([id, num, name]) => ({ num, name, href: `#${id}`, go: h(() => { setCat("all"); setQ(""); c.setMenu(false); setTimeout(() => scrollToId(id), 30); }) })),
    faqChips: CHIPS.map(([id, label, dot]) => ({ label, pressed: cat === id ? "true" : "false", dot: cat === id ? dot : "transparent", fg: cat === id ? "#23103a" : "#7a6890", onClick: () => { setCat(id); c.jumpTo("answers"); } })),
    faqQ: q,
    onFaqQ: (e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value),
    faqGroups,
    faqEmpty: faqGroups.length === 0,
  };
  return <FaqsView v={v} />;
}
