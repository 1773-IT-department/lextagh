import type { Metadata } from "next";
import Link from "next/link";
import { Floaters, MilkWave } from "@/components/fun/Decor";
import Icon from "@/components/Icon";
import s from "@/components/pages/pages.module.css";
import FoodStage from "@/components/three/FoodStage";
import { BRAND } from "@/content/brand";
import { lexta } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Hooch®",
  description: "Hooch® is a breakfast cereal brand from Lexta Ghana Limited, bringing delicious, convenient and enjoyable breakfast options to families.",
  alternates: { canonical: "/about" },
};

/** About Hooch®: Lexta's story, brand promise, values, the Lexta family, and the community programmes (on the Lexta site). */
export default function AboutPage() {
  const a = BRAND.about;
  return (
    <>
      <section className={s.hero} aria-labelledby="about-title">
        <Floaters count={10} seed={5} />
        <div className={`hc-wrap ${s.heroInner} ${s.split}`}>
          <div>
            <p className="hc-sticker" style={{ background: "#fff" }}>{a.eyebrow}</p>
            <h1 id="about-title" className={s.heroTitle}>{a.title}</h1>
            <p className={s.heroLead}>{a.story[0]}</p>
          </div>
          <div className={s.splitStage}>
            <FoodStage
              config={{ vessel: "bowl", flake: "classic", milk: false, toppings: ["banana", "strawberry"], small: true }}
              poster={{ src: "/images/hooch/recipe-after-school.webp", alt: "A small bowl of crunchy Hooch cornflakes with banana and strawberry slices" }}
              label="A 3D bowl of crunchy Hooch cornflakes with fruit. Tap the bowl for a crunch."
            />
          </div>
        </div>
        <MilkWave style={{ marginTop: 20 }} />
      </section>

      <section className={`hc-wrap ${s.section}`} aria-label="Our story">
        <div className={s.grid2}>
          <div data-reveal="">{a.story.slice(1).map((p, i) => <p key={p} className={i === a.story.length - 2 ? s.big : "hc-lead"} style={{ marginTop: i ? 16 : 0 }}>{p}</p>)}</div>
          <div className={s.panel} data-tone="sun" data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <h2>{a.promiseTitle}</h2>
            {a.promise.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
      </section>

      <section className={`hc-wrap ${s.section}`} aria-labelledby="values-title">
        <p className="hc-eyebrow">Our Values</p>
        <h2 id="values-title" className="hc-h2" style={{ marginTop: 12 }}>What Hooch® Stands For</h2>
        <div className={`${s.grid4} ${s.mt}`}>
          {a.values.map((v, i) => (
            <div key={v.name} className={`${s.value} hc-wobble`} data-tone={v.tone} data-reveal="" style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
              <span className={s.valueIcon}><Icon name={v.icon} size={28} /></span>
              <h3>{v.name}</h3>
              <p>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`hc-wrap ${s.section}`} aria-labelledby="lexta-title">
        <div className={s.grid2}>
          <div className={s.panel} data-tone="sky" data-reveal="">
            <h2 id="lexta-title">{a.lextaTitle}</h2>
            {a.lexta.map((p) => <p key={p}>{p}</p>)}
            <div className={s.actions}>
              <a href={lexta.home} target="_blank" rel="noopener" className="hc-btn">Lexta Ghana Limited <Icon name="arrow" size={18} /></a>
            </div>
          </div>
          <div className={s.panel} data-reveal="" style={{ "--d": ".1s" } as React.CSSProperties}>
            <h2>Community</h2>
            <ul className={s.ticks}>
              {BRAND.community.map((c) => <li key={c.name}><span className={s.tick}><Icon name={c.icon} size={15} /></span><span><strong>{c.name}:</strong> {c.body}</span></li>)}
            </ul>
            <div className={s.actions}>
              <a href={`${lexta.csr}#programmes`} target="_blank" rel="noopener" className="hc-btn hc-btn--red">Lexta&apos;s community programmes <Icon name="arrow" size={18} /></a>
              <a href={`mailto:marketing@lextagh.com?subject=${encodeURIComponent("Hooch community proposal")}`} className="hc-btn">Send a proposal</a>
            </div>
          </div>
        </div>
      </section>

      <section className={`hc-wrap ${s.section} ${s.sectionLast}`} aria-label="Next steps">
        <div className={s.share} data-reveal="">
          <div>
            <h2>Two Delicious Choices. One Hooch® Family.</h2>
            <p>The classic crunch of Hooch® Cornflakes and the sweet delight of Hooch® Frosted Flakes.</p>
          </div>
          <Link href="/products" className="hc-btn">Explore Our Products <Icon name="arrow" size={18} /></Link>
        </div>
      </section>
    </>
  );
}
