import type { NewsArticle } from "./news-content";
import { getEditorialArticles } from "./news-content";
import { getPublicNews } from "./news-public";
import { newsSitemapPath } from "./news-seo";

const PUBLIC_PAGES = ["/", "/tin-tuc", "/tro-giup", "/dang-tin", "/login", "/register", "/tracking",
  "/chu-hang/form-tao-don", "/tai-xe/dang-tin", "/tuyen-dung",
  "/thong-tin/lien-he", "/thong-tin/gioi-thieu", "/thong-tin/huong-dan-chu-hang",
  "/thong-tin/huong-dan-tai-xe", "/thong-tin/thanh-toan-ky-quy",
  "/thong-tin/khieu-nai-boi-thuong", "/thong-tin/dieu-khoan-su-dung",
  "/thong-tin/chinh-sach-bao-mat"];

export async function buildNewsSitemap(origin: string | null, read = getPublicNews) {
  if (!origin) return [];
  const paths = new Set<string>(PUBLIC_PAGES);
  const add = (article: NewsArticle) => {
    const path = newsSitemapPath(article);
    if (path && paths.size < 50000) paths.add(path);
  };
  for (const article of getEditorialArticles()) add(article);
  // A sitemap holds at most 50,000 URLs; leave room for public website pages.
  for (let page = 1; paths.size < 49990; page++) {
    try {
      const result = await read({ page, limit: 24 });
      for (const article of result.items) add(article);
      if (page >= result.pagination.totalPages || result.items.length === 0) break;
    } catch { break; } // Available editorial guides remain discoverable if CMS is down.
  }
  return Array.from(paths, path => ({ url: origin + path }));
}
