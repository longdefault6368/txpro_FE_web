"use client";
import Header from "@/components/common/Header";
import { useLanguage } from "@/context/LanguageContext";
import { NewsSkeleton } from "@/components/news/NewsFeed";
import styles from "@/components/news/News.module.css";

export default function LoadingArticle() {
  const { language } = useLanguage();
  const label = language === "en" ? "Loading article" : language === "zh" ? "正在加载文章" : "Đang tải bài viết";
  return <><Header /><main className={styles.articlePage} aria-busy="true" aria-label={label}><span className={styles.srOnly} role="status">{label}</span><NewsSkeleton /></main></>;
}
