import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NewsArticleView from "@/components/news/NewsArticle";
import { getEditorialArticles } from "@/lib/news-content";
import { articleMetadata, articleStructuredData, safeStructuredJson, newsPath } from "@/lib/news-seo";
import { getNewsSiteOrigin } from "@/lib/news-site";
import { getPublicNewsArticle, NewsRequestError } from "@/lib/news-public";

export const dynamic = "force-dynamic";
const getArticle = cache(async (id: string) => {
  const editorial = getEditorialArticles().find(item => item.id === id);
  if (editorial) return { article: editorial, editorialId: id };
  try { return { article: await getPublicNewsArticle(id) }; }
  catch (error) {
    if (error instanceof NewsRequestError && error.status === 404) return null;
    return { unavailable: true as const };
  }
});
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getArticle((await params).id);
  if (!result || !("article" in result) || !result.article) return { title: "Tin tức | TXE PRO", robots: { index: false } };
  return articleMetadata(result.article, await getNewsSiteOrigin());
}
export default async function ArticlePage({ params }: Props) {
  const result = await getArticle((await params).id);
  if (!result) notFound();
  const origin = await getNewsSiteOrigin();
  const article = "article" in result ? result.article : undefined;
  const breadcrumb = article && origin ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Trang chủ", item: origin },
    { "@type": "ListItem", position: 2, name: "Tin tức", item: origin + "/tin-tuc" },
    { "@type": "ListItem", position: 3, name: article.title, item: origin + newsPath(article.id) },
  ] } : null;
  return <><Header />
    {article && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(articleStructuredData(article, origin)) }} />}
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(breadcrumb) }} />}
    <NewsArticleView {...result} /><Footer /></>;
}
