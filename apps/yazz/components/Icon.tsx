import type { CSSProperties } from "react";

/**
 * The prototype's icons (Material Symbols) as inline SVG line icons, so pages need no icon font: nothing to download,
 * and no icon names showing as words while a font loads. Decorative: always hidden from screen readers.
 */
const PATHS: Record<string, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-left": "M15 6l-6 6 6 6",
  "chevron-right": "M9 6l6 6-6 6",
  shield: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z",
  people: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 010 6.4M18.5 14.8c1.7.8 2.8 2.6 3 5.2",
  leaf: "M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19c3-4 6-7 10-9",
  heart: "M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.3 3 4.2 6.2C19.5 15.4 12 20 12 20z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2",
  female: "M12 14a5 5 0 100-10 5 5 0 000 10zM12 14v7M9 18h6",
  tooth: "M7.5 3.5c-2.5 0-4 2-4 4.5 0 3 1.5 4 2 7l1 5.5c.2 1 1.5 1 1.8 0L10 15c.4-1.3 1.6-1.3 2 0l1.7 5.5c.3 1 1.6 1 1.8 0l1-5.5c.5-3 2-4 2-7 0-2.5-1.5-4.5-4-4.5-1.7 0-2.4 1-4.5 1s-2.8-1-4.5-1z",
  home: "M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5",
  store: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3M9 20v-5h6v5",
  air: "M3 8h11a3 3 0 10-3-3M3 12h16a3 3 0 11-3 3M3 16h8",
  flower: "M12 21c-4 0-7-2.5-7-7 2.5 0 5 1 7 4 2-3 4.5-4 7-4 0 4.5-3 7-7 7zM12 18c-2-3-2-8 0-12 2 4 2 9 0 12z",
  check: "M12 21a9 9 0 100-18 9 9 0 000 18zM8 12.5l3 3 5-6",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  drop: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
  box: "M4 7.5L12 4l8 3.5v9L12 20l-8-3.5zM4 7.5l8 3.5 8-3.5M12 11v9",
  pin: "M12 21s7-6.2 7-12a7 7 0 00-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  truck: "M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5V16h-7M6.5 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
  phone: "M5 3.5h3.5l1.8 4.5-2.3 1.4a11 11 0 006.6 6.6l1.4-2.3 4.5 1.8V19a1.5 1.5 0 01-1.5 1.5C10.5 20.5 3.5 13.5 3.5 5A1.5 1.5 0 015 3.5z",
  mail: "M3.5 5.5h17v13h-17zM3.5 6l8.5 7 8.5-7",
  chat: "M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H10l-4.2 3.6c-.3.3-.8 0-.8-.4V16h-.5A.5.5 0 014 15.5z",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  search: "M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16 16l5 5",
  menu: "M4 7h16M4 12h16M4 17h16",
  print: "M7 9V3.5h10V9M7 17H4.5V9h15v8H17M7 14h10v6.5H7z",
  book: "M4 5.5C6.5 4 9.5 4 12 5.5v14c-2.5-1.5-5.5-1.5-8 0zM20 5.5c-2.5-1.5-5.5-1.5-8 0v14c2.5-1.5 5.5-1.5 8 0z",
  edit: "M4 20h4l11-11-4-4L4 16zM13.5 6.5l4 4",
  eye: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 13a1 1 0 100-2 1 1 0 000 2z",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z",
  handshake: "M3 12l4-4 3 1 3-2 4 1 4 4-5 5-3-2-2 2-3-1zM10 9l3 3",
  recycle: "M7 7l2.5-4h5L17 7M17 7l-3 .5M17 7l.5-3M20 13l2 4-2.5 4H14M14 21l2-2.5M14 21l2.5 2M7 21H4.5L2 17l2-4M4 13l3.5 1M4 13l-1 3.5",
  brush: "M7 21l3-9M10 12l4-9h3l-3 9zM6 21h5",
  laundry: "M4.5 3.5h15v17h-15zM4.5 7h15M12 18a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM7 5.2h.1M9.5 5.2h.1",
  tissue: "M4 10h16v10H4zM8 10c0-3 2-6 4-6s4 3 4 6M4 14h16",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  ruler: "M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4",
  whatsapp: "M4 20l1.2-4A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4-1zM9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.3-2.3l.8-1-1-2z",
  baby: "M12 12a4 4 0 100-8 4 4 0 000 8zM10.5 8h.1M13.5 8h.1M10.8 10c.7.5 1.7.5 2.4 0M7 20c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5M12 4c0-1 .6-1.5 1.5-1.5",
  facebook: "M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.5-.8z",
  instagram: "M7.5 3.5h9a4 4 0 014 4v9a4 4 0 01-4 4h-9a4 4 0 01-4-4v-9a4 4 0 014-4zM12 16a4 4 0 100-8 4 4 0 000 8zM17.2 6.8h.1",
  tiktok: "M14 3.5v11.2a3.3 3.3 0 11-3.3-3.3M14 3.5c.4 2.6 2.2 4.4 5 4.6",
  youtube: "M21 8.2c-.2-1.5-1.2-2.5-2.7-2.6C16.3 5.4 14 5.3 12 5.3s-4.3.1-6.3.3C4.2 5.7 3.2 6.7 3 8.2 2.8 9.5 2.8 10.7 2.8 12s0 2.5.2 3.8c.2 1.5 1.2 2.5 2.7 2.6 2 .2 4.3.3 6.3.3s4.3-.1 6.3-.3c1.5-.1 2.5-1.1 2.7-2.6.2-1.3.2-2.5.2-3.8s0-2.5-.2-3.8zM10 9l5 3-5 3z",
};

export type IconProps = { name: keyof typeof PATHS | string; size?: number; style?: CSSProperties; className?: string; strokeWidth?: number };

export default function Icon({ name, size = 18, style, className, strokeWidth = 1.9 }: IconProps) {
  const d = PATHS[name] ?? PATHS.arrow;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flex: "none", display: "inline-block", verticalAlign: "middle", ...style }}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
