/** The site's navigation: Lexta's six Hooch tabs, plus the Lexta site for community programmes, careers and legal pages. */
export type NavLink = { label: string; href: string; icon?: string };

export const NAV: NavLink[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "About Hooch®", href: "/about", icon: "heart" },
  { label: "Our Products", href: "/products", icon: "bowl" },
  { label: "Recipes", href: "/recipes", icon: "spoon" },
  { label: "Nutrition & Tips", href: "/nutrition", icon: "book" },
  { label: "Contact", href: "/contact", icon: "chat" },
];
