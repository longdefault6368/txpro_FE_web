import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import PostingHub from "@/components/posting/PostingHub";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/dang-tin",
  title: "Đăng tìm xe hoặc đăng xe trống | TXE PRO",
  description: "Chọn đăng nhu cầu tìm xe hoặc đăng xe trống theo tuyến. TXE PRO giúp khách hàng và tài xế kết nối đúng hành trình.",
});

export default function Page() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Đăng tìm xe hoặc xe trống", path: "/dang-tin" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <Header />
      <PostingHub />
      <Footer />
    </>
  );
}
