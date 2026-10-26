"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { newsPlainText, type NewsArticle, type NewsCategory } from "@/lib/news-content";
import { newsImageSource } from "@/lib/news-public";
import styles from "./News.module.css";

export function newsCategoryLabel(category: NewsCategory, language: string) {
  const labels = {
    news: ["Tin tức", "News", "资讯"], guide: ["Hướng dẫn", "Guides", "指南"],
    community: ["Cộng đồng", "Community", "社区"], promotion: ["Ưu đãi", "Offers", "优惠"],
    product: ["Sản phẩm", "Product", "产品"],
  };
  return labels[category][language === "en" ? 1 : language === "zh" ? 2 : 0];
}

export function NewsCover({ source, alt, priority = false, sizes = "(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 600px" }: { source: string; alt: string; priority?: boolean; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? "/splash1.png" : newsImageSource(source);
  return <div className={styles.cover}>
    {src.startsWith("/") ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailed(true)} /> :
      /* Remote CMS media loads in the browser; do not give arbitrary URLs to the server image optimizer. */
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
  </div>;
}

export default function NewsCard({ article, featured = false, horizontal = false, priority = false }: {
  article: NewsArticle; featured?: boolean; horizontal?: boolean; priority?: boolean;
}) {
  const { language } = useLanguage();
  const label = language === "en" ? "Read article" : language === "zh" ? "阅读全文" : "Đọc bài viết";
  const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(language === "en" ? "en-GB" : language === "zh" ? "zh-CN" : "vi-VN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }) : null;
  return <Link href={"/tin-tuc/" + article.id} className={[styles.card, featured && styles.featured, horizontal && styles.horizontal].filter(Boolean).join(" ")}>
    <NewsCover key={article.imageUrl} source={article.imageUrl} alt={article.title} priority={priority} />
    <div className={styles.cardBody}>
      <div className={styles.meta}><span>{newsCategoryLabel(article.category, language)}</span>{date && <time dateTime={article.publishedAt!}>{date}</time>}</div>
      <h3>{article.title}</h3>
      <p>{newsPlainText(article.summary)}</p>
      <span className={styles.read}>{label}<ArrowUpRight size={17} /></span>
    </div>
  </Link>;
}
