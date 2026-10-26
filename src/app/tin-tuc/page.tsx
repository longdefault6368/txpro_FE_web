import type { Metadata } from "next";
import { cache } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NewsFeed from "@/components/news/NewsFeed";
import { getPublicNews } from "@/lib/news-public";
import { getEditorialArticles } from "@/lib/news-content";
import { newsCollectionData, safeStructuredJson } from "@/lib/news-seo";
import { getNewsSiteOrigin } from "@/lib/news-site";
import { readNewsQuery, newsPageHref, filterEditorials, paginateNews } from "@/lib/news-pagination";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const getInitialNews = cache((page: number, category: string, search: string) => getPublicNews({ page, limit: 9, category, search }).catch(() => null));
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = readNewsQuery(await searchParams);
  const origin = await getNewsSiteOrigin();
  const title = "Tin tức & cẩm nang tìm xe, vận chuyển" + (query.page > 1 ? " – Trang " + query.page : "") + " | TXE PRO";
  const description = "Cách chọn xe chở hàng, đăng xe trống, đóng gói nội thất và chuẩn bị chuyến đi. Cẩm nang thực tế dành cho chủ hàng và tài xế TXE PRO.";
  const url = origin ? origin + newsPageHref(query.page, query.category, query.search) : undefined;
  const images = origin ? [{ url: origin + "/images/news/chon-xe-phu-hop.webp", width: 1400, height: 788, alt: "Cẩm nang tìm xe và vận chuyển TXE PRO" }] : [];
  return { title, description, alternates: url ? { canonical: url } : undefined,
    robots: { index: !query.search && query.category === "all", follow: true },
    openGraph: { type: "website", locale: "vi_VN", siteName: "TXE PRO", title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images: images.map(image => image.url) } };
}
export default async function NewsPage({ searchParams }: Props) {
  const query = readNewsQuery(await searchParams);
  const [initialData, origin] = await Promise.all([getInitialNews(query.page, query.category, query.search), getNewsSiteOrigin()]);
  const editorial = filterEditorials(getEditorialArticles(), query.category, query.search);
  const { items: articles } = paginateNews(initialData, editorial, query.page);
  const collection = newsCollectionData(articles, origin);
  if (origin) collection.url = origin + newsPageHref(query.page, query.category, query.search);
  return <><Header /><main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(collection) }} />
    <NewsFeed key={JSON.stringify(query)} initialData={initialData} initialPage={query.page} initialCategory={query.category} initialSearch={query.search} />
  </main><Footer /></>;
}
