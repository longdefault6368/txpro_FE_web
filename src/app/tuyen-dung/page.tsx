import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import CareersPage from "@/components/careers/CareersPage";
import { CAREER_JOBS } from "@/lib/careers-data";
import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  jobPostingsStructuredData,
  loadIndexableCompany,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tuyen-dung",
  title: "Tuyển dụng TXE PRO",
  description: "Xem các vị trí đang tuyển tại TXE PRO: kinh doanh phát triển khách hàng & tài xế online (lương cứng 2 triệu + thưởng mốc), marketing, chăm sóc khách hàng, điều phối và kỹ sư phần mềm.",
});

export default async function Page() {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const company = await loadIndexableCompany();
  const jobPostings = jobPostingsStructuredData(origin, CAREER_JOBS, company);
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Tuyển dụng TXE PRO", path: "/tuyen-dung" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(jobPostings) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      <Header />
      <CareersPage />
      <Footer />
    </>
  );
}
