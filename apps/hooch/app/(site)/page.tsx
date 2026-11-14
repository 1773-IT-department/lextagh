import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard, ProductCard, RecipeCard } from "@/components/cards/Cards";
import { Bouncy, Floaters, MilkWave } from "@/components/fun/Decor";
import PackRow from "@/components/home/PackRow";
import s from "@/components/home/home.module.css";
import Icon from "@/components/Icon";
import Marquee from "@/components/Marquee";
import LoopVideo from "@/components/fun/LoopVideo";
import FoodStage from "@/components/three/FoodStage";
import { FILMS } from "@/content/videos";
import { ARTICLES } from "@/content/articles";
import { BRAND } from "@/content/brand";
import { FAMILY_GUIDE } from "@/content/catalogue";
import { RECIPES } from "@/content/recipes";
import { getHoochProducts } from "@/lib/products";
import { lexta } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * Home, Lexta's six tab draft in its order: hero, Meet Our Breakfast Favorites, 10 Packs 10 Breakfast Moments, Breakfast
 * Ideas for the Family, Everyday Nutrition & Family Tips, About Hooch® (with Who We Are) and Get in Touch. The hero plays
 * the Hooch film (content/videos.ts); the frosted spotlight has the live 3D Hooch® boxes.
 */
export default async function HomePage() {
  const { products } = await getHoochProducts();
  const frosted = products.find((p) => p.flavour === "frosted");
  return (
    <>
      <section className={s.hero} aria-labelledby="hero-title">
        <Floaters count={14} seed={3} />
        <span className={s.sun} aria-hidden="true" />
        <div className={`hc-wrap ${s.heroGrid}`}>
          <div className={s.heroText}>
            <p className={`hc-sticker ${s.heroEyebrow}`}>{BRAND.hero.eyebrow}</p>
            <h1 id="hero-title" className={s.heroTitle}><Bouncy text={BRAND.hero.title} /></h1>
            <p className={s.heroSub}>{BRAND.hero.sub}</p>
            <p className={s.heroBody}>{BRAND.hero.body}</p>
            <div className={s.heroActions}>
              <Link href="/products" className="hc-btn hc-btn--red">Explore Our Products <Icon name="arrow" size={18} /></Link>
              <Link href="/recipes" className="hc-btn">Discover Breakfast Ideas</Link>
            </div>
          </div>
          <div className={s.heroStage}>
            <div className="hc-film">
              <LoopVideo film={FILMS.hero} priority />
            </div>
            <span className={s.heroBits} aria-hidden="true">
              <i style={{ "--img": "url(/images/hooch/bits/berry-1.webp)", left: "-7%", top: "64%", "--s": "86px" } as React.CSSProperties} />
              <i style={{ "--img": "url(/images/hooch/bits/flake-sharp.webp)", right: "-6%", top: "6%", "--s": "78px", "--d": "-2s" } as React.CSSProperties} />
              <i style={{ "--img": "url(/images/hooch/bits/flake-1.webp)", left: "4%", top: "-5%", "--s": "58px", "--d": "-4s" } as React.CSSProperties} />
            </span>
            <span className={`hc-sticker hc-sticker--red ${s.heroBadge}`}>10 packs inside!</span>
          </div>
        </div>
        <MilkWave />
      </section>

      <Marquee label="Hooch taglines" items={["Wake Up to Something Good!", "Crunch Into Goodness", "Share the Happiness", "10 Packs, 10 Breakfast Moments", BRAND.promise]} />

      <section className={`hc-wrap hc-section ${s.favs}`} aria-labelledby="favs-title">
        <div className={s.head} data-reveal="">
          <p className="hc-eyebrow">Our cereals</p>
          <h2 id="favs-title" className="hc-h2">{BRAND.sections.favourites}</h2>
          <p className="hc-lead">{BRAND.twoChoices}</p>
        </div>
        <div className={s.favGrid}>{products.map((p, i) => <ProductCard key={p.slug} p={p} i={i} big />)}</div>
      </section>

      <section className={s.packsBand} aria-labelledby="packs-title">
        <MilkWave color="var(--hc-red-deep)" flip style={{ position: "absolute", top: -1, left: 0 }} />
        <div className={`hc-wrap ${s.packsGrid}`}>
          <div data-reveal="">
            <h2 id="packs-title" className={s.packsTitle}>{BRAND.sections.tenPacks}</h2>
            <p className={s.packsText}>Hooch® Cornflakes, 500g: 10 individual packs of 50g. Hooch® Frosted Flakes, 375g: 10 individual packs of 37.5g.</p>
            <p className={s.packsHint}><Icon name="hand" size={18} /> Tap a pack to open it.</p>
            <PackRow flavour="classic" />
          </div>
          <div className={s.guide} data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <h3>{FAMILY_GUIDE.title}</h3>
            <p>{FAMILY_GUIDE.intro}</p>
            <table>
              <thead><tr><th scope="col">Family members</th><th scope="col">One pack each</th><th scope="col">How long one product lasts</th></tr></thead>
              <tbody>{FAMILY_GUIDE.rows.map((r) => <tr key={r.people}><th scope="row"><span className={s.people}>{r.people}</span></th><td>{r.perBreakfast}</td><td>{r.lasts}</td></tr>)}</tbody>
            </table>
            <p className={s.guideNote}>{FAMILY_GUIDE.note}</p>
          </div>
        </div>
        <MilkWave style={{ position: "absolute", bottom: -1, left: 0 }} />
      </section>

      <section className={`hc-wrap hc-section`} aria-labelledby="ideas-title">
        <div className={s.headRow} data-reveal="">
          <div>
            <p className="hc-eyebrow">Recipes</p>
            <h2 id="ideas-title" className="hc-h2">{BRAND.sections.ideas}</h2>
          </div>
          <Link href="/recipes" className="hc-btn">All Breakfast Ideas <Icon name="arrow" size={18} /></Link>
        </div>
        <div className={s.recipeGrid}>{RECIPES.map((r, i) => <RecipeCard key={r.slug} r={r} i={i} />)}</div>
      </section>

      {frosted && (
        <section className={s.spot} aria-labelledby="spot-title">
          <Floaters count={8} seed={8} />
          <div className={`hc-wrap ${s.spotGrid}`}>
            <FoodStage
              variant="band"
              config={{ packs: ["frosted", "classic"] }}
              poster={{ src: "/images/hooch/packs-duo.webp", alt: "A box of Hooch® Frosted Flakes beside a box of Hooch® Cornflakes" }}
              label="A 3D model of the Hooch® Frosted Flakes and Hooch® Cornflakes boxes. Drag to spin a box; tap one and flakes pop out."
            />
            <div data-reveal="">
              <p className="hc-sticker hc-sticker--sky">{frosted.portions ?? "375g"}</p>
              <h2 id="spot-title" className={s.spotTitle}>{frosted.tagline ?? frosted.name}</h2>
              <p className={s.spotText}>{frosted.long}</p>
              <div className={s.heroActions}>
                <Link href={`/products/${frosted.slug}`} className="hc-btn hc-btn--ink">Meet {frosted.name} <Icon name="arrow" size={18} /></Link>
                <Link href="/recipes/frosted-fruit-delight" className="hc-btn">The Frosted Fruit Delight</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="hc-wrap hc-section" aria-labelledby="tips-title">
        <div className={s.headRow} data-reveal="">
          <div>
            <p className="hc-eyebrow">Nutrition &amp; Family Tips</p>
            <h2 id="tips-title" className="hc-h2">{BRAND.sections.tips}</h2>
          </div>
          <Link href="/nutrition" className="hc-btn">Good Habits Today <Icon name="arrow" size={18} /></Link>
        </div>
        <div className={s.tipGrid}>{ARTICLES.map((a, i) => <ArticleCard key={a.slug} a={a} i={i} />)}</div>
      </section>

      <section className={`hc-wrap ${s.about}`} aria-labelledby="about-title">
        <div className={s.aboutCard} data-reveal="">
          <p className="hc-eyebrow">Who We Are</p>
          <h2 id="about-title" className="hc-h2">{BRAND.sections.about}</h2>
          <p className="hc-lead">{BRAND.whoWeAre}</p>
          <Link href="/about" className="hc-btn hc-btn--red">Our Story <Icon name="arrow" size={18} /></Link>
        </div>
        <div className={s.community} data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
          <h3>Community</h3>
          <ul>
            {BRAND.community.map((c) => (
              <li key={c.name}><span className={s.commIcon}><Icon name={c.icon} size={20} /></span><span><strong>{c.name}</strong>{c.body}</span></li>
            ))}
          </ul>
          <a href={`${lexta.csr}#programmes`} target="_blank" rel="noopener" className="hc-textlink">See Lexta&apos;s community programmes <Icon name="arrow" size={16} /></a>
        </div>
      </section>

      <section className={`hc-wrap ${s.touch}`} aria-labelledby="touch-title">
        <div className={s.touchCard} data-reveal="">
          <Floaters count={6} seed={12} />
          <h2 id="touch-title" className={s.touchTitle}>{BRAND.sections.touch}</h2>
          <p>{BRAND.contact.body[0]}</p>
          <div className={s.heroActions}>
            <Link href="/contact#message" className="hc-btn">Send Us a Message <Icon name="chat" size={18} /></Link>
            <Link href="/contact#where-to-buy" className="hc-btn hc-btn--ink"><Icon name="pin" size={18} /> Find Hooch® Near You</Link>
          </div>
        </div>
      </section>
    </>
  );
}
