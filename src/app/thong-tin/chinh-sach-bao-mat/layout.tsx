import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/thong-tin/chinh-sach-bao-mat",
  title: "Chính sách bảo mật | TXE PRO",
  description: "Cách TXE PRO xử lý thông tin tài khoản, chuyến đi và vị trí khi khách hàng hoặc tài xế sử dụng website.",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
