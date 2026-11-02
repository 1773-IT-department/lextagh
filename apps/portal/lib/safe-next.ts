/**
 * Returns a same-site path to go to after sign in, or "/".
 * Rejects anything a browser could read as another site: "//x", "/\x", control characters, full URLs.
 */
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const base = "https://portal.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return "/";
    const result = `${url.pathname}${url.search}${url.hash}`;
    // Parsing collapses dot segments ("/.//x" becomes "//x"), so check the result again.
    if (!result.startsWith("/") || result.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(result)) return "/";
    return result;
  } catch {
    return "/";
  }
}
