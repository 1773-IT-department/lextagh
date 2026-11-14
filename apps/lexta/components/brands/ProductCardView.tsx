import type { CSSProperties } from "react";
import ImageSlot from "@/components/ImageSlot";
import type { ProductCard, ProductImage } from "./data";

const mediaBox: CSSProperties = { height: 230, background: "#f2fafc", padding: 16 };
const containImg: CSSProperties = { maxWidth: "100%", maxHeight: "100%", display: "block", objectFit: "contain" };
const gridImg: CSSProperties = { width: "100%", height: "100%", display: "block", objectFit: "contain" };
const variants: Record<"raised" | "outlined", CSSProperties> = {
  raised: { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 34px rgba(11,60,78,.1)", display: "flex", flexDirection: "column" },
  outlined: { border: "1px solid rgba(18,163,196,.2)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" },
};

/* eslint-disable @next/next/no-img-element -- remote pack shots from the brand sites, sized by the card */

function BeforeAfter({ label, image, color }: { label: string; image: ProductImage; color: string }) {
  return (
    <div>
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#f2fafc", height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={image.src} alt={image.alt} style={containImg} />
      </div>
      <div style={{ marginTop: 8, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color }}>{label}</div>
    </div>
  );
}

/** One product card of a brand range (Our Brands page). */
export default function ProductCardView({ product, variant }: { product: ProductCard; variant: "raised" | "outlined" }) {
  const m = product.media;
  return (
    <div style={variants[variant]}>
      {m.kind === "single" && (
        <div style={{ ...mediaBox, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={m.image.src} alt={m.image.alt} style={m.imgStyle ?? containImg} width={m.imgSize?.width} height={m.imgSize?.height} />
        </div>
      )}
      {m.kind === "grid" && (
        <div style={{ ...mediaBox, display: "grid", gridTemplateColumns: m.columns === 3 ? "repeat(3,1fr)" : "1fr 1fr", gap: 8 }}>
          {m.images.map((im, k) => <img key={`${k}-${im.src}`} src={im.src} alt={im.alt} style={gridImg} />)}
        </div>
      )}
      {m.kind === "photo" && (
        <div style={{ height: 230 }}>
          <ImageSlot placeholder={m.placeholder} src={m.src} alt={m.alt} width={m.w} height={m.h} style={m.size} />
        </div>
      )}
      <div style={{ padding: "24px 26px 28px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#12313d" }}>{product.name}</div>
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.85, color: "#5d7883" }}>{product.description}</p>
        {product.beforeAfter && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
            <BeforeAfter label="Before" image={product.beforeAfter.before} color="#93a9b1" />
            <BeforeAfter label="After" image={product.beforeAfter.after} color="#12a3c4" />
          </div>
        )}
      </div>
    </div>
  );
}
