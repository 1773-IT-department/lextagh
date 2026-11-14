import Icon from "./Icon";

/**
 * The ticker strip: Lexta's own taglines scrolling sideways. The words are written twice for a seamless loop; screen
 * readers get the first set only. Pauses on hover, and stands still (wrapped) for visitors who prefer reduced motion.
 */
export default function Marquee({ items, label }: { items: string[]; label: string }) {
  const set = (hidden: boolean) => (
    <ul className="lz-marquee__set" aria-hidden={hidden || undefined} style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className="lz-marquee__item"><Icon name="star" size={22} strokeWidth={2.4} /> {t}</li>
      ))}
    </ul>
  );
  return (
    <section className="lz-marquee" aria-label={label}>
      <div className="lz-marquee__track">{set(false)}{set(true)}</div>
    </section>
  );
}
