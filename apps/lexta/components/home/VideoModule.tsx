import type { CSSProperties } from "react";

/**
 * Home "Lexta Videos" panel.
 *
 * [PLACEHOLDER: Lexta brand video file]. The prototype showed a play button that played nothing. Until Lexta supplies
 * the video, the panel shows the poster with a "Video coming soon" label and no player. To add the video, set ONE of
 * the two fields below (a file in public/, for example "/videos/lexta-brand.mp4", or Lexta's own YouTube video id);
 * nothing else needs to change. It never autoplays.
 */
export const brandVideo: { file?: string; youtubeId?: string } = {};

const poster = {
  src: "https://lextagh.com/wp-content/uploads/2026/06/KAKEL-1897-scaled.jpg",
  alt: "Lexta outreach team with students",
};

const box: CSSProperties = { position: "relative", height: 340, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 44px rgba(11,60,78,.2)" };
const fill: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" };

export default function VideoModule() {
  if (brandVideo.youtubeId) {
    return (
      <div style={box}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${brandVideo.youtubeId}`}
          title="Lexta brand video"
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
          style={{ ...fill, border: 0 }}
        />
      </div>
    );
  }
  if (brandVideo.file) {
    return (
      <div style={box}>
        <video controls preload="none" poster={poster.src} style={{ ...fill, objectFit: "cover", background: "#0b2f3d" }}>
          <source src={brandVideo.file} />
          Your browser cannot play this video.
        </video>
      </div>
    );
  }

  return (
    <figure style={{ ...box, margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster.src} alt={poster.alt} style={{ ...fill, objectFit: "cover" }} />
      {/* The prototype's round play badge, now decorative: there is no video to play yet. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%",
          background: "#12a3c4", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 10px 24px rgba(4,40,52,.4)",
        }}
      >
        ▶
      </div>
      <figcaption
        style={{
          position: "absolute", left: "50%", top: "calc(50% + 44px)", transform: "translateX(-50%)", whiteSpace: "nowrap",
          background: "rgba(11,47,61,.82)", color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
          padding: "6px 12px", borderRadius: 999,
        }}
      >
        Video coming soon
      </figcaption>
    </figure>
  );
}
