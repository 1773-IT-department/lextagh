"use client";

import {
  useCallback, useEffect, useId, useLayoutEffect, useRef, useState,
  type ComponentPropsWithRef, type CSSProperties, type KeyboardEvent, type Ref,
} from "react";
import { createPortal } from "react-dom";
import css from "./select.module.css";

/**
 * The Lexta dropdown: a real <select>, enhanced.
 *
 * The <select> is rendered on the server with the brand look (no native arrow, a teal chevron, the field's own border
 * and padding), stays the face of the field and is what the form posts, so every form works without JavaScript.
 * Once the page runs, a see-through combobox is laid over it (the WAI-ARIA select-only combobox pattern) and opens a
 * branded list: soft shadow, rounded corners, the chosen option ticked, a hover and keyboard highlight, arrows,
 * Home, End, Page Up and Down, type-ahead, Enter, Space, Escape and Tab, and a polite announcement of the choice.
 * Choosing an option sets the <select> and fires its input and change events, so onChange handlers, controlled
 * values and form posts behave as before.
 *
 * On touch screens (no hover, coarse pointer) the phone's own picker is used instead, unless nativeOnTouch is false.
 * Multiple selects and list boxes (size above 1) are left as they are.
 */
export type SelectProps = ComponentPropsWithRef<"select"> & {
  /** "field" (default) for forms and filters, "region" for the Where to Buy look with the round caret. */
  variant?: "field" | "region";
  /** Use the phone's own picker on touch screens (default true). */
  nativeOnTouch?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

type Item = { index: number; text: string; disabled: boolean; group: string | null };
type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number; up: boolean };

const TYPEAHEAD_MS = 600;
const PAGE = 10;
const PANEL_MAX = 320;

function readItems(s: HTMLSelectElement): Item[] {
  return Array.from(s.options).map((o, index) => {
    const g = o.parentElement instanceof HTMLOptGroupElement ? o.parentElement : null;
    return { index, text: o.text.replace(/\s+/g, " ").trim(), disabled: o.disabled || !!g?.disabled, group: g ? g.label : null };
  });
}

/** How the combobox is named: the select's aria-label or aria-labelledby, or its <label>s. */
function readLabelling(s: HTMLSelectElement, wrap: HTMLElement | null, uid: string): { label?: string; labelledby?: string } {
  const own = s.getAttribute("aria-label");
  if (own) return { label: own };
  const by = s.getAttribute("aria-labelledby");
  if (by) return { labelledby: by };
  const labels = Array.from(s.labels ?? []);
  if (!labels.length) return {};
  // A <label> around the field holds the select too, so take its own words only.
  if (labels.some((l) => l.contains(s))) {
    const text = labels.map((l) => {
      const c = l.cloneNode(true) as HTMLElement;
      c.querySelectorAll("[data-lx-select], select, [aria-hidden='true']").forEach((n) => n.remove());
      return c.textContent ?? "";
    }).join(" ").replace(/\s+/g, " ").trim();
    return text ? { label: text } : {};
  }
  return { labelledby: labels.map((l, i) => l.id || (l.id = `${uid}-label-${i}`)).filter((id) => !wrap?.contains(document.getElementById(id))).join(" ") };
}

