import type { Metadata } from "next";
import Link from "next/link";
import s from "@/components/about/about.module.css";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { BRAND } from "@/content/brand";
import { lexta } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: "Linzzy is a feminine, maternal and baby care brand under Lexta Ghana Limited. Our story, vision, mission and core values.",
  alternates: { canonical: "/about" },
};

const A = BRAND.about;

/** About Us, with Lexta's "2. About Us Page" copy. */
export default function AboutPage() {
  return (
    <>
      <section className={s.hero} aria-labelledby="about-title">
        <div className={`lz-wrap ${s.heroGrid}`}>
          <div>
            <span className="lz-sticker lz-sticker--mint">{A.eyebrow}</span>
            <h1 id="about-title" className={s.heroTitle}>
              Rooted in Care. <span className={s.pill}>Inspired by Life.</span> Made for Everyday Moments.
            </h1>
          </div>
          <div className={s.heroIntro}>
            {A.intro.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
      </section>

      <section className={`lz-wrap lz-section ${s.story}`} aria-labelledby="story-title">
        <div className={s.storyLines} aria-hidden="true">
          {A.story.lines.map((l, i) => <p key={l} className={s.storyLine} data-i={i}>{l}</p>)}
        </div>
        <div>
          <p className="lz-eyebrow">Our story</p>
          <h2 id="story-title" className="lz-h2" style={{ marginTop: 12 }}>{A.story.title}</h2>
          <p className="lz-lead" style={{ marginTop: 16 }}>{A.story.lines.join(" ")}</p>
          {A.story.body.map((p) => <p key={p} className="lz-lead" style={{ marginTop: 12 }}>{p}</p>)}
        </div>
      </section>

      <section className={s.vm} aria-label="Vision and mission">
        <div className={`lz-wrap ${s.vmGrid}`}>
          <div className={s.vmCard} data-tone="lilac">
            <span className={s.vmIcon}><Icon name="eye" size={28} /></span>
            <h2>Our Vision</h2>
            <p>{A.vision}</p>
          </div>
          <div className={s.vmCard} data-tone="mint">
            <span className={s.vmIcon}><Icon name="target" size={28} /></span>
            <h2>Our Mission</h2>
            <p>{A.mission}</p>
          </div>
        </div>
      </section>

      <section className={`lz-wrap lz-section`} aria-labelledby="values-title">
        <h2 id="values-title" className="lz-h2" style={{ textAlign: "center" }}>Our Core Values</h2>
        <div className={s.values}>
          {A.values.map((v) => (
            <div key={v.title} className={s.value}>
              <span className={s.valueIcon}><Icon name={v.icon} size={26} /></span>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`lz-wrap ${s.commit}`} aria-label="Our commitments">
        <article className={s.commitCard} data-mood="bold" aria-labelledby="women-title">
          <div className={`${s.commitPic} lz-blob`}>
            <Photo image={{ src: "/images/original/mother-daughter.webp", alt: "A mother handing her smiling daughter a pack of Linzzy sanitary towels" }} needed="" position="center 30%" />
          </div>
          <div>
            <h2 id="women-title">{A.women.title}</h2>
            {A.women.body.map((p) => <p key={p}>{p}</p>)}
            <Link href="/products/feminine-care" className="lz-btn lz-btn--ink" style={{ marginTop: 20 }}>Feminine Care <Icon name="arrow" size={18} /></Link>
          </div>
        </article>
        <article className={s.commitCard} data-mood="soft" aria-labelledby="families-title">
          <div className={`${s.commitPic} lz-blob`}>
            <Photo image={{ src: "/images/nursery/dad-playtime.webp", alt: "A father playing with his laughing baby, with Linzzy Baby Diapers and Baby Wipes nearby" }} needed="" position="35% center" />
          </div>
          <div>
            <h2 id="families-title">{A.families.title}</h2>
            {A.families.body.map((p) => <p key={p}>{p}</p>)}
            <Link href="/products/baby-care" className="lz-btn lz-btn--mint" style={{ marginTop: 20 }}>Baby Care <Icon name="arrow" size={18} /></Link>
          </div>
        </article>
      </section>

      <section className={`lz-wrap lz-section ${s.lexta}`} aria-labelledby="lexta-title">
        <div className={s.lextaCard}>
          <div>
            <p className="lz-eyebrow" style={{ color: "var(--lz-mint)" }}>Lexta Ghana Limited</p>
            <h2 id="lexta-title" className={s.lextaTitle}>{A.lexta.title}</h2>
            {A.lexta.body.map((p) => <p key={p}>{p}</p>)}
            <a href={lexta.home} target="_blank" rel="noopener" className="lz-btn lz-btn--mint" style={{ marginTop: 22 }}>Visit Lexta Ghana Limited <Icon name="arrow" size={18} /></a>
          </div>
          <div className={s.promise}>
            <h2>{A.promise.title}</h2>
            {A.promise.body.map((p) => <p key={p}>{p}</p>)}
            <p className={s.sign}>{BRAND.promiseLine}</p>
            <div className={s.promiseActions}>
              <Link href="/products" className="lz-btn lz-btn--berry">Discover Our Products <Icon name="arrow" size={18} /></Link>
              <Link href="/contact" className="lz-btn">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
