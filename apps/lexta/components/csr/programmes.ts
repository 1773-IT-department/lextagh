/**
 * The CSR programmes on the CSR page ("Initiatives by brand" cards) and the initiatives a CSR partnership proposal can
 * name on Partner With Us (Lexta: "CSR / partnership proposal ... brand and initiative required",
 * docs/content/lexta/website-copy.md:42). Shared by the CSR page, the Partner With Us form and its server check
 * (lib/forms/core.ts), so the three always agree. Card text is Lexta's own (see the CSR page for sources).
 */

export type Programme = {
  /** Used in "/partner-with-us?route=CSR&initiative=<slug>#apply". */
  slug: string;
  tag: string;
  title: string;
  href?: string;
  text: string;
  /** The brand a proposal for this programme is preselected with, where the card names one. */
  brand?: CsrBrand;
  /** Shown in the card's label slot when Lexta calls the programme proposed. */
  proposed?: boolean;
};

export const CSR_BRANDS = ["Lexta", "Yazz", "Linzzy", "Hooch"] as const;
export type CsrBrand = (typeof CSR_BRANDS)[number];

export const programmes: Programme[] = [
  {
    slug: "lexta-legacy-project", tag: "Lexta Foundation", title: "Lexta Legacy Project", brand: "Lexta",
    text: "Supporting deprived communities with education, clean and safe water, one community at a time.",
  },
  {
    slug: "bright-smiles-school-tour", tag: "Oral health", title: "The Bright Smiles School Tour", href: "/news/the-bright-smiles-school-tour",
    text: "Healthy smiles begin with everyday habits. The Bright Smiles School Tour proposes age-appropriate oral-hygiene education and partnerships with qualified dental professionals and schools.",
  },
  {
    slug: "safe-bottoms-initiative", tag: "Water and sanitation", title: "The Safe Bottoms Initiative", href: "/news/the-safe-bottoms-initiative",
    text: "For every jumbo pack sold, Yazz Diapers/Wipes funds the construction/maintenance of mechanised boreholes in communities facing water scarcity to ensure safe hygiene for infants. Safe Bottoms is designed to support caregiver education, responsible diaper and wipe disposal and community hygiene partnerships.",
  },
  {
    slug: "lexta-forest-project", tag: "Environment", title: "The Lexta Forest Project", href: "/news/the-lexta-forest-project",
    text: "The Lexta Forest Project is a proposed tree-planting and environmental-education platform linking everyday paper use with responsible stewardship. Commitment to plant 10 indigenous trees for every 1,000 rolls of 100% Virgin Pulp tissue sold, restoring degraded forest reserves.",
  },
  {
    slug: "clean-hands-green-land", tag: "Responsible consumption", title: "Clean Hands, Green Land", href: "/news/clean-hands-green-land",
    text: "Clean homes and a cleaner environment belong together. This proposed programme focuses on practical hygiene education, responsible packaging disposal and community clean-up partnerships.",
  },
];

/** The Dignity Project band above the cards (Lexta's own label for it, CSR page "Flagship programmes"). */
export const dignityInitiative = { slug: "empowered-periods-dignity-project", title: "Empowered Periods, Dignity Project" };

/** Everything a CSR proposal can be for: the Dignity Project band, then the programme cards in page order. */
export const CSR_INITIATIVES: { slug: string; title: string; brand?: CsrBrand }[] = [
  dignityInitiative,
  ...programmes.map(({ slug, title, brand }) => ({ slug, title, brand })),
];

/** Link from a programme to the CSR route of the Partner With Us form, with the initiative preselected. */
export const proposeHref = (slug: string) => `/partner-with-us?route=CSR&initiative=${slug}#apply`;
