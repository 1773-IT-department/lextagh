/**
 * News stories held back from the site until Lexta approves them (Desmond, 16 November 2026).
 *
 * These eight stories are summaries of press coverage and posts on other sites, not Lexta's own copy. They stay in
 * articles.ts (nothing is deleted) but they are not shown anywhere: not on the News page, the Home page, in "More
 * stories", in the newer / older links, as links from the CSR page, and /news/<slug> returns 404 (no page is built).
 *
 * Live stories are the ones whose source is Lexta's old website (lextagh.com) or the content Lexta shared on Drive.
 * To publish a held story once Lexta approves it, remove its slug from this list.
 *
 * Kept apart from articles.ts so client components (the CSR screening strip) can check a slug without loading
 * every article.
 */
export const heldStorySlugs: ReadonlySet<string> = new Set([
  "empowered-periods-reaches-19-locations-in-a-single-day",
  "yazz-partners-mx24-tv-for-the-2026-croxitout-high-school-tour",
  "free-public-cervical-cancer-screening-with-sofpog-mwag-and-korle-bu-polyclinic",
  "cervical-cancer-awareness-at-tuesday-market-park-mamprobi",
  "ghanaian-women-doctors-encourage-screening-for-early-detection",
  "cervical-cancer-awareness-launch-2024-tamale",
  "yazz-partners-the-ges-cook-art-competition",
  "free-cervical-cancer-screening-and-education-in-kumasi",
]);

/** True when the story may be shown and linked to. */
export const isLiveStory = (slug: string) => !heldStorySlugs.has(slug);

/** For a link to "/news/<slug>": false when that story is held back, so the link is left out. Other links pass. */
export const isLiveStoryHref = (href: string) => {
  const m = /^\/news\/([^/?#]+)/.exec(href);
  return !m || isLiveStory(m[1]);
};
