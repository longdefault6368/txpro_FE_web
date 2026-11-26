import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/thong-tin/chinh-sach-bao-mat",
  title: "Chính sách bảo mật | TXE PRO",
  description: "Cách TXE PRO xử lý thông tin tài khoản, chuyến đi và vị trí khi khách hàng hoặc tài xế sử dụng website.",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Chính sách bảo mật", path: "/thong-tin/chinh-sach-bao-mat" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      {children}
    </>
  );
}
