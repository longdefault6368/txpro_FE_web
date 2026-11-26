import { siteOrigin } from "@/lib/news-seo";
import {
  breadcrumbStructuredData,
  publicPageMetadata,
  resolveMetadataOrigin,
  structuredDataScript,
} from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/thong-tin/dieu-khoan-su-dung",
  title: "Điều khoản sử dụng | TXE PRO",
  description: "Điều khoản áp dụng khi khách hàng và tài xế đăng nhu cầu, nhận chuyến và sử dụng tài khoản TXE PRO.",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  const origin = resolveMetadataOrigin(siteOrigin(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL));
  const breadcrumb = breadcrumbStructuredData(origin, [
    { name: "Trang chủ", path: "/" },
    { name: "Điều khoản sử dụng", path: "/thong-tin/dieu-khoan-su-dung" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataScript(breadcrumb) }} />
      {children}
    </>
  );
}
