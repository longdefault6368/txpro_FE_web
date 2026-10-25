import type { Metadata } from "next";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import PostingHub from "@/components/posting/PostingHub";

export const metadata: Metadata = {
  title: "Đăng tìm xe & đăng xe trống | TXE PRO",
  description: "Chọn đăng tìm xe hoặc đăng xe trống trên TXE PRO. Sử dụng tài khoản ứng dụng để quản lý tin đăng và hành trình ngay trên website.",
};

export default function Page() {
  return <><Header /><PostingHub /><Footer /></>;
}
