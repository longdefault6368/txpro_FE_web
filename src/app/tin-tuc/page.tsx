import type { Metadata } from "next";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NewsFeed from "@/components/news/NewsFeed";

export const metadata: Metadata = {
  title: "Tin tức & cẩm nang | TXE PRO",
  description: "Thông tin từ TXE PRO, hướng dẫn tìm xe, đăng xe trống và chuẩn bị hành trình.",
};
export default function NewsPage() {
  return <><Header /><main><NewsFeed /></main><Footer /></>;
}