const proto = typeof HTMLSelectElement === "undefined" ? null : HTMLSelectElement.prototype;
const nativeIndex = proto ? Object.getOwnPropertyDescriptor(proto, "selectedIndex") : undefined;
const nativeValue = proto ? Object.getOwnPropertyDescriptor(proto, "value") : undefined;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export default function Select({
  variant = "field", nativeOnTouch = true, wrapperClassName, wrapperStyle, className, ref, children, ...rest
}: SelectProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listId = `lxs-${uid}-list`;
  const optId = (i: number) => `lxs-${uid}-opt-${i}`;

  const wrap = useRef<HTMLSpanElement>(null);
  const select = useRef<HTMLSelectElement | null>(null);
  const combo = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  // Whether the highlighted option was last moved by the keyboard (Tab only commits a keyboard highlight).
  const activeByKey = useRef(true);

  const [enhanced, setEnhanced] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(-1);
  const [current, setCurrent] = useState({ index: -1, text: "", disabled: false });
  const [naming, setNaming] = useState<{ label?: string; labelledby?: string }>({});
  const [announce, setAnnounce] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [focusVisible, setFocusVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  // The browser's "please choose" message for a required field, shown under it (the select itself is hidden from
  // screen readers, so its own bubble would point at a field nobody can reach).
  const [validity, setValidity] = useState("");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const setSelectRef = useCallback((node: HTMLSelectElement | null) => {
    select.current = node;
    assignRef(ref, node);
  }, [ref]);

  /** Reads the chosen option back from the select (after a change, a reset, or a controlled value from React). */
  const sync = useCallback(() => {
    const s = select.current;
    if (!s) return;
    const index = s.selectedIndex;
    const text = index >= 0 ? (s.options[index]?.text ?? "").replace(/\s+/g, " ").trim() : "";
    // :disabled also covers a select inside a disabled <fieldset>.
    const disabled = s.matches(":disabled");
    if (s.validity.valid) setValidity("");
    setCurrent((c) => (c.index === index && c.text === text && c.disabled === disabled ? c : { index, text, disabled }));
  }, []);

  // Enhance once the page runs. The server HTML (and a browser without JavaScript) keeps the select alone.
  useEffect(() => {
    const s = select.current;
    if (!s || s.multiple || s.size > 1) return;
    if (nativeOnTouch && window.matchMedia?.("(hover: none) and (pointer: coarse)").matches) return;

    setNaming(readLabelling(s, wrap.current, uid));
    setPortalTarget(document.body);
    setEnhanced(true);
    sync();

    // A script that sets selectedIndex or value (a form reset after sending, for example) updates the combobox too.
    if (nativeIndex?.set && nativeValue?.set) {
      Object.defineProperty(s, "selectedIndex", {
        configurable: true, get() { return nativeIndex.get!.call(this); }, set(v) { nativeIndex.set!.call(this, v); queueMicrotask(sync); },
      });
      Object.defineProperty(s, "value", {
        configurable: true, get() { return nativeValue.get!.call(this); }, set(v) { nativeValue.set!.call(this, v); queueMicrotask(sync); },
      });
    }
    const onReset = () => setTimeout(sync, 0);
    // A <label> click (or anything else) that focuses the select hands focus to the combobox.
    const onFocus = () => { combo.current?.focus(); };
    // A required field left empty when the form is sent: show the browser's message under the field instead of its
    // bubble, and when this is the form's first problem, put focus on the combobox.
    const onInvalid = (e: Event) => {
      e.preventDefault();
      setValidity(s.validationMessage);
      const first = s.form && Array.from(s.form.elements).find((el) => !(el instanceof HTMLFieldSetElement) && el.matches(":invalid"));
      if (first === s) setTimeout(() => combo.current?.focus(), 0);
    };
    const form = s.form;
    s.addEventListener("change", sync);
    s.addEventListener("input", sync);
    s.addEventListener("focus", onFocus);
    s.addEventListener("invalid", onInvalid);
    form?.addEventListener("reset", onReset);
    const watch = new MutationObserver(() => { sync(); setNaming(readLabelling(s, wrap.current, uid)); });
    watch.observe(s, { childList: true, subtree: true, attributes: true, characterData: true });
    // A <fieldset disabled> around the field (at any depth) disables it too.
    for (let f = s.parentElement?.closest("fieldset"); f; f = f.parentElement?.closest("fieldset")) {
      watch.observe(f, { attributes: true, attributeFilter: ["disabled"] });
    }
    return () => {
      delete (s as unknown as Record<string, unknown>).selectedIndex;
      delete (s as unknown as Record<string, unknown>).value;
      s.removeEventListener("change", sync);
      s.removeEventListener("input", sync);
      s.removeEventListener("focus", onFocus);
      s.removeEventListener("invalid", onInvalid);
      form?.removeEventListener("reset", onReset);
      watch.disconnect();
    };
  }, [nativeOnTouch, sync, uid]);

  // React may have changed a controlled value, the options or a fieldset's disabled on this render.
  useLayoutEffect(() => { if (enhanced) sync(); });
  // A field that becomes disabled while its list is open closes the list.
  useEffect(() => { if (current.disabled && open) { setOpen(false); setPlace(null); } }, [current.disabled, open]);

  const firstEnabled = (from: number, step: 1 | -1, list: Item[]) => {
    for (let i = from; i >= 0 && i < list.length; i += step) if (!list[i].disabled) return i;
    return -1;
  };

  const openList = (target?: "first" | "last" | number) => {
    const s = select.current;
    if (!s || s.matches(":disabled")) return;
    const all = readItems(s);
    setItems(all);
    let start = s.selectedIndex >= 0 && !all[s.selectedIndex]?.disabled ? s.selectedIndex : firstEnabled(0, 1, all);
    if (target === "first") start = firstEnabled(0, 1, all);
    else if (target === "last") start = firstEnabled(all.length - 1, -1, all);
    else if (typeof target === "number") start = target;
    setActive(start);
    activeByKey.current = true;
    setPlace(null);
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    setPlace(null);
    if (refocus) combo.current?.focus();
  };

  const choose = (index: number, refocus = true) => {
    const s = select.current;
    const opt = s?.options[index];
    if (!s || !opt || s.matches(":disabled") || opt.disabled || (opt.parentElement instanceof HTMLOptGroupElement && opt.parentElement.disabled)) { close(refocus); return; }
    if (s.selectedIndex !== index) {
      nativeIndex?.set ? nativeIndex.set.call(s, index) : (s.selectedIndex = index);
      s.dispatchEvent(new Event("input", { bubbles: true }));
      s.dispatchEvent(new Event("change", { bubbles: true }));
      const said = opt.text.replace(/\s+/g, " ").trim();
      setAnnounce("");
      setTimeout(() => setAnnounce(`${said}, selected`), 30);
    }
    sync();
    close(refocus);
  };

  /** Type-ahead: letters typed in quick succession find the next option that starts with them. */
  const typeahead = (key: string, list: Item[], from: number) => {
    const now = Date.now();
    const t = typed.current;
    t.text = now - t.at > TYPEAHEAD_MS ? key : t.text + key;
    t.at = now;
    const needle = t.text.toLowerCase();
    const repeat = needle.length > 1 && needle.split("").every((ch) => ch === needle[0]);
    const search = repeat ? needle[0] : needle;
    const startAt = repeat || needle.length === 1 ? from + 1 : Math.max(from, 0);
    for (let k = 0; k < list.length; k += 1) {
      const it = list[(startAt + k) % list.length];
      if (!it.disabled && it.text.toLowerCase().startsWith(search)) return it.index;
    }
    return -1;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (current.disabled) return;
    const { key } = e;
    const printable = key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    const typing = Date.now() - typed.current.at < TYPEAHEAD_MS && typed.current.text !== "";

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(key)) { e.preventDefault(); openList(); return; }
      if (key === "Home") { e.preventDefault(); openList("first"); return; }
      if (key === "End") { e.preventDefault(); openList("last"); return; }
      if (printable) {
        const s = select.current;
        if (!s) return;
        const all = readItems(s);
        const hit = typeahead(key, all, s.selectedIndex);
        e.preventDefault();
        openList(hit >= 0 ? hit : undefined);
      }
      return;
    }

    const move = (to: number) => { if (to >= 0) { setActive(to); activeByKey.current = true; } };
    switch (key) {
      case "ArrowDown": e.preventDefault(); move(firstEnabled(active + 1, 1, items)); return;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) { choose(active); return; }
        move(firstEnabled(Math.max(active - 1, 0), -1, items));
        return;
      case "Home": e.preventDefault(); move(firstEnabled(0, 1, items)); return;
      case "End": e.preventDefault(); move(firstEnabled(items.length - 1, -1, items)); return;
      case "PageDown": e.preventDefault(); move(firstEnabled(Math.min(active + PAGE, items.length - 1), -1, items)); return;
      case "PageUp": e.preventDefault(); move(firstEnabled(Math.max(active - PAGE, 0), 1, items)); return;
      case "Enter": e.preventDefault(); choose(active); return;
      case "Escape": e.preventDefault(); e.stopPropagation(); close(); return;
      // Tab keeps an option the keyboard moved to; a highlight left by the mouse is not a choice.
      case "Tab": if (activeByKey.current) choose(active, false); else close(false); return;
      case " ":
        if (!typing) { e.preventDefault(); choose(active); return; }
        break;
      default:
        break;
    }
    if (printable) {
      e.preventDefault();
      const hit = typeahead(key, items, active);
      move(hit);
    }
  };

  // Place the open list under the field, or above it when there is more room there; keep it inside the window.
  const placeList = useCallback(() => {
    const anchor = wrap.current?.getBoundingClientRect();
    const el = list.current;
    if (!anchor || !el) return;
    const margin = 8;
    const gap = 6;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const content = Math.min(el.scrollHeight, PANEL_MAX);
    const below = vh - anchor.bottom - gap - margin;
    const above = anchor.top - gap - margin;
    const up = below < Math.min(content, 180) && above > below;
    const room = Math.max(96, up ? above : below);
    const width = Math.min(Math.max(anchor.width, 200), vw - margin * 2);
    const left = Math.min(Math.max(anchor.left, margin), vw - margin - width);
    const next: Place = up
      ? { left, width, bottom: vh - anchor.top + gap, maxHeight: Math.min(PANEL_MAX, room), up }
      : { left, width, top: anchor.bottom + gap, maxHeight: Math.min(PANEL_MAX, room), up };
    setPlace((p) => (p && p.left === next.left && p.width === next.width && p.top === next.top && p.bottom === next.bottom && p.maxHeight === next.maxHeight ? p : next));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    placeList();
    // Follow the field while it moves; once it has scrolled out of the window, close the list.
    const onMove = () => {
      const r = wrap.current?.getBoundingClientRect();
      if (r && (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > document.documentElement.clientWidth)) {
        setOpen(false);
        setPlace(null);
        return;
      }
      placeList();
    };
    const onPointer = (ev: PointerEvent) => {
      const t = ev.target as Node;
      if (wrap.current?.contains(t) || list.current?.contains(t)) return;
      setOpen(false);
      setPlace(null);
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, placeList]);

  // Keep the highlighted option in view inside the list.
  useLayoutEffect(() => {
    if (!open || !place || active < 0) return;
    const el = list.current;
    const opt = el?.querySelector<HTMLElement>(`#${CSS.escape(optId(active))}`);
    if (!el || !opt) return;
    const top = opt.offsetTop - 6;
    const bottom = opt.offsetTop + opt.offsetHeight + 6;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
  }, [open, place, active]);

  const describedby = rest["aria-describedby"];
  const invalid = rest["aria-invalid"];
  const required = rest.required;

  const panel = open && portalTarget ? createPortal(
    <div
      ref={list}
      id={listId}
      role="listbox"
      tabIndex={-1}
      aria-label={naming.label}
      aria-labelledby={naming.labelledby || undefined}
      className={css.panel}
      data-lx-select-panel=""
      data-up={place?.up ? "" : undefined}
      data-measuring={place ? undefined : ""}
      onMouseDown={(e) => e.preventDefault()}
      style={place ? { left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight } : { left: 0, top: 0, width: 240, maxHeight: PANEL_MAX }}
    >
      {groupItems(items).map((block, b) => {
        const opts = block.items.map((it) => {
          const checked = it.index === current.index;
          return (
            <div
              key={it.index}
              id={optId(it.index)}
              role="option"
              aria-selected={it.index === active}
              aria-disabled={it.disabled || undefined}
              data-active={it.index === active ? "" : undefined}
              data-checked={checked ? "" : undefined}
              className={css.option}
              onMouseMove={() => { if (!it.disabled && active !== it.index) { setActive(it.index); activeByKey.current = false; } }}
              onClick={() => { if (!it.disabled) choose(it.index); }}
            >
              <span className={css.optionText}>{it.text || " "}</span>
              {checked && (
                <svg className={css.tick} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        });
        if (block.group === null) return opts;
        const gid = `lxs-${uid}-group-${b}`;
        return (
          <div key={`g${b}`} role="group" aria-labelledby={gid}>
            <div id={gid} role="presentation" className={css.group}>{block.group}</div>
            {opts}
          </div>
        );
      })}
    </div>,
    portalTarget,
  ) : null;

  return (
    <>
    <span
      ref={wrap}
      className={[css.wrap, wrapperClassName].filter(Boolean).join(" ")}
      style={wrapperStyle}
      data-lx-select=""
      data-variant={variant}
      data-enhanced={enhanced ? "" : undefined}
      data-open={open ? "" : undefined}
      data-focus-visible={focusVisible ? "" : undefined}
      data-focus={focused ? "" : undefined}
      data-invalid={validity ? "" : undefined}
    >
      <select
        {...rest}
        ref={setSelectRef}
        className={[css.select, className].filter(Boolean).join(" ")}
        tabIndex={enhanced ? -1 : rest.tabIndex}
        aria-hidden={enhanced ? true : rest["aria-hidden"]}
      >
        {children}
      </select>
      <span className={css.chevron} aria-hidden="true">
        {variant === "region" ? "▼" : (
          <svg viewBox="0 0 12 12" focusable="false">
            <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {enhanced && (
        <>
          <div
            ref={combo}
            role="combobox"
            tabIndex={current.disabled ? -1 : 0}
            className={css.combo}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
            aria-label={naming.label}
            aria-labelledby={naming.labelledby || undefined}
            aria-describedby={[describedby, validity ? `lxs-${uid}-validity` : ""].filter(Boolean).join(" ") || undefined}
            aria-invalid={invalid || (validity ? true : undefined)}
            aria-required={required || undefined}
            aria-disabled={current.disabled || undefined}
            data-lx-select-combo=""
            onClick={(e) => {
              // A <label> around the field would otherwise pass the click on to the select (and take focus away).
              e.preventDefault();
              if (current.disabled) return;
              if (open) close(); else openList();
            }}
            onKeyDown={onKeyDown}
            onFocus={(e) => { setFocused(true); setFocusVisible(e.currentTarget.matches(":focus-visible")); }}
            onBlur={(e) => {
              setFocused(false);
              setFocusVisible(false);
              const to = e.relatedTarget as Node | null;
              if (open && to !== select.current && !list.current?.contains(to)) { setOpen(false); setPlace(null); }
            }}
          >
            {current.text}
          </div>
          <span className={css.sr} role="status" aria-live="polite">{announce}</span>
          {panel}
        </>
      )}
    </span>
    {validity && <span id={`lxs-${uid}-validity`} className={css.validity}>{validity}</span>}
    </>
  );
}

function groupItems(items: Item[]): { group: string | null; items: Item[] }[] {
  const out: { group: string | null; items: Item[] }[] = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (last && last.group === it.group) last.items.push(it);
    else out.push({ group: it.group, items: [it] });
  }
  return out;
}
