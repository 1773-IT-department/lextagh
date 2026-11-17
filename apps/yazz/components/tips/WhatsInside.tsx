import Icon from "@/components/Icon";
import f from "@/components/faqs/faqs.module.css";
import { WHATS_INSIDE as W } from "@/content/articles";
import { contact } from "@/lib/site";
import s from "./tips.module.css";

/**
 * What's Inside My Yazz®? on the Just 4 You view (#whats-inside): Lexta's headings, placeholder facts, the layers as a
 * list that opens on tap (<details>, so it works without JavaScript) and the Consumer Care email.
 */
export default function WhatsInside() {
  return (
    <section id="whats-inside" className={`${s.section} ${s.anchored}`} aria-labelledby="whats-inside-title">
      <div className={s.panelBox}>
        <p className="yz-eyebrow">{W.title}</p>
        <h2 id="whats-inside-title" className={s.sectionTitle} style={{ marginTop: 8 }}>{W.heading}</h2>
        <p className={s.panelText}>{W.intro}</p>
        <div className={s.insideGrid}>
          <div className={s.insideCard}>
            <h3>{W.materials.title}</h3>
            <p>{W.materials.body}</p>
          </div>
          <div className={`${s.insideCard} ${s.insideLayers}`}>
            <h3>{W.layers.title}</h3>
            {W.layers.items.map((l, i) => (
              <details key={i} className={f.faqItem}>
                <summary>
                  <span>Layer {i + 1}: {l.name}</span>
                  <span className={f.faqIcon} aria-hidden="true"><Icon name="plus" size={18} className={f.plus} /><Icon name="minus" size={18} className={f.minus} /></span>
                </summary>
                <div className={f.faqAnswer}><p>{l.body}</p></div>
              </details>
            ))}
          </div>
          {W.blocks.map((b) => (
            <div key={b.title} className={s.insideCard}>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
          <div className={s.insideCard}>
            <h3>{W.question.title}</h3>
            <p>{W.question.body} <a href={`mailto:${contact.supportEmail}`} className={s.inlineLink}>{contact.supportEmail}</a>.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
