/**
 * The films on the Hooch® site, in one place. Today they are short loops we made from Lexta's own Hooch artwork (the
 * pack shots and the bowl photo, with real flakes and strawberries falling): see CONTENT-NEEDED.md.
 * When Lexta sends their real product videos, put the files in public/videos and change the paths here: nothing else
 * needs to change. Each film has a phone-sized version (used below 700px wide) and a poster frame.
 */
export type Film = {
  /** Describes the film for screen readers. */
  label: string;
  poster: string;
  webm: string;
  mp4: string;
  /** Smaller files for phones. */
  small?: { webm: string; mp4: string };
  /** True while this is our stand-in, not Lexta's own film. */
  standIn: boolean;
};

export const FILMS: Record<"hero" | "cornflakes" | "frosted-flakes", Film> = {
  hero: {
    label: "Hooch® Frosted Flakes and Hooch® Cornflakes boxes with flakes and strawberries tumbling around them, then a bowl of golden cornflakes in milk",
    poster: "/videos/hooch-hero-poster.webp",
    webm: "/videos/hooch-hero.webm",
    mp4: "/videos/hooch-hero.mp4",
    small: { webm: "/videos/hooch-hero-sm.webm", mp4: "/videos/hooch-hero-sm.mp4" },
    standIn: true,
  },
  cornflakes: {
    label: "A box of Hooch® Cornflakes with golden flakes falling, then a bowl of cornflakes in milk",
    poster: "/videos/cornflakes-clip-poster.webp",
    webm: "/videos/cornflakes-clip.webm",
    mp4: "/videos/cornflakes-clip.mp4",
    small: { webm: "/videos/cornflakes-clip-sm.webm", mp4: "/videos/cornflakes-clip-sm.mp4" },
    standIn: true,
  },
  "frosted-flakes": {
    label: "A box of Hooch® Frosted Flakes with sparkles and flakes falling, then both Hooch® boxes together",
    poster: "/videos/frosted-flakes-clip-poster.webp",
    webm: "/videos/frosted-flakes-clip.webm",
    mp4: "/videos/frosted-flakes-clip.mp4",
    small: { webm: "/videos/frosted-flakes-clip-sm.webm", mp4: "/videos/frosted-flakes-clip-sm.mp4" },
    standIn: true,
  },
};

/** The film for a product page (a product staff add later has none yet). */
export const filmFor = (slug: string): Film | undefined => (FILMS as Record<string, Film>)[slug];
