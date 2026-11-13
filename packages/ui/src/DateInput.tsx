"use client";

import {
  useCallback, useEffect, useId, useLayoutEffect, useRef, useState,
  type ComponentPropsWithRef, type CSSProperties, type KeyboardEvent, type Ref,
} from "react";
import { createPortal } from "react-dom";
import css from "./date.module.css";

/**
 * The Lexta date field: a real <input type="date">, enhanced, the same way as Select.
 *
 * The input is rendered on the server with the brand look (the field's own border and padding, a teal calendar icon in
 * place of the browser's), keeps its name and its yyyy-mm-dd value, is what the form posts, and can still be typed in.
 * Without JavaScript the icon opens the browser's own picker. Once the page runs, the icon becomes a button that opens a
 * branded calendar (the WAI-ARIA date picker dialog pattern): arrows by day and week, Page Up and Down by month, with
 * Shift by year, Home and End for the start and end of the week (Monday to Sunday), Enter or Space to choose, Escape to
 * close; min and max respected, Today and Clear (Clear only when the field is not required), the choice announced.
 * Choosing sets the input and fires its input and change events, so onChange handlers and controlled values behave as
 * before. On touch screens the phone's own picker is used. datetime-local, time and month get the branded face only.
 */
export type DateInputProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  type?: "date" | "datetime-local" | "time" | "month";
  /** Use the phone's own picker on touch screens (default true). */
  nativeOnTouch?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

type Place = { left: number; width: number; top?: number; bottom?: number; up: boolean };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = [["Mo", "Monday"], ["Tu", "Tuesday"], ["We", "Wednesday"], ["Th", "Thursday"], ["Fr", "Friday"], ["Sa", "Saturday"], ["Su", "Sunday"]];
const PANEL_W = 300;

/** Dates are plain calendar days, kept as yyyy-mm-dd and handled in UTC so no time zone can shift them. */
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (v: string | null | undefined): Date | null => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const addMonths = (d: Date, n: number) => {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
};
const todayIso = () => {
  const n = new Date();
  return iso(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())));
};
const spoken = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const weekday = (d: Date) => (d.getUTCDay() + 6) % 7; // Monday 0 ... Sunday 6

const proto = typeof HTMLInputElement === "undefined" ? null : HTMLInputElement.prototype;
const nativeValue = proto ? Object.getOwnPropertyDescriptor(proto, "value") : undefined;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function Icon({ type }: { type: string }) {
  if (type === "time") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 4.6V8l2.4 1.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="1.8" y="3" width="12.4" height="11.2" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M1.8 6.6h12.4M5.2 1.4v3M10.8 1.4v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4.4" y="8.6" width="2.2" height="2.2" rx=".5" fill="currentColor" />
    </svg>
  );
}

