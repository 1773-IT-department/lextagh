import Link from "next/link";
import type { ReactNode } from "react";

export type TextLink = { phrase: string; href: string };

const linkStyle = { color: "#0b6d88", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 } as const;

/**
 * Plain approved copy with some phrases turned into links (first occurrence of each phrase).
 * Lets answers such as "Request one through the Partner With Us form" link to the page they name
 * without changing a word of the text.
 */
export default function LinkedText({ text, links }: { text: string; links?: TextLink[] }) {
  if (!links?.length) return <>{text}</>;
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  // Apply links in the order they appear in the text.
  const ordered = links
    .map((l) => ({ ...l, at: text.indexOf(l.phrase) }))
    .filter((l) => l.at >= 0)
    .sort((a, b) => a.at - b.at);
  for (const l of ordered) {
    const i = rest.indexOf(l.phrase);
    if (i < 0) continue;
    if (i > 0) parts.push(rest.slice(0, i));
    parts.push(<Link key={key++} href={l.href} style={linkStyle}>{l.phrase}</Link>);
    rest = rest.slice(i + l.phrase.length);
  }
  parts.push(rest);
  return <>{parts}</>;
}
