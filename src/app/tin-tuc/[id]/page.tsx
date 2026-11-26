import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NewsArticleView from "@/components/news/NewsArticle";
import { getEditorialArticles, newsPlainText, type NewsArticle } from "@/lib/news-content";
import { articleMetadata, articleStructuredData, isOpaqueNewsKey, safeStructuredJson, newsHref } from "@/lib/news-seo";
import { getNewsSiteOrigin } from "@/lib/news-site";
import { getPublicNews, getPublicNewsArticle, NewsRequestError } from "@/lib/news-public";

export const revalidate = 300;

function normalizeCompareText(value: string) {
  return newsPlainText(value)
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const getArticle = cache(async (id: string) => {
  const editorial = getEditorialArticles().find(item => item.id === id);
  if (editorial) {
    try {
      const remote = await getPublicNewsArticle(id, { revalidate });
      const contentEdited =
        normalizeCompareText(remote.content || "") !== "" &&
        normalizeCompareText(remote.content) !== normalizeCompareText(editorial.content);
      if (contentEdited) {
        return { article: { ...remote, editorial: false } };
      }
      const merged: NewsArticle = {
        ...editorial,
        title: remote.title || editorial.title,
        summary: remote.summary || editorial.summary,
        imageUrl: remote.imageUrl || editorial.imageUrl,
        publishedAt: remote.publishedAt || editorial.publishedAt,
        updatedAt: remote.updatedAt || editorial.updatedAt,
      };
      return { article: merged, editorialId: id };
    } catch {
      return { article: editorial, editorialId: id };
    }
  }
  try { return { article: await getPublicNewsArticle(id, { revalidate }) }; }
  catch (error) {
    if (error instanceof NewsRequestError && error.status === 404) return null;
    return { unavailable: true as const };
  }
});

async function getRelatedArticles(article: NewsArticle): Promise<NewsArticle[]> {
  const selfKeys = new Set([article.id, article.slug].filter(Boolean));
  const seen = new Set<string>(selfKeys as Set<string>);
  const results: NewsArticle[] = [];

  const pushUnique = (items: NewsArticle[]) => {
    for (const item of items) {
      const key = item.slug || item.id;
      if (seen.has(item.id) || (item.slug && seen.has(item.slug)) || seen.has(key)) continue;
      seen.add(item.id);
      if (item.slug) seen.add(item.slug);
      seen.add(key);
      results.push(item);
      if (results.length >= 3) break;
    }
  };

  try {
    const sameCategory = await getPublicNews({
      page: 1,
      limit: 6,
      category: article.category,
      audience: article.audience || "all",
      revalidate,
    });
    pushUnique(sameCategory.items);
  } catch { /* fallback to editorial below */ }

  if (results.length < 3) {
    try {
      const recent = await getPublicNews({ page: 1, limit: 6, revalidate });
      pushUnique(recent.items);
    } catch { /* fallback to editorial below */ }
  }

  if (results.length < 3) {
    const editorials = getEditorialArticles();
    const sameCat = editorials.filter(item => item.category === article.category);
    pushUnique(sameCat);
    if (results.length < 3) pushUnique(editorials);
  }

  return results;
}

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getArticle((await params).id);
  if (!result || !("article" in result) || !result.article) return { title: "Tin tức | TXE PRO", robots: { index: false } };
  return articleMetadata(result.article, await getNewsSiteOrigin());
}
export default async function ArticlePage({ params }: Props) {
  const rawId = (await params).id;
  const result = await getArticle(rawId);
  if (!result) notFound();
  const article = "article" in result ? result.article : undefined;
  if (article && isOpaqueNewsKey(rawId) && article.slug) {
    permanentRedirect(newsHref(article));
  }
  const [origin, relatedArticles] = await Promise.all([
    getNewsSiteOrigin(),
    article ? getRelatedArticles(article) : Promise.resolve([]),
  ]);
  const breadcrumb = article && origin ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Trang chủ", item: origin },
    { "@type": "ListItem", position: 2, name: "Tin tức", item: origin + "/tin-tuc" },
    { "@type": "ListItem", position: 3, name: article.title, item: origin + newsHref(article) },
  ] } : null;
  return <><Header />
    {article && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(articleStructuredData(article, origin)) }} />}
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(breadcrumb) }} />}
    <NewsArticleView {...result} relatedArticles={relatedArticles} /><Footer /></>;
}
