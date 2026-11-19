import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import PostingHub from "@/components/posting/PostingHub";
import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/dang-tin",
  title: "Đăng tìm xe hoặc đăng xe trống | TXE PRO",
  description: "Chọn đăng nhu cầu tìm xe hoặc đăng xe trống theo tuyến. TXE PRO giúp khách hàng và tài xế kết nối đúng hành trình.",
});

export default function Page() {
  return <><Header /><PostingHub /><Footer /></>;
}
