import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NewsArticleView from "@/components/news/NewsArticle";
import { getEditorialArticles, newsPlainText } from "@/lib/news-content";
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
  return { title: result.article.title + " | TXE PRO", description: newsPlainText(result.article.summary).slice(0, 170) };
}
export default async function ArticlePage({ params }: Props) {
  const result = await getArticle((await params).id);
  if (!result) notFound();
  return <><Header /><NewsArticleView {...result} /><Footer /></>;
}
