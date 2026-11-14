import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

const arrow: CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,.28)", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 12,
};

/** The prototype's solid blue button with the round arrow badge (used on most pages). badgeStyle tweaks the badge where a page differs. */
export default function ArrowButton({ href, padding, children, style, badgeStyle, onClick }: {
  href: string; padding: string; children: ReactNode; style?: CSSProperties; badgeStyle?: CSSProperties; onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 12, background: "#12a3c4", color: "#fff", fontSize: 13,
        fontWeight: 600, padding, borderRadius: 7, ...style,
      }}
    >
      {children}
      <span aria-hidden="true" style={badgeStyle ? { ...arrow, ...badgeStyle } : arrow}>→</span>
    </Link>
  );
}
