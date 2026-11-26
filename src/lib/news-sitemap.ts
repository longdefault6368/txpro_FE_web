import type { NewsArticle, NewsAudience } from "./news-content";
import { getEditorialArticles } from "./news-content";
import { getPublicNews } from "./news-public";
import { newsSitemapPath } from "./news-seo";
import { ROUTE_SLUGS } from "./routes-data";
import { SERVICE_SLUGS } from "./services-data";

const PUBLIC_PAGES = [
  "/",
  "/dich-vu",
  ...SERVICE_SLUGS.map((slug) => "/dich-vu/" + slug),
  "/tai-xe",
  "/tuyen-duong",
  ...ROUTE_SLUGS.map((slug) => "/tuyen-duong/" + slug),
  "/tin-tuc",
  "/tro-giup",
  "/dang-tin",
  "/tracking",
  "/chu-hang/form-tao-don",
  "/tai-xe/dang-tin",
  "/tuyen-dung",
  "/thong-tin/lien-he",
  "/thong-tin/gioi-thieu",
  "/thong-tin/quy-che-hoat-dong",
  "/thong-tin/huong-dan-chu-hang",
  "/thong-tin/huong-dan-tai-xe",
  "/thong-tin/thanh-toan-ky-quy",
  "/thong-tin/khieu-nai-boi-thuong",
  "/thong-tin/dieu-khoan-su-dung",
  "/thong-tin/chinh-sach-bao-mat",
];

const SITEMAP_AUDIENCES: (NewsAudience | undefined)[] = [undefined, "driver", "shipper"];

export async function buildNewsSitemap(origin: string | null, read = getPublicNews) {
  if (!origin) return [];
  const entries = new Map<string, string | undefined>();
  for (const path of PUBLIC_PAGES) entries.set(path, undefined);

  const add = (article: NewsArticle) => {
    const path = newsSitemapPath(article);
    if (!path) return;
    const lastMod = article.updatedAt || article.publishedAt || undefined;
    if (entries.has(path)) {
      if (lastMod && !entries.get(path)) entries.set(path, lastMod);
      return;
    }
    if (entries.size < 50000) entries.set(path, lastMod);
  };

  for (const article of getEditorialArticles()) add(article);

  // Query default ('all') plus driver and shipper audiences so audience-targeted web articles are never omitted.
  for (const audience of SITEMAP_AUDIENCES) {
    for (let page = 1; entries.size < 49990; page++) {
      try {
        const result = await read({ page, limit: 24, ...(audience ? { audience } : {}) });
        for (const article of result.items) add(article);
        if (page >= result.pagination.totalPages || result.items.length === 0) break;
      } catch { break; } // Available editorial guides remain discoverable if CMS is down.
    }
  }

  return Array.from(entries, ([path, lastModified]) => ({
    url: origin + path,
    ...(lastModified ? { lastModified } : {}),
  }));
}
