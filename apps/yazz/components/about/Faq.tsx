"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import type { FaqGroup } from "@/content/faqs";
import s from "./about.module.css";

/**
 * Questions & answers: the prototype's FAQs page folded into About Us. Topic chips filter the groups and a search box
 * narrows the questions (with JavaScript); each answer is a <details> element, so it opens without JavaScript too.
 */
export default function Faq({ groups }: { groups: FaqGroup[] }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const shown = groups
    .filter((g) => cat === "all" || g.id === cat)
    .map((g) => ({ ...g, items: g.items.filter((it) => !query || `${it.q} ${it.a}`.toLowerCase().includes(query)) }))
    .filter((g) => g.items.length);

  return (
    <div className={s.faq}>
      <div className={s.faqTools}>
        <div className={s.faqChips} role="group" aria-label="Question topics">
          <button type="button" className="yz-chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>All topics</button>
          {groups.map((g) => (
            <button key={g.id} type="button" className="yz-chip" aria-pressed={cat === g.id} onClick={() => setCat(g.id)}>{g.name}</button>
          ))}
        </div>
        <label className={s.faqSearch}>
          <Icon name="search" size={18} />
          <span className="yz-sr">Search questions</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions, e.g. school" />
        </label>
      </div>
      {shown.length === 0 && <p className={s.faqEmpty} role="status">No questions match. Try another word, or <Link href="/contact?topic=question#message">ask us directly</Link>.</p>}
      {shown.map((g) => (
        <section key={g.id} className={s.faqGroup} aria-labelledby={`faq-${g.id}`}>
          <h3 id={`faq-${g.id}`} className={s.faqHead}><span><Icon name={g.icon} size={18} /></span> {g.name}</h3>
          {g.items.map((it, k) => (
            <details key={it.q} className={s.faqItem} open={(k === 0 && g.id === groups[0].id && !query) || !!query || undefined}>
              <summary>
                {it.q}
                <span className={s.faqIcon} aria-hidden="true"><Icon name="plus" size={18} className={s.plus} /><Icon name="minus" size={18} className={s.minus} /></span>
              </summary>
              <div className={s.faqAnswer}>
                <p>{it.a}</p>
                {it.link && <Link href={it.link.href} className="yz-textlink">{it.link.label} <Icon name="arrow" size={14} /></Link>}
              </div>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
