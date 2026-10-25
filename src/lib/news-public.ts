import { API_BASE, API_BASE_URL } from "@/config/env";
import type { NewsArticle, NewsCategory } from "./news-content";

export class NewsRequestError extends Error {
  constructor(public status: number) { super("News request failed"); }
}
export type NewsPage = { items: NewsArticle[]; pagination: { page: number; totalPages: number; total: number } };
const categories = ["news", "guide", "community", "promotion", "product"];

export function normalizeNews(value: unknown): NewsArticle | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !/^[a-f\d]{24}$/i.test(item.id) ||
      typeof item.title !== "string" || !item.title.trim() || item.published === false) return null;
  if (typeof item.audience === "string" && item.audience !== "all") return null;
  const date = typeof item.publishedAt === "string" ? Date.parse(item.publishedAt) : NaN;
  if (Number.isFinite(date) && date > Date.now()) return null;
  return {
    id: item.id, title: item.title.trim(),
    summary: typeof item.summary === "string" ? item.summary : "",
    content: typeof item.content === "string" ? item.content : "",
    category: categories.includes(String(item.category)) ? item.category as NewsCategory : "news",
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
    publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null,
  };
}

export function newsImageSource(value: string): string {
  const src = value.trim();
  if (/^\/images\/(?:news|home|vehicles)\/[\w.-]+\.(?:png|jpg|jpeg|webp)$/i.test(src) || src === "/splash1.png") return src;
  if (/^\/?uploads\//.test(src)) return API_BASE_URL + "/" + src.replace(/^\/+/, "");
  try {
    const url = new URL(src);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Missing or unsupported media uses a bundled image. */ }
  return "/splash1.png";
}

async function read(path: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 6000);
  try {
    const response = await fetch(API_BASE + "/public/news" + path, {
      signal: controller.signal, credentials: "omit", cache: "no-store",
    });
    if (!response.ok) throw new NewsRequestError(response.status);
    const json = await response.json();
    if (json.success === false || !json.data) throw new NewsRequestError(502);
    return json.data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function getPublicNews({ page = 1, limit = 12, category = "all", search = "", signal }: {
  page?: number; limit?: number; category?: string; search?: string; signal?: AbortSignal;
} = {}): Promise<NewsPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category !== "all") params.set("category", category);
  if (search.trim()) params.set("search", search.trim().slice(0, 120));
  const data = await read("?" + params, signal);
  if (!Array.isArray(data.items) || !data.pagination || !Number.isInteger(data.pagination.totalPages)) throw new NewsRequestError(502);
  const seen = new Set<string>();
  const items = data.items.map(normalizeNews).filter((item: NewsArticle | null): item is NewsArticle => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return { items, pagination: data.pagination };
}

export async function getPublicNewsArticle(id: string): Promise<NewsArticle> {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new NewsRequestError(404);
  const item = normalizeNews(await read("/" + id));
  if (!item) throw new NewsRequestError(404);
  return item;
}
