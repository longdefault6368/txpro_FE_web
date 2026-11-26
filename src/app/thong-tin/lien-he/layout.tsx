import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  contactPageStructuredData,
  loadIndexableCompany,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/thong-tin/lien-he",
  title: "Liên hệ TXE PRO",
  description: "Liên hệ tổng đài và gửi yêu cầu hỗ trợ về tìm xe, đăng xe trống, chuyến đi hoặc tài khoản TXE PRO.",
});

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const company = await loadIndexableCompany();
  const contactData = contactPageStructuredData(origin, company);
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Liên hệ TXE PRO", path: "/thong-tin/lien-he" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(contactData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      {children}
    </>
  );
}
