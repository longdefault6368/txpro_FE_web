import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tai-xe/dang-tin",
  title: "Đăng xe trống theo tuyến | TXE PRO",
  description: "Tài xế đăng lịch chạy, tuyến và giá đề xuất để khách hàng có nhu cầu phù hợp chủ động liên hệ.",
});

export default function DriverPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
