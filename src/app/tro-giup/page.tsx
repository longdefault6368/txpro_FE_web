import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import HelpCenter from "@/components/help/HelpCenter";
import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tro-giup",
  title: "Hướng dẫn dùng TXE PRO",
  description: "Tra cứu cách đăng nhu cầu tìm xe, đăng xe trống, theo dõi hành trình và xử lý sự cố trên TXE PRO.",
});

export default function Page() {
  return <><Header /><HelpCenter /><Footer /></>;
}
