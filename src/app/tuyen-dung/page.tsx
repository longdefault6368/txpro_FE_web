import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import CareersPage from "@/components/careers/CareersPage";
import { publicPageMetadata } from "@/lib/site-seo";

export const metadata = publicPageMetadata({
  path: "/tuyen-dung",
  title: "Tuyển dụng TXE PRO",
  description: "Xem các vị trí đang tuyển tại TXE PRO: chăm sóc khách hàng, kinh doanh đối tác, điều phối vận hành và kỹ sư phần mềm.",
});

export default function Page() {
  return <><Header /><CareersPage /><Footer /></>;
}
