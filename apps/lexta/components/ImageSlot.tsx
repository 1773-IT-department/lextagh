import type { CSSProperties } from "react";

type Props = {
  /** Caption of the empty slot (the prototype's placeholder attribute). */
  placeholder: string;
  /** Photo to show. Without it the slot renders the empty placeholder look. */
  src?: string;
  /** Alt text for the photo. Required with src unless the photo is purely decorative (pass ""). */
  alt?: string;
  width?: number;
  height?: number;
  /** Extra styles on the slot box, like the prototype's style="display:block;width:100%;height:100%". */
  style?: CSSProperties;
};

const fill: CSSProperties = { position: "absolute", inset: 0 };

/**
 * Port of the prototype's <image-slot> element (shape="rect", fit="cover").
 * Same box (block, 100% x 100%, 3/2 aspect fallback). With a src it shows the photo cover-fitted and centred,
 * exactly as the element did. Without one it shows the empty placeholder (soft grey wash, dashed outline,
 * picture icon and caption). It never invents a photo: pass a real src once Lexta supplies the picture.
 */
export default function ImageSlot({ placeholder, src, alt, width, height, style }: Props) {
  const box: CSSProperties = {
    display: "block", position: "relative", width: "100%", height: "100%", aspectRatio: "3/2",
    font: "13px/1.3 system-ui,-apple-system,sans-serif", ...style,
  };

  if (src) {
    return (
      <div style={box}>
        <div style={{ ...fill, overflow: "hidden", background: "rgba(127,127,127,.08)", containerType: width && height ? "size" : undefined }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ?? ""}
            width={width}
            height={height}
            draggable={false}
            style={width && height ? {
              // Same geometry as the prototype element: cover-size the image box, then centre it.
              position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", maxWidth: "none", display: "block",
              width: `max(100%, calc(100cqh * ${width} / ${height}))`, height: `max(100%, calc(100cqw * ${height} / ${width}))`,
            } : { ...fill, width: "100%", height: "100%", maxWidth: "none", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Photo to come: ${placeholder}`} style={box}>
      <div style={{ ...fill, overflow: "hidden", background: "rgba(127,127,127,.08)" }}>
        <div
          style={{
            ...fill, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
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
