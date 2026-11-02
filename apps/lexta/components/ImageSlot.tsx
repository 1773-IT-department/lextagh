import type { CSSProperties } from "react";

/**
 * Empty photo placeholder with the same look as the prototype's <image-slot> element
 * (soft grey wash, dashed outline, picture icon and caption). It never invents a photo:
 * replace it with a real <img> once Lexta supplies the picture.
 */
export default function ImageSlot({ placeholder, radius = 0 }: { placeholder: string; radius?: number }) {
  const fill: CSSProperties = { position: "absolute", inset: 0, borderRadius: radius || undefined };
  return (
    <div
      role="img"
      aria-label={`Photo to come: ${placeholder}`}
      style={{ display: "block", position: "relative", width: "100%", height: "100%", aspectRatio: "3/2", font: "13px/1.3 system-ui,-apple-system,sans-serif" }}
    >
      <div style={{ ...fill, overflow: "hidden", background: "rgba(127,127,127,.08)" }}>
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 6, textAlign: "center", padding: 12, boxSizing: "border-box", userSelect: "none",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }} aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <div style={{ maxWidth: "90%", fontWeight: 500, letterSpacing: ".01em", opacity: 0.75 }}>{placeholder}</div>
        </div>
        <div style={{ ...fill, pointerEvents: "none", border: "1.5px dashed currentColor", opacity: 0.35 }} />
      </div>
    </div>
  );
}
