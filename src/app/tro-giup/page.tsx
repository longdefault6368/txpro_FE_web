import type { Metadata } from "next";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import HelpCenter from "@/components/help/HelpCenter";

export const metadata: Metadata = {
  title: "Trung tâm trợ giúp | TXE PRO",
  description: "Hướng dẫn tìm xe, đăng xe trống, quản lý chuyến, voucher, ký quỹ và xử lý sự cố trên TXE PRO. Tra cứu câu hỏi hoặc liên hệ hỗ trợ.",
};

export default function Page() {
  return <><Header /><HelpCenter /><Footer /></>;
}
