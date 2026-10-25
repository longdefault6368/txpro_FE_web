"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Newspaper, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getEditorialArticles, type NewsArticle, type NewsCategory } from "@/lib/news-content";
import { getPublicNews } from "@/lib/news-public";
import NewsCard, { newsCategoryLabel } from "./NewsCard";
import styles from "./News.module.css";

export function NewsSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? styles.previewGrid : styles.grid} aria-hidden="true">
    {Array.from({ length: compact ? 4 : 6 }, (_, index) => <div className={styles.skeleton} key={index}><div /><span /><span /><span /></div>)}
  </div>;
}

export default function NewsFeed({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1), [pages, setPages] = useState(1), [retry, setRetry] = useState(0);
  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [draft, setDraft] = useState(""), [search, setSearch] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    getPublicNews({ page, limit: compact ? 4 : 9, category, search, signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setItems(result.items); setPages(result.pagination.totalPages); } })
      .catch(() => { if (!controller.signal.aborted) { setItems([]); setPages(1); setFailed(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, compact, category, search, retry]);
  const editorial = getEditorialArticles(language).filter(item =>
    (category === "all" || item.category === category) &&
    (item.title + " " + item.summary).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const articles = [...items, ...(page === 1 ? editorial : [])].slice(0, compact ? 4 : undefined);
  const Heading = compact ? "h2" : "h1";
  return <section id="news" data-reveal={compact ? "" : undefined} className={compact ? styles.section : styles.listPage}>
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}><Newspaper size={17} />{c("Kết nối & sẻ chia", "Connect & discover", "连接与分享")}</span>
        <Heading>{c("Tin tức & cẩm nang", "News & insights", "资讯与指南")}</Heading>
        <p>{c("Thông tin từ TXE PRO và những gợi ý hữu ích cho mỗi hành trình.", "Updates from TXE PRO and useful ideas for every journey.", "来自 TXE PRO 的信息，以及每段旅程的实用建议。")}</p>
      </div>
      {compact && <Link href="/tin-tuc" className={styles.allLink}>{c("Tất cả bài viết", "All articles", "全部文章")}<ArrowUpRight size={19} /></Link>}
    </div>
    {!compact && <div className={styles.tools}>
      <form className={styles.search} onSubmit={event => { event.preventDefault(); setPage(1); setSearch(draft.trim()); }}>
        <Search size={19} /><input value={draft} maxLength={120} onChange={e => setDraft(e.target.value)} aria-label={c("Tìm bài viết", "Search articles", "搜索文章")} placeholder={c("Tìm nội dung bạn quan tâm…", "What would you like to read?", "搜索感兴趣的内容…")} />
        <button type="submit">{c("Tìm", "Search", "搜索")}</button>
      </form>
      <div className={styles.filters} role="group" aria-label={c("Chủ đề bài viết", "Article categories", "文章分类")}>
        {(["all", "news", "guide", "community", "product", "promotion"] as const).map(value => <button key={value} type="button" aria-pressed={value === category} onClick={() => { setCategory(value); setPage(1); }}>{value === "all" ? c("Tất cả", "All", "全部") : newsCategoryLabel(value, language)}</button>)}
      </div>
    </div>}
    {!compact && failed && <div className={styles.notice} role="status"><span>{c("Chưa tải được tin mới. Bạn vẫn có thể đọc các bài cẩm nang bên dưới.", "New updates are unavailable. You can still read the guides below.", "暂时无法加载最新资讯，您仍可阅读下方指南。")}</span><button type="button" onClick={() => setRetry(value => value + 1)}><RefreshCw size={16} />{c("Thử lại", "Retry", "重试")}</button></div>}
    <div aria-busy={loading} aria-label={c("Danh sách bài viết", "Articles", "文章列表")}>
      {loading ? <><span className={styles.srOnly} role="status">{c("Đang tải bài viết", "Loading articles", "正在加载文章")}</span><NewsSkeleton compact={compact} /></> :
        articles.length ? <div className={compact ? styles.previewGrid : styles.grid}>{articles.map((article, index) => <NewsCard key={article.id} article={article} featured={compact && index === 0} horizontal={compact && index > 0} />)}</div> :
          <div className={styles.empty}><Newspaper size={34} /><h2>{c("Chưa có bài viết phù hợp", "No matching articles", "暂无匹配文章")}</h2><p>{c("Thử từ khóa khác hoặc chọn Tất cả để xem thêm nội dung.", "Try a different keyword or select All to explore more.", "请尝试其他关键词，或选择全部。")}</p></div>}
    </div>
    {!compact && pages > 1 && <nav className={styles.pagination} aria-label={c("Phân trang tin tức", "Article pages", "文章分页")}>
      <button disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft size={17} />{c("Trước", "Previous", "上一页")}</button>
      <span>{page} / {pages}</span>
      <button disabled={loading || page >= pages} onClick={() => setPage(value => value + 1)}>{c("Sau", "Next", "下一页")}<ChevronRight size={17} /></button>
    </nav>}
    {!compact && !loading && <p className={styles.sourceNote}>{c("Bài tin từ quản trị viên được giữ nguyên ngôn ngữ biên soạn. Cẩm nang hỗ trợ Tiếng Việt, English và 中文.", "Published updates retain their original language. Guides are available in Vietnamese, English and Chinese.", "发布的资讯保留原文语言，指南支持越南语、英语和中文。")}</p>}
  </section>;
}
