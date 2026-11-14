/**
 * What one 3D food scene shows. Plain data (no three.js import), so content files and server components can name a
 * scene without pulling 3D code into their bundle.
 */
export type Topping = "banana" | "strawberry";

export type SceneConfig = {
  /** A Hooch red bowl, or a tall glass for layered recipes. */
  vessel: "bowl" | "glass";
  /** Golden classic flakes, or paler flakes with a sparkling sugar frost. */
  flake: "classic" | "frosted";
  /** Milk in the bowl (ripples and splashes as the flakes land). */
  milk: boolean;
  toppings: Topping[];
  /** A smaller snack portion. */
  small?: boolean;
  /** The hero: flakes pour in from high above, in a longer cascade. */
  pour?: boolean;
};
