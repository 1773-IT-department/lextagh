import type { CSSProperties } from "react";
import Icon from "./Icon";

/**
 * A photo, or, until Lexta sends it, a branded placeholder block that says exactly what is needed
 * ([PLACEHOLDER: ...], listed in CONTENT-NEEDED.md). No stock photos.
 */
export default function Photo({
  image, needed, icon = "box", fit = "cover", position, style, className, eager = false,
}: {
  image: { src: string; alt: string } | null;
  needed: string;
  icon?: string;
  fit?: "cover" | "contain";
  position?: string;
  style?: CSSProperties;
  className?: string;
  eager?: boolean;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.src}
        alt={image.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={className}
        style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: position, ...style }}
      />
    );
  }
  return (
    <div className={`yz-ph ${className ?? ""}`} style={style} role="img" aria-label={`Photo to come: ${needed}`}>
      <Icon name={icon} size={30} />
      <span>[PLACEHOLDER: {needed}]</span>
    </div>
  );
}
