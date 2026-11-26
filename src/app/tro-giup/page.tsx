import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import HelpCenter from "@/components/help/HelpCenter";
import { getHelpArticles } from "@/lib/help-content";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  faqStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tro-giup",
  title: "Hướng dẫn dùng TXE PRO",
  description: "Tra cứu cách đăng nhu cầu tìm xe, đăng xe trống, theo dõi hành trình và xử lý sự cố trên TXE PRO.",
});

export default function Page() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const faq = faqStructuredData(getHelpArticles("vi"));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Hướng dẫn dùng TXE PRO", path: "/tro-giup" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <Header />
      <HelpCenter />
      <Footer />
    </>
  );
}
