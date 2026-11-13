import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { categoryOf, monthLabel, type Article } from "@/content/articles";
import s from "./tips.module.css";

/** An article card, as the prototype's blog cards: picture, coloured topic, title, read more. */
export default function ArticleCard({ article, small = false }: { article: Article; small?: boolean }) {
  const href = `/tips/${article.slug}`;
  return (
    <article className={`${s.card} ${small ? s.cardSmall : ""}`} style={{ ["--tone" as string]: article.topic.tone }}>
      <Link href={href} className={s.cardPic} tabIndex={-1} aria-hidden="true">
        <Photo image={article.image} needed={`photo for "${article.title}"`} icon="book" position="center 30%" />
      </Link>
      <div className={s.cardBody}>
        <div className={s.cardTopic}>{article.topic.label}</div>
        <h3 className={s.cardTitle}><Link href={href}>{article.title}</Link></h3>
        {!small && <p className={s.cardLede}>{article.lede}</p>}
        <div className={s.cardFoot}>
          <span>{article.date ? monthLabel(article.date) : categoryOf(article.category).label} · {article.readMinutes} min read</span>
          <Link href={href} className={s.more} aria-label={`Read more: ${article.title}`}>Read more <Icon name="arrow" size={13} /></Link>
        </div>
      </div>
    </article>
  );
}
