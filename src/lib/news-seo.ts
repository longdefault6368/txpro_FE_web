import type { Metadata } from "next";
import type { NewsArticle, NewsCategory } from "./news-content";
import { newsPlainText } from "./news-content";
import { newsImageSource } from "./news-public";

const ARTICLE_SECTIONS: Record<NewsCategory, string> = {
  guide: "Cẩm nang vận chuyển",
  news: "Tin tức TXE PRO",
  community: "Cộng đồng TXE PRO",
  promotion: "Ưu đãi TXE PRO",
  product: "Sản phẩm TXE PRO",
};

export function siteOrigin(value: string | undefined): string | null {
  try {
    const url = new URL(value || "");
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch { return null; }
}
export const newsPath = (id: string) => "/tin-tuc/" + encodeURIComponent(id);
export const isOpaqueNewsKey = (value: string) => /^[a-f\d]{24}$/i.test(value);
export const newsHref = (article: Pick<NewsArticle, "id"> & { slug?: string | null }) =>
  newsPath(article.slug || article.id);
export const newsSitemapPath = (article: Pick<NewsArticle, "id"> & { slug?: string | null }) => {
  const key = article.slug || article.id;
  return isOpaqueNewsKey(key) ? null : newsPath(key);
};
export function articleSectionLabel(category: NewsCategory): string {
  return ARTICLE_SECTIONS[category] || ARTICLE_SECTIONS.news;
}
function trimAtWord(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, maxLength);
  const boundary = sliced.lastIndexOf(" ");
  return (boundary > maxLength * 0.6 ? sliced.slice(0, boundary) : sliced).trim();
}
export function articleDescription(article: Pick<NewsArticle, "summary" | "content">): string {
  const summary = newsPlainText(article.summary || "").replace(/\s+/g, " ").trim();
  if (summary) return trimAtWord(summary, 165);
  const fallback = newsPlainText(article.content || "")
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return trimAtWord(fallback, 160);
}
export function articleMetadata(article: NewsArticle, origin: string | null): Metadata {
  const cleanTitle = newsPlainText(article.title);
  const title = /TXE\s*PRO\s*$/i.test(cleanTitle) ? cleanTitle : cleanTitle + " | TXE PRO";
  const description = articleDescription(article);
  const image = newsImageSource(article.imageUrl);
  const images = origin ? [{ url: new URL(image, origin).href, alt: cleanTitle }] : [];
  const canonicalPath = article.canonicalSlug ? newsPath(article.canonicalSlug) : newsHref(article);
  const url = origin ? origin + canonicalPath : undefined;
  const section = articleSectionLabel(article.category);
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: "article",
      locale: "vi_VN",
      siteName: "TXE PRO",
      title,
      description,
      url,
      images,
      section,
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      ...(origin ? { authors: [origin] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: images.map(item => item.url) },
  };
}
export function articleStructuredData(article: NewsArticle, origin: string | null) {
  const cleanTitle = newsPlainText(article.title);
  const plainBody = newsPlainText(article.content || article.summary || "");
  const wordCount = plainBody ? plainBody.split(/\s+/).length : 0;
  const dateModified = article.updatedAt || article.publishedAt || undefined;
  const canonicalPath = article.canonicalSlug ? newsPath(article.canonicalSlug) : newsHref(article);
  return {
    "@context": "https://schema.org",
    "@type": article.category === "news" ? "NewsArticle" : "Article",
    headline: trimAtWord(cleanTitle, 110),
    description: articleDescription(article),
    inLanguage: "vi",
    ...(wordCount > 0 ? { wordCount } : {}),
    ...(origin ? { mainEntityOfPage: origin + canonicalPath, image: [new URL(newsImageSource(article.imageUrl), origin).href] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: { "@type": "Organization", name: "TXE PRO", ...(origin ? { url: origin } : {}) },
    publisher: {
      "@type": "Organization",
      name: "TXE PRO",
      ...(origin ? { url: origin, logo: { "@type": "ImageObject", url: origin + "/logo-mark.webp" } } : {}),
    },
    articleSection: articleSectionLabel(article.category),
  };
}
export function newsCollectionData(articles: NewsArticle[], origin: string | null, name = "Tin tức & cẩm nang vận chuyển TXE PRO") {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(origin ? { url: origin + "/tin-tuc" } : {}),
    inLanguage: "vi",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: newsPlainText(article.title),
        ...(origin ? { url: origin + newsHref(article) } : {}),
      })),
    },
  };
}
export function safeStructuredJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
