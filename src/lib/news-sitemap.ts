import type { NewsArticle } from "./news-content";
import { getEditorialArticles } from "./news-content";
import { getPublicNews } from "./news-public";
import { newsPath } from "./news-seo";

export async function buildNewsSitemap(origin: string | null, read = getPublicNews) {
  if (!origin) return [];
  const articles = new Map<string, NewsArticle>(getEditorialArticles().map(item => [item.id, item]));
  // A sitemap holds at most 50,000 URLs; leave room for public website pages.
  for (let page = 1; articles.size < 49990; page++) {
    try {
      const result = await read({ page, limit: 24 });
      for (const article of result.items) if (articles.size < 49990) articles.set(article.id, article);
      if (page >= result.pagination.totalPages || result.items.length === 0) break;
    } catch { break; } // Available editorial guides remain discoverable if CMS is down.
  }
  return [
    ...["/", "/tin-tuc", "/tro-giup", "/dang-tin", "/thong-tin/lien-he"].map(path => ({ url: origin + path })),
    ...Array.from(articles.values(), article => ({ url: origin + newsPath(article.id) })),
  ];
}
