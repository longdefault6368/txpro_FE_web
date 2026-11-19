import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/thong-tin/lien-he",
  title: "Liên hệ TXE PRO",
  description: "Liên hệ tổng đài và gửi yêu cầu hỗ trợ về tìm xe, đăng xe trống, chuyến đi hoặc tài khoản TXE PRO.",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