export default function DateInput({
  type = "date", nativeOnTouch = true, wrapperClassName, wrapperStyle, className, ref, ...rest
}: DateInputProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const headId = `lxd-${uid}-head`;
  const dayId = (v: string) => `lxd-${uid}-${v}`;

  const wrap = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const [enhanced, setEnhanced] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusDay, setFocusDay] = useState<Date>(() => new Date(0));
  const [value, setValue] = useState("");
  const [bounds, setBounds] = useState<{ min: Date | null; max: Date | null; required: boolean }>({ min: null, max: null, required: false });
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState("");
  const [announce, setAnnounce] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const moveFocus = useRef(false);
  const openRef = useRef<() => void>(() => {});

  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    input.current = node;
    assignRef(ref, node);
  }, [ref]);

  const sync = useCallback(() => {
    const el = input.current;
    if (!el) return;
    setValue((v) => (v === el.value ? v : el.value));
    // :disabled also covers a field inside a disabled <fieldset>; a read only field cannot be chosen either.
    const off = el.matches(":disabled") || el.readOnly;
    setDisabled((d) => (d === off ? d : off));
  }, []);

  useEffect(() => {
    const el = input.current;
    if (!el || type !== "date") return;
    if (nativeOnTouch && window.matchMedia?.("(hover: none) and (pointer: coarse)").matches) return;
    const readLabel = () => setLabel(Array.from(el.labels ?? []).map((l) => l.textContent ?? "").join(" ").replace(/\s+/g, " ").trim()
      || el.getAttribute("aria-label") || "");
    readLabel();
    setPortalTarget(document.body);
    setEnhanced(true);
    sync();
    // A script that sets the value (a reset after sending, for example) is picked up too.
    if (nativeValue?.set) {
      Object.defineProperty(el, "value", {
        configurable: true, get() { return nativeValue.get!.call(this); }, set(v) { nativeValue.set!.call(this, v); queueMicrotask(sync); },
      });
    }
    const onReset = () => setTimeout(sync, 0);
    // Alt and Down Arrow (the browser's own shortcut for its picker) opens the branded calendar instead.
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); openRef.current(); } };
    const form = el.form;
    el.addEventListener("keydown", onKey);
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
    form?.addEventListener("reset", onReset);
    const watch = new MutationObserver(() => { sync(); readLabel(); });
    watch.observe(el, { attributes: true });
    for (let f = el.parentElement?.closest("fieldset"); f; f = f.parentElement?.closest("fieldset")) {
      watch.observe(f, { attributes: true, attributeFilter: ["disabled"] });
    }
    return () => {
      delete (el as unknown as Record<string, unknown>).value;
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("input", sync);
      el.removeEventListener("change", sync);
      form?.removeEventListener("reset", onReset);
      watch.disconnect();
    };
  }, [type, nativeOnTouch, sync]);

  useLayoutEffect(() => { if (enhanced) sync(); });
  useEffect(() => { if (disabled && open) { setOpen(false); setPlace(null); } }, [disabled, open]);

  const inRange = (d: Date) => (!bounds.min || d >= bounds.min) && (!bounds.max || d <= bounds.max);
  const clampDay = (d: Date, min: Date | null, max: Date | null) => (min && d < min ? min : max && d > max ? max : d);

  const openCalendar = () => {
    const el = input.current;
    if (!el || el.matches(":disabled") || el.readOnly) return;
    const min = parse(el.min);
    const max = parse(el.max);
    setBounds({ min, max, required: el.required });
    const start = parse(el.value) ?? clampDay(parse(todayIso())!, min, max);
    setFocusDay(start);
    moveFocus.current = true;
    setPlace(null);
    setOpen(true);
  };

  openRef.current = openCalendar;

  const close = (refocus = true) => {
    setOpen(false);
    setPlace(null);
    if (refocus) trigger.current?.focus();
  };

  const commit = (next: string) => {
    const el = input.current;
    if (!el || el.matches(":disabled")) return;
    if (el.value !== next) {
      nativeValue?.set ? nativeValue.set.call(el, next) : (el.value = next);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      setAnnounce("");
      const d = parse(next);
      setTimeout(() => setAnnounce(d ? `${spoken(d)}, selected` : "Date cleared"), 30);
    }
    sync();
    close();
  };
  const choose = (d: Date) => { if (inRange(d)) commit(iso(d)); };

  const moveTo = (d: Date) => { setFocusDay(d); moveFocus.current = true; };

  const onGridKey = (e: KeyboardEvent<HTMLElement>) => {
    const d = focusDay;
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(d, -1); break;
      case "ArrowRight": next = addDays(d, 1); break;
      case "ArrowUp": next = addDays(d, -7); break;
      case "ArrowDown": next = addDays(d, 7); break;
      case "Home": next = addDays(d, -weekday(d)); break;
      case "End": next = addDays(d, 6 - weekday(d)); break;
      case "PageUp": next = addMonths(d, e.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(d, e.shiftKey ? 12 : 1); break;
      case "Enter": case " ": e.preventDefault(); choose(d); return;
      default: return;
    }
    e.preventDefault();
    moveTo(next);
  };

  // Escape closes from anywhere in the dialog; Tab and Shift Tab stay inside it.
  const onDialogKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== "Tab") return;
    const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []).filter((b) => b.tabIndex !== -1);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const to = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
    e.preventDefault();
    items[to].focus();
  };

  // Keyboard focus follows the day that moved, once it is drawn.
  useLayoutEffect(() => {
    if (!open || !place || !moveFocus.current) return;
    moveFocus.current = false;
    dialog.current?.querySelector<HTMLElement>(`#${CSS.escape(dayId(iso(focusDay)))}`)?.focus();
  });

  const placeDialog = useCallback(() => {
    const anchor = wrap.current?.getBoundingClientRect();
    const el = dialog.current;
    if (!anchor || !el) return;
    const margin = 8;
    const gap = 6;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const h = el.offsetHeight;
    const below = vh - anchor.bottom - gap - margin;
    const above = anchor.top - gap - margin;
    const up = below < h && above > below;
    const width = Math.min(PANEL_W, vw - margin * 2);
    const left = Math.min(Math.max(anchor.left, margin), vw - margin - width);
    const next: Place = up ? { left, width, bottom: vh - anchor.top + gap, up } : { left, width, top: anchor.bottom + gap, up };
    setPlace((p) => (p && p.left === next.left && p.width === next.width && p.top === next.top && p.bottom === next.bottom ? p : next));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    placeDialog();
    const onMove = () => {
      const r = wrap.current?.getBoundingClientRect();
      if (r && (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > document.documentElement.clientWidth)) {
        setOpen(false);
        setPlace(null);
        return;
      }
      placeDialog();
    };
    const onPointer = (ev: PointerEvent) => {
      const t = ev.target as Node;
      if (wrap.current?.contains(t) || dialog.current?.contains(t)) return;
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
  }, [open, placeDialog]);

  // The month shown, as weeks of seven cells (Monday first); empty cells outside the month.
  const first = new Date(Date.UTC(focusDay.getUTCFullYear(), focusDay.getUTCMonth(), 1));
  const daysIn = new Date(Date.UTC(focusDay.getUTCFullYear(), focusDay.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = [...Array(weekday(first)).fill(null), ...Array.from({ length: daysIn }, (_, i) => addDays(first, i))];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const today = todayIso();
  const prevOk = !bounds.min || addDays(first, -1) >= bounds.min;
  const nextOk = !bounds.max || addDays(first, daysIn) <= bounds.max;

  const panel = open && portalTarget ? createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headId}
      className={css.dialog}
      data-lx-date-dialog=""
      data-up={place?.up ? "" : undefined}
      data-measuring={place ? undefined : ""}
      onKeyDown={onDialogKey}
      style={place ? { left: place.left, width: place.width, top: place.top, bottom: place.bottom } : { left: 0, top: 0, width: PANEL_W }}
    >
      <div className={css.head}>
        <button type="button" className={css.nav} aria-label="Previous month" disabled={!prevOk} onClick={() => setFocusDay(clampDay(addMonths(focusDay, -1), bounds.min, bounds.max))}>
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M7.5 2.5L4 6l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h2 id={headId} className={css.title} aria-live="polite">{MONTHS[focusDay.getUTCMonth()]} {focusDay.getUTCFullYear()}</h2>
        <button type="button" className={css.nav} aria-label="Next month" disabled={!nextOk} onClick={() => setFocusDay(clampDay(addMonths(focusDay, 1), bounds.min, bounds.max))}>
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M4.5 2.5L8 6 4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <table role="grid" aria-labelledby={headId} className={css.grid}>
        <thead>
          <tr>{DAYS.map(([s, l]) => <th key={s} scope="col" abbr={l}><span aria-hidden="true">{s}</span><span className={css.sr}>{l}</span></th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((w, wi) => (
            <tr key={wi}>
              {w.map((d, di) => {
                if (!d) return <td key={di} />;
                const v = iso(d);
                const ok = inRange(d);
                const selected = v === value;
                const focusable = v === iso(focusDay);
                return (
                  <td key={di}>
                    <button
                      type="button"
                      id={dayId(v)}
                      className={css.day}
                      tabIndex={focusable ? 0 : -1}
                      aria-selected={selected || undefined}
                      aria-current={v === today ? "date" : undefined}
                      aria-disabled={ok ? undefined : true}
                      aria-label={`${spoken(d)}${ok ? "" : ", not available"}`}
                      data-selected={selected ? "" : undefined}
                      data-today={v === today ? "" : undefined}
                      onKeyDown={onGridKey}
                      onClick={() => { setFocusDay(d); choose(d); }}
                    >
                      {d.getUTCDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={css.foot}>
        <button type="button" className={css.action} disabled={!inRange(parse(today)!)} onClick={() => commit(today)}>Today</button>
        {!bounds.required && <button type="button" className={css.action} onClick={() => commit("")}>Clear</button>}
      </div>
    </div>,
    portalTarget,
  ) : null;

  return (
    <span
      ref={wrap}
      className={[css.wrap, wrapperClassName].filter(Boolean).join(" ")}
      style={wrapperStyle}
      data-lx-date=""
      data-type={type}
      data-enhanced={enhanced ? "" : undefined}
      data-open={open ? "" : undefined}
    >
      <input {...rest} type={type} ref={setInputRef} className={[css.input, className].filter(Boolean).join(" ")} />
      <span className={css.icon} aria-hidden="true"><Icon type={type} /></span>
      {enhanced && (
        <>
          <button
            ref={trigger}
            type="button"
            className={css.trigger}
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={disabled}
            data-lx-date-trigger=""
            onClick={() => (open ? close() : openCalendar())}
          >
            <span className={css.sr}>{`Choose a date${label ? ` for ${label}` : ""}${value && parse(value) ? `, ${spoken(parse(value)!)} chosen` : ""}`}</span>
          </button>
          <span className={css.sr} role="status" aria-live="polite">{announce}</span>
          {panel}
        </>
      )}
    </span>
  );
}
