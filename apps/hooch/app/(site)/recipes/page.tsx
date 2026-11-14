import type { Metadata } from "next";
import Link from "next/link";
import { Floaters, MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import RecipeFilter from "@/components/recipes/RecipeFilter";
import FoodStage from "@/components/three/FoodStage";
import { BEYOND, RECIPES, RECIPES_INTRO, SHARE_RECIPE } from "@/content/recipes";

export const metadata: Metadata = {
  title: "Breakfast Ideas & Recipes",
  description: "Simple Hooch® breakfast ideas: the Classic Hooch® Bowl, the Frosted Fruit Delight, Hooch® Yoghurt Crunch and the After-School Crunch.",
  alternates: { canonical: "/recipes" },
};

/** Breakfast Ideas & Recipes: Lexta's four recipes, the creative kitchen questions and "Share Your Hooch® Recipe". */
export default function RecipesPage() {
  return (
    <>
      <section className={s.hero} data-tone="red" aria-labelledby="recipes-title">
        <Floaters count={10} seed={17} />
        <div className={`hc-wrap ${s.heroInner} ${s.split}`}>
          <div>
            <p className="hc-sticker" style={{ background: "#fff" }}>{RECIPES_INTRO.eyebrow}</p>
            <h1 id="recipes-title" className={s.heroTitle}>{RECIPES_INTRO.title}</h1>
            <p className={s.heroLead}>{RECIPES_INTRO.body}</p>
          </div>
          <div className={s.splitStage}>
            <FoodStage
              priority
              config={{ vessel: "glass", flake: "classic", milk: false, toppings: ["strawberry"] }}
              poster={{ src: "/images/hooch/recipe-yoghurt-crunch.webp", alt: "A glass layered with yoghurt, strawberries and Hooch cornflakes" }}
              label="A 3D glass of Hooch Yoghurt Crunch: yoghurt, strawberries and cornflakes in layers. Tap it for a crunch."
            />
          </div>
        </div>
        <MilkWave style={{ marginTop: 20 }} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-label="Recipes" style={{ paddingTop: 30 }}>
        <RecipeFilter recipes={RECIPES} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-labelledby="beyond-title">
        <h2 id="beyond-title" className="hc-h2">{BEYOND.title}</h2>
        <p className="hc-lead" style={{ marginTop: 14, maxWidth: 760 }}>{BEYOND.intro}</p>
        <div className={`${s.bubbles} ${s.mt}`}>
          {BEYOND.items.map((q, i) => (
            <details key={q.q} className={s.bubble} data-reveal="" style={{ "--d": `${(i % 2) * 0.06}s` } as React.CSSProperties}>
              <summary><span className={s.bubbleIcon} aria-hidden="true"><Icon name={q.icon} size={22} /></span>{q.q}</summary>
              <p>{q.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-labelledby="share-title">
        <div className={s.share} data-reveal="">
          <div>
            <h2 id="share-title">{SHARE_RECIPE.title}</h2>
            <p>{SHARE_RECIPE.body}</p>
          </div>
          <Link href="/contact?topic=recipe#message" className="hc-btn">{SHARE_RECIPE.cta} <Icon name="arrow" size={18} /></Link>
        </div>
      </section>
    </>
  );
}
