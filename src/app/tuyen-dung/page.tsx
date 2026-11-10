import type { Metadata } from "next";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import CareersPage from "@/components/careers/CareersPage";

export const metadata: Metadata = {
  title: "Tuyển dụng | TXE PRO",
  description: "Các vị trí đang tuyển tại TXE PRO: chăm sóc khách hàng, kinh doanh đối tác, điều phối vận hành và kỹ sư phần mềm.",
};

export default function Page() {
  return <><Header /><CareersPage /><Footer /></>;
}
