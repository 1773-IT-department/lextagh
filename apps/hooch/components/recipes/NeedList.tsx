"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import s from "./recipes.module.css";

/** "You need": tick things off as you gather them (a little checklist; nothing is saved). */
export default function NeedList({ items }: { items: string[] }) {
  const [got, setGot] = useState<string[]>([]);
  return (
    <ul className={s.need}>
      {items.map((it) => {
        const on = got.includes(it);
        return (
          <li key={it}>
            <button type="button" aria-pressed={on} className={s.needItem} onClick={() => setGot((g) => (on ? g.filter((x) => x !== it) : [...g, it]))}>
              <span className={s.box} aria-hidden="true"><Icon name="check" size={18} /></span> {it}
            </button>
          </li>
        );
      })}
      {got.length === items.length && <li className={s.ready} role="status">Ready? Pour, add and enjoy!</li>}
    </ul>
  );
}
