// The light article format of content/articles.ts (see its header), parsed into blocks for the article page.

export type Block =
  | { kind: "h" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "tip"; label: string | null; text: string };

/** Parses the light article format of content/articles.ts (see its header). */
export function parseBody(body: string): Block[] {
  return body.trim().split(/\n\s*\n/).map((raw): Block => {
    const block = raw.trim();
    const lines = block.split("\n").map((l) => l.trim());
    if (block.startsWith("### ")) return { kind: "h3", text: block.slice(4).trim() };
    if (block.startsWith("## ")) return { kind: "h", text: block.slice(3).trim() };
    if (block.startsWith("> ")) {
      const parts = lines.map((l) => l.replace(/^>\s?/, ""));
      const label = /^\*\*(.+)\*\*$/.exec(parts[0])?.[1] ?? null;
      return { kind: "tip", label, text: (label ? parts.slice(1) : parts).join(" ") };
    }
    if (lines.every((l) => l.startsWith("- "))) return { kind: "ul", items: lines.map((l) => l.slice(2)) };
    if (lines.every((l) => /^\d+\.\s/.test(l))) return { kind: "ol", items: lines.map((l) => l.replace(/^\d+\.\s/, "")) };
    return { kind: "p", text: lines.join(" ") };
  });
}
