import type { CSSProperties } from "react";

// The prototype writes its styles as CSS text with {{ values }} in them; css() turns that text into a React style object
// (the same rules as the Claude Design runtime: kebab-case to camelCase, custom properties kept as they are).
const cache = new Map<string, CSSProperties>();
const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export function css(text: string): CSSProperties {
  const hit = cache.get(text);
  if (hit) return hit;
  const o: Record<string, string> = {};
  for (const decl of text.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    o[prop.startsWith("--") ? prop : camel(prop)] = decl.slice(i + 1).trim();
  }
  if (cache.size > 500) cache.clear();
  cache.set(text, o as CSSProperties);
  return o as CSSProperties;
}
