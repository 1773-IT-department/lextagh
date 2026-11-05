// The visitor key the website's rate limits count by (Careers CV uploads, live chat). Plain code with no Next.js
// imports, so the local harness tests run the same function.

/** Expands an IPv6 address to its 8 groups of four hex digits, or null when it is not one. */
function ipv6Groups(ip: string): string[] | null {
  if (!/^[0-9a-f:.]+$/i.test(ip) || !ip.includes(":")) return null;
  let text = ip.toLowerCase();
  // A dotted IPv4 tail (::ffff:1.2.3.4) becomes two groups.
  const tail = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (tail) {
    const b = tail.slice(1).map(Number);
    if (b.some((x) => x > 255)) return null;
    text = text.slice(0, tail.index) + ((b[0] << 8) | b[1]).toString(16) + ":" + ((b[2] << 8) | b[3]).toString(16);
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => g.padStart(4, "0"));
}

/**
 * The visitor key the upload limits count by: an IPv4 address as it is, an IPv6 address by its /64 network (one
 * household or phone usually holds a whole /64), an IPv4 address written as IPv6 (::ffff:1.2.3.4) as IPv4. Null when
 * there is no usable address, and then no upload is made: everyone without an address must not share one limit.
 */
export function visitorKey(raw: string): string | null {
  let ip = (raw ?? "").trim().replace(/^\[|\](:\d+)?$/g, "").replace(/%.*$/, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip.split(".").every((x) => Number(x) <= 255) ? `v4:${ip}` : null;
  const groups = ipv6Groups(ip);
  if (!groups) return null;
  if (groups.slice(0, 5).every((g) => g === "0000") && groups[5] === "ffff") {
    const n = parseInt(groups[6] + groups[7], 16);
    ip = [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
    return `v4:${ip}`;
  }
  return `v6:${groups.slice(0, 4).join(":")}::/64`;
}
