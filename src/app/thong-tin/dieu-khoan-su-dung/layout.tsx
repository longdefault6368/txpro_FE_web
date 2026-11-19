import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/thong-tin/dieu-khoan-su-dung",
  title: "Điều khoản sử dụng | TXE PRO",
  description: "Điều khoản áp dụng khi khách hàng và tài xế đăng nhu cầu, nhận chuyến và sử dụng tài khoản TXE PRO.",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
