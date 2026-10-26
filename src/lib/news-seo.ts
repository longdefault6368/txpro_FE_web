import type { Metadata } from "next";
import type { NewsArticle } from "./news-content";
import { newsPlainText } from "./news-content";
import { newsImageSource } from "./news-public";

export function siteOrigin(value: string | undefined): string | null {
  try {
    const url = new URL(value || "");
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch { return null; }
}
export const newsPath = (id: string) => "/tin-tuc/" + encodeURIComponent(id);
export function articleMetadata(article: NewsArticle, origin: string | null): Metadata {
  const title = newsPlainText(article.title) + " | TXE PRO";
  const description = newsPlainText(article.summary).replace(/\s+/g, " ").slice(0, 165);
  const image = newsImageSource(article.imageUrl);
  const images = origin ? [{ url: new URL(image, origin).href, alt: newsPlainText(article.title) }] : [];
  const url = origin ? origin + newsPath(article.id) : undefined;
  return { title, description, alternates: url ? { canonical: url } : undefined,
    openGraph: { type: "article", locale: "vi_VN", siteName: "TXE PRO", title, description, url, images,
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}) },
    twitter: { card: "summary_large_image", title, description, images: images.map(item => item.url) },
  };
}
export function articleStructuredData(article: NewsArticle, origin: string | null) {
  return { "@context": "https://schema.org", "@type": "Article", headline: newsPlainText(article.title),
    description: newsPlainText(article.summary), inLanguage: "vi",
    ...(origin ? { mainEntityOfPage: origin + newsPath(article.id), image: [new URL(newsImageSource(article.imageUrl), origin).href] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    author: { "@type": "Organization", name: "TXE PRO" },
    publisher: { "@type": "Organization", name: "TXE PRO", ...(origin ? { url: origin } : {}) },
    articleSection: article.category === "guide" ? "Cẩm nang vận chuyển" : "Tin tức TXE PRO",
  };
}
export function newsCollectionData(articles: NewsArticle[], origin: string | null) {
  return { "@context": "https://schema.org", "@type": "CollectionPage", name: "Tin tức & cẩm nang vận chuyển TXE PRO",
    ...(origin ? { url: origin + "/tin-tuc" } : {}), inLanguage: "vi",
    mainEntity: { "@type": "ItemList", itemListElement: articles.map((article, index) => ({
      "@type": "ListItem", position: index + 1, name: newsPlainText(article.title),
      ...(origin ? { url: origin + newsPath(article.id) } : {}),
    })) },
  };
}
export function safeStructuredJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
