// Data for the prototype pages, built on the server from the Business System (products) and the Tips & Advice
// articles, in the shapes the prototype's renderVals used. Server safe: no React.
import { ARTICLES, NOTICES, type Article } from "@/content/articles";
import type { LinzzyProduct } from "@/lib/products";

export type ProtoProduct = {
  id: string;
  g: "fem" | "baby";
  name: string;
  img: string;
  alt: string;
  desc: string;
  /** Lexta's full product description, shown in the product details panel (the cards keep the one line summary). */
  long: string;
  pack: string;
  /** Lexta's product page extras for the details panel (Drive, "3. Products Page"); empty or null when missing. */
  headline: string | null;
  features: string[];
  recommended: string | null;
  usage: string | null;
  sensitivity: string | null;
  ingredients: string | null;
  says: string | null;
  /** Up to two Tips & Advice articles that go with the product (catalogue `reads`), for the panel's Read more line. */
  reads: { slug: string; title: string }[];
};

export type ProtoTip = {
  slug: string;
  g: "fem" | "baby";
  topic: string;
  title: string;
  img: string | null;
  alt: string;
  ph: string;
  lede: string;
  /** Lexta's own reading time, or null when the Drive gives none (nothing is shown). */
  minutes: number | null;
};

/**
 * "In the pack": the one pack, or "N pack options: ..." when the product has several (as in the prototype). Sizes Lexta
 * has not confirmed yet (a placeholder pack) are left out of the line; packs that are all the same are said once.
 */
export function packText(p: LinzzyProduct): string {
  const skus = p.skus.filter((s) => !s.pack.startsWith("[PLACEHOLDER"));
  if (!skus.length) return "[PLACEHOLDER: pack sizes from Lexta]";
  if (skus.length === 1) return skus[0].pack;
  const same = skus.every((s) => s.pack === skus[0].pack);
  if (same && skus.every((s) => s.variant)) return `${skus.length} pack options, ${skus[0].pack} each: ${skus.map((s) => s.variant).join(" · ")}`;
  return `${skus.length} pack options: ${skus.map((s) => (s.variant ? `${s.variant}, ${s.pack}` : s.pack)).join(" · ")}`;
}

export function toProtoProduct(p: LinzzyProduct): ProtoProduct {
  const img = p.images[0];
  return {
    id: p.slug,
    g: p.range === "baby-care" ? "baby" : "fem",
    name: p.name,
    img: img?.src ?? "",
    alt: img?.alt ?? p.name,
    desc: p.short,
    long: p.long || p.short,
    pack: packText(p),
    headline: p.headline ?? null,
    features: p.features ?? [],
    recommended: p.recommended ?? null,
    usage: p.usage ?? null,
    sensitivity: p.sensitivity ?? null,
    ingredients: p.ingredients ?? null,
    says: p.says ?? null,
    reads: (p.reads ?? [])
      .map((slug) => ARTICLES.find((a) => a.slug === slug))
      .filter((a): a is Article => Boolean(a))
      .slice(0, 2)
      .map((a) => ({ slug: a.slug, title: a.title })),
  };
}

/** The six products the home page features, in the prototype's order (Heavy Flow, Diapers, Cool Mint ...), then any others. */
const FEATURED_ORDER = ["heavy-flow-sanitary-towels", "baby-diapers", "cool-mint-sanitary-towels", "extra-long-sanitary-towels", "baby-wipes", "panty-liners"];
export function featuredProducts(products: LinzzyProduct[]): ProtoProduct[] {
  const rank = (slug: string) => { const i = FEATURED_ORDER.indexOf(slug); return i < 0 ? 99 : i; };
  return [...products].filter((p) => !p.comingSoon).sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, 6).map(toProtoProduct);
}

export function protoTips(): ProtoTip[] {
  return ARTICLES.map((a) => ({
    slug: a.slug,
    g: a.category === "baby-care" ? "baby" : "fem",
    topic: a.topic,
    title: a.title,
    img: a.image?.src ?? null,
    alt: a.image?.alt ?? "",
    ph: a.image ? "" : `[PLACEHOLDER: ${a.imageNeeded ?? "article photo from Lexta"}]`,
    lede: a.lede,
    minutes: a.readMinutes,
  }));
}

/** The three articles on the home page (prototype: Know Your Flow, The Perfect Diaper Bag, Beyond the Pad). */
export function homeTips(): ProtoTip[] {
  const all = protoTips();
  return ["know-your-flow", "the-perfect-diaper-bag", "beyond-the-pad"].map((s) => all.find((t) => t.slug === s)).filter((t): t is ProtoTip => Boolean(t));
}

export { NOTICES };
