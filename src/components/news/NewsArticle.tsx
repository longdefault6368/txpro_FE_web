"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Link as LinkIcon, Check, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getEditorialArticles, newsPlainText, type NewsArticle } from "@/lib/news-content";
import NewsCard, { NewsCover, newsCategoryLabel } from "./NewsCard";
import EditorialBody from "./EditorialBody";
import styles from "./News.module.css";

export default function NewsArticleView({ article: remote, editorialId, unavailable = false }: {
  article?: NewsArticle; editorialId?: string; unavailable?: boolean;
}) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const editorial = getEditorialArticles(language);
  const article = editorialId ? editorial.find(item => item.id === editorialId) : remote;
  if (unavailable || !article) return <main className={styles.articlePage}><div className={styles.empty}><BookOpen size={36} /><h1>{c("Chưa tải được bài viết", "This article could not be loaded", "暂时无法加载文章")}</h1><p>{c("Vui lòng thử tải lại trang hoặc đọc cẩm nang khác.", "Please reload the page or explore another guide.", "请刷新页面，或阅读其他指南。")}</p><Link href="/tin-tuc">{c("Về trang tin tức", "Back to articles", "返回资讯")}<ArrowUpRight size={18} /></Link></div></main>;
  const content = newsPlainText(article.content || article.summary);
  const blocks = content.split(/\n\s*\n/).filter(Boolean);
  const words = content.split(/\s+/).length;
  const han = content.match(/[\u3400-\u9fff]/g)?.length || 0;
  const minutes = Math.max(1, Math.ceil(han > words ? han / 350 : words / 220));
  const headings = article.readingGuide ? article.readingGuide.sections.map((section, index) => ({ index, title: section.heading })) :
    blocks.flatMap((block, index) => block.startsWith("## ") ? [{ index, title: block.slice(3) }] : []);
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopyState("copied"); }
    catch { setCopyState("failed"); }
  }
  return <main className={styles.articlePage}>
    <nav className={styles.breadcrumb} aria-label={c("Đường dẫn", "Breadcrumb", "面包屑导航")}><Link href="/">{c("Trang chủ", "Home", "首页")}</Link><span>/</span><Link href="/tin-tuc">{c("Tin tức", "Articles", "资讯")}</Link></nav>
    <article>
      <header className={styles.articleHeader}>
        <span className={styles.category}>{newsCategoryLabel(article.category, language)}</span>
        <h1>{article.title}</h1><p className={styles.lead}>{newsPlainText(article.summary)}</p>
        <div className={styles.articleMeta}>
          <span>TXE PRO</span><span>·</span><span>{c("Khoảng " + minutes + " phút đọc", "About " + minutes + " min read", "约 " + minutes + " 分钟阅读")}</span>
          {article.publishedAt && <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString(language === "en" ? "en-GB" : language === "zh" ? "zh-CN" : "vi-VN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })}</time>}
          <button type="button" onClick={copyLink}>{copyState === "copied" ? <Check size={16} /> : <LinkIcon size={16} />}{copyState === "copied" ? c("Đã sao chép", "Copied", "已复制") : c("Sao chép liên kết", "Copy link", "复制链接")}</button>
        </div>
        <span className={styles.copyStatus} role="status">{copyState === "failed" && c("Không thể sao chép tự động. Bạn có thể sao chép địa chỉ trên trình duyệt.", "Copy the address from your browser's address bar instead.", "请从浏览器地址栏复制链接。")}</span>
      </header>
      <figure className={styles.articleCover}><NewsCover key={article.imageUrl} source={article.imageUrl} alt={article.title} sizes="(max-width: 1200px) 100vw, 1152px" priority /></figure>
      <div className={styles.articleLayout}>
        <div className={styles.body}>
          {(!article.editorial || article.originalLanguage === "vi") && language !== "vi" && <p className={styles.notice}>{c("", "This article is displayed in its original language.", "本文以原文语言显示。")}</p>}
          {article.readingGuide ? <EditorialBody guide={article.readingGuide} /> :
            blocks.map((block, index) => block.startsWith("## ") ? <h2 id={"phan-" + index} key={index}>{block.slice(3)}</h2> : <p key={index}>{block}</p>)}
          <div className={styles.articleActions}><Link href="/tin-tuc"><ArrowLeft size={17} />{c("Tất cả bài viết", "All articles", "全部文章")}</Link><Link href="/dang-tin">{c("Bắt đầu với TXE PRO", "Get started with TXE PRO", "开始使用 TXE PRO")}<ArrowUpRight size={17} /></Link></div>
        </div>
        <aside className={styles.aside}>
          <span><BookOpen size={19} />{c("Trong bài viết này", "In this article", "本文内容")}</span>
          {headings.length ? headings.map(item => <a key={item.index} href={"#phan-" + item.index}>{item.title}</a>) : <p>{c("Thông tin từ TXE PRO dành cho hành trình của bạn.", "Information from TXE PRO for your journey.", "来自 TXE PRO 的行程信息。")}</p>}
          <Link href="/tro-giup">{c("Cần trợ giúp?", "Need help?", "需要帮助？")}<ArrowUpRight size={17} /></Link>
        </aside>
      </div>
    </article>
    <section className={styles.related}><div className={styles.heading}><div><span className={styles.eyebrow}>{c("Đọc tiếp", "Keep exploring", "继续阅读")}</span><h2>{c("Thêm góc nhìn cho hành trình", "More for your next journey", "更多旅程指南")}</h2></div></div><div className={styles.grid}>{editorial.filter(item => item.id !== article.id).slice(0, 3).map(item => <NewsCard key={item.id} article={item} />)}</div></section>
  </main>;
}
