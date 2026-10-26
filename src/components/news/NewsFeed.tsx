"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Newspaper, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getEditorialArticles, type NewsCategory } from "@/lib/news-content";
import { getPublicNews, type NewsPage } from "@/lib/news-public";
import { paginateNews, newsPageHref, filterEditorials } from "@/lib/news-pagination";
import NewsCard, { newsCategoryLabel } from "./NewsCard";
import styles from "./News.module.css";

export function NewsSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? styles.previewGrid : styles.grid} aria-hidden="true">
    {Array.from({ length: compact ? 4 : 9 }, (_, index) => <div className={styles.skeleton} key={index}><div /><span /><span /><span /></div>)}
  </div>;
}

export default function NewsFeed({ compact = false, initialData, initialPage = 1, initialCategory = "all", initialSearch = "" }: {
  compact?: boolean; initialData?: NewsPage | null; initialPage?: number; initialCategory?: NewsCategory | "all"; initialSearch?: string;
}) {
  const { language } = useLanguage();
  const c = (vi: string, en: string, zh: string) => language === "en" ? en : language === "zh" ? zh : vi;
  const [remote, setRemote] = useState<NewsPage | null>(initialData || null);
  const [loading, setLoading] = useState(initialData === undefined), [failed, setFailed] = useState(initialData === null);
  const [page, setPage] = useState(initialPage), [retry, setRetry] = useState(0);
  const hydrated = useRef(initialData !== undefined);
  const [category, setCategory] = useState<NewsCategory | "all">(initialCategory);
  const [draft, setDraft] = useState(initialSearch), [search, setSearch] = useState(initialSearch);
  useEffect(() => {
    if (hydrated.current) { hydrated.current = false; return; }
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    getPublicNews({ page, limit: compact ? 4 : 9, category, search, signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setRemote(result); })
      .catch(() => { if (!controller.signal.aborted) { setRemote(null); setFailed(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, compact, category, search, retry]);
  const editorial = filterEditorials(getEditorialArticles(language), category, search);
  const { items: articles, pagination: { totalPages: pages } } = paginateNews(remote, editorial, page, compact ? 4 : 9);
  const Heading = compact ? "h2" : "h1";
  return <section id="news" data-reveal={compact ? "" : undefined} className={compact ? styles.section : styles.listPage}>
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}><Newspaper size={17} />{c("Kết nối & sẻ chia", "Connect & discover", "连接与分享")}</span>
        <Heading>{c("Tin tức & cẩm nang vận chuyển", "News & transport guides", "资讯与运输指南")}</Heading>
        <p>{c("Tìm đúng xe. Chuẩn bị kỹ hơn. Khám phá những hướng dẫn thực tế dành cho chủ hàng và tài xế, từ lúc lên kế hoạch đến khi kết thúc chuyến đi.", "Find the right vehicle and prepare with confidence. Practical guides for shippers and drivers, from planning to the end of a journey.", "选择合适的车辆，做好出发准备。为货主和司机提供从计划到行程结束的实用指南。")}</p>
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
        articles.length ? compact ? <div className={styles.previewGrid}>{articles.map((article, index) => <NewsCard key={article.id} article={article} featured={index === 0} horizontal={index > 0} />)}</div> :
          <div className={styles.grid}>{articles.map((article, index) => <NewsCard key={article.id} article={article} priority={index === 0} />)}</div> :
          <div className={styles.empty}><Newspaper size={34} /><h2>{c("Chưa có bài viết phù hợp", "No matching articles", "暂无匹配文章")}</h2><p>{c("Thử từ khóa khác hoặc chọn Tất cả để xem thêm nội dung.", "Try a different keyword or select All to explore more.", "请尝试其他关键词，或选择全部。")}</p></div>}
    </div>
    {!compact && pages > 1 && <nav className={styles.pagination} aria-label={c("Phân trang tin tức", "Article pages", "文章分页")}>
      {page > 1 ? <Link href={newsPageHref(page - 1, category, search)}><ChevronLeft size={17} />{c("Trước", "Previous", "上一页")}</Link> : <button disabled><ChevronLeft size={17} />{c("Trước", "Previous", "上一页")}</button>}
      <span>{page} / {pages}</span>
      {page < pages ? <Link href={newsPageHref(page + 1, category, search)}>{c("Sau", "Next", "下一页")}<ChevronRight size={17} /></Link> : <button disabled>{c("Sau", "Next", "下一页")}<ChevronRight size={17} /></button>}
    </nav>}
  </section>;
}
