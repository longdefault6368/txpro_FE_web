"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import styles from "@/components/news/News.module.css";

export default function ArticleNotFound() {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  return <><Header /><main className={styles.articlePage}><div className={styles.empty}><h1>{c("Không tìm thấy bài viết", "Article not found", "未找到文章")}</h1><p>{c("Bài viết không tồn tại hoặc không còn được công khai.", "This article does not exist or is no longer public.", "该文章不存在或已停止公开。")}</p><Link href="/tin-tuc">{c("Về trang tin tức", "Back to articles", "返回资讯")}</Link></div></main><Footer /></>;
}
