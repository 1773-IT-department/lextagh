import Link from "next/link";
import Icon from "@/components/Icon";
import { TOPIC_TILES, type TipsPanel as Panel } from "@/content/articles";
import { BodyText } from "./ArticleBody";
import s from "./tips.module.css";

/** An intro or closing of a Tips & Advice category view (CATEGORY_PANELS in content/articles.ts), in the hub's soft panel. */
export default function TipsPanel({ panel }: { panel: Panel }) {
  const explore = (panel.explore ?? []).map((t) => TOPIC_TILES.find((x) => x.title === t)).filter((x) => x !== undefined);
  return (
    <section id={panel.id} className={`${s.section} ${s.anchored}`} aria-labelledby={`${panel.id}-title`}>
      <div className={s.panelBox}>
        {panel.eyebrow && <p className="yz-eyebrow">{panel.eyebrow}</p>}
        <h2 id={`${panel.id}-title`} className={s.sectionTitle} style={panel.eyebrow ? { marginTop: 8 } : undefined}>{panel.title}</h2>
        <BodyText body={panel.body} className={s.panelBody} />
        {explore.length > 0 && (
          <nav className={s.explore} aria-label="Explore more">
            <span>Explore more:</span>
            {explore.map((t) => <Link key={t.href} href={t.href} className="yz-chip">{t.title}</Link>)}
          </nav>
        )}
        {panel.script && <p className={`yz-script ${s.panelScript}`}>{panel.script}</p>}
        {panel.more && <Link href={panel.more.href} className="yz-textlink" style={{ marginTop: 14 }}>{panel.more.label} <Icon name="arrow" size={15} /></Link>}
      </div>
    </section>
  );
}
