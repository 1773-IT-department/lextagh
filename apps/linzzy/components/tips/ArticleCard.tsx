import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { categoryOf, type Article } from "@/content/articles";
import s from "./tips.module.css";

/** An article card: photo in a rounded frame, a tilted topic sticker, title, read more. */
export default function ArticleCard({ article, small = false }: { article: Article; small?: boolean }) {
  const href = `/tips/${article.slug}`;
  const cat = categoryOf(article.category);
  return (
    <article className={`${s.card} ${small ? s.cardSmall : ""}`} data-cat={article.category}>
      <Link href={href} className={s.cardPic} tabIndex={-1} aria-hidden="true">
        <Photo image={article.image} needed={article.imageNeeded ?? `photo for "${article.title}"`} icon={article.category === "baby-care" ? "baby" : "female"} position="center 35%" />
        <span className={s.cardCat}>{cat.label}</span>
      </Link>
      <div className={s.cardBody}>
        <div className={s.cardTopic}>{article.topic}</div>
        <h3 className={s.cardTitle}><Link href={href}>{article.title}</Link></h3>
        {!small && <p className={s.cardLede}>{article.lede}</p>}
        <div className={s.cardFoot}>
          <span><Icon name="clock" size={15} /> {article.readMinutes} min read</span>
          <Link href={href} className={s.more} aria-label={`Read more: ${article.title}`}>Read <Icon name="arrow" size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
