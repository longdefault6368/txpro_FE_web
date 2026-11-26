import type { Metadata } from "next";
import { cache } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NewsFeed from "@/components/news/NewsFeed";
import { getPublicNews } from "@/lib/news-public";
import { getEditorialArticles } from "@/lib/news-content";
import { newsCollectionData, safeStructuredJson } from "@/lib/news-seo";
import { breadcrumbStructuredData } from "@/lib/site-seo";
import { getNewsSiteOrigin } from "@/lib/news-site";
import { readNewsQuery, newsPageHref, filterEditorials, paginateNews } from "@/lib/news-pagination";
const NEWS_REVALIDATE_SECONDS = 300;
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const getInitialNews = cache((page: number, category: string, search: string, audience: string) =>
  getPublicNews({ page, limit: 9, category, search, audience, revalidate: NEWS_REVALIDATE_SECONDS }).catch(() => null));

function buildListingCopy(category: string, audience: string, page: number) {
  const sections: Record<string, { title: string; description: string }> = {
    guide: { title: "Cẩm nang tìm xe và vận chuyển", description: "Hướng dẫn chọn xe chở hàng, đóng gói và chuẩn bị chuyến đi trên TXE PRO." },
    news: { title: "Tin tức TXE PRO", description: "Tin mới về tìm xe, kết nối tài xế và theo dõi hành trình trên TXE PRO." },
    community: { title: "Cộng đồng khách hàng và tài xế", description: "Kinh nghiệm từ khách hàng và tài xế khi tìm xe, đăng xe trống và giao nhận." },
    promotion: { title: "Ưu đãi và thông báo TXE PRO", description: "Thông báo ưu đãi và chương trình dành cho khách hàng, tài xế trên TXE PRO." },
    product: { title: "Cập nhật sản phẩm TXE PRO", description: "Thay đổi tính năng tìm xe, đăng xe và theo dõi hành trình trên TXE PRO." },
  };
  const audiences: Record<string, { label: string; title: string; description: string }> = {
    driver: { label: "cho tài xế", title: "Tin tức & cẩm nang cho tài xế", description: "Hướng dẫn đăng xe trống, quản lý lịch xe và nhận chuyến trên TXE PRO." },
    shipper: { label: "cho khách hàng", title: "Tin tức & cẩm nang cho khách hàng", description: "Hướng dẫn tìm xe, chuẩn bị hàng và giao nhận trên TXE PRO." },
  };
  const section = category === "all" ? null : sections[category];
  const target = audience === "all" ? null : audiences[audience];
  const baseTitle = section && target
    ? `${section.title} ${target.label}`
    : section?.title || target?.title || "Tin tức & cẩm nang tìm xe, vận chuyển";
  const description = section && target
    ? `${section.description} ${target.description}`
    : section?.description || target?.description || "Cách chọn xe chở hàng, đăng xe trống, đóng gói nội thất và chuẩn bị chuyến đi. Cẩm nang thực tế dành cho chủ hàng và tài xế TXE PRO.";
  const pageSuffix = page > 1 ? " – Trang " + page : "";
  return {
    collectionName: baseTitle + pageSuffix,
    title: baseTitle + pageSuffix + " | TXE PRO",
    description,
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = readNewsQuery(await searchParams);
  const [initialData, origin] = await Promise.all([
    getInitialNews(query.page, query.category, query.search, query.audience),
    getNewsSiteOrigin(),
  ]);
  const editorial = filterEditorials(getEditorialArticles(), query.category, query.search, query.audience);
  const { pagination: { totalPages } } = paginateNews(initialData, editorial, query.page);
  const outOfRange = query.page > totalPages;
  const shouldIndex = !query.search && !outOfRange;
  const { title, description } = buildListingCopy(query.category, query.audience, query.page);
  const url = origin && shouldIndex ? origin + newsPageHref(query.page, query.category, "", query.audience) : undefined;
  const images = origin ? [{ url: origin + "/images/news/chon-xe-phu-hop.webp", width: 1400, height: 788, alt: "Cẩm nang tìm xe và vận chuyển TXE PRO" }] : [];
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    robots: shouldIndex
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: true },
    openGraph: { type: "website", locale: "vi_VN", siteName: "TXE PRO", title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images: images.map(image => image.url) },
  };
}
export default async function NewsPage({ searchParams }: Props) {
  const query = readNewsQuery(await searchParams);
  const [initialData, origin] = await Promise.all([getInitialNews(query.page, query.category, query.search, query.audience), getNewsSiteOrigin()]);
  const editorial = filterEditorials(getEditorialArticles(), query.category, query.search, query.audience);
  const { items: articles } = paginateNews(initialData, editorial, query.page);
  const { collectionName } = buildListingCopy(query.category, query.audience, query.page);
  const collection = newsCollectionData(articles, origin, collectionName);
  if (origin) collection.url = origin + newsPageHref(query.page, query.category, "", query.audience);
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Tin tức & cẩm nang", path: "/tin-tuc" },
  ]);
  return <><Header /><main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(collection) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredJson(breadcrumb) }} />
    <NewsFeed key={JSON.stringify(query)} initialData={initialData} initialPage={query.page} initialCategory={query.category} initialAudience={query.audience} initialSearch={query.search} />
  </main><Footer /></>;
}
