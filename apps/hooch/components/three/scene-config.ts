/**
 * What one 3D stage shows: which Hooch® boxes stand on it. Plain data (no three.js import), so content files and server
 * components can name a scene without pulling 3D code into their bundle.
 */
export type Flavour = "classic" | "frosted";

export type SceneConfig = {
  /** The boxes, left to right (one for a product page, both for the family shot). */
  packs: Flavour[];
};
