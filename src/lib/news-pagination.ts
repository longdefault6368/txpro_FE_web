import type { NewsArticle, NewsAudience, NewsCategory } from "./news-content";
import type { NewsPage } from "./news-public";
export const NEWS_PAGE_SIZE = 9;
export function readNewsQuery(values: Record<string, string | string[] | undefined>) {
  const page = typeof values.page === "string" && /^\d{1,5}$/.test(values.page) ? Math.min(10000, Math.max(1, Number(values.page))) : 1;
  const category: NewsCategory | "all" = typeof values.category === "string" && ["news", "guide", "community", "promotion", "product"].includes(values.category) ? values.category as NewsCategory : "all";
  const audience: NewsAudience = typeof values.audience === "string" && ["driver", "shipper"].includes(values.audience) ? values.audience as NewsAudience : "all";
  return { page, category, audience, search: typeof values.search === "string" ? values.search.trim().slice(0, 120) : "" };
}
export function filterEditorials(articles: NewsArticle[], category: NewsCategory | "all", search: string, audience: NewsAudience = "all") {
  return articles.filter(item => (category === "all" || item.category === category) &&
    (audience === "all" || (item.audience || "all") === "all" || item.audience === audience) &&
    (item.title + " " + item.summary).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
}
export function paginateNews(remote: NewsPage | null, editorial: NewsArticle[], page = 1, pageSize = NEWS_PAGE_SIZE) {
  const safePage = Math.max(1, Math.floor(page));
  const remoteItems = remote?.items || [];
  const mirrored = remoteItems.some(item => item.slug && editorial.some(article => article.id === item.slug));
  const local = mirrored ? [] : editorial;
  const remoteTotal = remote && Number.isInteger(remote.pagination.total) ? Math.max(0, remote.pagination.total) : 0;
  const total = remoteTotal + local.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (safePage - 1) * pageSize;
  const localStart = Math.max(0, start - remoteTotal);
  const room = pageSize - remoteItems.length;
  return { items: [...remoteItems, ...local.slice(localStart, localStart + Math.max(0, room))].slice(0, pageSize),
    pagination: { page: safePage, totalPages, total } };
}
export function newsPageHref(page: number, category: NewsCategory | "all" = "all", search = "", audience: NewsAudience = "all") {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (category !== "all") params.set("category", category);
  if (audience !== "all") params.set("audience", audience);
  if (search.trim()) params.set("search", search.trim());
  return "/tin-tuc" + (params.size ? "?" + params.toString() : "");
}
