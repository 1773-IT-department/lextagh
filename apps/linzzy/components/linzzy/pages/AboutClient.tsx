"use client";

import AboutView from "../views/AboutView";
import { useChrome } from "../chrome";

// About Us (Linzzy About.dc.html).
const CHAPTERS: [string, string, string][] = [["top", "00", "Rooted in Care"], ["story", "01", "Our Story"], ["vision", "02", "Vision & Mission"], ["values", "03", "Core Values"], ["commitments", "04", "Our Commitments"], ["lexta", "05", "Lexta Family"]];
const VALUES = [
  ["Care", "We put the everyday needs and well-being of women, babies and families at the centre of our decisions."],
  ["Quality", "We are committed to maintaining product standards and continuously improving the consumer experience."],
  ["Trust", "We value honesty, responsible communication and meaningful consumer relationships."],
  ["Empathy", "We listen to the different experiences of the people who use our products."],
  ["Education", "We believe that access to accurate hygiene information empowers individuals and families."],
  ["Community", "We seek to build supportive relationships that extend beyond product purchases."],
];

export default function AboutClient() {
  const c = useChrome("/about", "Rooted in Care");
  const v = {
    ...c.base,
    chapters: c.chapters(CHAPTERS),
    values: VALUES.map((x, i) => ({ n: "0" + (i + 1), t: x[0], d: x[1] })),
  };
  return <AboutView v={v} />;
}
